import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAndUser } from '@/lib/supabase/server';
import { checkRateLimit, cacheResponse, getCachedResponse } from '@/lib/rateLimit';

const BUCKET_NAME = 'closet-images';

// Signed URL expiration (server-controlled, not client-configurable)
const SIGNED_URL_EXPIRES_IN = process.env.SIGNED_URL_EXPIRES_SECONDS
  ? Math.min(parseInt(process.env.SIGNED_URL_EXPIRES_SECONDS, 10), 900)
  : 300; // Default 5 minutes, max 15 minutes

// Rate limiting config: 5 requests per 10 seconds per user+item
const RATE_LIMIT_CONFIG = {
  windowMs: 10_000,
  maxRequests: 5,
  keyPrefix: 'refresh-url',
};

// Minimum remaining time to serve cached response (30 seconds)
const MIN_CACHE_REMAINING_MS = 30_000;

interface RefreshResponse {
  imageUrl: string;
  expiresAt: string;
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/closet-items/{id}/refresh-url
 *
 * Refreshes the signed URL for a closet item's image.
 * Frontend should call this when URL is about to expire (< 30 seconds remaining).
 *
 * Security:
 * - Only uses DB-stored image_url (no querystring input)
 * - Returns 404 for non-owner or non-existent items (prevents enumeration)
 * - Rate limited: 5 requests per 10 seconds per user+item (Redis-backed)
 * - Cache-Control: private, no-store (prevents browser/CDN caching)
 *
 * Returns: 200 { imageUrl, expiresAt }
 */
export async function GET(
  _req: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { id } = await context.params;
  const { supabase, user } = await getSupabaseAndUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: { 'Cache-Control': 'private, no-store' } }
    );
  }

  // Rate limiting check (Redis-backed for multi-instance)
  const rateLimitKey = `${user.id}:${id}`;
  const rateLimitResult = await checkRateLimit(rateLimitKey, RATE_LIMIT_CONFIG);

  if (!rateLimitResult.allowed) {
    // Try to return cached response if still valid (>= 30s remaining)
    const cached = await getCachedResponse<RefreshResponse>(rateLimitKey);
    if (cached) {
      const expiresAtMs = new Date(cached.expiresAt).getTime();
      const remainingMs = expiresAtMs - Date.now();

      if (remainingMs >= MIN_CACHE_REMAINING_MS) {
        return NextResponse.json(cached, {
          headers: { 'Cache-Control': 'private, no-store' },
        });
      }
    }

    // No valid cache, return 429
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

  // Fetch item to verify ownership and get image_url (DB is source of truth)
  const { data: item, error: fetchError } = await supabase
    .from('closet_items')
    .select('image_url')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  // Return 404 for any access issue (prevents user enumeration)
  if (fetchError || !item) {
    return NextResponse.json(
      { error: 'Item not found' },
      { status: 404, headers: { 'Cache-Control': 'private, no-store' } }
    );
  }

  if (!item.image_url) {
    return NextResponse.json(
      { error: 'Item not found' },
      { status: 404, headers: { 'Cache-Control': 'private, no-store' } }
    );
  }

  // Extract file path from DB-stored image_url
  // Format: https://{project}.supabase.co/storage/v1/object/sign/closet-images/{user_id}/{filename}?token=...
  let filePath: string;
  try {
    const url = new URL(item.image_url);
    const pathMatch = url.pathname.match(/\/closet-images\/(.+)$/);
    if (pathMatch) {
      filePath = pathMatch[1];
    } else {
      // Fallback: assume image_url is just the path
      filePath = item.image_url;
    }
  } catch {
    // If not a valid URL, assume it's a direct path
    filePath = item.image_url;
  }

  // Verify path belongs to user (defense in depth)
  if (!filePath.startsWith(`${user.id}/`)) {
    // Return 404 instead of 403 to prevent enumeration
    return NextResponse.json(
      { error: 'Item not found' },
      { status: 404, headers: { 'Cache-Control': 'private, no-store' } }
    );
  }

  // Generate new signed URL
  const { data: urlData, error: signedUrlError } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, SIGNED_URL_EXPIRES_IN);

  if (signedUrlError || !urlData?.signedUrl) {
    // Log only error name/code, NOT the message (may contain sensitive URLs/tokens)
    console.error('[closet-items/refresh-url] Signed URL generation failed');
    return NextResponse.json(
      { error: 'Failed to generate URL' },
      { status: 500, headers: { 'Cache-Control': 'private, no-store' } }
    );
  }

  const expiresAt = new Date(Date.now() + SIGNED_URL_EXPIRES_IN * 1000).toISOString();
  const response: RefreshResponse = { imageUrl: urlData.signedUrl, expiresAt };

  // Cache response for rate limiting (TTL = signed URL TTL)
  await cacheResponse(rateLimitKey, response, SIGNED_URL_EXPIRES_IN);

  return NextResponse.json(response, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
