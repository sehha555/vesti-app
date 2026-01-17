// apps/web/lib/http/no-store.ts

import { NextResponse } from 'next/server';

/**
 * Standard security headers to prevent caching of sensitive responses
 * - private: Response is for a single user, not shareable by caches
 * - no-store: Cache should not store the response (prevents data leakage)
 */
export const NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store' } as const;

/**
 * Helper to create a JSON response with no-store cache headers
 * Ensures all API responses include security headers to prevent sensitive data leakage
 *
 * @param data - Response body data
 * @param init - Optional NextResponse init config (status, headers, etc.)
 * @returns NextResponse with merged no-store headers
 */
export function jsonNoStore<T>(
  data: T,
  init?: Parameters<typeof NextResponse.json<T>>[1]
): NextResponse<T> {
  // Merge headers: init.headers first, then NO_STORE_HEADERS (Cache-Control always wins)
  const headers = {
    ...init?.headers,
    ...NO_STORE_HEADERS,
  };

  return NextResponse.json(data, {
    ...init,
    headers,
  });
}
