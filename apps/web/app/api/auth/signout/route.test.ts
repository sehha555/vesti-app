import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { mockSignOut, mockCookieStore } = vi.hoisted(() => ({
  mockSignOut: vi.fn(),
  mockCookieStore: {
    getAll: vi.fn(() => []),
    set: vi.fn(),
  },
}));

// Mock next/headers cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

// Mock Supabase SSR client（登出時由它清掉 sb-<ref>-auth-token）
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      signOut: mockSignOut,
    },
  })),
}));

import { POST, GET } from './route';

const createRequest = (method: 'POST' | 'GET' = 'POST'): NextRequest => {
  return new NextRequest('http://localhost:3000/api/auth/signout', {
    method,
  });
};

const CLEARED_COOKIES = ['sb-auth-status', 'sb-auth-token', 'sb-refresh-token', 'sb-user-id'];

describe('POST /api/auth/signout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NODE_ENV = 'development';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    mockSignOut.mockResolvedValue({ error: null });
  });

  it('should return 200 with success message', async () => {
    const res = await POST(createRequest('POST'));

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.message).toBe('Signed out successfully');
  });

  it('should sign out the Supabase session for this device', async () => {
    await POST(createRequest('POST'));

    expect(mockSignOut).toHaveBeenCalledWith({ scope: 'local' });
  });

  it('should clear the marker and legacy cookies with Max-Age=0', async () => {
    const res = await POST(createRequest('POST'));

    const setCookieHeaders = res.headers.getSetCookie();
    expect(setCookieHeaders.length).toBe(CLEARED_COOKIES.length);

    for (const cookieName of CLEARED_COOKIES) {
      const cookieHeader = setCookieHeaders.find((c) =>
        c.startsWith(`${cookieName}=`)
      );
      expect(cookieHeader).toBeDefined();
      expect(cookieHeader).toContain('Max-Age=0');
    }
  });

  it('should still clear cookies when Supabase signOut fails', async () => {
    mockSignOut.mockResolvedValue({ error: { message: 'network error' } });

    const res = await POST(createRequest('POST'));

    expect(res.status).toBe(200);
    expect(res.headers.getSetCookie()).toContainEqual(
      expect.stringContaining('sb-auth-status=')
    );
  });

  it('should still clear cookies when Supabase config is missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;

    const res = await POST(createRequest('POST'));

    expect(res.status).toBe(200);
    expect(mockSignOut).not.toHaveBeenCalled();
    expect(res.headers.getSetCookie()).toContainEqual(
      expect.stringContaining('sb-auth-status=')
    );
  });
});

describe('GET /api/auth/signout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NODE_ENV = 'development';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    mockSignOut.mockResolvedValue({ error: null });
  });

  it('should redirect to home page', async () => {
    const res = await GET(createRequest('GET'));

    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('http://localhost:3000/');
  });

  it('should sign out and clear cookies on GET', async () => {
    const res = await GET(createRequest('GET'));

    expect(mockSignOut).toHaveBeenCalledWith({ scope: 'local' });
    const setCookieHeaders = res.headers.getSetCookie();
    expect(setCookieHeaders).toContainEqual(
      expect.stringContaining('sb-auth-status=')
    );
    expect(setCookieHeaders.every((c) => c.toLowerCase().includes('max-age=0'))).toBe(true);
  });
});
