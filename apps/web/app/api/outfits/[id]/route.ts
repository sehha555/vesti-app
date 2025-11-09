// apps/web/app/api/outfits/[id]/route.ts
// Migrated from pages/api/outfits/[id].ts

import { NextRequest, NextResponse } from 'next/server';
import type { Outfit, UpdateOutfitDto, OutfitSeason } from '../../../../../../packages/types/src/outfit';
import {
  getOutfitById,
  updateOutfit,
  deleteOutfit,
} from '../../../../lib/shared-outfit-store';

const VALID_SEASONS: OutfitSeason[] = ['spring', 'summer', 'fall', 'winter'];

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const userId = req.nextUrl.searchParams.get('userId');

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: '缺少或無效的 outfit ID' }, { status: 400 });
  }
  if (!userId || typeof userId !== 'string') {
    return NextResponse.json({ error: '缺少 userId 參數' }, { status: 400 });
  }

  try {
    const outfit = getOutfitById(userId, id);
    if (outfit) {
      return NextResponse.json(outfit, { status: 200 });
    } else {
      return NextResponse.json({ error: '找不到指定的搭配' }, { status: 404 });
    }
  } catch (error: any) {
    console.error(`API Error in /api/outfits/${id} (GET):`, error);
    return NextResponse.json({ error: error.message || '內部伺服器錯誤' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const { userId, ...updates } = await req.json() as { userId: string } & UpdateOutfitDto;

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: '缺少或無效的 outfit ID' }, { status: 400 });
  }
  if (!userId) {
    return NextResponse.json({ error: '請求主體中缺少 userId' }, { status: 400 });
  }

  try {
    // --- Validation ---
    if (updates.itemIds && (!Array.isArray(updates.itemIds) || updates.itemIds.length === 0)) {
      return NextResponse.json({ error: 'itemIds 必須至少包含一件衣物' }, { status: 400 });
    }
    if (updates.season && !VALID_SEASONS.includes(updates.season as OutfitSeason)) {
      return NextResponse.json({ error: `無效的季節參數` }, { status: 400 });
    }
    if (updates.rating !== undefined && (typeof updates.rating !== 'number' || updates.rating < 1 || updates.rating > 5)) {
      return NextResponse.json({ error: 'rating 必須是 1-5 之間的數字' }, { status: 400 });
    }

    const updatedOutfit = updateOutfit(userId, id, updates);
    if (updatedOutfit) {
      return NextResponse.json(updatedOutfit, { status: 200 });
    } else {
      return NextResponse.json({ error: '找不到指定的搭配' }, { status: 404 });
    }
  } catch (error: any) {
    console.error(`API Error in /api/outfits/${id} (PUT):`, error);
    return NextResponse.json({ error: error.message || '內部伺服器錯誤' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const userId = req.nextUrl.searchParams.get('userId');

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: '缺少或無效的 outfit ID' }, { status: 400 });
  }
  if (!userId || typeof userId !== 'string') {
    return NextResponse.json({ error: '缺少 userId 參數' }, { status: 400 });
  }

  try {
    const success = deleteOutfit(userId, id);
    if (success) {
      return NextResponse.json({ message: '搭配已刪除', id }, { status: 200 });
    } else {
      return NextResponse.json({ error: '找不到指定的搭配' }, { status: 404 });
    }
  } catch (error: any) {
    console.error(`API Error in /api/outfits/${id} (DELETE):`, error);
    return NextResponse.json({ error: error.message || '內部伺服器錯誤' }, { status: 500 });
  }
}
