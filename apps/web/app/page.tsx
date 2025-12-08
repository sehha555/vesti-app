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

// 🎨 Instagram 穿搭風格的 Outfit 型別
interface Outfit {
  id: number
  imageUrl: string // 保留作為 fallback
  styleName: string
  description: string
  heroImageUrl?: string // 新增：整體穿搭照（右側大圖）
  items?: {            // 新增：單品列表（左側展示）
    id: string
    name: string
    imageUrl: string
  }[]
}

// ✨ Mock outfits 作為 fallback（當 API 失敗或無資料時使用）
// 🎨 包含 Instagram 風格的 heroImageUrl 與 items
const mockOutfits: Outfit[] = [
  {
    id: 1,
    imageUrl:
      'https://images.unsplash.com/photo-1762343287340-8aa94082e98b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    styleName: 'Casual Comfort',
    description:
      'Perfect for a cool, breezy day. Layer a light sweater with comfortable chinos and soft sneakers for effortless style.',
    heroImageUrl: 'https://images.unsplash.com/photo-1762343287340-8aa94082e98b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    items: [
      { id: '1-1', name: '白色T恤', imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300' },
      { id: '1-2', name: '卡其褲', imageUrl: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=300' },
      { id: '1-3', name: '白色球鞋', imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300' },
    ],
  },
  {
    id: 2,
    imageUrl:
      'https://images.unsplash.com/photo-1704775990327-90f7c43436fc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    styleName: 'Business Elegant',
    description:
      'Sophisticated and polished look that transitions seamlessly from office meetings to evening events.',
    heroImageUrl: 'https://images.unsplash.com/photo-1704775990327-90f7c43436fc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    items: [
      { id: '2-1', name: '藍色襯衫', imageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=300' },
      { id: '2-2', name: '西裝褲', imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300' },
      { id: '2-3', name: '皮鞋', imageUrl: 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=300' },
    ],
  },
  {
    id: 3,
    imageUrl:
      'https://images.unsplash.com/photo-1762114468792-ced36e281323?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    styleName: 'Summer Breeze',
    description:
      'Light and airy outfit perfect for warm weather. Stay cool while looking stylish with breathable fabrics.',
    heroImageUrl: 'https://images.unsplash.com/photo-1762114468792-ced36e281323?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    items: [
      { id: '3-1', name: '亞麻襯衫', imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=300' },
      { id: '3-2', name: '短褲', imageUrl: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=300' },
    ],
  },
]

// ✨ 將後端 OutfitCombination 轉換成前端 Outfit 格式（Instagram 風格）
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

    // 🎨 提取單品列表（最多 3 個）
    const items = [
      combo.top && { id: combo.top.id, name: combo.top.name, imageUrl: combo.top.imageUrl },
      combo.bottom && { id: combo.bottom.id, name: combo.bottom.name, imageUrl: combo.bottom.imageUrl },
      combo.outerwear && { id: combo.outerwear.id, name: combo.outerwear.name, imageUrl: combo.outerwear.imageUrl },
      combo.shoes && { id: combo.shoes.id, name: combo.shoes.name, imageUrl: combo.shoes.imageUrl },
    ].filter(Boolean).slice(0, 3) as { id: string; name: string; imageUrl: string }[]

    // 🎨 heroImageUrl：使用上衣圖作為整體穿搭照（實際應用中這裡應該是 lookbook 照片）
    // 暫時用第一個單品的圖片，實際上應該從後端取得整體照
    const heroImageUrl = combo.top?.imageUrl || combo.outerwear?.imageUrl || combo.bottom?.imageUrl

    // fallback imageUrl（如果沒有 heroImageUrl 時使用）
    const imageUrl = heroImageUrl || mockOutfits[index % mockOutfits.length].imageUrl

    return {
      id: index + 1,
      imageUrl,
      styleName,
      description,
      heroImageUrl,
      items,
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

  // ✨ 天氣資訊狀態
  const [weather, setWeather] = useState<{
    temp_c: number
    condition: string
    description: string
    iconUrl?: string
    humidity: number
    feels_like: number
    locationName?: string
  } | null>(null)

  // ✨ 當前場合（用於儲存穿搭）
  const [currentOccasion] = useState('casual')

  // ✨ 使用者位置狀態（用於天氣 API）
  const [userLocation, setUserLocation] = useState<{
    latitude: number
    longitude: number
  } | null>(null)
  const [geolocationError, setGeolocationError] = useState<string | null>(null)

  // ✨ 取得使用者地理位置
  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn('[Geolocation] 瀏覽器不支援 Geolocation API')
      setGeolocationError('您的瀏覽器不支援定位功能')
      // Fallback 到中和區
      setUserLocation({ latitude: 24.9917, longitude: 121.4950 })
      return
    }

    console.log('[Geolocation] 正在請求定位權限...')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        console.log('[Geolocation] ✅ 成功取得位置:', { latitude, longitude })
        setUserLocation({ latitude, longitude })
        setGeolocationError(null)
      },
      (error) => {
        console.error('[Geolocation] ❌ 定位失敗:', error.message)
        let errorMessage = '無法取得您的位置'

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = '定位權限被拒絕，使用預設位置'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = '位置資訊無法取得，使用預設位置'
            break
          case error.TIMEOUT:
            errorMessage = '定位請求逾時，使用預設位置'
            break
        }

        setGeolocationError(errorMessage)
        // Fallback 到中和區
        console.log('[Geolocation] 📍 使用 Fallback 位置: 中和區 (24.9917, 121.4950)')
        setUserLocation({ latitude: 24.9917, longitude: 121.4950 })
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    )
  }, [])

  // ✨ 載入每日穿搭推薦
  useEffect(() => {
    const fetchDailyOutfits = async () => {
      // 🔍 等待位置取得後才呼叫 API
      if (!userLocation) {
        console.log('[DailyOutfits] ⏳ 等待位置資訊...')
        return
      }

      try {
        setIsLoadingOutfits(true)
        setOutfitsError(null)

        // 🌍 使用動態地理位置
        const { latitude, longitude } = userLocation
        const occasion = 'casual'

        console.log('[DailyOutfits] 📍 使用座標:', { latitude, longitude })

        const response = await fetch(
          `/api/daily-outfits?userId=${REAL_USER_ID}&latitude=${latitude}&longitude=${longitude}&occasion=${occasion}`
        )

        if (!response.ok) {
          throw new Error(`API 錯誤: ${response.status}`)
        }

        // ✨ API 現在回傳 { weather, outfits }
        const data: { weather: any; outfits: OutfitCombination[] } = await response.json()

        // 設定天氣資訊
        if (data.weather) {
          setWeather(data.weather)
        }

        // 如果 API 有回傳穿搭資料，轉換並設定
        if (data.outfits && data.outfits.length > 0) {
          const convertedOutfits = convertOutfitCombinations(data.outfits)
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
  }, [currentPage, userLocation]) // 當頁面切換到首頁或位置改變時重新載入

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

            {/* Geolocation Error Message */}
            {geolocationError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="px-5 mb-3"
              >
                <div className="rounded-xl bg-orange-50 border border-orange-200 p-3 flex items-start gap-2">
                  <span className="text-orange-500 text-sm">⚠️</span>
                  <p className="text-xs text-orange-700 flex-1">{geolocationError}</p>
                </div>
              </motion.div>
            )}

            {/* Weather Card */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <WeatherCard weather={weather} />
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
                  <StackedCards
                    outfits={outfits}
                    onCardClick={handleCardClick}
                    userId={REAL_USER_ID}
                    weather={weather || undefined}
                    occasion={currentOccasion}
                  />
                </motion.div>
              </>
            )}

            {/* Wardrobe Utilization */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="mt-12"
            >
              <WardrobeUtilization />
            </motion.div>

            {/* CPW Ranking */}
            <CPWRanking />

            {/* Estimated Delivery */}
            <EstimatedDelivery />
          </>
        )

      case 'wardrobe':
        return (
          <WardrobePage
            onNavigateToUpload={navigateToUpload}
            onNavigateToDailyOutfits={() => setCurrentPage('home')}
            onNavigateToTryOn={navigateToTryOn}
            userId={REAL_USER_ID}
          />
        )

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

