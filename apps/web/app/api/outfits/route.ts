import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAndUser } from '@/lib/supabase/server';
import { logDeprecationMetric } from '@/lib/metrics';

const OutfitItemSchema = z.object({
  closetItemId: z.string().uuid(),
  position: z.number().int().positive(),
  layer: z.enum(['top', 'bottom', 'outer', 'accessory', 'feet']),
});

const CreateOutfitSchema = z.object({
  title: z.string().min(1),
  notes: z.string().optional(),
  items: z.array(OutfitItemSchema).min(1),
});

type CreateOutfitRequest = z.infer<typeof CreateOutfitSchema>;

// Legacy format support for backward compatibility
const LegacyCreateOutfitSchema = z.object({
  userId: z.string().uuid().optional(), // Ignored (user_id from session)
  name: z.string().min(1),
  itemIds: z.array(z.string().uuid()).min(1),
  description: z.string().optional(),
  season: z.string().optional(),
  rating: z.number().optional(),
});

/**
 * GET /api/outfits
 * Returns user's recent outfits (last 10)
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const { supabase, user } = await getSupabaseAndUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: { 'Cache-Control': 'private, no-store' } }
    );
  }

  try {
    const { data: outfits, error } = await supabase
      .from('outfits')
      .select('id, title, notes, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('[outfits] GET error:', error.code);
      return NextResponse.json(
        { error: 'Failed to fetch outfits' },
        { status: 500, headers: { 'Cache-Control': 'private, no-store' } }
      );
    }

    return NextResponse.json(outfits || [], {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: { 'Cache-Control': 'private, no-store' } }
    );
  }
}

/**
 * POST /api/outfits
 * Create new outfit with items
 *
 * Request body: { title, notes?, items: [{closetItemId, position, layer}] }
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const { supabase, user } = await getSupabaseAndUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: { 'Cache-Control': 'private, no-store' } }
    );
  }

  // Parse and validate request body (supports both new and legacy formats)
  let body: CreateOutfitRequest;
  let isLegacyFormat = false;
  const responseHeaders: Record<string, string> = { 'Cache-Control': 'private, no-store' };

  try {
    const rawBody = await req.json();

    // Try new format first
    const newFormatValidation = CreateOutfitSchema.safeParse(rawBody);
    if (newFormatValidation.success) {
      body = newFormatValidation.data;
    } else {
      // Try legacy format
      const legacyValidation = LegacyCreateOutfitSchema.safeParse(rawBody);
      if (legacyValidation.success) {
        isLegacyFormat = true;
        const legacy = legacyValidation.data;
        // Transform legacy format to new format
        body = {
          title: legacy.name,
          notes: legacy.description || undefined,
          items: legacy.itemIds.map((id, idx) => ({
            closetItemId: id,
            position: idx + 1,
            layer: 'unknown' as const,
          })),
        };
        // Log deprecation metric for observability
        logDeprecationMetric({
          endpoint: 'POST /api/outfits',
          format: 'legacy',
          userId: user.id,
          itemCount: legacy.itemIds.length,
          userAgent: req.headers.get('user-agent') || undefined,
        });

        // Add deprecation headers
        console.warn('[outfits] Deprecated payload: POST /api/outfits used legacy format');
        responseHeaders['Deprecation'] = 'true';
        responseHeaders['Sunset'] = '2026-03-01T00:00:00Z';
        responseHeaders['Link'] = '<https://github.com/vesti-app/vesti/blob/master/docs/BACKEND_API_REFERENCE.md#api-apiotfits>; rel="deprecation"';
      } else {
        return NextResponse.json(
          { error: 'Invalid request', issues: newFormatValidation.error.flatten().fieldErrors },
          { status: 400, headers: { 'Cache-Control': 'private, no-store' } }
        );
      }
    }
  } catch {
    return NextResponse.json(
      { error: 'Invalid request format' },
      { status: 400, headers: { 'Cache-Control': 'private, no-store' } }
    );
  }

  // Verify closet items belong to user
  const closetItemIds = body.items
    .filter(item => item.closetItemId)
    .map(item => item.closetItemId);

  if (closetItemIds.length > 0) {
    const { count, error: countError } = await supabase
      .from('closet_items')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .in('id', closetItemIds);

    if (countError || count !== closetItemIds.length) {
      return NextResponse.json(
        { error: 'One or more closet items not found or unauthorized' },
        { status: 403, headers: { 'Cache-Control': 'private, no-store' } }
      );
    }
  }

  // Create outfit
  const { data: outfit, error: outfitError } = await supabase
    .from('outfits')
    .insert({
      user_id: user.id,
      title: body.title,
      notes: body.notes || null,
    })
    .select('id, title, notes, created_at, updated_at')
    .single();

  if (outfitError || !outfit) {
    console.error('[outfits] POST outfit insert error:', outfitError?.code);
    return NextResponse.json(
      { error: 'Failed to create outfit' },
      { status: 500, headers: { 'Cache-Control': 'private, no-store' } }
    );
  }

  // Create outfit items
  const outfitItemsPayload = body.items.map(item => ({
    outfit_id: outfit.id,
    closet_item_id: item.closetItemId,
    position: item.position,
    layer: item.layer,
  }));

  const { error: itemsError } = await supabase
    .from('outfit_items')
    .insert(outfitItemsPayload);

  if (itemsError) {
    console.error('[outfits] POST items insert error:', itemsError.code);
    // Note: outfit already created, items failed (inconsistent state)
    // Consider using RPC transaction in future
    return NextResponse.json(
      { error: 'Failed to add items to outfit' },
      { status: 500, headers: { 'Cache-Control': 'private, no-store' } }
    );
  }

  return NextResponse.json(outfit, {
    status: 201,
    headers: responseHeaders,
  });
}
