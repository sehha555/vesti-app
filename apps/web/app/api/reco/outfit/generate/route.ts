// apps/web/app/api/reco/outfit/generate/route.ts
// POST /api/reco/outfit/generate - AI outfit generation
// Security: BFF dual auth required (user session + internal API key)

import { NextRequest, NextResponse } from 'next/server';
import { requireBffAuth } from '@/middleware/auth';

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
      return authResult.error! as NextResponse<ErrorResponse>;
    }

    const userId = authResult.userId!;

    // 2. Parse and validate request body
    let body: GenerateOutfitRequest;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json<ErrorResponse>(
        { error: 'Invalid JSON body', code: 'INVALID_JSON' },
        { status: 400 }
      );
    }

    // 3. Generate outfits (placeholder - integrate with actual AI service)
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
      { status: 200 }
    );
  } catch (error) {
    // Log error without exposing sensitive information
    console.error('[API] POST /api/reco/outfit/generate error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json<ErrorResponse>(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
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
