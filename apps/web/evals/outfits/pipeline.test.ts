import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Part } from '@google/genai';

// 考卷的端對端測試：AI 回應是假的，其餘（挑衣櫃、候選篩選、回饋摘要、規則、評審解析、成績單）都是真的程式。
vi.mock('../../lib/ai/gemini', () => ({
  GEMINI_MODEL: 'test-model',
  imagePart: (data: string, mimeType: string) => ({ inlineData: { data, mimeType } }),
  generateJson: vi.fn(async (system: string, parts: Part[]) => {
    const text = parts.map((p) => p.text ?? '').join('\n');
    if (system.includes('標註員')) {
      return { category: 'top', subcategory: 'T恤', name: '新辨識的T恤', colors: ['白'], pattern: 'solid', warmth: 2, formality: 2, styles: ['休閒'], seasons: ['summer'] };
    }
    if (system.includes('穿搭評審')) {
      const count = (text.match(/（index \d+）/g) ?? []).length;
      return { outfits: Array.from({ length: count }, (_, i) => ({ index: i + 1, score: 4 - i, reasons: [`第${i + 1}套配色協調`], problems: i ? ['鞋子太正式'] : [] })) };
    }
    // 造型師：第 1 套 = 第一件上衣＋第一件下身，第 2 套 = 第二件；外加一套不存在的衣服
    const ids = (cat: string) => [...text.matchAll(new RegExp(`itemId: (\\S+)｜名稱: [^｜]+｜類別: ${cat}`, 'g'))].map((m) => m[1]);
    const [tops, bottoms] = [ids('top'), ids('bottom')];
    return {
      outfits: [
        { title: '清爽', reason: '白配藍', slots: [{ slotKey: 'top_inner', itemId: tops[0] }, { slotKey: 'bottom', itemId: bottoms[0] }] },
        { title: '簡約', reason: '同色系', slots: [{ slotKey: 'top_inner', itemId: tops[1] }, { slotKey: 'bottom', itemId: bottoms[1] }] },
        { title: '亂來', reason: 'x', slots: [{ slotKey: 'top_inner', itemId: 'top/不存在.png' }, { slotKey: 'bottom', itemId: bottoms[0] }] },
      ],
    };
  }),
}));

import { loadPool, pickCloset, ensureAttributes, runScenario, type Scenario } from './pipeline';
import { summarizeScenario, buildReport, toMarkdown, compareReports } from './report';
import { generateJson } from '../../lib/ai/gemini';

const PNG = Buffer.from('89504e470d0a1a0a0000000d4948445200000001000000010806000000', 'hex');
let dir: string;

const attrs = (category: string, warmth: number, formality = 2, name = `${category}${warmth}`) => ({
  version: 1, category, subcategory: '', name, colors: ['白'], pattern: 'solid', warmth, formality, styles: [], seasons: [],
});

beforeAll(() => {
  process.env.GEMINI_API_KEY = 'test-key'; // 辨識程式沒有金鑰會直接跳過
  dir = mkdtempSync(join(tmpdir(), 'vesti-eval-'));
  const files: Record<string, string[]> = { top: ['t1.png', 't2.png', 't3.png'], outerwear: ['coat.png'], bottom: ['b1.png', 'b2.png'], shoes: ['s1.png'] };
  for (const [cat, list] of Object.entries(files)) {
    mkdirSync(join(dir, cat));
    for (const f of list) writeFileSync(join(dir, cat, f), PNG);
  }
  writeFileSync(join(dir, 'meta.json'), JSON.stringify({ 'top/t1.png': { name: '白色T恤' } }));
  // t3 沒有辨識結果，讓 ensureAttributes 去補
  writeFileSync(
    join(dir, 'attributes.json'),
    JSON.stringify({
      'top/t1.png': attrs('top', 2, 2, '白色T恤'),
      'top/t2.png': attrs('top', 2, 2, '黑色T恤'),
      'outerwear/coat.png': attrs('outerwear', 5, 3, '羽絨外套'),
      'bottom/b1.png': attrs('bottom', 2, 2, '牛仔褲'),
      'bottom/b2.png': attrs('bottom', 2, 5, '西裝褲'),
      'shoes/s1.png': null,
    })
  );
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

const HOT: Scenario = {
  id: 'hot',
  title: '大熱天・休閒',
  weather: { temperature: 33, feelsLike: 35, humidity: 70, condition: 'sunny', windSpeed: 5 },
  occasion: 'casual',
  closet: { top: 2, outerwear: 1, bottom: 2, shoes: 1 },
  seed: 7,
  feedback: [{ action: 'dislike', pick: [['top', 0], ['bottom', 0]], reasons: ['color'] }],
};

describe('穿搭考卷', () => {
  it('讀照片、用 meta.json 的名稱；同一個 seed 每次挑到同樣的衣服', () => {
    const pool = loadPool(dir);
    expect(pool).toHaveLength(7);
    expect(pool.find((p) => p.id === 'top/t1.png')?.name).toBe('白色T恤');
    const ids = (s: Scenario) => [...pickCloset(pool, s).values()].flat().map((p) => p.id);
    expect(ids(HOT)).toEqual(ids(HOT));
    expect(() => pickCloset(pool, { ...HOT, closet: { top: 9 } })).toThrow(/只有 3 張/);
  });

  it('只替沒辨識過的照片跑辨識，並存起來', async () => {
    const pool = loadPool(dir);
    const map = await ensureAttributes(pool, join(dir, 'attributes.json'));
    expect(map.get('top/t3.png')?.name).toBe('新辨識的T恤');
    expect(map.get('shoes/s1.png')).toBeNull();
    expect(JSON.parse(readFileSync(join(dir, 'attributes.json'), 'utf8'))['top/t3.png']).toBeTruthy();
    expect(vi.mocked(generateJson).mock.calls.filter(([s]) => s.includes('標註員'))).toHaveLength(1);
  });

  it('跑一題：熱天排除羽絨外套、回饋寫進 prompt、規則與評審都有結果，成績單產生得出來', async () => {
    const pool = loadPool(dir);
    const attributes = await ensureAttributes(pool, join(dir, 'attributes.json'));
    const run = await runScenario({ scenario: HOT, pool, attributes, judge: true });

    expect(run.closetSize).toBe(6);
    expect(run.candidates).toBe(5); // 羽絨外套被天氣規則拿掉
    expect(run.rawCount).toBe(3);
    expect(run.outfits).toHaveLength(2);
    expect(run.feedbackSummary).toContain('配色不喜歡');

    const byRule = Object.fromEntries(run.rules.map((r) => [r.rule, r.passed]));
    expect(byRule).toMatchObject({ enough_outfits: true, all_valid: false, distinct: true, hot_no_heavy: true });
    // 假造型師的第一套剛好是使用者說不要的組合，規則要抓得到
    expect(byRule.respect_dislike).toBe(false);
    expect(run.verdicts.map((v) => v.score)).toEqual([4, 3]);

    const summary = summarizeScenario(HOT, [run, run]);
    expect(summary.judgeMean).toBe(3.5);
    expect(summary.judgeRange).toBe(0);
    const report = buildReport({ createdAt: '2026-09-28T00:00:00Z', model: 'm', judgeModel: 'j', promptVersion: 'abc', repeat: 2, scenarios: [summary] });
    const md = toMarkdown(report);
    expect(md).toContain('大熱天・休閒');
    expect(md).toContain('評審理由：第1套配色協調');
    expect(md).toContain('避開使用者說過「不要」的組合');

    const better = { ...report, createdAt: 'later', judgeMean: 4, scenarios: [{ ...summary, judgeMean: 4 }] };
    expect(compareReports(report, better)).toContain('+0.50');
  });

  it('不請評審時只有規則', async () => {
    const pool = loadPool(dir);
    const attributes = await ensureAttributes(pool, join(dir, 'attributes.json'));
    const run = await runScenario({ scenario: { ...HOT, feedback: undefined }, pool, attributes, judge: false });
    expect(run.verdicts).toEqual([]);
    expect(run.rules.some((r) => r.rule === 'respect_dislike')).toBe(false);
  });
});
