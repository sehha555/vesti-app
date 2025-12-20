import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Check, ShoppingCart, Eye, X } from 'lucide-react';
import { toast } from 'sonner';

interface ClothingItem {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  brand: string;
  category: string;
}

interface StoreOutfitCardProps {
  id: number;
  imageUrl: string;
  styleName: string;
  description: string;
  price: number;
  items: ClothingItem[];
}

export function StoreOutfitCard({
  imageUrl,
  styleName,
  description,
  price,
  items,
}: StoreOutfitCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const toggleItemSelection = (itemId: number) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleAddToTryOn = () => {
    if (selectedItems.length === 0) {
      toast.error('請至少選擇一件商品');
      return;
    }
    toast.success(`已加入 ${selectedItems.length} 件商品至試穿籃 👔`);
  };

  const handleBuy = () => {
    if (selectedItems.length === 0) {
      toast.error('請至少選擇一件商品');
      return;
    }
    toast.success(`準備購買 ${selectedItems.length} 件商品 🛍️`);
  };

  const selectedTotal = items
    .filter(item => selectedItems.includes(item.id))
    .reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="perspective-1000 mx-5 mb-4 h-[480px]">
      <motion.div
        className="relative h-full w-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
      >
        {/* 正面 - 類似 OutfitCard */}
        <div
          className="absolute inset-0 overflow-hidden rounded-[20px] bg-card border-2 border-[var(--vesti-gray-mid)]/30 shadow-[10px_10px_24px_rgba(0,0,0,0.25)]"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* 圖片區域 */}
          <div className="relative h-[320px] overflow-hidden">
            <ImageWithFallback
              src={imageUrl}
              alt={styleName}
              className="h-full w-full object-cover"
            />

            {/* 翻轉按鈕 */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleFlip}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg transition-all duration-300 hover:bg-[var(--vesti-gray-light)]"
            >
              <Eye className="h-5 w-5 text-[var(--vesti-dark)]" strokeWidth={2} />
            </motion.button>

            {/* 價格標籤 */}
            <div className="absolute bottom-4 left-4 rounded-full bg-white/95 px-4 py-2 backdrop-blur-sm">
              <p className="text-[var(--vesti-primary)]" style={{ fontWeight: 700 }}>
                NT$ {price.toLocaleString()}
              </p>
            </div>
          </div>

          {/* 資訊區域 */}
          <div className="p-5">
            <h3 className="mb-2 text-[var(--vesti-dark)]">{styleName}</h3>
            <p className="mb-3 leading-relaxed text-[var(--vesti-gray-mid)]">
              {description}
            </p>
            <button
              onClick={handleFlip}
              className="w-full rounded-xl bg-[var(--vesti-primary)] py-3 text-white transition-all hover:opacity-90"
            >
              查看商品詳情
            </button>
          </div>
        </div>

        {/* 背面 - 商品列表 */}
        <div
          className="absolute inset-0 overflow-hidden rounded-[20px] bg-card border-2 border-[var(--vesti-gray-mid)]/30 shadow-[10px_10px_24px_rgba(0,0,0,0.25)]"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="flex h-full flex-col">
            {/* 標題列 */}
            <div className="flex items-center justify-between border-b border-border p-4">
              <h3 className="text-[var(--vesti-dark)]">選擇商品</h3>
              <button
                onClick={handleFlip}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--vesti-gray-light)] transition-colors"
              >
                <X className="h-5 w-5 text-[var(--vesti-gray-mid)]" strokeWidth={2} />
              </button>
            </div>

            {/* 商品列表 */}
            <div className="flex-1 overflow-y-auto p-4">
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => toggleItemSelection(item.id)}
                  className={`mb-3 flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 transition-all ${
                    selectedItems.includes(item.id)
                      ? 'border-[var(--vesti-primary)] bg-[var(--vesti-primary)]/5'
                      : 'border-border bg-white hover:border-[var(--vesti-secondary)]'
                  }`}
                >
                  {/* 商品圖片 */}
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
                    <ImageWithFallback
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* 商品資訊 */}
                  <div className="flex-1 min-w-0">
                    <p className="truncate" style={{ fontWeight: 600, color: 'var(--vesti-dark)', fontSize: 'var(--text-h4)' }}>
                      {item.name}
                    </p>
                    <p className="truncate text-[var(--vesti-gray-mid)]" style={{ fontSize: 'var(--text-label)' }}>
                      {item.brand} · {item.category}
                    </p>
                    <p className="text-[var(--vesti-primary)]" style={{ fontWeight: 600, fontSize: 'var(--text-h4)' }}>
                      NT$ {item.price.toLocaleString()}
                    </p>
                  </div>

                  {/* 勾選指示器 */}
                  <div
                    className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full transition-all ${
                      selectedItems.includes(item.id)
                        ? 'bg-[var(--vesti-primary)]'
                        : 'border-2 border-[var(--vesti-gray-mid)]'
                    }`}
                  >
                    <AnimatePresence>
                      {selectedItems.includes(item.id) && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        >
                          <Check className="h-4 w-4 text-white" strokeWidth={3} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* 底部操作欄 */}
            <div className="border-t border-border bg-white p-4">
              {selectedItems.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-3 flex items-center justify-between"
                >
                  <span className="text-[var(--vesti-gray-mid)]" style={{ fontSize: 'var(--text-label)' }}>
                    已選 {selectedItems.length} 件
                  </span>
                  <span className="text-[var(--vesti-primary)]" style={{ fontWeight: 700 }}>
                    NT$ {selectedTotal.toLocaleString()}
                  </span>
                </motion.div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleAddToTryOn}
                  className="flex-1 rounded-xl border-2 border-[var(--vesti-primary)] bg-white py-3 text-[var(--vesti-primary)] transition-all hover:bg-[var(--vesti-primary)]/5"
                >
                  試穿籃
                </button>
                <button
                  onClick={handleBuy}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--vesti-primary)] py-3 text-white transition-all hover:opacity-90"
                >
                  <ShoppingCart className="h-4 w-4" strokeWidth={2} />
                  購買
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
