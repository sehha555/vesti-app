// apps/web/app/api/outfits/route.ts
// Migrated from pages/api/outfits/index.ts

import { NextRequest, NextResponse } from 'next/server';
import type { Outfit, CreateOutfitDto, OutfitSeason } from '../../../../../packages/types/src/outfit';
import {
  getAllOutfits,
  createOutfit,
  getOutfitsByTag,
  getOutfitsBySeason,
  getOutfitsByOccasion,
} from '../../../lib/shared-outfit-store';

const VALID_SEASONS: OutfitSeason[] = ['spring', 'summer', 'fall', 'winter'];

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const tag = req.nextUrl.searchParams.get('tag');
    const season = req.nextUrl.searchParams.get('season');
    const occasion = req.nextUrl.searchParams.get('occasion');

    if (!userId) {
      return NextResponse.json({ error: '缺少 userId 參數' }, { status: 400 });
    }

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
    const { userId, name, itemIds, season, rating } = await req.json() as CreateOutfitDto;

    // --- Validation ---
    if (!userId || !name || !itemIds) {
      return NextResponse.json({ error: '缺少必要欄位 (userId, name, itemIds)' }, { status: 400 });
    }
    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json({ error: 'itemIds 必須至少包含一件衣物' }, { status: 400 });
    }
    if (season && !VALID_SEASONS.includes(season as OutfitSeason)) {
      return NextResponse.json({ error: `無效的季節參數。必須是 ${VALID_SEASONS.join(', ')} 其中之一` }, { status: 400 });
    }
    if (rating !== undefined && (typeof rating !== 'number' || rating < 1 || rating > 5)) {
      return NextResponse.json({ error: 'rating 必須是 1-5 之間的數字' }, { status: 400 });
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
