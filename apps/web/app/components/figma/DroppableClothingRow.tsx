import { useRef, useState, useEffect } from 'react';
import { useDrop } from 'react-dnd';
import { DraggableClothingCard } from './DraggableClothingCard';
import { motion } from 'motion/react';
import { Edit2, Trash2, Plus } from 'lucide-react';

interface ClothingItem {
  id: number;
  imageUrl: string;
  name: string;
  category: string;
}

interface DroppableClothingRowProps {
  layerId: string;
  title: string;
  items: ClothingItem[];
  onLike?: (id: number) => void;
  onDelete?: (id: number) => void;
  onDrop?: (item: ClothingItem & { sourceLayerId: string }, targetLayerId: string) => void;
  onEditLayer?: (layerId: string) => void;
  onDeleteLayer?: (layerId: string) => void;
  onItemClick?: (id: number) => void;
  onUpload?: () => void;
}

export function DroppableClothingRow({ 
  layerId, 
  title, 
  items, 
  onLike, 
  onDelete, 
  onDrop,
  onEditLayer,
  onDeleteLayer,
  onItemClick,
  onUpload
}: DroppableClothingRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollVelocity, setScrollVelocity] = useState(0);
  const lastScrollLeft = useRef(0);
  const lastTimestamp = useRef(Date.now());

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'CLOTHING_ITEM',
    drop: (item: ClothingItem & { sourceLayerId: string }) => {
      if (onDrop && item.sourceLayerId !== layerId) {
        onDrop(item, layerId);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft } = scrollRef.current;

      // 計算滑動速度
      const now = Date.now();
      const deltaTime = now - lastTimestamp.current;
      const deltaScroll = scrollLeft - lastScrollLeft.current;

      if (deltaTime > 0) {
        // 速度 = 位移 / 時間，並限制最大值
        const velocity = Math.max(-20, Math.min(20, (deltaScroll / deltaTime) * 50));
        setScrollVelocity(velocity);
      }

      lastScrollLeft.current = scrollLeft;
      lastTimestamp.current = now;
    }
  };

  // 速度衰減效果
  useEffect(() => {
    const decayInterval = setInterval(() => {
      setScrollVelocity((prev) => {
        if (Math.abs(prev) < 0.1) return 0;
        return prev * 0.85; // 衰減係數
      });
    }, 16); // ~60fps

    return () => clearInterval(decayInterval);
  }, []);

  return (
    <div 
      ref={drop}
      className={`relative mb-6 rounded-[20px] border-2 transition-all overflow-visible ${
        isOver 
          ? 'border-[var(--vesti-primary)] bg-[var(--vesti-primary)]/5' 
          : 'border-transparent'
      }`}
    >
      {/* 標題與操作按鈕 */}
      <div className="mb-3 flex items-center justify-between px-5">
        <div className="flex items-center gap-2">
          <h3 className="text-[var(--vesti-dark)]">{title}</h3>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onEditLayer?.(layerId)}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--vesti-secondary)] text-[var(--vesti-gray-mid)] transition-colors hover:bg-[var(--vesti-primary)] hover:text-white"
          >
            <Edit2 className="h-3 w-3" strokeWidth={2} />
          </motion.button>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--vesti-gray-mid)]" style={{ fontWeight: 400 }}>
            {items.length} 件
          </span>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onDeleteLayer?.(layerId)}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--vesti-secondary)] text-[var(--vesti-gray-mid)] transition-colors hover:bg-red-500 hover:text-white"
          >
            <Trash2 className="h-3 w-3" strokeWidth={2} />
          </motion.button>
        </div>
      </div>

      {/* 滑動容器 */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className={`flex gap-4 overflow-x-auto px-5 pb-2 pt-3 scrollbar-hide ${
          items.length === 0 ? 'min-h-[200px] items-center justify-center' : ''
        }`}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          overflowY: 'visible',
        }}
      >
        {items.length > 0 ? (
          <>
            {items.map((item) => (
              <DraggableClothingCard
                key={item.id}
                item={item}
                layerId={layerId}
                scrollVelocity={scrollVelocity}
                onLike={onLike}
                onDelete={onDelete}
                onClick={onItemClick}
              />
            ))}
            
            {/* 上傳卡片 */}
            <motion.div
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={onUpload}
              className="group relative h-[180px] w-[140px] flex-shrink-0 cursor-pointer"
            >
              <div className="relative h-full w-full overflow-hidden rounded-[16px] bg-[var(--vesti-secondary)] border-2 border-dashed border-[var(--vesti-gray-mid)]/40 shadow-[0_2px_8px_rgba(41,108,125,0.08)] transition-all duration-300 group-hover:border-[var(--vesti-primary)] group-hover:shadow-[0_4px_16px_rgba(41,108,125,0.15)] flex items-center justify-center">
                <Plus 
                  className="h-12 w-12 text-[var(--vesti-gray-mid)] transition-colors duration-300 group-hover:text-[var(--vesti-primary)]" 
                  strokeWidth={1.5} 
                />
              </div>
            </motion.div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-center">
            <p className="text-sm text-[var(--vesti-gray-mid)]" style={{ fontWeight: 400 }}>
              拖曳衣物到此層
            </p>
          </div>
        )}
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
