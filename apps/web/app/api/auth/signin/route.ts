import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/auth/signin
 * Initiates Google OAuth flow by redirecting to Supabase OAuth URL
 *
 * Query params:
 * - redirectTo: The path to redirect after auth callback (default: /auth/callback)
 */
export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[Auth] Missing Supabase configuration');
      return NextResponse.json(
        { error: 'Server configuration error', code: 'CONFIG_ERROR' },
        { status: 500 }
      );
    }

    // Get redirectTo from query params, default to /auth/callback
    const searchParams = request.nextUrl.searchParams;
    const redirectTo = searchParams.get('redirectTo') || '/auth/callback';

    // Validate redirectTo is a relative path (security: prevent open redirect)
    if (!redirectTo.startsWith('/')) {
      return NextResponse.json(
        { error: 'Invalid redirectTo parameter', code: 'INVALID_REDIRECT' },
        { status: 400 }
      );
    }

    // Build the full callback URL
    const origin = request.nextUrl.origin;
    const callbackUrl = `${origin}${redirectTo}`;

    // Create Supabase client for auth
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Generate OAuth URL for Google
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error || !data?.url) {
      console.error('[Auth] Failed to generate OAuth URL:', error);
      return NextResponse.json(
        { error: 'Failed to initiate OAuth flow', code: 'OAUTH_INIT_FAILED' },
        { status: 500 }
      );
    }

    // Redirect to the OAuth URL
    return NextResponse.redirect(data.url, { status: 302 });
  } catch (error) {
    console.error('[Auth] signin error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
