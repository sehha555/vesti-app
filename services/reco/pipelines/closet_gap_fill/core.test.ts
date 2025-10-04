import { ClosetGapFillService } from './index';
import { Style } from '@/packages/types/src/wardrobe';

describe('ClosetGapFillService', () => {
  it('should recommend shoes when they are missing', async () => {
    const service = new ClosetGapFillService();
    const response = await service.generate('1', Style.CASUAL);
    expect(response.recommendations).toHaveLength(2);
    expect(response.recommendations[0].item.category).toBe('shoes');
  });

  it('should filter recommendations by max price', async () => {
    const service = new ClosetGapFillService();
    const response = await service.generate('1', Style.CASUAL, undefined, 100);
    expect(response.recommendations).toHaveLength(2);
    expect(response.recommendations[0].item.price).toBeLessThanOrEqual(100);
  });

  it('should filter recommendations by season', async () => {
    const service = new ClosetGapFillService();
    const response = await service.generate('1', Style.CASUAL, undefined, undefined, 'summer');
    expect(response.recommendations).toHaveLength(2);
    expect(response.recommendations[0].item.seasonality).toBe('all-season'); // all-season is also included
    expect(response.recommendations[1].item.seasonality).toBe('summer');
  });
});
