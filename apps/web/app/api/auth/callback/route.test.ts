import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Use vi.hoisted() to ensure mocks are available before vi.mock hoisting
const { mockExchangeCodeForSession, mockCookieStore, mockSetAuthCookies } = vi.hoisted(() => ({
  mockExchangeCodeForSession: vi.fn(),
  mockCookieStore: {
    getAll: vi.fn(() => []),
    set: vi.fn(),
  },
  mockSetAuthCookies: vi.fn(),
}));

// Mock next/headers cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

// Mock Supabase client (route.ts uses @supabase/supabase-js, not @supabase/ssr)
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      exchangeCodeForSession: mockExchangeCodeForSession,
    },
  })),
}));

// Mock setAuthCookies
vi.mock('../../../../lib/auth/cookies', () => ({
  setAuthCookies: mockSetAuthCookies,
}));

import { GET } from './route';

const createRequest = (searchParams?: Record<string, string>): NextRequest => {
  const url = new URL('http://localhost:3000/api/auth/callback');
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  return new NextRequest(url.toString(), {
    method: 'GET',
  });
};

describe('GET /api/auth/callback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.NODE_ENV = 'development';
  });

  it('should exchange code and call setAuthCookies with session data', async () => {
    const mockSession = {
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      user: { id: 'user-123' },
    };
    mockExchangeCodeForSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    const req = createRequest({ code: 'valid_oauth_code_1' });
    const res = await GET(req);

    expect(res.status).toBe(302);
    // Default redirect is /reco (when no auth_redirect_to cookie)
    expect(res.headers.get('location')).toBe('http://localhost:3000/reco');

    // Verify setAuthCookies was called with correct session data
    expect(mockSetAuthCookies).toHaveBeenCalledWith(
      expect.anything(), // response.cookies
      expect.objectContaining({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        userId: 'user-123',
      })
    );

    // Verify auth_redirect_to cookie is cleared
    const setCookieHeaders = res.headers.getSetCookie();
    const clearCookie = setCookieHeaders.find((c) =>
      c.startsWith('auth_redirect_to=')
    );
    expect(clearCookie).toBeDefined();
    expect(clearCookie).toContain('Max-Age=0');
  });

  it('should set Secure flag on auth_redirect_to clear cookie in production', async () => {
    process.env.NODE_ENV = 'production';
    const mockSession = {
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      user: { id: 'user-123' },
    };
    mockExchangeCodeForSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    const req = createRequest({ code: 'valid_oauth_code_2' });
    const res = await GET(req);
    const setCookieHeaders = res.headers.getSetCookie();

    // Verify auth_redirect_to clear cookie has Secure flag in production
    const clearCookie = setCookieHeaders.find((c) =>
      c.startsWith('auth_redirect_to=')
    );
    expect(clearCookie).toBeDefined();
    expect(clearCookie).toContain('Secure');
  });

  it('should redirect to home with error when OAuth error is present', async () => {
    const req = createRequest({
      error: 'access_denied',
      error_description: 'User denied access',
    });
    const res = await GET(req);

    expect(res.status).toBe(302);
    const location = res.headers.get('location');
    expect(location).toContain('http://localhost:3000/?');
    expect(location).toContain('auth_error=access_denied');
  });

  it('should redirect to home when code is missing', async () => {
    const req = createRequest();
    const res = await GET(req);

    expect(res.status).toBe(302);
    const location = res.headers.get('location');
    expect(location).toContain('http://localhost:3000/?');
    expect(location).toContain('auth_error=missing_code');
  });

  it('should redirect to home when code exchange fails', async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: null,
      error: { message: 'Invalid code' },
    });

    const req = createRequest({ code: 'invalid_code' });
    const res = await GET(req);

    expect(res.status).toBe(302);
    const location = res.headers.get('location');
    expect(location).toContain('http://localhost:3000/?');
    expect(location).toContain('auth_error=exchange_failed');
  });
});
