'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Bell, ShoppingCart } from 'lucide-react';
import type { WeatherSummary } from '@/packages/types/src/weather';

// --- Import all required components from './components/figma/*' ---
import { LoginPage } from './components/figma/LoginPage';
import { WeatherCard } from './components/figma/WeatherCard';
import { QuickActions } from './components/figma/QuickActions';
import { StackedCards } from './components/figma/StackedCards';
import { WardrobeUtilization } from './components/figma/WardrobeUtilization';
import { CPWRanking } from './components/figma/CPWRanking';
import { EstimatedDelivery } from './components/figma/EstimatedDelivery';
import { OutfitDetailModal } from './components/figma/OutfitDetailModal';
import { BottomNav } from './components/figma/BottomNav';
import { Toaster } from './components/figma/ui/sonner';
import { useScrollMemory } from './components/figma/hooks/useScrollMemory';
import { ErrorBoundary } from './components/figma/ErrorBoundary';

// --- Page Components ---
import { WardrobePage } from './components/figma/WardrobePage';
import { ExplorePage } from './components/figma/ExplorePage';
import { StorePage } from './components/figma/StorePage';
import { ProfilePage } from './components/figma/ProfilePage';
import { TryOnPage } from './components/figma/TryOnPage';
import { CheckoutPage } from './components/figma/CheckoutPage';
import { DiscountPage } from './components/figma/DiscountPage';
import { TrendingPage } from './components/figma/TrendingPage';
import { UploadClothingPage } from './components/figma/UploadClothingPage';
import { BroadcastPage } from './components/figma/BroadcastPage';
import { CalendarPage } from './components/figma/CalendarPage';
import { CPWRankingFullPage } from './components/figma/CPWRankingFullPage';
import { DeliveryTrackingPage } from './components/figma/DeliveryTrackingPage';
import { NotificationPage } from './components/figma/NotificationPage';
import { PaymentMethodsPage } from './components/figma/PaymentMethodsPage';

// --- Types and Mock Data ---
interface OutfitItem {
  id?: string;
  name?: string;
  imageUrl?: string;
  category?: string;
  color?: string;
  brand?: string;
  [key: string]: any; // 允許其他屬性
}

interface Outfit {
  id: number;
  imageUrl: string;
  styleName: string;
  description: string;
  items?: {
    top?: OutfitItem;           // 上衣/內層
    outerwear?: OutfitItem;     // 外套/外層 (預留)
    bottom?: OutfitItem;        // 下身
    shoes?: OutfitItem;         // 鞋子
    accessories?: OutfitItem;   // 配件 (預留)
  };
}

interface PaymentCard {
  id: string;
  last4: string;
  brand: string;
  isDefault?: boolean;
}

const outfits: Outfit[] = [
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

type PageType = 'home' | 'wardrobe' | 'explore' | 'store' | 'profile' | 'tryon' | 'checkout' | 'discount' | 'trending' | 'upload' | 'login' | 'broadcast' | 'calendar' | 'cpwranking' | 'delivery' | 'notification' | 'payment-methods';

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


export default function Page() {
  // --- State Management ---
  const [currentPage, setCurrentPage] = useState<PageType>('login');
  const [previousPage, setPreviousPage] = useState<PageType>('login');
  const [navigationDirection, setNavigationDirection] = useState<'forward' | 'back'>('forward');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [selectedDeliveryMerchant, setSelectedDeliveryMerchant] = useState<string>('');
  const [weatherData, setWeatherData] = useState<WeatherSummary | undefined>();
  const [dailyOutfits, setDailyOutfits] = useState<Outfit[]>([]);

  // Mock Data States
  const [savedOutfits, setSavedOutfits] = useState<Outfit[]>([]);
  const [savedCards, setSavedCards] = useState<PaymentCard[]>([]);
  const [savedOutfitSets, setSavedOutfitSets] = useState<any[]>([]); // Mock state
  const [tryOnBasketItems, setTryOnBasketItems] = useState<any[]>([]); // Mock state

  // --- Hooks ---
  useScrollMemory(currentPage);

  // 獲取真實天氣資料 (使用瀏覽器定位)
  useEffect(() => {
    const fetchWithCoords = async (latitude: number, longitude: number) => {
      try {
        const params = new URLSearchParams({
          userId: 'user-1760785862304',
          latitude: latitude.toString(),
          longitude: longitude.toString(),
          occasion: 'casual'
        });

        const response = await fetch(`/api/daily-outfits?${params}`);
        const data = await response.json();

        if (data.weather) {
          setWeatherData(data.weather);
        }

        if (data.outfits && Array.isArray(data.outfits) && data.outfits.length > 0) {
          const mapped: Outfit[] = data.outfits.map((outfit: any, index: number) => ({
            id: index + 1,
            imageUrl: outfit.top?.imageUrl || outfit.bottom?.imageUrl || outfit.shoes?.imageUrl || '',
            styleName: '每日推薦穿搭',
            description: [
              outfit.top?.name,
              outfit.bottom?.name,
              outfit.shoes?.name
            ].filter(Boolean).join(' ・ '),
            // 完整單品資料 (為未來 IG 風格 UI 與試穿功能預留)
            items: {
              top: outfit.top,
              bottom: outfit.bottom,
              shoes: outfit.shoes
              // outerwear 和 accessories 目前 API 沒給，先不填
            }
          }));
          setDailyOutfits(mapped);
          console.log('[Home] dailyOutfits from API:', mapped);
        }
      } catch (error) {
        console.error('[WeatherCard] Failed to fetch weather data:', error);
      }
    };

    const fetchWithDefaultLocation = () => {
      fetchWithCoords(25.033, 121.565);
    };

    // 優先使用瀏覽器定位
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWithCoords(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.warn('[WeatherCard] 定位失敗，使用預設座標:', error.message);
          fetchWithDefaultLocation();
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    } else {
      console.warn('[WeatherCard] 瀏覽器不支援定位');
      fetchWithDefaultLocation();
    }
  }, []);

  // --- Core Functions ---
  const navigateTo = (newPage: PageType) => {
    const currentLevel = pageHierarchy[currentPage];
    const newLevel = pageHierarchy[newPage];
    setNavigationDirection(newLevel >= currentLevel ? 'forward' : 'back');
    setPreviousPage(currentPage);
    setCurrentPage(newPage);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const handleCardClick = (outfit: Outfit) => {
    setSelectedOutfit(outfit);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedOutfit(null), 300);
  };

  const handleSaveOutfit = (outfit: Outfit) => {
    setSavedOutfits(prev => {
      const exists = prev.find(o => o.id === outfit.id);
      return exists ? prev.filter(o => o.id !== outfit.id) : [...prev, outfit];
    });
  };

  // --- Page Renderer ---
  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <>
            <motion.header
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
              className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm"
            >
              <div className="flex h-16 items-center justify-between px-5">
                <h1 className="text-2xl font-black italic tracking-tighter text-primary">VESTI</h1>
                <div className="flex items-center gap-2">
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigateTo('checkout')} className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted transition-colors">
                    <ShoppingCart className="h-6 w-6 text-foreground" strokeWidth={2} />
                    <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">3</div>
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigateTo('notification')} className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted transition-colors">
                    <Bell className="h-6 w-6 text-foreground" strokeWidth={2} />
                    <div className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
                  </motion.button>
                </div>
              </div>
            </motion.header>
            <AnimatePresence>
              {isRefreshing && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="mx-5 mt-2 rounded-lg bg-card p-3 text-center shadow-sm">
                  <p className="text-sm text-muted-foreground">正在為您準備今日穿搭...</p>
                </motion.div>
              )}
            </AnimatePresence>
            <WeatherCard weather={weatherData} />
            <QuickActions onNavigateToTryOn={() => navigateTo('tryon')} onNavigateToTrending={() => navigateTo('trending')} onNavigateToDiscount={() => navigateTo('discount')} onNavigateToCalendar={() => navigateTo('calendar')} />
            <div className="mb-3 px-5"><h2 className="text-foreground font-sans">今日穿搭推薦</h2></div>
            <div className="mb-16"><StackedCards outfits={dailyOutfits.length > 0 ? dailyOutfits : outfits} onCardClick={handleCardClick} onSaveOutfit={handleSaveOutfit} /></div>
            <WardrobeUtilization />
            <CPWRanking onNavigateToFullRanking={() => navigateTo('cpwranking')} />
            <EstimatedDelivery onNavigateToDelivery={(merchant) => { if (merchant) setSelectedDeliveryMerchant(merchant); navigateTo('delivery'); }} />
          </>
        );
      case 'wardrobe':
        return <WardrobePage onNavigateToUpload={(imageUrl) => { if (imageUrl) setUploadedImageUrl(imageUrl); navigateTo('upload'); }} onNavigateToTryOn={() => navigateTo('tryon')} onNavigateToBroadcast={() => navigateTo('broadcast')} savedOutfitsFromHome={savedOutfits} />;
      case 'explore':
        return <ExplorePage />;
      case 'store':
        return <StorePage onNavigateToTryOn={() => navigateTo('tryon')} onNavigateToCheckout={() => navigateTo('checkout')} onNavigateToDiscount={() => navigateTo('discount')} onNavigateToTrending={() => navigateTo('trending')} />;
      case 'profile':
        return <ProfilePage onNavigateToCheckout={() => navigateTo('checkout')} onNavigateToDelivery={(merchant) => { if (merchant) setSelectedDeliveryMerchant(merchant); navigateTo('delivery'); }} onNavigateToPaymentMethods={() => navigateTo('payment-methods')} onLogout={() => navigateTo('login')} />;
      case 'tryon':
        return <TryOnPage onBack={() => navigateTo(previousPage)} onNavigateToCheckout={() => navigateTo('checkout')} />;
      case 'checkout':
        return <CheckoutPage onBack={() => navigateTo(previousPage)} />;
      case 'discount':
        return <DiscountPage onBack={() => navigateTo(previousPage)} onNavigateToTryOn={() => navigateTo('tryon')} />;
      case 'trending':
        return <TrendingPage onBack={() => navigateTo(previousPage)} onNavigateToTryOn={() => navigateTo('tryon')} />;
      case 'upload':
        return <UploadClothingPage onBack={() => navigateTo(previousPage)} initialImageUrl={uploadedImageUrl} />;
      case 'login':
        return <LoginPage onLogin={() => navigateTo('home')} onBack={() => navigateTo(previousPage)} />;
      case 'broadcast':
        return <BroadcastPage onBack={() => navigateTo(previousPage)} />;
      case 'calendar':
        return <CalendarPage onBack={() => navigateTo(previousPage)} />;
      case 'cpwranking':
        return <CPWRankingFullPage onBack={() => navigateTo(previousPage)} />;
      case 'delivery':
        return <DeliveryTrackingPage onBack={() => navigateTo(previousPage)} initialMerchant={selectedDeliveryMerchant} />;
      case 'notification':
        return <NotificationPage onBack={() => navigateTo(previousPage)} />;
      case 'payment-methods':
        return <PaymentMethodsPage onBack={() => navigateTo(previousPage)} savedCards={savedCards} onCardsUpdate={setSavedCards} />;
      default:
        return null;
    }
  };

  // --- Main JSX Structure ---
  return (
    <ErrorBoundary onReset={() => navigateTo('home')}>
      <div className={`min-h-screen bg-background ${currentPage === 'login' ? '' : 'pb-28'}`}>
        <Toaster position="top-center" />
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ x: navigationDirection === 'forward' ? 30 : -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: navigationDirection === 'forward' ? -30 : 30, opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 35, opacity: { duration: 0.2 } }}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
        <OutfitDetailModal outfit={selectedOutfit} isOpen={isModalOpen} onClose={handleCloseModal} />
        {currentPage !== 'login' && (
          <BottomNav currentPage={currentPage} onPageChange={navigateTo} />
        )}
      </div>
    </ErrorBoundary>
  );
}