import { describe, it, expect, vi } from 'vitest';

vi.mock('../ai/tag-item', () => ({ tagClosetItem: vi.fn() }));

import { closetItemColumns, DEFAULT_ITEM_NAME } from './create-item';
import type { ItemAttributes } from './attributes';

const attrs: ItemAttributes = {
  version: 1,
  category: 'bottom',
  subcategory: '牛仔寬褲',
  name: '深藍牛仔寬褲',
  colors: ['深藍', '白'],
  pattern: 'denim',
  warmth: 2,
  formality: 2,
  styles: ['休閒'],
  seasons: ['spring', 'autumn'],
};

describe('closetItemColumns', () => {
  it('沒填名稱、未分類時用 AI 的名稱與類別，並寫入屬性欄位', () => {
    expect(closetItemColumns({ category: 'uncategorized' }, attrs)).toEqual({
      name: '深藍牛仔寬褲',
      category: 'bottom',
      subcategory: '牛仔寬褲',
      color: '深藍',
      season: 'spring,autumn',
      tags: ['休閒'],
      attributes: attrs,
    });
  });

  it('使用者填的名稱與類別優先', () => {
    const cols = closetItemColumns({ name: '我的褲子', category: 'top' }, attrs);
    expect(cols.name).toBe('我的褲子');
    expect(cols.category).toBe('top');
  });

  it('沒辨識出來時用 fallbackName，再沒有就用預設名稱，不寫屬性欄位', () => {
    expect(closetItemColumns({ category: 'uncategorized', fallbackName: 'UNIQLO 寬褲' }, null)).toEqual({
      name: 'UNIQLO 寬褲',
      category: 'uncategorized',
    });
    expect(closetItemColumns({ category: 'shoes' }, null).name).toBe(DEFAULT_ITEM_NAME);
  });
});
