import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAndUser } from '@/lib/supabase/server';

/**
 * GET /api/daily-outfits
 * Returns user's recent outfits (last 10) - temporary substitute for AI-generated daily recommendations
 * TODO: Implement AI-based daily outfit generation with weather integration
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
      console.error('[daily-outfits] GET error:', error.code);
      return NextResponse.json(
        { error: 'Failed to fetch daily outfits' },
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
