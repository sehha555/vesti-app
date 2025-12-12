// apps/web/app/api/outfits/score/route.ts
// 穿搭相性評分 API

import { NextRequest, NextResponse } from 'next/server';

// Mock 評語集合
const ANALYSIS_SAMPLES = [
  '這套搭配色系和諧，適合週末休閒活動。建議搭配白色休閒鞋。',
  '簡潔大方的搭配風格，適合日常穿著。可以加入配飾提升整體層次感。',
  '配色大膽有個性，展現穿衣品味。適合參加聚會或特殊場合。',
  '經典搭配組合，耐看百搭。很適合上班族的日常穿著。',
  '色彩搭配溫暖舒適，給人親切感。非常適合約會或聚餐。',
];

// Mock 標籤集合
const TAG_SAMPLES = [
  ['Casual', 'Comfortable', 'Weekend'],
  ['Smart Casual', 'Professional', 'Office'],
  ['Date', 'Elegant', 'Romantic'],
  ['Sporty', 'Active', 'Gym'],
  ['Minimalist', 'Classic', 'Timeless'],
  ['Trendy', 'Fashion-Forward', 'Stylish'],
];

export async function POST(req: NextRequest) {
  try {
    const { itemIds } = await req.json();

    // --- Validation ---
    if (!itemIds) {
      return NextResponse.json(
        { error: '缺少必要欄位 (itemIds)' },
        { status: 400 }
      );
    }

    if (!Array.isArray(itemIds)) {
      return NextResponse.json(
        { error: 'itemIds 必須是陣列' },
        { status: 400 }
      );
    }

    if (itemIds.length === 0) {
      return NextResponse.json(
        { error: 'itemIds 必須至少包含一件衣物' },
        { status: 400 }
      );
    }

    // 驗證每個 itemId 格式（UUID 格式檢查）
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const invalidIds = itemIds.filter((id: any) => typeof id !== 'string' || !uuidRegex.test(id));

    if (invalidIds.length > 0) {
      return NextResponse.json(
        { error: `無效的 UUID 格式: ${invalidIds.join(', ')}` },
        { status: 400 }
      );
    }

    // --- Mock 資料生成 ---
    const score = Math.floor(Math.random() * (95 - 75 + 1)) + 75; // 75~95
    const analysis = ANALYSIS_SAMPLES[Math.floor(Math.random() * ANALYSIS_SAMPLES.length)];
    const tags = TAG_SAMPLES[Math.floor(Math.random() * TAG_SAMPLES.length)];

    return NextResponse.json(
      {
        success: true,
        data: {
          score,
          analysis,
          tags,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('API Error in /api/outfits/score (POST):', error);
    return NextResponse.json(
      { error: error.message || '內部伺服器錯誤' },
      { status: 500 }
    );
  }
}
