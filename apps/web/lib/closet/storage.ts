import { randomUUID } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

export const CLOSET_BUCKET = 'closet-images';

// 與 closet-items/upload 一致：預設 300 秒、上限 900 秒
export const SIGNED_URL_EXPIRES_SECONDS = Math.min(
  parseInt(process.env.SIGNED_URL_EXPIRES_SECONDS || '300', 10) || 300,
  900
);

export type ClosetImageMime = 'image/jpeg' | 'image/png' | 'image/webp';

const EXT_BY_MIME: Record<ClosetImageMime, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export function isClosetImageMime(mime: string): mime is ClosetImageMime {
  return mime in EXT_BY_MIME;
}

/**
 * DB 的 image_url 存的是 signed URL（含 token），這裡反推回 bucket 內的路徑。
 * 格式：https://{project}.supabase.co/storage/v1/object/sign/closet-images/{user_id}/{file}?token=...
 * 不是 URL 的話視為直接就是路徑。
 */
export function storagePathFromImageUrl(imageUrl: string): string {
  try {
    const url = new URL(imageUrl);
    const match = url.pathname.match(/\/closet-images\/(.+)$/);
    return match ? match[1] : imageUrl;
  } catch {
    return imageUrl;
  }
}

export interface StoredImage {
  filePath: string;
  signedUrl: string;
  expiresAt: string;
}

/**
 * 上傳一張圖到使用者自己的資料夾並回簽章網址。上傳成功但簽章失敗時會把檔案刪掉。
 */
export async function uploadClosetImage(
  supabase: SupabaseClient,
  userId: string,
  buffer: Buffer,
  contentType: ClosetImageMime
): Promise<StoredImage> {
  const filePath = `${userId}/${randomUUID()}.${EXT_BY_MIME[contentType]}`;

  const { error: uploadError } = await supabase.storage
    .from(CLOSET_BUCKET)
    .upload(filePath, buffer, { contentType, upsert: false });
  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`);
  }

  const { data, error: signError } = await supabase.storage
    .from(CLOSET_BUCKET)
    .createSignedUrl(filePath, SIGNED_URL_EXPIRES_SECONDS);
  if (signError || !data?.signedUrl) {
    await supabase.storage.from(CLOSET_BUCKET).remove([filePath]);
    throw new Error('Signed URL generation failed');
  }

  return {
    filePath,
    signedUrl: data.signedUrl,
    expiresAt: new Date(Date.now() + SIGNED_URL_EXPIRES_SECONDS * 1000).toISOString(),
  };
}

/**
 * 批次替 items 的 image_url 重新簽章。只處理屬於該使用者資料夾的路徑，其餘略過。
 * 回傳 Map<item.id, 新的 signed URL>；簽不出來的 item 不會出現在 Map 裡。
 */
export async function freshSignedUrls(
  supabase: SupabaseClient,
  userId: string,
  items: Array<{ id: string; image_url: string | null }>
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const paths: Array<{ id: string; path: string }> = [];
  for (const item of items) {
    if (!item.image_url) continue;
    const path = storagePathFromImageUrl(item.image_url);
    if (path.startsWith(`${userId}/`)) paths.push({ id: item.id, path });
  }
  if (paths.length === 0) return result;

  const { data, error } = await supabase.storage
    .from(CLOSET_BUCKET)
    .createSignedUrls(
      paths.map((p) => p.path),
      SIGNED_URL_EXPIRES_SECONDS
    );
  if (error || !data) return result;

  data.forEach((entry, i) => {
    if (entry.signedUrl) result.set(paths[i].id, entry.signedUrl);
  });
  return result;
}

/**
 * 直接從 Storage 下載圖片 bytes（給模型餵 base64 用，不經過 signed URL）。
 */
export async function downloadClosetImage(
  supabase: SupabaseClient,
  filePath: string
): Promise<{ buffer: Buffer; mimeType: string }> {
  const { data, error } = await supabase.storage.from(CLOSET_BUCKET).download(filePath);
  if (error || !data) {
    throw new Error(`Storage download failed: ${error?.message ?? 'no data'}`);
  }
  return { buffer: Buffer.from(await data.arrayBuffer()), mimeType: data.type || 'image/jpeg' };
}
