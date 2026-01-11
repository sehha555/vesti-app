import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAndUser } from '@/lib/supabase/server';

const BUCKET_NAME = 'closet-images';

// Signed URL expiration (server-controlled, not client-configurable)
const SIGNED_URL_EXPIRES_IN = process.env.SIGNED_URL_EXPIRES_SECONDS
  ? Math.min(parseInt(process.env.SIGNED_URL_EXPIRES_SECONDS, 10), 900)
  : 300; // Default 5 minutes, max 15 minutes

// Rate limiting: 5 requests per 10 seconds per user+item
const RATE_LIMIT_WINDOW_MS = 10_000;
const RATE_LIMIT_MAX_REQUESTS = 5;

// In-memory rate limit store (for single instance; use Redis for multi-instance)
const rateLimitStore = new Map<string, { count: number; resetAt: number; cachedResponse?: { imageUrl: string; expiresAt: string } }>();

// Cleanup stale entries periodically (every 60 seconds)
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60_000);

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
 * - Rate limited: 5 requests per 10 seconds per user+item
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
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limiting check
  const rateLimitKey = `${user.id}:${id}`;
  const now = Date.now();
  const rateLimit = rateLimitStore.get(rateLimitKey);

  if (rateLimit && rateLimit.resetAt > now) {
    if (rateLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
      // Return cached response if available (avoid 429 by serving stale)
      if (rateLimit.cachedResponse) {
        return NextResponse.json(rateLimit.cachedResponse);
      }
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetAt - now) / 1000)) } }
      );
    }
    rateLimit.count++;
  } else {
    rateLimitStore.set(rateLimitKey, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
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
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  }

  if (!item.image_url) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
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
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  }

  // Generate new signed URL
  const { data: urlData, error: signedUrlError } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, SIGNED_URL_EXPIRES_IN);

  if (signedUrlError || !urlData?.signedUrl) {
    console.error('[closet-items/refresh-url] Signed URL error:', signedUrlError?.message);
    return NextResponse.json({ error: 'Failed to generate URL' }, { status: 500 });
  }

  const expiresAt = new Date(Date.now() + SIGNED_URL_EXPIRES_IN * 1000).toISOString();
  const response = { imageUrl: urlData.signedUrl, expiresAt };

  // Cache response for rate limiting
  const currentLimit = rateLimitStore.get(rateLimitKey);
  if (currentLimit) {
    currentLimit.cachedResponse = response;
  }

  return NextResponse.json(response);
}
