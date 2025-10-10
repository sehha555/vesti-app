import type { NextApiRequest, NextApiResponse } from 'next';
import {
  inMemoryWardrobeItems,
  createWardrobeItem,
  getItemsBySeason,
} from '../../../lib/shared-wardrobe-store';
import type { WardrobeItem, CreateWardrobeItemDto } from '../../../../../packages/types/src/wardrobe';

const VALID_SEASONS = ['spring', 'summer', 'autumn', 'winter'];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<WardrobeItem[] | WardrobeItem | { error: string }>
) {
  switch (req.method) {
    case 'GET':
      const { userId, season } = req.query;

      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ error: '缺少或無效的 userId' });
      }

      try {
        let items: WardrobeItem[];

        if (season) {
          if (typeof season !== 'string' || !VALID_SEASONS.includes(season)) {
            return res.status(400).json({ 
              error: `無效的 season 參數。必須是 ${VALID_SEASONS.join(', ')} 其中之一` 
            });
          }
          // 使用新的季節過濾函數
          items = getItemsBySeason(userId, season as any);
        } else {
          // 維持原有邏輯：取得使用者所有衣物
          items = Array.from(inMemoryWardrobeItems.values()).filter(item => item.userId === userId);
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
