import { useState, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Bookmark, Check } from 'lucide-react';
import { toast } from 'sonner';
import { haptic } from './hooks/useHaptic';

interface OutfitItem {
  id?: string;
  name?: string;
  imageUrl?: string;
  category?: string;
  color?: string;
  brand?: string;
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
  layoutSlots?: LayoutSlot[];
}



interface StackedCardsProps {
  outfits: Outfit[];
  onCardClick: (outfit: Outfit) => void;
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
  const [cards, setCards] = useState(outfits);
  const [isDragging, setIsDragging] = useState(false);
  const [exitX, setExitX] = useState(0);
  const [savedCards, setSavedCards] = useState<Set<number>>(new Set());
  const [confirmedCards, setConfirmedCards] = useState<Set<number>>(new Set());

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
  };

  const handleConfirm = async (e: React.MouseEvent, cardId: number) => {
    e.stopPropagation();
    haptic('medium');

    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    const isCurrentlyConfirmed = confirmedCards.has(cardId);

    // Optimistic UI 更新
    setConfirmedCards(prev => {
      const newSet = new Set(prev);
      if (isCurrentlyConfirmed) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });

    // 如果取消選定，不需要調用 API
    if (isCurrentlyConfirmed) {
      toast('已取消選定');
      return;
    }

    try {
      // 準備 API 請求資料
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const payload = {
        userId: userId,
        date: today,
        outfitId: card.id,
        layoutSlots: card.layoutSlots || {},
        occasion: 'casual', // 暫時硬編
        weather: {} // 暫時硬編
      };

      // 呼叫 Supabase API
      const response = await fetch('/api/reco/daily-outfits/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.message || '保存失敗');
      }

      haptic('success'); // 成功震動
      toast.success('已加入今日穿搭計畫 ✓');
    } catch (error) {
      // 失敗時 Rollback optimistic UI
      setConfirmedCards(prev => {
        const newSet = new Set(prev);
        newSet.delete(cardId);
        return newSet;
      });

      console.error('[StackedCards] 保存穿搭計畫失敗:', error);
      toast.error('保存失敗，請重試');
    }
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
                onClick={() => {
                  if (isTop && !isDragging) {
                    haptic('light');
                    onCardClick(card);
                  }
                }}
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
                  <div className="relative h-full overflow-hidden bg-gray-100">
                    {/*
                      條件判斷：當後端有回傳 layoutSlots 時，使用人體結構白板佈局
                      否則 fallback 到原本的單張圖片顯示
                    */}
                    {card.layoutSlots && card.layoutSlots.length > 0 ? (
                      <div className="flex h-full w-full flex-col bg-white px-2 py-4">
                        {(() => {
                          const slots = card.layoutSlots || [];
                          // Helper: strict match for key
                          const getSlots = (k: string) => slots.filter((s) => s.slotKey === k);
                          const getSlot = (k: string) => slots.find((s) => s.slotKey === k);

                          const accessories = getSlots('accessory');
                          const topInner = getSlot('top_inner');
                          const topOuter = getSlot('top_outer');
                          const bottom = getSlot('bottom');
                          const shoes = getSlot('shoes');

                          return (
                            <>
                              {/* 1. Head / Accessories (Flex: 1.0) - Sligthly reduced to push body up */}
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
                                    {idx === 2 && accessories.length > 3 && (
                                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-[10px] font-bold text-white rounded-full">
                                        +{accessories.length - 2}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>

                              {/* 2. Upper Body: Top Inner + Top Outer (Flex: 2.8)
                                  Layering Strategy:
                                  - Outer: slightly scaled up (1.05), stronger shadow to pop.
                                  - Inner: scaled down (0.9), lower opacity (0.85) to recede.
                              */}
                              <div className="grid flex-[2.8] w-full items-center justify-items-center py-0 z-10">
                                {/* Base Layer: Top Inner */}
                                {topInner?.item?.imageUrl && (
                                  <div className={`col-start-1 row-start-1 flex h-full w-full items-center justify-center transition-all ${topOuter ? 'scale-90 opacity-80 translate-y-[-5%]' : 'scale-100'}`}>
                                    <ImageWithFallback
                                      src={topInner.item.imageUrl}
                                      alt={topInner.item.name || 'Top Inner'}
                                      className="max-h-full max-w-full object-contain"
                                    />
                                  </div>
                                )}
                                {/* Outer Layer: Top Outer */}
                                {topOuter?.item?.imageUrl && (
                                  <div className={`col-start-1 row-start-1 flex h-full w-full items-center justify-center z-10 ${topInner ? 'scale-105' : 'scale-100'}`}>
                                    <ImageWithFallback
                                      src={topOuter.item.imageUrl}
                                      alt={topOuter.item.name || 'Top Outer'}
                                      className="max-h-full max-w-full object-contain drop-shadow-lg"
                                    />
                                  </div>
                                )}
                              </div>

                              {/* 3. Lower Body: Bottom (Flex: 3.5) 
                                  - Increased ratio.
                                  - items-end to push pants down towards shoes (Legs connecting to feet).
                              */}
                              <div className="flex flex-[3.5] items-end justify-center w-full z-0 px-4">
                                {bottom?.item?.imageUrl && (
                                  <ImageWithFallback
                                    src={bottom.item.imageUrl}
                                    alt={bottom.item.name || 'Bottom'}
                                    className="max-h-full max-w-full object-contain origin-bottom"
                                  />
                                )}
                              </div>

                              {/* 4. Feet: Shoes (Flex: 1.5) 
                                  - Grounded at bottom.
                                  - Good height to allow boots/sneakers to look substantial.
                              */}
                              <div className="flex flex-[1.5] items-end justify-center w-full pb-0.5">
                                {shoes?.item?.imageUrl && (
                                  <ImageWithFallback
                                    src={shoes.item.imageUrl}
                                    alt={shoes.item.name || 'Shoes'}
                                    className="max-h-full max-w-full object-contain"
                                  />
                                )}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    ) : (
                      /* Fallback：當沒有 layoutSlots 時，顯示單張完整穿搭圖片 */
                      <ImageWithFallback
                        src={card.imageUrl}
                        alt={card.styleName}
                        className="h-full w-full object-cover"
                      />
                    )}

                    {/* 漸層遮罩 */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                    {/* 右上角按鈕組 */}
                    {isTop && (
                      <div className="absolute right-3 top-3 flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => handleSave(e, card.id)}
                          className={`flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md transition-all ${isSaved
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
                          className={`flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md transition-all ${isConfirmed
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
              className={`h-1.5 rounded-full transition-all duration-300 ${isActive ? 'w-6 bg-[var(--vesti-accent)]' : 'w-1.5 bg-[var(--vesti-gray-mid)]/30'
                }`}
            />
          );
        })}
      </div>
    </div>
  );
}