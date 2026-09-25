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

  it('沒有鞋子也保留（衣櫃常常沒鞋），缺上身或下身才丟掉', () => {
    const out = toOutfitSuggestions(
      [
        { title: 'no-shoes', reason: '', slots: [{ slotKey: 'top_inner', itemId: 't1' }, { slotKey: 'bottom', itemId: 'b1' }] },
        { title: 'no-bottom', reason: '', slots: [{ slotKey: 'top_inner', itemId: 't1' }, { slotKey: 'shoes', itemId: 's1' }] },
      ],
      itemsById
    );
    expect(out.map((o) => o.styleName)).toEqual(['no-shoes']);
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

  it('有辨識屬性時寫出保暖度、正式度與風格', () => {
    const parts = buildOutfitParts(
      [
        {
          id: 't1',
          name: '白色襯衫',
          category: 'top',
          color: '白',
          attributes: {
            version: 1,
            category: 'top',
            subcategory: '牛津襯衫',
            name: '白色襯衫',
            colors: ['白', '淺藍'],
            pattern: 'stripe',
            warmth: 3,
            formality: 4,
            styles: ['商務', '簡約'],
            seasons: ['spring'],
          },
          imageBase64: 'AAA',
          mimeType: 'image/jpeg',
        },
      ],
      { temperature: 22, feelsLike: 22, humidity: 60, condition: 'cloudy', windSpeed: 3 },
      'work'
    );
    expect(parts[1].text).toBe(
      'itemId: t1｜名稱: 白色襯衫｜類別: top｜細類: 牛津襯衫｜顏色: 白/淺藍｜花紋: 條紋｜保暖 3/5｜正式 4/5｜風格: 商務、簡約'
    );
  });

  it('有回饋時放在最後指令之前，沒有就不出現', () => {
    const items = [{ id: 't1', name: '白 T', category: 'top', color: null, imageBase64: 'AAA', mimeType: 'image/jpeg' }];
    const weather = { temperature: 25, feelsLike: 25, humidity: 60, condition: 'cloudy' as const, windSpeed: 3 };

    const without = buildOutfitParts(items, weather, 'casual', null);
    expect(without.some((p) => p.text?.includes('使用者回饋'))).toBe(false);

    const withFeedback = buildOutfitParts(items, weather, 'casual', '使用者不喜歡的組合：\n- 白 T + 牛仔褲（太正式）');
    expect(withFeedback).toHaveLength(without.length + 1);
    expect(withFeedback.at(-2)?.text).toContain('白 T + 牛仔褲（太正式）');
    expect(withFeedback.at(-1)?.text).toContain('請依照原則');
  });
});
