import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { setAuthCookies } from '../../../../lib/auth/cookies';

// Allowlist key mapping (must match signin/route.ts)
// Prevents open redirect - only these keys are valid
const NEXT_KEYS: Record<string, string> = {
  home: '/',
  reco: '/reco',
  wardrobe: '/wardrobe',
  profile: '/profile',
};

// Valid paths for cookie validation
const ALLOWED_REDIRECTS = ['/', '/reco', '/wardrobe', '/profile'];

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

    // Create Supabase SSR client with cookie access for PKCE code_verifier
    const cookieStore = await cookies();
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    });

    console.log('[Auth Callback] Exchanging code for session...');

    // Exchange code for session (requires code_verifier from PKCE)
    const { data, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError || !data?.session) {
      console.error('[Auth Callback] Code exchange failed:', exchangeError);
      const errorUrl = new URL('/', request.nextUrl.origin);
      errorUrl.searchParams.set('auth_error', 'exchange_failed');
      return NextResponse.redirect(errorUrl, { status: 302 });
    }

    const { session } = data;

    // Determine redirect path using dual fallback (cookie + nk query param)
    // Priority: 1) cookie (if valid) -> 2) nk param (if valid) -> 3) default /reco
    const allCookies = request.cookies.getAll();
    console.log('[Auth Callback] All cookies:', allCookies.map(c => c.name).join(', ') || '(none)');

    const redirectCookie = request.cookies.get('auth_redirect_to');
    const cookieValue = redirectCookie?.value;
    const nkParam = searchParams.get('nk');

    let redirectTo = '/reco'; // default
    let source = 'default';

    // 1) Try cookie first (validate against allowlist)
    if (cookieValue && ALLOWED_REDIRECTS.includes(cookieValue)) {
      redirectTo = cookieValue;
      source = 'cookie';
    }
    // 2) Fallback to nk query param (validate against NEXT_KEYS)
    else if (nkParam && NEXT_KEYS[nkParam]) {
      redirectTo = NEXT_KEYS[nkParam];
      source = 'nk-param';
    }

    console.log('[Auth Callback] cookie:', cookieValue || '(none)', '| nk:', nkParam || '(none)');
    console.log('[Auth Callback] Final redirectTo:', redirectTo, `(source: ${source})`);

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
    const isProduction = process.env.NODE_ENV === 'production';
    response.cookies.set('auth_redirect_to', '', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
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
