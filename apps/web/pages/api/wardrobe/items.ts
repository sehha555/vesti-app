import type { NextApiRequest, NextApiResponse } from 'next';
import { WardrobeItem, CreateWardrobeItemDto, inMemoryWardrobeItems, createWardrobeItem } from '../../../lib/shared-wardrobe-store';

export default async function handler(req: NextApiRequest, res: NextApiResponse<WardrobeItem[] | WardrobeItem | { error: string }>) {
  switch (req.method) {
    case 'GET':
      const { userId } = req.query;

      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ error: '缺少或無效的 userId' });
      }

      try {
        const items = Array.from(inMemoryWardrobeItems.values()).filter(item => item.userId === userId);
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
