import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Use vi.hoisted() to ensure mocks are available before vi.mock hoisting
const {
  mockSignUp,
  mockSetAuthCookies,
  mockCheckIPRateLimit,
  mockCheckEmailRateLimit,
} = vi.hoisted(() => ({
  mockSignUp: vi.fn(),
  mockSetAuthCookies: vi.fn(),
  mockCheckIPRateLimit: vi.fn(),
  mockCheckEmailRateLimit: vi.fn(),
}));

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signUp: mockSignUp,
    },
  })),
}));

// Mock setAuthCookies
vi.mock('@/lib/auth/cookies', () => ({
  setAuthCookies: mockSetAuthCookies,
}));

// Mock rate limit functions
vi.mock('@/lib/auth/rateLimit', () => ({
  checkIPRateLimit: mockCheckIPRateLimit,
  checkEmailRateLimit: mockCheckEmailRateLimit,
}));

// Import route handler after mocks are set up
import { POST } from './route';

const createPostRequest = (
  body: unknown,
  headers?: Record<string, string>
): NextRequest => {
  const url = new URL('http://localhost:3000/api/auth/signup');
  return new NextRequest(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });
};

const validBody = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'Password123',
  confirmPassword: 'Password123',
};

describe('POST /api/auth/signup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    // Default: rate limit allows requests
    mockCheckIPRateLimit.mockResolvedValue({ allowed: true });
    mockCheckEmailRateLimit.mockResolvedValue({ allowed: true });
  });

  describe('Input Validation (422)', () => {
    it('should return 422 when name is missing', async () => {
      const req = createPostRequest({
        email: 'test@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      });
      const res = await POST(req);

      expect(res.status).toBe(422);
      const data = await res.json();
      expect(data.ok).toBe(false);
      expect(data.message).toContain('Name');
    });

    it('should return 422 when email is missing', async () => {
      const req = createPostRequest({
        name: 'Test User',
        password: 'Password123',
        confirmPassword: 'Password123',
      });
      const res = await POST(req);

      expect(res.status).toBe(422);
      const data = await res.json();
      expect(data.ok).toBe(false);
      expect(data.message).toContain('Email');
    });

    it('should return 422 when email format is invalid', async () => {
      const req = createPostRequest({
        name: 'Test User',
        email: 'invalid-email',
        password: 'Password123',
        confirmPassword: 'Password123',
      });
      const res = await POST(req);

      expect(res.status).toBe(422);
      const data = await res.json();
      expect(data.ok).toBe(false);
      expect(data.message).toBe('Invalid email format');
    });

    it('should return 422 when password is missing', async () => {
      const req = createPostRequest({
        name: 'Test User',
        email: 'test@example.com',
        confirmPassword: 'Password123',
      });
      const res = await POST(req);

      expect(res.status).toBe(422);
      const data = await res.json();
      expect(data.ok).toBe(false);
      expect(data.message).toContain('Password');
    });

    it('should return 422 when password is too short', async () => {
      const req = createPostRequest({
        name: 'Test User',
        email: 'test@example.com',
        password: 'short',
        confirmPassword: 'short',
      });
      const res = await POST(req);

      expect(res.status).toBe(422);
      const data = await res.json();
      expect(data.ok).toBe(false);
      expect(data.message).toBe('Password must be at least 8 characters');
    });

    it('should return 422 when confirmPassword is missing', async () => {
      const req = createPostRequest({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123',
      });
      const res = await POST(req);

      expect(res.status).toBe(422);
      const data = await res.json();
      expect(data.ok).toBe(false);
      expect(data.message).toContain('Confirm password');
    });

    it('should return 422 when passwords do not match', async () => {
      const req = createPostRequest({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123',
        confirmPassword: 'DifferentPassword',
      });
      const res = await POST(req);

      expect(res.status).toBe(422);
      const data = await res.json();
      expect(data.ok).toBe(false);
      expect(data.message).toBe('Passwords do not match');
    });

    it('should return 422 for invalid JSON body', async () => {
      const url = new URL('http://localhost:3000/api/auth/signup');
      const req = new NextRequest(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json {',
      });

      const res = await POST(req);

      expect(res.status).toBe(422);
      const data = await res.json();
      expect(data.ok).toBe(false);
      expect(data.message).toBe('Invalid request body');
    });
  });

  describe('Rate Limiting (429)', () => {
    it('should return 429 when rate limited by IP', async () => {
      mockCheckIPRateLimit.mockResolvedValue({
        allowed: false,
        retryAfter: 120,
      });

      const req = createPostRequest(validBody, {
        'x-forwarded-for': '192.168.1.1',
      });
      const res = await POST(req);

      expect(res.status).toBe(429);
      expect(res.headers.get('Retry-After')).toBe('120');
      const data = await res.json();
      expect(data.ok).toBe(false);
      expect(data.message).toBe('Too many attempts. Please try again later.');
      expect(data.retryAfter).toBe(120);
    });

    it('should return 429 when rate limited by email', async () => {
      mockCheckIPRateLimit.mockResolvedValue({ allowed: true });
      mockCheckEmailRateLimit.mockResolvedValue({
        allowed: false,
        retryAfter: 180,
      });

      const req = createPostRequest(validBody);
      const res = await POST(req);

      expect(res.status).toBe(429);
      expect(res.headers.get('Retry-After')).toBe('180');
      const data = await res.json();
      expect(data.ok).toBe(false);
      expect(data.message).toBe('Too many attempts. Please try again later.');
      expect(data.retryAfter).toBe(180);
    });
  });

  describe('Supabase Errors', () => {
    it('should return 500 when Supabase config is missing', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;

      const req = createPostRequest(validBody);
      const res = await POST(req);

      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.ok).toBe(false);
      expect(data.message).toBe('Server configuration error');
    });

    it('should return 400 with generic message when signup fails (prevent user enumeration)', async () => {
      mockSignUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'User already registered' },
      });

      const req = createPostRequest(validBody);
      const res = await POST(req);

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.ok).toBe(false);
      // Should NOT reveal that email already exists
      expect(data.message).toBe('Registration failed. Please try again.');
      expect(data.message).not.toContain('already');
      expect(data.message).not.toContain('exist');
    });
  });

  describe('Successful Registration', () => {
    it('should return 200 with next=/reco and set cookies when session exists', async () => {
      mockSignUp.mockResolvedValue({
        data: {
          user: { id: 'user-123' },
          session: {
            access_token: 'test-access-token',
            refresh_token: 'test-refresh-token',
          },
        },
        error: null,
      });

      const req = createPostRequest(validBody);
      const res = await POST(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.next).toBe('/reco');
      // Security: tokens should NOT be in response body
      expect(data.accessToken).toBeUndefined();
      expect(data.refreshToken).toBeUndefined();
      // Verify cookies were set
      expect(mockSetAuthCookies).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          accessToken: 'test-access-token',
          refreshToken: 'test-refresh-token',
          userId: 'user-123',
        })
      );
    });

    it('should return 200 with next=/auth/verify-email when email confirmation required', async () => {
      mockSignUp.mockResolvedValue({
        data: {
          user: { id: 'user-123' },
          session: null, // No session = email confirmation required
        },
        error: null,
      });

      const req = createPostRequest(validBody);
      const res = await POST(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.next).toBe('/auth/verify-email');
      expect(data.message).toContain('verify');
      // Should NOT set cookies when no session
      expect(mockSetAuthCookies).not.toHaveBeenCalled();
    });

    it('should call signUp with correct parameters including name in metadata', async () => {
      mockSignUp.mockResolvedValue({
        data: {
          user: { id: 'user-123' },
          session: null,
        },
        error: null,
      });

      const req = createPostRequest({
        name: 'John Doe',
        email: 'JOHN@Example.COM', // Test email normalization
        password: 'SecurePass123',
        confirmPassword: 'SecurePass123',
      });
      await POST(req);

      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'john@example.com', // Should be normalized (lowercase)
        password: 'SecurePass123',
        options: {
          data: { name: 'John Doe' },
        },
      });
    });
  });

  describe('Security', () => {
    it('should normalize email to lowercase for rate limiting consistency', async () => {
      mockSignUp.mockResolvedValue({
        data: { user: { id: 'user-123' }, session: null },
        error: null,
      });

      const req = createPostRequest({
        ...validBody,
        email: 'TEST@EXAMPLE.COM',
      });
      await POST(req);

      // Email should be normalized before rate limit check
      expect(mockCheckEmailRateLimit).toHaveBeenCalledWith('test@example.com');
    });

    it('should skip IP rate limit when IP is unknown', async () => {
      mockSignUp.mockResolvedValue({
        data: { user: { id: 'user-123' }, session: null },
        error: null,
      });

      // Request without x-forwarded-for or x-real-ip headers
      const req = createPostRequest(validBody);
      await POST(req);

      // IP rate limit should not be checked for unknown IP
      expect(mockCheckIPRateLimit).not.toHaveBeenCalled();
      // But email rate limit should still be checked
      expect(mockCheckEmailRateLimit).toHaveBeenCalled();
    });
  });
});
