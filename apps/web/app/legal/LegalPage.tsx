import type { ReactNode } from 'react';
import Link from 'next/link';
import { LEGAL_LINKS } from '@/lib/legal/links';

// 預編譯的 Tailwind 缺很多 class，法律頁面用 inline style 排版
const S = {
  main: { maxWidth: 720, margin: '0 auto', padding: '32px 20px 64px', color: 'var(--vesti-dark, #1f2937)', lineHeight: 1.75 },
  draft: { background: '#fff7ed', border: '1px solid #fdba74', borderRadius: 12, padding: '10px 14px', fontSize: 14, marginBottom: 24 },
  h1: { fontSize: 26, fontWeight: 700, margin: '8px 0 4px' },
  meta: { fontSize: 13, color: '#6b7280', marginBottom: 24 },
  h2: { fontSize: 18, fontWeight: 700, margin: '28px 0 8px' },
  nav: { display: 'flex', gap: 16, flexWrap: 'wrap' as const, fontSize: 14, marginTop: 40, paddingTop: 16, borderTop: '1px solid #e5e7eb' },
};

// 上線前換成正式資料（見 docs/legal/link-out-compliance.md）
export const OPERATOR = '〔營運公司名稱〕';
export const CONTACT_EMAIL = '〔聯絡信箱〕';

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <main style={S.main} className="legal-page">
      {/* 預編譯 CSS 的 reset 拿掉了清單符號與連結樣式，這裡只對法律頁面補回 */}
      <style>{`.legal-page ul{list-style:disc;padding-left:1.25rem}.legal-page ul ul{list-style:circle}.legal-page li{margin:2px 0}.legal-page a{color:var(--vesti-primary,#2563eb);text-decoration:underline}.legal-page p{margin:6px 0}`}</style>
      <Link href="/" style={{ fontSize: 14 }}>
        ← 回到 Vesti
      </Link>
      <h1 style={S.h1}>{title}</h1>
      <p style={S.meta}>最後更新：{updated}</p>
      <p style={S.draft} role="note">
        草稿：本頁尚待律師確認，〔〕內為待補資料。
      </p>
      {children}
      <nav style={S.nav} aria-label="法律資訊">
        {LEGAL_LINKS.map((l) => (
          <Link key={l.href} href={l.href}>
            {l.label}
          </Link>
        ))}
      </nav>
    </main>
  );
}

export function H2({ children }: { children: ReactNode }) {
  return <h2 style={S.h2}>{children}</h2>;
}
