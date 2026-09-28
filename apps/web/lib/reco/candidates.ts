import type { ItemAttributes } from '../closet/attributes';

export interface CandidateInput {
  category: string;
  attributes: ItemAttributes | null;
}

// 缺了這兩類就搭不出一套，篩到一件不剩時整類放回去
const REQUIRED_CATEGORIES = ['top', 'bottom'];

/**
 * 依體感溫度判斷這件適不適合今天。沒有辨識屬性的一律保留（交給模型看圖判斷）。
 * 門檻跟 OUTFIT_SYSTEM_PROMPT 的溫度原則一致：28 度以上不要保暖單品與厚外套、20 度以下不要最透氣的。
 */
export function fitsWeather(item: CandidateInput, feelsLike: number): boolean {
  const a = item.attributes;
  if (!a) return true;
  if (feelsLike >= 28) {
    // 長袖的保暖度常被標成 2–3，光看保暖度擋不掉，另外看袖長
    if (a.sleeve === 'long' && (item.category === 'top' || item.category === 'outerwear')) return false;
    return a.warmth <= 3 && !(item.category === 'outerwear' && a.warmth >= 3);
  }
  if (feelsLike >= 20) return a.warmth <= 4;
  return a.warmth >= 2 || item.category === 'accessory';
}

/**
 * 依場合判斷這件適不適合。work 不送運動服、拖鞋（正式度 1），鞋子只送樂福鞋、皮鞋這類（正式度 3 以上）。
 * 上衣不在這裡篩，留給模型挑，免得選擇太少。
 */
export function fitsOccasion(item: CandidateInput, occasion: string): boolean {
  const a = item.attributes;
  if (!a || occasion !== 'work') return true;
  if (item.category === 'shoes') return a.formality >= 3;
  return a.formality >= 2;
}

/**
 * 核心循環 ②「候選」：從整個衣櫃挑出要送給模型的衣物（模型一次看不了太多張圖）。
 * 1. 先依天氣排除不合適的（必要類別被排光時整類放回）
 * 2. 再依場合排除（某一類被排光時保留天氣篩完的結果，例如衣櫃只有運動鞋照樣送）
 * 3. 再按類別輪流挑，每類從最新的開始，避免最新的 30 件剛好都是上衣
 * rows 需依新到舊排序；回傳順序為輪流挑選的順序。
 */
export function selectCandidates<T extends CandidateInput>(rows: T[], feelsLike: number, occasion: string, max: number): T[] {
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    const list = groups.get(row.category) ?? [];
    list.push(row);
    groups.set(row.category, list);
  }

  const queues: T[][] = [];
  for (const [category, list] of groups) {
    const fit = list.filter((item) => fitsWeather(item, feelsLike));
    const byWeather = fit.length > 0 ? fit : REQUIRED_CATEGORIES.includes(category) ? list : [];
    if (byWeather.length === 0) continue;
    const byOccasion = byWeather.filter((item) => fitsOccasion(item, occasion));
    queues.push(byOccasion.length > 0 ? byOccasion : byWeather);
  }

  const picked: T[] = [];
  for (let i = 0; picked.length < max; i++) {
    const round = queues.filter((q) => i < q.length);
    if (round.length === 0) break;
    for (const q of round) {
      if (picked.length >= max) break;
      picked.push(q[i]);
    }
  }
  return picked;
}
