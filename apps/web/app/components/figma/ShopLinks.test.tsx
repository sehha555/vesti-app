import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ShopLinkButton, ShopDisclosure } from './ShopLinks';

describe('ShopLinkButton', () => {
  it('有商品頁：新分頁外連、顯示網站名稱、標示 sponsored 並帶 UTM', () => {
    const html = renderToStaticMarkup(
      <ShopLinkButton item={{ id: 1, name: '白T', productUrl: 'https://www.uniqlo.com/tw/p/E1' }} campaign="store" />
    );
    expect(html).toContain('前往 uniqlo.com 購買');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="sponsored noopener noreferrer"');
    expect(html).toContain('utm_source=vesti');
    expect(html).toContain('utm_campaign=store');
  });

  it('沒有商品頁：不給連結，顯示尚未提供', () => {
    const html = renderToStaticMarkup(<ShopLinkButton item={{ id: 1, name: '白T' }} />);
    expect(html).toContain('尚未提供購買連結');
    expect(html).not.toContain('<a');
  });

  it('危險網址不會變成連結', () => {
    const html = renderToStaticMarkup(<ShopLinkButton item={{ id: 1, name: 'x', productUrl: 'javascript:alert(1)' }} />);
    expect(html).not.toContain('javascript:');
    expect(html).toContain('尚未提供購買連結');
  });
});

describe('ShopDisclosure', () => {
  it('揭露交易由官網負責、可能含分潤、價格以官網為準', () => {
    const html = renderToStaticMarkup(<ShopDisclosure />);
    expect(html).toContain('交易、付款與退換貨由該網站負責');
    expect(html).toContain('聯盟行銷分潤');
    expect(html).toContain('價格與庫存以官網為準');
  });
});
