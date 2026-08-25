import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAndUser } from '@/lib/supabase/server';
import { freshSignedUrls } from '../../../lib/closet/storage';

interface ClosetItem {
  id: string;
  user_id: string;
  name: string;
  category: string;
  subcategory: string | null;
  brand: string | null;
  color: string | null;
  size: string | null;
  season: string | null;
  tags: string[];
  image_url: string | null;
  custom_group: string | null;
  is_archived: boolean;
  source_type: string;
  source_ref_id: string | null;
  status: string;
  acquired_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * GET /api/closet-items
 *
 * Query params:
 *   - archived: 0 | 1 (optional) - filter by is_archived
 *
 * Returns: { data: ClosetItem[] }
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const { supabase, user } = await getSupabaseAndUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse query params
  const { searchParams } = new URL(req.url);
  const archivedParam = searchParams.get('archived');

  // Query active_closet_items view (excludes soft-deleted items)
  // Explicit user_id filter for defense in depth (RLS also enforces this)
  let query = supabase
    .from('active_closet_items')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Apply archived filter if specified
  if (archivedParam === '1') {
    query = query.eq('is_archived', true);
  } else if (archivedParam === '0') {
    query = query.eq('is_archived', false);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[closet-items] Query error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }

  // DB 的 image_url 是上傳當下的 signed URL，早就過期；回應前全部重簽
  const items = (data ?? []) as ClosetItem[];
  const urls = await freshSignedUrls(supabase, user.id, items);
  const refreshed = items.map((item) => ({ ...item, image_url: urls.get(item.id) ?? item.image_url }));

  return NextResponse.json({ data: refreshed }, { headers: { 'Cache-Control': 'private, no-store' } });
}

// Zod schema for POST - whitelist only allowed fields
const CreateClosetItemSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  subcategory: z.string().nullable().optional(),
  brand: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  size: z.string().nullable().optional(),
  season: z.string().nullable().optional(),
  tags: z.array(z.string()).optional().default([]),
  image_url: z.string().nullable().optional(),
  custom_group: z.string().nullable().optional(),
  is_archived: z.boolean().optional().default(false),
  status: z.enum(['ACTIVE', 'ARCHIVED', 'DELETED']).optional().default('ACTIVE'),
  acquired_at: z.string().nullable().optional(),
});

/**
 * POST /api/closet-items
 *
 * Body: { name, category, ... } (see CreateClosetItemSchema)
 *
 * Returns: 201 { data: ClosetItem }
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const { supabase, user } = await getSupabaseAndUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse JSON body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Validate with Zod
  const parsed = CreateClosetItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // Build insert payload with whitelist fields only
  const payload = {
    name: parsed.data.name,
    category: parsed.data.category,
    subcategory: parsed.data.subcategory ?? null,
    brand: parsed.data.brand ?? null,
    color: parsed.data.color ?? null,
    size: parsed.data.size ?? null,
    season: parsed.data.season ?? null,
    tags: parsed.data.tags,
    image_url: parsed.data.image_url ?? null,
    custom_group: parsed.data.custom_group ?? null,
    is_archived: parsed.data.is_archived,
    status: parsed.data.status,
    acquired_at: parsed.data.acquired_at ?? null,
    // Server-enforced fields (prevent mass assignment)
    user_id: user.id,
    source_type: 'OWNED' as const,
    source_ref_id: null,
  };

  const { data, error } = await supabase
    .from('closet_items')
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error('[closet-items] Insert error:', error.message);
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }

  return NextResponse.json({ data: data as ClosetItem }, { status: 201 });
}
