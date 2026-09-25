import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/http/require-user';
import { jsonNoStore } from '@/lib/http/no-store';
import { isClosetImageMime } from '@/lib/closet/storage';
import { CLOSET_CATEGORIES } from '@/lib/closet/categories';
import { createClosetItemFromImage } from '@/lib/closet/create-item';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const RATE_LIMIT = { keyPrefix: 'closet-upload', maxRequests: 10, windowMs: 600_000 };

const MetadataSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  category: z.enum(CLOSET_CATEGORIES).optional(),
});

const CREATE_ERRORS = {
  BAD_MIME: { status: 400, error: '圖片格式不支援（只接受 JPEG / PNG / WebP）' },
  BAD_SIGNATURE: { status: 400, error: '檔案內容不是有效的圖檔' },
  STORAGE: { status: 500, error: '圖片儲存失敗' },
  DB: { status: 500, error: '衣物建立失敗' },
} as const;

/**
 * POST /api/closet-items/upload
 * 拍照 / 選相簿上傳衣物：跟 from-url 共用 createClosetItemFromImage（驗簽章 → 去背 → Storage → closet_items）。
 *
 * FormData:
 * - file: 圖片（必填，JPEG / PNG / WebP，最大 10MB）
 * - name: 名稱（選填）
 * - category: 類別（選填，預設 uncategorized）
 *
 * Returns: 201 { data: ClosetItem, imageUrl, expiresAt }
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = await requireUser(req, RATE_LIMIT);
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
    return jsonNoStore({ error: CREATE_ERRORS.BAD_MIME.error }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return jsonNoStore({ error: '圖片太大，最大 10MB' }, { status: 400 });
  }

  const meta = MetadataSchema.safeParse({
    name: formData.get('name') || undefined,
    category: formData.get('category') || undefined,
  });
  if (!meta.success) {
    return jsonNoStore({ error: '名稱或類別不正確' }, { status: 400 });
  }

  const result = await createClosetItemFromImage(
    supabase,
    user.id,
    { buffer: Buffer.from(await file.arrayBuffer()), contentType: file.type },
    { name: meta.data.name ?? '未命名衣物', category: meta.data.category ?? 'uncategorized' }
  );
  if (result.error) {
    const { status, error } = CREATE_ERRORS[result.error];
    return jsonNoStore({ error }, { status });
  }

  return jsonNoStore({ data: result.data, imageUrl: result.imageUrl, expiresAt: result.expiresAt }, { status: 201 });
}
