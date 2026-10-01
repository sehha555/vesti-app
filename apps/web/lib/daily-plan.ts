// 前端共用：「今天穿這套」選定 / 取消 / 讀取。首頁卡片與穿搭詳情都走這裡，選定後廣播事件讓兩邊同步
import { localDate, sendFeedback } from './feedback/client';

export const PLAN_CHANGED_EVENT = 'vesti:daily-plan-changed';

interface SlotLike {
  slotKey: string;
  item: { id?: string | number; name?: string };
  priority?: number;
}

interface OutfitLike {
  id: number;
  styleName?: string;
  layoutSlots?: SlotLike[];
}

export interface PlanSlot {
  slotKey: string;
  item: { id?: string; name?: string };
  priority: number;
}

export interface DailyPlan {
  date: string;
  layoutSlots: PlanSlot[];
  wore: boolean | null;
}

// 只送 id 與名稱；signed URL 會過期，不存
function toPlanSlots(outfit: OutfitLike): PlanSlot[] {
  return (outfit.layoutSlots ?? [])
    .filter((s) => s.item.id)
    .map((s, i) => ({ slotKey: s.slotKey, item: { id: String(s.item.id), name: s.item.name }, priority: s.priority ?? i }));
}

/** date 是使用者當地日期，預設今天；沒有計畫回 null */
export async function fetchPlan(date = localDate()): Promise<DailyPlan | null> {
  const res = await fetch(`/api/reco/daily-outfits/plan?date=${date}`);
  if (!res.ok) throw new Error(`plan ${res.status}`);
  const body = await res.json();
  return body.plan ?? null;
}

/** occasion 是使用者當天自己寫的情境，沒寫就不送 */
export async function confirmTodayOutfit(outfit: OutfitLike, occasion?: string): Promise<void> {
  const date = localDate();
  const layoutSlots = toPlanSlots(outfit);
  const res = await fetch('/api/reco/daily-outfits/plan', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date, outfitId: outfit.id, layoutSlots, occasion: occasion || undefined }),
  });
  if (!res.ok) throw new Error(`plan ${res.status}`);
  sendFeedback('choose', { styleName: outfit.styleName, layoutSlots }, { date });
  window.dispatchEvent(new Event(PLAN_CHANGED_EVENT));
}

export async function clearTodayOutfit(outfit: OutfitLike): Promise<void> {
  const date = localDate();
  const res = await fetch(`/api/reco/daily-outfits/plan?date=${date}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`plan ${res.status}`);
  sendFeedback('unchoose', { styleName: outfit.styleName, layoutSlots: toPlanSlots(outfit) }, { date });
  window.dispatchEvent(new Event(PLAN_CHANGED_EVENT));
}

/** 隔天回答「昨天選的那套有沒有穿」 */
export async function answerWore(plan: DailyPlan, wore: boolean): Promise<void> {
  const res = await fetch('/api/reco/daily-outfits/plan', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date: plan.date, wore }),
  });
  if (!res.ok) throw new Error(`plan ${res.status}`);
  sendFeedback(wore ? 'wore' : 'not_worn', { layoutSlots: plan.layoutSlots }, { date: plan.date });
}
