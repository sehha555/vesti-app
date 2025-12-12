import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { X, Calendar, Tag } from 'lucide-react';

interface ClothingItem {
  id: number;
  imageUrl: string;
  name: string;
  category: string;
  brand?: string;
}

interface OutfitDetail {
  id: number;
  name: string;
  date: string;
  imageUrl: string;
  occasion: string;
  items: ClothingItem[];
  tags?: string[];
}

interface OutfitDetailViewProps {
  isOpen: boolean;
  onClose: () => void;
  outfit: OutfitDetail;
  onItemClick?: (item: ClothingItem) => void;
}

export function OutfitDetailView({ isOpen, onClose, outfit, onItemClick }: OutfitDetailViewProps) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="absolute inset-x-0 bottom-0 max-h-[90vh] bg-[var(--vesti-background)] rounded-t-[24px] overflow-hidden flex flex-col"
      >
        {/* 頂部拖曳條 */}
        <div className="flex items-center justify-center pt-3 pb-2">
          <div className="w-12 h-1 rounded-full bg-[var(--vesti-gray-light)]" />
        </div>

        {/* 關閉按鈕 */}
        <div className="absolute top-4 right-4 z-[10000]">
          <motion.button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--vesti-light-bg)] p-2 hover:bg-[var(--vesti-gray-light)] active:scale-95 transition-colors"
          >
            <X className="h-5 w-5 text-[var(--vesti-dark)]" strokeWidth={2} />
          </motion.button>
        </div>

        {/* 可滾動內容區 */}
        <div className="flex-1 overflow-y-auto">
          {/* 整套搭配大圖 */}
          <div className="px-6 pt-2 pb-6">
            <div className="relative aspect-[3/4] max-w-md mx-auto overflow-hidden rounded-[20px] shadow-lg">
              <ImageWithFallback
                src={outfit.imageUrl}
                alt={outfit.name}
                className="w-full h-full object-cover"
              />
              
              {/* 場合標籤 */}
              <div className="absolute top-4 left-4 px-4 py-2 rounded-full bg-white/90 backdrop-blur-sm shadow-md">
                <span
                  className="text-[var(--vesti-dark)]"
                  style={{ fontSize: 'var(--text-base)' }}
                >
                  {outfit.occasion}
                </span>
              </div>
            </div>

            {/* 搭配標題與資訊 */}
            <div className="mt-6">
              <h2 className="text-[var(--vesti-dark)] mb-2">
                {outfit.name}
              </h2>
              <div className="flex items-center gap-4 text-[var(--vesti-text-secondary)]">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" strokeWidth={2} />
                  <span style={{ fontSize: 'var(--text-base)', fontWeight: 400 }}>
                    {outfit.date}
                  </span>
                </div>
                {outfit.tags && outfit.tags.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Tag className="h-4 w-4" strokeWidth={2} />
                    <span style={{ fontSize: 'var(--text-base)', fontWeight: 400 }}>
                      {outfit.tags.join(' · ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 分隔線 */}
          <div className="mx-6 mb-4 h-[1px] bg-[var(--vesti-gray-light)]" />

          {/* 單品資訊區 */}
          <div className="px-6 pb-8">
            <h3 className="text-[var(--vesti-dark)] mb-4">
              單品明細
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              {outfit.items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => onItemClick?.(item)}
                  className="bg-[var(--vesti-light-bg)] rounded-[16px] overflow-hidden cursor-pointer hover:shadow-md transition-shadow duration-200"
                >
                  {/* 單品圖片 */}
                  <div className="relative aspect-square overflow-hidden bg-[var(--vesti-background)]">
                    <ImageWithFallback
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    {/* Category Label */}
                    <div className="absolute top-2 left-2 bg-white/90 px-2 py-1 rounded-md">
                      <p className="text-xs font-medium">{item.category}</p>
                    </div>
                  </div>
                  
                  {/* 單品資訊 */}
                  <div className="p-3">
                    <h4
                      className="text-[var(--vesti-dark)] line-clamp-1 mb-1 font-bold"
                      style={{ fontSize: 'var(--text-base)' }}
                    >
                      {item.name}
                    </h4>
                    {item.brand && (
                      <p
                        className="text-[var(--vesti-text-secondary)] text-gray-500"
                        style={{ fontSize: 'var(--text-label)', fontWeight: 400 }}
                      >
                        {item.brand}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
