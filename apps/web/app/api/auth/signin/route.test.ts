import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Use vi.hoisted() to ensure mocks are available before vi.mock hoisting
const {
  mockSignInWithOAuth,
  mockSignInWithEmail,
  mockSetAuthCookies,
  mockCheckIPRateLimit,
  mockCheckEmailRateLimit,
  mockResetIPRateLimit,
  mockResetEmailRateLimit,
  mockCookieStore,
} = vi.hoisted(() => ({
  mockSignInWithOAuth: vi.fn(),
  mockSignInWithEmail: vi.fn(),
  mockSetAuthCookies: vi.fn(),
  mockCheckIPRateLimit: vi.fn(),
  mockCheckEmailRateLimit: vi.fn(),
  mockResetIPRateLimit: vi.fn(),
  mockResetEmailRateLimit: vi.fn(),
  mockCookieStore: {
    getAll: vi.fn(() => []),
    set: vi.fn(),
  },
}));

// Mock next/headers cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

// Mock Supabase SSR client
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      signInWithOAuth: mockSignInWithOAuth,
    },
  })),
}));

// Mock signInWithEmail
vi.mock('@/lib/auth/emailAuth', () => ({
  signInWithEmail: mockSignInWithEmail,
}));

// Mock setAuthCookies
vi.mock('@/lib/auth/cookies', () => ({
  setAuthCookies: mockSetAuthCookies,
}));

// Mock rate limit functions
vi.mock('@/lib/auth/rateLimit', () => ({
  checkIPRateLimit: mockCheckIPRateLimit,
  checkEmailRateLimit: mockCheckEmailRateLimit,
  resetIPRateLimit: mockResetIPRateLimit,
  resetEmailRateLimit: mockResetEmailRateLimit,
}));

// Note: @supabase/supabase-js is no longer used - we use @supabase/ssr for PKCE support

// Import route handlers after mocks are set up
import { GET, POST } from './route';

const createRequest = (searchParams?: Record<string, string>): NextRequest => {
  const url = new URL('http://localhost:3000/api/auth/signin');
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  return new NextRequest(url.toString(), {
    method: 'GET',
  });
};

const createPostRequest = (
  body: unknown,
  headers?: Record<string, string>
): NextRequest => {
  const url = new URL('http://localhost:3000/api/auth/signin');
  return new NextRequest(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });
};

describe('GET /api/auth/signin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set env vars
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  it('should redirect to OAuth URL with nk param in callback', async () => {
    const oauthUrl = 'https://test.supabase.co/auth/v1/authorize?provider=google';
    mockSignInWithOAuth.mockResolvedValue({
      data: { url: oauthUrl },
      error: null,
    });

    const req = createRequest();
    const res = await GET(req);

    // 302 redirect to OAuth URL
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe(oauthUrl);

    // OAuth callback includes nk param for cookie fallback
    expect(mockSignInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: expect.objectContaining({
        redirectTo: 'http://localhost:3000/api/auth/callback?nk=reco',
      }),
    });
  });

  it('should set auth_redirect_to cookie with default /reco', async () => {
    const oauthUrl = 'https://test.supabase.co/auth/v1/authorize?provider=google';
    mockSignInWithOAuth.mockResolvedValue({
      data: { url: oauthUrl },
      error: null,
    });

    const req = createRequest();
    const res = await GET(req);

    expect(res.status).toBe(302);
  });

  it('should accept next param from allowlist', async () => {
    const oauthUrl = 'https://test.supabase.co/auth/v1/authorize?provider=google';
    mockSignInWithOAuth.mockResolvedValue({
      data: { url: oauthUrl },
      error: null,
    });

    const req = createRequest({ next: '/wardrobe' });
    const res = await GET(req);

    expect(res.status).toBe(302);
    // Verify nk param in callback URL
    expect(mockSignInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          redirectTo: 'http://localhost:3000/api/auth/callback?nk=wardrobe',
        }),
      })
    );
  });

  it('should fallback to /reco when next param is not in allowlist (open redirect prevention)', async () => {
    const oauthUrl = 'https://test.supabase.co/auth/v1/authorize?provider=google';
    mockSignInWithOAuth.mockResolvedValue({
      data: { url: oauthUrl },
      error: null,
    });

    // Try to redirect to evil URL - should be rejected
    const req = createRequest({ next: 'https://evil.com/steal' });
    const res = await GET(req);

    expect(res.status).toBe(302);
    // Should use default nk=reco, NOT evil URL
    expect(mockSignInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          redirectTo: 'http://localhost:3000/api/auth/callback?nk=reco',
        }),
      })
    );
  });

  it('should fallback to /reco for unknown paths not in allowlist', async () => {
    const oauthUrl = 'https://test.supabase.co/auth/v1/authorize?provider=google';
    mockSignInWithOAuth.mockResolvedValue({
      data: { url: oauthUrl },
      error: null,
    });

    const req = createRequest({ next: '/admin/secret' });
    const res = await GET(req);

    expect(res.status).toBe(302);
    expect(mockSignInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          redirectTo: 'http://localhost:3000/api/auth/callback?nk=reco',
        }),
      })
    );
  });

  it('should return 500 when Supabase config is missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;

    const req = createRequest();
    const res = await GET(req);

    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.code).toBe('CONFIG_ERROR');
  });

  it('should return 500 when OAuth URL generation fails', async () => {
    mockSignInWithOAuth.mockResolvedValue({
      data: null,
      error: { message: 'OAuth init failed' },
    });

    const req = createRequest();
    const res = await GET(req);

    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.code).toBe('OAUTH_INIT_FAILED');
  });
});

describe('POST /api/auth/signin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    // Default: rate limit allows requests
    mockCheckIPRateLimit.mockResolvedValue({ allowed: true });
    mockCheckEmailRateLimit.mockResolvedValue({ allowed: true });
  });

  it('should return 422 when email is missing', async () => {
    const req = createPostRequest({ password: 'password123' });
    const res = await POST(req);

    expect(res.status).toBe(422);
    const data = await res.json();
    expect(data.message).toContain('Email');
  });

  it('should return 422 when password is missing', async () => {
    const req = createPostRequest({ email: 'user@example.com' });
    const res = await POST(req);

    expect(res.status).toBe(422);
    const data = await res.json();
    expect(data.message).toContain('Password');
  });

  it('should return 422 for invalid JSON body', async () => {
    const url = new URL('http://localhost:3000/api/auth/signin');
    const req = new NextRequest(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: 'invalid json {',
    });

    const res = await POST(req);

    expect(res.status).toBe(422);
    const data = await res.json();
    expect(data.message).toBe('Invalid request body');
  });

  it('should return 401 when credentials are invalid', async () => {
    mockSignInWithEmail.mockResolvedValue({ success: false });

    const req = createPostRequest({
      email: 'user@example.com',
      password: 'wrongpassword',
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.message).toBe('Invalid credentials');
    expect(mockSignInWithEmail).toHaveBeenCalledWith('user@example.com', 'wrongpassword');
  });

  it('should return 200 and set cookies on successful sign in', async () => {
    mockSignInWithEmail.mockResolvedValue({
      success: true,
      session: {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        userId: 'test-user-id',
      },
    });

    const req = createPostRequest({
      email: 'user@example.com',
      password: 'correctpassword',
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.redirectTo).toBe('/');
    expect(data.accessToken).toBeUndefined();
    expect(data.refreshToken).toBeUndefined();
    expect(data.userId).toBeUndefined();
    expect(mockSetAuthCookies).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        userId: 'test-user-id',
      })
    );
  });

  it('should return 429 when rate limited by email', async () => {
    mockCheckIPRateLimit.mockReturnValue({ allowed: true });
    mockCheckEmailRateLimit.mockReturnValue({
      allowed: false,
      retryAfter: 120,
    });

    const req = createPostRequest({
      email: 'user@example.com',
      password: 'password123',
    });
    const res = await POST(req);

    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('120');
    const data = await res.json();
    expect(data.message).toBe('Too many login attempts. Please try again later.');
    expect(data.retryAfter).toBe(120);
  });

  it('should return 429 when rate limited by ip', async () => {
    mockCheckIPRateLimit.mockReturnValue({
      allowed: false,
      retryAfter: 180,
    });

    const req = createPostRequest(
      {
        email: 'user@example.com',
        password: 'password123',
      },
      {
        'x-forwarded-for': '192.168.1.1',
      }
    );
    const res = await POST(req);

    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('180');
    const data = await res.json();
    expect(data.message).toBe('Too many login attempts. Please try again later.');
    expect(data.retryAfter).toBe(180);
  });

  it('should return 429 when email hash fails in production', async () => {
    // Set production mode
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    // Mock checkEmailRateLimit to return fail-closed (429)
    mockCheckIPRateLimit.mockResolvedValue({ allowed: true });
    mockCheckEmailRateLimit.mockResolvedValue({
      allowed: false,
      retryAfter: 60,
    });

    const req = createPostRequest({
      email: 'test@example.com',
      password: '123',
    });
    const res = await POST(req);

    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('60');
    const data = await res.json();
    expect(data.message).toBe('Too many login attempts. Please try again later.');
    expect(data.retryAfter).toBe(60);

    // Restore environment
    process.env.NODE_ENV = originalEnv;
  });

  it('should return 429 with retryAfter from failed email rate limit check', async () => {
    mockCheckIPRateLimit.mockResolvedValue({ allowed: true });
    mockCheckEmailRateLimit.mockResolvedValue({
      allowed: false,
      retryAfter: 300, // 5 minutes
    });

    const req = createPostRequest({
      email: 'user@example.com',
      password: 'password123',
    });
    const res = await POST(req);

    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.retryAfter).toBe(300);
    expect(res.headers.get('Retry-After')).toBe('300');
  });
});
