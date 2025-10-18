
import { NextApiRequest, NextApiResponse } from 'next';
import { DailyOutfitRequest } from '@/packages/types/src/daily';
import { SaveDailyOutfitRequest } from '@/packages/types/src/persistence';
import { DailyOutfitsService } from './daily_outfits.service';
import { saveDailyOutfits } from './persistence';
import { withApiGatewayMiddleware } from '../../../api-gateway';
import { wardrobeServicePromise } from '../../../wardrobe/items.service';
import { getWeather } from '../../../weather';
import { Location } from '../../../weather/weather.types';
import { Occasion } from '@/packages/types/src/wardrobe';

const dailyOutfitsHandler = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  if (req.method === 'POST') {
    if (req.url === '/api/reco/daily-outfits/save') {
      const { userId, recommendations, timestamp } = req.body as SaveDailyOutfitRequest;
      if (!userId || !recommendations || !timestamp) {
        res.status(400).json({ message: 'Missing required parameters for saving' });
        return;
      }
      const saveResponse = await saveDailyOutfits({ userId, recommendations, timestamp });
      res.status(200).json(saveResponse);
      return;
    } else {
      const { userId, latitude, longitude, occasion } = req.body as DailyOutfitRequest;

      if (!userId || !latitude || !longitude || !occasion) {
        res.status(400).json({ message: 'Missing required parameters' });
        return;
      }

      const wardrobeService = await wardrobeServicePromise;

      // Adapter to map the Location type from the service ({lat, lon}) 
      // to the one expected by the mock getWeather function ({latitude, longitude}).
      const weatherAdapter = (location: Location) => 
        getWeather({ latitude: location.lat, longitude: location.lon });

      const service = new DailyOutfitsService(wardrobeService, weatherAdapter);
      
      const response = await service.generateDailyOutfits(
        userId,
        { lat: latitude, lon: longitude },
        occasion as Occasion
      );

      res.status(200).json(response);
      return;
    }
  } else {
    res.status(405).end();
    return;
  }
};

export default withApiGatewayMiddleware(dailyOutfitsHandler);
