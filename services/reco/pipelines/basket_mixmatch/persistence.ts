import { SaveBasketMixmatchRequest, SaveRecommendationResponse } from '@/packages/types/src/persistence';
import { InMemoryAdapter } from '../../persistence/inMemoryAdapter';

interface StoredBasketMixmatch extends SaveBasketMixmatchRequest {
  id?: string;
}

const basketMixmatchAdapter = new InMemoryAdapter<StoredBasketMixmatch>();

export const saveBasketMixmatch = async (request: SaveBasketMixmatchRequest): Promise<SaveRecommendationResponse> => {
  const id = await basketMixmatchAdapter.save({ ...request, id: `basket-mixmatch-${request.userId}-${Date.now()}` });
  console.log('Saving basket mixmatch for user:', request.userId, request.recommendations.length, 'recommendations');
  return { success: true, savedId: id };
};
