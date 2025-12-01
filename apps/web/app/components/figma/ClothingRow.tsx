import { useRef, useState } from 'react';
import { ClothingCard } from './ClothingCard';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ClothingItem {
  id: number;
  imageUrl: string;
  name: string;
  category: string;
}

interface ClothingRowProps {
  title: string;
  items: ClothingItem[];
  onLike?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export function ClothingRow({ title, items, onLike, onDelete }: ClothingRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      const newScrollLeft = 
        direction === 'left' 
          ? scrollRef.current.scrollLeft - scrollAmount
          : scrollRef.current.scrollLeft + scrollAmount;
      
      scrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth',
      });
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  return (
    <div className="relative mb-6">
      {/* 標題 */}
      <div className="mb-3 flex items-center justify-between px-5">
        <h3 className="text-[var(--vesti-dark)]">{title}</h3>
        <span className="text-xs text-[var(--vesti-gray-mid)]" style={{ fontWeight: 400 }}>
          {items.length} 件
        </span>
      </div>

      {/* 左箭頭 */}
      {showLeftArrow && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => scroll('left')}
          className="absolute left-1 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-card shadow-lg backdrop-blur-md transition-all hover:scale-110"
          style={{ marginTop: '8px' }}
        >
          <ChevronLeft className="h-5 w-5 text-[var(--vesti-primary)]" strokeWidth={2.5} />
        </motion.button>
      )}

      {/* 右箭頭 */}
      {showRightArrow && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => scroll('right')}
          className="absolute right-1 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-card shadow-lg backdrop-blur-md transition-all hover:scale-110"
          style={{ marginTop: '8px' }}
        >
          <ChevronRight className="h-5 w-5 text-[var(--vesti-primary)]" strokeWidth={2.5} />
        </motion.button>
      )}

      {/* 滑動容器 */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-4 overflow-x-auto px-5 pb-2 scrollbar-hide"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {items.map((item) => (
          <ClothingCard
            key={item.id}
            id={item.id}
            imageUrl={item.imageUrl}
            name={item.name}
            category={item.category}
            onLike={onLike}
            onDelete={onDelete}
          />
        ))}
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
