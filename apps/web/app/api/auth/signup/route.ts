import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { setAuthCookies } from '@/lib/auth/cookies';
import { checkIPRateLimit, checkEmailRateLimit } from '@/lib/auth/rateLimit';

/**
 * POST /api/auth/signup
 * Register new user with email and password
 *
 * Body:
 * - name: User display name
 * - email: User email address
 * - password: User password (min 8 chars)
 * - confirmPassword: Must match password
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
        { ok: false, message: 'Invalid request body' },
        { status: 422 }
      );
    }

    let { name, email, password, confirmPassword } = body;

    // === Input Validation ===

    // Name validation
    if (typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { ok: false, message: 'Name is required' },
        { status: 422 }
      );
    }
    name = name.trim();

    // Email validation
    if (typeof email !== 'string' || !email.trim()) {
      return NextResponse.json(
        { ok: false, message: 'Email is required' },
        { status: 422 }
      );
    }
    email = email.trim().toLowerCase();

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { ok: false, message: 'Invalid email format' },
        { status: 422 }
      );
    }

    // Password validation
    if (typeof password !== 'string' || !password) {
      return NextResponse.json(
        { ok: false, message: 'Password is required' },
        { status: 422 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { ok: false, message: 'Password must be at least 8 characters' },
        { status: 422 }
      );
    }

    // Confirm password validation
    if (typeof confirmPassword !== 'string' || !confirmPassword) {
      return NextResponse.json(
        { ok: false, message: 'Confirm password is required' },
        { status: 422 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { ok: false, message: 'Passwords do not match' },
        { status: 422 }
      );
    }

    // === Rate Limiting ===

    // Check IP rate limit first
    if (ip !== 'unknown') {
      const ipLimitResult = await checkIPRateLimit(ip);
      if (!ipLimitResult.allowed) {
        const retryAfter = ipLimitResult.retryAfter || 60;
        return NextResponse.json(
          {
            ok: false,
            message: 'Too many attempts. Please try again later.',
            retryAfter,
          },
          {
            status: 429,
            headers: { 'Retry-After': String(retryAfter) },
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
          ok: false,
          message: 'Too many attempts. Please try again later.',
          retryAfter,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfter) },
        }
      );
    }

    // === Supabase SignUp ===

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[Auth] Missing Supabase configuration');
      return NextResponse.json(
        { ok: false, message: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    if (error) {
      console.error('[Auth] SignUp error:', error.message);

      // Generic error message to prevent user enumeration
      // Don't reveal if email already exists
      return NextResponse.json(
        { ok: false, message: 'Registration failed. Please try again.' },
        { status: 400 }
      );
    }

    // Check if session exists (email confirmation disabled)
    if (data.session) {
      // User is immediately logged in
      const response = NextResponse.json({
        ok: true,
        next: '/reco',
      });

      setAuthCookies(response.cookies, {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        userId: data.user!.id,
      });

      return response;
    }

    // No session = email confirmation required
    return NextResponse.json({
      ok: true,
      next: '/auth/verify-email',
      message: 'Please check your email to verify your account.',
    });
  } catch (error) {
    console.error('[Auth] POST signup error:', error);
    return NextResponse.json(
      { ok: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
