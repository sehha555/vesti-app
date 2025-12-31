/**
 * BFF Authentication Middleware
 * Implements dual-layer authentication:
 * 1. User session validation (via Supabase)
 * 2. Internal API key validation (via X-API-Key header)
 *
 * This prevents direct browser access and ensures only BFF-proxied requests are accepted.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { timingSafeEqual } from 'crypto';

// Generic error response - intentionally vague to prevent information leakage
const UNAUTHORIZED_RESPONSE = { error: 'Unauthorized', code: 'AUTH_REQUIRED' };

export interface AuthResult {
  authorized: boolean;
  userId?: string;
  error?: NextResponse;
}

/**
 * Validates the internal API key from X-API-Key header.
 * The key must match VESTI_INTERNAL_API_KEY environment variable.
 */
export function validateInternalApiKey(req: NextRequest): boolean {
  const apiKey = req.headers.get('x-api-key');
  const expectedKey = process.env.VESTI_INTERNAL_API_KEY;

  // If no internal API key is configured, reject all requests
  if (!expectedKey) {
    console.error('[Auth] VESTI_INTERNAL_API_KEY is not configured');
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  if (!apiKey || apiKey.length !== expectedKey.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < apiKey.length; i++) {
    result |= apiKey.charCodeAt(i) ^ expectedKey.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Validates user session via Supabase auth.
 * Returns the user ID if valid, null otherwise.
 */
export async function validateUserSession(): Promise<string | null> {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user.id;
  } catch (error) {
    console.error('[Auth] Session validation error:', error instanceof Error ? error.message : 'Unknown');
    return null;
  }
}

/**
 * BFF dual-layer authentication.
 * Requires BOTH:
 * 1. Valid user session (Supabase auth)
 * 2. Valid internal API key (X-API-Key header)
 *
 * @param req - The incoming request
 * @returns AuthResult with authorization status
 */
export async function requireBffAuth(req: NextRequest): Promise<AuthResult> {
  // Step 1: Validate internal API key
  if (!validateInternalApiKey(req)) {
    return {
      authorized: false,
      error: NextResponse.json(UNAUTHORIZED_RESPONSE, { status: 401 }),
    };
  }

  // Step 2: Validate user session
  const userId = await validateUserSession();
  if (!userId) {
    return {
      authorized: false,
      error: NextResponse.json(UNAUTHORIZED_RESPONSE, { status: 401 }),
    };
  }

  return {
    authorized: true,
    userId,
  };
}

/**
 * Creates a 401 Unauthorized response.
 * Used when authentication fails - intentionally vague to prevent info leakage.
 */
export function unauthorizedResponse(): NextResponse {
  return NextResponse.json(UNAUTHORIZED_RESPONSE, { status: 401 });
}

/**
 * User-only authentication (for external API endpoints).
 * Only validates user session - NO internal API key required.
 *
 * Use this for endpoints that:
 * - Accept user requests directly (not proxied through BFF)
 * - Need user identity but not internal service access
 *
 * @param req - The incoming request (unused, but kept for consistency)
 * @returns AuthResult with user ID if authenticated
 */
export async function requireUserAuth(_req: NextRequest): Promise<AuthResult> {
  const userId = await validateUserSession();

  if (!userId) {
    return {
      authorized: false,
      error: NextResponse.json(UNAUTHORIZED_RESPONSE, { status: 401 }),
    };
  }

  return {
    authorized: true,
    userId,
  };
}

/**
 * Internal-only authentication (for service-to-service calls).
 * ONLY validates X-Internal-API-Key header - NO user session.
 *
 * Security hardening:
 * - Uses crypto.timingSafeEqual to prevent timing attacks
 * - Rejects API key in query string (only accepts header)
 * - Length check before comparison to avoid exceptions
 *
 * Use this for endpoints that:
 * - Are called by internal services (cron jobs, workers, etc.)
 * - Don't have a user context
 *
 * WARNING: This should NOT be used for user-facing endpoints.
 * The API key is a shared secret and cannot identify individual users.
 *
 * @param req - The incoming request
 * @returns AuthResult (userId will be undefined for internal auth)
 */
export function requireInternalAuth(req: NextRequest): AuthResult {
  const expectedKey = process.env.VESTI_INTERNAL_API_KEY;

  if (!expectedKey) {
    console.error('[Auth] VESTI_INTERNAL_API_KEY is not configured');
    return {
      authorized: false,
      error: NextResponse.json(UNAUTHORIZED_RESPONSE, { status: 401 }),
    };
  }

  // SECURITY: Reject if API key appears in query string (prevents URL logging exposure)
  const url = new URL(req.url);
  if (url.searchParams.has('x-internal-api-key') || url.searchParams.has('api_key')) {
    console.warn('[Auth] Rejected: API key in query string');
    return {
      authorized: false,
      error: NextResponse.json(UNAUTHORIZED_RESPONSE, { status: 401 }),
    };
  }

  // Only accept from header (not query string)
  const apiKey = req.headers.get('x-internal-api-key');

  // Length check first (required for timingSafeEqual)
  if (!apiKey || apiKey.length !== expectedKey.length) {
    return {
      authorized: false,
      error: NextResponse.json(UNAUTHORIZED_RESPONSE, { status: 401 }),
    };
  }

  // Use crypto.timingSafeEqual for constant-time comparison
  const apiKeyBuffer = Buffer.from(apiKey, 'utf-8');
  const expectedBuffer = Buffer.from(expectedKey, 'utf-8');

  if (!timingSafeEqual(apiKeyBuffer, expectedBuffer)) {
    return {
      authorized: false,
      error: NextResponse.json(UNAUTHORIZED_RESPONSE, { status: 401 }),
    };
  }

  return {
    authorized: true,
    // No userId for internal auth - this is intentional
  };
}
