import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Bookmark } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useState } from 'react';
import { toast } from 'sonner';

interface Outfit {
  id: number;
  imageUrl: string;
  styleName: string;
  description: string;
}

interface OutfitDetailModalProps {
  outfit: Outfit | null;
  isOpen: boolean;
  onClose: () => void;
}

export function OutfitDetailModal({ outfit, isOpen, onClose }: OutfitDetailModalProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleSave = () => {
    setIsSaved(!isSaved);
    if (!isSaved) {
      toast.success('已收藏穿搭靈感 🔖');
    } else {
      toast('已取消收藏');
    }
  };

  const handleConfirm = () => {
    setIsConfirmed(true);
    toast.success('已加入今日穿搭計畫 ✓');
    setTimeout(() => {
      setIsConfirmed(false);
      onClose();
    }, 1200);
  };

  if (!outfit) return null;

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

<<<<<<< HEAD
          {/* 詳細卡片 - 從底部滑出 */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
=======
          {/* 詳細卡片 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
>>>>>>> de3ed00c33a5d0df6cf810802fd173e4ca4388a2
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
            }}
<<<<<<< HEAD
            className="fixed inset-x-0 bottom-20 z-50 max-h-[80vh] overflow-hidden rounded-t-[24px] bg-card shadow-2xl flex flex-col"
          >
            {/* 頂部拖曳條 */}
            <div className="flex items-center justify-center pt-3 pb-2">
              <div className="w-12 h-1 rounded-full bg-[var(--vesti-gray-light)]" />
            </div>

            {/* 關閉按鈕 */}
            <div className="absolute top-4 right-4 z-10">
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--vesti-light-bg)] hover:bg-[var(--vesti-gray-light)] transition-colors shadow-md"
              >
                <X className="h-5 w-5 text-[var(--vesti-dark)]" strokeWidth={2.5} />
              </motion.button>
            </div>

            {/* 可滾動內容區 */}
            <div className="flex-1 overflow-y-auto pb-6">
              {/* 圖片區域 */}
              <div className="px-6 pt-2 pb-6">
                <div className="relative aspect-[3/4] max-w-md mx-auto overflow-hidden rounded-[20px] shadow-lg">
                  <ImageWithFallback
                    src={outfit.imageUrl}
                    alt={outfit.styleName}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>
              </div>

              {/* 內容區域 */}
              <div className="px-6 pb-6">
                <h2 className="mb-2 text-[var(--vesti-dark)]">{outfit.styleName}</h2>
                <p className="mb-4 text-xs leading-snug text-[var(--vesti-gray-mid)]" style={{ fontWeight: 400 }}>
                  {outfit.description}
                </p>

                {/* 額外資訊 */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--vesti-secondary)]">
                      <span className="text-sm">🌡️</span>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--vesti-gray-mid)]" style={{ fontWeight: 400 }}>適合溫度</p>
                      <p className="text-sm" style={{ fontWeight: 400 }}>20-25°C</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--vesti-secondary)]">
                      <span className="text-sm">👔</span>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--vesti-gray-mid)]" style={{ fontWeight: 400 }}>場合</p>
                      <p className="text-sm" style={{ fontWeight: 400 }}>日常休閒、約會</p>
                    </div>
=======
            className="fixed inset-x-4 top-1/2 z-50 max-h-[80vh] -translate-y-1/2 overflow-hidden rounded-[32px] bg-card shadow-2xl md:inset-x-auto md:left-1/2 md:w-full md:max-w-md md:-translate-x-1/2"
          >
            {/* 關閉按鈕 */}
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm transition-colors hover:bg-white"
            >
              <X className="h-5 w-5 text-[var(--vesti-dark)]" strokeWidth={2.5} />
            </motion.button>

            {/* 圖片區域 */}
            <div className="relative h-[45vh] max-h-[450px] overflow-hidden">
              <ImageWithFallback
                src={outfit.imageUrl}
                alt={outfit.styleName}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </div>

            {/* 內容區域 */}
            <div className="max-h-[35vh] overflow-y-auto p-6 pb-4">
              <h2 className="mb-2 text-[var(--vesti-dark)]">{outfit.styleName}</h2>
              <p className="mb-4 text-xs leading-snug text-[var(--vesti-gray-mid)]" style={{ fontWeight: 400 }}>
                {outfit.description}
              </p>

              {/* 額外資訊 */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--vesti-secondary)]">
                    <span className="text-sm">🌡️</span>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--vesti-gray-mid)]" style={{ fontWeight: 400 }}>適合溫度</p>
                    <p className="text-sm" style={{ fontWeight: 400 }}>20-25°C</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--vesti-secondary)]">
                    <span className="text-sm">👔</span>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--vesti-gray-mid)]" style={{ fontWeight: 400 }}>場合</p>
                    <p className="text-sm" style={{ fontWeight: 400 }}>日常休閒、約會</p>
>>>>>>> de3ed00c33a5d0df6cf810802fd173e4ca4388a2
                  </div>
                </div>
              </div>
            </div>

            {/* 底部按鈕區 */}
<<<<<<< HEAD
            <div className="flex gap-3 border-t border-[var(--vesti-gray-mid)]/20 bg-white p-4">
=======
            <div className="flex gap-3 border-t border-border bg-[var(--vesti-secondary)] p-4">
>>>>>>> de3ed00c33a5d0df6cf810802fd173e4ca4388a2
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-3.5 transition-all ${
                  isSaved
                    ? 'border-[var(--vesti-primary)] bg-[var(--vesti-primary)] text-white'
                    : 'border-border bg-card text-[var(--vesti-dark)] hover:border-[var(--vesti-primary)]/50'
                }`}
              >
                <Bookmark
                  className={`h-5 w-5 transition-all ${isSaved ? 'fill-white' : ''}`}
                  strokeWidth={2}
                />
                <span>{isSaved ? '已收藏' : '收藏'}</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleConfirm}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3.5 transition-all ${
                  isConfirmed
                    ? 'bg-[var(--vesti-success)] text-white'
                    : 'bg-[var(--vesti-accent)] text-white hover:bg-[var(--vesti-accent)]/90'
                }`}
              >
                <Check className="h-5 w-5" strokeWidth={2.5} />
                <span>{isConfirmed ? '已選定' : '選定穿搭'}</span>
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
