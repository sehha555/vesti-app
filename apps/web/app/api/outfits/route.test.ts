import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from './route';

vi.mock('@/lib/supabase/server', () => ({
  getSupabaseAndUser: vi.fn(),
}));

vi.mock('@/lib/metrics', () => ({
  logDeprecationMetric: vi.fn(),
}));

import { getSupabaseAndUser } from '@/lib/supabase/server';
import { logDeprecationMetric } from '@/lib/metrics';

const mockGetSupabaseAndUser = vi.mocked(getSupabaseAndUser);
const mockLogDeprecationMetric = vi.mocked(logDeprecationMetric);

function createMockRequest(body: any = {}, method: 'GET' | 'POST' = 'GET'): NextRequest {
  return new NextRequest(
    method === 'GET'
      ? 'http://localhost/api/outfits'
      : new URL('http://localhost/api/outfits'),
    {
      method,
      body: method === 'POST' ? JSON.stringify(body) : undefined,
      headers: method === 'POST' ? { 'Content-Type': 'application/json' } : {},
    }
  );
}

const validUUID = '550e8400-e29b-41d4-a716-446655440000';
const validItemId = '550e8400-e29b-41d4-a716-446655440001';

describe('GET /api/outfits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when user is not authenticated', async () => {
    mockGetSupabaseAndUser.mockResolvedValue({
      supabase: {} as any,
      user: null,
    });

    const response = await GET(createMockRequest());

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Unauthorized');
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  });

  it('should return outfits for authenticated user', async () => {
    const userId = validUUID;
    const mockOutfits = [
      { id: validItemId, title: 'Casual Outfit', notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ];

    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: mockOutfits,
        error: null,
      }),
    };

    mockGetSupabaseAndUser.mockResolvedValue({
      supabase: mockSupabase as any,
      user: { id: userId } as any,
    });

    const response = await GET(createMockRequest());

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  });
});

describe('POST /api/outfits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLogDeprecationMetric.mockClear();
  });

  it('should return 401 when user is not authenticated', async () => {
    mockGetSupabaseAndUser.mockResolvedValue({
      supabase: {} as any,
      user: null,
    });

    const body = {
      title: 'New Outfit',
      items: [{ closetItemId: validItemId, position: 1, layer: 'top' }],
    };

    const response = await POST(createMockRequest(body, 'POST'));

    expect(response.status).toBe(401);
    const responseBody = await response.json();
    expect(responseBody.error).toBe('Unauthorized');
  });

  it('should return 400 when items are missing', async () => {
    const userId = validUUID;
    mockGetSupabaseAndUser.mockResolvedValue({
      supabase: {} as any,
      user: { id: userId } as any,
    });

    const body = {
      title: 'New Outfit',
      // items missing
    };

    const response = await POST(createMockRequest(body, 'POST'));

    expect(response.status).toBe(400);
    const responseBody = await response.json();
    expect(responseBody.error).toContain('Invalid request');
  });

  it('should return 400 when items array is empty', async () => {
    const userId = validUUID;
    mockGetSupabaseAndUser.mockResolvedValue({
      supabase: {} as any,
      user: { id: userId } as any,
    });

    const body = {
      title: 'New Outfit',
      items: [],
    };

    const response = await POST(createMockRequest(body, 'POST'));

    expect(response.status).toBe(400);
  });

  it('should create outfit and items successfully', async () => {
    const userId = validUUID;
    const outfitId = '550e8400-e29b-41d4-a716-446655440002';
    const closetItemId = validItemId;

    const mockSupabase = {
      from: vi.fn().mockImplementation((tableName: string) => {
        if (tableName === 'closet_items') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({
                  count: 1,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (tableName === 'outfits') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: outfitId,
                    title: 'Casual Outfit',
                    notes: 'Perfect for weekend',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (tableName === 'outfit_items') {
          return {
            insert: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          };
        }
      }),
    };

    mockGetSupabaseAndUser.mockResolvedValue({
      supabase: mockSupabase as any,
      user: { id: userId } as any,
    });

    const body = {
      title: 'Casual Outfit',
      notes: 'Perfect for weekend',
      items: [
        { closetItemId, position: 1, layer: 'top' },
      ],
    };

    const response = await POST(createMockRequest(body, 'POST'));

    expect(response.status).toBe(201);
    const responseBody = await response.json();
    expect(responseBody.id).toBe(outfitId);
    expect(responseBody.title).toBe('Casual Outfit');
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  });

  it('should return 403 when closet item does not belong to user', async () => {
    const userId = validUUID;

    const mockSupabase = {
      from: vi.fn().mockImplementation((tableName: string) => {
        if (tableName === 'closet_items') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({
                  count: 0, // No matching items (item doesn't belong to user)
                  error: null,
                }),
              }),
            }),
          };
        }
      }),
    };

    mockGetSupabaseAndUser.mockResolvedValue({
      supabase: mockSupabase as any,
      user: { id: userId } as any,
    });

    const body = {
      title: 'Outfit with unauthorized item',
      items: [
        { closetItemId: '550e8400-e29b-41d4-a716-446655440099', position: 1, layer: 'top' },
      ],
    };

    const response = await POST(createMockRequest(body, 'POST'));

    expect(response.status).toBe(403);
    const responseBody = await response.json();
    expect(responseBody.error).toContain('not found or unauthorized');
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  });

  it('should accept legacy itemIds format and transform to new format', async () => {
    const userId = validUUID;
    const outfitId = '550e8400-e29b-41d4-a716-446655440002';
    const itemId1 = validItemId;
    const itemId2 = '550e8400-e29b-41d4-a716-446655440003';

    const mockSupabase = {
      from: vi.fn().mockImplementation((tableName: string) => {
        if (tableName === 'closet_items') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({
                  count: 2, // Both items belong to user
                  error: null,
                }),
              }),
            }),
          };
        }
        if (tableName === 'outfits') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: outfitId,
                    title: 'Legacy Outfit',
                    notes: 'Old format outfit',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (tableName === 'outfit_items') {
          return {
            insert: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          };
        }
      }),
    };

    mockGetSupabaseAndUser.mockResolvedValue({
      supabase: mockSupabase as any,
      user: { id: userId } as any,
    });

    const body = {
      name: 'Legacy Outfit',
      description: 'Old format outfit',
      itemIds: [itemId1, itemId2],
    };

    const response = await POST(createMockRequest(body, 'POST'));

    expect(response.status).toBe(201);
    const responseBody = await response.json();
    expect(responseBody.id).toBe(outfitId);
    expect(responseBody.title).toBe('Legacy Outfit');
    // Check for deprecation headers
    expect(response.headers.get('Deprecation')).toBe('true');
    expect(response.headers.get('Sunset')).toBe('2026-03-01T00:00:00Z');
    expect(response.headers.get('Link')).toContain('rel="deprecation"');
    // Verify deprecation metric was logged
    expect(mockLogDeprecationMetric).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: 'POST /api/outfits',
        format: 'legacy',
        userId: userId,
        itemCount: 2,
      })
    );
  });

  it('should reject legacy format with unauthorized closet items (403)', async () => {
    const userId = validUUID;

    const mockSupabase = {
      from: vi.fn().mockImplementation((tableName: string) => {
        if (tableName === 'closet_items') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({
                  count: 0, // No items belong to user
                  error: null,
                }),
              }),
            }),
          };
        }
      }),
    };

    mockGetSupabaseAndUser.mockResolvedValue({
      supabase: mockSupabase as any,
      user: { id: userId } as any,
    });

    const body = {
      name: 'Legacy Outfit with unauthorized items',
      itemIds: [validItemId, '550e8400-e29b-41d4-a716-446655440099'],
    };

    const response = await POST(createMockRequest(body, 'POST'));

    expect(response.status).toBe(403);
    const responseBody = await response.json();
    expect(responseBody.error).toContain('not found or unauthorized');
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    // Verify deprecation metric was still logged even though validation failed later
    expect(mockLogDeprecationMetric).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: 'POST /api/outfits',
        format: 'legacy',
        userId: userId,
        itemCount: 2,
      })
    );
  });
});
