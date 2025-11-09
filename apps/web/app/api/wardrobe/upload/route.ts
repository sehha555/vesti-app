// apps/web/app/api/wardrobe/upload/route.ts
// Migrated and refactored from pages/api/upload.ts

import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { removeBackgroundFromImageUrl } from 'remove.bg';
import { Readable } from 'stream';
import type { Occasion, WardrobeItem } from '../../../../../packages/types/src/wardrobe';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client directly
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

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

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('Cloudinary environment variables are not set.');
      return NextResponse.json({ error: '伺服器設定不完整' }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: '請選擇要上傳的圖片檔案' }, { status: 400 });
    }

    // File validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: `不支援的檔案類型。請上傳 JPG, PNG, 或 WebP 格式。 (收到: ${file.type})` }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: '檔案大小不能超過 10MB' }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // 1. Upload original image
    const originalResult = await uploadStream(fileBuffer, {
      folder: 'style-app/wardrobe',
      resource_type: 'image',
      transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto:good' }],
      phash: true,
    });

    let removedBgUrl: string | undefined = undefined;
    let backgroundRemoved = false;

    // 2. Remove background if API key is available
    if (process.env.REMOVE_BG_API_KEY) {
      try {
        const removeBgResult = await removeBackgroundFromImageUrl({
          url: originalResult.secure_url,
          apiKey: process.env.REMOVE_BG_API_KEY!,
          size: 'auto',
          type: 'auto',
          format: 'png'
        });
        const buffer = Buffer.from(removeBgResult.base64img, 'base64');
        const uploadedRemovedBg = await uploadStream(buffer, {
          folder: 'style-app/wardrobe',
          public_id: `${originalResult.public_id}_nobg`,
          resource_type: 'image',
        });
        removedBgUrl = uploadedRemovedBg.secure_url;
        backgroundRemoved = true;
      } catch (removeBgError: any) {
        console.error('Remove.bg API error:', removeBgError.message || removeBgError);
      }
    } else {
      console.warn('REMOVE_BG_API_KEY is not set. Skipping background removal.');
    }

    const userId = formData.get('userId') as string;
    if (!userId) {
        return NextResponse.json({ error: '`userId` is a required field.' }, { status: 400 });
    }

    // 3. Create Wardrobe Item directly using Supabase client
    const name = formData.get('name') as string;
    const type = formData.get('type') as string;

    if (!name || !type) {
      return NextResponse.json({ error: '`name` and `type` are required fields.' }, { status: 400 });
    }
    
    const newItem = {
        user_id: userId,
        name: name,
        type: type.toLowerCase(),
        source: 'upload',
        image_url: removedBgUrl || originalResult.secure_url,
        original_image_url: originalResult.secure_url,
        colors: JSON.parse(formData.get('colors') as string || '[]'),
        season: formData.get('season') as string || 'allseason',
        style: formData.get('style') as string,
        material: formData.get('material') as string,
        pattern: formData.get('pattern') as string,
        occasion: JSON.parse(formData.get('occasions') as string || 'null'),
        custom_tags: JSON.parse(formData.get('customTags') as string || '[]'),
        purchased: formData.get('purchased') === 'true',
    };

    const { data: wardrobeItem, error: dbError } = await supabase
      .from('clothing_items')
      .insert([newItem])
      .select()
      .single();

    if (dbError) {
      console.error('Supabase insert error:', dbError);
      throw new Error('Failed to create wardrobe item in database');
    }
    
    const processingTime = (Date.now() - startTime) / 1000;
    console.log(`Total processing time: ${processingTime.toFixed(2)}s`);

    // 4. Return enhanced response
    return NextResponse.json({
      success: true,
      wardrobeItem,
      originalUrl: originalResult.secure_url,
      removedBgUrl,
      backgroundRemoved,
      width: originalResult.width,
      height: originalResult.height,
      format: originalResult.format,
      processingTime,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Upload API error:', error);
    return NextResponse.json({ error: '圖片上傳失敗，請稍後再試', details: error.message }, { status: 500 });
  }
}
