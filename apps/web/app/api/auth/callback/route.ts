import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Session cookie configuration
 * - HttpOnly: Prevents XSS attacks
 * - Secure: Only sent over HTTPS (production)
 * - SameSite: Lax for OAuth redirects compatibility
 * - Path: Root path for all routes
 */
function getSessionCookieOptions(isProduction: boolean) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
    // 7 days expiry (matches Supabase default session)
    maxAge: 60 * 60 * 24 * 7,
  };
}

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

    // Handle OAuth errors
    if (error) {
      console.error('[Auth Callback] OAuth error:', error, errorDescription);
      const errorUrl = new URL('/login', request.nextUrl.origin);
      errorUrl.searchParams.set('error', error);
      if (errorDescription) {
        errorUrl.searchParams.set('error_description', errorDescription);
      }
      return NextResponse.redirect(errorUrl, { status: 302 });
    }

    // Validate code is present
    if (!code) {
      console.error('[Auth Callback] Missing authorization code');
      const errorUrl = new URL('/login', request.nextUrl.origin);
      errorUrl.searchParams.set('error', 'missing_code');
      return NextResponse.redirect(errorUrl, { status: 302 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[Auth Callback] Missing Supabase configuration');
      const errorUrl = new URL('/login', request.nextUrl.origin);
      errorUrl.searchParams.set('error', 'config_error');
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
      const errorUrl = new URL('/login', request.nextUrl.origin);
      errorUrl.searchParams.set('error', 'exchange_failed');
      return NextResponse.redirect(errorUrl, { status: 302 });
    }

    const { session } = data;

    // Determine environment
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = getSessionCookieOptions(isProduction);

    // Create response with redirect to home/dashboard
    const successUrl = new URL('/', request.nextUrl.origin);
    const response = NextResponse.redirect(successUrl, { status: 302 });

    // Set session cookies
    // Store access token for session validation
    response.cookies.set('sb-auth-token', session.access_token, cookieOptions);

    // Store refresh token for session refresh
    response.cookies.set(
      'sb-refresh-token',
      session.refresh_token,
      cookieOptions
    );

    // Store user ID for quick access (not sensitive, but still HttpOnly)
    response.cookies.set('sb-user-id', session.user.id, cookieOptions);

    console.log('[Auth Callback] Session established for user:', session.user.id);

    return response;
  } catch (error) {
    console.error('[Auth Callback] Unexpected error:', error);
    const errorUrl = new URL('/login', request.nextUrl.origin);
    errorUrl.searchParams.set('error', 'internal_error');
    return NextResponse.redirect(errorUrl, { status: 302 });
  }
}
