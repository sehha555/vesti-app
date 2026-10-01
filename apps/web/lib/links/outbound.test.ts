import { describe, it, expect } from 'vitest';
import { buildOutboundLink } from './outbound';

describe('buildOutboundLink', () => {
  it('加上 UTM 並回傳網站名稱', () => {
    const link = buildOutboundLink('https://www.uniqlo.com/tw/zh_TW/products/E123?color=01', 'store')!;
    const url = new URL(link.href);
    expect(link.siteName).toBe('uniqlo.com');
    expect(url.searchParams.get('color')).toBe('01');
    expect(url.searchParams.get('utm_source')).toBe('vesti');
    expect(url.searchParams.get('utm_medium')).toBe('referral');
    expect(url.searchParams.get('utm_campaign')).toBe('store');
  });

  it('不覆蓋既有的追蹤參數（例如聯盟連結）', () => {
    const link = buildOutboundLink('https://shop.example/p/1?utm_source=affiliate&utm_campaign=x')!;
    const url = new URL(link.href);
    expect(url.searchParams.get('utm_source')).toBe('affiliate');
    expect(url.searchParams.get('utm_campaign')).toBe('x');
  });

  it.each([null, undefined, '', 'not a url', 'javascript:alert(1)', 'ftp://x.com/a', 'data:text/html,hi'])(
    '無效或危險的網址 %s 回 null',
    (raw) => {
      expect(buildOutboundLink(raw as string)).toBeNull();
    }
  );
});
