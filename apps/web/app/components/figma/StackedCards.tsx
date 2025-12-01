import { useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Bookmark, Check } from 'lucide-react';
import { toast } from 'sonner';

interface Outfit {
  id: number;
  imageUrl: string;
  styleName: string;
  description: string;
}

interface StackedCardsProps {
  outfits: Outfit[];
  onCardClick: (outfit: Outfit) => void;
}

export function StackedCards({ outfits, onCardClick }: StackedCardsProps) {
  const [cards, setCards] = useState(outfits);
  const [isDragging, setIsDragging] = useState(false);
  const [exitX, setExitX] = useState(0);
  const [savedCards, setSavedCards] = useState<Set<number>>(new Set());
  const [confirmedCards, setConfirmedCards] = useState<Set<number>>(new Set());

  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 80;
    
    // 向左滑動 = 下一張
    if (info.offset.x < -threshold) {
      setExitX(-400);
      
      setTimeout(() => {
        setCards((prev) => {
          const newCards = [...prev];
          const firstCard = newCards.shift();
          if (firstCard) {
            newCards.push(firstCard);
          }
          return newCards;
        });
        setExitX(0);
        setIsDragging(false);
      }, 250);
    } else {
      setIsDragging(false);
    }
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleSave = (e: React.MouseEvent, cardId: number) => {
    e.stopPropagation();
    setSavedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
        toast('已取消收藏');
      } else {
        newSet.add(cardId);
        toast.success('已收藏穿搭靈感 🔖');
      }
      return newSet;
    });
  };

  const handleConfirm = (e: React.MouseEvent, cardId: number) => {
    e.stopPropagation();
    setConfirmedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
        toast('已取消選定');
      } else {
        newSet.add(cardId);
        toast.success('已加入今日穿搭計畫 ✓');
      }
      return newSet;
    });
  };

  return (
    <div className="relative h-[400px] w-auto px-4">
      <div className="relative h-full w-full max-w-[300px] mx-auto">
        <AnimatePresence mode="popLayout">
          {cards.slice(0, 3).map((card, index) => {
            const isTop = index === 0;
            const isSaved = savedCards.has(card.id);
            const isConfirmed = confirmedCards.has(card.id);
            
            // 水平堆疊參數 - 右側露出
            const xOffset = index === 0 ? 0 : index === 1 ? 15 : 30;
            const scale = 1 - index * 0.04;
            const opacity = 1 - index * 0.15;

            return (
              <motion.div
                key={card.id}
                className="absolute inset-0"
                style={{
                  zIndex: 3 - index,
                  transformOrigin: 'center center',
                }}
                layout
                initial={{
                  scale: scale,
                  x: xOffset,
                  opacity: opacity,
                }}
                animate={{
                  scale: scale,
                  x: xOffset,
                  opacity: opacity,
                  transition: {
                    type: 'spring',
                    stiffness: 300,
                    damping: 30,
                    mass: 0.8,
                  },
                }}
                exit={
                  isTop && exitX !== 0
                    ? {
                        x: exitX,
                        opacity: 0,
                        scale: 0.9,
                        transition: {
                          duration: 0.25,
                          ease: 'easeOut',
                        },
                      }
                    : undefined
                }
                drag={isTop ? 'x' : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.7}
                onDragStart={isTop ? handleDragStart : undefined}
                onDragEnd={isTop ? handleDragEnd : undefined}
                whileTap={isTop ? { cursor: 'grabbing' } : undefined}
                onClick={() => isTop && !isDragging && onCardClick(card)}
              >
                <motion.div
                  className="overflow-hidden rounded-[24px] bg-card shadow-[0_8px_32px_rgba(41,108,125,0.18)] border-2 border-white cursor-pointer select-none h-full"
                  whileHover={isTop && !isDragging ? { scale: 1.02 } : undefined}
                  transition={{ 
                    type: 'spring', 
                    stiffness: 400, 
                    damping: 20,
                    mass: 0.8
                  }}
                >
                  {/* 圖片區域 */}
                  <div className="relative h-full overflow-hidden">
                    <ImageWithFallback
                      src={card.imageUrl}
                      alt={card.styleName}
                      className="h-full w-full object-cover"
                    />
                    
                    {/* 漸層遮罩 */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                    
                    {/* 右上角按鈕組 */}
                    {isTop && (
                      <div className="absolute right-3 top-3 flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => handleSave(e, card.id)}
                          className={`flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md transition-all ${
                            isSaved
                              ? 'bg-[var(--vesti-primary)] shadow-lg'
                              : 'bg-white/20 hover:bg-white/30'
                          }`}
                        >
                          <Bookmark
                            className={`h-4 w-4 ${isSaved ? 'fill-white text-white' : 'text-white'}`}
                            strokeWidth={2}
                          />
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => handleConfirm(e, card.id)}
                          className={`flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md transition-all ${
                            isConfirmed
                              ? 'bg-[var(--vesti-accent)] shadow-lg'
                              : 'bg-white/20 hover:bg-white/30'
                          }`}
                        >
                          <Check
                            className="h-4 w-4 text-white"
                            strokeWidth={2.5}
                          />
                        </motion.button>
                      </div>
                    )}
                    
                    {/* 卡片資訊 */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <h3 className="mb-1.5 drop-shadow-lg">{card.styleName}</h3>
                      <p className="line-clamp-2 text-sm opacity-90 drop-shadow-lg" style={{ fontWeight: 400 }}>
                        {card.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* 滑動指示器 */}
      <div className="absolute -bottom-8 left-0 right-0 flex justify-center gap-2">
        {outfits.map((outfit) => {
          const isActive = outfit.id === cards[0].id;
          return (
            <div
              key={outfit.id}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                isActive ? 'w-6 bg-[var(--vesti-accent)]' : 'w-1.5 bg-[var(--vesti-gray-mid)]/30'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
