import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./gemini', () => ({ generateJson: vi.fn(), imagePart: vi.fn(() => ({})) }));

import { tagClosetItem } from './tag-item';
import { generateJson } from './gemini';

const image = { buffer: Buffer.from('x'), contentType: 'image/png' };
const good = {
  category: 'top',
  subcategory: '圓領T恤',
  name: '白色圓領T恤',
  colors: ['白'],
  pattern: 'solid',
  warmth: 2,
  formality: 2,
  styles: ['休閒', '簡約'],
  seasons: ['spring', 'summer'],
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.GEMINI_API_KEY = 'k';
});

describe('tagClosetItem', () => {
  it('回傳帶版本號的屬性，用低溫度', async () => {
    vi.mocked(generateJson).mockResolvedValue(good);
    expect(await tagClosetItem(image)).toEqual({ ...good, version: 1 });
    expect(vi.mocked(generateJson).mock.calls[0][3]).toEqual({ temperature: 0.2 });
  });

  it('修剪超長、重複的清單，而不是整筆丟掉', async () => {
    vi.mocked(generateJson).mockResolvedValue({
      ...good,
      colors: ['白', '白', '黑', '灰', '紅'],
      styles: ['休閒', ' 簡約 ', '日系', '街頭', '運動'],
      seasons: ['summer', 'summer'],
    });
    const a = await tagClosetItem(image);
    expect(a?.colors).toEqual(['白', '黑', '灰']);
    expect(a?.styles).toEqual(['休閒', '簡約', '日系', '街頭']);
    expect(a?.seasons).toEqual(['summer']);
  });

  it.each([
    ['保暖度超出範圍', { ...good, warmth: 7 }],
    ['未知類別', { ...good, category: 'hat' }],
    ['沒有顏色', { ...good, colors: [] }],
  ])('%s 回 null', async (_label, raw) => {
    vi.mocked(generateJson).mockResolvedValue(raw);
    expect(await tagClosetItem(image)).toBeNull();
  });

  it('模型出錯回 null、不丟例外', async () => {
    vi.mocked(generateJson).mockRejectedValue(new Error('quota'));
    expect(await tagClosetItem(image)).toBeNull();
  });

  it('沒設 GEMINI_API_KEY 不呼叫模型', async () => {
    delete process.env.GEMINI_API_KEY;
    expect(await tagClosetItem(image)).toBeNull();
    expect(generateJson).not.toHaveBeenCalled();
  });
});
