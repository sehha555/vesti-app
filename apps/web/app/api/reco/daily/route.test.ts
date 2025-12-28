import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST, GET } from './route';
import { NextRequest, NextResponse } from 'next/server';

// Mock the auth middleware
vi.mock('../../_middleware/auth', () => ({
  requireBffAuth: vi.fn(),
}));

// Mock the geocoding service
vi.mock('../../../../../services/weather/geocoding.service', () => ({
  geocodeLocation: vi.fn(),
  DEFAULT_LOCATION: { lat: 25.033, lon: 121.5654 },
}));

// Mock the weather service
vi.mock('../../../../../services/weather', () => ({
  getWeather: vi.fn(),
}));

// Mock Supabase
vi.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({
          data: [
            {
              id: 'top-1',
              user_id: 'test-user-id',
              name: '白色毛衣',
              type: 'top',
              imageUrl: 'https://example.com/top1.jpg',
              colors: ['white'],
              season: 'winter',
              style: 'minimalist',
              occasions: ['work'],
            },
            {
              id: 'bottom-1',
              user_id: 'test-user-id',
              name: '黑色長褲',
              type: 'bottom',
              imageUrl: 'https://example.com/bottom1.jpg',
              colors: ['black'],
              season: 'all-season',
              style: 'formal',
              occasions: ['work'],
            },
            {
              id: 'shoes-1',
              user_id: 'test-user-id',
              name: '黑色皮鞋',
              type: 'shoes',
              imageUrl: 'https://example.com/shoes1.jpg',
              colors: ['black'],
              season: 'all-season',
              style: 'formal',
              occasions: ['work'],
            },
            {
              id: 'outerwear-1',
              user_id: 'test-user-id',
              name: '灰色大衣',
              type: 'outerwear',
              imageUrl: 'https://example.com/coat1.jpg',
              colors: ['gray'],
              season: 'winter',
              style: 'minimalist',
              occasions: ['work'],
            },
          ],
          error: null,
        })),
      })),
    })),
  })),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({})),
}));

import { requireBffAuth } from '../../_middleware/auth';
import { geocodeLocation } from '../../../../../services/weather/geocoding.service';
import { getWeather } from '../../../../../services/weather';

// Helper to create NextRequest with JSON body
const createRequest = (body: unknown): NextRequest => {
  return new NextRequest('http://localhost:3000/api/reco/daily', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'test-api-key',
    },
    body: JSON.stringify(body),
  });
};

// Setup mocks
beforeEach(() => {
  vi.clearAllMocks();

  // Default: auth passes
  vi.mocked(requireBffAuth).mockResolvedValue({
    authorized: true,
    userId: 'test-user-id',
  });

  // Default: geocoding returns Taipei coordinates
  vi.mocked(geocodeLocation).mockResolvedValue({
    lat: 25.033,
    lon: 121.5654,
  });

  // Default: weather returns winter weather
  vi.mocked(getWeather).mockResolvedValue({
    temperature: 15,
    feelsLike: 13,
    humidity: 70,
    condition: 'cloudy',
    windSpeed: 10,
    locationName: '台北市中正區',
  });
});

describe('POST /api/reco/daily', () => {
  describe('BFF Authentication', () => {
    it('should return 401 when authentication fails', async () => {
      vi.mocked(requireBffAuth).mockResolvedValue({
        authorized: false,
        error: NextResponse.json(
          { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
          { status: 401 }
        ),
      });

      const req = createRequest({
        date: '2025-12-29',
        location: '台北',
        occasion: '上班',
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(data.code).toBe('AUTH_REQUIRED');
    });

    it('should call requireBffAuth with the request', async () => {
      const req = createRequest({
        date: '2025-12-29',
        location: '台北',
        occasion: '上班',
      });
      await POST(req);

      expect(requireBffAuth).toHaveBeenCalledTimes(1);
      expect(requireBffAuth).toHaveBeenCalledWith(req);
    });
  });

  describe('Request Validation', () => {
    it('should return 400 for invalid JSON body', async () => {
      const req = new NextRequest('http://localhost:3000/api/reco/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not valid json',
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.code).toBe('INVALID_JSON');
    });

    it('should return 400 for invalid date format', async () => {
      const req = createRequest({
        date: '29-12-2025', // Wrong format
        location: '台北',
        occasion: '上班',
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
      expect(data.details).toBeDefined();
    });

    it('should return 400 for missing required fields', async () => {
      const req = createRequest({
        date: '2025-12-29',
        // missing location and occasion
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid occasion', async () => {
      const req = createRequest({
        date: '2025-12-29',
        location: '台北',
        occasion: 'invalid_occasion',
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for outfitCount exceeding maximum', async () => {
      const req = createRequest({
        date: '2025-12-29',
        location: '台北',
        occasion: '上班',
        outfitCount: 100, // Exceeds max of 10
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should reject unknown fields (strict schema)', async () => {
      const req = createRequest({
        date: '2025-12-29',
        location: '台北',
        occasion: '上班',
        unknownField: 'should be rejected',
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Happy Path', () => {
    it('should return 200 with generated outfits', async () => {
      const req = createRequest({
        date: '2025-12-29',
        location: '台北',
        occasion: '上班',
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.date).toBe('2025-12-29');
      expect(Array.isArray(data.outfits)).toBe(true);
    });

    it('should include weather information in response', async () => {
      const req = createRequest({
        date: '2025-12-29',
        location: '台北',
        occasion: '上班',
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.weather).toBeDefined();
      expect(data.weather.temperature).toBe(15);
      expect(data.weather.condition).toBe('cloudy');
      expect(data.weather.locationName).toBe('台北市中正區');
    });

    it('should return outfits with required fields', async () => {
      const req = createRequest({
        date: '2025-12-29',
        location: '台北',
        occasion: '上班',
        outfitCount: 1,
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      if (data.outfits.length > 0) {
        const outfit = data.outfits[0];
        expect(outfit.id).toBeDefined();
        expect(outfit.items).toBeDefined();
        expect(outfit.score).toBeDefined();
        expect(outfit.reasons).toBeDefined();
        expect(typeof outfit.reasons.weatherMatched).toBe('boolean');
        expect(typeof outfit.reasons.occasionMatched).toBe('boolean');
      }
    });

    it('should respect outfitCount parameter', async () => {
      const req = createRequest({
        date: '2025-12-29',
        location: '台北',
        occasion: '上班',
        outfitCount: 2,
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.outfits.length).toBeLessThanOrEqual(2);
    });

    it('should accept English occasion values', async () => {
      const req = createRequest({
        date: '2025-12-29',
        location: '台北',
        occasion: 'work',
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.ok).toBe(true);
    });

    it('should accept bodyType parameter', async () => {
      const req = createRequest({
        date: '2025-12-29',
        location: '台北',
        occasion: '上班',
        bodyType: 'apple',
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.ok).toBe(true);
    });
  });

  describe('Weather Integration', () => {
    it('should call geocodeLocation with location name', async () => {
      const req = createRequest({
        date: '2025-12-29',
        location: '高雄',
        occasion: '上班',
      });

      await POST(req);

      expect(geocodeLocation).toHaveBeenCalledWith('高雄');
    });

    it('should call getWeather with geocoded coordinates', async () => {
      vi.mocked(geocodeLocation).mockResolvedValue({
        lat: 22.6273,
        lon: 120.3014,
      });

      const req = createRequest({
        date: '2025-12-29',
        location: '高雄',
        occasion: '上班',
      });

      await POST(req);

      expect(getWeather).toHaveBeenCalledWith({
        lat: 22.6273,
        lon: 120.3014,
      });
    });

    it('should use default location when geocoding fails', async () => {
      vi.mocked(geocodeLocation).mockResolvedValue(null);

      const req = createRequest({
        date: '2025-12-29',
        location: 'Unknown City',
        occasion: '上班',
      });

      const res = await POST(req);

      expect(res.status).toBe(200);
      expect(getWeather).toHaveBeenCalledWith({
        lat: 25.033,
        lon: 121.5654,
      });
    });
  });

  describe('Wardrobe and Outfit Generation', () => {
    it('should generate outfits matching weather conditions', async () => {
      vi.mocked(getWeather).mockResolvedValue({
        temperature: 10, // Cold weather
        feelsLike: 8,
        humidity: 70,
        condition: 'cloudy',
        windSpeed: 15,
        locationName: '台北市',
      });

      const req = createRequest({
        date: '2025-12-29',
        location: '台北',
        occasion: '上班',
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      // Cold weather should prefer outerwear
      if (data.outfits.length > 0 && data.outfits[0].items.outerwear) {
        expect(data.outfits[0].reasons.weatherMatched).toBe(true);
      }
    });
  });

  describe('Suggested Purchases', () => {
    it('should include suggestedPurchases when wardrobe lacks items', async () => {
      // Mock empty wardrobe
      const { createRouteHandlerClient } = await import('@supabase/auth-helpers-nextjs');
      vi.mocked(createRouteHandlerClient).mockReturnValue({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({
              data: [],
              error: null,
            })),
          })),
        })),
      } as any);

      const req = createRequest({
        date: '2025-12-29',
        location: '台北',
        occasion: '上班',
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.outfits).toHaveLength(0);
      expect(data.suggestedPurchases).toBeDefined();
      expect(data.message).toBe('衣櫃庫存不足，請參考推薦補貨建議');
    });
  });

  describe('Security', () => {
    it('should not expose sensitive data in error responses', async () => {
      vi.mocked(requireBffAuth).mockResolvedValue({
        authorized: false,
        error: NextResponse.json(
          { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
          { status: 401 }
        ),
      });

      const req = createRequest({
        date: '2025-12-29',
        location: '台北',
        occasion: '上班',
      });
      const res = await POST(req);
      const data = await res.json();

      const responseStr = JSON.stringify(data);
      expect(responseStr).not.toContain('Supabase');
      expect(responseStr).not.toContain('API_KEY');
      expect(responseStr).not.toContain('session');
    });
  });
});

describe('GET /api/reco/daily', () => {
  it('should return 405 Method Not Allowed', async () => {
    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(405);
    expect(data.error).toBe('Method not allowed. Use POST.');
    expect(data.code).toBe('METHOD_NOT_ALLOWED');
  });
});
