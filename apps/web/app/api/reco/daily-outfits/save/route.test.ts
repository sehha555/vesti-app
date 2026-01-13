import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  getSupabaseAndUser: vi.fn(),
}));

vi.mock('@/lib/rateLimit', () => ({
  checkRateLimit: vi.fn(),
}));

import { getSupabaseAndUser } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rateLimit';

const mockGetSupabaseAndUser = vi.mocked(getSupabaseAndUser);
const mockCheckRateLimit = vi.mocked(checkRateLimit);

function createMockRequest(body: any = {}): NextRequest {
  return new NextRequest(
    'http://localhost/api/reco/daily-outfits/save',
    {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

const validUUID = '550e8400-e29b-41d4-a716-446655440000';
const validItemId = '550e8400-e29b-41d4-a716-446655440001';

describe('POST /api/reco/daily-outfits/save', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: rate limit allowed
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 19,
      limit: 20,
      resetAfter: 60,
      resetAt: Math.floor(Date.now() / 1000) + 60,
    });
  });

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockGetSupabaseAndUser.mockResolvedValue({
        supabase: {} as any,
        user: null,
      });

      const response = await POST(createMockRequest({ items: [] }));

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
      expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    });
  });

  describe('Rate limiting with separate buckets', () => {
    it('should use rate limit key with "daily" segment', async () => {
      const userId = 'user-123';
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({
          data: [{ id: validUUID, user_id: userId, created_at: new Date().toISOString() }],
          error: null,
        }),
      };

      mockGetSupabaseAndUser.mockResolvedValue({
        supabase: mockSupabase as any,
        user: { id: userId } as any,
      });

      const body = {
        items: [{ item_type: 'closet', closet_item_id: validItemId }],
      };

      await POST(createMockRequest(body));

      // Verify rate limit check uses 'reco-save:daily:userId' key pattern
      expect(mockCheckRateLimit).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ keyPrefix: 'reco-save:daily' })
      );
    });

    it('should return 429 when rate limit exceeded', async () => {
      mockCheckRateLimit.mockResolvedValue({
        allowed: false,
        remaining: 0,
        limit: 20,
        resetAfter: 45,
        resetAt: Math.floor(Date.now() / 1000) + 45,
        retryAfter: 45,
      });

      mockGetSupabaseAndUser.mockResolvedValue({
        supabase: {} as any,
        user: { id: validUUID } as any,
      });

      const response = await POST(createMockRequest({}));

      expect(response.status).toBe(429);
      const body = await response.json();
      expect(body.error).toBe('Too many requests');
      expect(response.headers.get('Retry-After')).toBe('45');
      expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    });
  });

  describe('Input validation', () => {
    it('should return 400 for missing items', async () => {
      mockGetSupabaseAndUser.mockResolvedValue({
        supabase: {} as any,
        user: { id: validUUID } as any,
      });

      const response = await POST(createMockRequest({
        items: [],
        occasion: 'work',
      }));

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('Invalid request');
      expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    });

    it('should return 400 for invalid UUID in closet_item_id', async () => {
      mockGetSupabaseAndUser.mockResolvedValue({
        supabase: {} as any,
        user: { id: validUUID } as any,
      });

      const response = await POST(createMockRequest({
        items: [{ item_type: 'closet', closet_item_id: 'invalid-uuid' }],
      }));

      expect(response.status).toBe(400);
      expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    });

    it('should return 400 when neither closet_item_id nor catalog_item_id provided', async () => {
      mockGetSupabaseAndUser.mockResolvedValue({
        supabase: {} as any,
        user: { id: validUUID } as any,
      });

      const response = await POST(createMockRequest({
        items: [{ item_type: 'closet' }],
      }));

      expect(response.status).toBe(400);
      expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    });
  });

  describe('RPC parameter null coalesce', () => {
    it('should pass null for season when not provided', async () => {
      const userId = validUUID;
      const mockRpc = vi.fn().mockResolvedValue({
        data: [{ id: validUUID, user_id: userId, created_at: new Date().toISOString() }],
        error: null,
      });

      const mockSupabase = { rpc: mockRpc };

      mockGetSupabaseAndUser.mockResolvedValue({
        supabase: mockSupabase as any,
        user: { id: userId } as any,
      });

      const body = {
        items: [{ item_type: 'closet', closet_item_id: validItemId }],
        occasion: 'work',
      };

      await POST(createMockRequest(body));

      expect(mockRpc).toHaveBeenCalledWith(
        'create_outfit_with_items',
        expect.objectContaining({
          p_source: 'daily',
          p_season: null,
          p_occasion: 'work',
        })
      );
    });

    it('should pass provided season value (not null)', async () => {
      const userId = validUUID;
      const mockRpc = vi.fn().mockResolvedValue({
        data: [{ id: validUUID, user_id: userId, created_at: new Date().toISOString() }],
        error: null,
      });

      const mockSupabase = { rpc: mockRpc };

      mockGetSupabaseAndUser.mockResolvedValue({
        supabase: mockSupabase as any,
        user: { id: userId } as any,
      });

      const body = {
        items: [{ item_type: 'closet', closet_item_id: validItemId }],
        season: 'spring',
        occasion: 'casual',
      };

      await POST(createMockRequest(body));

      expect(mockRpc).toHaveBeenCalledWith(
        'create_outfit_with_items',
        expect.objectContaining({
          p_source: 'daily',
          p_season: 'spring',
          p_occasion: 'casual',
        })
      );
    });
  });

  describe('Success case', () => {
    it('should return 201 with outfit data', async () => {
      const userId = validUUID;
      const outfitId = validItemId;
      const createdAt = new Date().toISOString();

      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({
          data: [{ id: outfitId, user_id: userId, created_at: createdAt }],
          error: null,
        }),
      };

      mockGetSupabaseAndUser.mockResolvedValue({
        supabase: mockSupabase as any,
        user: { id: userId } as any,
      });

      const body = {
        items: [{ item_type: 'closet', closet_item_id: validItemId }],
      };

      const response = await POST(createMockRequest(body));

      expect(response.status).toBe(201);
      const responseBody = await response.json();
      expect(responseBody.id).toBe(outfitId);
      expect(responseBody.user_id).toBe(userId);
      expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    });
  });

  describe('Error handling and sanitization', () => {
    it('should not leak RPC error details in response', async () => {
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Sensitive RPC failure: token xyz' },
        }),
      };

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockGetSupabaseAndUser.mockResolvedValue({
        supabase: mockSupabase as any,
        user: { id: validUUID } as any,
      });

      const response = await POST(createMockRequest({
        items: [{ item_type: 'closet', closet_item_id: validItemId }],
      }));

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe('Failed to save outfit');
      const bodyString = JSON.stringify(body);
      expect(bodyString).not.toContain('token');
      expect(bodyString).not.toContain('PGRST116');

      consoleSpy.mockRestore();
    });
  });

  describe('Cache-Control headers', () => {
    it('should include Cache-Control header on all responses', async () => {
      mockGetSupabaseAndUser.mockResolvedValue({
        supabase: {} as any,
        user: null,
      });

      const response = await POST(createMockRequest({}));
      expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    });
  });
});
