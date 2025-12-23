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

    // Adapter: getWeather 已期望 Location 型別 { lat, lon }，直接傳遞
    const weatherAdapter = (location: Location) =>
      getWeather(location);

    // MOCK DATA FOR VERIFICATION
    const svg = (color: string, text: string) =>
      `data:image/svg+xml,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
           <rect x="10" y="20" width="80" height="60" rx="8" fill="${color}" />
           <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="14" font-weight="bold">${text}</text>
         </svg>`
      )}`;

    const mockOutfits = [
      {
        id: 999,
        imageUrl: svg('gray', 'FULL'),
        styleName: 'Mannequin Verification',
        description: 'Mock outfit to verify mannequin layout',
        layoutSlots: [
          { slotKey: 'top_inner', item: { name: 'Inner Top', imageUrl: svg('blue', 'TOP') }, priority: 1 },
          { slotKey: 'top_outer', item: { name: 'Outer Jacket', imageUrl: svg('red', 'OUTER') }, priority: 2 },
          { slotKey: 'bottom', item: { name: 'Jeans', imageUrl: svg('green', 'BOTTOM') }, priority: 3 },
          { slotKey: 'shoes', item: { name: 'Sneakers', imageUrl: svg('purple', 'SHOES') }, priority: 4 },
          { slotKey: 'accessory', item: { name: 'Hat', imageUrl: svg('#facc15', 'ACC 1') }, priority: 5 }, // Yellow
          { slotKey: 'accessory', item: { name: 'Scarf', imageUrl: svg('#facc15', 'ACC 2') }, priority: 6 },
          { slotKey: 'accessory', item: { name: 'Bag', imageUrl: svg('#facc15', 'ACC 3') }, priority: 7 },
        ]
      }
    ];

    /*
    const service = new DailyOutfitsService(wardrobeService, weatherAdapter);

    const outfits = await service.generateDailyOutfits(
      userId,
      { lat: latNum, lon: lonNum },
      occasion as Occasion
    );
     */
    const outfits = mockOutfits;

    // 獲取天氣資料
    const weather = await weatherAdapter({ lat: latNum, lon: lonNum });

    // 返回包含 outfits 和 weather 的物件
    return NextResponse.json({ outfits, weather });
  } catch (error) {
    console.error('Error generating daily outfits:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Internal Server Error', error: errorMessage }, { status: 500 });
  }
}
