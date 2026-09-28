import { readdirSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join, extname } from 'node:path';
import { generateOutfits } from '../../lib/ai/suggest-outfits';
import type { ClosetItemForPrompt, OutfitSuggestion } from '../../lib/ai/outfit-prompt';
import { tagClosetItem } from '../../lib/ai/tag-item';
import { parseAttributes, type ItemAttributes } from '../../lib/closet/attributes';
import type { ClosetCategory } from '../../lib/closet/categories';
import { selectCandidates } from '../../lib/reco/candidates';
import { summarizeFeedback, type FeedbackRow } from '../../lib/feedback/summary';
import type { FeedbackAction } from '../../lib/feedback/types';
import { outfitKeyFromItemIds } from '../../lib/outfits/key';
import type { WeatherSummary } from '../../../../packages/types/src/weather';
import { checkRules, type RuleResult } from './rules';
import { judgeOutfits, type JudgeItem, type JudgeVerdict } from './judge';

// 考卷的主流程。搭配、候選篩選、回饋摘要、衣物辨識都呼叫正式程式（lib/），考卷量到的就是線上的行為。

export const POOL_CATEGORIES: ClosetCategory[] = ['top', 'outerwear', 'bottom', 'shoes', 'accessory'];
const MIME_BY_EXT: Record<string, string> = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
const MAX_CANDIDATES = 30; // 跟 suggest-outfits 的 MAX_ITEMS 一致

export interface PoolItem {
  /** 例如 top/12345.jpg，也是送給模型的 itemId */
  id: string;
  category: ClosetCategory;
  name: string;
  path: string;
  mimeType: string;
}

export interface Scenario {
  id: string;
  title: string;
  weather: WeatherSummary;
  occasion: string;
  /** 每類挑幾件衣服組成這題的衣櫃 */
  closet: Partial<Record<ClosetCategory, number>>;
  /** 同一個 seed 每次挑到同樣的衣服 */
  seed: number;
  /** 模擬使用者之前的回饋；pick 是 [類別, 第幾件（從 0 開始）] */
  feedback?: Array<{ action: FeedbackAction; pick: Array<[ClosetCategory, number]>; reasons?: string[]; daysAgo?: number }>;
}

export interface ScenarioRun {
  closetSize: number;
  candidates: number;
  rawCount: number;
  outfits: Array<{ title: string; reason: string; items: string[] }>;
  feedbackSummary: string | null;
  rules: RuleResult[];
  verdicts: JudgeVerdict[];
  error?: string;
}

/** 讀 images/<類別>/ 下的照片；images/meta.json（下載時產生）有商品名稱 */
export function loadPool(imagesDir: string): PoolItem[] {
  const metaPath = join(imagesDir, 'meta.json');
  const meta: Record<string, { name?: string }> = existsSync(metaPath) ? JSON.parse(readFileSync(metaPath, 'utf8')) : {};
  const pool: PoolItem[] = [];
  for (const category of POOL_CATEGORIES) {
    const dir = join(imagesDir, category);
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir).sort()) {
      const mimeType = MIME_BY_EXT[extname(file).toLowerCase()];
      if (!mimeType) continue;
      const id = `${category}/${file}`;
      pool.push({ id, category, name: meta[id]?.name ?? file.replace(/\.[^.]+$/, ''), path: join(dir, file), mimeType });
    }
  }
  return pool;
}

/** 固定 seed 的亂數（mulberry32），讓同一題每次挑到同樣的衣服 */
function seededRandom(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickCloset(pool: PoolItem[], scenario: Scenario): Map<ClosetCategory, PoolItem[]> {
  const rand = seededRandom(scenario.seed);
  const picked = new Map<ClosetCategory, PoolItem[]>();
  for (const category of POOL_CATEGORIES) {
    const want = scenario.closet[category] ?? 0;
    if (want === 0) continue;
    const available = pool.filter((p) => p.category === category);
    if (available.length < want) {
      throw new Error(`題目 ${scenario.id} 需要 ${want} 件 ${category}，照片只有 ${available.length} 張`);
    }
    const shuffled = [...available];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    picked.set(category, shuffled.slice(0, want));
  }
  return picked;
}

// 連續幾張辨識失敗就停（多半是金鑰錯或額度用完），不要白白打幾十次
const MAX_CONSECUTIVE_TAG_FAILURES = 3;

/**
 * 替還沒辨識過的照片跑衣物辨識（正式的 tagClosetItem），成功的存在 attributes.json，下次不用重跑。
 * 失敗的這次當作沒有屬性（跟線上「沒辨識到」一樣），但不存起來，下次會再試。
 */
export async function ensureAttributes(
  pool: PoolItem[],
  cachePath: string,
  onProgress?: (done: number, total: number) => void
): Promise<Map<string, ItemAttributes | null>> {
  const cache: Record<string, unknown> = existsSync(cachePath) ? JSON.parse(readFileSync(cachePath, 'utf8')) : {};
  const missing = pool.filter((p) => !(p.id in cache));
  let done = 0;
  let failuresInRow = 0;
  for (const item of missing) {
    const attrs = await tagClosetItem({ buffer: readFileSync(item.path), contentType: item.mimeType });
    if (attrs) {
      cache[item.id] = attrs;
      writeFileSync(cachePath, JSON.stringify(cache, null, 2));
      failuresInRow = 0;
    } else if (++failuresInRow >= MAX_CONSECUTIVE_TAG_FAILURES) {
      throw new Error(`衣物辨識連續 ${failuresInRow} 張失敗，先停下來。請確認 GEMINI_API_KEY 是否正確、額度是否用完。`);
    }
    onProgress?.(++done, missing.length);
  }
  return new Map(pool.map((p) => [p.id, parseAttributes(cache[p.id])]));
}

/** 錯誤訊息常是一大串 JSON，縮成一行好放進成績單表格 */
export function shortError(err: unknown): string {
  const message = (err as Error)?.message ?? String(err);
  const inner = message.match(/"message"\s*:\s*"([^"]+)"/)?.[1];
  return (inner ?? message).replace(/[\r\n|]+/g, ' ').slice(0, 160);
}

export async function runScenario(params: {
  scenario: Scenario;
  pool: PoolItem[];
  attributes: Map<string, ItemAttributes | null>;
  judge: boolean;
  now?: Date;
}): Promise<ScenarioRun> {
  const { scenario, pool, attributes, judge } = params;
  const now = params.now ?? new Date();
  const closetByCategory = pickCloset(pool, scenario);
  const closet = [...closetByCategory.values()].flat();
  const nameOf = (item: PoolItem) => attributes.get(item.id)?.name ?? item.name;

  // ② 候選：跟線上一樣依天氣與類別挑
  const candidates = selectCandidates(
    closet.map((item) => ({ ...item, attributes: attributes.get(item.id) ?? null })),
    scenario.weather.feelsLike,
    MAX_CANDIDATES
  );

  const images = new Map<string, { base64: string; mimeType: string }>();
  for (const item of candidates) images.set(item.id, { base64: readFileSync(item.path).toString('base64'), mimeType: item.mimeType });

  const promptItems: ClosetItemForPrompt[] = candidates.map((item) => ({
    id: item.id,
    name: nameOf(item),
    category: item.category,
    color: item.attributes?.colors[0] ?? null,
    attributes: item.attributes,
    imageBase64: images.get(item.id)!.base64,
    mimeType: item.mimeType,
  }));

  // ⑤ 回饋：用正式的 summarizeFeedback 產生給模型看的文字
  const resolve = (pick: Array<[ClosetCategory, number]>) =>
    pick.map(([category, index]) => {
      const item = closetByCategory.get(category)?.[index];
      if (!item) throw new Error(`題目 ${scenario.id} 的回饋指到不存在的衣服：${category}[${index}]`);
      return item.id;
    });
  const feedbackRows: FeedbackRow[] = (scenario.feedback ?? []).map((f) => {
    const ids = resolve(f.pick);
    return {
      action: f.action,
      outfit_key: outfitKeyFromItemIds(ids)!,
      item_ids: ids,
      reasons: f.reasons ?? [],
      created_at: new Date(now.getTime() - (f.daysAgo ?? 1) * 86_400_000).toISOString(),
    };
  });
  const feedbackSummary = summarizeFeedback(feedbackRows, new Map(candidates.map((c) => [c.id, nameOf(c)])), now);

  const base = { closetSize: closet.length, candidates: candidates.length, feedbackSummary };

  let raw: unknown[] = [];
  let outfits: OutfitSuggestion[] = [];
  try {
    const result = await generateOutfits({
      items: promptItems,
      weather: scenario.weather,
      occasion: scenario.occasion,
      feedbackSummary,
      itemsById: new Map(candidates.map((c) => [c.id, { name: nameOf(c), imageUrl: c.path }])),
    });
    raw = result.raw;
    outfits = result.outfits;
  } catch (err) {
    return { ...base, rawCount: 0, outfits: [], rules: [], verdicts: [], error: `搭配失敗：${shortError(err)}` };
  }

  const rules = checkRules({
    outfits,
    rawCount: raw.length,
    feelsLike: scenario.weather.feelsLike,
    occasion: scenario.occasion,
    attributes: new Map(candidates.map((c) => [c.id, c.attributes])),
    dislikedCombos: feedbackRows.filter((r) => r.action === 'dislike').map((r) => r.item_ids),
    wornCombos: feedbackRows.filter((r) => r.action === 'wore').map((r) => r.item_ids),
  });

  let verdicts: JudgeVerdict[] = [];
  let error: string | undefined;
  if (judge && outfits.length > 0) {
    const judgeItems = new Map<string, JudgeItem>(
      candidates.map((c) => [c.id, { name: nameOf(c), attributes: c.attributes, image: images.get(c.id)! }])
    );
    try {
      verdicts = await judgeOutfits({ outfits, items: judgeItems, weather: scenario.weather, occasion: scenario.occasion });
    } catch (err) {
      error = `評審失敗：${shortError(err)}`;
    }
  }

  return {
    ...base,
    rawCount: raw.length,
    outfits: outfits.map((o) => ({ title: o.styleName, reason: o.description, items: o.layoutSlots.map((s) => s.item.name) })),
    rules,
    verdicts,
    ...(error ? { error } : {}),
  };
}
