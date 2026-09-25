import { describe, it, expect } from 'vitest';
import { parseRobots, isAllowedByRobots } from './robots';

const allowed = (txt: string, path: string) => isAllowedByRobots(parseRobots(txt), path);

describe('robots.txt', () => {
  it('沒有規則就全部允許', () => {
    expect(allowed('', '/any')).toBe(true);
    expect(allowed('User-agent: *\nDisallow:', '/any')).toBe(true);
  });

  it('* 群組的 Disallow 前綴比對', () => {
    const txt = 'User-agent: *\nDisallow: /cart\nDisallow: /account/';
    expect(allowed(txt, '/cart/checkout')).toBe(false);
    expect(allowed(txt, '/account/orders')).toBe(false);
    expect(allowed(txt, '/products/E123')).toBe(true);
  });

  it('有自己的群組就只看自己的，不看 *', () => {
    const txt = 'User-agent: *\nDisallow: /\n\nUser-agent: VestiBot\nDisallow: /private';
    expect(allowed(txt, '/products/1')).toBe(true);
    expect(allowed(txt, '/private/x')).toBe(false);
  });

  it('連續多行 User-agent 屬於同一群組', () => {
    const txt = 'User-agent: googlebot\nUser-agent: vestibot\nDisallow: /img';
    expect(allowed(txt, '/img/a.jpg')).toBe(false);
  });

  it('Allow 與 Disallow 取比對較長的；一樣長 Allow 優先', () => {
    const txt = 'User-agent: *\nDisallow: /products\nAllow: /products/public';
    expect(allowed(txt, '/products/secret')).toBe(false);
    expect(allowed(txt, '/products/public/1')).toBe(true);
    expect(allowed('User-agent: *\nDisallow: /a\nAllow: /a', '/a')).toBe(true);
  });

  it('支援 * 萬用字元與 $ 結尾', () => {
    const txt = 'User-agent: *\nDisallow: /*?sort=\nDisallow: /*.pdf$';
    expect(allowed(txt, '/list?sort=price')).toBe(false);
    expect(allowed(txt, '/doc.pdf')).toBe(false);
    expect(allowed(txt, '/doc.pdf?x=1')).toBe(true);
  });

  it('忽略註解與未知欄位', () => {
    const txt = '# hi\nUser-agent: * # everyone\nCrawl-delay: 5\nSitemap: https://x/s.xml\nDisallow: /tmp # temp';
    expect(allowed(txt, '/tmp/a')).toBe(false);
    expect(allowed(txt, '/ok')).toBe(true);
  });
});
