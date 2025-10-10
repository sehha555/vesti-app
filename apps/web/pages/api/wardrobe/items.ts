import type { NextApiRequest, NextApiResponse } from 'next';
import {
  inMemoryWardrobeItems,
  createWardrobeItem,
  getItemsBySeason,
  getItemsByTag,
} from '../../../lib/shared-wardrobe-store';
import type { WardrobeItem, CreateWardrobeItemDto } from '../../../../../packages/types/src/wardrobe';

const VALID_SEASONS = ['spring', 'summer', 'fall', 'winter'];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<WardrobeItem[] | WardrobeItem | { error: string }>
) {
  switch (req.method) {
    case 'GET':
      const { userId, season, tag, purchased } = req.query;

      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ error: '缺少或無效的 userId' });
      }

      try {
        let items: WardrobeItem[];

        // Start with a base set of items, filtered by season or all items
        if (season) {
          if (typeof season !== 'string' || !VALID_SEASONS.includes(season)) {
            return res.status(400).json({ 
              error: '無效的季節參數。必須是 spring(春), summer(夏), fall(秋), winter(冬) 其中之一' 
            });
          }
          // NOTE: The internal type uses 'autumn', so we map 'fall' to it for compatibility.
          const seasonForFilter = season === 'fall' ? 'autumn' : season;
          items = getItemsBySeason(userId, seasonForFilter as any);
        } else {
          // If no season, start with all items for the user
          items = Array.from(inMemoryWardrobeItems.values()).filter(item => item.userId === userId);
        }

        // If a tag is also provided, filter the already-filtered list
        if (tag && typeof tag === 'string') {
          items = items.filter(item => item.tags?.includes(tag));
        }

        // Add purchased status filter
        if (purchased !== undefined && (purchased === 'true' || purchased === 'false')) {
          const isPurchased = purchased === 'true';
          items = items.filter(item => item.purchased === isPurchased);
        }
        
        return res.status(200).json(items);

      } catch (error: any) {
        return res.status(500).json({ error: error.message || '內部伺服器錯誤' });
      }

    case 'POST':
      const { userId: postUserId, ...dto } = req.body;

      if (!postUserId || typeof postUserId !== 'string') {
        return res.status(400).json({ error: '請求主體中缺少或無效的 userId' });
      }

      if (!dto || Object.keys(dto).length === 0 || !('name' in dto)) {
        return res.status(400).json({ error: '請求主體中缺少或無效的衣櫥物品資料。\'name\' 是必需的。' });
      }

      try {
        const newItem = createWardrobeItem(postUserId, dto as CreateWardrobeItemDto);
        return res.status(201).json(newItem);
      } catch (error: any) {
        return res.status(500).json({ error: error.message || '內部伺服器錯誤' });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `方法 ${req.method} 不允許` });
  }
}
