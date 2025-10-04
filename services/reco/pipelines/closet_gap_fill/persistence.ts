import { SaveGapFillRequest, SaveRecommendationResponse } from '@/packages/types/src/persistence';
import { InMemoryAdapter } from '../../persistence/inMemoryAdapter';

interface StoredGapFill extends SaveGapFillRequest {
  id?: string;
}

const gapFillAdapter = new InMemoryAdapter<StoredGapFill>();

export const saveClosetGapFill = async (request: SaveGapFillRequest): Promise<SaveRecommendationResponse> => {
  const id = await gapFillAdapter.save({ ...request, id: `closet-gap-fill-${request.userId}-${Date.now()}` });
  console.log('Saving closet gap fill for user:', request.userId, request.recommendations.length, 'recommendations');
  return { success: true, savedId: id };
};
