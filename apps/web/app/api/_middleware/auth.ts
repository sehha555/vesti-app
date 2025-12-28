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
