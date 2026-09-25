import { describe, it, expect } from 'vitest';
import { selectCandidates, fitsWeather, type CandidateInput } from './candidates';
import type { ItemAttributes } from '../closet/attributes';

const attrs = (warmth: number): ItemAttributes => ({
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
});

const item = (id: string, category: string, warmth?: number) => ({
  id,
  category,
  attributes: warmth == null ? null : attrs(warmth),
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
  ] as Array<[string, CandidateInput, number, boolean]>)('%s', (_label, it_, feelsLike, expected) => {
    expect(fitsWeather(it_, feelsLike)).toBe(expected);
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
    expect(ids(selectCandidates(rows, 25, 4))).toEqual(['t1', 'b1', 's1', 't2']);
  });

  it('依天氣排除不合適的', () => {
    const rows = [item('coat', 'outerwear', 5), item('tee', 'top', 2), item('shorts', 'bottom', 1)];
    expect(ids(selectCandidates(rows, 32, 10))).toEqual(['tee', 'shorts']);
  });

  it('必要類別被排光時整類放回，選配類別直接拿掉', () => {
    const rows = [item('sweater', 'top', 4), item('coat', 'outerwear', 5), item('jeans', 'bottom', 2)];
    expect(ids(selectCandidates(rows, 32, 10))).toEqual(['sweater', 'jeans']);
  });

  it('總數不超過上限', () => {
    const rows = Array.from({ length: 50 }, (_, i) => item(`i${i}`, ['top', 'bottom', 'shoes'][i % 3]));
    expect(selectCandidates(rows, 25, 30)).toHaveLength(30);
  });
});
