import { NextApiRequest, NextApiResponse } from 'next';
import { BasketMixmatchRequest, BasketMixmatchResponse } from '@/packages/types/src/basket';
import { SaveBasketMixmatchRequest } from '@/packages/types/src/persistence';
import { BasketMixmatchService } from './index';
import { saveBasketMixmatch } from './persistence';
import { withApiGatewayMiddleware } from '../../../api-gateway';

const basketMixmatchHandler = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  if (req.method === 'POST') {
    if (req.url === '/api/reco/basket-mixmatch/save') {
      const { userId, recommendations, timestamp } = req.body as SaveBasketMixmatchRequest;
      if (!userId || !recommendations || !timestamp) {
        res.status(400).json({ message: 'Missing required parameters for saving' });
        return;
      }
      const saveResponse = await saveBasketMixmatch({ userId, recommendations, timestamp });
      res.status(200).json(saveResponse);
      return;
    } else {
      const { userId, basket, page, pageSize } = req.body as BasketMixmatchRequest;

      if (!userId || !basket) {
        res.status(400).json({ message: 'Missing userId or basket' });
        return;
      }

      const service = new BasketMixmatchService();
      const response = await service.generate(userId, basket, page, pageSize);

      res.status(200).json(response);
      return;
    }
  } else {
    res.status(405).end();
    return;
  }
};

export default withApiGatewayMiddleware(basketMixmatchHandler);
