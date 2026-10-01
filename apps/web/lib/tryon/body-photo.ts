import type { SupabaseClient } from '@supabase/supabase-js';
import {
  CLOSET_BUCKET,
  SIGNED_URL_EXPIRES_SECONDS,
  uploadClosetImage,
  type ClosetImageMime,
} from '../closet/storage';

// 每人只留一張全身照，放在 {user_id}/body/ 底下；檔名每次不同，試穿工作靠路徑分辨是哪一張照片
export interface BodyPhoto {
  path: string;
  signedUrl: string;
}

const bodyFolder = (userId: string) => `${userId}/body`;

/** 列出 body 資料夾裡的檔案路徑，新的在前 */
async function listBodyPaths(supabase: SupabaseClient, userId: string): Promise<string[]> {
  const { data, error } = await supabase.storage
    .from(CLOSET_BUCKET)
    .list(bodyFolder(userId), { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });
  if (error) throw new Error(`Storage list failed: ${error.message}`);
  return (data ?? []).filter((f) => f.id !== null).map((f) => `${bodyFolder(userId)}/${f.name}`);
}

/** 目前全身照在 bucket 裡的路徑；沒上傳過回 null */
export async function getBodyPhotoPath(supabase: SupabaseClient, userId: string): Promise<string | null> {
  const [path] = await listBodyPaths(supabase, userId);
  return path ?? null;
}

/** 目前的全身照；沒上傳過回 null */
export async function getBodyPhoto(supabase: SupabaseClient, userId: string): Promise<BodyPhoto | null> {
  const path = await getBodyPhotoPath(supabase, userId);
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from(CLOSET_BUCKET)
    .createSignedUrl(path, SIGNED_URL_EXPIRES_SECONDS);
  if (error || !data?.signedUrl) throw new Error('Signed URL generation failed');
  return { path, signedUrl: data.signedUrl };
}

/** 存一張新的全身照，再刪掉舊的（先存後刪：存失敗時舊照片還在） */
export async function replaceBodyPhoto(
  supabase: SupabaseClient,
  userId: string,
  buffer: Buffer,
  contentType: ClosetImageMime
): Promise<BodyPhoto> {
  const stored = await uploadClosetImage(supabase, userId, buffer, contentType, 'body');
  const old = (await listBodyPaths(supabase, userId)).filter((p) => p !== stored.filePath);
  if (old.length > 0) await supabase.storage.from(CLOSET_BUCKET).remove(old);
  return { path: stored.filePath, signedUrl: stored.signedUrl };
}
