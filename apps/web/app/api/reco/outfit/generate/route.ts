// apps/web/app/api/reco/outfit/generate/route.ts
// POST /api/reco/outfit/generate - AI outfit generation
// Security: BFF dual auth required (user session + internal API key) + rate limiting

import { NextRequest, NextResponse } from 'next/server';
import { requireBffAuth } from '../../../_middleware/auth';
import { checkRateLimit } from '../../../../../lib/rateLimit';
import { logSecurityEvent } from '../../../../../lib/metrics';

interface GenerateOutfitRequest {
  occasion?: string;
  weather?: {
    temperature: number;
    condition: string;
  };
  preferences?: {
    styles?: string[];
    colors?: string[];
    excludeItemIds?: string[];
  };
}

interface GeneratedOutfit {
  id: string;
  items: {
    top?: { id: string; name: string; imageUrl: string };
    bottom?: { id: string; name: string; imageUrl: string };
    shoes?: { id: string; name: string; imageUrl: string };
    outerwear?: { id: string; name: string; imageUrl: string };
  };
  score: number;
  reasons: string[];
}

interface GenerateOutfitResponse {
  ok: boolean;
  outfits?: GeneratedOutfit[];
  message?: string;
}

interface ErrorResponse {
  error: string;
  code?: string;
}

/**
 * POST /api/reco/outfit/generate
 * Generates AI-powered outfit recommendations.
 *
 * Security: Requires BFF dual-layer authentication
 * - Valid user session (Supabase auth)
 * - Valid internal API key (X-API-Key header)
 *
 * Request body:
 * {
 *   "occasion": "casual" | "formal" | "work" | etc,
 *   "weather": { "temperature": number, "condition": string },
 *   "preferences": { "styles": string[], "colors": string[], "excludeItemIds": string[] }
 * }
 *
 * Response: Array of generated outfit recommendations
 */
export async function POST(req: NextRequest): Promise<NextResponse<GenerateOutfitResponse | ErrorResponse>> {
  try {
    // 1. BFF dual-layer authentication (user session + internal API key)
    const authResult = await requireBffAuth(req);
    if (!authResult.authorized) {
      logSecurityEvent({
        endpoint: '/api/reco/outfit/generate',
        statusCode: 401,
        reason: 'auth_required',
        userAgent: req.headers.get('user-agent') || '',
      });
      return authResult.error! as NextResponse<ErrorResponse>;
    }

    const userId = authResult.userId!;

    // 2. Rate limiting check (昂貴端點：AI 調用)
    const RATE_LIMIT_CONFIG = {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 10, // 10 requests per hour per user
      keyPrefix: 'outfit-generate',
    };
    const rateLimitResult = await checkRateLimit(userId, RATE_LIMIT_CONFIG);
    if (!rateLimitResult.allowed) {
      logSecurityEvent({
        endpoint: '/api/reco/outfit/generate',
        statusCode: 429,
        reason: 'forbidden',
        userAgent: req.headers.get('user-agent') || '',
      });
      return NextResponse.json<ErrorResponse>(
        { error: 'Too many requests', code: 'RATE_LIMIT_EXCEEDED' },
        {
          status: 429,
          headers: {
            'RateLimit-Limit': String(rateLimitResult.limit),
            'RateLimit-Remaining': String(rateLimitResult.remaining),
            'RateLimit-Reset': String(rateLimitResult.resetAfter),
            'Retry-After': String(rateLimitResult.retryAfter ?? rateLimitResult.resetAfter),
            'Cache-Control': 'private, no-store',
          },
        }
      );
    }

    // 3. Parse and validate request body
    let body: GenerateOutfitRequest;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json<ErrorResponse>(
        { error: 'Invalid JSON body', code: 'INVALID_JSON' },
        { status: 400, headers: { 'Cache-Control': 'private, no-store' } }
      );
    }

    // 4. Generate outfits (placeholder - integrate with actual AI service)
    // TODO: Integrate with actual outfit generation service
    const generatedOutfits: GeneratedOutfit[] = [
      {
        id: `outfit-${Date.now()}-1`,
        items: {
          top: { id: 'top-1', name: 'White T-Shirt', imageUrl: 'https://via.placeholder.com/150' },
          bottom: { id: 'bottom-1', name: 'Blue Jeans', imageUrl: 'https://via.placeholder.com/150' },
          shoes: { id: 'shoes-1', name: 'White Sneakers', imageUrl: 'https://via.placeholder.com/150' },
        },
        score: 0.85,
        reasons: ['Matches casual occasion', 'Good color coordination'],
      },
    ];

    // Log without sensitive data
    console.log(`[API] Generated ${generatedOutfits.length} outfits for user`);

    return NextResponse.json<GenerateOutfitResponse>(
      {
        ok: true,
        outfits: generatedOutfits,
      },
      { status: 200, headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (error) {
    // Log error without exposing sensitive information
    console.error('[API] POST /api/reco/outfit/generate error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json<ErrorResponse>(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500, headers: { 'Cache-Control': 'private, no-store' } }
    );
  }
}

// GET method not allowed
export async function GET(): Promise<NextResponse<ErrorResponse>> {
  return NextResponse.json<ErrorResponse>(
    { error: 'Method not allowed. Use POST.', code: 'METHOD_NOT_ALLOWED' },
    { status: 405, headers: { 'Cache-Control': 'private, no-store' } }
  );
}
