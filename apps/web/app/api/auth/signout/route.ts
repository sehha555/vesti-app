import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookies } from '../../../../lib/auth/cookies';
import { createSupabaseServerClient } from '../../../../lib/supabase/server';

/**
 * 讓 SSR client 登出本裝置：撤銷這組 refresh token，並清掉 sb-<ref>-auth-token cookie。
 * 失敗也不擋登出流程，後面照樣清掉前端用的標記 cookie。
 */
async function signOutSupabaseSession(): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) {
      console.error('[Auth] Supabase signOut failed:', error.message);
    }
  } catch (error) {
    console.error('[Auth] Supabase signOut error:', error);
  }
}

/**
 * POST /api/auth/signout
 * Signs out the Supabase session and clears all auth cookies
 *
 * Returns:
 * - 200: Successfully signed out
 * - 500: Internal server error
 */
export async function POST(_request: NextRequest) {
  try {
    await signOutSupabaseSession();

    const response = NextResponse.json(
      { success: true, message: 'Signed out successfully' },
      { status: 200 }
    );

    clearAuthCookies(response.cookies);

    return response;
  } catch (error) {
    console.error('[Auth] signout error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/signout
 * Alternative method for signout (useful for direct navigation)
 * Redirects to home page after clearing cookies
 */
export async function GET(request: NextRequest) {
  const redirectUrl = new URL('/', request.nextUrl.origin);
  try {
    await signOutSupabaseSession();

    const response = NextResponse.redirect(redirectUrl, { status: 302 });
    clearAuthCookies(response.cookies);

    return response;
  } catch (error) {
    console.error('[Auth] signout GET error:', error);
    return NextResponse.redirect(redirectUrl, { status: 302 });
  }
}
