import { useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'motion/react';
import { Sparkles, Store, Shuffle, Grid3x3, Shirt, Cloud, Sun, CloudRain, Heart, ShoppingCart, ChevronDown, Check, RotateCw, ShoppingBag, Search } from 'lucide-react';
import { StoreOutfitCard } from './StoreOutfitCard';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner';

interface OutfitItem {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  brand: string;
  category: string;
}

interface OutfitSet {
  id: number;
  imageUrl: string;
  styleName: string;
  description: string;
  price: number;
  items: OutfitItem[];
  weatherSuitable?: {
    tempMin: number;
    tempMax: number;
    weatherTypes: ('sunny' | 'cloudy' | 'rainy' | 'windy' | 'snowy')[];
  };
  wardrobeMatch?: {
    matchScore: number;
    matchingItems: number;
  };
  storeCount?: number;
  occasions?: string[];
  styleTag?: string;
}

type SourceMode = 'single' | 'random' | 'mixed';

interface AIOutfitRecommendationProps {
  outfits: OutfitSet[];
}

export function AIOutfitRecommendation({ outfits }: AIOutfitRecommendationProps) {
  const [sourceMode, setSourceMode] = useState<SourceMode>('mixed');
  const [selectedStyle, setSelectedStyle] = useState<string>('全部');
  const [isGenerating, setIsGenerating] = useState(false);
  const [displayedOutfits, setDisplayedOutfits] = useState<OutfitSet[]>(outfits);
  const [savedOutfits, setSavedOutfits] = useState<Set<number>>(new Set());
  
  // 堆疊卡片狀態
  const [cards, setCards] = useState<OutfitSet[]>(outfits);
  const [isDragging, setIsDragging] = useState(false);
  const [exitX, setExitX] = useState(0);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());

  // 店家選擇狀態
  const [selectedStores, setSelectedStores] = useState<Set<string>>(new Set());
  const [isStoreListExpanded, setIsStoreListExpanded] = useState(false);
  const [storeSearchQuery, setStoreSearchQuery] = useState('');

  // 卡片背面選中的商品 - Map<outfitId, Set<itemId>>
  const [selectedItems, setSelectedItems] = useState<Map<number, Set<number>>>(new Map());

  // 模擬店家資料
  const availableStores = [
    { id: 'uniqlo', name: 'UNIQLO', logo: '🏪' },
    { id: 'zara', name: 'ZARA', logo: '👔' },
    { id: 'hm', name: 'H&M', logo: '👕' },
    { id: 'gu', name: 'GU', logo: '👗' },
    { id: 'muji', name: 'MUJI', logo: '🧥' },
    { id: 'gap', name: 'GAP', logo: '👖' },
  ];

  const sourceModes = [
    { 
      id: 'single' as SourceMode, 
      label: '單一店家', 
      icon: Store, 
      description: '同店購買，物流最快',
      color: 'var(--vesti-primary)'
    },
    { 
      id: 'random' as SourceMode, 
      label: '完全隨機', 
      icon: Shuffle, 
      description: '不限店家，最多選擇',
      color: 'var(--vesti-accent)'
    },
    { 
      id: 'mixed' as SourceMode, 
      label: '智能組合', 
      icon: Grid3x3, 
      description: '2-3家店，平衡選擇',
      color: 'var(--vesti-success)' 
    },
  ];

  const styleFilters = ['全部', '休閒', '正式', '運動', '約會', '工作'];

  const handleGenerate = () => {
    setIsGenerating(true);
    toast.success('AI 正在為您生成搭配... ✨');
    
    setTimeout(() => {
      // 模擬根據來源模式生成不同搭配
      const shuffled = [...outfits].sort(() => Math.random() - 0.5);
      setDisplayedOutfits(shuffled);
      setCards(shuffled);
      setIsGenerating(false);
      toast.success('已生成 3 組新搭配！');
    }, 1500);
  };

  const handleSaveOutfit = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSaved = new Set(savedOutfits);
    if (newSaved.has(id)) {
      newSaved.delete(id);
      toast('已取消收藏');
    } else {
      newSaved.add(id);
      toast.success('已收藏搭配 ❤️');
    }
    setSavedOutfits(newSaved);
  };

  const handleFlipCard = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newFlipped = new Set(flippedCards);
    if (newFlipped.has(id)) {
      newFlipped.delete(id);
    } else {
      newFlipped.add(id);
    }
    setFlippedCards(newFlipped);
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 80;
    
    // 向左滑動 = 下一張
    if (info.offset.x < -threshold) {
      setExitX(-400);
      
      setTimeout(() => {
        setCards((prev) => {
          const newCards = [...prev];
          const firstCard = newCards.shift();
          if (firstCard) {
            newCards.push(firstCard);
          }
          return newCards;
        });
        setExitX(0);
        setIsDragging(false);
        // 清除翻轉狀態
        setFlippedCards(new Set());
      }, 250);
    } else {
      setIsDragging(false);
    }
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const getWeatherIcon = (types: string[] = []) => {
    if (types.includes('sunny')) return <Sun className="h-3.5 w-3.5" />;
    if (types.includes('rainy')) return <CloudRain className="h-3.5 w-3.5" />;
    return <Cloud className="h-3.5 w-3.5" />;
  };

  const filteredOutfits = selectedStyle === '全部' 
    ? displayedOutfits 
    : displayedOutfits.filter(o => o.styleTag === selectedStyle);

  const flipTransition = { duration: 0.6, type: 'spring' as const, stiffness: 200, damping: 25 };

  return (
    <div className="min-h-screen bg-[var(--vesti-background)] pb-6">
      {/* 來源選項區 */}
      <section className="px-5 pt-4 pb-5 bg-white border-b border-border">
        <div className="mb-4">
          <h3 className="text-[var(--vesti-dark)] mb-1 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[var(--vesti-primary)]" />
            搭配來源
          </h3>
          <p className="text-[var(--vesti-gray-mid)]" style={{ fontSize: 'var(--text-label)' }}>
            選擇搭配商品來源方式
          </p>
        </div>

        {/* 來源模式選擇 */}
        <div className="grid grid-cols-3 gap-2.5">
          {sourceModes.map((mode) => {
            const Icon = mode.icon;
            const isSelected = sourceMode === mode.id;
            return (
              <motion.button
                key={mode.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSourceMode(mode.id)}
                className={`relative overflow-hidden rounded-2xl border-2 p-3.5 transition-all ${
                  isSelected
                    ? 'border-[var(--vesti-primary)] bg-[var(--vesti-primary)]/5 shadow-[0_4px_12px_rgba(41,108,125,0.15)]'
                    : 'border-[var(--vesti-gray-mid)]/30 bg-white hover:border-[var(--vesti-gray-mid)]/50'
                }`}
              >
                {/* 選中指示器 */}
                {isSelected && (
                  <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--vesti-primary)] text-white">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </div>
                )}

                <div className="flex flex-col items-center gap-2 text-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                      isSelected ? 'bg-[var(--vesti-primary)] text-white' : 'bg-[var(--vesti-gray-light)] text-[var(--vesti-gray-mid)]'
                    }`}
                  >
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </div>
                  <div>
                    <p className={`text-xs mb-0.5 transition-colors ${isSelected ? 'text-[var(--vesti-dark)]' : 'text-[var(--vesti-gray-mid)]'}`} style={{ fontWeight: 600 }}>
                      {mode.label}
                    </p>
                    <p className="text-[var(--vesti-gray-mid)]" style={{ fontSize: '10px', lineHeight: '1.2' }}>
                      {mode.description}
                    </p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* 店家選擇區 - 只在「單一店家」模式顯示 */}
        <AnimatePresence>
          {sourceMode === 'single' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="mt-4 rounded-2xl border-2 border-[var(--vesti-primary)]/30 bg-[var(--vesti-primary)]/5 p-4">
                {/* 標題與展開按鈕 */}
                <button
                  onClick={() => setIsStoreListExpanded(!isStoreListExpanded)}
                  className="w-full flex items-center justify-between mb-3"
                >
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-[var(--vesti-primary)]" strokeWidth={2} />
                    <span className="text-[var(--vesti-dark)]" style={{ fontWeight: 600, fontSize: 'var(--text-label)' }}>
                      選擇店家
                    </span>
                    {selectedStores.size > 0 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--vesti-primary)] text-white text-xs" style={{ fontWeight: 700 }}>
                        {selectedStores.size}
                      </span>
                    )}
                  </div>
                  <motion.div
                    animate={{ rotate: isStoreListExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="h-4 w-4 text-[var(--vesti-gray-mid)]" strokeWidth={2} />
                  </motion.div>
                </button>

                {/* 提示文字 */}
                {!isStoreListExpanded && (
                  <p className="text-[var(--vesti-gray-mid)]" style={{ fontSize: 'var(--text-label)' }}>
                    {selectedStores.size === 0 
                      ? '點擊展開選擇店家' 
                      : `已選 ${selectedStores.size} 家店`}
                  </p>
                )}

                {/* 店家列表 */}
                <AnimatePresence>
                  {isStoreListExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      {/* 搜尋框 */}
                      <div className="relative mt-3 mb-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--vesti-gray-mid)]" strokeWidth={2} />
                        <input
                          type="text"
                          placeholder="搜尋店家名稱..."
                          value={storeSearchQuery}
                          onChange={(e) => setStoreSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-[var(--vesti-gray-mid)]/30 bg-white text-[var(--vesti-dark)] placeholder:text-[var(--vesti-gray-mid)] focus:outline-none focus:border-[var(--vesti-primary)] transition-colors"
                          style={{ fontSize: 'var(--text-label)' }}
                        />
                      </div>

                      {/* 垂直列表 - 更適合多店家 */}
                      <div className="space-y-2 max-h-[240px] overflow-y-auto">
                        {availableStores
                          .filter(store => store.name.toLowerCase().includes(storeSearchQuery.toLowerCase()))
                          .map((store) => {
                          const isSelected = selectedStores.has(store.id);
                          return (
                            <motion.button
                              key={store.id}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => {
                                const newSelected = new Set(selectedStores);
                                if (isSelected) {
                                  newSelected.delete(store.id);
                                  toast(`已取消選擇 ${store.name}`);
                                } else {
                                  newSelected.add(store.id);
                                  toast.success(`已選擇 ${store.name}`);
                                }
                                setSelectedStores(newSelected);
                              }}
                              className={`w-full flex items-center gap-3 rounded-xl border-2 p-3 transition-all ${
                                isSelected
                                  ? 'border-[var(--vesti-primary)] bg-white shadow-sm'
                                  : 'border-[var(--vesti-gray-mid)]/20 bg-white/50 hover:border-[var(--vesti-gray-mid)]/40'
                              }`}
                            >
                              {/* Checkbox */}
                              <div className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-all ${
                                isSelected
                                  ? 'border-[var(--vesti-primary)] bg-[var(--vesti-primary)]'
                                  : 'border-[var(--vesti-gray-mid)]/50 bg-white'
                              }`}>
                                {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                              </div>

                              {/* 店家名稱 */}
                              <span className={`flex-1 text-left transition-colors ${
                                isSelected ? 'text-[var(--vesti-dark)]' : 'text-[var(--vesti-gray-mid)]'
                              }`} style={{ fontSize: 'var(--text-label)', fontWeight: 600 }}>
                                {store.name}
                              </span>

                              {/* 店家圖標 */}
                              <Store className={`h-4 w-4 flex-shrink-0 transition-colors ${
                                isSelected ? 'text-[var(--vesti-primary)]' : 'text-[var(--vesti-gray-mid)]'
                              }`} strokeWidth={2} />
                            </motion.button>
                          );
                        })}
                        
                        {/* 無搜尋結果提示 */}
                        {availableStores.filter(store => store.name.toLowerCase().includes(storeSearchQuery.toLowerCase())).length === 0 && (
                          <div className="py-8 text-center">
                            <p className="text-[var(--vesti-gray-mid)]" style={{ fontSize: 'var(--text-label)' }}>
                              找不到符合的店家
                            </p>
                          </div>
                        )}
                      </div>

                      {/* 底部說明 */}
                      <p className="text-[var(--vesti-gray-mid)] mt-3 text-center" style={{ fontSize: '11px' }}>
                        可選擇多家店家，AI 會為每家店各生成搭配
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 生成按鈕 */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleGenerate}
          disabled={isGenerating}
          className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--vesti-primary)] py-3.5 text-white shadow-[0_4px_12px_rgba(41,108,125,0.3)] transition-all hover:shadow-[0_6px_16px_rgba(41,108,125,0.35)] disabled:opacity-50"
        >
          <Sparkles className={`h-5 w-5 ${isGenerating ? 'animate-spin' : ''}`} strokeWidth={2} />
          <span style={{ fontWeight: 600 }}>{isGenerating ? 'AI 生成中...' : '重新生成搭配'}</span>
        </motion.button>
      </section>

      {/* 風格篩選 */}
      <section className="px-5 py-3 border-b border-border bg-white sticky top-0 z-30">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {styleFilters.map((style) => (
            <button
              key={style}
              onClick={() => setSelectedStyle(style)}
              className={`flex-shrink-0 rounded-full px-4 py-2 border-2 transition-all ${
                selectedStyle === style
                  ? 'bg-[var(--vesti-dark)] text-white border-[var(--vesti-dark)]'
                  : 'bg-white text-[var(--vesti-gray-mid)] border-[var(--vesti-gray-mid)]/30 hover:bg-[var(--vesti-gray-light)]'
              }`}
              style={{ fontSize: 'var(--text-label)' }}
            >
              {style}
            </button>
          ))}
        </div>
      </section>

      {/* 堆疊卡片區域 */}
      <section className="px-5 pt-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-[var(--vesti-dark)]">AI 推薦搭配</h2>
            <p className="text-[var(--vesti-gray-mid)] mt-0.5" style={{ fontSize: 'var(--text-label)' }}>
              {sourceMode === 'single' && `單一店家搭配 · ${cards.length} 組`}
              {sourceMode === 'random' && `完全隨機搭配 · ${cards.length} 組`}
              {sourceMode === 'mixed' && `智能組合 2-3 家店 · ${cards.length} 組`}
            </p>
          </div>
        </div>

        {/* 堆疊卡片容器 */}
        <div className="relative h-[580px] w-full mb-12">
          <div className="relative h-full w-full max-w-[340px] mx-auto">
            <AnimatePresence mode="popLayout">
              {cards.slice(0, 3).map((card, index) => {
                const isTop = index === 0;
                const isSaved = savedOutfits.has(card.id);
                const isFlipped = flippedCards.has(card.id);
                
                // 水平堆疊參數 - 右側露出
                const xOffset = index === 0 ? 0 : index === 1 ? 20 : 40;
                const scale = 1 - index * 0.05;
                const opacity = 1 - index * 0.2;

                return (
                  <motion.div
                    key={card.id}
                    className="absolute inset-0"
                    style={{
                      zIndex: 3 - index,
                      transformOrigin: 'center center',
                      perspective: '1000px',
                    }}
                    layout
                    initial={{
                      scale: scale,
                      x: xOffset,
                      opacity: opacity,
                    }}
                    animate={{
                      scale: scale,
                      x: xOffset,
                      opacity: opacity,
                      transition: {
                        type: 'spring',
                        stiffness: 300,
                        damping: 30,
                        mass: 0.8,
                      },
                    }}
                    exit={
                      isTop && exitX !== 0
                        ? {
                            x: exitX,
                            opacity: 0,
                            scale: 0.9,
                            transition: {
                              duration: 0.25,
                              ease: 'easeOut',
                            },
                          }
                        : undefined
                    }
                    drag={isTop ? 'x' : false}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.7}
                    onDragStart={isTop ? handleDragStart : undefined}
                    onDragEnd={isTop ? handleDragEnd : undefined}
                    whileTap={isTop ? { cursor: 'grabbing' } : undefined}
                  >
                    {/* 卡片正面 */}
                    <motion.div
                      className="absolute inset-0 overflow-hidden rounded-[28px] bg-card shadow-[0_8px_32px_rgba(41,108,125,0.18)] border-2 border-white cursor-pointer select-none"
                      style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                      }}
                      animate={{ rotateY: isFlipped ? 180 : 0 }}
                      transition={flipTransition}
                      whileHover={isTop && !isDragging ? { scale: 1.02 } : undefined}
                    >
                      {/* 圖片區域 - 4:5 比例 */}
                      <div className="relative h-full overflow-hidden">
                        {/* 圖片填滿整張卡片 */}
                        <ImageWithFallback
                          src={card.imageUrl}
                          alt={card.styleName}
                          className="h-full w-full object-cover"
                        />
                        
                        {/* 漸層遮罩 - 加強底部 */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        
                        {/* 右上角按鈕組 */}
                        {isTop && (
                          <div className="absolute right-3 top-3 flex gap-2 z-20">
                            {/* 翻轉按鈕 */}
                            <motion.button
                              whileHover={{ scale: 1.1, rotate: 180 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => handleFlipCard(card.id, e)}
                              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur-md transition-all shadow-md hover:bg-[var(--vesti-primary)] hover:text-white"
                            >
                              <RotateCw className="h-4 w-4" strokeWidth={2} />
                            </motion.button>

                            {/* 收藏按鈕 */}
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => handleSaveOutfit(card.id, e)}
                              className={`flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md transition-all shadow-md ${
                                isSaved
                                  ? 'bg-[var(--vesti-primary)]'
                                  : 'bg-white/90 hover:bg-white'
                              }`}
                            >
                              <Heart
                                className={`h-4 w-4 transition-colors ${
                                  isSaved ? 'fill-white text-white' : 'text-[var(--vesti-gray-mid)]'
                                }`}
                                strokeWidth={2}
                              />
                            </motion.button>
                          </div>
                        )}

                        {/* 天氣適合度標籤 */}
                        {card.weatherSuitable && (
                          <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-1 shadow-sm z-10">
                            {getWeatherIcon(card.weatherSuitable.weatherTypes)}
                            <span className="text-[var(--vesti-dark)]" style={{ fontSize: '11px', fontWeight: 600 }}>
                              {card.weatherSuitable.tempMin}-{card.weatherSuitable.tempMax}°C
                            </span>
                          </div>
                        )}

                        {/* 底部資訊 - 全部疊加在圖片上 */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                          <h4 className="mb-1.5 drop-shadow-lg" style={{ fontWeight: 700 }}>
                            {card.styleName}
                          </h4>
                          <p className="text-white/90 line-clamp-2 drop-shadow-md mb-3 text-sm">
                            {card.description}
                          </p>

                          {/* 資訊標籤列 */}
                          <div className="flex items-center gap-1.5 flex-wrap mb-3">
                            {/* 店家數量 */}
                            <div className="flex items-center gap-1 rounded-full bg-white/20 backdrop-blur-md px-2.5 py-1 border border-white/30">
                              <Store className="h-3.5 w-3.5" />
                              <span style={{ fontSize: '11px', fontWeight: 600 }}>
                                {card.storeCount || (sourceMode === 'single' ? 1 : sourceMode === 'mixed' ? 2 : 3)} 家店
                              </span>
                            </div>

                            {/* 適配度 */}
                            {card.wardrobeMatch && card.wardrobeMatch.matchScore >= 80 && (
                              <div className="flex items-center gap-1 rounded-full bg-green-500/90 backdrop-blur-md px-2.5 py-1 border border-white/30">
                                <Shirt className="h-3.5 w-3.5" />
                                <span style={{ fontSize: '11px', fontWeight: 600 }}>
                                  {card.wardrobeMatch.matchScore}% 適配
                                </span>
                              </div>
                            )}

                            {/* 場合標籤 */}
                            {card.occasions && card.occasions[0] && (
                              <div className="flex items-center gap-1 rounded-full bg-white/20 backdrop-blur-md px-2.5 py-1 border border-white/30">
                                <span style={{ fontSize: '11px', fontWeight: 600 }}>
                                  {card.occasions[0]}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* 價格與購買按鈕 - 半透明玻璃效果 */}
                          <div className="flex items-center justify-between bg-white/15 backdrop-blur-md rounded-xl p-3 border border-white/30">
                            <div>
                              <p className="text-white/80 mb-0.5" style={{ fontSize: '10px' }}>
                                {card.items.length} 件商品
                              </p>
                              <p className="text-white drop-shadow-lg" style={{ fontWeight: 700, fontSize: '16px' }}>
                                NT$ {card.price.toLocaleString()}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toast.success('已加入試穿籃 🛒');
                              }}
                              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[var(--vesti-primary)] shadow-lg transition-all hover:scale-110"
                            >
                              <ShoppingCart className="h-5 w-5" strokeWidth={2.5} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* 卡片背面 */}
                    <motion.div
                      className="absolute inset-0 overflow-hidden rounded-[28px] bg-white shadow-[0_8px_32px_rgba(41,108,125,0.18)] border-2 border-[var(--vesti-primary)]"
                      style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                      }}
                      initial={{ rotateY: -180 }}
                      animate={{ rotateY: isFlipped ? 0 : -180 }}
                      transition={flipTransition}
                    >
                      <div className="h-full flex flex-col">
                        {/* 標題區 */}
                        <div className="px-5 pt-5 pb-3 border-b border-border">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-[var(--vesti-dark)]" style={{ fontWeight: 700 }}>
                              選擇單品
                            </h3>
                            {isTop && (
                              <motion.button
                                whileHover={{ scale: 1.1, rotate: -180 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => handleFlipCard(card.id, e)}
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--vesti-gray-light)] text-[var(--vesti-dark)] transition-all hover:bg-[var(--vesti-primary)] hover:text-white"
                              >
                                <RotateCw className="h-4 w-4" strokeWidth={2} />
                              </motion.button>
                            )}
                          </div>
                          <p className="text-[var(--vesti-gray-mid)]" style={{ fontSize: 'var(--text-label)' }}>
                            勾選想要加入的商品
                          </p>
                        </div>

                        {/* 商品列表 */}
                        <div className="flex-1 overflow-y-auto px-5 py-4">
                          <div className="space-y-2.5">
                            {card.items.map((item, idx) => {
                              const cardSelectedItems = selectedItems.get(card.id) || new Set();
                              const isItemSelected = cardSelectedItems.has(item.id);
                              
                              return (
                                <motion.button
                                  key={item.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.1 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const newSelectedItems = new Map(selectedItems);
                                    const currentSet = new Set(newSelectedItems.get(card.id) || new Set());
                                    
                                    if (currentSet.has(item.id)) {
                                      currentSet.delete(item.id);
                                    } else {
                                      currentSet.add(item.id);
                                    }
                                    
                                    newSelectedItems.set(card.id, currentSet as Set<number>);
                                    setSelectedItems(newSelectedItems);
                                  }}
                                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border-2 transition-all ${
                                    isItemSelected
                                      ? 'border-[var(--vesti-primary)] bg-[var(--vesti-primary)]/5 shadow-sm'
                                      : 'border-[var(--vesti-gray-mid)]/20 bg-[var(--vesti-background)] hover:border-[var(--vesti-gray-mid)]/40'
                                  }`}
                                >
                                  {/* Checkbox - 左側垂直置中 */}
                                  <div className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-all ${
                                    isItemSelected
                                      ? 'border-[var(--vesti-primary)] bg-[var(--vesti-primary)]'
                                      : 'border-[var(--vesti-gray-mid)]/50 bg-white'
                                  }`}>
                                    {isItemSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                                  </div>

                                  {/* 商品圖片 */}
                                  <div className="w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-white border border-[var(--vesti-gray-mid)]/30">
                                    <ImageWithFallback
                                      src={item.imageUrl}
                                      alt={item.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>

                                  {/* 商品資訊 */}
                                  <div className="flex-1 min-w-0 text-left">
                                    <p className="text-[var(--vesti-primary)] mb-0.5" style={{ fontSize: '11px', fontWeight: 600 }}>
                                      {item.brand}
                                    </p>
                                    <h4 className="text-[var(--vesti-dark)] mb-0.5 truncate" style={{ fontWeight: 600, fontSize: 'var(--text-label)' }}>
                                      {item.name}
                                    </h4>
                                    <p className="text-[var(--vesti-gray-mid)] mb-1" style={{ fontSize: '11px' }}>
                                      {item.category}
                                    </p>
                                    <p className="text-[var(--vesti-primary)]" style={{ fontWeight: 700, fontSize: 'var(--text-label)' }}>
                                      NT$ {item.price.toLocaleString()}
                                    </p>
                                  </div>
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>

                        {/* 底部按鈕區 */}
                        <div className="px-5 pb-5 pt-4 border-t border-border bg-white">
                          {(() => {
                            const cardSelectedItems = selectedItems.get(card.id) || new Set();
                            const selectedCount = cardSelectedItems.size;
                            const selectedTotal = card.items
                              .filter(item => cardSelectedItems.has(item.id))
                              .reduce((sum, item) => sum + item.price, 0);

                            return (
                              <>
                                {/* 已選商品資訊 */}
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-[var(--vesti-gray-mid)]" style={{ fontSize: 'var(--text-label)' }}>
                                    已選 {selectedCount} 件商品
                                  </span>
                                  {selectedCount > 0 && (
                                    <span className="text-[var(--vesti-primary)]" style={{ fontWeight: 700, fontSize: '16px' }}>
                                      NT$ {selectedTotal.toLocaleString()}
                                    </span>
                                  )}
                                </div>

                                {/* 按鈕組 */}
                                <div className="flex gap-2">
                                  {/* 加入購物車按鈕 */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (selectedCount === 0) {
                                        toast('請先選擇商品');
                                      } else {
                                        toast.success(`已將 ${selectedCount} 件商品加入購物車`);
                                        const newSelectedItems = new Map(selectedItems);
                                        newSelectedItems.set(card.id, new Set());
                                        setSelectedItems(newSelectedItems);
                                      }
                                    }}
                                    disabled={selectedCount === 0}
                                    className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3.5 shadow-md transition-all ${
                                      selectedCount > 0
                                        ? 'bg-white border-2 border-[var(--vesti-primary)] text-[var(--vesti-primary)] hover:bg-[var(--vesti-primary)]/5'
                                        : 'bg-[var(--vesti-gray-light)] text-[var(--vesti-gray-mid)] border-2 border-transparent cursor-not-allowed'
                                    }`}
                                  >
                                    <ShoppingBag className="h-5 w-5" strokeWidth={2.5} />
                                    <span style={{ fontWeight: 600 }}>購物車</span>
                                  </button>

                                  {/* 加入試衣籃按鈕 */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (selectedCount === 0) {
                                        toast('請先選擇商品');
                                      } else {
                                        toast.success(`已將 ${selectedCount} 件商品加入試衣籃`);
                                        const newSelectedItems = new Map(selectedItems);
                                        newSelectedItems.set(card.id, new Set());
                                        setSelectedItems(newSelectedItems);
                                      }
                                    }}
                                    disabled={selectedCount === 0}
                                    className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3.5 shadow-md transition-all ${
                                      selectedCount > 0
                                        ? 'bg-[var(--vesti-primary)] text-white hover:scale-[1.02]'
                                        : 'bg-[var(--vesti-gray-light)] text-[var(--vesti-gray-mid)] cursor-not-allowed'
                                    }`}
                                  >
                                    <ShoppingCart className="h-5 w-5" strokeWidth={2.5} />
                                    <span style={{ fontWeight: 600 }}>試衣籃</span>
                                  </button>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* 滑動指示器 */}
          <div className="absolute -bottom-8 left-0 right-0 flex justify-center gap-2">
            {cards.map((card, index) => {
              const isActive = card.id === cards[0].id;
              return (
                <div
                  key={card.id}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    isActive ? 'w-6 bg-[var(--vesti-primary)]' : 'w-1.5 bg-[var(--vesti-gray-mid)]/30'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* 提示文字 */}
        <div className="text-center text-[var(--vesti-gray-mid)] mt-8" style={{ fontSize: 'var(--text-label)' }}>
          <p>向左滑動查看下一組搭配</p>
          <p className="mt-1">點擊右上角按鈕查看商品詳情</p>
        </div>
      </section>
    </div>
  );
}