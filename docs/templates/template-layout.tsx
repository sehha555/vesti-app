// apps/web/app/layout.tsx

import './globals.css'
import { BottomNavigation } from './components/ui/BottomNavigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Style - AI 穿搭推薦',
  description: 'AI 驅動的個人化穿搭推薦平台',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW">
      <body>
        <div className="min-h-screen bg-background">
          <main className="pb-20">
            {children}
          </main>
          <BottomNavigation />
        </div>
      </body>
    </html>
  )
}
