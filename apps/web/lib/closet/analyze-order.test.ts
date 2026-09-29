import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../ai/gemini', () => ({ generateJson: vi.fn(), imagePart: vi.fn(() => ({})) }));

import { analyzeOrderScreenshot } from './analyze-order';
import { generateJson } from '../ai/gemini';

const item = (overrides: Record<string, unknown> = {}) => ({
  name: '白色 T 恤',
  category: 'top',
  color: '白色',
  brand: null,
  box: [100, 50, 300, 250],
  ...overrides,
});

beforeEach(() => vi.clearAllMocks());

describe('analyzeOrderScreenshot', () => {
  it('回傳合格的商品與訂單編號', async () => {
    vi.mocked(generateJson).mockResolvedValue({ orderId: ' 2409ABC ', items: [item()] });
    const result = await analyzeOrderScreenshot(Buffer.from('x'), 'image/png');
    expect(result).toEqual({ orderId: '2409ABC', items: [item()] });
  });

  it('丟掉框不合理或類別不對的項目', async () => {
    vi.mocked(generateJson).mockResolvedValue({
      orderId: null,
      items: [
        item({ box: [300, 50, 100, 250] }), // ymax < ymin
        item({ box: [0, 0, 1200, 100] }), // 超出 0-1000
        item({ box: [0, 0, 100] }), // 少一個數
        item({ category: 'food' }),
        item({ name: '留下來的' }),
      ],
    });
    const result = await analyzeOrderScreenshot(Buffer.from('x'), 'image/png');
    expect(result.items.map((i) => i.name)).toEqual(['留下來的']);
  });

  it('空字串訂單編號當成沒有', async () => {
    vi.mocked(generateJson).mockResolvedValue({ orderId: '  ', items: [] });
    const result = await analyzeOrderScreenshot(Buffer.from('x'), 'image/png');
    expect(result.orderId).toBeNull();
  });
});
