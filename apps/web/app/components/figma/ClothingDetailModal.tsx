import { motion, AnimatePresence } from 'motion/react';
import { X, Edit2, Share2, ShoppingBag, Upload, Bookmark, Store } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Badge } from './ui/badge';

interface ClothingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: number;
    imageUrl: string;
    name: string;
    category: string;
    brand?: string;
<<<<<<< HEAD
    source: 'app-purchase' | 'user-upload';
=======
    source: 'app-purchase' | 'user-upload' | 'saved' | 'merchant';
>>>>>>> de3ed00c33a5d0df6cf810802fd173e4ca4388a2
    isPurchased?: boolean;
    price?: number;
    material?: string;
    size?: string;
    wearCount?: number;
    uploadDate?: string;
    lastWornDate?: string;
    tags?: string[];
  };
  onEdit?: () => void;
  onCreateOutfit?: () => void;
  onShare?: () => void;
}

const sourceLabels = {
  'app-purchase': { label: 'App 內購買', icon: ShoppingBag, color: 'var(--vesti-primary)' },
  'user-upload': { label: '用戶上傳', icon: Upload, color: 'var(--vesti-accent)' },
<<<<<<< HEAD
=======
  'saved': { label: '已儲存', icon: Bookmark, color: 'var(--vesti-gray-mid)' },
  'merchant': { label: '商家推薦', icon: Store, color: 'var(--vesti-primary)' },
>>>>>>> de3ed00c33a5d0df6cf810802fd173e4ca4388a2
};

export function ClothingDetailModal({ 
  isOpen, 
  onClose, 
  item, 
  onEdit, 
  onCreateOutfit, 
  onShare 
}: ClothingDetailModalProps) {
  const sourceInfo = sourceLabels[item.source];
  const SourceIcon = sourceInfo.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* 彈窗內容 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
            }}
            className="fixed left-0 right-0 z-50 mx-4 max-h-[75vh] overflow-y-auto rounded-[32px] bg-card shadow-2xl"
            style={{ bottom: '80px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 頂部拉桿 */}
            <div className="sticky top-0 z-10 flex justify-center rounded-t-[32px] bg-card pt-3 pb-2">
              <div className="h-1 w-12 rounded-full bg-[var(--vesti-gray-mid)]/30" />
            </div>

            {/* 關閉按鈕 */}
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="absolute right-5 top-6 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--vesti-secondary)] transition-colors hover:bg-[var(--vesti-primary)] hover:text-white"
            >
              <X className="h-5 w-5" strokeWidth={2.5} />
            </motion.button>

            {/* 內容區域 */}
            <div className="px-6 pb-8">
              {/* 圖片區域 */}
              <div className="mb-5 flex justify-center">
                <div className="relative h-[240px] w-[200px] overflow-hidden rounded-[20px] bg-[var(--vesti-secondary)] shadow-lg">
                  <ImageWithFallback
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
<<<<<<< HEAD
=======
                  
                  {/* 購買狀態標籤 */}
                  {item.source === 'app-purchase' && (
                    <div className="absolute left-3 top-3">
                      <Badge 
                        className={`${
                          item.isPurchased
                            ? 'bg-[var(--vesti-primary)] text-white'
                            : 'border-2 border-[var(--vesti-primary)] bg-white text-[var(--vesti-primary)]'
                        }`}
                      >
                        {item.isPurchased ? '已購買' : '未購買'}
                      </Badge>
                    </div>
                  )}
>>>>>>> de3ed00c33a5d0df6cf810802fd173e4ca4388a2
                </div>
              </div>

              {/* 標題與品牌 */}
              <div className="mb-4">
                <h2 className="mb-1 text-[var(--vesti-dark)]">{item.name}</h2>
                <p className="text-sm text-[var(--vesti-gray-mid)]" style={{ fontWeight: 400 }}>
                  {item.brand ? `${item.brand} · ${item.category}` : item.category}
                </p>
              </div>

              {/* 來源標籤 */}
              <div className="mb-4 flex items-center gap-2">
<<<<<<< HEAD
                <div className="flex items-center gap-1.5 rounded-full border-2 border-[var(--vesti-primary)]/30 bg-[var(--vesti-primary)]/10 px-3 py-1.5">
=======
                <div className="flex items-center gap-1.5 rounded-full border-2 border-border bg-[var(--vesti-secondary)] px-3 py-1.5">
>>>>>>> de3ed00c33a5d0df6cf810802fd173e4ca4388a2
                  <SourceIcon className="h-4 w-4" style={{ color: sourceInfo.color }} strokeWidth={2} />
                  <span className="text-xs" style={{ fontWeight: 500, color: sourceInfo.color }}>
                    {sourceInfo.label}
                  </span>
                </div>
              </div>

              {/* 標籤 */}
              {item.tags && item.tags.length > 0 && (
                <div className="mb-5 flex flex-wrap gap-2">
                  {item.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="rounded-full bg-[var(--vesti-secondary)] px-3 py-1 text-xs text-[var(--vesti-dark)]"
                      style={{ fontWeight: 400 }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* 資訊網格 */}
              <div className="mb-6 grid grid-cols-2 gap-3">
                {/* 購買價格 */}
                {item.price !== undefined && (
                  <div className="rounded-xl bg-[var(--vesti-secondary)] p-4">
                    <p className="mb-1 text-xs text-[var(--vesti-gray-mid)]" style={{ fontWeight: 400 }}>
                      購買價格
                    </p>
                    <p className="text-lg" style={{ fontWeight: 600 }}>
                      ${item.price}
                    </p>
                  </div>
                )}

                {/* 穿著次數 */}
                {item.wearCount !== undefined && (
                  <div className="rounded-xl bg-[var(--vesti-secondary)] p-4">
                    <p className="mb-1 text-xs text-[var(--vesti-gray-mid)]" style={{ fontWeight: 400 }}>
                      穿著次數
                    </p>
                    <p className="text-lg" style={{ fontWeight: 600 }}>
                      {item.wearCount} 次
                    </p>
                  </div>
                )}

                {/* 購買日期/上傳日期 */}
                {item.uploadDate && (
                  <div className="rounded-xl bg-[var(--vesti-secondary)] p-4">
                    <p className="mb-1 text-xs text-[var(--vesti-gray-mid)]" style={{ fontWeight: 400 }}>
                      {item.source === 'app-purchase' ? '購買日期' : '上傳日期'}
                    </p>
                    <p className="text-sm" style={{ fontWeight: 600 }}>
                      {item.uploadDate}
                    </p>
                  </div>
                )}

                {/* 最後穿著 */}
                {item.lastWornDate && (
                  <div className="rounded-xl bg-[var(--vesti-secondary)] p-4">
                    <p className="mb-1 text-xs text-[var(--vesti-gray-mid)]" style={{ fontWeight: 400 }}>
                      最後穿著
                    </p>
                    <p className="text-sm" style={{ fontWeight: 600 }}>
                      {item.lastWornDate}
                    </p>
                  </div>
                )}

                {/* 尺碼 */}
                {item.size && (
                  <div className="rounded-xl bg-[var(--vesti-secondary)] p-4">
                    <p className="mb-1 text-xs text-[var(--vesti-gray-mid)]" style={{ fontWeight: 400 }}>
                      尺碼
                    </p>
                    <p className="text-lg" style={{ fontWeight: 600 }}>
                      {item.size}
                    </p>
                  </div>
                )}

                {/* 材質 */}
                {item.material && (
                  <div className="rounded-xl bg-[var(--vesti-secondary)] p-4">
                    <p className="mb-1 text-xs text-[var(--vesti-gray-mid)]" style={{ fontWeight: 400 }}>
                      材質
                    </p>
                    <p className="text-xs leading-relaxed" style={{ fontWeight: 600 }}>
                      {item.material}
                    </p>
                  </div>
                )}
              </div>

              {/* 操作按鈕 */}
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onEdit}
                  className="flex items-center justify-center gap-2 rounded-xl border-2 border-border bg-card py-3.5 text-[var(--vesti-dark)] transition-all hover:border-[var(--vesti-primary)] hover:bg-[var(--vesti-secondary)]"
                >
                  <Edit2 className="h-4 w-4" strokeWidth={2} />
                  <span style={{ fontWeight: 500 }}>編輯</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onCreateOutfit}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[var(--vesti-primary)] py-3.5 text-white transition-all hover:bg-[var(--vesti-primary)]/90"
                >
                  <ShoppingBag className="h-4 w-4" strokeWidth={2} />
                  <span style={{ fontWeight: 600 }}>建立穿搭</span>
                </motion.button>
              </div>

              {/* 分享按鈕 */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onShare}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-border bg-card py-3.5 text-[var(--vesti-dark)] transition-all hover:border-[var(--vesti-primary)] hover:bg-[var(--vesti-secondary)]"
              >
                <Share2 className="h-4 w-4" strokeWidth={2} />
                <span style={{ fontWeight: 500 }}>分享</span>
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> de3ed00c33a5d0df6cf810802fd173e4ca4388a2
