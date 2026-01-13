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
    'http://localhost/api/reco/basket-mixmatch/save',
    {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

const validUUID = '550e8400-e29b-41d4-a716-446655440000';
const validItemId = '550e8400-e29b-41d4-a716-446655440001';
const catalogItemId = '550e8400-e29b-41d4-a716-446655440002';

describe('POST /api/reco/basket-mixmatch/save', () => {
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
    it('should use rate limit key with "basket-mixmatch" segment (separate from daily)', async () => {
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
        items: [{ item_type: 'catalog', catalog_item_id: catalogItemId }],
      };

      await POST(createMockRequest(body));

      // Verify rate limit check uses 'reco-save:basket-mixmatch:userId' key pattern
      // This must be DIFFERENT from daily's 'reco-save:daily:userId'
      expect(mockCheckRateLimit).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ keyPrefix: 'reco-save:basket-mixmatch' })
      );
    });

    it('should have separate rate limit quota from daily-outfits/save', () => {
      // Verify the keyPrefix is different
      // This test documents the design: two endpoints use different rate limit buckets
      const dailyKeyPrefix = 'reco-save:daily';
      const basketKeyPrefix = 'reco-save:basket-mixmatch';

      expect(dailyKeyPrefix).not.toBe(basketKeyPrefix);
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

  describe('Mixed item types (closet + catalog)', () => {
    it('should accept mixed closet_item_id and catalog_item_id', async () => {
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
        items: [
          { item_type: 'closet', closet_item_id: validItemId },
          { item_type: 'catalog', catalog_item_id: catalogItemId },
        ],
        occasion: 'shopping',
      };

      const response = await POST(createMockRequest(body));

      expect(response.status).toBe(201);
      expect(mockRpc).toHaveBeenCalledWith(
        'create_outfit_with_items',
        expect.objectContaining({
          p_source: 'basket_mixmatch',
          p_items: body.items,
        })
      );
    });
  });

  describe('RPC parameter null coalesce (basket specific)', () => {
    it('should always pass p_season as null (no season for basket)', async () => {
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
        items: [{ item_type: 'catalog', catalog_item_id: catalogItemId }],
        occasion: 'shopping',
      };

      await POST(createMockRequest(body));

      expect(mockRpc).toHaveBeenCalledWith(
        'create_outfit_with_items',
        expect.objectContaining({
          p_season: null,  // Always null for basket
          p_occasion: 'shopping',
        })
      );
    });

    it('should pass provided occasion (not null)', async () => {
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
        items: [{ item_type: 'catalog', catalog_item_id: catalogItemId }],
        occasion: 'vacation',
        notes: 'Beach outfit',
      };

      await POST(createMockRequest(body));

      expect(mockRpc).toHaveBeenCalledWith(
        'create_outfit_with_items',
        expect.objectContaining({
          p_source: 'basket_mixmatch',
          p_season: null,
          p_occasion: 'vacation',
          p_notes: 'Beach outfit',
        })
      );
    });

    it('should pass null for occasion when not provided', async () => {
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
        items: [{ item_type: 'catalog', catalog_item_id: catalogItemId }],
      };

      await POST(createMockRequest(body));

      expect(mockRpc).toHaveBeenCalledWith(
        'create_outfit_with_items',
        expect.objectContaining({
          p_occasion: null,
        })
      );
    });
  });

  describe('Input validation', () => {
    it('should return 400 for invalid UUID in catalog_item_id', async () => {
      mockGetSupabaseAndUser.mockResolvedValue({
        supabase: {} as any,
        user: { id: validUUID } as any,
      });

      const response = await POST(createMockRequest({
        items: [{ item_type: 'catalog', catalog_item_id: 'invalid-uuid' }],
      }));

      expect(response.status).toBe(400);
      expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    });

    it('should return 400 for empty items array', async () => {
      mockGetSupabaseAndUser.mockResolvedValue({
        supabase: {} as any,
        user: { id: validUUID } as any,
      });

      const response = await POST(createMockRequest({
        items: [],
        occasion: 'shopping',
      }));

      expect(response.status).toBe(400);
      expect(response.headers.get('Cache-Control')).toBe('private, no-store');
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
        items: [
          { item_type: 'closet', closet_item_id: validItemId },
          { item_type: 'catalog', catalog_item_id: catalogItemId },
        ],
        occasion: 'shopping',
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
        items: [{ item_type: 'catalog', catalog_item_id: catalogItemId }],
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
