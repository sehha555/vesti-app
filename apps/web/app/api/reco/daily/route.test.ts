import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST, GET } from './route';
import { NextRequest, NextResponse } from 'next/server';
import { requireBffAuthMock, geocodeLocationMock, getWeatherMock } from '../../vitest.setup';

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
              name: 'White Cotton Shirt',
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
              name: 'Black Wool Pants',
              type: 'bottom',
              imageUrl: 'https://example.com/bottom1.jpg',
              colors: ['black'],
              season: 'all-season',
              style: 'formal',
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

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireBffAuth).mockResolvedValue({
    authorized: true,
    userId: 'test-user-id',
  });
  vi.mocked(geocodeLocation).mockResolvedValue({
    lat: 25.033,
    lon: 121.5654,
  });
  vi.mocked(getWeather).mockResolvedValue({
    temperature: 15,
    condition: 'cloudy',
    locationName: 'Taipei',
  });
});

describe('POST /api/reco/daily', () => {
  it('should return 200 with generated outfits', async () => {
    const req = createRequest({
      date: '2025-12-29',
      location: 'Taipei',
      occasion: 'work',
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
  });

  it('should call geocodeLocation with location name', async () => {
    const req = createRequest({
      date: '2025-12-29',
      location: 'kaohsiung',
      occasion: 'work',
    });
    await POST(req);
    expect(geocodeLocation).toHaveBeenCalledWith('kaohsiung');
  });
});

describe('GET /api/reco/daily', () => {
  it('should return 405 Method Not Allowed', async () => {
    const res = await GET();
    expect(res.status).toBe(405);
  });
});


