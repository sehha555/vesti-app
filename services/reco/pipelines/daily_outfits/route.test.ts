import handler from './route';
import { DailyOutfitRequest } from '@/packages/types/src/daily';
import { SaveDailyOutfitRequest } from '@/packages/types/src/persistence';
import { createMocks } from 'node-mocks-http';
import { beforeEach, vi } from 'vitest';
import { DailyOutfitsService } from './daily_outfits.service';

vi.mock('./daily_outfits.service');

beforeEach(() => {
  process.env.WEATHER_API_KEY = 'test-key';
  vi.clearAllMocks();
});

// Contract test for the route
it('should return 5 outfits for a valid request', async () => {
  const mockRecommendations = [
    { outfit: { top: 't1', bottom: 'b1', shoes: 's1' }, reasons: ['test'], scores: { weatherFit: 1, occasionMatch: 1, compatibility: 1, total: 3 } },
    { outfit: { top: 't2', bottom: 'b2', shoes: 's2' }, reasons: ['test'], scores: { weatherFit: 1, occasionMatch: 1, compatibility: 1, total: 3 } },
    { outfit: { top: 't3', bottom: 'b3', shoes: 's3' }, reasons: ['test'], scores: { weatherFit: 1, occasionMatch: 1, compatibility: 1, total: 3 } },
    { outfit: { top: 't4', bottom: 'b4', shoes: 's4' }, reasons: ['test'], scores: { weatherFit: 1, occasionMatch: 1, compatibility: 1, total: 3 } },
    { outfit: { top: 't5', bottom: 'b5', shoes: 's5' }, reasons: ['test'], scores: { weatherFit: 1, occasionMatch: 1, compatibility: 1, total: 3 } },
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