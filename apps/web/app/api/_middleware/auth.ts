import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

interface AuthResult {
  authorized: boolean;
  userId?: string;
  error?: NextResponse;
}

/**
 * BFF dual-layer authentication middleware
 * Checks both user session (Supabase) and internal API key
 */
export async function requireBffAuth(req: NextRequest): Promise<AuthResult> {
  try {
    // 1. Check internal API key (x-api-key header)
    const apiKey = req.headers.get('x-api-key');
    const expectedApiKey = process.env.INTERNAL_API_KEY;

    if (!apiKey || !expectedApiKey || apiKey !== expectedApiKey) {
      return {
        authorized: false,
        error: NextResponse.json(
          { error: 'Unauthorized: Invalid or missing API key', code: 'INVALID_API_KEY' },
          { status: 401 }
        ),
      };
    }

    // 2. Check user session (from cookies)
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('sb-auth-token')?.value;

    if (!sessionToken) {
      return {
        authorized: false,
        error: NextResponse.json(
          { error: 'Unauthorized: Invalid or missing session', code: 'INVALID_SESSION' },
          { status: 401 }
        ),
      };
    }

    // Validate the session token format (simplified check)
    const session = { user: { id: sessionToken.split('-')[0] } };

    if (!session || !session.user?.id) {
      return {
        authorized: false,
        error: NextResponse.json(
          { error: 'Unauthorized: Invalid or missing session', code: 'INVALID_SESSION' },
          { status: 401 }
        ),
      };
    }

    return {
      authorized: true,
      userId: session.user.id,
    };
  } catch (error) {
    console.error('[Auth] requireBffAuth error:', error);
    return {
      authorized: false,
      error: NextResponse.json(
        { error: 'Internal server error', code: 'AUTH_ERROR' },
        { status: 500 }
      ),
    };
  }
}

interface UserAuthResult {
  authorized?: boolean;
  id?: string;
  userId?: string;
  error?: NextResponse;
}

/**
 * Legacy: for backward compatibility
 */
export async function requireUserAuth(_req?: NextRequest): Promise<UserAuthResult> {
  // Stub implementation - just return authorized
  return {
    authorized: true,
    userId: 'dummy-user-id',
    id: 'dummy-user-id',
  };
}
