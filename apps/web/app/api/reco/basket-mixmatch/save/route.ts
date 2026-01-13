import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAndUser } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rateLimit';

const OutfitItemSchema = z.object({
  closet_item_id: z.string().uuid().optional(),
  catalog_item_id: z.string().uuid().optional(),
  item_type: z.enum(['closet', 'catalog']),
}).refine(
  obj => obj.closet_item_id || obj.catalog_item_id,
  { message: 'Either closet_item_id or catalog_item_id required' }
);

const SaveBasketMixmatchRequestSchema = z.object({
  items: z.array(OutfitItemSchema).min(1),
  occasion: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

type SaveBasketMixmatchRequest = z.infer<typeof SaveBasketMixmatchRequestSchema>;

interface OutfitResponse {
  id: string;
  user_id: string;
  created_at: string;
}

// Rate limit config: 20 requests per 60 seconds per user (separate bucket from daily)
const RATE_LIMIT_CONFIG = {
  windowMs: 60_000,
  maxRequests: 20,
  keyPrefix: 'reco-save:basket-mixmatch',
};

/**
 * POST /api/reco/basket-mixmatch/save
 *
 * Saves basket mixmatch results to outfits table via RPC.
 * Enforces rate limiting per user (separate bucket from daily-outfits).
 *
 * Returns: 201 { id, user_id, created_at }
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const { supabase, user } = await getSupabaseAndUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: { 'Cache-Control': 'private, no-store' } }
    );
  }

  // Rate limit check (separate bucket for basket-mixmatch)
  const rateLimitResult = await checkRateLimit(user.id, RATE_LIMIT_CONFIG);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: {
          'Cache-Control': 'private, no-store',
          'Retry-After': String(rateLimitResult.retryAfter ?? rateLimitResult.resetAfter),
        },
      }
    );
  }

  // Parse and validate request body
  let body: SaveBasketMixmatchRequest;
  try {
    const rawBody = await req.json();
    const validation = SaveBasketMixmatchRequestSchema.safeParse(rawBody);
    if (!validation.success) {
      const issues = validation.error.issues.map(i => i.path.join('.'));
      console.info('[reco/basket-mixmatch/save] Validation failed', { issueCount: issues.length, paths: issues });
      return NextResponse.json(
        { error: 'Invalid request', issues: validation.error.flatten().fieldErrors },
        { status: 400, headers: { 'Cache-Control': 'private, no-store' } }
      );
    }
    body = validation.data;
  } catch {
    return NextResponse.json(
      { error: 'Invalid request format' },
      { status: 400, headers: { 'Cache-Control': 'private, no-store' } }
    );
  }

  // Call RPC to save outfit (atomic write + RLS enforcement)
  // Note: basket-mixmatch has no season (null), only occasion is optional
  const { data: rpcResult, error: rpcError } = await supabase.rpc('create_outfit_with_items', {
    p_source: 'basket_mixmatch',
    p_items: body.items,
    p_season: null,
    p_occasion: body.occasion ?? null,
    p_weather_info: null,
    p_notes: body.notes ?? null,
  });

  if (rpcError) {
    console.error('[reco/basket-mixmatch/save] RPC failed', { code: rpcError.code });
    return NextResponse.json(
      { error: 'Failed to save outfit' },
      { status: 500, headers: { 'Cache-Control': 'private, no-store' } }
    );
  }

  if (!rpcResult || rpcResult.length === 0) {
    return NextResponse.json(
      { error: 'Failed to save outfit' },
      { status: 500, headers: { 'Cache-Control': 'private, no-store' } }
    );
  }

  const outfit = rpcResult[0] as OutfitResponse;
  return NextResponse.json(outfit, {
    status: 201,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}

