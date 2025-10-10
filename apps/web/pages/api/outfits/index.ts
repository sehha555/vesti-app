import type { NextApiRequest, NextApiResponse } from 'next';
import type { Outfit, CreateOutfitDto, OutfitSeason } from '../../../../../packages/types/src/outfit';
import {
  getAllOutfits,
  createOutfit,
  getOutfitsByTag,
  getOutfitsBySeason,
  getOutfitsByOccasion,
} from '../../../lib/shared-outfit-store';

const VALID_SEASONS: OutfitSeason[] = ['spring', 'summer', 'fall', 'winter'];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Outfit[] | Outfit | { error: string }>
) {
  try {
    switch (req.method) {
      case 'GET': {
        const { userId, tag, season, occasion } = req.query;

        if (!userId || typeof userId !== 'string') {
          return res.status(400).json({ error: '缺少 userId 參數' });
        }

        let outfits: Outfit[];

        // Apply filters based on provided query parameters
        if (typeof season === 'string') {
          outfits = getOutfitsBySeason(userId, season as OutfitSeason);
        } else if (typeof tag === 'string') {
          outfits = getOutfitsByTag(userId, tag);
        } else if (typeof occasion === 'string') {
          outfits = getOutfitsByOccasion(userId, occasion);
        } else {
          outfits = getAllOutfits(userId);
        }

        return res.status(200).json(outfits);
      }

      case 'POST': {
        const { userId, name, itemIds, season, rating } = req.body as CreateOutfitDto;

        // --- Validation ---
        if (!userId || !name || !itemIds) {
          return res.status(400).json({ error: '缺少必要欄位 (userId, name, itemIds)' });
        }
        if (!Array.isArray(itemIds) || itemIds.length === 0) {
          return res.status(400).json({ error: 'itemIds 必須至少包含一件衣物' });
        }
        if (season && !VALID_SEASONS.includes(season as OutfitSeason)) {
          return res.status(400).json({ error: `無效的季節參數。必須是 ${VALID_SEASONS.join(', ')} 其中之一` });
        }
        if (rating !== undefined && (typeof rating !== 'number' || rating < 1 || rating > 5)) {
          return res.status(400).json({ error: 'rating 必須是 1-5 之間的數字' });
        }

        const newOutfit = createOutfit(userId, req.body as CreateOutfitDto);
        return res.status(201).json(newOutfit);
      }

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `方法 ${req.method} 不允許` });
    }
  } catch (error: any) {
    console.error('API Error in /api/outfits:', error);
    // Handle specific errors from createOutfit, e.g., empty itemIds
    if (error.message.includes('at least one item')) {
        return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: error.message || '內部伺服器錯誤' });
  }
}
