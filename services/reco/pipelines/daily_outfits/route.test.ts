import handler from './route';
import { DailyOutfitRequest } from '@/packages/types/src/daily';
import { SaveDailyOutfitRequest } from '@/packages/types/src/persistence';
import { createMocks } from 'node-mocks-http';
import { beforeEach, vi } from 'vitest';
import { DailyOutfitsService } from './daily_outfits.service';
import { WardrobeItem, ClothingType } from '@/packages/types/src/wardrobe'; // Import WardrobeItem and ClothingType

vi.mock('./daily_outfits.service');

beforeEach(() => {
  process.env.WEATHER_API_KEY = 'test-key';
  vi.clearAllMocks();
});

// Contract test for the route
it('should return 5 outfits for a valid request', async () => {
  const createMockWardrobeItem = (id: string, type: ClothingType): WardrobeItem => ({
    id,
    userId: 'test-user',
    name: `${type}-${id}`,
    type,
    imageUrl: `http://example.com/${type}-${id}.jpg`,
    colors: [],
    season: 'all-season',
    purchased: true,
    source: 'upload',
    createdAt: new Date(),
  });

  const mockRecommendations = [
    { outfit: { top: createMockWardrobeItem('t1', 'top'), bottom: createMockWardrobeItem('b1', 'bottom'), shoes: createMockWardrobeItem('s1', 'shoes') }, reasons: ['test'], scores: { weatherFit: 1, occasionMatch: 1, compatibility: 1, total: 3 } },
    { outfit: { top: createMockWardrobeItem('t2', 'top'), bottom: createMockWardrobeItem('b2', 'bottom'), shoes: createMockWardrobeItem('s2', 'shoes') }, reasons: ['test'], scores: { weatherFit: 1, occasionMatch: 1, compatibility: 1, total: 3 } },
    { outfit: { top: createMockWardrobeItem('t3', 'top'), bottom: createMockWardrobeItem('b3', 'bottom'), shoes: createMockWardrobeItem('s3', 'shoes') }, reasons: ['test'], scores: { weatherFit: 1, occasionMatch: 1, compatibility: 1, total: 3 } },
    { outfit: { top: createMockWardrobeItem('t4', 'top'), bottom: createMockWardrobeItem('b4', 'bottom'), shoes: createMockWardrobeItem('s4', 'shoes') }, reasons: ['test'], scores: { weatherFit: 1, occasionMatch: 1, compatibility: 1, total: 3 } },
    { outfit: { top: createMockWardrobeItem('t5', 'top'), bottom: createMockWardrobeItem('b5', 'bottom'), shoes: createMockWardrobeItem('s5', 'shoes') }, reasons: ['test'], scores: { weatherFit: 1, occasionMatch: 1, compatibility: 1, total: 3 } },
  ];

  vi.mocked(DailyOutfitsService.prototype.generate).mockResolvedValue({
    recommendations: mockRecommendations,
  });

  const { req, res } = createMocks({
    method: 'POST',
    url: '/api/reco/daily-outfits',
    body: {
      userId: 'test-user',
      latitude: 40.7128,
      longitude: -74.0060,
      occasion: 'casual',
    } as DailyOutfitRequest,
  });

  await handler(req, res);

  expect(res._getStatusCode()).toBe(200);
  const result = JSON.parse(res._getData());
  expect(result.recommendations).toHaveLength(5);
  expect(result.recommendations[0].outfit).toBeDefined();
  expect(result.recommendations[0].scores).toBeDefined();
  expect(DailyOutfitsService.prototype.generate).toHaveBeenCalledTimes(1);
});

it('should save daily outfits', async () => {
  const { req, res } = createMocks({
    method: 'POST',
    url: '/api/reco/daily-outfits/save',
    body: {
      userId: 'test-user',
      recommendations: [],
      timestamp: new Date(),
    } as SaveDailyOutfitRequest,
  });

  await handler(req, res);

  expect(res._getStatusCode()).toBe(200);
  const result = JSON.parse(res._getData());
  expect(result.success).toBe(true);
  expect(result.savedId).toBeDefined();
});