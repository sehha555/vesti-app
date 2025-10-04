import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Mock 每日穿搭資料
    res.status(200).json({
      recommendations: [
        {
          outfit: {
            id: 'mix-1',
            top: { id: 'top-2', name: '條紋襯衫', category: 'top', imageUrl: 'https://via.placeholder.com/150' },
            bottom: { id: 'bottom-2', name: '卡其褲', category: 'bottom', imageUrl: 'https://via.placeholder.com/150' },
            shoes: { id: 'shoes-2', name: '棕色休閒鞋', category: 'shoes', imageUrl: 'https://via.placeholder.com/150' }
          },
          scores: {
            total: 0.85,
            compatibility: 0.82,
            rules: {
              colorHarmony: 0.8,
              styleConsistency: 0.88
            }
          },
          reasons: ['商品搭配建議', '適合正式場合']
        }
      ],
      totalRecommendations: 2
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}