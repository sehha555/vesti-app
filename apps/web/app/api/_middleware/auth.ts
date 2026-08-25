import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAndUser } from '../../../lib/supabase/server';

interface AuthResult {
  authorized: boolean;
  userId?: string;
  error?: NextResponse;
}

function unauthorized(message: string, code: string): NextResponse {
  return NextResponse.json({ error: message, code }, { status: 401 });
}

/**
 * 從 cookie 的 Supabase session 取得已驗證的 user id。
 * getSupabaseAndUser 內部用 auth.getUser() 向 Supabase 驗證 JWT，不信任 cookie 內容本身。
 */
async function getSessionUserId(): Promise<string | null> {
  const { user } = await getSupabaseAndUser();
  return user?.id ?? null;
}

/**
 * BFF dual-layer authentication middleware
 * Checks both internal API key and user session (Supabase)
 */
export async function requireBffAuth(req: NextRequest): Promise<AuthResult> {
  try {
    // 1. Check internal API key (x-api-key header)
    const apiKey = req.headers.get('x-api-key');
    const expectedApiKey = process.env.INTERNAL_API_KEY;

    if (!apiKey || !expectedApiKey || apiKey !== expectedApiKey) {
      return {
        authorized: false,
        error: unauthorized('Unauthorized: Invalid or missing API key', 'INVALID_API_KEY'),
      };
    }

    // 2. Check user session (Supabase JWT from cookies)
    const userId = await getSessionUserId();
    if (!userId) {
      return {
        authorized: false,
        error: unauthorized('Unauthorized: Invalid or missing session', 'INVALID_SESSION'),
      };
    }

    return { authorized: true, userId };
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
 * Session-only authentication (no internal API key required)
 */
export async function requireUserAuth(_req?: NextRequest): Promise<UserAuthResult> {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return {
        authorized: false,
        error: unauthorized('Unauthorized: Invalid or missing session', 'INVALID_SESSION'),
      };
    }
    return { authorized: true, userId, id: userId };
  } catch (error) {
    console.error('[Auth] requireUserAuth error:', error);
    return {
      authorized: false,
      error: NextResponse.json(
        { error: 'Internal server error', code: 'AUTH_ERROR' },
        { status: 500 }
      ),
    };
  }
}
