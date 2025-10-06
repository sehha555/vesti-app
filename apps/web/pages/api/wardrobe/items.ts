import type { NextApiRequest, NextApiResponse } from 'next';
import { wardrobeServicePromise } from '../../../../../services/wardrobe/items.service';
import { WardrobeItem, CreateWardrobeItemDto } from '../../../../../packages/types/src/wardrobe';

export default async function handler(req: NextApiRequest, res: NextApiResponse<WardrobeItem[] | WardrobeItem | { error: string }>) {
  const wardrobeService = await wardrobeServicePromise;

  switch (req.method) {
    case 'GET':
      const { userId } = req.query;

      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid userId' });
      }

      try {
        const items = wardrobeService.getItems(userId);
        return res.status(200).json(items);
      } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
      }

    case 'POST':
      const { userId: postUserId, ...dto } = req.body;

      if (!postUserId || typeof postUserId !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid userId in request body' });
      }

      // Basic validation for dto, assuming CreateWardrobeItemDto has some required fields
      // For a real application, more robust validation would be needed
      if (!dto || Object.keys(dto).length === 0) {
        return res.status(400).json({ error: 'Missing wardrobe item data in request body' });
      }

      try {
        const newItem = await wardrobeService.createItem(postUserId, dto as Omit<CreateWardrobeItemDto, 'userId'>);
        return res.status(201).json(newItem);
      } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
