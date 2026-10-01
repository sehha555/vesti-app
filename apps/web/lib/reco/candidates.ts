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
 * 核心循環 ②「候選」：從整個衣櫃挑出要送給模型的衣物（模型一次看不了太多張圖）。
 * 1. 先依天氣排除不合適的（必要類別被排光時整類放回）
 * 2. 再按類別輪流挑，每類從最新的開始，避免最新的 30 件剛好都是上衣
 * 情境是使用者自己寫的一句話，不在這裡用規則篩，交給模型判斷。
 * rows 需依新到舊排序；回傳順序為輪流挑選的順序。
 */
export function selectCandidates<T extends CandidateInput>(rows: T[], feelsLike: number, max: number): T[] {
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
    if (byWeather.length > 0) queues.push(byWeather);
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
