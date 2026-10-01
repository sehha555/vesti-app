import { describe, it, expect } from 'vitest';
import { selectCandidates, fitsWeather, fitsOccasion, type CandidateInput } from './candidates';
import type { ItemAttributes } from '../closet/attributes';

const attrs = (warmth: number, extra: Partial<ItemAttributes> = {}): ItemAttributes => ({
  version: 1,
  category: 'top',
  subcategory: '',
  name: 'x',
  colors: ['白'],
  pattern: 'solid',
  warmth,
  formality: 2,
  styles: [],
  seasons: [],
  ...extra,
});

const item = (id: string, category: string, warmth?: number, extra: Partial<ItemAttributes> = {}) => ({
  id,
  category,
  attributes: warmth == null ? null : attrs(warmth, extra),
});

const ids = (rows: Array<{ id: string }>) => rows.map((r) => r.id);

describe('fitsWeather', () => {
  it.each([
    ['熱天排除毛衣', item('a', 'top', 4), 30, false],
    ['熱天排除一般外套', item('a', 'outerwear', 3), 30, false],
    ['熱天保留薄外套', item('a', 'outerwear', 2), 30, true],
    ['溫和天排除羽絨', item('a', 'outerwear', 5), 24, false],
    ['冷天排除背心', item('a', 'top', 1), 15, false],
    ['冷天配件不受影響', item('a', 'accessory', 1), 10, true],
    ['沒辨識的一律保留', item('a', 'outerwear'), 35, true],
    ['熱天排除長袖上衣（保暖度低也一樣）', item('a', 'top', 2, { sleeve: 'long' }), 30, false],
    ['熱天保留短袖上衣', item('a', 'top', 2, { sleeve: 'short' }), 30, true],
    ['舒服天長袖照常', item('a', 'top', 3, { sleeve: 'long' }), 24, true],
  ] as Array<[string, CandidateInput, number, boolean]>)('%s', (_label, it_, feelsLike, expected) => {
    expect(fitsWeather(it_, feelsLike)).toBe(expected);
  });
});

describe('fitsOccasion', () => {
  it.each([
    ['上班排除休閒鞋', item('a', 'shoes', 2, { formality: 2 }), 'work', false],
    ['上班保留樂福鞋', item('a', 'shoes', 2, { formality: 4 }), 'work', true],
    ['上班排除運動服', item('a', 'bottom', 2, { formality: 1 }), 'work', false],
    ['上班保留 T 恤（上衣交給模型挑）', item('a', 'top', 2, { formality: 2 }), 'work', true],
    ['休閒不篩', item('a', 'shoes', 2, { formality: 1 }), 'casual', true],
  ] as Array<[string, CandidateInput, string, boolean]>)('%s', (_label, it_, occasion, expected) => {
    expect(fitsOccasion(it_, occasion)).toBe(expected);
  });
});

describe('selectCandidates', () => {
  it('按類別輪流挑，不讓最新的同一類占滿名額', () => {
    const rows = [
      item('t1', 'top'),
      item('t2', 'top'),
      item('t3', 'top'),
      item('t4', 'top'),
      item('b1', 'bottom'),
      item('s1', 'shoes'),
    ];
    expect(ids(selectCandidates(rows, 25, 'casual', 4))).toEqual(['t1', 'b1', 's1', 't2']);
  });

  it('依天氣排除不合適的', () => {
    const rows = [item('coat', 'outerwear', 5), item('tee', 'top', 2), item('shorts', 'bottom', 1)];
    expect(ids(selectCandidates(rows, 32, 'casual', 10))).toEqual(['tee', 'shorts']);
  });

  it('必要類別被排光時整類放回，選配類別直接拿掉', () => {
    const rows = [item('sweater', 'top', 4), item('coat', 'outerwear', 5), item('jeans', 'bottom', 2)];
    expect(ids(selectCandidates(rows, 32, 'casual', 10))).toEqual(['sweater', 'jeans']);
  });

  it('總數不超過上限', () => {
    const rows = Array.from({ length: 50 }, (_, i) => item(`i${i}`, ['top', 'bottom', 'shoes'][i % 3]));
    expect(selectCandidates(rows, 25, 'casual', 30)).toHaveLength(30);
  });

  it('上班只送正式的鞋；衣櫃只有休閒鞋時照樣送', () => {
    const sneaker = item('sneaker', 'shoes', 2, { formality: 2 });
    const loafer = item('loafer', 'shoes', 2, { formality: 4 });
    const shirt = item('shirt', 'top', 3);
    const pants = item('pants', 'bottom', 2);
    expect(ids(selectCandidates([sneaker, loafer, shirt, pants], 23, 'work', 10))).toEqual(['loafer', 'shirt', 'pants']);
    expect(ids(selectCandidates([sneaker, shirt, pants], 23, 'work', 10))).toEqual(['sneaker', 'shirt', 'pants']);
  });
});
