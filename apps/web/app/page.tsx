'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Bell } from 'lucide-react';
import type { WeatherSummary } from '@/packages/types/src/weather';

// --- Import all required components from './components/figma/*' ---
import { LoginPage } from './components/figma/LoginPage';
import { WeatherCard } from './components/figma/WeatherCard';
import { QuickActions } from './components/figma/QuickActions';
import { StackedCards } from './components/figma/StackedCards';
import { WardrobeUtilization } from './components/figma/WardrobeUtilization';
import { CPWRanking } from './components/figma/CPWRanking';
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
import { DiscountPage } from './components/figma/DiscountPage';
import { TrendingPage } from './components/figma/TrendingPage';
import { UploadClothingPage } from './components/figma/UploadClothingPage';
import { BroadcastPage } from './components/figma/BroadcastPage';
import { CalendarPage } from './components/figma/CalendarPage';
import { CPWRankingFullPage } from './components/figma/CPWRankingFullPage';
import { NotificationPage } from './components/figma/NotificationPage';
import { outfitKeyFromSlots } from '../lib/outfits/key';

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

// 伺服器上的收藏（/api/saved-outfits），savedId 用來取消收藏
interface SavedOutfit extends Outfit {
  savedId: string;
  key: string;
}

interface SavedOutfitRow {
  id: string;
  outfit_data: {
    imageUrl: string;
    styleName: string;
    description?: string;
    layoutSlots?: LayoutSlot[];
  };
}

// 衣櫃頁以數字 id 當 key：每筆收藏轉換時配一個不會重複、之後也不變的 id（跟推薦卡片的 1、2、3 分開）
let nextSavedCardId = 100000;

function toSavedOutfit(row: SavedOutfitRow): SavedOutfit | null {
  const key = outfitKeyFromSlots(row.outfit_data?.layoutSlots);
  if (!key) return null;
  return {
    id: nextSavedCardId++,
    imageUrl: row.outfit_data.imageUrl,
    styleName: row.outfit_data.styleName,
    description: row.outfit_data.description ?? '',
    layoutSlots: row.outfit_data.layoutSlots,
    savedId: row.id,
    key,
  };
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

type PageType = 'home' | 'wardrobe' | 'explore' | 'store' | 'profile' | 'tryon' | 'discount' | 'trending' | 'upload' | 'login' | 'broadcast' | 'calendar' | 'cpwranking' | 'notification';

const pageHierarchy: Record<PageType, number> = {
  'login': 0,
  'home': 1,
  'wardrobe': 1,
  'explore': 1,
  'store': 1,
  'profile': 1,
  'tryon': 2,
  'discount': 2,
  'trending': 2,
  'upload': 2,
  'broadcast': 2,
  'calendar': 2,
  'cpwranking': 2,
  'notification': 2,
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
  const [weatherData, setWeatherData] = useState<WeatherSummary | undefined>();
  const [dailyOutfits, setDailyOutfits] = useState<Outfit[]>([]);

  // Mock Data States
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>([]);
  const savedKeys = useMemo(() => new Set(savedOutfits.map((o) => o.key)), [savedOutfits]);

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

  // 獲取真實天氣資料 (使用瀏覽器定位)
  useEffect(() => {
    const fetchWithCoords = async (latitude: number, longitude: number) => {
      try {
        const params = new URLSearchParams({
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

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
    } catch (error) {
      console.error('[Page] Sign out request failed:', error);
    }
    navigateTo('login');
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

  // 登入後從伺服器載入收藏（首頁愛心狀態 + 衣櫃頁「收藏」都用這份）
  const isLoggedIn = currentPage !== null && currentPage !== 'login';
  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/saved-outfits?limit=100');
        if (!res.ok) return;
        const body = await res.json();
        const rows: SavedOutfitRow[] = body.outfits ?? [];
        const list = rows.map(toSavedOutfit).filter((o): o is SavedOutfit => o !== null);
        if (!cancelled) setSavedOutfits(list);
      } catch (error) {
        console.error('[Page] 載入收藏失敗:', error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  const handleToggleSave = async (outfit: Outfit): Promise<'saved' | 'removed'> => {
    const key = outfitKeyFromSlots(outfit.layoutSlots);
    if (!key) throw new Error('範例穿搭無法收藏');

    const existing = savedOutfits.find((o) => o.key === key);
    if (existing) {
      const res = await fetch(`/api/saved-outfits?id=${existing.savedId}`, { method: 'DELETE' });
      // 404 代表伺服器上已經沒有了，一樣從畫面移除
      if (!res.ok && res.status !== 404) throw new Error(`取消收藏失敗 (${res.status})`);
      setSavedOutfits((prev) => prev.filter((o) => o.key !== key));
      return 'removed';
    }

    const res = await fetch('/api/saved-outfits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        outfitData: {
          imageUrl: outfit.imageUrl,
          styleName: outfit.styleName,
          description: outfit.description,
          layoutSlots: outfit.layoutSlots,
        },
        occasion: 'casual',
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.savedOutfit?.id) throw new Error(body.error || `收藏失敗 (${res.status})`);

    setSavedOutfits((prev) => {
      const saved = toSavedOutfit(body.savedOutfit);
      if (!saved || prev.some((o) => o.key === key)) return prev;
      // 新收藏放最前面
      return [saved, ...prev];
    });
    return 'saved';
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
            <div className="mb-16"><StackedCards outfits={dailyOutfits.length > 0 ? dailyOutfits : outfits} onCardClick={handleCardClick} savedKeys={savedKeys} onToggleSave={handleToggleSave} /></div>
            <WardrobeUtilization />
            <CPWRanking onNavigateToFullRanking={() => navigateTo('cpwranking')} />
          </>
        );
      case 'wardrobe':
        return <WardrobePage onNavigateToUpload={(imageUrl) => { if (imageUrl) setUploadedImageUrl(imageUrl); navigateTo('upload'); }} onNavigateToTryOn={() => navigateTo('tryon')} onNavigateToBroadcast={() => navigateTo('broadcast')} savedOutfitsFromHome={savedOutfits} />;
      case 'explore':
        return <ExplorePage />;
      case 'store':
        return <StorePage onNavigateToTryOn={() => navigateTo('tryon')} onNavigateToDiscount={() => navigateTo('discount')} onNavigateToTrending={() => navigateTo('trending')} />;
      case 'profile':
        return <ProfilePage onLogout={handleLogout} />;
      case 'tryon':
        return <TryOnPage onBack={() => navigateTo(previousPage)} />;
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
      case 'notification':
        return <NotificationPage onBack={() => navigateTo(previousPage)} />;
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
        <OutfitDetailModal outfit={selectedOutfit} isOpen={isModalOpen} onClose={handleCloseModal} />
      </div>
      {/* BottomNav 獨立於動畫容器，避免頁面切換時閃爍 */}
      {currentPage !== null && currentPage !== 'login' && (
        <BottomNav currentPage={currentPage} onPageChange={navigateTo} />
      )}
      </ErrorBoundary>
    </div>
  );
}