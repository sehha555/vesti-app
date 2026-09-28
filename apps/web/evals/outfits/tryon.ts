import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseAttributes } from '../../lib/closet/attributes';
import type { ScenarioSummary } from './report';

// 考卷的試穿圖：把每套搭配的單品照片交給本機的 stable-diffusion.cpp（Qwen-Image 2.1＋6 步加速 LoRA），
// 生成穿在身上的照片，再產生附試穿圖、照身體位置排的抽查頁，讓人直接看穿起來的樣子打分。
// Qwen-Image 2.1 是研究授權，只能用在考卷，不能放進 App。

const SLOT_ORDER = ['top_inner', 'top_outer', 'bottom', 'shoes'] as const;
const SLOT_LABEL: Record<(typeof SLOT_ORDER)[number], string> = { top_inner: '上衣', top_outer: '外套', bottom: '下身', shoes: '鞋子' };
// 抽查頁照身體位置排：外套＋上衣一排、下身、鞋子
const BODY_ROWS = [['top_outer', 'top_inner'], ['bottom'], ['shoes']];
const LORA = 'viggle-turbo-6step-r128';

type Slot = { slotKey: string; itemId: string; name: string };

function buildPrompt(slots: Slot[], attrs: Record<string, unknown>, howToWear?: string): string {
  const refs = slots.map((s, i) => {
    const a = parseAttributes(attrs[s.itemId]);
    // 寫出顏色：商品照常常一張放好幾色，不寫模型會挑錯
    const desc = a ? `${a.colors[0]}${a.subcategory || a.name}` : s.name;
    return `圖 ${i + 1} 是${SLOT_LABEL[s.slotKey as keyof typeof SLOT_LABEL]}（${desc}）`;
  });
  return (
    `<lora:${LORA}:1>一位約 175 公分、身形偏瘦的東亞男性全身型錄照，自然站姿，淺灰色攝影棚背景，柔和自然光，UNIQLO 型錄風格，從頭到鞋子完整入鏡。` +
    `他穿著參考圖裡的衣服：${refs.join('，')}。` +
    '每件衣服的顏色、材質、版型、寬度、長度都要跟參考圖一樣，不要加 logo 或印花。' +
    (howToWear ? `穿法：${howToWear}。` : '')
  );
}

export function renderTryons(params: {
  resultsPath: string;
  imagesDir: string;
  sdDir: string;
  perScenario: number;
  limit: number;
}): string {
  const { resultsPath, imagesDir, sdDir, perScenario, limit } = params;
  const report = JSON.parse(readFileSync(resultsPath, 'utf8')) as { scenarios: ScenarioSummary[] };
  const attrs = JSON.parse(readFileSync(join(imagesDir, 'attributes.json'), 'utf8')) as Record<string, unknown>;
  const outDir = resultsPath.replace(/\.json$/, '-tryon');
  mkdirSync(outDir, { recursive: true });

  const jobs = report.scenarios.slice(0, limit).flatMap((sc) => {
    const run = sc.runs[0];
    return (run?.outfits ?? []).slice(0, perScenario).map((outfit, i) => ({ sc, run, outfit, index: i, file: `${sc.id}-${i + 1}.png` }));
  });
  const todo = jobs.filter((j) => !existsSync(join(outDir, j.file)));
  console.log(`共 ${jobs.length} 套，要生成 ${todo.length} 張試穿圖（一張約 1 分鐘，已生成的會跳過）。`);

  let done = 0;
  for (const job of todo) {
    const slots = SLOT_ORDER.flatMap((key) => (job.outfit.slots ?? []).filter((s) => s.slotKey === key));
    const args = [
      '--diffusion-model', join(sdDir, 'models/qwen_image_2.1-Q8_0.gguf'),
      '--vae', join(sdDir, 'models/qwen_image_2.1_vae_bf16.safetensors'),
      '--llm', join(sdDir, 'models/Qwen3VL-8B-Instruct-Q4_K_M.gguf'),
      '--llm_vision', join(sdDir, 'models/mmproj-Qwen3VL-8B-Instruct-F16.gguf'),
      '--lora-model-dir', join(sdDir, 'models/lora'),
      ...slots.flatMap((s) => ['-r', join(imagesDir, s.itemId)]),
      '-p', buildPrompt(slots, attrs, job.outfit.howToWear),
      '-W', '896', '-H', '1184', '--steps', '6', '--cfg-scale', '1.0', '--sampling-method', 'euler',
      '--offload-to-cpu', '--fa', '-s', '42',
      '-o', join(outDir, job.file),
    ];
    process.stdout.write(`  ${job.sc.title} 第 ${job.index + 1} 套… `);
    const started = Date.now();
    const result = spawnSync(join(sdDir, 'bin/sd-cli.exe'), args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    if (result.status !== 0 || !existsSync(join(outDir, job.file))) {
      console.log(`失敗：${(result.stderr || result.stdout || String(result.error)).trim().split('\n').slice(-3).join(' ')}`);
      continue;
    }
    console.log(`${Math.round((Date.now() - started) / 1000)} 秒（${++done}/${todo.length}）`);
  }

  const page = join(outDir, 'index.html');
  writeFileSync(page, renderPage(jobs, outDir));
  return page;
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

function renderPage(
  jobs: Array<{ sc: ScenarioSummary; run: ScenarioSummary['runs'][number]; outfit: ScenarioSummary['runs'][number]['outfits'][number]; index: number; file: string }>,
  outDir: string
): string {
  const cards = jobs.map((job, n) => {
    const slots = job.outfit.slots ?? [];
    const rows = BODY_ROWS.map((keys) => {
      const row = keys.flatMap((k) => slots.filter((s) => s.slotKey === k));
      // 抽查頁在 results/<成績單>-tryon/，照片在 images/
      return row.length ? `<div class="row">${row.map((s) => `<figure><img src="../../images/${s.itemId}" alt=""><figcaption>${esc(s.name)}</figcaption></figure>`).join('')}</div>` : '';
    }).join('');
    const verdict = job.run.verdicts.find((v) => v.index === job.index + 1);
    const tryon = existsSync(join(outDir, job.file)) ? `<img class="tryon" src="${job.file}" alt="">` : '<div class="tryon missing">沒有試穿圖</div>';
    return `<section><h2>第 ${n + 1} 套｜${esc(job.sc.title)}｜${esc(job.outfit.title)}</h2>
<div class="pair">${tryon}<div class="body">${rows}</div></div>
<p class="wear">穿法：${esc(job.outfit.howToWear ?? '（沒有）')}</p>
<p class="muted">造型師：${esc(job.outfit.reason)}</p>
<p class="muted"><b>${verdict ? `評審給 ${verdict.score} 分` : '沒有評審分數'}</b>${verdict ? `｜${esc(verdict.reasons.join('；'))}` : ''}</p>
<p class="ask">你會給幾分？（0–5）</p></section>`;
  });
  return `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><title>考卷抽查</title>
<style>body{font-family:system-ui,"Microsoft JhengHei",sans-serif;max-width:980px;margin:24px auto;padding:0 16px;background:#f4f2ee;color:#222}
section{background:#fff;border-radius:12px;padding:16px 20px;margin:18px 0;box-shadow:0 1px 3px rgba(0,0,0,.08)}h2{font-size:16px;margin:0 0 12px}
.pair{display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap}.tryon{width:420px;max-width:100%;border-radius:8px;background:#eee}.missing{height:200px;display:grid;place-items:center;color:#999}
.body{display:flex;flex-direction:column;align-items:center;gap:6px;background:#fafafa;border-radius:8px;padding:12px;flex:1;min-width:260px}
.row{display:flex;gap:8px;justify-content:center}figure{margin:0;text-align:center}.row img{width:120px;height:135px;object-fit:contain;background:#fff}
.row:last-child img{height:80px}figcaption{font-size:12px;color:#555}.wear{font-weight:bold;margin:12px 0 4px}.muted{color:#666;font-size:14px;margin:4px 0}.ask{color:#b35900;font-weight:bold}</style></head>
<body><h1>考卷抽查（附試穿圖）</h1><p>左邊是 AI 生成的穿上身照片（Qwen-Image 2.1，只供評估），右邊是實際的單品。每套心裡給 0–5 分，特別難看或特別好看的告訴我。</p>${cards.join('\n')}</body></html>`;
}
