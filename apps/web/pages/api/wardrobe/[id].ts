import type { NextApiRequest, NextApiResponse } from 'next';
import { wardrobeServicePromise } from '../../../../../services/wardrobe/items.service';

export default async function handler(req: NextApiRequest, res: NextApiResponse<{ message: string } | { error: string }>) {
  const wardrobeService = await wardrobeServicePromise;

  switch (req.method) {
    case 'DELETE':
      const { id } = req.query;

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid item ID' });
      }

      try {
        const deleted = await wardrobeService.deleteItem(id);
        if (deleted) {
          return res.status(204).json({ message: 'Item deleted successfully' });
        } else {
          return res.status(404).json({ error: 'Item not found' });
        }
      } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
      }

    default:
      res.setHeader('Allow', ['DELETE']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
