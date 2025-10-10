import type { NextApiRequest, NextApiResponse } from 'next';
import { inMemoryWardrobeItems } from '../../../lib/shared-wardrobe-store';

export default async function handler(req: NextApiRequest, res: NextApiResponse<{ message: string } | { error: string }>) {
  switch (req.method) {
    case 'DELETE':
      const { id } = req.query;

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: '缺少或無效的項目 ID' });
      }

      try {
        const deleted = inMemoryWardrobeItems.delete(id);
        if (deleted) {
          return res.status(204).json({ message: '項目已成功刪除' });
        } else {
          return res.status(404).json({ error: '找不到項目' });
        }
      } catch (error: any) {
        return res.status(500).json({ error: error.message || '內部伺服器錯誤' });
      }

    default:
      res.setHeader('Allow', ['DELETE']);
      return res.status(405).json({ error: `方法 ${req.method} 不允許` });
  }
}
