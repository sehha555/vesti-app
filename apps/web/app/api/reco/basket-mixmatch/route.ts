// apps/web/app/api/reco/basket-mixmatch/route.ts
// Migrated from pages/api/reco/basket-mixmatch.ts

import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const basketIdsParam = searchParams.get('basketIds');

  if (!userId || !basketIdsParam) {
    return NextResponse.json(
      { error: '缺少必要參數：userId 與 basketIds 均需提供' },
      { status: 400 },
    );
  }

  const basketIds = basketIdsParam
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);

  if (basketIds.length === 0) {
    return NextResponse.json(
      { error: 'basketIds 需至少包含一個有效 ID' },
      { status: 400 },
    );
  }

  const baseRecommendation = {
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
  };

  const recommendations = basketIds.map((basketId, index) => ({
    ...baseRecommendation,
    basketId,
    outfit: {
      ...baseRecommendation.outfit,
      id: `mix-${index + 1}-${basketId}`,
    },
    scores: {
      ...baseRecommendation.scores,
      total: Number((0.8 + index * 0.02).toFixed(2)),
    },
  }));

  return NextResponse.json({
    userId,
    basketIds,
    recommendations,
    totalRecommendations: recommendations.length
  }, { status: 200 });
}

// If other methods are not allowed, Next.js will automatically return 405.
