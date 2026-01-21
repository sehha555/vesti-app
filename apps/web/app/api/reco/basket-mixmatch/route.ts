// apps/web/app/api/reco/basket-mixmatch/route.ts
// Basket mix-and-match outfit recommendations with security hardening
// Security: Authentication required + rate limiting + no-store cache

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAndUser } from '../../../../lib/supabase/server';
import { jsonNoStore } from '../../../../lib/http/no-store';
import { checkRateLimit } from '../../../../lib/rateLimit';
import { logSecurityEvent } from '../../../../lib/metrics';

export async function GET(req: NextRequest) {
  try {
    // === 認證使用者 ===
    const { user } = await getSupabaseAndUser();
    if (!user) {
      logSecurityEvent({
        endpoint: '/api/reco/basket-mixmatch',
        statusCode: 401,
        reason: 'auth_required',
        userAgent: req.headers.get('user-agent') || '',
      });
      return jsonNoStore(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // === 限流檢查 (昂貴端點：組合爆炸風險) ===
    const RATE_LIMIT_CONFIG = {
      windowMs: 60 * 1000, // 60 seconds
      maxRequests: 10, // 10 requests per minute per user
      keyPrefix: 'basket-mixmatch',
    };
    const rateLimitResult = await checkRateLimit(user.id, RATE_LIMIT_CONFIG);
    if (!rateLimitResult.allowed) {
      logSecurityEvent({
        endpoint: '/api/reco/basket-mixmatch',
        statusCode: 429,
        reason: 'forbidden',
        userAgent: req.headers.get('user-agent') || '',
      });
      return jsonNoStore(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'RateLimit-Limit': String(rateLimitResult.limit),
            'RateLimit-Remaining': String(rateLimitResult.remaining),
            'RateLimit-Reset': String(rateLimitResult.resetAfter),
            'Retry-After': String(rateLimitResult.retryAfter ?? rateLimitResult.resetAfter),
          },
        }
      );
    }

    const { searchParams } = new URL(req.url);
    const basketIdsParam = searchParams.get('basketIds');

    if (!basketIdsParam) {
      return jsonNoStore(
        { error: 'Missing required parameter: basketIds' },
        { status: 400 }
      );
    }

    const basketIds = basketIdsParam
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    if (basketIds.length === 0) {
      return jsonNoStore(
        { error: 'basketIds must contain at least one valid ID' },
        { status: 400 }
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

    return jsonNoStore({
      userId: user.id,
      basketIds,
      recommendations,
      totalRecommendations: recommendations.length
    }, { status: 200 });
  } catch (error) {
    console.error('[API /api/reco/basket-mixmatch GET] Error:', error);
    return jsonNoStore(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST not allowed
export async function POST(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Method not allowed. Use GET.' },
    {
      status: 405,
      headers: { 'Cache-Control': 'private, no-store' }
    }
  );
}
