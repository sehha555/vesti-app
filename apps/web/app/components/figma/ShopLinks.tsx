'use client';

import { createPortal } from 'react-dom';
import { ExternalLink, X } from 'lucide-react';
import { buildOutboundLink, SHOP_DISCLOSURE } from '../../../lib/links/outbound';

export interface ShoppableItem {
  id: number | string;
  name: string;
  brand?: string;
  price?: number;
  imageUrl?: string;
  /** 品牌 / 零售商的商品頁；沒有就不能購買 */
  productUrl?: string;
}

const PRIMARY = { background: 'var(--vesti-primary)' };

/** 「前往 ○○ 購買 ↗」：按鈕上直接寫出要去的網站，沒有網址就顯示不可按 */
export function ShopLinkButton({ item, campaign, compact = false }: { item: ShoppableItem; campaign?: string; compact?: boolean }) {
  const link = buildOutboundLink(item.productUrl, campaign);
  const size = compact ? 'px-3 py-1 text-xs' : 'px-4 py-2 text-sm';

  if (!link) {
    return (
      <span className={`inline-flex items-center rounded-full border ${size}`} style={{ opacity: 0.5 }} aria-disabled="true">
        尚未提供購買連結
      </span>
    );
  }

  return (
    <a
      href={link.href}
      target="_blank"
      // sponsored：可能含分潤；noopener noreferrer：不讓外站拿到 Vesti 的 window
      rel="sponsored noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={`inline-flex items-center gap-1 rounded-full text-white shadow-md ${size}`}
      style={PRIMARY}
      aria-label={`前往 ${link.siteName} 購買 ${item.name}`}
    >
      前往 {link.siteName} 購買
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}

export function ShopDisclosure() {
  return (
    <p className="text-xs" style={{ color: 'var(--vesti-gray-mid)', lineHeight: 1.5 }}>
      {SHOP_DISCLOSURE}
    </p>
  );
}

/**
 * 一套穿搭的單品可能來自不同網站，逐件列出各自的購買連結。
 * 用 portal 掛到 body，避免被頁面動畫容器與底部導覽列蓋住。
 */
export function ShopLinksSheet({
  items,
  campaign,
  onClose,
}: {
  items: ShoppableItem[];
  campaign?: string;
  onClose: () => void;
}) {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.4)', zIndex: 100 }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label="前往購買"
        className="w-full space-y-3 bg-white p-5"
        style={{ maxWidth: 480, maxHeight: '80vh', overflowY: 'auto', borderRadius: '20px 20px 0 0' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">前往官網購買（{items.length} 件）</p>
          <button type="button" onClick={onClose} aria-label="關閉" className="rounded-full p-2">
            <X className="h-4 w-4" />
          </button>
        </div>

        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3">
              <div style={{ minWidth: 0 }}>
                <p className="text-sm truncate">{item.name}</p>
                <p className="text-xs" style={{ color: 'var(--vesti-gray-mid)' }}>
                  {[item.brand, item.price !== undefined ? `NT$ ${item.price.toLocaleString()}（以官網為準）` : null]
                    .filter(Boolean)
                    .join('・')}
                </p>
              </div>
              <ShopLinkButton item={item} campaign={campaign} compact />
            </li>
          ))}
        </ul>

        <ShopDisclosure />
      </div>
    </div>,
    document.body
  );
}
