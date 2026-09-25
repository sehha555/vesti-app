import type { SupabaseClient } from '@supabase/supabase-js';
import { DISLIKE_REASONS, type FeedbackAction } from './types';

export interface FeedbackRow {
  action: FeedbackAction;
  outfit_key: string;
  item_ids: string[];
  reasons: string[];
  created_at: string;
}

const LOOKBACK_DAYS = 30;
const RECENT_WORN_DAYS = 3;
const MAX_LINES_PER_SECTION = 8;
// 同一套滑過幾次才算「不太喜歡」（滑一次可能只是想先看下一張）
const SKIP_THRESHOLD = 2;

const POSITIVE: FeedbackAction[] = ['choose', 'save', 'wore'];
const REASON_PROMPT = new Map<string, string>(DISLIKE_REASONS.map((r) => [r.value, r.prompt]));

/**
 * 把最近的回饋整理成給模型看的一段文字；沒有可用的回饋回 null。
 *
 * 每一套只看「最新的明確表態」：先按要這套、後來又按不要，以不要為準。
 * 只列出單品都還在衣櫃裡的組合（itemNames 有的），刪掉的衣服不必再提。
 */
export function summarizeFeedback(
  rows: FeedbackRow[],
  itemNames: Map<string, string>,
  now: Date = new Date()
): string | null {
  const latest = new Map<string, FeedbackRow>();
  const skips = new Map<string, { count: number; row: FeedbackRow }>();
  const wornRecently = new Map<string, FeedbackRow>();
  const recentCutoff = now.getTime() - RECENT_WORN_DAYS * 86_400_000;

  // rows 由新到舊
  for (const row of rows) {
    if (!row.item_ids.every((id) => itemNames.has(id))) continue;

    if (row.action === 'skip') {
      const seen = skips.get(row.outfit_key);
      skips.set(row.outfit_key, { count: (seen?.count ?? 0) + 1, row: seen?.row ?? row });
      continue;
    }
    if (row.action === 'wore' && new Date(row.created_at).getTime() >= recentCutoff) {
      if (!wornRecently.has(row.outfit_key)) wornRecently.set(row.outfit_key, row);
    }
    if (!latest.has(row.outfit_key)) latest.set(row.outfit_key, row);
  }

  const describe = (row: FeedbackRow) => row.item_ids.map((id) => itemNames.get(id)).join(' + ');

  const liked: string[] = [];
  const disliked: string[] = [];
  for (const row of latest.values()) {
    if (POSITIVE.includes(row.action)) {
      liked.push(`- ${describe(row)}`);
    } else if (row.action === 'dislike') {
      const reasons = row.reasons.map((r) => REASON_PROMPT.get(r)).filter(Boolean);
      disliked.push(`- ${describe(row)}${reasons.length ? `（${reasons.join('、')}）` : ''}`);
    }
  }
  for (const [key, { count, row }] of skips) {
    if (count < SKIP_THRESHOLD || latest.has(key)) continue;
    disliked.push(`- ${describe(row)}（推薦過 ${count} 次都直接滑過）`);
  }
  const worn = [...wornRecently.values()].map((row) => `- ${describe(row)}`);

  const sections: string[] = [];
  if (liked.length) sections.push(`使用者喜歡過的組合（可以參考風格，但不要整套照搬）：\n${liked.slice(0, MAX_LINES_PER_SECTION).join('\n')}`);
  if (disliked.length) sections.push(`使用者不喜歡的組合（避免推薦相同或非常類似的搭配）：\n${disliked.slice(0, MAX_LINES_PER_SECTION).join('\n')}`);
  if (worn.length) sections.push(`最近 ${RECENT_WORN_DAYS} 天穿過（今天不要推薦完全相同的一套）：\n${worn.slice(0, MAX_LINES_PER_SECTION).join('\n')}`);

  return sections.length ? sections.join('\n\n') : null;
}

/** 撈最近 30 天的回饋（由新到舊）。失敗時回空陣列：回饋只是加分，不該讓推薦失敗。 */
export async function loadRecentFeedback(supabase: SupabaseClient, userId: string): Promise<FeedbackRow[]> {
  const since = new Date(Date.now() - LOOKBACK_DAYS * 86_400_000).toISOString();
  const { data, error } = await supabase
    .from('outfit_feedback')
    .select('action, outfit_key, item_ids, reasons, created_at')
    .eq('user_id', userId)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(300);

  if (error) {
    console.error('[feedback] load failed:', error.message);
    return [];
  }
  return (data ?? []) as FeedbackRow[];
}
