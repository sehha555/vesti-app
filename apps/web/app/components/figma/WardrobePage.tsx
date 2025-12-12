import { useState, useRef, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { motion, AnimatePresence } from 'motion/react';
import { DroppableClothingRow } from './DroppableClothingRow';
import { CreateLayerDialog } from './CreateLayerDialog';
import { ClothingDetailModal } from './ClothingDetailModal';
import { UploadOptionsDialog } from './UploadOptionsDialog';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { OutfitDetailView } from './OutfitDetailView';
import { toast } from 'sonner';
import { Plus, Sparkles, Bell, Radio, Calendar, Search, Heart, X } from 'lucide-react';

interface ClothingItem {
  id: number;
  imageUrl: string;
  name: string;
  category: string;
  brand?: string;
  source: 'app-purchase' | 'user-upload' | 'saved' | 'merchant';
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

const initialLayers: Layer[] = [
  {
    id: 'layer-1',
    name: '上衣',
    items: [
      { 
        id: 1, 
        imageUrl: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=400', 
        name: '白色 T-shirt', 
        category: '上衣',
        brand: 'UNIQLO',
        source: 'user-upload',
        size: 'M',
        material: '100% 棉',
        wearCount: 12,
        uploadDate: '2024-09-15',
        lastWornDate: '2025-11-01',
        tags: ['休閒', '基本款'],
      },
      { 
        id: 2, 
        imageUrl: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400', 
        name: '藍色襯衫', 
        category: '上衣',
        brand: 'ZARA',
        source: 'app-purchase',
        isPurchased: true,
        price: 890,
        size: 'L',
        material: '65% 棉, 35% 聚酯纖維',
        wearCount: 8,
        uploadDate: '2024-10-20',
        lastWornDate: '2025-10-28',
        tags: ['正式', '商務'],
      },
      { 
        id: 3, 
        imageUrl: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400', 
        name: '黑色針織衫', 
        category: '上衣',
        brand: 'H&M',
        source: 'saved',
        size: 'M',
        material: '80% 羊毛, 20% 尼龍',
        wearCount: 5,
        uploadDate: '2024-11-01',
        lastWornDate: '2025-11-05',
        tags: ['保暖', '秋冬'],
      },
      { 
        id: 4, 
        imageUrl: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400', 
        name: '條紋上衣', 
        category: '上衣',
        brand: 'GAP',
        source: 'merchant',
        size: 'S',
        material: '95% 棉, 5% 彈性纖維',
        wearCount: 15,
        uploadDate: '2024-08-10',
        lastWornDate: '2025-11-03',
        tags: ['休閒', '條紋'],
      },
    ],
  },
  {
    id: 'layer-2',
    name: '下身',
    items: [
      { 
        id: 11, 
        imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400', 
        name: '牛仔褲', 
        category: '下身',
        brand: "LEVI'S",
        source: 'app-purchase',
        isPurchased: false,
        price: 1580,
        size: '32',
        material: '98% 棉, 2% 彈性纖維',
        wearCount: 0,
        uploadDate: '2025-11-06',
        tags: ['牛仔', '經典'],
      },
      { 
        id: 12, 
        imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400', 
        name: '卡其褲', 
        category: '下身',
        brand: 'MUJI',
        source: 'user-upload',
        size: '30',
        material: '100% 棉',
        wearCount: 20,
        uploadDate: '2024-07-15',
        lastWornDate: '2025-11-02',
        tags: ['休閒', '百搭'],
      },
      { 
        id: 13, 
        imageUrl: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=400', 
        name: '黑色長褲', 
        category: '下身',
        brand: 'UNIQLO',
        source: 'user-upload',
        size: '31',
        material: '70% 聚酯纖維, 30% 人造纖維',
        wearCount: 18,
        uploadDate: '2024-09-01',
        lastWornDate: '2025-11-04',
        tags: ['正式', '西裝褲'],
      },
    ],
  },
  {
    id: 'layer-3',
    name: '外套',
    items: [
      { 
        id: 21, 
        imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400', 
        name: '牛仔外套', 
        category: '外套',
        brand: "LEVI'S",
        source: 'app-purchase',
        isPurchased: true,
        price: 2390,
        size: 'M',
        material: '100% 棉',
        wearCount: 10,
        uploadDate: '2024-10-01',
        lastWornDate: '2025-10-30',
        tags: ['牛仔', '休閒'],
      },
      { 
        id: 22, 
        imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400', 
        name: '米色運動外套', 
        category: '外套',
        brand: 'ADIDAS',
        source: 'app-purchase',
        isPurchased: true,
        price: 780,
        size: 'M',
        material: '87% 尼龍, 13% 彈性纖維',
        wearCount: 15,
        uploadDate: '2024-08-01',
        lastWornDate: '2025-11-04',
        tags: ['Sporty', '運動', '毒軟'],
      },
    ],
  },
  {
    id: 'layer-4',
    name: '鞋子',
    items: [
      { 
        id: 31, 
        imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400', 
        name: '白色球鞋', 
        category: '鞋子',
        brand: 'NIKE',
        source: 'merchant',
        size: 'US 9',
        material: '合成皮革',
        wearCount: 25,
        uploadDate: '2024-06-10',
        lastWornDate: '2025-11-06',
        tags: ['運動', '百搭'],
      },
      { 
        id: 32, 
        imageUrl: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400', 
        name: '黑色靴子', 
        category: '鞋子',
        brand: 'Dr. Martens',
        source: 'user-upload',
        size: 'UK 8',
        material: '真皮',
        wearCount: 7,
        uploadDate: '2024-10-15',
        lastWornDate: '2025-11-01',
        tags: ['正式', '皮革'],
      },
    ],
  },
];

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
  onNavigateToTryOn?: () => void;
  onNavigateToBroadcast?: () => void;
}

export function WardrobePage({ onNavigateToUpload, onNavigateToTryOn, onNavigateToBroadcast }: WardrobePageProps = {} as WardrobePageProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('items');
  const [layers, setLayers] = useState<Layer[]>(initialLayers);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLayer, setEditingLayer] = useState<{ id: string; name: string } | null>(null);
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedOutfit, setSelectedOutfit] = useState<any | null>(null);
  const [isOutfitDetailOpen, setIsOutfitDetailOpen] = useState(false);
  
  // 整套搭配視圖的狀態
  const [selectedFilter, setSelectedFilter] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [outfits, setOutfits] = useState(mockSavedOutfits.map(outfit => ({
    ...outfit,
    occasion: '日常',
    itemCount: 3,
    isFavorite: false,
    tags: ['休閒', '日常'],
  })));
  
  // 自定義分類功能
  const [customCategories, setCustomCategories] = useState<string[]>(['日常', '約會', '運動']);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [longPressCategory, setLongPressCategory] = useState<string | null>(null); // 長按顯示刪除按鈕

  // 滾動隱藏效果
  const [isTabBarHidden, setIsTabBarHidden] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // 重置滾動位置和 lastScrollY
    lastScrollY.current = 0;
    setIsTabBarHidden(false);

    const handleScroll = () => {
      const currentScrollY = container.scrollTop;
      const scrollDifference = currentScrollY - lastScrollY.current;
      
      // 往下滾動且滾動距離超過 50px 時隱藏
      if (scrollDifference > 5 && currentScrollY > 50) {
        setIsTabBarHidden(true);
      } 
      // 往上滾動時顯示
      else if (scrollDifference < -5) {
        setIsTabBarHidden(false);
      }
      
      // 每次都更新 lastScrollY
      lastScrollY.current = currentScrollY;
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [viewMode]); // 添加 viewMode 依賴，確保切換視圖時重新綁定

  const handleLike = (id: number) => {
    toast.success('已加入最愛 ❤️');
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

  const handleDeleteItem = (id: number) => {
    setLayers(prev => 
      prev.map(layer => ({
        ...layer,
        items: layer.items.filter(item => item.id !== id),
      }))
    );
    toast('已移除衣物');
  };

  const handleDrop = (item: ClothingItem & { sourceLayerId: string }, targetLayerId: string) => {
    setLayers(prev => {
      // 從來源層移除
      const newLayers = prev.map(layer => {
        if (layer.id === item.sourceLayerId) {
          return {
            ...layer,
            items: layer.items.filter(i => i.id !== item.id),
          };
        }
        return layer;
      });

      // 添加到目標層
      return newLayers.map(layer => {
        if (layer.id === targetLayerId) {
          // Remove sourceLayerId from item before adding
          const { sourceLayerId, ...itemData } = item;
          return {
            ...layer,
            items: [...layer.items, itemData],
          };
        }
        return layer;
      });
    });

    toast.success('已移動衣物');
  };

  const handleCreateLayer = (layerName: string) => {
    if (editingLayer) {
      // 編輯現有層
      setLayers(prev =>
        prev.map(layer =>
          layer.id === editingLayer.id ? { ...layer, name: layerName } : layer
        )
      );
      toast.success('已更新層名稱');
      setEditingLayer(null);
    } else {
      // 創建新層
      const newLayer: Layer = {
        id: `layer-${Date.now()}`,
        name: layerName,
        items: [],
      };
      setLayers(prev => [...prev, newLayer]);
      toast.success('已創建新層 ✨');
    }
  };

  const handleEditLayer = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (layer) {
      setEditingLayer({ id: layer.id, name: layer.name });
      setIsDialogOpen(true);
    }
  };

  const handleDeleteLayer = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (layer && layer.items.length > 0) {
      toast.error('請先清空此層的衣物');
      return;
    }
    setLayers(prev => prev.filter(l => l.id !== layerId));
    toast('已移除層');
  };

  const handleEditItem = () => {
    toast('編輯功能開發中...');
    setIsDetailModalOpen(false);
  };

  const handleCreateOutfit = () => {
    toast.success('已加入穿搭組合 ✨');
    setIsDetailModalOpen(false);
  };

  const handleShareItem = () => {
    toast.success('已複製分享連結 🔗');
    setIsDetailModalOpen(false);
  };

  const handleUploadClick = () => {
    setIsUploadDialogOpen(true);
  };

  const handleCameraUpload = () => {
    setIsUploadDialogOpen(false);
    // 模擬相機上傳
    toast.success('開啟相機中...');
    setTimeout(() => {
      onNavigateToUpload?.();
    }, 300);
  };

  const handleGalleryUpload = () => {
    setIsUploadDialogOpen(false);
    // 模擬相簿選擇
    toast.success('開啟相簿中...');
    setTimeout(() => {
      onNavigateToUpload?.();
    }, 300);
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
        toast.success('已加入收藏 ❤️');
      } else {
        toast('已取消收藏');
      }
    }
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

  // 篩選搭配
  const filteredOutfits = outfits.filter(outfit => {
    const matchesFilter = selectedFilter === '全部' || outfit.occasion === selectedFilter;
    const matchesSearch =
      searchQuery === '' ||
      outfit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      outfit.occasion.toLowerCase().includes(searchQuery.toLowerCase()) ||
      outfit.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  // 將 mockSavedOutfits 轉換為 carousel 格式
  const carouselOutfits = mockSavedOutfits.map(outfit => ({
    ...outfit,
    likes: Math.floor(Math.random() * 500) + 50,
    comments: Math.floor(Math.random() * 100) + 5,
    saves: Math.floor(Math.random() * 300) + 20,
    description: `這是我最喜歡的 ${outfit.name} 穿搭風格，適合日常休閒場合。`,
  }));

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen flex flex-col bg-[var(--vesti-background)] overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 bg-[var(--vesti-background)]/95 backdrop-blur-sm">
          <div className="flex h-16 items-center px-5">
            <h1 className="tracking-widest text-[var(--vesti-primary)]">衣櫃</h1>
          </div>

          {/* 視圖模式切換 */}
          <motion.div
            animate={{
              height: isTabBarHidden ? 0 : 'auto',
              opacity: isTabBarHidden ? 0 : 1,
              marginBottom: isTabBarHidden ? 0 : '1rem',
            }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="flex gap-3 bg-white/95 px-5 py-2 backdrop-blur-sm">
              <motion.button
                onClick={() => {
                  setViewMode('items');
                  setIsTabBarHidden(false);
                  if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollTop = 0;
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
                  setIsTabBarHidden(false);
                  if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollTop = 0;
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
          </motion.div>
        </div>

        {/* 可滾動內容區域 */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto pb-20"
        >
          {viewMode === 'items' ? (
            <>
              {/* 衣櫃層列表 */}
              {layers.map((layer) => (
                <DroppableClothingRow
                  key={layer.id}
                  layerId={layer.id}
                  title={layer.name}
                  items={layer.items}
                  onLike={handleLike}
                  onDelete={handleDeleteItem}
                  onDrop={handleDrop}
                  onEditLayer={handleEditLayer}
                  onDeleteLayer={handleDeleteLayer}
                  onItemClick={handleItemClick}
                  onUpload={handleUploadClick}
                />
              ))}

              {/* 添加新層按鈕 */}
              <div className="px-5">
                <motion.button
                  onClick={() => {
                    setEditingLayer(null);
                    setIsDialogOpen(true);
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--vesti-gray-mid)] bg-[var(--vesti-secondary)]/50 py-4 text-[var(--vesti-gray-mid)] transition-all hover:border-[var(--vesti-primary)] hover:text-[var(--vesti-primary)]"
                >
                  <Plus className="h-5 w-5" strokeWidth={2} />
                  <span style={{ fontWeight: 400 }}>新增衣櫃層</span>
                </motion.button>
              </div>
            </>
          ) : (
            <>
              {/* 搜尋列 */}
              <div className="px-5 pb-3 pt-2">
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
                    className={`px-4 py-2 rounded-full transition-all duration-200 whitespace-nowrap ${
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
                          className={`px-4 py-2 rounded-full transition-all duration-200 whitespace-nowrap ${
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
                    className="px-4 py-2 rounded-full bg-[var(--vesti-light-bg)] text-[var(--vesti-primary)] hover:bg-[var(--vesti-primary)]/10 transition-all duration-200 whitespace-nowrap border-2 border-dashed border-[var(--vesti-primary)]/30 hover:border-[var(--vesti-primary)]"
                    style={{ fontSize: 'var(--text-label)' }}
                  >
                    <Plus className="inline w-3.5 h-3.5 mr-1" strokeWidth={2.5} />
                    新增分類
                  </motion.button>
                </div>
              </div>

              {/* 我的搭配標題與按鈕 */}
              <div className="px-5 mb-4 flex items-center justify-between">
                <h2 className="text-[var(--vesti-dark)]">我的搭配</h2>
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

              {/* 搭配卡片網格 - 使用 BroadcastPage 設計 */}
              {filteredOutfits.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 px-4 pb-6">
                  <AnimatePresence mode="popLayout">
                    {filteredOutfits.map((outfit, index) => (
                      <motion.div
                        key={outfit.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                        onClick={() => handleOutfitCardClick(outfit)}
                        className="bg-[var(--vesti-background)] rounded-[16px] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-shadow duration-200 cursor-pointer"
                      >
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
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                /* 空狀態 */
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center justify-center pt-20 px-8"
                >
                  <div className="text-6xl mb-4">👗</div>
                  <h3 className="text-[var(--vesti-dark)] mb-2">
                    還沒準備{selectedFilter !== '全部' ? selectedFilter : ''}穿搭？
                  </h3>
                  <p
                    className="text-[var(--vesti-text-secondary)] text-center mb-6"
                    style={{ fontSize: 'var(--text-base)', fontWeight: 400 }}
                  >
                    去衣櫃搭一套吧！
                  </p>
                  <button
                    onClick={onNavigateToTryOn}
                    className="px-6 py-3 rounded-[12px] bg-[var(--vesti-primary)] text-[var(--vesti-background)] hover:bg-[var(--vesti-primary-dark)] transition-colors"
                    style={{ fontSize: 'var(--text-base)' }}
                  >
                    去搭配
                  </button>
                </motion.div>
              )}
            </>
          )}
        </div>

        {/* 創建/編輯層對話框 */}
        <CreateLayerDialog
          isOpen={isDialogOpen}
          onClose={() => {
            setIsDialogOpen(false);
            setEditingLayer(null);
          }}
          onConfirm={handleCreateLayer}
          editingLayer={editingLayer}
        />
        
        {/* 創建分類對話框 */}
        <CreateLayerDialog
          isOpen={isCategoryDialogOpen}
          onClose={() => setIsCategoryDialogOpen(false)}
          onConfirm={handleCreateCategory}
          editingLayer={null}
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
          />
        )}

        {/* 上傳選項對話框 */}
        <UploadOptionsDialog
          isOpen={isUploadDialogOpen}
          onClose={() => setIsUploadDialogOpen(false)}
          onSelectCamera={handleCameraUpload}
          onSelectGallery={handleGalleryUpload}
        />

        {/* 搭配詳細視窗 */}
        {selectedOutfit && (
          <OutfitDetailView
            isOpen={isOutfitDetailOpen}
            onClose={() => setIsOutfitDetailOpen(false)}
            outfit={selectedOutfit}
          />
        )}
      </div>
    </DndProvider>
  );
}