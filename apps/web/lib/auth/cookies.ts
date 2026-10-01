import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';

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
 * Client-readable marker (NOT httpOnly) so the frontend can tell whether
 * the user is logged in. The real session lives in the httpOnly
 * `sb-<project-ref>-auth-token` cookies managed by `@supabase/ssr`.
 */
export const AUTH_STATUS_COOKIE = 'sb-auth-status';

// 舊版自己寫的 token cookie，伺服器從來不讀；登出時一併清掉殘留
const LEGACY_COOKIE_NAMES = ['sb-auth-token', 'sb-refresh-token', 'sb-user-id'];

const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function baseOptions(): Partial<ResponseCookie> {
  return {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  };
}

/**
 * Sets the client-readable login marker on a response.
 */
export function setAuthStatusCookie(cookiesApi: CookiesAPI): void {
  cookiesApi.set(AUTH_STATUS_COOKIE, 'authenticated', {
    ...baseOptions(),
    httpOnly: false, // Intentionally readable by JavaScript
    maxAge: MAX_AGE,
  });
}

/**
 * Clears the login marker and any legacy token cookies from a response.
 * The Supabase session cookies are cleared by `supabase.auth.signOut()`.
 */
export function clearAuthCookies(cookiesApi: CookiesAPI): void {
  cookiesApi.set(AUTH_STATUS_COOKIE, '', {
    ...baseOptions(),
    httpOnly: false,
    maxAge: 0,
  });
  for (const name of LEGACY_COOKIE_NAMES) {
    cookiesApi.set(name, '', { ...baseOptions(), httpOnly: true, maxAge: 0 });
  }
}
