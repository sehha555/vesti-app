import { NextRequest, NextResponse } from 'next/server';
import { wardrobeServicePromise } from '@/services/wardrobe/items.service';
import { getWeather } from '@/services/weather';
import { DailyOutfitsService } from '@/services/reco/pipelines/daily_outfits/daily_outfits.service';
import { Occasion } from '@/packages/types/src/wardrobe';
import { Location } from '@/services/weather/weather.types';

/**
 * @swagger
 * /api/daily-outfits:
 *   get:
 *     summary: Get daily outfit recommendations
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: occasion
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of outfit combinations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/OutfitCombination'
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const latitude = searchParams.get('latitude');
    const longitude = searchParams.get('longitude');
    const occasion = searchParams.get('occasion');

    if (!userId || !latitude || !longitude || !occasion) {
      return NextResponse.json(
        { message: 'Missing required parameters: userId, latitude, longitude, occasion' },
        { status: 400 }
      );
    }

    const latNum = parseFloat(latitude);
    const lonNum = parseFloat(longitude);

    if (isNaN(latNum) || isNaN(lonNum)) {
      return NextResponse.json({ message: 'Invalid latitude or longitude' }, { status: 400 });
    }

    const wardrobeService = await wardrobeServicePromise;

    // Adapter to map the Location type from the service ({lat, lon}) 
    // to the one expected by the mock getWeather function ({latitude, longitude}).
    const weatherAdapter = (location: Location) => 
      getWeather({ latitude: location.lat, longitude: location.lon });

    const service = new DailyOutfitsService(wardrobeService, weatherAdapter);

    const outfits = await service.generateDailyOutfits(
      userId,
      { lat: latNum, lon: lonNum },
      occasion as Occasion
    );

    return NextResponse.json(outfits);
  } catch (error) {
    console.error('Error generating daily outfits:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Internal Server Error', error: errorMessage }, { status: 500 });
  }
}
