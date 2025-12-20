import type { Metadata } from 'next'
import './styles/vesti/globals.css';
import './styles/vesti-index.css'

export const metadata: Metadata = {
  title: 'Style - AI 穿搭推薦',
  description: '透過 AI 技術提供個人化穿搭建議',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW">
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
