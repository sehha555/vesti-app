import type { DislikeReason, FeedbackAction } from './types';

interface OutfitLike {
  styleName?: string;
  layoutSlots?: Array<{ item?: { id?: string | null } | null }>;
}

/**
 * 送一筆推薦回饋。失敗只記 log，不影響畫面操作（回饋是加分，不是主流程）。
 * 範例卡片（沒有衣櫃單品）不送。
 */
export function sendFeedback(
  action: FeedbackAction,
  outfit: OutfitLike,
  extra: { reasons?: DislikeReason[]; date?: string; occasion?: string; weather?: Record<string, unknown> } = {}
): void {
  const itemIds = (outfit.layoutSlots ?? []).map((s) => s.item?.id).filter((id): id is string => !!id);
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
        ...(extra.date ? { date: extra.date } : {}),
        ...(extra.occasion ? { occasion: extra.occasion } : {}),
        ...(outfit.styleName ? { styleName: outfit.styleName.slice(0, 200) } : {}),
        ...(extra.weather ? { weather: extra.weather } : {}),
      },
    }),
  }).catch((error) => console.error('[feedback] send failed:', error));
}
