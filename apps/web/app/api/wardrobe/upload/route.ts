// apps/web/app/api/wardrobe/upload/route.ts
// POST /api/wardrobe/upload - Upload wardrobe item with image processing
// Security: BFF dual auth, service role for DB writes, sanitized errors

import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { removeBackgroundFromImageUrl } from 'remove.bg';
import { Readable } from 'stream';
import { createClient } from '@supabase/supabase-js';
import { requireBffAuth } from '../../_middleware/auth';

// Force Node.js runtime for stream compatibility (required for Cloudinary upload_stream)
export const runtime = 'nodejs';

// Initialize Supabase admin client with service role key (server-side only)
function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Database configuration incomplete');
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Allowed file types and size limit
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface ErrorResponse {
  error: string;
  code?: string;
}

// Helper to upload a buffer to Cloudinary
const uploadStream = (buffer: Buffer, options: object): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (result) {
        resolve(result);
      } else {
        reject(error);
      }
    });
    Readable.from(buffer).pipe(stream);
  });
};

/**
 * POST /api/wardrobe/upload
 * Uploads a wardrobe item image with optional background removal.
 *
 * Security:
 * - BFF dual-layer authentication (userId from session, NOT from formData)
 * - Service role key for DB writes (not exposed)
 * - Sanitized error responses (no internal details)
 *
 * FormData fields:
 * - file: Image file (required, max 10MB, JPG/PNG/WebP)
 * - name: Item name (required)
 * - type: Item type (required: top/bottom/outerwear/shoes/accessory)
 * - colors: JSON array of colors (optional)
 * - season: Season (optional)
 * - style: Style (optional)
 * - material: Material (optional)
 * - pattern: Pattern (optional)
 * - occasions: JSON array of occasions (optional)
 * - customTags: JSON array of custom tags (optional)
 * - purchased: Boolean string (optional)
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // 1. BFF dual-layer authentication (userId from session, NOT from formData)
    const authResult = await requireBffAuth(req);
    if (!authResult.authorized) {
      return authResult.error!;
    }

    const userId = authResult.userId!;

    // 2. Validate Cloudinary configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('[Upload] Cloudinary configuration incomplete');
      return NextResponse.json<ErrorResponse>(
        { error: '圖片上傳失敗，請稍後再試', code: 'UPLOAD_FAILED' },
        { status: 500 }
      );
    }

    // 3. Parse FormData
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json<ErrorResponse>(
        { error: '無效的請求格式', code: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }

    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json<ErrorResponse>(
        { error: '請選擇要上傳的圖片檔案', code: 'FILE_REQUIRED' },
        { status: 400 }
      );
    }

    // 4. File validation
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json<ErrorResponse>(
        { error: '不支援的檔案類型。請上傳 JPG, PNG, 或 WebP 格式。', code: 'INVALID_FILE_TYPE' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json<ErrorResponse>(
        { error: '檔案大小不能超過 10MB', code: 'FILE_TOO_LARGE' },
        { status: 400 }
      );
    }

    // 5. Validate required fields
    const name = formData.get('name') as string;
    const type = formData.get('type') as string;

    if (!name || !type) {
      return NextResponse.json<ErrorResponse>(
        { error: '名稱和類型為必填欄位', code: 'MISSING_REQUIRED_FIELDS' },
        { status: 400 }
      );
    }

    const validTypes = ['top', 'bottom', 'outerwear', 'shoes', 'accessory'];
    if (!validTypes.includes(type.toLowerCase())) {
      return NextResponse.json<ErrorResponse>(
        { error: '無效的衣物類型', code: 'INVALID_TYPE' },
        { status: 400 }
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // 6. Upload original image to Cloudinary
    const originalResult = await uploadStream(fileBuffer, {
      folder: 'style-app/wardrobe',
      resource_type: 'image',
      transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto:good' }],
      phash: true,
    });

    let removedBgUrl: string | undefined = undefined;
    let backgroundRemoved = false;

    // 7. Remove background if API key is available
    if (process.env.REMOVE_BG_API_KEY) {
      try {
        const removeBgResult = await removeBackgroundFromImageUrl({
          url: originalResult.secure_url,
          apiKey: process.env.REMOVE_BG_API_KEY,
          size: 'auto',
          type: 'auto',
          format: 'png',
        });
        const buffer = Buffer.from(removeBgResult.base64img, 'base64');
        const uploadedRemovedBg = await uploadStream(buffer, {
          folder: 'style-app/wardrobe',
          public_id: `${originalResult.public_id}_nobg`,
          resource_type: 'image',
        });
        removedBgUrl = uploadedRemovedBg.secure_url;
        backgroundRemoved = true;
      } catch (removeBgError) {
        // Log without exposing details
        console.error('[Upload] Background removal failed');
      }
    }

    // 8. Parse optional JSON fields safely
    const parseJsonField = (field: string | null, defaultValue: unknown = null): unknown => {
      if (!field) return defaultValue;
      try {
        return JSON.parse(field);
      } catch {
        return defaultValue;
      }
    };

    // 9. Build item for database (userId from auth, NOT from formData)
    const newItem = {
      user_id: userId, // From BFF auth session, NOT from formData
      name: name.trim(),
      type: type.toLowerCase(),
      source: 'upload',
      image_url: removedBgUrl || originalResult.secure_url,
      original_image_url: originalResult.secure_url,
      colors: parseJsonField(formData.get('colors') as string, []),
      season: (formData.get('season') as string) || 'all-season',
      style: formData.get('style') as string | null,
      material: formData.get('material') as string | null,
      pattern: formData.get('pattern') as string | null,
      occasion: parseJsonField(formData.get('occasions') as string, null),
      custom_tags: parseJsonField(formData.get('customTags') as string, []),
      purchased: formData.get('purchased') === 'true',
    };

    // 10. Insert to database using service role (server-side key)
    const supabaseAdmin = getSupabaseAdmin();
    const { data: wardrobeItem, error: dbError } = await supabaseAdmin
      .from('clothing_items')
      .insert([newItem])
      .select()
      .single();

    if (dbError) {
      // Log without exposing DB details
      console.error('[Upload] Database insert failed');
      return NextResponse.json<ErrorResponse>(
        { error: '圖片上傳失敗，請稍後再試', code: 'UPLOAD_FAILED' },
        { status: 500 }
      );
    }

    const processingTime = (Date.now() - startTime) / 1000;
    console.log(`[Upload] Success for user, processing time: ${processingTime.toFixed(2)}s`);

    // 11. Return success response (no sensitive data)
    return NextResponse.json(
      {
        success: true,
        wardrobeItem,
        originalUrl: originalResult.secure_url,
        removedBgUrl,
        backgroundRemoved,
        width: originalResult.width,
        height: originalResult.height,
        format: originalResult.format,
        processingTime,
      },
      { status: 201 }
    );
  } catch (error) {
    // Log error without exposing to client
    console.error('[Upload] Unexpected error:', error instanceof Error ? error.message : 'Unknown');

    // Sanitized error response - NO internal details
    return NextResponse.json<ErrorResponse>(
      { error: '圖片上傳失敗，請稍後再試', code: 'UPLOAD_FAILED' },
      { status: 500 }
    );
  }
}

// GET method not allowed
export async function GET(): Promise<NextResponse<ErrorResponse>> {
  return NextResponse.json<ErrorResponse>(
    { error: 'Method not allowed. Use POST.', code: 'METHOD_NOT_ALLOWED' },
    { status: 405 }
  );
}
