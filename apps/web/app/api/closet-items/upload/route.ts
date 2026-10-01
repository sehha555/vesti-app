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

const MetadataSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    category: z.enum(CLOSET_CATEGORIES).optional(),
    color: z.string().trim().max(50).optional(),
    brand: z.string().trim().max(100).optional(),
    size: z.string().trim().max(50).optional(),
    tags: z.array(z.string().trim().min(1).max(30)).max(10).optional(),
    // 只開放兩種：拍照上傳、外部訂單截圖；網址匯入與站內購買各有自己的路徑
    source_type: z.enum(['UPLOAD', 'EXTERNAL_ORDER']).optional(),
    source_ref_id: z.string().trim().min(1).max(100).optional(),
  })
  .refine((d) => !d.source_ref_id || d.source_type === 'EXTERNAL_ORDER', {
    message: 'source_ref_id 只能搭配 EXTERNAL_ORDER',
    path: ['source_ref_id'],
  });

// 表單沒帶的欄位當作沒填；tags 是 JSON 字串
function readMetadata(formData: FormData) {
  const field = (key: string) => {
    const v = formData.get(key);
    return typeof v === 'string' && v.trim() ? v : undefined;
  };
  let tags: unknown;
  try {
    tags = field('tags') ? JSON.parse(field('tags')!) : undefined;
  } catch {
    tags = undefined;
  }
  return {
    name: field('name'),
    category: field('category'),
    color: field('color'),
    brand: field('brand'),
    size: field('size'),
    tags,
    source_type: field('source_type'),
    source_ref_id: field('source_ref_id'),
  };
}

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
 * - category: 類別（選填；沒填或未分類時用 AI 辨識的類別）
 * - color / brand / size / tags(JSON 字串)：選填，有填就蓋過 AI 辨識
 * - source_type: UPLOAD（預設）或 EXTERNAL_ORDER；source_ref_id 只能搭配 EXTERNAL_ORDER
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

  const meta = MetadataSchema.safeParse(readMetadata(formData));
  if (!meta.success) {
    return jsonNoStore({ error: '欄位格式不正確', errors: meta.error.flatten().fieldErrors }, { status: 400 });
  }
  const { name, category, color, brand, size, tags, source_type, source_ref_id } = meta.data;

  const result = await createClosetItemFromImage(
    supabase,
    user.id,
    { buffer: Buffer.from(await file.arrayBuffer()), contentType: file.type },
    {
      name,
      category: category ?? 'uncategorized',
      color,
      brand,
      size,
      tags,
      sourceType: source_type ?? 'UPLOAD',
      sourceRefId: source_ref_id,
    }
  );
  if (result.error) {
    const { status, error } = CREATE_ERRORS[result.error];
    return jsonNoStore({ error }, { status });
  }

  return jsonNoStore({ data: result.data, imageUrl: result.imageUrl, expiresAt: result.expiresAt }, { status: 201 });
}
