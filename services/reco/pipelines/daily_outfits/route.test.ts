
import handler from './route';
import { DailyOutfitRequest } from '@/packages/types/src/daily';
import { SaveDailyOutfitRequest } from '@/packages/types/src/persistence';
import { createMocks } from 'node-mocks-http';

// Contract test for the route
it('should return 5 outfits for a valid request', async () => {
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
  expect(result.recommendations[1].scores).toBeDefined();
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
