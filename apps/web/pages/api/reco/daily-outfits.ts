import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Mock 每日穿搭資料
    res.status(200).json({
      recommendations: [
        {
          outfit: {
            id: 'outfit-1',
            top: { id: 'top-1', name: '白色襯衫', category: 'top', imageUrl: 'https://via.placeholder.com/150' },
            bottom: { id: 'bottom-1', name: '黑色長褲', category: 'bottom', imageUrl: 'https://via.placeholder.com/150' },
            shoes: { id: 'shoes-1', name: '黑色皮鞋', category: 'shoes', imageUrl: 'https://via.placeholder.com/150' },
            outerwear: { id: 'jacket-1', name: '灰色西裝外套', category: 'outerwear', imageUrl: 'https://via.placeholder.com/150' }
          },
          scores: {
            total: 0.92,
            compatibility: 0.88,
            weather: 0.95,
            rules: {
              colorHarmony: 0.9,
              styleConsistency: 0.85,
              seasonality: 0.95
            }
          },
          reasons: ['適合今日天氣', '風格搭配協調', '顏色相襯']
        }
      ]
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}