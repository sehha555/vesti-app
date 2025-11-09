// apps/web/app/api/test-cloudinary/route.ts
// Migrated from pages/api/test-cloudinary.ts

import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

export async function GET(req: NextRequest) {
  try {
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    
    // Test API connection
    const result = await cloudinary.api.ping();
    
    return NextResponse.json({
      message: 'Cloudinary 連線成功!',
      status: result.status,
      config: {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key_set: !!process.env.CLOUDINARY_API_KEY,
        api_secret_set: !!process.env.CLOUDINARY_API_SECRET,
      }
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Cloudinary connection test failed:', error);
    return NextResponse.json({
      error: 'Cloudinary 連線失敗',
      message: error.message,
      http_code: error.http_code
    }, { status: 500 });
  }
}
