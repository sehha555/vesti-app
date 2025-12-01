'use client'

import { useState } from 'react'
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

const outfits: Outfit[] = [
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

export default function HomePage() {
  const [currentPage, setCurrentPage] = useState<PageType>('home')
  const [previousPage, setPreviousPage] = useState<PageType>('home')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('')

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
              <h2 className="text-[var(--vesti-dark)] not-italic font-[Inter]">
                今日穿搭推薦
              </h2>
            </motion.div>

            {/* Stacked Cards */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="mb-16"
            >
              <StackedCards outfits={outfits} onCardClick={handleCardClick} />
            </motion.div>

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

