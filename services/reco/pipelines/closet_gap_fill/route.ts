import { NextApiRequest, NextApiResponse } from 'next';
import { GapFillRequest } from '@/packages/types/src/gap';
import { SaveGapFillRequest } from '@/packages/types/src/persistence';
import { ClosetGapFillService } from './index';
import { Style } from '@/packages/types/src/wardrobe';
import { saveClosetGapFill } from './persistence';
import { withApiGatewayMiddleware } from '../../../api-gateway';

const closetGapFillHandler = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  if (req.method === 'POST') {
    if (req.url === '/api/reco/closet-gap-fill/save') {
      const { userId, recommendations, timestamp } = req.body as SaveGapFillRequest;
      if (!userId || !recommendations || !timestamp) {
        res.status(400).json({ message: 'Missing required parameters for saving' });
        return;
      }
      const saveResponse = await saveClosetGapFill({ userId, recommendations, timestamp });
      res.status(200).json(saveResponse);
      return;
    } else {
      const { userId, occasion, minPrice, maxPrice, season } = req.body as GapFillRequest;

      if (!userId || !occasion) {
        res.status(400).json({ message: 'Missing userId or occasion' });
        return;
      }

      const service = new ClosetGapFillService();
      const response = await service.generate(userId, occasion as Style, minPrice, maxPrice, season);

      res.status(200).json(response);
      return;
    }
  } else {
    res.status(405).end();
    return;
  }
};

export default withApiGatewayMiddleware(closetGapFillHandler);
