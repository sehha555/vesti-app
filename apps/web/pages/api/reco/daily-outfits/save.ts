import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Mock 保存邏輯
    console.log('Saving daily outfits:', req.body);
    res.status(200).json({ success: true, message: 'Daily outfits saved successfully' });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}