import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./gemini', () => ({ generateJson: vi.fn() }));
vi.mock('../feedback/summary', () => ({ loadRecentFeedback: vi.fn(async () => []), summarizeFeedback: vi.fn(() => null) }));
vi.mock('../closet/storage', () => ({
  downloadClosetImage: vi.fn(async () => ({ buffer: Buffer.from('x'), mimeType: 'image/png' })),
  storagePathFromImageUrl: (u: string) => u,
  freshSignedUrls: vi.fn(async (_s: unknown, _u: string, rows: Array<{ id: string }>) => new Map(rows.map((r) => [r.id, `https://img/${r.id}`]))),
}));

import { pickOutfits } from './suggest-outfits';
import { generateJson } from './gemini';
import type { Part } from '@google/genai';

const attrs = (category: string, warmth: number) => ({
  version: 1,
  category,
  subcategory: '',
  name: 'x',
  colors: ['白'],
  pattern: 'solid',
  warmth,
  formality: 2,
  styles: [],
  seasons: [],
});

const ROWS = [
  { id: 'tee', name: '白 T', category: 'top', color: '白', image_url: 'u1/tee.png', attributes: attrs('top', 2) },
  { id: 'coat', name: '羽絨外套', category: 'outerwear', color: '黑', image_url: 'u1/coat.png', attributes: attrs('outerwear', 5) },
  { id: 'jeans', name: '牛仔褲', category: 'bottom', color: '藍', image_url: 'u1/jeans.png', attributes: attrs('bottom', 2) },
  { id: 'shoes', name: '白鞋', category: 'shoes', color: '白', image_url: 'u1/shoes.png', attributes: null },
];

function supabaseWith(rows: unknown[]) {
  const select = vi.fn();
  const chain: Record<string, unknown> = { select: (...a: unknown[]) => (select(...a), chain) };
  for (const m of ['eq', 'order', 'gte', 'lt']) chain[m] = () => chain;
  chain.limit = async () => ({ data: rows, error: null });
  return { client: { from: () => chain } as never, select };
}

const HOT = { temperature: 31, feelsLike: 34, humidity: 70, condition: 'sunny' as const, windSpeed: 3 };

beforeEach(() => {
  vi.clearAllMocks();
  process.env.GEMINI_API_KEY = 'k';
  vi.mocked(generateJson).mockResolvedValue({
    outfits: [{ title: '清爽', reason: '熱', slots: [{ slotKey: 'top_inner', itemId: 'tee' }, { slotKey: 'bottom', itemId: 'jeans' }] }],
  });
});

describe('pickOutfits', () => {
  it('熱天不把羽絨外套送給模型，並附上辨識屬性', async () => {
    const { client, select } = supabaseWith(ROWS);
    const { raw, reason } = await pickOutfits({ supabase: client, userId: 'u1', weather: HOT, occasion: 'casual' });

    expect(select.mock.calls[0][0]).toContain('attributes');
    const parts = vi.mocked(generateJson).mock.calls[0][1] as Part[];
    const text = parts.map((p) => p.text ?? '').join('\n');
    expect(text).not.toContain('itemId: coat');
    expect(text).toContain('itemId: tee｜名稱: 白 T｜類別: top｜顏色: 白｜花紋: 素面｜保暖 2/5');
    // 沒辨識過的照舊只寫顏色
    expect(text).toContain('itemId: shoes｜名稱: 白鞋｜類別: shoes｜顏色: 白');
    expect(raw).toHaveLength(1);
    expect(reason).toBe('OK');
  });

  it('候選不足 3 件就不叫模型，原因是衣櫃太少', async () => {
    const { client } = supabaseWith(ROWS.slice(0, 2));
    expect(await pickOutfits({ supabase: client, userId: 'u1', weather: HOT, occasion: 'casual' })).toEqual({
      raw: [],
      reason: 'CLOSET_TOO_SMALL',
    });
    expect(generateJson).not.toHaveBeenCalled();
  });

  it('沒設 GEMINI_API_KEY 直接回 AI_UNAVAILABLE，不查資料庫', async () => {
    delete process.env.GEMINI_API_KEY;
    const { client, select } = supabaseWith(ROWS);
    expect(await pickOutfits({ supabase: client, userId: 'u1', weather: HOT, occasion: 'casual' })).toEqual({
      raw: [],
      reason: 'AI_UNAVAILABLE',
    });
    expect(select).not.toHaveBeenCalled();
  });

  it('模型沒給搭配時原因是 NO_OUTFIT', async () => {
    vi.mocked(generateJson).mockResolvedValue({ outfits: [] });
    const { client } = supabaseWith(ROWS);
    expect((await pickOutfits({ supabase: client, userId: 'u1', weather: HOT, occasion: 'casual' })).reason).toBe('NO_OUTFIT');
  });
});
