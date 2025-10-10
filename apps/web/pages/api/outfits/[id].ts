import type { NextApiRequest, NextApiResponse } from 'next';
import type { Outfit, UpdateOutfitDto, OutfitSeason } from '../../../../../packages/types/src/outfit';
import {
  getOutfitById,
  updateOutfit,
  deleteOutfit,
} from '../../../lib/shared-outfit-store';

const VALID_SEASONS: OutfitSeason[] = ['spring', 'summer', 'fall', 'winter'];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Outfit | { error?: string; message?: string; id?: string }>
) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: '缺少或無效的 outfit ID' });
  }

  try {
    switch (req.method) {
      case 'GET': {
        const { userId } = req.query;
        if (!userId || typeof userId !== 'string') {
          return res.status(400).json({ error: '缺少 userId 參數' });
        }

        const outfit = getOutfitById(userId, id);
        if (outfit) {
          return res.status(200).json(outfit);
        } else {
          return res.status(404).json({ error: '找不到指定的搭配' });
        }
      }

      case 'PUT': {
        const { userId, ...updates } = req.body as { userId: string } & UpdateOutfitDto;
        
        // --- Validation ---
        if (!userId) {
          return res.status(400).json({ error: '請求主體中缺少 userId' });
        }
        if (updates.itemIds && (!Array.isArray(updates.itemIds) || updates.itemIds.length === 0)) {
          return res.status(400).json({ error: 'itemIds 必須至少包含一件衣物' });
        }
        if (updates.season && !VALID_SEASONS.includes(updates.season as OutfitSeason)) {
          return res.status(400).json({ error: `無效的季節參數` });
        }
        if (updates.rating !== undefined && (typeof updates.rating !== 'number' || updates.rating < 1 || updates.rating > 5)) {
          return res.status(400).json({ error: 'rating 必須是 1-5 之間的數字' });
        }

        const updatedOutfit = updateOutfit(userId, id, updates);
        if (updatedOutfit) {
          return res.status(200).json(updatedOutfit);
        } else {
          return res.status(404).json({ error: '找不到指定的搭配' });
        }
      }

      case 'DELETE': {
        const { userId } = req.query;
        if (!userId || typeof userId !== 'string') {
          return res.status(400).json({ error: '缺少 userId 參數' });
        }

        const success = deleteOutfit(userId, id);
        if (success) {
          return res.status(200).json({ message: '搭配已刪除', id });
        } else {
          return res.status(404).json({ error: '找不到指定的搭配' });
        }
      }

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `方法 ${req.method} 不允許` });
    }
  } catch (error: any) {
    console.error(`API Error in /api/outfits/${id}:`, error);
    return res.status(500).json({ error: error.message || '內部伺服器錯誤' });
  }
}
