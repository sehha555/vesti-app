import { useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Bookmark, Check } from 'lucide-react';
import { toast } from 'sonner';

// 🎨 Instagram 穿搭風格的 Outfit 型別
interface Outfit {
  id: number;
  imageUrl: string; // fallback
  styleName: string;
  description: string;
  heroImageUrl?: string; // 整體穿搭照（右側大圖）
  items?: {             // 單品列表（左側展示）
    id: string;
    name: string;
    imageUrl: string;
  }[];
}

// 天氣資訊型別
interface WeatherInfo {
  temp_c: number;
  condition: string;
  description: string;
  iconUrl?: string;
  humidity: number;
  feels_like: number;
  locationName?: string;
}

interface StackedCardsProps {
  outfits: Outfit[];
  onCardClick: (outfit: Outfit) => void;
  userId?: string;        // 使用者 ID（用於儲存穿搭）
  weather?: WeatherInfo;  // 當前天氣資訊（用於儲存穿搭）
  occasion?: string;      // 當前場合（用於儲存穿搭）
}

export function StackedCards({
  outfits,
  onCardClick,
  userId,
  weather,
  occasion = 'casual'
}: StackedCardsProps) {
  const [cards, setCards] = useState(outfits);
  const [isDragging, setIsDragging] = useState(false);
  const [exitX, setExitX] = useState(0);
  const [savedCards, setSavedCards] = useState<Set<number>>(new Set());
  const [confirmedCards, setConfirmedCards] = useState<Set<number>>(new Set());
  const [isSaving, setIsSaving] = useState(false); // 儲存中狀態

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

  /**
   * 儲存穿搭到後端
   */
  const saveOutfitToBackend = async (card: Outfit, outfitType: 'saved' | 'confirmed') => {
    // 檢查必要資料
    if (!userId || !weather) {
      console.warn('[StackedCards] Missing userId or weather, cannot save outfit');
      return false;
    }

    // 提取單品 ID 列表
    const itemIds = card.items?.map(item => item.id) || [];
    if (itemIds.length === 0) {
      console.warn('[StackedCards] No items in outfit, cannot save');
      return false;
    }

    try {
      setIsSaving(true);

      const response = await fetch('/api/saved-outfits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          items: itemIds,
          weather,
          occasion,
          outfitType,
        }),
      });

      if (!response.ok) {
        throw new Error(`儲存失敗: ${response.status}`);
      }

      const result = await response.json();
      console.log('[StackedCards] Outfit saved:', result);
      return true;
    } catch (error) {
      console.error('[StackedCards] Failed to save outfit:', error);
      toast.error('儲存失敗，請稍後再試');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async (e: React.MouseEvent, cardId: number) => {
    e.stopPropagation();

    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    const isCurrentlySaved = savedCards.has(cardId);

    if (isCurrentlySaved) {
      // 取消收藏（本地狀態更新，暫不刪除後端資料）
      setSavedCards(prev => {
        const newSet = new Set(prev);
        newSet.delete(cardId);
        return newSet;
      });
      toast('已取消收藏');
    } else {
      // 新增收藏
      setSavedCards(prev => new Set(prev).add(cardId));

      // 儲存到後端
      const success = await saveOutfitToBackend(card, 'saved');

      if (success) {
        toast.success('已收藏穿搭靈感 🔖');
      } else {
        // 如果儲存失敗，回復本地狀態
        setSavedCards(prev => {
          const newSet = new Set(prev);
          newSet.delete(cardId);
          return newSet;
        });
      }
    }
  };

  const handleConfirm = async (e: React.MouseEvent, cardId: number) => {
    e.stopPropagation();

    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    const isCurrentlyConfirmed = confirmedCards.has(cardId);

    if (isCurrentlyConfirmed) {
      // 取消確認（本地狀態更新）
      setConfirmedCards(prev => {
        const newSet = new Set(prev);
        newSet.delete(cardId);
        return newSet;
      });
      toast('已取消選定');
    } else {
      // 確認穿搭
      setConfirmedCards(prev => new Set(prev).add(cardId));

      // 儲存到後端
      const success = await saveOutfitToBackend(card, 'confirmed');

      if (success) {
        toast.success('已加入今日穿搭計畫 ✓');
      } else {
        // 如果儲存失敗，回復本地狀態
        setConfirmedCards(prev => {
          const newSet = new Set(prev);
          newSet.delete(cardId);
          return newSet;
        });
      }
    }
  };

  return (
    <div className="relative h-[480px] w-auto px-4">
      <div className="relative h-full w-full max-w-[340px] mx-auto">
        <AnimatePresence>
          {cards.slice(0, 3).map((card, index) => {
            const isTop = index === 0;
            const isSaved = savedCards.has(card.id);
            const isConfirmed = confirmedCards.has(card.id);

            // 水平堆疊參數 - 右側露出
            const xOffset = index === 0 ? 0 : index === 1 ? 15 : 30;
            const scale = 1 - index * 0.04;
            const opacity = 1 - index * 0.15;

            // 🎨 Instagram 風格：判斷是否有單品資料
            const hasItems = card.items && card.items.length > 0;
            const displayHeroImage = card.heroImageUrl || card.imageUrl;

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
                  {/* 🎨 Instagram 風格 Layout */}
                  <div className="relative h-full overflow-hidden flex">
                    {/* 左側：單品列表 (40% 寬度) */}
                    {hasItems ? (
                      <div className="w-[40%] bg-gradient-to-br from-[var(--vesti-secondary)] to-white/50 relative flex items-center justify-center p-4">
                        {/* 單品疊放展示 */}
                        <div className="relative w-full h-full flex flex-col justify-center gap-3">
                          {card.items!.slice(0, 3).map((item, itemIndex) => (
                            <motion.div
                              key={item.id}
                              className="relative"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: itemIndex * 0.1 }}
                            >
                              {/* 單品圖片容器 */}
                              <div className="relative bg-white rounded-xl shadow-md overflow-hidden aspect-square">
                                <ImageWithFallback
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                                {/* 單品名稱標籤 */}
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                                  <p className="text-white text-[10px] font-medium truncate">
                                    {item.name}
                                  </p>
                                </div>
                              </div>

                              {/* 🎨 連接線的圓點起點 */}
                              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2 h-2 bg-white rounded-full border-2 border-[var(--vesti-primary)] shadow-sm z-10" />
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {/* 🎨 連接線區域（SVG） */}
                    {hasItems && (
                      <svg
                        className="absolute left-[40%] top-0 h-full w-[20%] pointer-events-none z-5"
                        style={{ overflow: 'visible' }}
                      >
                        {card.items!.slice(0, 3).map((item, itemIndex) => {
                          const startY = 50 + (itemIndex * 33.33); // 根據單品位置計算起點
                          const endY = 50; // 終點固定在中間

                          return (
                            <g key={item.id}>
                              {/* 貝茲曲線 */}
                              <path
                                d={`M 0 ${startY}% Q 50 ${(startY + endY) / 2}% 100 ${endY}%`}
                                stroke="white"
                                strokeWidth="2"
                                fill="none"
                                strokeDasharray="4 4"
                                opacity="0.6"
                              />
                              {/* 終點圓點 */}
                              <circle
                                cx="100%"
                                cy={`${endY}%`}
                                r="4"
                                fill="white"
                                stroke="var(--vesti-primary)"
                                strokeWidth="2"
                              />
                            </g>
                          );
                        })}
                      </svg>
                    )}

                    {/* 右側：整體穿搭照 (60% 寬度) */}
                    <div className={`${hasItems ? 'w-[60%]' : 'w-full'} relative`}>
                      <ImageWithFallback
                        src={displayHeroImage}
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
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <h3 className="mb-1 drop-shadow-lg text-sm font-semibold">{card.styleName}</h3>
                        <p className="line-clamp-2 text-xs opacity-90 drop-shadow-lg" style={{ fontWeight: 400 }}>
                          {card.description}
                        </p>
                      </div>
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
