import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAndUser } from '@/lib/supabase/server';

const BUCKET_NAME = 'closet-images';

// Signed URL expiration (server-controlled, not client-configurable)
const SIGNED_URL_EXPIRES_IN = process.env.SIGNED_URL_EXPIRES_SECONDS
  ? Math.min(parseInt(process.env.SIGNED_URL_EXPIRES_SECONDS, 10), 900)
  : 300; // Default 5 minutes, max 15 minutes

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/closet-items/{id}/refresh-url
 *
 * Refreshes the signed URL for a closet item's image.
 * Frontend should call this when URL is about to expire (< 30 seconds remaining).
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

  // Fetch item to verify ownership and get image_url path
  const { data: item, error: fetchError } = await supabase
    .from('closet_items')
    .select('image_url')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !item) {
    if (fetchError?.code === 'PGRST116') {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }
    console.error('[closet-items/refresh-url] Fetch error:', fetchError?.message);
    return NextResponse.json({ error: 'Failed to fetch item' }, { status: 500 });
  }

  if (!item.image_url) {
    return NextResponse.json({ error: 'Item has no image' }, { status: 404 });
  }

  // Extract file path from the signed URL or stored path
  // image_url format: https://{project}.supabase.co/storage/v1/object/sign/closet-images/{user_id}/{filename}?token=...
  // We need to extract: {user_id}/{filename}
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

  // Verify the file belongs to the user (defense in depth)
  if (!filePath.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
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

  return NextResponse.json({
    imageUrl: urlData.signedUrl,
    expiresAt,
  });
}
