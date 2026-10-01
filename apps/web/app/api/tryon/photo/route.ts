import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/http/require-user';
import { jsonNoStore } from '@/lib/http/no-store';
import { isClosetImageMime } from '@/lib/closet/storage';
import { verifyFileSignature } from '@/lib/security/file-signature';
import { getBodyPhoto, replaceBodyPhoto } from '@/lib/tryon/body-photo';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const UPLOAD_RATE_LIMIT = { keyPrefix: 'tryon-photo', maxRequests: 10, windowMs: 600_000 };

/**
 * GET /api/tryon/photo
 * 目前的試穿用全身照。Returns: 200 { photo: { url } | null }
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  const { supabase, user } = auth;

  try {
    const photo = await getBodyPhoto(supabase, user.id);
    return jsonNoStore({ photo: photo ? { url: photo.signedUrl } : null });
  } catch (err) {
    console.error('[tryon/photo] get failed:', (err as Error).message);
    return jsonNoStore({ error: '讀取照片失敗' }, { status: 500 });
  }
}

/**
 * POST /api/tryon/photo
 * 上傳試穿用全身照（取代舊的）。FormData: file（JPEG / PNG / WebP，最大 10MB）
 * Returns: 201 { photo: { url } }
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = await requireUser(req, UPLOAD_RATE_LIMIT);
  if (auth.response) return auth.response;
  const { supabase, user } = auth;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return jsonNoStore({ error: '請用表單上傳圖片' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return jsonNoStore({ error: '請選擇一張圖片' }, { status: 400 });
  }
  if (!isClosetImageMime(file.type)) {
    return jsonNoStore({ error: '圖片格式不支援（只接受 JPEG / PNG / WebP）' }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return jsonNoStore({ error: '圖片太大，最大 10MB' }, { status: 400 });
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!verifyFileSignature(buffer, file.type).valid) {
    return jsonNoStore({ error: '檔案內容不是有效的圖檔' }, { status: 400 });
  }

  try {
    const photo = await replaceBodyPhoto(supabase, user.id, buffer, file.type);
    return jsonNoStore({ photo: { url: photo.signedUrl } }, { status: 201 });
  } catch (err) {
    console.error('[tryon/photo] upload failed:', (err as Error).message);
    return jsonNoStore({ error: '圖片儲存失敗' }, { status: 500 });
  }
}
