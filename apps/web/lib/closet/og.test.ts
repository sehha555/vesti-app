import { describe, it, expect } from 'vitest';
import { parseOg, knownProductImages } from './og';

const PAGE = 'https://shop.example/products/123';

describe('parseOg', () => {
  it('抓 property 寫法的 og:image 與 og:title', () => {
    const html = `<html><head>
      <meta property="og:title" content="男裝 羽絨外套 藏青" />
      <meta property="og:image" content="https://cdn.example/a.jpg" />
    </head></html>`;
    expect(parseOg(html, PAGE)).toEqual({ image: 'https://cdn.example/a.jpg', title: '男裝 羽絨外套 藏青' });
  });

  it('抓 name 寫法與 twitter 後備', () => {
    const html = `<meta name="twitter:image" content="https://cdn.example/t.jpg"><meta name="twitter:title" content="T">`;
    expect(parseOg(html, PAGE)).toEqual({ image: 'https://cdn.example/t.jpg', title: 'T' });
  });

  it('content 在 property 前面也能抓', () => {
    const html = `<meta content="https://cdn.example/b.png" property="og:image">`;
    expect(parseOg(html, PAGE).image).toBe('https://cdn.example/b.png');
  });

  it('相對路徑轉成絕對', () => {
    const html = `<meta property="og:image" content="/img/c.webp">`;
    expect(parseOg(html, PAGE).image).toBe('https://shop.example/img/c.webp');
  });

  it('解碼 HTML entity', () => {
    const html = `<meta property="og:image" content="https://cdn.example/d.jpg?w=1&amp;h=2">`;
    expect(parseOg(html, PAGE).image).toBe('https://cdn.example/d.jpg?w=1&h=2');
  });

  it('沒有 og:title 時退回 <title>', () => {
    const html = `<title> 商品頁 </title><meta property="og:image" content="https://cdn.example/e.jpg">`;
    expect(parseOg(html, PAGE).title).toBe('商品頁');
  });

  it('什麼都沒有回 null', () => {
    expect(parseOg('<html></html>', PAGE)).toEqual({ image: null, title: null });
  });
});

describe('knownProductImages', () => {
  it('UNIQLO 台灣商品頁推出 4 張候選圖網址', () => {
    const out = knownProductImages('https://www.uniqlo.com/tw/zh_TW/product-detail.html?productCode=u0000000054525&colorCode=COL09');
    expect(out).toEqual([
      'https://www.uniqlo.com/tw/hmall/test/u0000000054525/main/first/1000/1.jpg',
      'https://www.uniqlo.com/tw/hmall/test/u0000000054525/main/other1/1000/2.jpg',
      'https://www.uniqlo.com/tw/hmall/test/u0000000054525/main/other2/1000/3.jpg',
      'https://www.uniqlo.com/tw/hmall/test/u0000000054525/main/other3/1000/4.jpg',
    ]);
  });

  it('不是 UNIQLO 台灣、或 productCode 格式不對，回空陣列', () => {
    expect(knownProductImages('https://www.uniqlo.com/jp/ja/products/E12345-000')).toEqual([]);
    expect(knownProductImages('https://www.uniqlo.com/tw/zh_TW/product-detail.html?productCode=../x')).toEqual([]);
    expect(knownProductImages('https://shop.example/p/1')).toEqual([]);
    expect(knownProductImages('not a url')).toEqual([]);
  });
});
