import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Mock 建議購買的單品清單
    res.status(200).json({
      recommendations: [
        {
          item: { id: 'item-1', name: '時尚外套', category: 'outerwear', imageUrl: '/placeholder.jpg' },
          reason: '可搭配多種現有衣物',
          unlockCount: 5,
          examplePairings: [
            {
              top: { id: 'top-a', name: '白色T恤', category: 'top', imageUrl: '/placeholder.jpg' },
              bottom: { id: 'bottom-a', name: '牛仔褲', category: 'bottom', imageUrl: '/placeholder.jpg' },
              shoes: { id: 'shoes-a', name: '運動鞋', category: 'shoes', imageUrl: '/placeholder.jpg' },
            },
            {
              top: { id: 'top-b', name: '條紋襯衫', category: 'top', imageUrl: '/placeholder.jpg' },
              bottom: { id: 'bottom-b', name: '休閒褲', category: 'bottom', imageUrl: '/placeholder.jpg' },
              shoes: { id: 'shoes-b', name: '皮鞋', category: 'shoes', imageUrl: '/placeholder.jpg' },
            },
          ],
        },
        {
          item: { id: 'item-2', name: '經典手提包', category: 'accessory', imageUrl: '/placeholder.jpg' },
          reason: '提升整體造型質感',
          unlockCount: 3,
          examplePairings: [
            {
              top: { id: 'top-c', name: '黑色洋裝', category: 'top', imageUrl: '/placeholder.jpg' },
              bottom: { id: 'bottom-c', name: '無', category: 'bottom', imageUrl: '' },
              shoes: { id: 'shoes-c', name: '高跟鞋', category: 'shoes', imageUrl: '/placeholder.jpg' },
            },
          ],
        },
      ],
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}