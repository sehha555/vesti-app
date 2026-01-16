// apps/web/app/api/outfits/route.ts
// Migrated from pages/api/outfits/index.ts

import { NextRequest, NextResponse } from 'next/server';
import type { Outfit, CreateOutfitDto, OutfitSeason, OutfitsCreateRequest } from '../../../../../packages/types/src/outfit';
import { OutfitsCreateRequestSchema } from '../../../../../packages/types/src/outfit';
import {
  getAllOutfits,
  createOutfit,
  getOutfitsByTag,
  getOutfitsBySeason,
  getOutfitsByOccasion,
} from '../../../lib/shared-outfit-store';
import { sanitizeUserAgent, logDeprecationMetric } from '../../../lib/metrics';
import { getSupabaseAndUser } from '../../../lib/supabase/server';

const VALID_SEASONS: OutfitSeason[] = ['spring', 'summer', 'fall', 'winter'];

export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const { user } = await getSupabaseAndUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        {
          status: 401,
          headers: { 'Cache-Control': 'private, no-store' },
        }
      );
    }

    // Only allow fetching own outfits
    const userId = user.id;
    const tag = req.nextUrl.searchParams.get('tag');
    const season = req.nextUrl.searchParams.get('season');
    const occasion = req.nextUrl.searchParams.get('occasion');

    let outfits: Outfit[];

    // Apply filters based on provided query parameters
    if (typeof season === 'string') {
      outfits = getOutfitsBySeason(userId, season as OutfitSeason);
    } else if (typeof tag === 'string') {
      outfits = getOutfitsByTag(userId, tag);
    } else if (typeof occasion === 'string') {
      outfits = getOutfitsByOccasion(userId, occasion);
    } else {
      outfits = getAllOutfits(userId);
    }

    return NextResponse.json(outfits, { status: 200 });
  } catch (error: any) {
    console.error('API Error in /api/outfits (GET):', error);
    return NextResponse.json({ error: error.message || '內部伺服器錯誤' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const { user } = await getSupabaseAndUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        {
          status: 401,
          headers: { 'Cache-Control': 'private, no-store' },
        }
      );
    }

    const body = await req.json();

    // Validate against schema
    const parseResult = OutfitsCreateRequestSchema.safeParse(body);
    if (!parseResult.success) {
      const response: { error: string; details?: any } = {
        error: 'Invalid request payload',
      };
      if (process.env.NODE_ENV !== 'production') {
        response.details = parseResult.error.errors;
      }
      return NextResponse.json(response, {
        status: 400,
        headers: { 'Cache-Control': 'private, no-store' },
      });
    }

    let { userId, name, itemIds, season, rating } = parseResult.data;

    // Check if this is a legacy payload (userId is undefined after validation)
    const isMissingUserId = userId === undefined;
    const enableLegacyOutfits = process.env.ENABLE_LEGACY_OUTFITS_PAYLOAD !== "false";

    // If legacy payload and env flag is "false", return 400 with Cache-Control header
    if (isMissingUserId && !enableLegacyOutfits) {
      return NextResponse.json(
        { error: '缺少必要欄位 (userId, name, itemIds)' },
        {
          status: 400,
          headers: { 'Cache-Control': 'private, no-store' },
        }
      );
    }

    // Log deprecation if legacy payload is allowed
    if (isMissingUserId && enableLegacyOutfits) {
      const userAgent = req.headers.get('user-agent') || '';
      console.warn('Deprecated: legacy outfits endpoint used without userId');
      logDeprecationMetric({
        endpoint: 'POST /api/outfits',
        format: 'legacy',
        itemCount: itemIds.length,
        userAgent: sanitizeUserAgent(userAgent),
      });

      // Use authenticated session userId for legacy payload
      userId = user.id;
    }

    // Validate userId exists (either from payload or from authenticated session)
    if (!userId) {
      return NextResponse.json(
        { error: '缺少必要欄位 userId' },
        {
          status: 401,
          headers: { 'Cache-Control': 'private, no-store' },
        }
      );
    }

    // Verify ownership: userId from payload must match authenticated user
    if (userId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: userId does not match authenticated user' },
        {
          status: 403,
          headers: { 'Cache-Control': 'private, no-store' },
        }
      );
    }

    const newOutfit = createOutfit(userId, { userId, name, itemIds, season, rating } as CreateOutfitDto);
    return NextResponse.json(newOutfit, { status: 201 });
  } catch (error: any) {
    console.error('API Error in /api/outfits (POST):', error);
    // Handle specific errors from createOutfit, e.g., empty itemIds
    if (error.message.includes('at least one item')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || '內部伺服器錯誤' }, { status: 500 });
  }
}
