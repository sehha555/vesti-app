import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';
import type { NextResponse } from 'next/server';
import type { Session } from '@supabase/supabase-js';

/**
 * An interface representing the cookies object from a NextResponse or NextRequest.
 * This allows the helper to work with both `request.cookies` and `response.cookies`.
 */
interface CookiesAPI {
  set: (
    name: string,
    value: string,
    options?: Partial<ResponseCookie>
  ) => void;
}

/**
 * Data required to set authentication cookies.
 */
export interface AuthSessionData {
  accessToken: string;
  refreshToken: string;
  userId: string;
}

const SESSION_COOKIE_NAMES = [
  'sb-auth-token',
  'sb-refresh-token',
  'sb-user-id',
];

/**
 * Returns the secure, HttpOnly cookie options for session management.
 * @param isProduction - Determines if the 'Secure' flag should be set.
 */
function getCookieOptions(isProduction: boolean): Partial<ResponseCookie> {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
  };
}

/**
 * Sets the authentication cookies on a response object.
 *
 * @param cookiesApi - The cookies API from a NextResponse object.
 * @param session - The session data containing tokens and user ID.
 */
export function setAuthCookies(
  cookiesApi: CookiesAPI,
  session: AuthSessionData
): void {
  const isProduction = process.env.NODE_ENV === 'production';
  const options = getCookieOptions(isProduction);

  cookiesApi.set('sb-auth-token', session.accessToken, {
    ...options,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  cookiesApi.set('sb-refresh-token', session.refreshToken, {
    ...options,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  cookiesApi.set('sb-user-id', session.userId, {
    ...options,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

/**
 * Clears all authentication cookies from a response object.
 *
 * @param cookiesApi - The cookies API from a NextResponse object.
 */
export function clearAuthCookies(cookiesApi: CookiesAPI): void {
  const isProduction = process.env.NODE_ENV === 'production';
  const options = getCookieOptions(isProduction);

  for (const cookieName of SESSION_COOKIE_NAMES) {
    cookiesApi.set(cookieName, '', {
      ...options,
      maxAge: 0, // Expire the cookie immediately
    });
  }
}
