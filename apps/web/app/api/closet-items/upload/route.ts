import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { getSupabaseAndUser } from '@/lib/supabase/server';

// Force Node.js runtime for stream compatibility
export const runtime = 'nodejs';

// File constraints
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const BUCKET_NAME = 'closet-images';

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
 * Optionally removes background using remove.bg API.
 *
 * FormData fields:
 * - file: Image file (required, max 10MB, JPG/PNG/WebP)
 * - name: Item name (required)
 * - category: Item category (required)
 * - ...other closet_item fields (optional)
 *
 * Returns: 201 { data: ClosetItem, imageUrl, removedBgUrl? }
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
  const metadata: Record<string, string | null> = {};
  for (const key of ['name', 'category', 'subcategory', 'brand', 'color', 'size', 'season', 'tags', 'custom_group', 'is_archived', 'status', 'acquired_at']) {
    const value = formData.get(key);
    metadata[key] = value ? String(value) : null;
  }

  const parsed = UploadMetadataSchema.safeParse(metadata);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // Generate unique filename
  const fileId = randomUUID();
  const ext = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp';
  const filePath = `${user.id}/${fileId}.${ext}`;

  // Read file buffer
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, fileBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error('[closet-items/upload] Storage upload error:', uploadError.message);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }

  // Get public URL (signed URL for private bucket)
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  let imageUrl = urlData.publicUrl;
  let removedBgUrl: string | undefined;

  // Optional: Remove background using remove.bg API
  if (process.env.REMOVE_BG_API_KEY) {
    try {
      const { removeBackgroundFromImageUrl } = await import('remove.bg');
      const removeBgResult = await removeBackgroundFromImageUrl({
        url: imageUrl,
        apiKey: process.env.REMOVE_BG_API_KEY,
        size: 'auto',
        type: 'auto',
        format: 'png',
      });

      const noBgBuffer = Buffer.from(removeBgResult.base64img, 'base64');
      const noBgPath = `${user.id}/${fileId}_nobg.png`;

      const { error: noBgUploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(noBgPath, noBgBuffer, {
          contentType: 'image/png',
          upsert: false,
        });

      if (!noBgUploadError) {
        const { data: noBgUrlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(noBgPath);
        removedBgUrl = noBgUrlData.publicUrl;
        // Use background-removed image as main image
        imageUrl = removedBgUrl;
      }
    } catch (removeBgError) {
      console.error('[closet-items/upload] Background removal failed');
      // Continue without background removal
    }
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
    image_url: imageUrl,
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
    // Attempt to clean up uploaded files
    await supabase.storage.from(BUCKET_NAME).remove([filePath]);
    if (removedBgUrl) {
      await supabase.storage.from(BUCKET_NAME).remove([`${user.id}/${fileId}_nobg.png`]);
    }
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }

  return NextResponse.json(
    {
      data: closetItem as ClosetItem,
      imageUrl,
      removedBgUrl,
    },
    { status: 201 }
  );
}
