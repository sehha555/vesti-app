import { NextApiRequest, NextApiResponse } from 'next';
import { Cart, CartItem } from '@/packages/types/src/cart';
import { CheckoutRequest, CheckoutResponse } from '@/packages/types/src/payments';
import { processMockPayment } from './payments/mock';

// 佔位符：記憶體中的購物車資料
const carts: Record<string, Cart> = {};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = req.query.userId as string || req.body.userId as string;

  if (!userId) {
    return res.status(400).json({ message: 'Missing userId' });
  }

  let userCart = carts[userId] || { userId, items: [], total: 0 };

  switch (req.method) {
    case 'POST':
      if (req.url === '/cart/checkout') {
        // 結帳
        const checkoutRequest: CheckoutRequest = req.body;
        const checkoutResponse = await processMockPayment(checkoutRequest);
        if (checkoutResponse.status === 'completed') {
          // 清空購物車
          delete carts[userId];
        }
        return res.status(200).json(checkoutResponse);
      } else if (req.url === '/cart/items') {
        // 加入商品到購物車
        const newItem: CartItem = req.body;
        const existingItemIndex = userCart.items.findIndex(item => item.itemId === newItem.itemId);

        if (existingItemIndex > -1) {
          userCart.items[existingItemIndex].quantity += newItem.quantity;
        } else {
          userCart.items.push(newItem);
        }
        userCart.total = userCart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        carts[userId] = userCart;
        return res.status(200).json(userCart);
      }
      break;

    case 'GET':
      // 取得購物車內容
      return res.status(200).json(userCart);

    case 'DELETE':
      // 從購物車中移除商品
      const itemIdToDelete = req.query.id as string;
      if (!itemIdToDelete) {
        return res.status(400).json({ message: 'Missing itemId' });
      }
      userCart.items = userCart.items.filter(item => item.itemId !== itemIdToDelete);
      userCart.total = userCart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      carts[userId] = userCart;
      return res.status(200).json(userCart);

    default:
      res.setHeader('Allow', ['POST', 'GET', 'DELETE']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
