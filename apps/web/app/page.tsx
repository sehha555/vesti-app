'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white">
      {/* 頂部導航列 */}
      <nav className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="px-4 py-3 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span>👔</span>
            <span>Style</span>
          </Link>
          <button className="px-4 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm transition-colors">
            登入
          </button>
        </div>
      </nav>

      {/* Hero 主視覺區 */}
      <section className="px-6 py-12">
        <div className="text-center">
          {/* 標題 */}
          <h1 className="text-4xl font-bold text-gray-900 leading-tight mb-3">
            用 AI 打造<br />專屬穿搭風格
          </h1>
          <p className="text-base text-gray-600 mb-6">
            智能衣櫃管理 × 每日穿搭推薦 × 虛擬試穿
          </p>

          {/* Emoji 圖示網格 */}
          <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto mb-8">
            <div className="bg-blue-50 p-6 rounded-2xl text-5xl flex items-center justify-center">
              👕
            </div>
            <div className="bg-pink-50 p-6 rounded-2xl text-5xl flex items-center justify-center">
              👖
            </div>
            <div className="bg-purple-50 p-6 rounded-2xl text-5xl flex items-center justify-center">
              👗
            </div>
            <div className="bg-green-50 p-6 rounded-2xl text-5xl flex items-center justify-center">
              👔
            </div>
          </div>

          {/* 按鈕 */}
          <div className="flex flex-col gap-3">
            <Link
              href="/wardrobe"
              className="w-full px-6 py-3 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-all text-center font-medium"
            >
              開始使用
            </Link>
            <button className="w-full px-6 py-3 border-2 border-gray-300 text-gray-800 rounded-full hover:border-gray-400 transition-all font-medium">
              了解更多
            </button>
          </div>
        </div>
      </section>

      {/* 三大功能卡片 */}
      <section className="px-6 py-8 bg-white">
        <div className="space-y-5">
          {/* 卡片 1：虛擬衣櫃 */}
          <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl shadow-md">
            <div className="text-5xl mb-3">🗂️</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">虛擬衣櫃</h3>
            <p className="text-gray-600 text-sm mb-4">
              輕鬆管理你的所有衣物，智能分類整理
            </p>
            <Link
              href="/wardrobe"
              className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              立即體驗
            </Link>
          </div>

          {/* 卡片 2：AI 穿搭推薦 */}
          <div className="bg-gradient-to-br from-pink-50 to-white p-6 rounded-2xl shadow-md">
            <div className="text-5xl mb-3">🤖</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">AI 穿搭推薦</h3>
            <p className="text-gray-600 text-sm mb-4">
              每日兩套個性化穿搭，根據天氣與場合智能推薦
            </p>
            <Link
              href="/daily"
              className="inline-flex items-center px-5 py-2.5 bg-pink-600 text-white rounded-full hover:bg-pink-700 transition-colors text-sm font-medium"
            >
              查看推薦
            </Link>
          </div>

          {/* 卡片 3：虛擬試穿 */}
          <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-2xl shadow-md">
            <div className="text-5xl mb-3">👔</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">虛擬試穿</h3>
            <p className="text-gray-600 text-sm mb-4">
              即時預覽穿搭效果，找到最適合你的風格
            </p>
            <Link
              href="/upload"
              className="inline-flex items-center px-5 py-2.5 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors text-sm font-medium"
            >
              開始試穿
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-6">
        <div className="text-center text-gray-400 text-sm px-6">
          © 2025 Style App - 打造你的專屬風格
        </div>
      </footer>
    </div>
  );
}

