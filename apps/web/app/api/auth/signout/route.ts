import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookies } from '../../../../lib/auth/cookies';

/**
 * POST /api/auth/signout
 * Clears all session cookies and signs out the user
 *
 * Returns:
 * - 200: Successfully signed out
 * - 500: Internal server error
 */
export async function POST(_request: NextRequest) {
  try {
    // Create response
    const response = NextResponse.json(
      { success: true, message: 'Signed out successfully' },
      { status: 200 }
    );

    // Clear all session cookies using the shared helper
    clearAuthCookies(response.cookies);

    console.log('[Auth] User signed out successfully');

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
  try {
    const origin = request.nextUrl.origin;
    const redirectUrl = new URL('/', origin);

    const response = NextResponse.redirect(redirectUrl, { status: 302 });

    // Clear all session cookies using the shared helper
    clearAuthCookies(response.cookies);

    console.log('[Auth] User signed out via GET redirect');

    return response;
  } catch (error) {
    console.error('[Auth] signout GET error:', error);
    return NextResponse.redirect(new URL('/', request.nextUrl.origin), {
      status: 302,
    });
  }
}
