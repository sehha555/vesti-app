// apps/web/app/api/reco/daily-outfits/save/route.ts
// Migrated from pages/api/reco/daily-outfits/save.ts

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // Mock 保存邏輯
  const body = await req.json(); // In a real application, process the body
  console.log('Saving daily outfits:', body);
  return NextResponse.json({ success: true, message: 'Daily outfits saved successfully' }, { status: 200 });
}
