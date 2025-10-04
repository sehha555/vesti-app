import { createMocks } from 'node-mocks-http';
import handler from './route';
import { SaveGapFillRequest } from '@/packages/types/src/persistence';

describe('/api/reco/closet-gap-fill', () => {
  it('should return a list of recommended items', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      url: '/api/reco/closet-gap-fill',
      body: {
        userId: '1',
        occasion: 'casual',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const responseJson = JSON.parse(res._getData());
    expect(responseJson).toHaveProperty('recommendations');
    expect(Array.isArray(responseJson.recommendations)).toBe(true);
    expect(responseJson.recommendations).toHaveLength(2);
  });

  it('should filter recommendations by max price', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      url: '/api/reco/closet-gap-fill',
      body: {
        userId: '1',
        occasion: 'casual',
        maxPrice: 100,
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const responseJson = JSON.parse(res._getData());
    expect(responseJson.recommendations).toHaveLength(2);
    expect(responseJson.recommendations[0].item.price).toBeLessThanOrEqual(100);
  });

  it('should filter recommendations by season', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      url: '/api/reco/closet-gap-fill',
      body: {
        userId: '1',
        occasion: 'casual',
        season: 'summer',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const responseJson = JSON.parse(res._getData());
    expect(responseJson.recommendations).toHaveLength(2);
    expect(responseJson.recommendations[0].item.seasonality).toBe('all-season');
    expect(responseJson.recommendations[1].item.seasonality).toBe('summer');
  });

  it('should save closet gap fill recommendations', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      url: '/api/reco/closet-gap-fill/save',
      body: {
        userId: 'test-user',
        recommendations: [],
        timestamp: new Date(),
      } as SaveGapFillRequest,
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const result = JSON.parse(res._getData());
    expect(result.success).toBe(true);
    expect(result.savedId).toBeDefined();
  });
});
