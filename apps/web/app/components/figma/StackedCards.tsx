<<<<<<< HEAD
import { useState, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Bookmark, Check } from 'lucide-react';
import { toast } from 'sonner';
import { haptic } from './hooks/useHaptic';
=======
import { useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Bookmark, Check } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
>>>>>>> de3ed00c33a5d0df6cf810802fd173e4ca4388a2

interface Outfit {
  id: number;
  imageUrl: string;
  styleName: string;
  description: string;
}

interface StackedCardsProps {
  outfits: Outfit[];
  onCardClick: (outfit: Outfit) => void;
<<<<<<< HEAD
  userId?: string;
  weather?: {
    temp_c: number;
    condition: string;
    description: string;
    iconUrl?: string;
    humidity: number;
    feels_like: number;
    locationName?: string;
  };
  occasion?: string;
  onSaveOutfit?: (outfit: Outfit) => void; // 新增：通知 App.tsx 收藏狀態變化
}

export function StackedCards({ outfits, onCardClick, weather, occasion, onSaveOutfit }: StackedCardsProps) {
  const userId = "123e4567-e89b-12d3-a456-426614174000";
=======
}

export function StackedCards({ outfits, onCardClick }: StackedCardsProps) {
>>>>>>> de3ed00c33a5d0df6cf810802fd173e4ca4388a2
  const [cards, setCards] = useState(outfits);
  const [isDragging, setIsDragging] = useState(false);
  const [exitX, setExitX] = useState(0);
  const [savedCards, setSavedCards] = useState<Set<number>>(new Set());
  const [confirmedCards, setConfirmedCards] = useState<Set<number>>(new Set());

<<<<<<< HEAD
  useEffect(() => {
    // 從 localStorage 讀取已保存的穿搭 ID
    const savedOutfitsKey = `vesti_saved_outfits_${userId}`;
    const existingSaved = localStorage.getItem(savedOutfitsKey);
    if (existingSaved) {
      try {
        const savedOutfits = JSON.parse(existingSaved);
        // 提取所有已收藏穿搭的 ID
        const savedIds = savedOutfits.map((outfit: any) => outfit.id);
        setSavedCards(new Set(savedIds));
      } catch (error) {
        console.error('讀取收藏穿搭失敗:', error);
      }
    }
  }, [userId]);

=======
>>>>>>> de3ed00c33a5d0df6cf810802fd173e4ca4388a2
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

<<<<<<< HEAD
  const handleSave = async (e: React.MouseEvent, cardId: number) => {
    e.stopPropagation();
    haptic('medium');

    const isSaved = savedCards.has(cardId);

    if (isSaved) {
      // 取消收藏
      setSavedCards(prev => {
        const newSet = new Set(prev);
        newSet.delete(cardId);
        return newSet;
      });
      
      // 從 localStorage 移除
      const savedOutfitsKey = `vesti_saved_outfits_${userId}`;
      const existingSaved = localStorage.getItem(savedOutfitsKey);
      if (existingSaved) {
        const savedOutfits = JSON.parse(existingSaved);
        const updatedOutfits = savedOutfits.filter((o: any) => o.id !== cardId);
        localStorage.setItem(savedOutfitsKey, JSON.stringify(updatedOutfits));
      }
      
      toast('已取消收藏');
    } else {
      // 儲存穿搭
      const outfit = cards.find(card => card.id === cardId);
      if (!outfit || !userId) {
        toast.error('儲存失敗：缺少必要資訊');
        return;
      }

      try {
        // 立即更新為已收藏狀態
        setSavedCards(prev => {
          const newSet = new Set(prev);
          newSet.add(cardId);
          return newSet;
        });

        // 儲存到 localStorage
        const savedOutfitsKey = `vesti_saved_outfits_${userId}`;
        const outfitData = {
          id: cardId,
          imageUrl: outfit.imageUrl,
          styleName: outfit.styleName,
          description: outfit.description,
          weather,
          occasion,
          savedAt: new Date().toISOString(),
        };

        // 獲取現有的收藏
        const existingSaved = localStorage.getItem(savedOutfitsKey);
        const savedOutfits = existingSaved ? JSON.parse(existingSaved) : [];
        
        // 檢查是否已存在
        const alreadyExists = savedOutfits.some((o: any) => o.id === cardId);
        
        if (!alreadyExists) {
          savedOutfits.push(outfitData);
          localStorage.setItem(savedOutfitsKey, JSON.stringify(savedOutfits));
        }

        // 成功震動
        haptic('success');
        
        if (alreadyExists) {
          toast.success('此穿搭已在收藏中');
        } else {
          toast.success('已儲存穿搭 ✓');
        }

        // 通知 App.tsx 收藏狀態變化
        if (onSaveOutfit) {
          onSaveOutfit(outfit);
        }
      } catch (error) {
        console.error('儲存穿搭失敗:', error);
        // 如果失敗，還原收藏狀態
        setSavedCards(prev => {
          const newSet = new Set(prev);
          newSet.delete(cardId);
          return newSet;
        });
        toast.error('儲存失敗，請再試一次');
      }
    }
=======
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
>>>>>>> de3ed00c33a5d0df6cf810802fd173e4ca4388a2
  };

  const handleConfirm = (e: React.MouseEvent, cardId: number) => {
    e.stopPropagation();
<<<<<<< HEAD
    haptic('medium');
=======
>>>>>>> de3ed00c33a5d0df6cf810802fd173e4ca4388a2
    setConfirmedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
        toast('已取消選定');
      } else {
<<<<<<< HEAD
        haptic('success'); // 成功加入時額外的震動
=======
>>>>>>> de3ed00c33a5d0df6cf810802fd173e4ca4388a2
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
<<<<<<< HEAD
                onClick={() => {
                  if (isTop && !isDragging) {
                    haptic('light');
                    onCardClick(card);
                  }
                }}
=======
                onClick={() => isTop && !isDragging && onCardClick(card)}
>>>>>>> de3ed00c33a5d0df6cf810802fd173e4ca4388a2
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
<<<<<<< HEAD
                          whileTap={{ scale: 0.95 }}
=======
                          whileTap={{ scale: 0.9 }}
>>>>>>> de3ed00c33a5d0df6cf810802fd173e4ca4388a2
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
<<<<<<< HEAD
}
=======
}
>>>>>>> de3ed00c33a5d0df6cf810802fd173e4ca4388a2
