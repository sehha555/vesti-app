import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAndUser } from '@/lib/supabase/server';

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

// Zod schema for PATCH - all fields optional (partial update)
const UpdateClosetItemSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  subcategory: z.string().nullable().optional(),
  brand: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  size: z.string().nullable().optional(),
  season: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  image_url: z.string().nullable().optional(),
  custom_group: z.string().nullable().optional(),
  is_archived: z.boolean().optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED', 'DELETED']).optional(),
  acquired_at: z.string().nullable().optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/closet-items/{id}
 *
 * Body: Partial<{ name, category, ... }> (see UpdateClosetItemSchema)
 *
 * Returns: 200 { data: ClosetItem }
 */
export async function PATCH(
  req: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { id } = await context.params;
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
  const parsed = UpdateClosetItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // Build update payload with whitelist fields only
  const payload: Record<string, unknown> = {};

  if (parsed.data.name !== undefined) payload.name = parsed.data.name;
  if (parsed.data.category !== undefined) payload.category = parsed.data.category;
  if (parsed.data.subcategory !== undefined) payload.subcategory = parsed.data.subcategory;
  if (parsed.data.brand !== undefined) payload.brand = parsed.data.brand;
  if (parsed.data.color !== undefined) payload.color = parsed.data.color;
  if (parsed.data.size !== undefined) payload.size = parsed.data.size;
  if (parsed.data.season !== undefined) payload.season = parsed.data.season;
  if (parsed.data.tags !== undefined) payload.tags = parsed.data.tags;
  if (parsed.data.image_url !== undefined) payload.image_url = parsed.data.image_url;
  if (parsed.data.custom_group !== undefined) payload.custom_group = parsed.data.custom_group;
  if (parsed.data.is_archived !== undefined) payload.is_archived = parsed.data.is_archived;
  if (parsed.data.status !== undefined) payload.status = parsed.data.status;
  if (parsed.data.acquired_at !== undefined) payload.acquired_at = parsed.data.acquired_at;

  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  // Update with both id and user_id check (defense in depth, RLS also enforces this)
  const { data, error } = await supabase
    .from('closet_items')
    .update(payload)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    // PGRST116 = no rows returned (not found or not owned by user)
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }
    console.error('[closet-items] Update error:', error.message);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }

  return NextResponse.json({ data: data as ClosetItem });
}

/**
 * DELETE /api/closet-items/{id}
 *
 * Soft delete: sets status='DELETED' and is_archived=true
 *
 * Returns: 200 { data: ClosetItem }
 */
export async function DELETE(
  _req: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { id } = await context.params;
  const { supabase, user } = await getSupabaseAndUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Soft delete with both id and user_id check (defense in depth)
  const { data, error } = await supabase
    .from('closet_items')
    .update({ status: 'DELETED', is_archived: true })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }
    console.error('[closet-items] Delete error:', error.message);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }

  return NextResponse.json({ data: data as ClosetItem });
}
