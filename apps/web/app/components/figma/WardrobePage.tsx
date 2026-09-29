import { useState, useRef, useEffect, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { DroppableClothingRow } from './DroppableClothingRow';
import { CreateCategoryDialog } from './CreateCategoryDialog';
import { ClothingDetailModal } from './ClothingDetailModal';
import { UploadOptionsDialog } from './UploadOptionsDialog';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { OutfitDetailView } from './OutfitDetailView';
import { FloatingBasket } from './FloatingBasket';
import { toast } from 'sonner';
import { Plus, Sparkles, Bell, Radio, Calendar, Search, Heart, X, ShoppingBag, Upload } from 'lucide-react';
import { useDebounce } from './hooks/useDebounce';
import { EmptyState } from './EmptyState';

interface ClothingItem {
  id: number;
  dbId: string; // closet_items.id；子元件沿用數字 id，打 API 用這個
  imageUrl: string;
  name: string;
  category: string;
  brand?: string;
  source: 'app-purchase' | 'user-upload';
  isPurchased?: boolean;
  price?: number;
  material?: string;
  size?: string;
  wearCount?: number;
  uploadDate?: string;
  lastWornDate?: string;
  tags?: string[];
}

interface Layer {
  id: string;
  name: string;
  items: ClothingItem[];
}

interface ClosetItemRow {
  id: string;
  name: string;
  category: string;
  brand: string | null;
  size: string | null;
  tags: string[] | null;
  image_url: string | null;
  created_at: string;
}

// 預設值常數 - 確保參考穩定性
const EMPTY_OUTFITS: any[] = [];
const EMPTY_OUTFIT_SETS: any[] = [];

// 衣櫃層固定對應 closet_items.category，不開放自訂
const CATEGORY_LAYERS = [
  { id: 'top', name: '上身' },
  { id: 'outerwear', name: '外套' },
  { id: 'bottom', name: '下身' },
  { id: 'shoes', name: '鞋子' },
  { id: 'accessory', name: '配件' },
  { id: 'uncategorized', name: '未分類' },
];

function toLayers(rows: ClosetItemRow[]): Layer[] {
  const layers: Layer[] = CATEGORY_LAYERS.map((c) => ({ ...c, items: [] }));
  rows.forEach((row, index) => {
    const layer = layers.find((l) => l.id === row.category) ?? layers[layers.length - 1];
    layer.items.push({
      id: index + 1,
      dbId: row.id,
      imageUrl: row.image_url ?? '',
      name: row.name,
      category: layer.name,
      brand: row.brand ?? undefined,
      size: row.size ?? undefined,
      tags: row.tags ?? undefined,
      source: 'user-upload',
      uploadDate: row.created_at.slice(0, 10),
    });
  });
  // 未分類沒東西就不顯示
  return layers.filter((l) => l.id !== 'uncategorized' || l.items.length > 0);
}

// Mock outfit data for the outfits view
interface SavedOutfit {
  id: number;
  name: string;
  date: string;
  imageUrl: string;
}

const mockSavedOutfits: SavedOutfit[] = [
  {
    id: 1,
    name: 'Casual Comfort',
    date: '2025/12/10',
    imageUrl: 'https://images.unsplash.com/photo-1762343287340-8aa94082e98b?w=400',
  },
  {
    id: 2,
    name: 'Summer Breeze',
    date: '2025/12/10',
    imageUrl: 'https://images.unsplash.com/photo-1704775990327-90f7c43436fc?w=400',
  },
  {
    id: 3,
    name: 'Urban Style',
    date: '2025/12/09',
    imageUrl: 'https://images.unsplash.com/photo-1762114468792-ced36e281323?w=400',
  },
  {
    id: 4,
    name: 'Weekend Vibes',
    date: '2025/12/08',
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400',
  },
];

type ViewMode = 'items' | 'outfits';

interface WardrobePageProps {
  onNavigateToUpload?: (imageUrl?: string) => void;
  onNavigateToTryOn?: (items?: ClothingItem[]) => void;
  onNavigateToBroadcast?: () => void;
  savedOutfitsFromHome?: any[]; // 從首頁收藏的穿搭
  savedOutfitSetsFromTryOn?: any[]; // 從試穿頁儲存的整套搭配
}

export function WardrobePage({ onNavigateToUpload, onNavigateToTryOn, onNavigateToBroadcast, savedOutfitsFromHome = EMPTY_OUTFITS, savedOutfitSetsFromTryOn = EMPTY_OUTFIT_SETS }: WardrobePageProps = {} as WardrobePageProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('items');
  const [layers, setLayers] = useState<Layer[]>([]);
  const [loadState, setLoadState] = useState<'loading' | 'unauthorized' | 'error' | 'ready'>('loading');
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedOutfit, setSelectedOutfit] = useState<any | null>(null);
  const [isOutfitDetailOpen, setIsOutfitDetailOpen] = useState(false);
  
  // 新增：用於相簿上傳的檔案選擇器
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  // 整套搭配視圖的狀態
  const [selectedFilter, setSelectedFilter] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  
  // 合併本地搭配和從首頁收藏的穿搭
  const [outfits, setOutfits] = useState(() => {
    // 本地創建的搭配
    const localOutfits = mockSavedOutfits.map(outfit => ({
      ...outfit,
      occasion: '日常',
      itemCount: 3,
      isFavorite: false,
      tags: ['休閒', '日常'],
      source: 'local' as const,
    }));
    
    // 從首頁收藏的穿搭
    const savedOutfits = savedOutfitsFromHome.map((outfit, index) => ({
      id: outfit.id + 1000, // 避免 ID 衝突
      name: outfit.styleName,
      date: new Date().toISOString().split('T')[0].replace(/-/g, '/'),
      imageUrl: outfit.imageUrl,
      occasion: '收藏',
      itemCount: 3,
      isFavorite: true,
      tags: ['AI推薦', '收藏'],
      source: 'saved' as const,
    }));
    
    return [...savedOutfits, ...localOutfits];
  });
  
  // 監聽 savedOutfitsFromHome 的變化並更新
  useEffect(() => {
    setOutfits(prev => {
      // 保留本地搭配
      const localOutfits = prev.filter(o => o.source === 'local');
      // 保留試穿搭配
      const tryOnOutfits = prev.filter(o => o.source === 'tryon');
      
      // 添加新的收藏穿搭
      const savedOutfits = savedOutfitsFromHome.map((outfit) => ({
        id: outfit.id + 1000,
        name: outfit.styleName,
        date: new Date().toISOString().split('T')[0].replace(/-/g, '/'),
        imageUrl: outfit.imageUrl,
        occasion: '收藏',
        itemCount: 3,
        isFavorite: true,
        tags: ['AI推薦', '收藏'],
        source: 'saved' as const,
      }));
      
      return [...savedOutfits, ...tryOnOutfits, ...localOutfits];
    });
  }, [savedOutfitsFromHome]);

  // 監聽 savedOutfitSetsFromTryOn 的變化並更新
  useEffect(() => {
    setOutfits(prev => {
      // 保留本地搭配和收藏穿搭
      const localOutfits = prev.filter(o => o.source === 'local');
      const savedOutfits = prev.filter(o => o.source === 'saved');
      
      // 添加新的試穿搭配
      const tryOnOutfits = savedOutfitSetsFromTryOn.map((outfitSet) => ({
        id: outfitSet.id,
        name: outfitSet.name,
        date: new Date(outfitSet.date).toISOString().split('T')[0].replace(/-/g, '/'),
        imageUrl: outfitSet.imageUrl,
        occasion: outfitSet.occasion,
        itemCount: outfitSet.totalItems,
        isFavorite: false,
        tags: outfitSet.tags,
        source: 'tryon' as const,
        layers: outfitSet.layers, // 保存分層信息
      }));
      
      return [...savedOutfits, ...tryOnOutfits, ...localOutfits];
    });
  }, [savedOutfitSetsFromTryOn]);

  // 自定義分類功能
  const [customCategories, setCustomCategories] = useState<string[]>(['日常', '約會', '運動']);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [longPressCategory, setLongPressCategory] = useState<string | null>(null); // 長按顯示刪除按鈕
  
  // 長按卡片顯示刪除功能
  const [longPressOutfit, setLongPressOutfit] = useState<number | null>(null); // 長按顯示刪除按鈕的卡片 ID
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // 拖曳功能狀態
  const [draggableOutfit, setDraggableOutfit] = useState<number | null>(null); // 可拖曳的卡片 ID

  // 浮動籃子狀態 - 存放待試穿的衣物
  const [basketItems, setBasketItems] = useState<ClothingItem[]>([]);

  // 滾動隱藏功能
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastControlsStateRef = useRef(true);
  const lastToggleTimeRef = useRef(0); // 冷卻計時器

  // 搜尋防抖 (移到 useEffect 之前以避免初始化順序錯誤)
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // 篩選搭配 (移到 useEffect 之前以避免初始化順序錯誤)
  const filteredOutfits = outfits.filter(outfit => {
    const matchesFilter = selectedFilter === '全部' || outfit.occasion === selectedFilter;
    const matchesSearch =
      debouncedSearchQuery === '' ||
      outfit.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      outfit.occasion.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      outfit.tags.some(tag => tag.toLowerCase().includes(debouncedSearchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  // 滾動監聽 - 只在單品衣櫃模式啟用 collapsing header
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // 整套搭配模式: 強制顯示 header，不監聽滾動
    if (viewMode === 'outfits') {
      setIsControlsVisible(true);
      lastControlsStateRef.current = true;
      return;
    }

    const SCROLL_THRESHOLD = 15; // 滾動死區 (px)
    const HIDE_OFFSET = 80; // 開始隱藏的滾動位置 (px)
    const TOP_ZONE = 20; // 回到頂部區域 (px)
    const BOTTOM_ZONE = 30; // 底部保護區域 (px)
    const COOLDOWN_MS = 300; // 狀態切換冷卻時間 (ms)

    const handleScroll = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        const now = Date.now();
        const currentScrollY = container.scrollTop;
        const delta = currentScrollY - lastScrollYRef.current;
        const maxScroll = container.scrollHeight - container.clientHeight;

        // 冷卻期間內忽略滾動事件
        if (now - lastToggleTimeRef.current < COOLDOWN_MS) {
          lastScrollYRef.current = currentScrollY;
          return;
        }

        // 回到頂部區域 → 強制顯示
        if (currentScrollY < TOP_ZONE) {
          if (!lastControlsStateRef.current) {
            setIsControlsVisible(true);
            lastControlsStateRef.current = true;
            lastToggleTimeRef.current = now;
          }
          lastScrollYRef.current = currentScrollY;
          return;
        }

        // 底部保護區域 → 忽略滾動事件，避免彈跳抖動
        if (currentScrollY >= maxScroll - BOTTOM_ZONE) {
          lastScrollYRef.current = currentScrollY;
          return;
        }

        // 超過死區才處理方向判斷
        if (Math.abs(delta) >= SCROLL_THRESHOLD) {
          // 向下滾動且超過 HIDE_OFFSET → 隱藏
          if (delta > 0 && currentScrollY > HIDE_OFFSET) {
            if (lastControlsStateRef.current) {
              setIsControlsVisible(false);
              lastControlsStateRef.current = false;
              lastToggleTimeRef.current = now;
            }
          }
          // 向上滾動 → 顯示
          else if (delta < 0) {
            if (!lastControlsStateRef.current) {
              setIsControlsVisible(true);
              lastControlsStateRef.current = true;
              lastToggleTimeRef.current = now;
            }
          }
          lastScrollYRef.current = currentScrollY;
        }
      });
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [viewMode]); // viewMode 變化時重新綁定

  // 內容高度檢查 - 當內容不足以滾動時，強制顯示 Header
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const checkContentHeight = () => {
      // 如果內容高度 <= 視窗高度 (無法滾動)，強制顯示 Header
      if (container.scrollHeight <= container.clientHeight + 10) {
        if (!lastControlsStateRef.current) {
          setIsControlsVisible(true);
          lastControlsStateRef.current = true;
        }
      }
    };

    // 初始檢查
    checkContentHeight();

    // 監聽視窗大小變化
    window.addEventListener('resize', checkContentHeight);

    // 使用 ResizeObserver 監聽內容變化
    const resizeObserver = new ResizeObserver(checkContentHeight);
    resizeObserver.observe(container);

    return () => {
      window.removeEventListener('resize', checkContentHeight);
      resizeObserver.disconnect();
    };
  }, [viewMode, filteredOutfits.length, layers.length]);

  const handleLike = (id: number) => {
    toast.success('已加入最愛 ️');
  };

  const handleItemClick = (id: number) => {
    // 從所有層中找到對應的衣物
    for (const layer of layers) {
      const item = layer.items.find(i => i.id === id);
      if (item) {
        setSelectedItem(item);
        setIsDetailModalOpen(true);
        break;
      }
    }
  };

  const loadItems = useCallback(async () => {
    try {
      const res = await fetch('/api/closet-items');
      if (res.status === 401) {
        setLoadState('unauthorized');
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      setLayers(toLayers(body.data ?? []));
      setLoadState('ready');
    } catch {
      setLoadState('error');
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const findItem = (id: number) => {
    for (const layer of layers) {
      const item = layer.items.find(i => i.id === id);
      if (item) return item;
    }
    return undefined;
  };

  const handleDeleteItem = async (id: number) => {
    const item = findItem(id);
    if (!item) return;
    const res = await fetch(`/api/closet-items/${item.dbId}`, { method: 'DELETE' });
    if (!res.ok) {
      toast.error('刪除失敗，請稍後再試');
      return;
    }
    setLayers(prev =>
      prev.map(layer => ({
        ...layer,
        items: layer.items.filter(i => i.id !== id),
      }))
    );
    toast('已移除衣物');
  };

  // 拖到別層 = 改 category；存檔成功後重新載入，失敗就維持原樣
  const handleDrop = async (dragged: ClothingItem & { sourceLayerId: string }, targetLayerId: string) => {
    const item = findItem(dragged.id);
    if (!item) return;
    const res = await fetch(`/api/closet-items/${item.dbId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: targetLayerId }),
    });
    if (!res.ok) {
      toast.error('移動失敗，請稍後再試');
      return;
    }
    await loadItems();
    toast.success('已移動衣物');
  };

  const handleImportUrl = async (input: { url: string; name?: string; category?: string }) => {
    const res = await fetch('/api/closet-items/from-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return body.error ?? '匯入失敗';
    await loadItems();
    toast.success(`已加入：${body.data?.name ?? '商品'}`);
    setIsUploadDialogOpen(false);
    return null;
  };

  const handleEditItem = () => {
    toast('編輯功能開發中...');
    setIsDetailModalOpen(false);
  };

  const handleCreateOutfit = () => {
    toast.success('已加入穿搭組合 ');
    setIsDetailModalOpen(false);
  };

  const handleShareItem = () => {
    toast.success('已複製分享連結 ');
    setIsDetailModalOpen(false);
  };

  const handleUploadClick = () => {
    setIsUploadDialogOpen(true);
  };

  const handleCameraUpload = () => {
    setIsUploadDialogOpen(false);
    // 直接觸發相機拍照（移動端會開啟相機，桌面端會開啟檔案選擇）
    cameraInputRef.current?.click();
  };

  const handleGalleryUpload = () => {
    setIsUploadDialogOpen(false);
    // 直接觸發相簿選擇
    galleryInputRef.current?.click();
  };
  
  // 處理檔案選擇後的上傳
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 創建圖片預覽 URL
      const imageUrl = URL.createObjectURL(file);
      toast.success('照片已選擇 ');
      // 延遲一下再跳轉，讓使用者看到成功提示
      setTimeout(() => {
        onNavigateToUpload?.(imageUrl);
      }, 300);
    }
  };
  
  // 處理搭配篩選
  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
  };
  
  // 處理自定義分類
  const handleCreateCategory = (categoryName: string) => {
    if (customCategories.includes(categoryName)) {
      toast.error('分類名稱已存在');
      return;
    }
    setCustomCategories(prev => [...prev, categoryName]);
    toast.success('已創建新分類');
  };
  
  const handleDeleteCategory = (categoryName: string) => {
    // 檢查是否有搭配使用此分類
    const hasOutfits = outfits.some(outfit => outfit.occasion === categoryName);
    if (hasOutfits) {
      toast.error('請先移除使用此分類的搭配');
      return;
    }
    setCustomCategories(prev => prev.filter(cat => cat !== categoryName));
    // 如果當前選中的是被刪除的分類，切換到「全部」
    if (selectedFilter === categoryName) {
      setSelectedFilter('全部');
    }
    toast('已刪除分類');
  };

  const handleToggleFavorite = (id: number) => {
    setOutfits(prev =>
      prev.map(outfit =>
        outfit.id === id
          ? { ...outfit, isFavorite: !outfit.isFavorite }
          : outfit
      )
    );
    const outfit = outfits.find(o => o.id === id);
    if (outfit) {
      if (!outfit.isFavorite) {
        toast.success('已加入收藏 ️');
      } else {
        toast('已取消收藏');
      }
    }
  };
  
  // 處理刪除穿搭
  const handleDeleteOutfit = (id: number) => {
    setOutfits(prev => prev.filter(outfit => outfit.id !== id));
    setLongPressOutfit(null);
    setDraggableOutfit(null); // 同時清除拖曳狀態
    toast('已刪除穿搭');
  };
  
  // 處理長按開始 - 顯示刪除按鈕並啟用拖曳
  const handleLongPressStart = (id: number) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }

    // 長按 800ms 顯示刪除按鈕並啟用拖曳
    longPressTimerRef.current = setTimeout(() => {
      setLongPressOutfit(id);
      setDraggableOutfit(id); // 啟用拖曳
      toast('長按拖曳排序，點擊 X 刪除', { duration: 1500 });
    }, 800);
  };
  
  // 處理長按結束
  const handleLongPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  };
  
  // 處理拖曳開始
  const handleDragStart = (id: number) => {
    setDraggableOutfit(id);
  };
  
  // 處理拖曳結束 - 自動關閉拖曳模式和刪除按鈕
  const handleDragEnd = () => {
    setTimeout(() => {
      setDraggableOutfit(null);
      setLongPressOutfit(null);
    }, 300);
  };
  
  // 處理穿搭順序更新
  const handleReorderOutfits = (newOrder: any[]) => {
    setOutfits(newOrder);
  };

  const handleOutfitCardClick = (outfit: any) => {
    // 為每個搭配準備單品數據
    const outfitWithItems = {
      ...outfit,
      items: [
        {
          id: 1,
          imageUrl: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=400',
          name: '白色 T-shirt',
          category: '上衣',
          brand: 'UNIQLO',
        },
        {
          id: 11,
          imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400',
          name: '牛仔褲',
          category: '下身',
          brand: "LEVI'S",
        },
        {
          id: 31,
          imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400',
          name: '白色球鞋',
          category: '鞋子',
          brand: 'NIKE',
        },
      ],
    };
    setSelectedOutfit(outfitWithItems);
    setIsOutfitDetailOpen(true);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // 將 mockSavedOutfits 轉換為 carousel 格式
  const carouselOutfits = mockSavedOutfits.map(outfit => ({
    ...outfit,
    likes: Math.floor(Math.random() * 500) + 50,
    comments: Math.floor(Math.random() * 100) + 5,
    saves: Math.floor(Math.random() * 300) + 20,
    description: `這是我最喜歡的 ${outfit.name} 穿搭風格，適合日常休閒場合。`,
  }));

  // 籃子功能處理
  const handleAddToBasket = (item: ClothingItem) => {
    // 檢查是否已存在於籃子中
    const exists = basketItems.find(i => i.id === item.id);
    if (exists) {
      toast('此單品已在試穿籃中');
      return;
    }
    
    setBasketItems(prev => [...prev, item]);
    toast.success(`已加入「${item.name}」到試穿籃`);
  };

  const handleRemoveFromBasket = (id: number) => {
    setBasketItems(prev => prev.filter(item => item.id !== id));
    toast('已從試穿籃移除');
  };

  const handleNavigateToTryOnWithBasket = () => {
    if (basketItems.length === 0) return;

    // 傳遞籃子中的衣物到試穿頁面
    toast.success(`準備試穿 ${basketItems.length} 件單品！`);
    // 調用回調並傳遞籃子數據
    onNavigateToTryOn?.(basketItems);
  };

  // 渲染搭配卡片內容 (供正常模式和拖曳模式共用)
  const renderOutfitCardContent = (outfit: typeof outfits[0], showDeleteButton: boolean) => (
    <div onClick={() => !showDeleteButton && handleOutfitCardClick(outfit)}>
      {/* 圖片區域 */}
      <div className="relative aspect-[4/5] overflow-hidden">
        <ImageWithFallback
          src={outfit.imageUrl}
          alt={outfit.name}
          className="w-full h-full object-cover"
        />

        {/* 漸層保護層 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* 場合標籤 */}
        <div className="absolute top-2 left-2 px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm">
          <span
            className="text-[var(--vesti-dark)]"
            style={{ fontSize: 'var(--text-label)' }}
          >
            {outfit.occasion}
          </span>
        </div>

        {/* 收藏按鈕 */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            handleToggleFavorite(outfit.id);
          }}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
        >
          <Heart
            className={`w-4 h-4 transition-all ${
              outfit.isFavorite
                ? 'fill-[var(--vesti-accent)] text-[var(--vesti-accent)]'
                : 'text-[var(--vesti-dark)]'
            }`}
            strokeWidth={2}
          />
        </motion.button>

        {/* 長按顯示刪除按鈕 */}
        <AnimatePresence>
          {showDeleteButton && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteOutfit(outfit.id);
              }}
              className="absolute top-2 right-12 w-8 h-8 rounded-full bg-[var(--vesti-accent)] text-white flex items-center justify-center shadow-lg hover:brightness-110 transition-all"
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-4 h-4" strokeWidth={2.5} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* 資訊區域 */}
      <div className="p-3">
        <h3
          className="text-[var(--vesti-dark)] mb-1 line-clamp-1"
          style={{ fontSize: 'var(--text-h4)' }}
        >
          {outfit.name}
        </h3>
        <p
          className="text-[var(--vesti-text-secondary)]"
          style={{ fontSize: 'var(--text-label)', fontWeight: 400 }}
        >
          {outfit.date} · {outfit.itemCount}件單品
        </p>
      </div>
    </div>
  );

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen flex flex-col bg-[var(--vesti-background)]">
        {/* Header */}
        <div className="flex-shrink-0 bg-[var(--vesti-background)]/95 backdrop-blur-sm relative z-30">
          {/* 標題列 - 永遠可見，點擊可恢復 Header */}
          <div
            className="flex h-16 items-center px-5 cursor-pointer"
            onClick={() => {
              if (!isControlsVisible) {
                setIsControlsVisible(true);
                lastControlsStateRef.current = true;
                lastToggleTimeRef.current = Date.now();
              }
            }}
          >
            <h1 className="tracking-widest text-[var(--vesti-primary)]">衣櫃</h1>
            {/* Header 收起時顯示展開提示 */}
            {!isControlsVisible && (
              <span className="ml-2 text-xs text-[var(--vesti-gray-mid)]">點擊展開 ▼</span>
            )}
          </div>

          {/* 可隱藏的控制區域 */}
          <motion.div
            initial={false}
            animate={{
              height: isControlsVisible ? 'auto' : 0,
              opacity: isControlsVisible ? 1 : 0,
            }}
            transition={{
              duration: 0.25,
              ease: 'easeOut',
            }}
            className="overflow-hidden"
            style={{
              pointerEvents: isControlsVisible ? 'auto' : 'none',
            }}
          >            {/* 視圖模式切換 */}
            <div className="flex gap-3 bg-white/95 px-5 py-2 backdrop-blur-sm">
              <motion.button
                onClick={() => {
                  setViewMode('items');
                  setIsControlsVisible(true);
                  lastControlsStateRef.current = true; // 重置狀態
                  if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollTop = 0;
                    lastScrollYRef.current = 0;
                  }
                }}
                whileTap={{ scale: 0.95 }}
                className={`flex flex-1 items-center justify-center rounded-xl border-2 py-2.5 transition-all ${
                  viewMode === 'items'
                    ? 'border-[var(--vesti-primary)] bg-[var(--vesti-primary)] text-white shadow-md'
                    : 'border-border bg-card text-[var(--vesti-gray-mid)] hover:border-[var(--vesti-primary)]/30'
                }`}
              >
                <span style={{ fontWeight: viewMode === 'items' ? 600 : 400 }}>
                  單品衣櫃
                </span>
              </motion.button>

              <motion.button
                onClick={() => {
                  setViewMode('outfits');
                  setIsControlsVisible(true);
                  lastControlsStateRef.current = true; // 重置狀態
                  if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollTop = 0;
                    lastScrollYRef.current = 0;
                  }
                }}
                whileTap={{ scale: 0.95 }}
                className={`flex flex-1 items-center justify-center rounded-xl border-2 py-2.5 transition-all ${
                  viewMode === 'outfits'
                    ? 'border-[var(--vesti-primary)] bg-[var(--vesti-primary)] text-white shadow-md'
                    : 'border-border bg-card text-[var(--vesti-gray-mid)] hover:border-[var(--vesti-primary)]/30'
                }`}
              >
                <span style={{ fontWeight: viewMode === 'outfits' ? 600 : 400 }}>
                  整套搭配
                </span>
              </motion.button>
            </div>

            {/* 整套搭配頁面的搜尋和篩選 */}
            {viewMode === 'outfits' && (
              <>
                {/* 搜尋列 */}
                <div className="px-5 pb-3 pt-4">
                  <div className="relative">
                    <Search
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--vesti-gray-mid)] h-5 w-5"
                      strokeWidth={2}
                    />
                    <input
                      type="text"
                      placeholder="搜尋場合、顏色、單品..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-12 pl-12 pr-12 rounded-[12px] bg-[var(--vesti-light-bg)] border-2 border-transparent text-[var(--vesti-dark)] placeholder:text-[var(--vesti-gray-mid)] transition-all duration-200 focus:border-[var(--vesti-primary)] focus:bg-[var(--vesti-background)] outline-none"
                      style={{ fontSize: 'var(--text-base)' }}
                    />
                    {searchQuery && (
                      <button
                        onClick={handleClearSearch}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--vesti-gray-mid)] hover:text-[var(--vesti-dark)] transition-colors"
                      >
                        <X className="h-5 w-5" strokeWidth={2} />
                      </button>
                    )}
                  </div>
                </div>

                {/* 篩選膠囊 */}
                <div className="px-5 pb-4 overflow-x-auto">
                  <div 
                    className="flex gap-2 w-max"
                    onClick={() => {
                      // 點擊其他地方隱藏刪除按鈕
                      if (longPressCategory) {
                        setLongPressCategory(null);
                      }
                    }}
                  >
                    {/* 全部 */}
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFilterChange('全部');
                      }}
                      whileTap={{ scale: 0.95 }}
                      className={`flex items-center justify-center px-4 h-9 rounded-full transition-all duration-200 whitespace-nowrap ${
                        selectedFilter === '全部'
                          ? 'bg-[var(--vesti-primary)] text-[var(--vesti-background)] shadow-md'
                          : 'bg-[var(--vesti-light-bg)] text-[var(--vesti-dark)] hover:bg-[var(--vesti-gray-light)]'
                      }`}
                      style={{ fontSize: 'var(--text-label)' }}
                    >
                      全部
                    </motion.button>

                    {/* 自定義分類 */}
                    {customCategories.map((category) => {
                      const isSelected = selectedFilter === category;
                      const showDeleteButton = longPressCategory === category;
                      let touchTimer: NodeJS.Timeout | null = null;

                      return (
                        <motion.div
                          key={category}
                          className="relative"
                        >
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (showDeleteButton) {
                                // 如果已經顯示刪除按鈕，點擊不切換篩選
                                setLongPressCategory(null);
                              } else {
                                handleFilterChange(category);
                              }
                            }}
                            onTouchStart={(e) => {
                              e.stopPropagation();
                              // 長按 500ms 觸發
                              touchTimer = setTimeout(() => {
                                setLongPressCategory(category);
                              }, 500);
                            }}
                            onTouchEnd={(e) => {
                              e.stopPropagation();
                              if (touchTimer) {
                                clearTimeout(touchTimer);
                              }
                            }}
                            onTouchMove={(e) => {
                              // 手指移動時取消長按
                              if (touchTimer) {
                                clearTimeout(touchTimer);
                              }
                            }}
                            whileTap={{ scale: 0.95 }}
                            className={`flex items-center justify-center px-4 h-9 rounded-full transition-all duration-200 whitespace-nowrap ${
                              isSelected
                                ? 'bg-[var(--vesti-primary)] text-[var(--vesti-background)] shadow-md'
                                : 'bg-[var(--vesti-light-bg)] text-[var(--vesti-dark)] hover:bg-[var(--vesti-gray-light)]'
                            }`}
                            style={{ fontSize: 'var(--text-label)' }}
                          >
                            {category}
                          </motion.button>
                          
                          {/* 長按顯示刪除按鈕 */}
                          <AnimatePresence>
                            {showDeleteButton && (
                              <motion.button
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCategory(category);
                                  setLongPressCategory(null);
                                }}
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[var(--vesti-accent)] text-white flex items-center justify-center shadow-md"
                                whileTap={{ scale: 0.9 }}
                              >
                                <X className="w-3 h-3" strokeWidth={2.5} />
                              </motion.button>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}

                    {/* 新增分類按鈕 */}
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsCategoryDialogOpen(true);
                      }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center justify-center gap-1 px-4 h-9 rounded-full bg-[var(--vesti-light-bg)] text-[var(--vesti-primary)] hover:bg-[var(--vesti-primary)]/10 transition-all duration-200 whitespace-nowrap border border-dashed border-[var(--vesti-primary)]/30 hover:border-[var(--vesti-primary)]"
                      style={{ fontSize: 'var(--text-label)' }}
                    >
                      <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                      新增分類
                    </motion.button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>

        {/* 可滾動內容區域 */}
        <div
          ref={scrollContainerRef}
          className="flex-1 min-h-0 overflow-y-auto pb-20"
          style={{ overscrollBehavior: 'contain' }}
          onClick={() => {
            // 點擊空白處清除長按狀態
            if (longPressOutfit || draggableOutfit) {
              setLongPressOutfit(null);
              setDraggableOutfit(null);
            }
          }}
        >
          {viewMode === 'items' ? (
            <>
              {loadState === 'loading' && (
                <p className="px-5 py-8 text-center text-sm text-[var(--vesti-gray-mid)]">載入中…</p>
              )}
              {loadState === 'unauthorized' && (
                <p className="px-5 py-8 text-center text-sm text-[var(--vesti-gray-mid)]">請先登入才能看到你的衣櫃</p>
              )}
              {loadState === 'error' && (
                <p className="px-5 py-8 text-center text-sm text-[var(--vesti-gray-mid)]">衣櫃載入失敗，請稍後再試</p>
              )}

              {/* 衣櫃層列表：固定依類別分層 */}
              {loadState === 'ready' && layers.map((layer) => (
                <DroppableClothingRow
                  key={layer.id}
                  layerId={layer.id}
                  title={layer.name}
                  items={layer.items}
                  onLike={handleLike}
                  onDelete={handleDeleteItem}
                  onDrop={handleDrop}
                  onItemClick={handleItemClick}
                  onUpload={handleUploadClick}
                />
              ))}

              {/* 新增衣物（衣櫃全空時也要有入口） */}
              {loadState === 'ready' && (
                <div className="px-5">
                  <motion.button
                    onClick={handleUploadClick}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--vesti-gray-mid)] bg-[var(--vesti-secondary)]/50 py-4 text-[var(--vesti-gray-mid)] transition-all hover:border-[var(--vesti-primary)] hover:text-[var(--vesti-primary)]"
                  >
                    <Plus className="h-5 w-5" strokeWidth={2} />
                    <span style={{ fontWeight: 400 }}>新增衣物</span>
                  </motion.button>
                </div>
              )}
            </>
          ) : (
            <>
              {/* 我的搭配標題與按鈕 */}
              <div className="px-5 mb-4 flex items-center justify-between">
                <h2 className="text-[var(--vesti-dark)]">
                  我的搭配
                  {/* 搭配資料還沒接後端（路線第 2 站處理） */}
                  <span className="ml-2 text-xs text-[var(--vesti-gray-mid)]">示意</span>
                </h2>
                <div className="flex items-center gap-2 p-[5px] m-[3px]">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={onNavigateToTryOn}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--vesti-primary)] text-white transition-all hover:brightness-110"
                  >
                    <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                    <span className="text-xs">新建</span>
                  </motion.button>
                </div>
              </div>

              {/* 搭配卡片網格 - 條件渲染: 正常模式 vs 拖曳模式 */}
              {filteredOutfits.length > 0 ? (
                draggableOutfit !== null ? (
                  // 拖曳模式: 使用 Reorder.Group 啟用排序
                  <Reorder.Group
                    axis="y"
                    values={filteredOutfits}
                    onReorder={handleReorderOutfits}
                    className="grid grid-cols-2 gap-3 px-4 pb-6"
                  >
                    {filteredOutfits.map((outfit, index) => {
                      const showDeleteButton = longPressOutfit === outfit.id;
                      return (
                        <Reorder.Item
                          key={outfit.id}
                          value={outfit}
                          drag
                          dragListener
                          initial={{ opacity: 1, scale: 1 }}
                          animate={{ opacity: 1, scale: 1 }}
                          whileDrag={{ scale: 1.05, zIndex: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}
                          onDragEnd={handleDragEnd}
                          className="bg-[var(--vesti-background)] rounded-[16px] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-shadow duration-200 cursor-grab active:cursor-grabbing"
                        >
                          {renderOutfitCardContent(outfit, showDeleteButton)}
                        </Reorder.Item>
                      );
                    })}
                  </Reorder.Group>
                ) : (
                  // 正常模式: 使用普通 div，不干擾滾動
                  <div className="grid grid-cols-2 gap-3 px-4 pb-6">
                    <AnimatePresence mode="popLayout">
                      {filteredOutfits.map((outfit, index) => {
                        const showDeleteButton = longPressOutfit === outfit.id;
                        return (
                          <motion.div
                            key={outfit.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                            className="bg-[var(--vesti-background)] rounded-[16px] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-shadow duration-200 cursor-pointer"
                            onTouchStart={() => handleLongPressStart(outfit.id)}
                            onTouchEnd={handleLongPressEnd}
                            onTouchMove={handleLongPressEnd}
                            onMouseDown={() => handleLongPressStart(outfit.id)}
                            onMouseUp={handleLongPressEnd}
                            onMouseLeave={handleLongPressEnd}
                          >
                            {renderOutfitCardContent(outfit, showDeleteButton)}
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )
              ) : (
                /* 空狀態 */
                <EmptyState
                  icon={ShoppingBag}
                  title={`還沒準備${selectedFilter !== '全部' ? selectedFilter : ''}穿搭？`}
                  description="去衣櫃搭一套吧！"
                  actionLabel="去搭配"
                  onAction={onNavigateToTryOn}
                />
              )}
            </>
          )}
        </div>

        {/* 創建分類對話框 */}
        <CreateCategoryDialog
          isOpen={isCategoryDialogOpen}
          onClose={() => setIsCategoryDialogOpen(false)}
          onConfirm={handleCreateCategory}
        />

        {/* 衣物詳細資訊彈窗 */}
        {selectedItem && (
          <ClothingDetailModal
            isOpen={isDetailModalOpen}
            onClose={() => setIsDetailModalOpen(false)}
            item={selectedItem}
            onEdit={handleEditItem}
            onCreateOutfit={handleCreateOutfit}
            onShare={handleShareItem}
            onAddToBasket={handleAddToBasket}
          />
        )}

        {/* 上傳選項對話框 */}
        <UploadOptionsDialog
          isOpen={isUploadDialogOpen}
          onClose={() => setIsUploadDialogOpen(false)}
          onSelectCamera={handleCameraUpload}
          onSelectGallery={handleGalleryUpload}
          onImportUrl={handleImportUrl}
        />

        {/* 搭配詳細視窗 */}
        <AnimatePresence>
          {selectedOutfit && (
            <OutfitDetailView
              isOpen={isOutfitDetailOpen}
              onClose={() => setIsOutfitDetailOpen(false)}
              outfit={selectedOutfit}
            />
          )}
        </AnimatePresence>

        {/* 隱藏的檔案選擇器 */}
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/jpeg,image/png,image/jpg"
          onChange={handleFileSelect}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {/* 浮動購物車 */}
        <FloatingBasket
          items={basketItems}
          onRemoveItem={handleRemoveFromBasket}
          onNavigateToTryOn={handleNavigateToTryOnWithBasket}
          onAddItem={handleAddToBasket}
        />
      </div>
    </DndProvider>
  );
}