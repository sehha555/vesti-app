import { SaveDailyOutfitRequest, SaveRecommendationResponse } from '@/packages/types/src/persistence';
import { InMemoryAdapter } from '../../persistence/inMemoryAdapter';

interface StoredDailyOutfit extends SaveDailyOutfitRequest {
  id?: string;
}

const dailyOutfitAdapter = new InMemoryAdapter<StoredDailyOutfit>();

export const saveDailyOutfits = async (request: SaveDailyOutfitRequest): Promise<SaveRecommendationResponse> => {
  const id = await dailyOutfitAdapter.save({ ...request, id: `daily-outfit-${request.userId}-${Date.now()}` });
  console.log('Saving daily outfits for user:', request.userId, request.recommendations.length, 'recommendations');
  return { success: true, savedId: id };
};
