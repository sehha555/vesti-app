'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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

interface LayoutSlot {
  slotKey: string;
  item: OutfitItem;
  priority: number;
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
  layoutSlots?: LayoutSlot[];   // 白板結構：人體結構分槽
}

interface PaymentCard {
  id: string;
  last4: string;
  brand: string;
  isDefault?: boolean;
}

// 首頁下半部（衣櫃利用率、CPW 排行、預計配送）與購物車/通知角標仍是電商規劃的假資料，先隱藏
const SHOW_COMMERCE_MOCKS = false;

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
  const [currentPage, setCurrentPage] = useState<PageType | null>(null); // null = loading
  const [previousPage, setPreviousPage] = useState<PageType>('login');
  const [navigationDirection, setNavigationDirection] = useState<'forward' | 'back'>('forward');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [selectedDeliveryMerchant, setSelectedDeliveryMerchant] = useState<string>('');
  const [weatherData, setWeatherData] = useState<WeatherSummary | undefined>();
  const [dailyOutfits, setDailyOutfits] = useState<Outfit[]>([]);
  // 推薦要等 AI 5-10 秒；empty = 衣櫃不到 3 件，AI 沒得挑
  const [outfitsStatus, setOutfitsStatus] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  // 使用者自己寫的今天情境（不用固定標籤）；occasionDraft 是輸入中的字，按「換」才送出
  const [occasion, setOccasion] = useState('');
  const [occasionDraft, setOccasionDraft] = useState('');

  // Mock Data States
  const [savedOutfits, setSavedOutfits] = useState<Outfit[]>([]);
  const [savedCards, setSavedCards] = useState<PaymentCard[]>([]);
  const [savedOutfitSets, setSavedOutfitSets] = useState<any[]>([]); // Mock state
  const [tryOnBasketItems, setTryOnBasketItems] = useState<any[]>([]); // Mock state

  // --- Hooks ---
  useScrollMemory(currentPage || 'home');

  // Check auth session on mount to determine initial page
  useEffect(() => {
    const checkAuthSession = () => {
      try {
        // Check for sb-auth-status cookie (client-readable marker set by OAuth callback)
        // Note: sb-auth-token is httpOnly and cannot be read by JavaScript
        const hasAuthStatus = document.cookie.includes('sb-auth-status=authenticated');

        if (hasAuthStatus) {
          console.log('[Page] Auth status cookie found, showing home');
          setCurrentPage('home');
        } else {
          console.log('[Page] No auth status cookie, showing login');
          setCurrentPage('login');
        }
      } catch (error) {
        console.error('[Page] Auth check failed:', error);
        setCurrentPage('login');
      }
    };

    checkAuthSession();
  }, []);

  // 輔助函數：將單品資料映射到白板槽位
  const createLayoutSlots = (items: any): LayoutSlot[] => {
    const slots: LayoutSlot[] = [];
    let priority = 1;

    // 槽位定義：slotKey → items字段 的映射
    const slotMappings = [
      { slotKey: 'top_inner', itemKey: 'top', priority: 1 },
      { slotKey: 'top_outer', itemKey: 'outerwear', priority: 2 },
      { slotKey: 'bottom', itemKey: 'bottom', priority: 3 },
      { slotKey: 'shoes', itemKey: 'shoes', priority: 4 },
      { slotKey: 'accessory', itemKey: 'accessories', priority: 5 }
    ];

    slotMappings.forEach(mapping => {
      if (items[mapping.itemKey]) {
        slots.push({
          slotKey: mapping.slotKey,
          item: items[mapping.itemKey],
          priority: mapping.priority
        });
      }
    });

    return slots;
  };

  // 定位只做一次，拿到座標才開始拿推薦
  useEffect(() => {
    // 定位只用一次：成功、失敗、或自己的 5 秒保險，誰先到用誰。
    // 瀏覽器在等使用者按「允許」時不會開始算 timeout，沒有保險會永遠卡在載入中
    let located = false;
    const locateOnce = (latitude: number, longitude: number) => {
      if (located) return;
      located = true;
      setCoords({ latitude, longitude });
    };
    const fallbackToDefault = () => locateOnce(25.033, 121.565);

    if ('geolocation' in navigator) {
      const fallback = setTimeout(() => {
        console.warn('[WeatherCard] 定位 5 秒沒回應，使用預設座標');
        fallbackToDefault();
      }, 5000);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(fallback);
          locateOnce(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          clearTimeout(fallback);
          console.warn('[WeatherCard] 定位失敗，使用預設座標:', error.message);
          fallbackToDefault();
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000
        }
      );
      return () => clearTimeout(fallback);
    } else {
      console.warn('[WeatherCard] 瀏覽器不支援定位');
      fallbackToDefault();
    }
  }, []);

  // 座標或使用者寫的情境變了就重拿推薦；同一天同一句話，後端直接讀存好的
  useEffect(() => {
    if (!coords) return;
    let cancelled = false;
    const fetchWithCoords = async (latitude: number, longitude: number) => {
      try {
        const params = new URLSearchParams({
          latitude: latitude.toString(),
          longitude: longitude.toString(),
          occasion
        });

        const response = await fetch(`/api/daily-outfits?${params}`);
        if (!response.ok) throw new Error(`daily-outfits ${response.status}`);
        const data = await response.json();
        if (cancelled) return;

        if (data.weather) {
          setWeatherData(data.weather);
        }

        if (data.outfits && Array.isArray(data.outfits) && data.outfits.length > 0) {
          const mapped: Outfit[] = data.outfits.map((outfit: any, index: number) => {
            const items = {
              top: outfit.top,
              bottom: outfit.bottom,
              shoes: outfit.shoes,
              outerwear: outfit.outerwear,
              accessories: outfit.accessories
            };

            // Prefer layoutSlots from API (for mock data verification), otherwise generate locally
            const layoutSlots = (outfit.layoutSlots && outfit.layoutSlots.length > 0)
              ? outfit.layoutSlots
              : createLayoutSlots(items);

            // 檢查 layoutSlots 是否建立成功，用於排查白板顯示問題
            console.log('layoutSlots for outfit', index + 1, layoutSlots);

            return {
              id: index + 1,
              // Gemini 版 API 直接給 imageUrl / styleName / description；舊格式才從單品組
              imageUrl: outfit.imageUrl || outfit.top?.imageUrl || outfit.bottom?.imageUrl || outfit.shoes?.imageUrl || '',
              styleName: outfit.styleName || '每日推薦穿搭',
              description: outfit.description || [
                outfit.top?.name,
                outfit.bottom?.name,
                outfit.shoes?.name
              ].filter(Boolean).join(' ・ '),
              // 完整單品資料 (為未來 IG 風格 UI 與試穿功能預留)
              items: items,
              // 白板結構：依人體結構分槽
              layoutSlots: layoutSlots,
              // 保留原始 ID 以便追蹤
              originalId: outfit.id
            };
          });
          setDailyOutfits(mapped);
          setOutfitsStatus('ready');
          console.log('[Home] dailyOutfits from API:', mapped);
        } else {
          setOutfitsStatus('empty');
        }
      } catch (error) {
        if (cancelled) return;
        console.error('[WeatherCard] Failed to fetch weather data:', error);
        setOutfitsStatus('error');
      }
    };

    setOutfitsStatus('loading');
    fetchWithCoords(coords.latitude, coords.longitude);
    return () => { cancelled = true; };
  }, [coords, occasion]);

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
              data-testid="page-header"
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
                    {SHOW_COMMERCE_MOCKS && <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">3</div>}
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigateTo('notification')} className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted transition-colors">
                    <Bell className="h-6 w-6 text-foreground" strokeWidth={2} />
                    {SHOW_COMMERCE_MOCKS && <div className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />}
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
            <form
              onSubmit={(e) => { e.preventDefault(); setOccasion(occasionDraft.trim()); }}
              className="mb-4 flex gap-2 px-5"
            >
              <input
                value={occasionDraft}
                onChange={(e) => setOccasionDraft(e.target.value)}
                maxLength={100}
                placeholder="今天要去哪、想怎麼穿？（可以不填）"
                className="min-w-0 flex-1 rounded-full bg-gray-100 px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <button
                type="submit"
                disabled={outfitsStatus === 'loading' || occasionDraft.trim() === occasion}
                className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-40"
              >
                換
              </button>
            </form>
            <div className="mb-16">
              {outfitsStatus === 'ready' ? (
                <StackedCards outfits={dailyOutfits} onCardClick={handleCardClick} onSaveOutfit={handleSaveOutfit} occasion={occasion} />
              ) : (
                <div className="px-4">
                  <div className={`mx-auto flex h-[400px] max-w-[300px] flex-col items-center justify-center gap-2 rounded-3xl bg-gray-100 px-6 text-center ${outfitsStatus === 'loading' ? 'animate-pulse' : ''}`}>
                    <p className="text-sm text-muted-foreground">
                      {outfitsStatus === 'loading' && 'AI 正在從你的衣櫃挑今天的穿搭…'}
                      {outfitsStatus === 'empty' && '衣櫃至少要有 3 件衣服，AI 才能幫你搭配'}
                      {outfitsStatus === 'error' && '推薦暫時載入失敗，請稍後重新整理'}
                    </p>
                    {outfitsStatus === 'empty' && (
                      <button onClick={() => navigateTo('wardrobe')} className="mt-2 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground">去衣櫃新增</button>
                    )}
                  </div>
                </div>
              )}
            </div>
            {SHOW_COMMERCE_MOCKS && (
              <>
                <WardrobeUtilization />
                <CPWRanking onNavigateToFullRanking={() => navigateTo('cpwranking')} />
                <EstimatedDelivery onNavigateToDelivery={(merchant) => { if (merchant) setSelectedDeliveryMerchant(merchant); navigateTo('delivery'); }} />
              </>
            )}
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
  // Show loading while checking auth
  if (currentPage === null) {
    return (
      <div data-testid="loading-screen" className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground text-sm">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="error-boundary">
      <ErrorBoundary onReset={() => navigateTo('home')}>
        <div className={`min-h-screen bg-background ${currentPage === 'login' ? '' : 'pb-28'}`}>
        <Toaster position="top-center" />
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={currentPage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
        <OutfitDetailModal outfit={selectedOutfit} isOpen={isModalOpen} onClose={handleCloseModal} occasion={occasion} />
      </div>
      {/* BottomNav 獨立於動畫容器，避免頁面切換時閃爍 */}
      {currentPage !== null && currentPage !== 'login' && (
        <BottomNav currentPage={currentPage} onPageChange={navigateTo} />
      )}
      </ErrorBoundary>
    </div>
  );
}