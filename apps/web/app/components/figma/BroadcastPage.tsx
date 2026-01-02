import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Heart, X, ArrowLeft } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner';

interface OutfitItem {
  id: number;
  imageUrl: string;
  title: string;
  occasion: string;
  itemCount: number;
  date: string;
  isFavorite: boolean;
  tags: string[];
}

const mockOutfits: OutfitItem[] = [
  {
    id: 1,
    imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400',
    title: '海邊度假風',
    occasion: '約會',
    itemCount: 3,
    date: '2024/12/10',
    isFavorite: true,
    tags: ['約會', '夏季', '休閒'],
  },
  {
    id: 2,
    imageUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400',
    title: '商務簡約',
    occasion: '商務',
    itemCount: 4,
    date: '2024/12/09',
    isFavorite: false,
    tags: ['商務', '正式', '辦公室'],
  },
  {
    id: 3,
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400',
    title: '都市街頭',
    occasion: '休閒',
    itemCount: 3,
    date: '2024/12/08',
    isFavorite: false,
    tags: ['休閒', '街頭', '運動'],
  },
  {
    id: 4,
    imageUrl: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=400',
    title: '優雅晚宴',
    occasion: '婚禮',
    itemCount: 5,
    date: '2024/12/07',
    isFavorite: true,
    tags: ['婚禮', '正式', '派對'],
  },
  {
    id: 5,
    imageUrl: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400',
    title: '週末咖啡',
    occasion: '休閒',
    itemCount: 2,
    date: '2024/12/06',
    isFavorite: false,
    tags: ['休閒', '咖啡廳', '輕鬆'],
  },
  {
    id: 6,
    imageUrl: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=400',
    title: '運動活力',
    occasion: '運動',
    itemCount: 3,
    date: '2024/12/05',
    isFavorite: false,
    tags: ['運動', '健身', '活力'],
  },
  {
    id: 7,
    imageUrl: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400',
    title: '春日踏青',
    occasion: '休閒',
    itemCount: 4,
    date: '2024/12/04',
    isFavorite: true,
    tags: ['休閒', '戶外', '春季'],
  },
  {
    id: 8,
    imageUrl: 'https://images.unsplash.com/photo-1467043237213-65f2da53396f?w=400',
    title: '冬季溫暖',
    occasion: '約會',
    itemCount: 4,
    date: '2024/12/03',
    isFavorite: false,
    tags: ['約會', '冬季', '保暖'],
  },
];

const filterOptions = ['全部', '約會', '商務', '休閒', '婚禮', '運動', '派對'];

interface BroadcastPageProps {
  onBack?: () => void;
}

export function BroadcastPage({ onBack }: BroadcastPageProps = {} as BroadcastPageProps) {
  const [outfits, setOutfits] = useState<OutfitItem[]>(mockOutfits);
  const [selectedFilter, setSelectedFilter] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
    // 可以在這裡添加篩選邏輯
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

  const handleCardClick = (outfit: OutfitItem) => {
    toast.success(`查看「${outfit.title}」的詳細資訊`);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // 篩選搭配
  const filteredOutfits = outfits.filter(outfit => {
    const matchesFilter = selectedFilter === '全部' || outfit.occasion === selectedFilter;
    const matchesSearch =
      searchQuery === '' ||
      outfit.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      outfit.occasion.toLowerCase().includes(searchQuery.toLowerCase()) ||
      outfit.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Sticky Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 z-50 bg-[var(--vesti-background)]/95 backdrop-blur-md border-b border-[var(--vesti-gray-light)]"
      >
        {/* 返回按鈕 */}
        {onBack && (
          <div className="flex items-center px-5 pt-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onBack}
              className="flex items-center gap-2 text-[var(--vesti-primary)] hover:text-[var(--vesti-primary-dark)] transition-colors"
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={2} />
              <span style={{ fontSize: 'var(--text-base)' }}>返回</span>
            </motion.button>
          </div>
        )}
        
        {/* 搜尋列 */}
        <div className="px-5 pt-4 pb-3">
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
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
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
        <div className="px-5 pb-4 overflow-x-auto" ref={scrollContainerRef}>
          <div className="flex gap-2 w-max">
            {filterOptions.map((filter) => {
              const isSelected = selectedFilter === filter;
              return (
                <motion.button
                  key={filter}
                  onClick={() => handleFilterChange(filter)}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-2 rounded-full transition-all duration-200 whitespace-nowrap ${
                    isSelected
                      ? 'bg-[var(--vesti-primary)] text-[var(--vesti-background)] shadow-md'
                      : 'bg-[var(--vesti-light-bg)] text-[var(--vesti-dark)] hover:bg-[var(--vesti-gray-light)]'
                  }`}
                  style={{ fontSize: 'var(--text-label)' }}
                >
                  {filter}
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* 網格內容 */}
      <div className="px-4 pt-4 pb-8">
        {filteredOutfits.length > 0 ? (
          <motion.div
            layout
            className="grid grid-cols-2 gap-3"
          >
            <AnimatePresence mode="popLayout">
              {filteredOutfits.map((outfit, index) => (
                <motion.div
                  key={outfit.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  onClick={() => handleCardClick(outfit)}
                  className="bg-[var(--vesti-background)] rounded-[16px] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-shadow duration-200 cursor-pointer"
                >
                  {/* 圖片區域 */}
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <ImageWithFallback
                      src={outfit.imageUrl}
                      alt={outfit.title}
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
                      {outfit.title}
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
          </motion.div>
        ) : (
          /* 空狀態 */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center pt-20 px-8"
          >
            <div className="text-6xl mb-4"></div>
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
              className="px-6 py-3 rounded-[12px] bg-[var(--vesti-primary)] text-[var(--vesti-background)] hover:bg-[var(--vesti-primary-dark)] transition-colors"
              style={{ fontSize: 'var(--text-base)' }}
            >
              去搭配
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}