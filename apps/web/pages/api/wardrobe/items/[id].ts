import type { NextApiRequest, NextApiResponse } from 'next';
import { updateItem, inMemoryWardrobeItems } from '../../../../lib/shared-wardrobe-store';
import type { WardrobeItem, UpdateWardrobeItemDto } from '../../../../../../packages/types/src/wardrobe';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<WardrobeItem | { error: string } | { message: string }>
) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: '缺少或無效的項目 ID' });
  }

  try {
    switch (req.method) {
      case 'GET': {
        const item = inMemoryWardrobeItems.get(id);
        if (item) {
          return res.status(200).json(item);
        } else {
          return res.status(404).json({ error: '找不到項目' });
        }
      }

      case 'PUT': {
        const { userId, ...updatedData } = req.body as { userId: string } & UpdateWardrobeItemDto;

        if (!userId || !updatedData) {
          return res.status(400).json({ error: '缺少 userId 或更新資料' });
        }

        const updatedItem = updateItem(userId, id, updatedData);

        if (updatedItem) {
          return res.status(200).json(updatedItem);
        } else {
          return res.status(404).json({ error: '找不到項目或使用者無權限' });
        }
      }

      case 'DELETE': {
        const deleted = inMemoryWardrobeItems.delete(id);
        if (deleted) {
          // 依據 RESTful 慣例，成功刪除後應回傳 204 No Content，且不帶有 body
          return res.status(204).end();
        } else {
          return res.status(404).json({ error: '找不到項目' });
        }
      }

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `方法 ${req.method} 不允許` });
    }
  } catch (error: any) {
    console.error(error); // 在伺服器端記錄錯誤
    return res.status(500).json({ error: error.message || '內部伺服器錯誤' });
  }
}
