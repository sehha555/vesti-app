// 前端共用：「今天穿這套」選定 / 取消 / 讀取。首頁卡片與穿搭詳情都走這裡，選定後廣播事件讓兩邊同步

export const PLAN_CHANGED_EVENT = 'vesti:daily-plan-changed';

interface SlotLike {
  slotKey: string;
  item: { id?: string | number; name?: string };
}

interface OutfitLike {
  id: number;
  layoutSlots?: SlotLike[];
}

/** 一套穿搭的身分：單品 id 排序後串起來（卡片 id 只是順序，重新整理會變） */
export function outfitItemKey(itemIds: Array<string | number | undefined>): string {
  return itemIds.filter(Boolean).map(String).sort().join(',');
}

export function slotItemIds(outfit: OutfitLike): string[] {
  return (outfit.layoutSlots ?? []).map((s) => s.item.id).filter(Boolean).map(String);
}

export async function fetchTodayItemIds(): Promise<string[] | null> {
  const res = await fetch('/api/reco/daily-outfits/plan');
  if (!res.ok) throw new Error(`plan ${res.status}`);
  const body = await res.json();
  return body.plan?.itemIds ?? null;
}

export async function confirmTodayOutfit(outfit: OutfitLike, occasion = 'casual'): Promise<void> {
  const res = await fetch('/api/reco/daily-outfits/plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      outfitId: outfit.id,
      layoutSlots: (outfit.layoutSlots ?? [])
        .filter((s) => s.item.id)
        .map((s) => ({ slotKey: s.slotKey, item: { id: String(s.item.id), name: s.item.name } })),
      occasion,
    }),
  });
  if (!res.ok) throw new Error(`plan ${res.status}`);
  window.dispatchEvent(new Event(PLAN_CHANGED_EVENT));
}

export async function clearTodayOutfit(): Promise<void> {
  const res = await fetch('/api/reco/daily-outfits/plan', { method: 'DELETE' });
  if (!res.ok) throw new Error(`plan ${res.status}`);
  window.dispatchEvent(new Event(PLAN_CHANGED_EVENT));
}
