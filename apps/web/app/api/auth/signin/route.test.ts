import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';

// Mock Supabase client
const mockSignInWithOAuth = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithOAuth: mockSignInWithOAuth,
    },
  })),
}));

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

describe('GET /api/auth/signin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set env vars
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  it('should redirect to OAuth URL with default redirectTo', async () => {
    const oauthUrl = 'https://test.supabase.co/auth/v1/authorize?provider=google';
    mockSignInWithOAuth.mockResolvedValue({
      data: { url: oauthUrl },
      error: null,
    });

    const req = createRequest();
    const res = await GET(req);

    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe(oauthUrl);
    expect(mockSignInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: expect.objectContaining({
        redirectTo: 'http://localhost:3000/auth/callback',
      }),
    });
  });

  it('should use custom redirectTo from query params', async () => {
    const oauthUrl = 'https://test.supabase.co/auth/v1/authorize?provider=google';
    mockSignInWithOAuth.mockResolvedValue({
      data: { url: oauthUrl },
      error: null,
    });

    const req = createRequest({ redirectTo: '/custom/callback' });
    const res = await GET(req);

    expect(res.status).toBe(302);
    expect(mockSignInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: expect.objectContaining({
        redirectTo: 'http://localhost:3000/custom/callback',
      }),
    });
  });

  it('should reject non-relative redirectTo (open redirect prevention)', async () => {
    const req = createRequest({ redirectTo: 'https://evil.com/callback' });
    const res = await GET(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.code).toBe('INVALID_REDIRECT');
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
