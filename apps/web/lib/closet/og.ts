/**
 * 從商品頁 HTML 抓 Open Graph 的圖片與標題。
 * 不用 HTML parser：電商頁面的 og 標籤都在 <head>，regex 足夠，也避免多一個依賴。
 */
export interface OgData {
  image: string | null;
  title: string | null;
}

const META_TAG = /<meta\s+[^>]*>/gi;

function attr(tag: string, name: string): string | null {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, 'i'));
  return match ? match[1] : null;
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

export function parseOg(html: string, pageUrl: string): OgData {
  let image: string | null = null;
  let title: string | null = null;

  for (const tag of html.match(META_TAG) ?? []) {
    // 有些站用 property，有些用 name
    const key = (attr(tag, 'property') ?? attr(tag, 'name') ?? '').toLowerCase();
    const content = attr(tag, 'content');
    if (!content) continue;

    if (!image && (key === 'og:image' || key === 'og:image:secure_url' || key === 'twitter:image')) {
      image = decodeEntities(content);
    } else if (!title && (key === 'og:title' || key === 'twitter:title')) {
      title = decodeEntities(content).trim();
    }
    if (image && title) break;
  }

  if (!title) {
    const t = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    if (t) title = decodeEntities(t[1]).trim();
  }

  // 相對路徑轉絕對
  if (image) {
    try {
      image = new URL(image, pageUrl).toString();
    } catch {
      image = null;
    }
  }

  return { image, title: title || null };
}

/**
 * 純 JS 網站（伺服器回的 HTML 沒有 og:image）的商品圖規則。
 * 目前只有 UNIQLO 台灣：product-detail.html?productCode=uXXXX → 圖片 CDN 固定路徑。
 */
export function knownProductImage(pageUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(pageUrl);
  } catch {
    return null;
  }
  if (url.hostname === 'www.uniqlo.com' && url.pathname.startsWith('/tw/')) {
    const code = url.searchParams.get('productCode');
    if (code && /^u\d{10,}$/.test(code)) {
      return `https://www.uniqlo.com/tw/hmall/test/${code}/main/first/1000/1.jpg`;
    }
  }
  return null;
}
