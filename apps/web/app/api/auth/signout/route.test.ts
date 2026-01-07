import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST, GET } from './route';
import { NextRequest } from 'next/server';

// Mock next/headers cookies
const mockCookieStore = {
  get: vi.fn(),
};

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

const createRequest = (method: 'POST' | 'GET' = 'POST'): NextRequest => {
  return new NextRequest('http://localhost:3000/api/auth/signout', {
    method,
  });
};

describe('POST /api/auth/signout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NODE_ENV = 'development';
  });

  it('should return 200 with success message', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'test-token' });

    const req = createRequest('POST');
    const res = await POST(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.message).toBe('Signed out successfully');
  });

  it('should clear all session cookies with Max-Age=0', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'test-token' });

    const req = createRequest('POST');
    const res = await POST(req);

    const setCookieHeaders = res.headers.getSetCookie();
    const cookieNames = ['sb-auth-token', 'sb-refresh-token', 'sb-user-id', 'sb-auth-status'];

    expect(setCookieHeaders.length).toBe(cookieNames.length);

    // Verify each cookie is cleared with Max-Age=0
    for (const cookieName of cookieNames) {
      const cookieHeader = setCookieHeaders.find((c) =>
        c.startsWith(`${cookieName}=`)
      );
      expect(cookieHeader).toBeDefined();
      expect(cookieHeader).toContain('Max-Age=0');
    }
  });

  it('should work even if cookies do not exist', async () => {
    mockCookieStore.get.mockReturnValue(undefined);

    const req = createRequest('POST');
    const res = await POST(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });
});

describe('GET /api/auth/signout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NODE_ENV = 'development';
  });

  it('should redirect to home page', async () => {
    const req = createRequest('GET');
    const res = await GET(req);

    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('http://localhost:3000/');
  });

  it('should clear all session cookies on GET', async () => {
    const req = createRequest('GET');
    const res = await GET(req);

    const setCookieHeaders = res.headers.getSetCookie();

    // Check that cookies are cleared
    expect(setCookieHeaders).toContainEqual(
      expect.stringContaining('sb-auth-token=')
    );
    // Max-Age=0 means cookie is deleted (case-insensitive check)
    expect(setCookieHeaders.some(c => c.toLowerCase().includes('max-age=0'))).toBe(true);
  });
});
