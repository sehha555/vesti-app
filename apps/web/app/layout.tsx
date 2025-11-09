import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Style - AI 穿搭助手',
  description: '用 AI 打造專屬穿搭風格，智能衣櫃管理、每日穿搭推薦、虛擬試穿',
}

export default function RootLayout({ 
  children,
}: { 
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW">
      <body className="font-sans antialiased bg-gray-50">{children}</body>
    </html>
  )
}
