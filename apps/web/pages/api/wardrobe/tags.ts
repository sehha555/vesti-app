import type { NextApiRequest, NextApiResponse } from 'next';
import {
  getUserTags,
  addTagToItem,
  removeTagFromItem,
} from '../../../lib/shared-wardrobe-store';
import type { WardrobeItem } from '../../../../../packages/types/src/wardrobe';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ tags: string[] } | WardrobeItem | { error: string }>
) {
  try {
    switch (req.method) {
      case 'GET': {
        const { userId } = req.query;
        if (!userId || typeof userId !== 'string') {
          return res.status(400).json({ error: '缺少或無效的 userId 參數' });
        }

        const tags = getUserTags(userId);
        return res.status(200).json({ tags });
      }

      case 'POST': {
        const { userId, itemId, tag, action } = req.body;

        if (!userId || !itemId || !tag || !action) {
          return res.status(400).json({ error: '請求主體中缺少必要欄位 (userId, itemId, tag, action)' });
        }

        let updatedItem: WardrobeItem | null;

        if (action === 'add') {
          updatedItem = addTagToItem(userId, itemId, tag);
        } else if (action === 'remove') {
          updatedItem = removeTagFromItem(userId, itemId, tag);
        } else {
          return res.status(400).json({ error: "無效的 action。必須是 'add' 或 'remove'" });
        }

        if (updatedItem) {
          return res.status(200).json(updatedItem);
        } else {
          return res.status(404).json({ error: '找不到指定的衣物或使用者無權限' });
        }
      }

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `方法 ${req.method} 不允許` });
    }
  } catch (error: any) {
    console.error('API Error in /api/wardrobe/tags:', error);
    return res.status(500).json({ error: error.message || '內部伺服器錯誤' });
  }
}
