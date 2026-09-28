import { describe, it, expect } from 'vitest';
import { checkRules, type RuleInput } from './rules';
import type { ItemAttributes } from '../../lib/closet/attributes';

const a = (warmth: number, formality: number): ItemAttributes => ({
  version: 1, category: 'top', subcategory: '', name: 'x', colors: ['白'], pattern: 'solid', warmth, formality, styles: [], seasons: [],
});
const outfit = (...ids: string[]) => ({
  id: 1, styleName: 's', description: 'd', imageUrl: '',
  layoutSlots: ids.map((id, i) => ({ slotKey: i === 0 ? 'top_inner' : 'bottom', item: { id, name: id, imageUrl: '' }, priority: i })),
}) as RuleInput['outfits'][number];

const base = (over: Partial<RuleInput>): RuleInput => ({
  outfits: [outfit('t', 'b'), outfit('t2', 'b')],
  rawCount: 2,
  feelsLike: 24,
  occasion: 'casual',
  attributes: new Map([['t', a(2, 2)], ['t2', a(2, 2)], ['b', a(2, 3)], ['coat', a(5, 3)], ['suit', a(3, 5)], ['flip', a(1, 1)]]),
  dislikedCombos: [],
  wornCombos: [],
  ...over,
});
const rule = (results: ReturnType<typeof checkRules>, name: string) => results.find((r) => r.rule === name);

describe('考卷規則', () => {
  it('正常情況全部通過，不適用的規則不出現', () => {
    const r = checkRules(base({}));
    expect(r.every((x) => x.passed)).toBe(true);
    expect(rule(r, 'hot_no_heavy')).toBeUndefined();
    expect(rule(r, 'respect_dislike')).toBeUndefined();
  });

  it('抓得到：只有一套、重複、模型給了不合法的', () => {
    const r = checkRules(base({ outfits: [outfit('t', 'b'), outfit('b', 't')], rawCount: 3 }));
    expect(rule(r, 'distinct')?.passed).toBe(false);
    expect(rule(r, 'all_valid')?.passed).toBe(false);
    expect(rule(checkRules(base({ outfits: [outfit('t', 'b')] })), 'enough_outfits')?.passed).toBe(false);
  });

  it('熱天穿羽絨、冷天沒有保暖層、正式度差太多、上班穿拖鞋', () => {
    expect(rule(checkRules(base({ feelsLike: 33, outfits: [outfit('coat', 'b'), outfit('t', 'b')] })), 'hot_no_heavy')?.passed).toBe(false);
    expect(rule(checkRules(base({ feelsLike: 8 })), 'cold_warm_layer')?.passed).toBe(false);
    expect(rule(checkRules(base({ feelsLike: 8, outfits: [outfit('coat', 'b'), outfit('t', 'coat')] })), 'cold_warm_layer')?.passed).toBe(true);
    expect(rule(checkRules(base({ outfits: [outfit('flip', 'suit'), outfit('t', 'b')] })), 'formality_spread')?.passed).toBe(false);
    expect(rule(checkRules(base({ occasion: 'work', outfits: [outfit('flip', 'b'), outfit('t', 'b')] })), 'work_not_too_casual')?.passed).toBe(false);
  });

  it('熱天穿長袖、上班有皮鞋卻穿休閒鞋', () => {
    const attributes = new Map([
      ['t', a(2, 2)], ['b', a(2, 3)], ['long', { ...a(2, 3), sleeve: 'long' as const }],
      ['sneaker', { ...a(2, 2), category: 'shoes' as const }], ['loafer', { ...a(2, 4), category: 'shoes' as const }],
    ]);
    expect(rule(checkRules(base({ feelsLike: 33, attributes, outfits: [outfit('long', 'b'), outfit('t', 'b')] })), 'hot_no_long_sleeve')?.passed).toBe(false);
    expect(rule(checkRules(base({ feelsLike: 33, attributes })), 'hot_no_long_sleeve')?.passed).toBe(true);

    const withShoes = (shoes: string) => {
      const o = outfit('t', 'b');
      return { ...o, layoutSlots: [...o.layoutSlots, { slotKey: 'shoes', item: { id: shoes, name: shoes, imageUrl: '' }, priority: 4 }] } as RuleInput['outfits'][number];
    };
    expect(rule(checkRules(base({ occasion: 'work', attributes, outfits: [withShoes('sneaker'), withShoes('loafer')] })), 'work_dress_shoes')?.passed).toBe(false);
    expect(rule(checkRules(base({ occasion: 'work', attributes, outfits: [withShoes('loafer')] })), 'work_dress_shoes')?.passed).toBe(true);
    // 衣櫃沒有正式的鞋就不檢查
    attributes.delete('loafer');
    expect(rule(checkRules(base({ occasion: 'work', attributes, outfits: [withShoes('sneaker')] })), 'work_dress_shoes')).toBeUndefined();
  });

  it('回饋：說過不要的組合、最近穿過的整套', () => {
    const r = checkRules(base({ dislikedCombos: [['t', 'b']], wornCombos: [['b', 't2']] }));
    expect(rule(r, 'respect_dislike')?.passed).toBe(false);
    expect(rule(r, 'no_repeat_worn')?.passed).toBe(false);
  });
});
