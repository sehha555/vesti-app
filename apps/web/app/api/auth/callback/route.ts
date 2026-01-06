import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { setAuthCookies } from '../../../../lib/auth/cookies';

/**
 * GET /api/auth/callback
 * Handles OAuth callback from Supabase/Google
 * Exchanges authorization code for session and sets secure cookies
 *
 * Query params:
 * - code: OAuth authorization code from Supabase
 * - error: OAuth error (if any)
 * - error_description: OAuth error description (if any)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Handle OAuth errors - redirect to home page with error params
    if (error) {
      console.error('[Auth Callback] OAuth error:', error, errorDescription);
      const errorUrl = new URL('/', request.nextUrl.origin);
      errorUrl.searchParams.set('auth_error', error);
      if (errorDescription) {
        errorUrl.searchParams.set('error_description', errorDescription);
      }
      return NextResponse.redirect(errorUrl, { status: 302 });
    }

    // Validate code is present
    if (!code) {
      console.error('[Auth Callback] Missing authorization code');
      const errorUrl = new URL('/', request.nextUrl.origin);
      errorUrl.searchParams.set('auth_error', 'missing_code');
      return NextResponse.redirect(errorUrl, { status: 302 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[Auth Callback] Missing Supabase configuration');
      const errorUrl = new URL('/', request.nextUrl.origin);
      errorUrl.searchParams.set('auth_error', 'config_error');
      return NextResponse.redirect(errorUrl, { status: 302 });
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Exchange code for session
    const { data, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError || !data?.session) {
      console.error('[Auth Callback] Code exchange failed:', exchangeError);
      const errorUrl = new URL('/', request.nextUrl.origin);
      errorUrl.searchParams.set('auth_error', 'exchange_failed');
      return NextResponse.redirect(errorUrl, { status: 302 });
    }

    const { session } = data;

    // Get the redirect path from cookie (set by /api/auth/signin)
    const redirectTo = request.cookies.get('auth_redirect_to')?.value || '/reco';

    // Create response with redirect to the intended destination
    const successUrl = new URL(redirectTo, request.nextUrl.origin);
    const response = NextResponse.redirect(successUrl, { status: 302 });

    // Set session cookies using the shared helper
    setAuthCookies(response.cookies, {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      userId: session.user.id,
    });

    // Clear the redirect cookie (one-time use)
    response.cookies.set('auth_redirect_to', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0, // Delete immediately
    });

    console.log('[Auth Callback] Session established for user:', session.user.id, '-> redirect to:', redirectTo);

    return response;
  } catch (error) {
    console.error('[Auth Callback] Unexpected error:', error);
    const errorUrl = new URL('/', request.nextUrl.origin);
    errorUrl.searchParams.set('auth_error', 'internal_error');
    return NextResponse.redirect(errorUrl, { status: 302 });
  }
}
