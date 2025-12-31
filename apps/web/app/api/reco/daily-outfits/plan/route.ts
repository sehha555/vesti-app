import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

interface DailyPlanResponse {
  ok: boolean;
  plan?: {
    date: string;
    outfits: Array<{ id: string; score: number }>;
    suggestions?: string[];
  };
  error?: string;
}

/**
 * GET /api/reco/daily-outfits/plan
 * Retrieves daily outfit plan for authenticated user
 */
export async function GET(req: NextRequest): Promise<NextResponse<DailyPlanResponse>> {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            // Handle cookie setting if needed
          },
          remove(name: string, options: any) {
            // Handle cookie removal if needed
          },
        },
      }
    );

    // Check authentication
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user?.id) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized: Missing or invalid session' },
        { status: 401 }
      );
    }

    // Return daily plan (stub implementation)
    const today = new Date().toISOString().split('T')[0];

    return NextResponse.json<DailyPlanResponse>(
      {
        ok: true,
        plan: {
          date: today,
          outfits: [
            { id: 'outfit-1', score: 0.92 },
            { id: 'outfit-2', score: 0.87 },
            { id: 'outfit-3', score: 0.78 },
          ],
          suggestions: [
            'Weather: Sunny, 25°C',
            'Occasion: Casual',
            'Recommended: Light clothing',
          ],
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] GET /api/reco/daily-outfits/plan error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
