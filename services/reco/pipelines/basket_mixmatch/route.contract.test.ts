import { createMocks } from 'node-mocks-http';
import handler from './route';
import { SaveBasketMixmatchRequest } from '@/packages/types/src/persistence';

describe('/api/reco/basket-mixmatch', () => {
  it('should return a list of recommended outfits', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      url: '/api/reco/basket-mixmatch',
      body: {
        userId: '1',
        basket: ['1', '2'],
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const responseJson = JSON.parse(res._getData());
    expect(responseJson).toHaveProperty('recommendations');
    expect(Array.isArray(responseJson.recommendations)).toBe(true);
    expect(responseJson.recommendations[0].scores).toHaveProperty('rules');
    expect(responseJson.recommendations[0].scores).toHaveProperty('total');
    expect(responseJson.recommendations[0].scores).toHaveProperty('compatibility');
    expect(responseJson).toHaveProperty('totalRecommendations');
  });

  it('should return paginated results', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      url: '/api/reco/basket-mixmatch',
      body: {
        userId: '1',
        basket: ['1', '2'],
        page: 1,
        pageSize: 2,
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const responseJson = JSON.parse(res._getData());
    expect(responseJson.recommendations).toHaveLength(2);
    expect(responseJson).toHaveProperty('totalRecommendations');
  });

  it('should save basket mixmatch outfits', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      url: '/api/reco/basket-mixmatch/save',
      body: {
        userId: 'test-user',
        recommendations: [],
        timestamp: new Date(),
      } as SaveBasketMixmatchRequest,
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const result = JSON.parse(res._getData());
    expect(result.success).toBe(true);
    expect(result.savedId).toBeDefined();
  });

  it('should return a 400 error if userId is missing', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      url: '/api/reco/basket-mixmatch',
      body: {
        basket: ['1', '2'],
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
  });

  it('should return a 400 error if basket is missing', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      url: '/api/reco/basket-mixmatch',
      body: {
        userId: '1',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
  });

  it('should return a 405 error for non-POST requests', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      url: '/api/reco/basket-mixmatch',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
  });
});
