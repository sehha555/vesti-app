import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBasket, X } from 'lucide-react';
import { useDrop } from 'react-dnd';

interface ClothingItem {
  id: number;
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

interface FloatingBasketProps {
  items: ClothingItem[];
  onRemoveItem: (id: number) => void;
  onNavigateToTryOn: () => void;
  onAddItem?: (item: ClothingItem) => void;
}

export function FloatingBasket({ items, onRemoveItem, onNavigateToTryOn, onAddItem }: FloatingBasketProps) {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'CLOTHING_ITEM',
    drop: (item: ClothingItem & { sourceLayerId?: string }) => {
      // 處理拖曳掉落事件
      if (onAddItem) {
        onAddItem(item);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));

  const hasItems = items.length > 0;
  const isActive = isOver && canDrop;

  return (
    <>
      {/* 籃子按鈕 */}
      <motion.div
        ref={drop}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="fixed bottom-24 right-5 z-50"
      >
        <motion.button
          onClick={hasItems ? onNavigateToTryOn : undefined}
          whileTap={hasItems ? { scale: 0.9 } : {}}
          animate={{
            scale: isActive ? 1.1 : 1,
            boxShadow: isActive
              ? '0 8px 32px rgba(var(--vesti-primary-rgb), 0.4)'
              : '0 4px 16px rgba(0, 0, 0, 0.15)',
          }}
          className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
            hasItems
              ? 'bg-[var(--vesti-primary)] text-white'
              : 'bg-white text-[var(--vesti-gray-mid)] border-2 border-[var(--vesti-gray-light)]'
          } ${isActive ? 'ring-4 ring-[var(--vesti-primary)]/30' : ''}`}
        >
          <ShoppingBasket className="w-7 h-7" strokeWidth={2} />
          
          {/* 數量徽章 */}
          <AnimatePresence>
            {hasItems && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[var(--vesti-accent)] text-white flex items-center justify-center shadow-lg"
                style={{ fontSize: '11px', fontWeight: 600 }}
              >
                {items.length}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* 拖曳提示 */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-full mb-2 right-0 whitespace-nowrap px-3 py-1.5 rounded-lg bg-[var(--vesti-dark)] text-white shadow-lg"
              style={{ fontSize: 'var(--text-label)' }}
            >
              放開以加入籃子
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* 籃子展開面板（顯示已加入的衣物） */}
      <AnimatePresence>
        {hasItems && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-44 right-5 w-64 bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden z-40"
          >
            {/* 標題 */}
            <div className="px-4 py-3 bg-[var(--vesti-light-bg)] border-b border-[var(--vesti-gray-light)]">
              <h3
                className="text-[var(--vesti-dark)]"
                style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}
              >
                試穿籃 ({items.length})
              </h3>
            </div>

            {/* 衣物列表 */}
            <div className="max-h-64 overflow-y-auto">
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--vesti-light-bg)] transition-colors"
                >
                  {/* 縮圖 */}
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-[var(--vesti-gray-light)] flex-shrink-0">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* 資訊 */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[var(--vesti-dark)] truncate"
                      style={{ fontSize: 'var(--text-base)' }}
                    >
                      {item.name}
                    </p>
                    <p
                      className="text-[var(--vesti-text-secondary)] truncate"
                      style={{ fontSize: 'var(--text-label)' }}
                    >
                      {item.category}
                    </p>
                  </div>

                  {/* 移除按鈕 */}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onRemoveItem(item.id)}
                    className="w-6 h-6 rounded-full bg-[var(--vesti-gray-light)] hover:bg-[var(--vesti-accent)] text-[var(--vesti-gray-mid)] hover:text-white transition-colors flex items-center justify-center flex-shrink-0"
                  >
                    <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                  </motion.button>
                </motion.div>
              ))}
            </div>

            {/* 去試穿按鈕 */}
            <div className="px-4 py-3 bg-[var(--vesti-light-bg)] border-t border-[var(--vesti-gray-light)]">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={onNavigateToTryOn}
                className="w-full py-2.5 rounded-xl bg-[var(--vesti-primary)] text-white transition-all hover:brightness-110"
                style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}
              >
                去試穿 →
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}