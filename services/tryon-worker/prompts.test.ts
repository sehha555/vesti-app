import { describe, it, expect } from 'vitest';
import { buildTryonPlan, extractPrompt, flatSize } from './prompts.mjs';

describe('buildTryonPlan', () => {
  it('人物照第 1 張，接著照內搭→外套→下身→鞋排平拍圖，最後是下身版型參考', () => {
    const items = [
      { slotKey: 'shoes', name: '白色球鞋' },
      { slotKey: 'bottom', name: '寬版牛仔褲' },
      { slotKey: 'top_outer', name: '卡其外套' },
      { slotKey: 'top_inner', name: '白T' },
    ];
    const { prompt, refs } = buildTryonPlan(items);

    expect(refs).toEqual([
      { kind: 'person' },
      { kind: 'flat', index: 3 },
      { kind: 'flat', index: 2 },
      { kind: 'flat', index: 1 },
      { kind: 'flat', index: 0 },
      { kind: 'shape', index: 1 },
    ]);
    expect(prompt).toContain('上身改穿圖 2 的白T');
    expect(prompt).toContain('圖 3 的卡其外套');
    expect(prompt).toContain('下身改穿圖 4 的寬版牛仔褲');
    expect(prompt).toContain('腳上換成圖 5 的白色球鞋');
    expect(prompt).toContain('圖 6 是同一件下身的原始照片');
    expect(prompt).not.toContain('保留圖 1 原本的鞋子');
  });

  it('沒有鞋就保留原本的鞋；沒有下身就不附版型參考', () => {
    const { prompt, refs } = buildTryonPlan([{ slotKey: 'top_inner', name: '白T' }]);
    expect(refs).toEqual([{ kind: 'person' }, { kind: 'flat', index: 0 }]);
    expect(prompt).toContain('腳上保留圖 1 原本的鞋子');
    expect(prompt).not.toContain('原始照片');
  });

  it('配件不換、同部位只取第一件', () => {
    const { refs } = buildTryonPlan([
      { slotKey: 'accessory', name: '帽子' },
      { slotKey: 'top_inner', name: 'A' },
      { slotKey: 'top_inner', name: 'B' },
    ]);
    expect(refs).toEqual([{ kind: 'person' }, { kind: 'flat', index: 1 }]);
  });

  it('有版型描述就接在名稱後面', () => {
    const { prompt } = buildTryonPlan([{ slotKey: 'bottom', name: '牛仔褲', fit: '寬版，褲管向外弧。' }]);
    expect(prompt).toContain('下身改穿圖 2 的牛仔褲（版型：寬版，褲管向外弧）');
  });
});

describe('平拍圖', () => {
  it('prompt 帶衣服名稱、要求無字無人', () => {
    const p = extractPrompt({ name: '酒紅長袖T' });
    expect(p).toContain('酒紅長袖T');
    expect(p).toContain('不要任何文字');
    expect(p).not.toContain('版型：');
    expect(extractPrompt({ name: '牛仔褲', fit: '寬版弧形' })).toContain('版型：寬版弧形');
  });

  it('下身用直式尺寸，其他用正方形', () => {
    expect(flatSize('bottom')).toEqual({ w: 768, h: 1152 });
    expect(flatSize('top_inner')).toEqual({ w: 1024, h: 1024 });
  });
});
