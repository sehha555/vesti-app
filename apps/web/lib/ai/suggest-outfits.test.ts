import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./gemini', () => ({ generateJson: vi.fn() }));
vi.mock('../feedback/summary', () => ({ loadRecentFeedback: vi.fn(async () => []), summarizeFeedback: vi.fn(() => null) }));
vi.mock('../closet/storage', () => ({
  downloadClosetImage: vi.fn(async () => ({ buffer: Buffer.from('x'), mimeType: 'image/png' })),
  storagePathFromImageUrl: (u: string) => u,
  freshSignedUrls: vi.fn(async (_s: unknown, _u: string, rows: Array<{ id: string }>) => new Map(rows.map((r) => [r.id, `https://img/${r.id}`]))),
}));

import { suggestOutfits } from './suggest-outfits';
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
  for (const m of ['eq', 'order']) chain[m] = () => chain;
  chain.limit = async () => ({ data: rows, error: null });
  return { client: { from: () => chain } as never, select };
}

const HOT = { temperature: 31, feelsLike: 34, humidity: 70, condition: 'sunny' as const, windSpeed: 3 };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(generateJson).mockResolvedValue({
    outfits: [{ title: '清爽', reason: '熱', slots: [{ slotKey: 'top_inner', itemId: 'tee' }, { slotKey: 'bottom', itemId: 'jeans' }] }],
  });
});

describe('suggestOutfits', () => {
  it('熱天不把羽絨外套送給模型，並附上辨識屬性', async () => {
    const { client, select } = supabaseWith(ROWS);
    const outfits = await suggestOutfits({ supabase: client, userId: 'u1', weather: HOT, occasion: 'casual' });

    expect(select.mock.calls[0][0]).toContain('attributes');
    const parts = vi.mocked(generateJson).mock.calls[0][1] as Part[];
    const text = parts.map((p) => p.text ?? '').join('\n');
    expect(text).not.toContain('itemId: coat');
    expect(text).toContain('itemId: tee｜名稱: 白 T｜類別: top｜顏色: 白｜花紋: 素面｜保暖 2/5');
    // 沒辨識過的照舊只寫顏色
    expect(text).toContain('itemId: shoes｜名稱: 白鞋｜類別: shoes｜顏色: 白');
    expect(outfits).toHaveLength(1);
  });

  it('候選不足 3 件就不叫模型', async () => {
    const { client } = supabaseWith(ROWS.slice(0, 2));
    expect(await suggestOutfits({ supabase: client, userId: 'u1', weather: HOT, occasion: 'casual' })).toEqual([]);
    expect(generateJson).not.toHaveBeenCalled();
  });
});
