import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';

// Mock Supabase client
const mockExchangeCodeForSession = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      exchangeCodeForSession: mockExchangeCodeForSession,
    },
  })),
}));

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

  it('should exchange code and set session cookies', async () => {
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
    expect(res.headers.get('location')).toBe('http://localhost:3000/');

    // Check cookies are set
    const setCookieHeaders = res.headers.getSetCookie();
    expect(setCookieHeaders).toContainEqual(
      expect.stringContaining('sb-auth-token=test-access-token')
    );
    expect(setCookieHeaders).toContainEqual(
      expect.stringContaining('sb-refresh-token=test-refresh-token')
    );
    expect(setCookieHeaders).toContainEqual(
      expect.stringContaining('sb-user-id=user-123')
    );
  });

  it('should set HttpOnly cookie', async () => {
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

    const setCookieHeaders = res.headers.getSetCookie();
    setCookieHeaders.forEach((cookie) => {
      if (cookie.includes('sb-auth-token') || cookie.includes('sb-refresh-token')) {
        expect(cookie.toLowerCase()).toContain('httponly');
      }
    });
  });

  it('should set Secure cookie in production', async () => {
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

    const req = createRequest({ code: 'valid_oauth_code_1' });
    const res = await GET(req);

    const setCookieHeaders = res.headers.getSetCookie();
    setCookieHeaders.forEach((cookie) => {
      if (cookie.includes('sb-auth-token')) {
        expect(cookie.toLowerCase()).toContain('secure');
      }
    });
  });

  it('should set SameSite=Lax cookie', async () => {
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

    const setCookieHeaders = res.headers.getSetCookie();
    setCookieHeaders.forEach((cookie) => {
      if (cookie.includes('sb-auth-token')) {
        expect(cookie.toLowerCase()).toContain('samesite=lax');
      }
    });
  });

  it('should redirect to login with error when OAuth error is present', async () => {
    const req = createRequest({
      error: 'access_denied',
      error_description: 'User denied access',
    });
    const res = await GET(req);

    expect(res.status).toBe(302);
    const location = res.headers.get('location');
    expect(location).toContain('/login');
    expect(location).toContain('error=access_denied');
  });

  it('should redirect to login when code is missing', async () => {
    const req = createRequest();
    const res = await GET(req);

    expect(res.status).toBe(302);
    const location = res.headers.get('location');
    expect(location).toContain('/login');
    expect(location).toContain('error=missing_code');
  });

  it('should redirect to login when code exchange fails', async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: null,
      error: { message: 'Invalid code' },
    });

    const req = createRequest({ code: 'invalid_code' });
    const res = await GET(req);

    expect(res.status).toBe(302);
    const location = res.headers.get('location');
    expect(location).toContain('/login');
    expect(location).toContain('error=exchange_failed');
  });
});
