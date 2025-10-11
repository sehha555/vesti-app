import type { NextApiRequest, NextApiResponse } from 'next';
import { v2 as cloudinary } from 'cloudinary';
import formidable from 'formidable';

// Disable Next.js body parser to handle multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

// Configure Cloudinary using environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  timeout: 60000,
  upload_prefix: 'https://api.cloudinary.com', // 使用最近的 CDN
  secure: true, // 強制 HTTPS
});

// Define the response type for this API endpoint
type UploadResponse = {
  url: string;
  publicId: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  optimizedUrl: string;
} | {
  error: string;
};

/**
 * API handler for image uploads.
 */
export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse<UploadResponse>
) {
  // Allow only POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `方法 ${req.method} 不允許` });
  }

  try {
    // Verify that Cloudinary environment variables are set
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('Cloudinary environment variables are not set.');
      return res.status(500).json({ error: '伺服器設定不完整' });
    }

    // Parse the incoming form data
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      keepExtensions: true,
    });
    
    const [fields, files] = await form.parse(req);
    
    // --- File Validation ---
    const file = files.file?.[0];
    if (!file) {
      return res.status(400).json({ error: '請選擇要上傳的圖片檔案' });
    }
    
    // Validate MIME type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype || '')) {
      return res.status(400).json({ 
        error: `不支援的檔案類型。請上傳 JPG, PNG, 或 WebP 格式。 (收到: ${file.mimetype})` 
      });
    }
    
    // --- Upload to Cloudinary ---
    const result = await cloudinary.uploader.upload(file.filepath, {
      folder: 'style-app/wardrobe',
      resource_type: 'image',
      timeout: 60000,
      chunk_size: 6000000,
      
      // === 速度優化 ===
      use_filename: false, // 不使用原始檔名 (加速)
      unique_filename: true, // 自動生成唯一檔名
      overwrite: false, // 不覆蓋現有檔案
      
      // === 轉換優化 ===
      eager_async: true, // 非同步轉換 (不阻塞回應)
      transformation: [
        {
          width: 800,
          height: 800,
          crop: 'limit',
          quality: 'auto:good',
          fetch_format: 'auto'
        }
      ],
      
      // === 額外優化 ===
      invalidate: false, // 不清除 CDN 快取 (加速)
      phash: true, // 生成感知雜湊 (用於去重)
    });

    // 記錄上傳效能
    console.log('Upload performance:', {
      originalSize: file.size,
      uploadedSize: result.bytes,
      compression: ((1 - result.bytes / (file.size || 1)) * 100).toFixed(1) + '%',
      format: result.format,
      dimensions: result.width + 'x' + result.height
    });
    
    // --- Return Success Response ---
    return res.status(200).json({
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      // 提供優化後的 URL (如果需要)
      optimizedUrl: result.secure_url.replace('/upload/', '/upload/f_auto,q_auto:good/')
    });
    
  } catch (error: any) {
    console.error('Upload API error:', error);

    // Handle timeout errors
    if (error?.name === 'TimeoutError' || error?.http_code === 499) {
      return res.status(408).json({ 
        error: '上傳逾時,請檢查網路連線或使用較小的圖片' 
      });
    }

    // Handle file size errors from formidable
    if (error?.message?.includes('maxFileSize exceeded')) {
      return res.status(400).json({ error: '檔案大小不能超過 10MB' });
    }

    // Handle Cloudinary authentication errors
    if (error?.http_code === 401) {
      console.error('Cloudinary authentication failed');
      return res.status(500).json({ 
        error: '伺服器設定錯誤,請聯繫管理員' 
      });
    }

    // Handle other Cloudinary-specific errors
    if (error?.http_code) {
      return res.status(500).json({ 
        error: `上傳失敗 (${error.http_code}): ${error.message || '未知錯誤'}`
      });
    }

    // Generic fallback error
    return res.status(500).json({ 
      error: '圖片上傳失敗,請稍後再試' 
    });
  }
}
