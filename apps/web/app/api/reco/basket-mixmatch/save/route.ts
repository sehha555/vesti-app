// apps/web/app/api/reco/basket-mixmatch/save/route.ts
// Migrated from pages/api/reco/basket-mixmatch/save.ts

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // Mock 保存邏輯
  const body = await req.json(); // In a real application, process the body
  console.log('Saving basket mixmatch:', body);
  return NextResponse.json({ success: true, message: 'Basket mixmatch saved successfully' }, { status: 200 });
}
