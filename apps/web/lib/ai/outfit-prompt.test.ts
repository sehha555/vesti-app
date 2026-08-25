import { describe, it, expect } from 'vitest';
import { toOutfitSuggestions, buildOutfitParts } from './outfit-prompt';

const itemsById = new Map([
  ['t1', { name: '白 T', imageUrl: 'https://x/t1' }],
  ['b1', { name: '牛仔褲', imageUrl: 'https://x/b1' }],
  ['s1', { name: '白鞋', imageUrl: 'https://x/s1' }],
  ['o1', { name: '外套', imageUrl: 'https://x/o1' }],
]);

describe('toOutfitSuggestions', () => {
  it('轉成 layoutSlots 並依 priority 排序', () => {
    const out = toOutfitSuggestions(
      [
        {
          title: '清爽',
          reason: '天氣熱',
          slots: [
            { slotKey: 'shoes', itemId: 's1' },
            { slotKey: 'top_inner', itemId: 't1' },
            { slotKey: 'bottom', itemId: 'b1' },
          ],
        },
      ],
      itemsById
    );
    expect(out).toHaveLength(1);
    expect(out[0].layoutSlots.map((s) => s.slotKey)).toEqual(['top_inner', 'bottom', 'shoes']);
    expect(out[0].imageUrl).toBe('https://x/t1');
    expect(out[0].styleName).toBe('清爽');
    expect(out[0].id).toBe(1);
  });

  it('過濾不存在的 itemId 與非法 slotKey', () => {
    const out = toOutfitSuggestions(
      [
        {
          title: 'x',
          reason: 'y',
          slots: [
            { slotKey: 'top_inner', itemId: 't1' },
            { slotKey: 'bottom', itemId: 'b1' },
            { slotKey: 'shoes', itemId: 's1' },
            { slotKey: 'hat', itemId: 't1' },
            { slotKey: 'accessory', itemId: 'ghost' },
          ],
        },
      ],
      itemsById
    );
    expect(out[0].layoutSlots).toHaveLength(3);
  });

  it('同一件在同一套出現兩次只留一次', () => {
    const out = toOutfitSuggestions(
      [
        {
          title: 'x',
          reason: 'y',
          slots: [
            { slotKey: 'top_inner', itemId: 't1' },
            { slotKey: 'top_outer', itemId: 't1' },
            { slotKey: 'bottom', itemId: 'b1' },
            { slotKey: 'shoes', itemId: 's1' },
          ],
        },
      ],
      itemsById
    );
    expect(out[0].layoutSlots.map((s) => s.slotKey)).toEqual(['top_inner', 'bottom', 'shoes']);
  });

  it('缺上身 / 下身 / 鞋子任一的套裝整套丟掉', () => {
    const out = toOutfitSuggestions(
      [{ title: 'x', reason: 'y', slots: [{ slotKey: 'top_inner', itemId: 't1' }, { slotKey: 'bottom', itemId: 'b1' }] }],
      itemsById
    );
    expect(out).toEqual([]);
  });
});

describe('buildOutfitParts', () => {
  it('每件衣服一段文字加一張圖，開頭有天氣、結尾有指令', () => {
    const parts = buildOutfitParts(
      [
        { id: 't1', name: '白 T', category: 'top', color: 'white', imageBase64: 'AAA', mimeType: 'image/jpeg' },
        { id: 'b1', name: '牛仔褲', category: 'bottom', color: null, imageBase64: 'BBB', mimeType: 'image/png' },
      ],
      { temperature: 30, feelsLike: 33, humidity: 70, condition: 'sunny', windSpeed: 5, locationName: '台北' },
      'casual'
    );
    expect(parts).toHaveLength(1 + 2 * 2 + 1);
    expect(parts[0].text).toContain('體感 33 度');
    expect(parts[1].text).toContain('itemId: t1');
    expect(parts[1].text).toContain('顏色: white');
    expect(parts[2].inlineData).toEqual({ data: 'AAA', mimeType: 'image/jpeg' });
    expect(parts[3].text).not.toContain('顏色');
  });
});
