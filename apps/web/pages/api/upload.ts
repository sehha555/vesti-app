import type { NextApiRequest, NextApiResponse } from 'next';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import formidable from 'formidable';
import { removeBackgroundFromImageUrl } from 'remove.bg';
import { Readable } from 'stream';
import type { Occasion, WardrobeItem } from '../../../../packages/types/src/wardrobe';

// Disable Next.js body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Define the response type
type UploadResponse = {
  success: boolean;
  wardrobeItem?: WardrobeItem;
  originalUrl: string;
  removedBgUrl?: string;
  backgroundRemoved: boolean;
  width: number;
  height: number;
  format: string;
  processingTime?: number;
  error?: string;
};

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UploadResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `方法 ${req.method} 不允許` });
  }

  const startTime = Date.now();

  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('Cloudinary environment variables are not set.');
      return res.status(500).json({ error: '伺服器設定不完整' });
    }

    const form = formidable({ maxFileSize: 10 * 1024 * 1024, keepExtensions: true });
    const [fields, files] = await form.parse(req);
    
    const file = files.file?.[0];
    if (!file) {
      return res.status(400).json({ error: '請選擇要上傳的圖片檔案' });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype || '')) {
      return res.status(400).json({ error: `不支援的檔案類型。請上傳 JPG, PNG, 或 WebP 格式。 (收到: ${file.mimetype})` });
    }

    // 1. Upload original image
    const originalResult = await cloudinary.uploader.upload(file.filepath, {
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
        // Fail gracefully, the original image is still available
      }
    } else {
      console.warn('REMOVE_BG_API_KEY is not set. Skipping background removal.');
    }

    const userId = fields.userId?.[0];
    
    // If no userId, perform old behavior (backward compatibility)
    if (!userId) {
      const processingTime = (Date.now() - startTime) / 1000;
      return res.status(200).json({
        success: true,
        originalUrl: originalResult.secure_url,
        removedBgUrl,
        backgroundRemoved,
        width: originalResult.width,
        height: originalResult.height,
        format: originalResult.format,
        processingTime,
        error: backgroundRemoved ? undefined : '去背失敗，但原圖已上傳。',
      });
    }

    // 3. Create Wardrobe Item
    const { name, type, season, colors, purchased, style, material, pattern, occasions, customTags } = fields;

    if (!name?.[0] || !type?.[0]) {
      return res.status(400).json({ error: '`name` and `type` are required fields.' });
    }

    // Parse occasions if provided
    let parsedOccasions: Occasion[] | undefined;
    if (occasions && occasions[0] && typeof occasions[0] === 'string') {
      try {
        parsedOccasions = JSON.parse(occasions[0]);
      } catch {
        parsedOccasions = undefined;
      }
    }

    // Parse customTags
    let parsedCustomTags: string[] | undefined;
    if (customTags && customTags[0] && typeof customTags[0] === 'string') {
      try {
        parsedCustomTags = JSON.parse(customTags[0]);
      } catch {
        parsedCustomTags = undefined;
      }
    }

    const response = await fetch('http://localhost:3000/api/wardrobe/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        name: name[0],
        type: type[0].toLowerCase(),
        source: 'upload',
        image_url: removedBgUrl || originalResult.secure_url,
        original_image_url: originalResult.secure_url,
        colors: colors?.[0] ? JSON.parse(colors[0]) : [],
        season: season?.[0] || 'allseason',
        style: style?.[0],
        material: material?.[0],
        pattern: pattern?.[0],
        occasion: parsedOccasions,
        custom_tags: parsedCustomTags,
        purchased: purchased?.[0] === 'true',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to create wardrobe item:', errorData);
      throw new Error('Failed to create wardrobe item');
    }

    const wardrobeItem = await response.json();
    
    const processingTime = (Date.now() - startTime) / 1000;
    console.log(`Total processing time: ${processingTime.toFixed(2)}s`);

    // 4. Return enhanced response
    return res.status(201).json({
      success: true,
      wardrobeItem,
      originalUrl: originalResult.secure_url,
      removedBgUrl,
      backgroundRemoved,
      width: originalResult.width,
      height: originalResult.height,
      format: originalResult.format,
      processingTime,
    });

  } catch (error: any) {
    console.error('Upload API error:', error);
    if (error?.message?.includes('maxFileSize exceeded')) {
      return res.status(400).json({ error: '檔案大小不能超過 10MB' });
    }
    return res.status(500).json({ error: '圖片上傳失敗，請稍後再試' });
  }
}
