/**
 * 導購外連：Vesti 不在 App 內交易，購買一律導到品牌 / 零售商自己的商品頁。
 *
 * 法遵重點（見 docs/legal/link-out-compliance.md）：
 * - 按鈕上直接顯示要前往的網站，使用者知道會離開 Vesti、交易由該網站負責
 * - 有分潤或 UTM 的連結要揭露利益關係（公平交易法第 21、25 條、公平會薦證廣告規範）
 * - 只在使用者點擊時才開啟，不預載、不自動導轉（聯盟計畫禁止 cookie stuffing）
 */

export const SHOP_DISCLOSURE =
  '購買連結會前往品牌或零售商官網，交易、付款與退換貨由該網站負責；部分連結可能含聯盟行銷分潤，價格與庫存以官網為準。';

export interface OutboundLink {
  href: string;
  /** 顯示給使用者看的網站名稱，例如 uniqlo.com */
  siteName: string;
}

/** 只接受 http(s)；無效網址回 null */
function parseWebUrl(rawUrl: string | null | undefined): URL | null {
  if (!rawUrl) return null;
  try {
    const url = new URL(rawUrl);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url : null;
  } catch {
    return null;
  }
}

/** 給使用者看的網站名稱，例如 https://www.uniqlo.com/tw/... → uniqlo.com */
export function siteNameFromUrl(rawUrl: string | null | undefined): string | null {
  return parseWebUrl(rawUrl)?.hostname.replace(/^www\./, '') ?? null;
}

/**
 * 驗證並加上來源參數；網址無效或不是 http(s) 回 null（畫面就不顯示購買按鈕）。
 * 分潤參數之後依各聯盟計畫的規則加在這裡，不要在元件裡自己拼。
 */
export function buildOutboundLink(rawUrl: string | null | undefined, campaign = 'app'): OutboundLink | null {
  const url = parseWebUrl(rawUrl);
  if (!url) return null;

  // 不覆蓋品牌 / 聯盟計畫原本就有的追蹤參數
  if (!url.searchParams.has('utm_source')) url.searchParams.set('utm_source', 'vesti');
  if (!url.searchParams.has('utm_medium')) url.searchParams.set('utm_medium', 'referral');
  if (!url.searchParams.has('utm_campaign')) url.searchParams.set('utm_campaign', campaign);

  return { href: url.toString(), siteName: siteNameFromUrl(url.toString())! };
}
