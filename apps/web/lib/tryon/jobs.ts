import type { SupabaseClient } from '@supabase/supabase-js';
import { CLOSET_BUCKET, SIGNED_URL_EXPIRES_SECONDS } from '../closet/storage';
import { getBodyPhotoPath } from './body-photo';

// 試穿只換這幾個部位（配件不換），跟桌機 worker 的 prompts.mjs 一致
const TRYON_SLOTS = ['top_inner', 'top_outer', 'bottom', 'shoes'];

export type TryonStatus = 'queued' | 'running' | 'done' | 'failed';

export interface TryonState {
  jobId: string;
  status: TryonStatus;
  /** status 為 done 時才有 */
  imageUrl?: string;
}

interface OutfitLike {
  id: number;
  layoutSlots: Array<{ slotKey: string; item: { id?: string } }>;
}

interface TryonItem {
  slotKey: string;
  itemId: string;
}

/** 一套穿搭要試穿的衣服；沒有可換的部位回空陣列 */
export function tryonItems(outfit: OutfitLike): TryonItem[] {
  return outfit.layoutSlots
    .filter((s) => TRYON_SLOTS.includes(s.slotKey) && s.item.id)
    .map((s) => ({ slotKey: s.slotKey, itemId: s.item.id! }));
}

/** 同一張全身照、同一組衣服（不論順序）得到同一個 key，只做一次 */
export function jobKey(personPath: string, items: TryonItem[]): string {
  return `${personPath}|${items.map((i) => i.itemId).sort().join(',')}`;
}

interface JobRow {
  id: string;
  job_key: string;
  status: TryonStatus;
  result_path: string | null;
}

/** 已完成的工作簽結果圖網址，組成回給前端的狀態 */
async function toStates(supabase: SupabaseClient, rows: JobRow[]): Promise<Map<string, TryonState>> {
  const done = rows.filter((r) => r.status === 'done' && r.result_path);
  const urls = new Map<string, string>();
  if (done.length > 0) {
    const { data } = await supabase.storage
      .from(CLOSET_BUCKET)
      .createSignedUrls(
        done.map((r) => r.result_path!),
        SIGNED_URL_EXPIRES_SECONDS
      );
    data?.forEach((entry, i) => {
      if (entry.signedUrl) urls.set(done[i].id, entry.signedUrl);
    });
  }
  const states = new Map<string, TryonState>();
  for (const r of rows) {
    const imageUrl = urls.get(r.id);
    // 完成但簽不出網址就當作還沒好，前端會再問
    const status = r.status === 'done' && !imageUrl ? 'running' : r.status;
    states.set(r.id, { jobId: r.id, status, ...(imageUrl ? { imageUrl } : {}) });
  }
  return states;
}

/**
 * 替每套穿搭登記試穿工作（已登記過的不重複），回傳 Map<outfit.id, 試穿狀態>。
 * 沒上傳全身照、或這套沒有可換的衣服，就不會出現在 Map 裡。
 * 失敗只記 log、回空 Map：試穿是加分功能，不能讓推薦整個失敗。
 */
export async function ensureTryonJobs(
  supabase: SupabaseClient,
  userId: string,
  outfits: OutfitLike[]
): Promise<Map<number, TryonState>> {
  const result = new Map<number, TryonState>();
  try {
    const personPath = await getBodyPhotoPath(supabase, userId);
    if (!personPath) return result;

    const wanted = outfits
      .map((outfit) => ({ outfit, items: tryonItems(outfit) }))
      .filter((w) => w.items.length > 0)
      .map((w) => ({ ...w, key: jobKey(personPath, w.items) }));
    if (wanted.length === 0) return result;

    const { error: insertError } = await supabase.from('tryon_jobs').upsert(
      wanted.map((w) => ({ user_id: userId, job_key: w.key, person_path: personPath, items: w.items })),
      { onConflict: 'user_id,job_key', ignoreDuplicates: true }
    );
    if (insertError) throw new Error(`enqueue failed: ${insertError.message}`);

    const { data: rows, error } = await supabase
      .from('tryon_jobs')
      .select('id, job_key, status, result_path')
      .eq('user_id', userId)
      .in(
        'job_key',
        wanted.map((w) => w.key)
      );
    if (error) throw new Error(`read jobs failed: ${error.message}`);

    const states = await toStates(supabase, (rows ?? []) as JobRow[]);
    const byKey = new Map((rows ?? []).map((r) => [r.job_key, states.get(r.id)!]));
    for (const w of wanted) {
      const state = byKey.get(w.key);
      if (state) result.set(w.outfit.id, state);
    }
  } catch (err) {
    console.error('[tryon] ensure jobs failed:', (err as Error).message);
  }
  return result;
}

/** 前端輪詢用：查自己這幾件工作的狀態（RLS 保證只看得到自己的） */
export async function getTryonStates(
  supabase: SupabaseClient,
  userId: string,
  jobIds: string[]
): Promise<TryonState[]> {
  const { data, error } = await supabase
    .from('tryon_jobs')
    .select('id, job_key, status, result_path')
    .eq('user_id', userId)
    .in('id', jobIds);
  if (error) throw new Error(`read jobs failed: ${error.message}`);
  const states = await toStates(supabase, (data ?? []) as JobRow[]);
  return [...states.values()];
}
