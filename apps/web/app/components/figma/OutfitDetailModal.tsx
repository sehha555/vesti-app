import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Bookmark } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useState } from 'react';
import { toast } from 'sonner';

interface OutfitItem {
  id?: string;
  name?: string;
  imageUrl?: string;
  category?: string;
  [key: string]: any;
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
    top?: OutfitItem;
    outerwear?: OutfitItem;
    bottom?: OutfitItem;
    shoes?: OutfitItem;
    accessories?: OutfitItem | OutfitItem[];
  };
  layoutSlots?: LayoutSlot[];
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

          {/* 詳細卡片 - 從底部滑出 */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
            }}
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
              {/* Image Area: Mannequin Canvas or Fallback Image */}
              <div className="px-6 pt-2 pb-6">
                <div className="relative aspect-[3/4] max-w-md mx-auto overflow-hidden rounded-[20px] shadow-lg bg-gray-50">
                  {outfit.layoutSlots && outfit.layoutSlots.length > 0 ? (
                    // Mannequin Canvas
                    <div className="flex h-full w-full flex-col bg-white px-2 py-4">
                      {(() => {
                        const slots = outfit.layoutSlots || [];
                        const getSlot = (k: string) => slots.find((s) => s.slotKey === k);
                        const accessories = slots.filter((s) => s.slotKey === 'accessory');

                        const topInner = getSlot('top_inner');
                        const topOuter = getSlot('top_outer');
                        const bottom = getSlot('bottom');
                        const shoes = getSlot('shoes');

                        return (
                          <>
                            {/* 1. Head / Accessories (Flex: 1.0) */}
                            <div className="relative flex flex-[1.0] items-end justify-center gap-1 overflow-visible z-20 pb-1">
                              {accessories.slice(0, 3).map((acc, idx) => (
                                <div key={idx} className="relative h-[90%] aspect-square flex items-center justify-center">
                                  {acc.item?.imageUrl && (
                                    <ImageWithFallback
                                      src={acc.item.imageUrl}
                                      alt={acc.item.name || 'Accessory'}
                                      className="max-h-full max-w-full object-contain drop-shadow-sm"
                                    />
                                  )}
                                </div>
                              ))}
                            </div>

                            {/* 2. Upper Body (Flex: 2.8) */}
                            <div className="grid flex-[2.8] w-full items-center justify-items-center py-0 z-10">
                              {topInner?.item?.imageUrl && (
                                <div className={`col-start-1 row-start-1 flex h-full w-full items-center justify-center transition-all ${topOuter ? 'scale-90 opacity-80 translate-y-[-5%]' : 'scale-100'}`}>
                                  <ImageWithFallback src={topInner.item.imageUrl} alt={topInner.item.name || 'Inner'} className="max-h-full max-w-full object-contain" />
                                </div>
                              )}
                              {topOuter?.item?.imageUrl && (
                                <div className={`col-start-1 row-start-1 flex h-full w-full items-center justify-center z-10 ${topInner ? 'scale-105' : 'scale-100'}`}>
                                  <ImageWithFallback src={topOuter.item.imageUrl} alt={topOuter.item.name || 'Outer'} className="max-h-full max-w-full object-contain drop-shadow-lg" />
                                </div>
                              )}
                            </div>

                            {/* 3. Lower Body (Flex: 3.5) */}
                            <div className="flex flex-[3.5] items-end justify-center w-full z-0 px-4">
                              {bottom?.item?.imageUrl && (
                                <ImageWithFallback src={bottom.item.imageUrl} alt={bottom.item.name || 'Bottom'} className="max-h-full max-w-full object-contain origin-bottom" />
                              )}
                            </div>

                            {/* 4. Feet (Flex: 1.5) */}
                            <div className="flex flex-[1.5] items-end justify-center w-full pb-0.5">
                              {shoes?.item?.imageUrl && (
                                <ImageWithFallback src={shoes.item.imageUrl} alt={shoes.item.name || 'Shoes'} className="max-h-full max-w-full object-contain" />
                              )}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    // Fallback Image
                    <>
                      <ImageWithFallback
                        src={outfit.imageUrl}
                        alt={outfit.styleName}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    </>
                  )}
                </div>
              </div>

              {/* Header Info */}
              <div className="px-6 pb-2">
                <h2 className="mb-2 text-[var(--vesti-dark)] text-xl font-bold">{outfit.styleName}</h2>
                <p className="mb-4 text-sm leading-snug text-[var(--vesti-gray-mid)] font-normal">
                  {outfit.description}
                </p>
              </div>

              {/* Item List */}
              <div className="px-6 pb-6 space-y-4">
                <h3 className="text-md font-semibold text-[var(--vesti-dark)] border-b pb-2">包含單品</h3>
                <div className="space-y-3">
                  {/* Extract items from items object or layoutSlots fallback */}
                  {(() => {
                    const items: (OutfitItem & { typeLabel: string })[] = [];
                    // Helper to push items
                    const pushItem = (itemInput: OutfitItem | OutfitItem[] | undefined, type: string) => {
                      if (!itemInput) return;
                      // Handle array (e.g. accessories)
                      if (Array.isArray(itemInput)) {
                        itemInput.forEach(i => items.push({ ...i, typeLabel: type }));
                      } else {
                        items.push({ ...itemInput, typeLabel: type });
                      }
                    };

                    // Priority: use specific item fields if available
                    if (outfit.items) {
                      pushItem(outfit.items.outerwear, 'Outer');
                      pushItem(outfit.items.top, 'Top');
                      pushItem(outfit.items.bottom, 'Bottom');
                      pushItem(outfit.items.shoes, 'Shoes');
                      pushItem(outfit.items.accessories, 'Accessory');
                    } else if (outfit.layoutSlots) {
                      // Fallback: derive from slots if items object missing
                      outfit.layoutSlots.forEach(slot => {
                        let label = 'Item';
                        if (slot.slotKey === 'top_outer') label = 'Outer';
                        if (slot.slotKey === 'top_inner') label = 'Top';
                        if (slot.slotKey === 'bottom') label = 'Bottom';
                        if (slot.slotKey === 'shoes') label = 'Shoes';
                        if (slot.slotKey === 'accessory') label = 'Accessory';
                        items.push({ ...slot.item, typeLabel: label });
                      });
                    }

                    if (items.length === 0) return <p className="text-sm text-gray-400">尚無單品清單</p>;

                    return items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-2 bg-gray-50 rounded-xl">
                        <div className="h-12 w-12 flex-shrink-0 rounded-lg overflow-hidden bg-white border border-gray-100 flex items-center justify-center">
                          {item.imageUrl ? (
                            <ImageWithFallback src={item.imageUrl} alt={item.name || 'Item'} className="max-h-full max-w-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gray-200" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-[var(--vesti-primary)] font-medium uppercase tracking-wide">{item.typeLabel}</p>
                          <p className="text-sm text-[var(--vesti-dark)] truncate">{item.name || 'Unknown Item'}</p>
                        </div>
                        <button disabled className="px-3 py-1.5 text-xs font-semibold text-[var(--vesti-gray-mid)] border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors opacity-60 cursor-not-allowed">
                          試穿
                        </button>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>

            {/* 底部按鈕區 */}
            <div className="flex gap-3 border-t border-[var(--vesti-gray-mid)]/20 bg-white p-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-3.5 transition-all ${isSaved
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
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3.5 transition-all ${isConfirmed
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
}