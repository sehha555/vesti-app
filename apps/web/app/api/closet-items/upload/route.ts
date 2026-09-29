import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAndUser } from '@/lib/supabase/server';
import { removeBackground } from '../../../../lib/closet/remove-bg';
import { uploadClosetImage, CLOSET_BUCKET, type ClosetImageMime } from '../../../../lib/closet/storage';

// Force Node.js runtime for stream compatibility
export const runtime = 'nodejs';

// File constraints
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Zod schema for metadata (whitelist only allowed fields)
const UploadMetadataSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  subcategory: z.string().nullable().optional(),
  brand: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  size: z.string().nullable().optional(),
  season: z.string().nullable().optional(),
  tags: z.string().optional(), // JSON string, will be parsed
  custom_group: z.string().nullable().optional(),
  is_archived: z.string().optional(), // "true" or "false"
  status: z.enum(['ACTIVE', 'ARCHIVED', 'DELETED']).optional(),
  acquired_at: z.string().nullable().optional(),
});

interface ClosetItem {
  id: string;
  user_id: string;
  name: string;
  category: string;
  image_url: string | null;
  [key: string]: unknown;
}

/**
 * POST /api/closet-items/upload
 *
 * Uploads an image to Supabase Storage and creates a closet_item record.
 * 有設 REMOVE_BG_API_KEY 時先去背，存去背後的圖；沒設或失敗就存原圖。
 *
 * FormData fields:
 * - file: Image file (required, max 10MB, JPG/PNG/WebP)
 * - name: Item name (required)
 * - category: Item category (required)
 * - ...other closet_item fields (optional)
 *
 * Returns: 201 { data: ClosetItem, imageUrl, expiresAt }
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const { supabase, user } = await getSupabaseAndUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse FormData
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'File is required' }, { status: 400 });
  }

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Invalid file type. Allowed: JPG, PNG, WebP' },
      { status: 400 }
    );
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: 'File too large. Maximum size: 10MB' },
      { status: 400 }
    );
  }

  // Extract and validate metadata
  // 沒帶的欄位不放進去：is_archived / status 不接受 null，放 null 會讓只填必填欄位的上傳全部 400
  const metadata: Record<string, string> = {};
  for (const key of ['name', 'category', 'subcategory', 'brand', 'color', 'size', 'season', 'tags', 'custom_group', 'is_archived', 'status', 'acquired_at']) {
    const value = formData.get(key);
    if (value) metadata[key] = String(value);
  }

  const parsed = UploadMetadataSchema.safeParse(metadata);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // 去背：與貼網址匯入共用同一支；沒 key 或失敗就存原圖
  let image: { buffer: Buffer; contentType: ClosetImageMime } = {
    buffer: Buffer.from(await file.arrayBuffer()),
    contentType: file.type as ClosetImageMime,
  };
  const removed = await removeBackground(image.buffer, image.contentType);
  if (removed) image = { buffer: removed.buffer, contentType: 'image/png' };

  let stored;
  try {
    stored = await uploadClosetImage(supabase, user.id, image.buffer, image.contentType);
  } catch (err) {
    console.error('[closet-items/upload]', (err as Error).message);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }

  // Parse tags from JSON string
  let tags: string[] = [];
  if (parsed.data.tags) {
    try {
      tags = JSON.parse(parsed.data.tags);
    } catch {
      tags = [];
    }
  }

  // Build closet_item payload (whitelist fields only)
  const itemPayload = {
    user_id: user.id,
    name: parsed.data.name,
    category: parsed.data.category,
    subcategory: parsed.data.subcategory ?? null,
    brand: parsed.data.brand ?? null,
    color: parsed.data.color ?? null,
    size: parsed.data.size ?? null,
    season: parsed.data.season ?? null,
    tags,
    image_url: stored.signedUrl,
    custom_group: parsed.data.custom_group ?? null,
    is_archived: parsed.data.is_archived === 'true',
    status: parsed.data.status ?? 'ACTIVE',
    acquired_at: parsed.data.acquired_at ?? null,
    // Server-enforced fields
    source_type: 'OWNED' as const,
    source_ref_id: null,
  };

  // Insert closet_item record
  const { data: closetItem, error: dbError } = await supabase
    .from('closet_items')
    .insert(itemPayload)
    .select()
    .single();

  if (dbError) {
    console.error('[closet-items/upload] Database insert error:', dbError.message);
    await supabase.storage.from(CLOSET_BUCKET).remove([stored.filePath]);
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }

  return NextResponse.json(
    {
      data: closetItem as ClosetItem,
      imageUrl: stored.signedUrl,
      expiresAt: stored.expiresAt,
    },
    { status: 201 }
  );
}
