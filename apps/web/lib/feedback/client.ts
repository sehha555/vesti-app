import { itemIdsFromSlots } from '../outfits/key';
import type { DislikeReason, FeedbackAction } from './types';

interface OutfitLike {
  styleName?: string;
  layoutSlots?: Array<{ item?: { id?: string | null } | null }>;
}

/** 使用者當地的日期（台灣早上 8 點前 toISOString() 還是昨天的 UTC 日期）；offsetDays=-1 是昨天 */
export function localDate(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * 送一筆推薦回饋。失敗只記 log，不影響畫面操作（回饋是加分，不是主流程）。
 * 範例卡片（沒有衣櫃單品）不送。date 預設今天。
 */
export function sendFeedback(
  action: FeedbackAction,
  outfit: OutfitLike,
  extra: { reasons?: DislikeReason[]; date?: string } = {}
): void {
  const itemIds = itemIdsFromSlots(outfit.layoutSlots);
  if (itemIds.length === 0) return;

  fetch('/api/reco/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    keepalive: true, // 滑走或離開頁面時也送得出去
    body: JSON.stringify({
      action,
      itemIds,
      ...(extra.reasons?.length ? { reasons: extra.reasons } : {}),
      context: {
        date: extra.date ?? localDate(),
        ...(outfit.styleName ? { styleName: outfit.styleName.slice(0, 200) } : {}),
      },
    }),
  }).catch((error) => console.error('[feedback] send failed:', error));
}
