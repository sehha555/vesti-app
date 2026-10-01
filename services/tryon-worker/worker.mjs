// 試穿 worker：在桌機（有顯卡）上跑，定時去 tryon_jobs 拿等待中的工作，生圖後把結果存回 Storage
//
// 啟動（在 repo 根目錄）：node services/tryon-worker/worker.mjs
// 需要 apps/web/.env.local 有 NEXT_PUBLIC_SUPABASE_URL 與 SUPABASE_SERVICE_ROLE_KEY
// （service role 不受 RLS 限制，只放在桌機，不能進前端）
//
// 一次只做一件工作（顯卡一次只能跑一張）；啟動時把上次中斷、卡在 running 的工作放回排隊
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { GoogleGenAI } from '@google/genai';
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir, homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTryonPlan, extractPrompt, flatSize, FIT_INSTRUCTION } from './prompts.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const BUCKET = 'closet-images';
const POLL_MS = 10_000;
const PERSON = { w: 896, h: 1184 };
const GEN_SCRIPT = join(HERE, 'gen.ps1');
const WORK_DIR = join(tmpdir(), 'vesti-tryon');
// 版型描述只存在桌機本機（每件衣服問一次 Gemini）；刪掉這個資料夾就會重新問
const FIT_CACHE_DIR = join(homedir(), '.vesti-tryon-cache');

async function loadEnv() {
  const text = await readFile(join(HERE, '../../apps/web/.env.local'), 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...args) => console.log(new Date().toLocaleTimeString('zh-TW'), ...args);

// closet_items.image_url 存的是 signed URL，反推回 bucket 內路徑（同 apps/web/lib/closet/storage.ts）
function pathFromImageUrl(url) {
  try {
    const m = new URL(url).pathname.match(/\/closet-images\/(.+)$/);
    return m ? decodeURIComponent(m[1]) : url;
  } catch {
    return url;
  }
}

/** 跑一次 gen.ps1；prompt 寫成 UTF-8 BOM 檔再傳路徑，避免命令列中文編碼問題 */
async function generate({ prompt, refs, out, w, h }) {
  const promptFile = `${out}.txt`;
  await writeFile(promptFile, '﻿' + prompt, 'utf8');
  const q = (s) => `'${s.replace(/'/g, "''")}'`;
  const cmd =
    `& ${q(GEN_SCRIPT)} -PromptFile ${q(promptFile)} -Out ${q(out)} -W ${w} -H ${h}` +
    (refs.length ? ` -Refs @(${refs.map(q).join(',')})` : '');
  const output = await new Promise((resolve, reject) => {
    const child = spawn('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', cmd]);
    let text = '';
    child.stdout.on('data', (d) => (text += d));
    child.stderr.on('data', (d) => (text += d));
    child.on('error', reject);
    child.on('close', () => resolve(text));
  });
  try {
    return await readFile(out);
  } catch {
    throw new Error(`生圖失敗：${output.trim().slice(-300)}`);
  }
}

async function main() {
  await loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('apps/web/.env.local 缺 NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY');
  const db = createClient(url, key, { auth: { persistSession: false } });
  const storage = db.storage.from(BUCKET);

  const gemini = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;
  const geminiModel = process.env.GEMINI_MODEL || 'gemini-3.7-flash';

  /** 請 Gemini 看原始照片寫一句版型描述；失敗就回空字串（照樣生圖，只是版型比較不準） */
  async function describeFit(item, pngBuffer) {
    const cacheFile = join(FIT_CACHE_DIR, `${item.id}.txt`);
    try {
      return await readFile(cacheFile, 'utf8');
    } catch {
      // 還沒問過
    }
    if (!gemini) return '';
    try {
      const res = await gemini.models.generateContent({
        model: geminiModel,
        contents: [
          {
            role: 'user',
            parts: [{ inlineData: { data: pngBuffer.toString('base64'), mimeType: 'image/png' } }, { text: `這件是「${item.name}」。` }],
          },
        ],
        config: { systemInstruction: FIT_INSTRUCTION, temperature: 0.2 },
      });
      const fit = (res.text ?? '').replace(/\s+/g, ' ').trim().slice(0, 150);
      await mkdir(FIT_CACHE_DIR, { recursive: true });
      await writeFile(cacheFile, fit, 'utf8');
      log(`  版型：${item.name} → ${fit}`);
      return fit;
    } catch (err) {
      log(`  版型描述失敗（${item.name}）：${err.message}`);
      return '';
    }
  }

  async function download(path) {
    const { data, error } = await storage.download(path);
    if (error || !data) throw new Error(`下載失敗 ${path}：${error?.message ?? 'no data'}`);
    return Buffer.from(await data.arrayBuffer());
  }

  async function upload(path, buffer) {
    const { error } = await storage.upload(path, buffer, { contentType: 'image/png', upsert: true });
    if (error) throw new Error(`上傳失敗 ${path}：${error.message}`);
  }

  /** 平拍圖抽過就存在 {user}/flat/{item}.png，下次直接用 */
  async function ensureFlat(userId, item, slotKey, dir) {
    const flatPath = `${userId}/flat/${item.id}.png`;
    const local = join(dir, `flat-${item.id}.png`);
    try {
      await writeFile(local, await download(flatPath));
      return local;
    } catch {
      // 還沒抽過
    }
    log(`  抽平拍圖：${item.name}`);
    const buf = await generate({ prompt: extractPrompt(item), refs: [item.original], out: local, ...flatSize(slotKey) });
    await upload(flatPath, buf);
    return local;
  }

  async function runJob(job) {
    const dir = join(WORK_DIR, job.id);
    await mkdir(dir, { recursive: true });
    try {
      const ids = job.items.map((it) => it.itemId);
      const { data: rows, error } = await db.from('closet_items').select('id, name, image_url').in('id', ids);
      if (error) throw new Error(`讀衣服失敗：${error.message}`);
      const byId = new Map(rows.map((r) => [r.id, r]));
      const items = job.items
        .filter((it) => byId.get(it.itemId)?.image_url)
        .map((it) => ({ ...byId.get(it.itemId), slotKey: it.slotKey }));

      // 每件衣服的原始照片：抽平拍圖、寫版型描述、當下身版型參考都用它
      for (const it of items) {
        it.original = join(dir, `orig-${it.id}.png`);
        const png = await sharp(await download(pathFromImageUrl(it.image_url))).png().toBuffer();
        await writeFile(it.original, png);
        it.fit = await describeFit(it, png);
      }

      // 人物照縮放到生圖尺寸，不裁切，空白處補左上角的背景色
      const personRaw = await download(job.person_path);
      const { data: corner } = await sharp(personRaw).extract({ left: 0, top: 0, width: 1, height: 1 }).raw().toBuffer({ resolveWithObject: true });
      const person = join(dir, 'person.png');
      await sharp(personRaw)
        .rotate()
        .resize(PERSON.w, PERSON.h, { fit: 'contain', background: { r: corner[0], g: corner[1], b: corner[2] } })
        .png()
        .toFile(person);

      const { prompt, refs } = buildTryonPlan(items);
      const refFiles = [];
      for (const ref of refs) {
        if (ref.kind === 'person') refFiles.push(person);
        if (ref.kind === 'flat') {
          const it = items[ref.index];
          refFiles.push(await ensureFlat(job.user_id, it, it.slotKey, dir));
        }
        if (ref.kind === 'shape') refFiles.push(items[ref.index].original);
      }

      log(`  試穿：${items.map((it) => it.name).join('、')}`);
      const result = await generate({ prompt, refs: refFiles, out: join(dir, 'result.png'), ...PERSON });
      const resultPath = `${job.user_id}/tryon/${job.id}.png`;
      await upload(resultPath, result);
      await db
        .from('tryon_jobs')
        .update({ status: 'done', result_path: resultPath, error: null, updated_at: new Date().toISOString() })
        .eq('id', job.id);
      log(`完成 ${job.id}`);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }

  /** 拿最早的一件等待中工作；用 status=queued 當條件更新，避免同一件被拿兩次 */
  async function claim() {
    const { data: next } = await db
      .from('tryon_jobs')
      .select('id')
      .eq('status', 'queued')
      .order('created_at')
      .limit(1);
    if (!next?.length) return null;
    const { data } = await db
      .from('tryon_jobs')
      .update({ status: 'running', updated_at: new Date().toISOString() })
      .eq('id', next[0].id)
      .eq('status', 'queued')
      .select('*');
    return data?.[0] ?? null;
  }

  await db.from('tryon_jobs').update({ status: 'queued' }).eq('status', 'running');
  log('試穿 worker 啟動，等待工作…');

  for (;;) {
    let job = null;
    try {
      job = await claim();
      if (!job) {
        await sleep(POLL_MS);
        continue;
      }
      log(`開始 ${job.id}`);
      const started = Date.now();
      await runJob(job);
      log(`  花了 ${Math.round((Date.now() - started) / 1000)} 秒`);
    } catch (err) {
      log('失敗：', err.message);
      if (job) {
        await db
          .from('tryon_jobs')
          .update({ status: 'failed', error: String(err.message).slice(0, 500), updated_at: new Date().toISOString() })
          .eq('id', job.id);
      } else {
        await sleep(POLL_MS);
      }
    }
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
