// apps/web/app/api/reco/basket-mixmatch/route.ts
// Migrated from pages/api/reco/basket-mixmatch.ts

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // Mock 每日穿搭資料
  // In a real application, you would process req.json() here
  // const body = await req.json(); 
  
  return NextResponse.json({
    recommendations: [
      {
        outfit: {
          id: 'mix-1',
          top: { id: 'top-2', name: '條紋襯衫', category: 'top', imageUrl: 'https://via.placeholder.com/150' },
          bottom: { id: 'bottom-2', name: '卡其褲', category: 'bottom', imageUrl: 'https://via.placeholder.com/150' },
          shoes: { id: 'shoes-2', name: '棕色休閒鞋', category: 'shoes', imageUrl: 'https://via.placeholder.com/150' }
        },
        scores: {
          total: 0.85,
          compatibility: 0.82,
          rules: {
            colorHarmony: 0.8,
            styleConsistency: 0.88
          }
        },
        reasons: ['商品搭配建議', '適合正式場合']
      }
    ],
    totalRecommendations: 2
  }, { status: 200 });
}

// If other methods are not allowed, Next.js will automatically return 405.
