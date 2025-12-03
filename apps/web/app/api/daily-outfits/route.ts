import { NextRequest, NextResponse } from 'next/server';
import { getDailyOutfitsService } from '@/services/reco/daily-outfits/daily-outfits.service';

/**
 * API Error 格式
 */
interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

/**
 * GET /api/daily-outfits
 *
 * 取得每日穿搭推薦
 *
 * Query Parameters:
 * - userId (required): 使用者 ID
 * - latitude (optional): 緯度
 * - longitude (optional): 經度
 * - occasion (optional): 場合 (casual, work, date, formal, outdoor)
 * - mode (optional): 推薦模式 (rule-only, hybrid)
 *
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
 *         required: false
 *         schema:
 *           type: number
 *       - in: query
 *         name: longitude
 *         required: false
 *         schema:
 *           type: number
 *       - in: query
 *         name: occasion
 *         required: false
 *         schema:
 *           type: string
 *           enum: [casual, work, date, formal, outdoor]
 *       - in: query
 *         name: mode
 *         required: false
 *         schema:
 *           type: string
 *           enum: [rule-only, hybrid]
 *     responses:
 *       200:
 *         description: A list of daily outfit recommendations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 outfits:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       heroImageUrl:
 *                         type: string
 *                       items:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             name:
 *                               type: string
 *                             imageUrl:
 *                               type: string
 *       400:
 *         description: Bad request (missing userId)
 *       500:
 *         description: Internal server error
 */
export async function GET(request: NextRequest) {
  try {
    // 解析 query parameters
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const latitudeStr = searchParams.get('latitude');
    const longitudeStr = searchParams.get('longitude');
    const occasion = searchParams.get('occasion') || 'casual';
    const mode = (searchParams.get('mode') || 'rule-only') as 'rule-only' | 'hybrid';

    // 驗證必要參數
    if (!userId) {
      const error: ApiError = {
        message: 'Missing required parameter: userId',
        code: 'MISSING_USER_ID',
      };
      return NextResponse.json(error, { status: 400 });
    }

    // 解析經緯度
    let latitude: number | undefined;
    let longitude: number | undefined;

    if (latitudeStr && longitudeStr) {
      latitude = parseFloat(latitudeStr);
      longitude = parseFloat(longitudeStr);

      if (isNaN(latitude) || isNaN(longitude)) {
        const error: ApiError = {
          message: 'Invalid latitude or longitude format',
          code: 'INVALID_LOCATION',
        };
        return NextResponse.json(error, { status: 400 });
      }
    }

    // 建立 Service 實例
    const service = await getDailyOutfitsService();

    // 呼叫服務取得推薦（現在回傳 { weather, outfits }）
    const result = await service.getDailyOutfits({
      userId,
      latitude,
      longitude,
      occasion,
      mode,
    });

    // 回傳結果（包含天氣資訊）
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    // 錯誤處理
    console.error('[API /daily-outfits] Error:', error);

    const apiError: ApiError = {
      message: 'Internal server error while generating daily outfits',
      code: 'INTERNAL_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error',
    };

    return NextResponse.json(apiError, { status: 500 });
  }
}
