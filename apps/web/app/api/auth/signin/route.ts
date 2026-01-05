import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { signInWithEmail } from '@/lib/auth/emailAuth';
import { setAuthCookies } from '@/lib/auth/cookies';
import {
  checkIPRateLimit,
  checkEmailRateLimit,
  resetIPRateLimit,
  resetEmailRateLimit,
} from '@/lib/auth/rateLimit';

// Allowlist of paths users can be redirected to after login
const ALLOWED_REDIRECTS = ['/', '/reco', '/wardrobe', '/profile'];

/**
 * GET /api/auth/signin
 * Initiates Google OAuth flow by redirecting to Supabase OAuth URL
 *
 * Query params:
 * - next: Where to redirect after successful login (must be in allowlist, default: /reco)
 *
 * Note: OAuth callback is always /api/auth/callback (hardcoded for security)
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

    // Validate and sanitize the 'next' redirect path (allowlist only)
    const searchParams = request.nextUrl.searchParams;
    const requestedNext = searchParams.get('next') || '/reco';
    const safeNext = ALLOWED_REDIRECTS.includes(requestedNext) ? requestedNext : '/reco';

    // OAuth callback URL is hardcoded to prevent open redirect attacks
    const origin = request.nextUrl.origin;
    const callbackUrl = `${origin}/api/auth/callback`;

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

    // Store the safe redirect path in a cookie for callback to use
    const response = NextResponse.redirect(data.url, { status: 302 });
    response.cookies.set('auth_redirect_to', safeNext, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 10, // 10 minutes (OAuth flow should complete within this)
    });

    return response;
  } catch (error) {
    console.error('[Auth] signin error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/signin
 * Sign in user with email and password
 *
 * Body:
 * - email: User email address
 * - password: User password
 */
export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    let body: Record<string, unknown>;

    try {
      body = await request.json();
    } catch {
      console.error('[Auth] Invalid JSON body');
      return NextResponse.json(
        { message: 'Invalid request body' },
        { status: 422 }
      );
    }

    let { email, password } = body;

    // Validate email and password are provided and are strings
    if (typeof email !== 'string' || !email.trim()) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 422 }
      );
    }

    if (typeof password !== 'string' || !password.trim()) {
      return NextResponse.json(
        { message: 'Password is required' },
        { status: 422 }
      );
    }

    // Normalize email (trim + lowercase) for consistent rate limiting
    email = email.trim().toLowerCase();

    // Check IP rate limit first (skip if IP is unknown to avoid false positives)
    if (ip !== 'unknown') {
      const ipLimitResult = await checkIPRateLimit(ip);
      if (!ipLimitResult.allowed) {
        const retryAfter = ipLimitResult.retryAfter || 60;
        return NextResponse.json(
          {
            message: 'Too many login attempts. Please try again later.',
            retryAfter,
          },
          {
            status: 429,
            headers: {
              'Retry-After': String(retryAfter),
            },
          }
        );
      }
    }

    // Check email rate limit
    const emailLimitResult = await checkEmailRateLimit(email);
    if (!emailLimitResult.allowed) {
      const retryAfter = emailLimitResult.retryAfter || 60;
      return NextResponse.json(
        {
          message: 'Too many login attempts. Please try again later.',
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
          },
        }
      );
    }

    // Attempt to sign in with email and password
    const result = await signInWithEmail(email, password);

    if (!result.success) {
      console.error('[Auth] Email/password sign in failed for:', email);
      // Return a generic 401 message to prevent account enumeration
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Reset rate limits on successful login
    const resetPromises = [resetEmailRateLimit(email)];
    if (ip !== 'unknown') {
      resetPromises.push(resetIPRateLimit(ip));
    }
    await Promise.all(resetPromises);

    // Success: create response and set auth cookies
    const response = NextResponse.json({
      success: true,
      redirectTo: '/',
    });

    setAuthCookies(response.cookies, result.session!);

    return response;
  } catch (error) {
    console.error('[Auth] POST signin error:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
}
