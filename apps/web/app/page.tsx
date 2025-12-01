'use client'

import { useState, useEffect } from 'react' // ✨ 新增 useEffect
import { motion } from 'motion/react'
import { WeatherCard } from './components/figma/WeatherCard'
import { QuickActions } from './components/figma/QuickActions'
import { StackedCards } from './components/figma/StackedCards'
import { OutfitDetailModal } from './components/figma/OutfitDetailModal'
import { WardrobePage } from './components/figma/WardrobePage'
import { OutfitCollectionPage } from './components/figma/OutfitCollectionPage'
import { StorePage } from './components/figma/StorePage'
import { TryOnPage } from './components/figma/TryOnPage'
import { CheckoutPage } from './components/figma/CheckoutPage'
import { DiscountPage } from './components/figma/DiscountPage'
import { TrendingPage } from './components/figma/TrendingPage'
import { ProfilePage } from './components/figma/ProfilePage'
import { ExplorePage } from './components/figma/ExplorePage'
import { UploadClothingPage } from './components/figma/UploadClothingPage'
import { WardrobeUtilization } from './components/figma/WardrobeUtilization'
import { CPWRanking } from './components/figma/CPWRanking'
import { EstimatedDelivery } from './components/figma/EstimatedDelivery'
import { BottomNav } from './components/figma/BottomNav'
import { Toaster } from './components/figma/ui/sonner'
import { LoginPage } from './components/figma/LoginPage'
import type { OutfitCombination } from '@/packages/types/src/basket' // ✨ 新增後端型別

// 🔐 真實的 Supabase 使用者 UUID
// TODO: 未來改成從認證系統 (如 Supabase Auth) 取得 userId
const REAL_USER_ID = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";

type PageType =
  | 'home'
  | 'wardrobe'
  | 'collection'
  | 'explore'
  | 'store'
  | 'profile'
  | 'tryon'
  | 'checkout'
  | 'discount'
  | 'trending'
  | 'upload'
  | 'login'

interface Outfit {
  id: number
  imageUrl: string
  styleName: string
  description: string
}

// ✨ Mock outfits 作為 fallback（當 API 失敗或無資料時使用）
const mockOutfits: Outfit[] = [
  {
    id: 1,
    imageUrl:
      'https://images.unsplash.com/photo-1762343287340-8aa94082e98b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    styleName: 'Casual Comfort',
    description:
      'Perfect for a cool, breezy day. Layer a light sweater with comfortable chinos and soft sneakers for effortless style.',
  },
  {
    id: 2,
    imageUrl:
      'https://images.unsplash.com/photo-1704775990327-90f7c43436fc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    styleName: 'Business Elegant',
    description:
      'Sophisticated and polished look that transitions seamlessly from office meetings to evening events.',
  },
  {
    id: 3,
    imageUrl:
      'https://images.unsplash.com/photo-1762114468792-ced36e281323?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    styleName: 'Summer Breeze',
    description:
      'Light and airy outfit perfect for warm weather. Stay cool while looking stylish with breathable fabrics.',
  },
]

// ✨ 將後端 OutfitCombination 轉換成前端 Outfit 格式
const convertOutfitCombinations = (combinations: OutfitCombination[]): Outfit[] => {
  return combinations.map((combo, index) => {
    // 收集所有單品名稱
    const itemNames = [
      combo.top?.name,
      combo.bottom?.name,
      combo.outerwear?.name,
      combo.shoes?.name,
    ].filter(Boolean)

    // 生成 styleName（使用第一個單品的 style 或預設值）
    const styleName = combo.top?.style
      ? `${combo.top.style.charAt(0).toUpperCase() + combo.top.style.slice(1)} Style`
      : `穿搭推薦 ${index + 1}`

    // 生成 description
    const description = itemNames.length > 0
      ? `搭配 ${itemNames.join('、')}`
      : '根據天氣和場合為您精選的穿搭組合'

    // 使用第一個有效的圖片（優先使用上衣）
    const imageUrl = combo.top?.imageUrl ||
                     combo.outerwear?.imageUrl ||
                     combo.bottom?.imageUrl ||
                     combo.shoes?.imageUrl ||
                     mockOutfits[index % mockOutfits.length].imageUrl

    return {
      id: index + 1,
      imageUrl,
      styleName,
      description,
    }
  })
}

export default function HomePage() {
  const [currentPage, setCurrentPage] = useState<PageType>('home')
  const [previousPage, setPreviousPage] = useState<PageType>('home')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('')

  // ✨ 新增每日穿搭推薦相關狀態
  const [outfits, setOutfits] = useState<Outfit[]>(mockOutfits)
  const [isLoadingOutfits, setIsLoadingOutfits] = useState(true)
  const [outfitsError, setOutfitsError] = useState<string | null>(null)
  const [useMockData, setUseMockData] = useState(false)

  // ✨ 載入每日穿搭推薦
  useEffect(() => {
    const fetchDailyOutfits = async () => {
      try {
        setIsLoadingOutfits(true)
        setOutfitsError(null)

        // 固定參數（可以之後從使用者設定或地理位置取得）
        const latitude = 25.0330 // 台北經緯度
        const longitude = 121.5654
        const occasion = 'casual'

        const response = await fetch(
          `/api/daily-outfits?userId=${REAL_USER_ID}&latitude=${latitude}&longitude=${longitude}&occasion=${occasion}`
        )

        if (!response.ok) {
          throw new Error(`API 錯誤: ${response.status}`)
        }

        const data: OutfitCombination[] = await response.json()

        // 如果 API 有回傳資料，轉換並設定
        if (data && data.length > 0) {
          const convertedOutfits = convertOutfitCombinations(data)
          setOutfits(convertedOutfits)
          setUseMockData(false)
        } else {
          // 如果沒有資料，使用 mock
          setOutfits(mockOutfits)
          setUseMockData(true)
        }
      } catch (err) {
        console.error('載入每日穿搭失敗:', err)
        setOutfitsError(err instanceof Error ? err.message : '載入失敗')
        // 發生錯誤時 fallback 到 mock data
        setOutfits(mockOutfits)
        setUseMockData(true)
      } finally {
        setIsLoadingOutfits(false)
      }
    }

    // 只在首頁時載入
    if (currentPage === 'home') {
      fetchDailyOutfits()
    }
  }, [currentPage]) // 當頁面切換到首頁時重新載入

  const navigateToTryOn = () => {
    setPreviousPage(currentPage)
    setCurrentPage('tryon')
  }

  const navigateToCheckout = () => {
    setPreviousPage(currentPage)
    setCurrentPage('checkout')
  }

  const navigateToDiscount = () => {
    setPreviousPage(currentPage)
    setCurrentPage('discount')
  }

  const navigateToTrending = () => {
    setPreviousPage(currentPage)
    setCurrentPage('trending')
  }

  const navigateToUpload = (imageUrl?: string) => {
    setPreviousPage(currentPage)
    if (imageUrl) {
      setUploadedImageUrl(imageUrl)
    }
    setCurrentPage('upload')
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setIsRefreshing(false)
    }, 1500)
  }

  const handleCardClick = (outfit: Outfit) => {
    setSelectedOutfit(outfit)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setTimeout(() => setSelectedOutfit(null), 300)
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <>
            {/* Header */}
            <motion.header
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
              className="sticky top-0 z-50 bg-[var(--vesti-background)]/95 backdrop-blur-sm"
            >
              <div className="flex h-16 items-center justify-center px-5 relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2">
                  <h1 className="text-2xl font-black italic tracking-tighter text-[var(--vesti-primary)]">
                    VESTI
                  </h1>
                </div>
              </div>
            </motion.header>

            {/* Refresh Loading Indicator */}
            {isRefreshing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="mx-5 mt-2 rounded-lg bg-card p-3 text-center shadow-sm"
              >
                <p className="text-sm text-[var(--vesti-gray-mid)]">
                  正在更新推薦穿搭...
                </p>
              </motion.div>
            )}

            {/* Weather Card */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <WeatherCard />
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <QuickActions
                onNavigateToTryOn={navigateToTryOn}
                onNavigateToTrending={navigateToTrending}
                onNavigateToDiscount={navigateToDiscount}
              />
            </motion.div>

            {/* Section Title */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="mb-3 px-5"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-[var(--vesti-dark)] not-italic font-[Inter]">
                  今日穿搭推薦
                </h2>
                {/* ✨ 顯示資料來源標記 */}
                {useMockData && !isLoadingOutfits && (
                  <span className="text-xs text-[var(--vesti-gray-mid)] bg-[var(--vesti-secondary)] px-2 py-1 rounded">
                    示範資料
                  </span>
                )}
              </div>
            </motion.div>

            {/* ✨ Loading 狀態 */}
            {isLoadingOutfits ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="mb-16 flex h-[400px] items-center justify-center px-5"
              >
                <div className="text-center">
                  <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[var(--vesti-secondary)] border-t-[var(--vesti-primary)] mx-auto" />
                  <p className="text-sm text-[var(--vesti-gray-mid)]">載入穿搭推薦中...</p>
                </div>
              </motion.div>
            ) : (
              <>
                {/* ✨ Error 狀態 */}
                {outfitsError && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className="mx-5 mb-3 rounded-xl bg-orange-50 border border-orange-200 p-3"
                  >
                    <p className="text-xs text-orange-600">⚠️ {outfitsError}</p>
                    <p className="text-xs text-orange-500 mt-1">已顯示示範穿搭</p>
                  </motion.div>
                )}

                {/* Stacked Cards */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="mb-16"
                >
                  <StackedCards outfits={outfits} onCardClick={handleCardClick} />
                </motion.div>
              </>
            )}

            {/* Wardrobe Utilization */}
            <WardrobeUtilization />

            {/* CPW Ranking */}
            <CPWRanking />

            {/* Estimated Delivery */}
            <EstimatedDelivery />
          </>
        )

      case 'wardrobe':
        return <WardrobePage onNavigateToUpload={navigateToUpload} />

      case 'collection':
        return <OutfitCollectionPage />

      case 'store':
        return (
          <StorePage
            onNavigateToTryOn={navigateToTryOn}
            onNavigateToCheckout={navigateToCheckout}
            onNavigateToDiscount={navigateToDiscount}
            onNavigateToTrending={navigateToTrending}
          />
        )

      case 'tryon':
        return (
          <TryOnPage
            onBack={() => setCurrentPage(previousPage)}
            onNavigateToCheckout={navigateToCheckout}
          />
        )

      case 'checkout':
        return <CheckoutPage onBack={() => setCurrentPage(previousPage)} />

      case 'discount':
        return (
          <DiscountPage
            onBack={() => setCurrentPage(previousPage)}
            onNavigateToTryOn={navigateToTryOn}
          />
        )

      case 'trending':
        return (
          <TrendingPage
            onBack={() => setCurrentPage(previousPage)}
            onNavigateToTryOn={navigateToTryOn}
          />
        )

      case 'upload':
        return (
          <UploadClothingPage
            onBack={() => setCurrentPage(previousPage)}
            initialImageUrl={uploadedImageUrl}
          />
        )

      case 'profile':
        return (
          <ProfilePage
            onNavigateToCheckout={navigateToCheckout}
            onLogout={() => {
              setPreviousPage(currentPage)
              setCurrentPage('login')
            }}
          />
        )

      case 'explore':
        return <ExplorePage />

      case 'login':
        return (
          <LoginPage
            onLogin={() => setCurrentPage('home')}
            onBack={() => setCurrentPage(previousPage)}
          />
        )

      default:
        return null
    }
  }

  return (
    <div
      className={`min-h-screen bg-[var(--vesti-background)] ${
        currentPage === 'login' ? '' : 'pb-28'
      }`}
    >
      <Toaster position="top-center" />

      <motion.div
        key={currentPage}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        {renderPage()}
      </motion.div>

      <OutfitDetailModal
        outfit={selectedOutfit}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

      {currentPage !== 'login' && (
        <BottomNav
          currentPage={currentPage}
          onPageChange={(page) => setCurrentPage(page as PageType)}
        />
      )}
    </div>
  )
}

