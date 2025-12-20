import { useState } from 'react';
import { WeatherCard } from './components/WeatherCard';
import { QuickActions } from './components/QuickActions';
import { StackedCards } from './components/StackedCards';
import { OutfitDetailModal } from './components/OutfitDetailModal';
import { WardrobePage } from './components/WardrobePage';
import { StorePage } from './components/StorePage';
import { TryOnPage } from './components/TryOnPage';
import { CheckoutPage } from './components/CheckoutPage';
import { DiscountPage } from './components/DiscountPage';
import { TrendingPage } from './components/TrendingPage';
import { ProfilePage } from './components/ProfilePage';
import { ExplorePage } from './components/ExplorePage';
import { UploadClothingPage } from './components/UploadClothingPage';
import { WardrobeUtilization } from './components/WardrobeUtilization';
import { CPWRanking } from './components/CPWRanking';
import { EstimatedDelivery } from './components/EstimatedDelivery';
import { BroadcastPage } from './components/BroadcastPage';
import { CalendarPage } from './components/CalendarPage';
import { CPWRankingFullPage } from './components/CPWRankingFullPage';
import { DeliveryTrackingPage } from './components/DeliveryTrackingPage';
import { NotificationPage } from './components/NotificationPage';
import { PaymentMethodsPage } from './components/PaymentMethodsPage';
import { PaymentCard } from './components/AddPaymentCardModal';
import { BottomNav } from './components/BottomNav';
import { Toaster } from './components/ui/sonner';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Bell, ShoppingCart } from 'lucide-react';
import { LoginPage } from './components/LoginPage';
import { useScrollMemory } from './components/hooks/useScrollMemory';
import { ErrorBoundary } from './components/ErrorBoundary';

const outfits = [
  {
    id: 1,
    imageUrl: 'https://images.unsplash.com/photo-1762343287340-8aa94082e98b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXN1YWwlMjBmYXNoaW9uJTIwb3V0Zml0JTIwc3RyZWV0JTIwc3R5bGV8ZW58MXx8fHwxNzYyNTI5NjgzfDA&ixlib=rb-4.1.0&q=80&w=1080',
    styleName: 'Casual Comfort',
    description: 'Perfect for a cool, breezy day. Layer a light sweater with comfortable chinos and soft sneakers for effortless style.',
  },
  {
    id: 2,
    imageUrl: 'https://images.unsplash.com/photo-1704775990327-90f7c43436fc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwYnVzaW5lc3MlMjBjYXN1YWwlMjBvdXRmaXR8ZW58MXx8fHwxNzYyNTI5NjgzfDA&ixlib=rb-4.1.0&q=80&w=1080',
    styleName: 'Business Elegant',
    description: 'Sophisticated and polished look that transitions seamlessly from office meetings to evening events.',
  },
  {
    id: 3,
    imageUrl: 'https://images.unsplash.com/photo-1762114468792-ced36e281323?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdW1tZXIlMjBjb21mb3J0YWJsZSUyMGNsb3RoaW5nJTIwc3R5bGV8ZW58MXx8fHwxNzYyNTI5NjgzfDA&ixlib=rb-4.1.0&q=80&w=1080',
    styleName: 'Summer Breeze',
    description: 'Light and airy outfit perfect for warm weather. Stay cool while looking stylish with breathable fabrics.',
  },
];

interface Outfit {
  id: number;
  imageUrl: string;
  styleName: string;
  description: string;
}

type PageType = 'home' | 'wardrobe' | 'explore' | 'store' | 'profile' | 'tryon' | 'checkout' | 'discount' | 'trending' | 'upload' | 'login' | 'broadcast' | 'calendar' | 'cpwranking' | 'delivery' | 'notification' | 'payment-methods';

// 定義頁面層級（用於判斷導航方向）
const pageHierarchy: Record<PageType, number> = {
  'login': 0,
  'home': 1,
  'wardrobe': 1,
  'explore': 1,
  'store': 1,
  'profile': 1,
  'tryon': 2,
  'checkout': 2,
  'discount': 2,
  'trending': 2,
  'upload': 2,
  'broadcast': 2,
  'calendar': 2,
  'cpwranking': 2,
  'delivery': 2,
  'notification': 2,
  'payment-methods': 2,
};

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('login');
  const [previousPage, setPreviousPage] = useState<PageType>('login');
  const [navigationDirection, setNavigationDirection] = useState<'forward' | 'back'>('forward');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [selectedDeliveryMerchant, setSelectedDeliveryMerchant] = useState<string>('');

  // 收藏的穿搭 state（從首頁 AI 推薦收藏）
  const [savedOutfits, setSavedOutfits] = useState<Outfit[]>([]);

  // 支付卡片 state
  const [savedCards, setSavedCards] = useState<PaymentCard[]>([]);

  // 處理收藏穿搭
  const handleSaveOutfit = (outfit: Outfit) => {
    setSavedOutfits(prev => {
      const exists = prev.find(o => o.id === outfit.id);
      if (exists) {
        // 取消收藏
        return prev.filter(o => o.id !== outfit.id);
      } else {
        // 新增收藏
        return [...prev, outfit];
      }
    });
  };

  // 使用滾動記憶
  useScrollMemory(currentPage);

  // 增強的頁面切換函數
  const navigateTo = (newPage: PageType) => {
    const currentLevel = pageHierarchy[currentPage];
    const newLevel = pageHierarchy[newPage];
    setNavigationDirection(newLevel > currentLevel ? 'forward' : 'back');
    setPreviousPage(currentPage);
    setCurrentPage(newPage);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1500);
  };

  const handleCardClick = (outfit: Outfit) => {
    setSelectedOutfit(outfit);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedOutfit(null), 300);
  };

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
              <div className="flex h-16 items-center justify-between px-5">
                <h1 className="text-2xl font-black italic tracking-tighter text-[var(--vesti-primary)]">
                  VESTI
                </h1>
                
                {/* 右側按鈕組 */}
                <div className="flex items-center gap-2">
                  {/* 購物車按鈕 */}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigateTo('checkout')}
                    className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-[var(--vesti-light-bg)] transition-colors"
                  >
                    <ShoppingCart className="h-6 w-6 text-[var(--vesti-dark)]" strokeWidth={2} />
                    {/* 購物車商品數量徽章 */}
                    <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--vesti-primary)] text-white" style={{ fontSize: '11px', fontWeight: 600 }}>
                      3
                    </div>
                  </motion.button>
                  
                  {/* 通知按鈕 */}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigateTo('notification')}
                    className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-[var(--vesti-light-bg)] transition-colors"
                  >
                    <Bell className="h-6 w-6 text-[var(--vesti-dark)]" strokeWidth={2} />
                    {/* 未讀通知徽章 */}
                    <div className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[var(--vesti-accent)]" />
                  </motion.button>
                </div>
              </div>
            </motion.header>

            {/* Refresh Loading Indicator */}
            <AnimatePresence>
              {isRefreshing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="mx-5 mt-2 rounded-lg bg-card p-3 text-center shadow-sm"
                >
                  <p className="text-sm text-[var(--vesti-gray-mid)]" style={{ fontWeight: 400 }}>正在為您準備今日穿搭...</p>
                </motion.div>
              )}
            </AnimatePresence>

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
                onNavigateToTryOn={() => navigateTo('tryon')}
                onNavigateToTrending={() => navigateTo('trending')}
                onNavigateToDiscount={() => navigateTo('discount')}
                onNavigateToCalendar={() => navigateTo('calendar')}
              />
            </motion.div>

            {/* Section Title */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="mb-3 px-5"
            >
              <h2 className="text-[var(--vesti-dark)] not-italic font-[Inter]">今日穿搭推薦</h2>
            </motion.div>

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
                onSaveOutfit={handleSaveOutfit}
              />
            </motion.div>

            {/* Wardrobe Utilization */}
            <WardrobeUtilization />

            {/* CPW Ranking */}
            <CPWRanking onNavigateToFullRanking={() => navigateTo('cpwranking')} />

            {/* Estimated Delivery */}
            <EstimatedDelivery onNavigateToDelivery={(merchant) => {
              if (merchant) setSelectedDeliveryMerchant(merchant);
              navigateTo('delivery');
            }} />
          </>
        );
      
      case 'wardrobe':
        return <WardrobePage 
          onNavigateToUpload={(imageUrl) => {
            if (imageUrl) setUploadedImageUrl(imageUrl);
            navigateTo('upload');
          }} 
          onNavigateToTryOn={() => navigateTo('tryon')} 
          onNavigateToBroadcast={() => navigateTo('broadcast')}
          savedOutfitsFromHome={savedOutfits}
        />;

      case 'store':
        return <StorePage onNavigateToTryOn={() => navigateTo('tryon')} onNavigateToCheckout={() => navigateTo('checkout')} onNavigateToDiscount={() => navigateTo('discount')} onNavigateToTrending={() => navigateTo('trending')} />;
      
      case 'tryon':
        return <TryOnPage onBack={() => setCurrentPage(previousPage)} onNavigateToCheckout={() => navigateTo('checkout')} />;
      
      case 'checkout':
        return <CheckoutPage onBack={() => setCurrentPage(previousPage)} />;
      
      case 'discount':
        return <DiscountPage onBack={() => setCurrentPage(previousPage)} onNavigateToTryOn={() => navigateTo('tryon')} />;
      
      case 'trending':
        return <TrendingPage onBack={() => setCurrentPage(previousPage)} onNavigateToTryOn={() => navigateTo('tryon')} />;
      
      case 'upload':
        return <UploadClothingPage onBack={() => setCurrentPage(previousPage)} initialImageUrl={uploadedImageUrl} />;
      
      case 'profile':
        return (
          <ProfilePage 
            onNavigateToCheckout={() => navigateTo('checkout')}
            onNavigateToDelivery={(merchant) => {
              if (merchant) setSelectedDeliveryMerchant(merchant);
              navigateTo('delivery');
            }}
            onNavigateToPaymentMethods={() => navigateTo('payment-methods')}
            onLogout={() => {
              setPreviousPage(currentPage);
              setCurrentPage('login');
            }}
          />
        );

      case 'explore':
        return <ExplorePage />;

      case 'login':
        return (
          <LoginPage 
            onLogin={() => setCurrentPage('home')} 
            onBack={() => setCurrentPage(previousPage)}
          />
        );
      
      case 'broadcast':
        return <BroadcastPage onBack={() => setCurrentPage(previousPage)} />;
      
      case 'calendar':
        return <CalendarPage onBack={() => setCurrentPage(previousPage)} />;
      
      case 'cpwranking':
        return <CPWRankingFullPage onBack={() => setCurrentPage(previousPage)} />;
      
      case 'delivery':
        return <DeliveryTrackingPage onBack={() => setCurrentPage(previousPage)} initialMerchant={selectedDeliveryMerchant} />;
      
      case 'notification':
        return <NotificationPage onBack={() => setCurrentPage(previousPage)} />;
      
      case 'payment-methods':
        return (
          <PaymentMethodsPage 
            onBack={() => setCurrentPage(previousPage)} 
            savedCards={savedCards}
            onCardsUpdate={setSavedCards}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <ErrorBoundary onReset={() => setCurrentPage('home')}>
      <div className={`min-h-screen bg-[var(--vesti-background)] ${currentPage === 'login' ? '' : 'pb-28'}`}>
        <Toaster position="top-center" />
        
        {/* 頁面內容 - 增強的滑動動畫 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ 
              x: navigationDirection === 'forward' ? 50 : -50,
              opacity: 0 
            }}
            animate={{ 
              x: 0,
              opacity: 1 
            }}
            exit={{ 
              x: navigationDirection === 'forward' ? -50 : 50,
              opacity: 0 
            }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 30,
              opacity: { duration: 0.2 }
            }}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>

        {/* Outfit Detail Modal */}
        <OutfitDetailModal
          outfit={selectedOutfit}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />

        {/* Bottom Navigation */}
        {currentPage !== 'login' && (
          <BottomNav currentPage={currentPage} onPageChange={setCurrentPage} />
        )}
      </div>
    </ErrorBoundary>
  );
}