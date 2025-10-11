import type { NextApiRequest, NextApiResponse } from 'next';
import { v2 as cloudinary } from 'cloudinary';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    
    // Test API connection
    const result = await cloudinary.api.ping();
    
    return res.status(200).json({
      message: 'Cloudinary 連線成功!',
      status: result.status,
      config: {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key_set: !!process.env.CLOUDINARY_API_KEY,
        api_secret_set: !!process.env.CLOUDINARY_API_SECRET,
      }
    });
    
  } catch (error: any) {
    console.error('Cloudinary connection test failed:', error);
    return res.status(500).json({
      error: 'Cloudinary 連線失敗',
      message: error.message,
      http_code: error.http_code
    });
  }
}
