import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  getSupabaseAndUser: vi.fn(),
}));

vi.mock('@/lib/rateLimit', () => ({
  checkRateLimit: vi.fn(),
  cacheResponse: vi.fn(),
  getCachedResponse: vi.fn(),
}));

import { getSupabaseAndUser } from '@/lib/supabase/server';
import { checkRateLimit, cacheResponse, getCachedResponse } from '@/lib/rateLimit';

const mockGetSupabaseAndUser = vi.mocked(getSupabaseAndUser);
const mockCheckRateLimit = vi.mocked(checkRateLimit);
const mockCacheResponse = vi.mocked(cacheResponse);
const mockGetCachedResponse = vi.mocked(getCachedResponse);

function createMockRequest(): NextRequest {
  return new NextRequest('http://localhost/api/closet-items/item-123/refresh-url');
}

function createMockContext(id = 'item-123') {
  return { params: Promise.resolve({ id }) };
}

describe('GET /api/closet-items/[id]/refresh-url', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: rate limit allowed
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 4,
      limit: 5,
      resetAfter: 10,
      resetAt: Math.floor(Date.now() / 1000) + 10,
    });
    mockCacheResponse.mockResolvedValue(undefined);
    mockGetCachedResponse.mockResolvedValue(null);
  });

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockGetSupabaseAndUser.mockResolvedValue({
        supabase: {} as ReturnType<typeof mockGetSupabaseAndUser> extends Promise<infer T> ? T['supabase'] : never,
        user: null,
      });

      const response = await GET(createMockRequest(), createMockContext());

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
      expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    });
  });

  describe('Authorization (ownership)', () => {
    it('should return 404 when item does not exist', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      };

      mockGetSupabaseAndUser.mockResolvedValue({
        supabase: mockSupabase as unknown as ReturnType<typeof mockGetSupabaseAndUser> extends Promise<infer T> ? T['supabase'] : never,
        user: { id: 'user-123' } as { id: string },
      });

      const response = await GET(createMockRequest(), createMockContext());

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error).toBe('Item not found');
    });

    it('should return 404 when user does not own the item (non-owner)', async () => {
      // When user_id filter doesn't match, Supabase returns no rows
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      mockGetSupabaseAndUser.mockResolvedValue({
        supabase: mockSupabase as unknown as ReturnType<typeof mockGetSupabaseAndUser> extends Promise<infer T> ? T['supabase'] : never,
        user: { id: 'other-user' } as { id: string },
      });

      const response = await GET(createMockRequest(), createMockContext());

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error).toBe('Item not found');
    });
  });

  describe('Success case (owner)', () => {
    it('should return 200 with imageUrl and expiresAt', async () => {
      const userId = 'user-123';
      const signedUrl = 'https://storage.supabase.co/signed-url?token=abc';

      const mockStorage = {
        from: vi.fn().mockReturnValue({
          createSignedUrl: vi.fn().mockResolvedValue({
            data: { signedUrl },
            error: null,
          }),
        }),
      };

      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { image_url: `${userId}/image.jpg` },
          error: null,
        }),
        storage: mockStorage,
      };

      mockGetSupabaseAndUser.mockResolvedValue({
        supabase: mockSupabase as unknown as ReturnType<typeof mockGetSupabaseAndUser> extends Promise<infer T> ? T['supabase'] : never,
        user: { id: userId } as { id: string },
      });

      const response = await GET(createMockRequest(), createMockContext());

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.imageUrl).toBe(signedUrl);
      expect(body.expiresAt).toBeDefined();
      expect(response.headers.get('Cache-Control')).toBe('private, no-store');

      // Verify expiresAt is within expected range (±5 seconds)
      const expiresAtMs = new Date(body.expiresAt).getTime();
      const expectedMs = Date.now() + 300 * 1000; // Default 300s
      expect(Math.abs(expiresAtMs - expectedMs)).toBeLessThan(5000);
    });

    it('should cache response with correct TTL', async () => {
      const userId = 'user-123';
      const signedUrl = 'https://storage.supabase.co/signed-url?token=abc';

      const mockStorage = {
        from: vi.fn().mockReturnValue({
          createSignedUrl: vi.fn().mockResolvedValue({
            data: { signedUrl },
            error: null,
          }),
        }),
      };

      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { image_url: `${userId}/image.jpg` },
          error: null,
        }),
        storage: mockStorage,
      };

      mockGetSupabaseAndUser.mockResolvedValue({
        supabase: mockSupabase as unknown as ReturnType<typeof mockGetSupabaseAndUser> extends Promise<infer T> ? T['supabase'] : never,
        user: { id: userId } as { id: string },
      });

      await GET(createMockRequest(), createMockContext('item-456'));

      // Verify cache key contains userId:itemId
      expect(mockCacheResponse).toHaveBeenCalledWith(
        `${userId}:item-456`,
        expect.objectContaining({ imageUrl: signedUrl }),
        300 // TTL = SIGNED_URL_EXPIRES_IN
      );
    });
  });

  describe('Rate limiting', () => {
    it('should return cached response when rate limited and cache is valid (>= 30s remaining)', async () => {
      const cachedResponse = {
        imageUrl: 'https://cached-url',
        expiresAt: new Date(Date.now() + 60_000).toISOString(), // 60s remaining
      };

      mockCheckRateLimit.mockResolvedValue({
        allowed: false,
        remaining: 0,
        limit: 5,
        resetAfter: 8,
        resetAt: Math.floor(Date.now() / 1000) + 8,
        retryAfter: 8,
      });

      mockGetCachedResponse.mockResolvedValue(cachedResponse);

      mockGetSupabaseAndUser.mockResolvedValue({
        supabase: {} as ReturnType<typeof mockGetSupabaseAndUser> extends Promise<infer T> ? T['supabase'] : never,
        user: { id: 'user-123' } as { id: string },
      });

      const response = await GET(createMockRequest(), createMockContext());

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.imageUrl).toBe(cachedResponse.imageUrl);
      expect(body.expiresAt).toBe(cachedResponse.expiresAt);
    });

    it('should return 429 when rate limited and cache is expired (< 30s remaining)', async () => {
      const cachedResponse = {
        imageUrl: 'https://cached-url',
        expiresAt: new Date(Date.now() + 20_000).toISOString(), // Only 20s remaining
      };

      mockCheckRateLimit.mockResolvedValue({
        allowed: false,
        remaining: 0,
        limit: 5,
        resetAfter: 8,
        resetAt: Math.floor(Date.now() / 1000) + 8,
        retryAfter: 8,
      });

      mockGetCachedResponse.mockResolvedValue(cachedResponse);

      mockGetSupabaseAndUser.mockResolvedValue({
        supabase: {} as ReturnType<typeof mockGetSupabaseAndUser> extends Promise<infer T> ? T['supabase'] : never,
        user: { id: 'user-123' } as { id: string },
      });

      const response = await GET(createMockRequest(), createMockContext());

      expect(response.status).toBe(429);
      const body = await response.json();
      expect(body.error).toBe('Too many requests');
      expect(response.headers.get('Retry-After')).toBe('8');
    });

    it('should return 429 when rate limited and no cache exists', async () => {
      mockCheckRateLimit.mockResolvedValue({
        allowed: false,
        remaining: 0,
        limit: 5,
        resetAfter: 5,
        resetAt: Math.floor(Date.now() / 1000) + 5,
        retryAfter: 5,
      });

      mockGetCachedResponse.mockResolvedValue(null);

      mockGetSupabaseAndUser.mockResolvedValue({
        supabase: {} as ReturnType<typeof mockGetSupabaseAndUser> extends Promise<infer T> ? T['supabase'] : never,
        user: { id: 'user-123' } as { id: string },
      });

      const response = await GET(createMockRequest(), createMockContext());

      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBe('5');
    });
  });

  describe('Cache key format', () => {
    it('should use userId:itemId as cache key', async () => {
      const userId = 'user-abc';
      const itemId = 'item-xyz';

      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      mockGetSupabaseAndUser.mockResolvedValue({
        supabase: mockSupabase as unknown as ReturnType<typeof mockGetSupabaseAndUser> extends Promise<infer T> ? T['supabase'] : never,
        user: { id: userId } as { id: string },
      });

      await GET(createMockRequest(), createMockContext(itemId));

      expect(mockCheckRateLimit).toHaveBeenCalledWith(
        `${userId}:${itemId}`,
        expect.any(Object)
      );
    });
  });

  describe('Cache-Control header (regression)', () => {
    it('should include Cache-Control: private, no-store on all responses', async () => {
      const userId = 'user-123';
      const signedUrl = 'https://storage.supabase.co/signed-url?token=secret';

      const mockStorage = {
        from: vi.fn().mockReturnValue({
          createSignedUrl: vi.fn().mockResolvedValue({
            data: { signedUrl },
            error: null,
          }),
        }),
      };

      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { image_url: `${userId}/image.jpg` },
          error: null,
        }),
        storage: mockStorage,
      };

      mockGetSupabaseAndUser.mockResolvedValue({
        supabase: mockSupabase as unknown as ReturnType<typeof mockGetSupabaseAndUser> extends Promise<infer T> ? T['supabase'] : never,
        user: { id: userId } as { id: string },
      });

      const response = await GET(createMockRequest(), createMockContext());

      expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    });
  });

  describe('Security (token leakage prevention)', () => {
    it('should not include signed URL or token in 500 error response', async () => {
      const userId = 'user-123';
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const mockStorage = {
        from: vi.fn().mockReturnValue({
          createSignedUrl: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Storage error with secret https://storage.supabase.co?token=leaked' },
          }),
        }),
      };

      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { image_url: `${userId}/image.jpg` },
          error: null,
        }),
        storage: mockStorage,
      };

      mockGetSupabaseAndUser.mockResolvedValue({
        supabase: mockSupabase as unknown as ReturnType<typeof mockGetSupabaseAndUser> extends Promise<infer T> ? T['supabase'] : never,
        user: { id: userId } as { id: string },
      });

      const response = await GET(createMockRequest(), createMockContext());
      const body = await response.json();
      const bodyString = JSON.stringify(body);

      // Response body must not contain URLs or tokens
      expect(response.status).toBe(500);
      expect(bodyString).not.toContain('https://');
      expect(bodyString).not.toContain('token=');
      expect(body.error).toBe('Failed to generate URL');

      // Server log should not expose imageUrl (only error message prefix)
      const logCalls = consoleSpy.mock.calls.flat().join(' ');
      expect(logCalls).not.toContain('imageUrl');

      consoleSpy.mockRestore();
    });
  });
});
