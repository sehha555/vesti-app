import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Heart, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface ClothingCardProps {
  id: number;
  imageUrl: string;
  name: string;
  category: string;
  onLike?: (id: number) => void;
  onDelete?: (id: number) => void;
  onClick?: (id: number) => void;
}

export function ClothingCard({ id, imageUrl, name, category, onLike, onDelete, onClick }: ClothingCardProps) {
  const [isLiked, setIsLiked] = useState(false);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    onLike?.(id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(id);
  };

  const handleCardClick = () => {
    onClick?.(id);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleCardClick}
      className="group relative h-[180px] w-[140px] flex-shrink-0 cursor-pointer"
      style={{
        perspective: '1000px',
      }}
    >
      <div
        className="relative h-full w-full overflow-hidden rounded-[16px] bg-card border-2 border-[var(--vesti-gray-mid)]/30 shadow-[0_2px_8px_rgba(41,108,125,0.12)] transition-all duration-300 group-hover:shadow-[0_4px_16px_rgba(41,108,125,0.18)]"
        style={{
          transformStyle: 'preserve-3d',
        }}
      >
        {/* 圖片區域 */}
        <div className="relative h-[120px] overflow-hidden bg-[var(--vesti-secondary)]">
          <ImageWithFallback
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover"
          />
          
          {/* Hover 按鈕組 */}
          <div className="absolute right-2 top-2 flex flex-col gap-1.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleLike}
              className={`flex h-7 w-7 items-center justify-center rounded-full backdrop-blur-md transition-all ${
                isLiked
                  ? 'bg-[var(--vesti-accent)] shadow-lg'
                  : 'bg-white/80 hover:bg-white'
              }`}
            >
              <Heart
                className={`h-3.5 w-3.5 ${isLiked ? 'fill-white text-white' : 'text-[var(--vesti-dark)]'}`}
                strokeWidth={2}
              />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleDelete}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/80 backdrop-blur-md transition-all hover:bg-white"
            >
              <Trash2 className="h-3.5 w-3.5 text-[var(--vesti-dark)]" strokeWidth={2} />
            </motion.button>
          </div>
        </div>

        {/* 資訊區域 */}
        <div className="p-3">
          <p className="truncate text-xs" style={{ fontWeight: 600 }}>{name}</p>
          <p className="mt-0.5 text-[11px] text-[var(--vesti-gray-mid)]" style={{ fontWeight: 400 }}>
            {category}
          </p>
        </div>

        {/* 立體感邊框 */}
        <div 
          className="pointer-events-none absolute inset-0 rounded-[16px] border border-white/20"
          style={{
            boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.4)',
          }}
        />
      </div>
    </motion.div>
  );
}
