import { useState, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Bookmark, Check } from 'lucide-react';
import { toast } from 'sonner';
import { haptic } from './hooks/useHaptic';
import { outfitKeyFromSlots } from '../../../lib/outfits/key';

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



// 使用者當地的今天（台灣早上 8 點前 toISOString() 還是昨天的 UTC 日期）
function localDate(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// 卡片的 id 只是這次推薦的順序（1、2、3），重新整理後會變；用組成單品辨認是不是同一套
const outfitKey = (outfit: Pick<Outfit, 'layoutSlots'>) => outfitKeyFromSlots(outfit.layoutSlots);

interface StackedCardsProps {
  outfits: Outfit[];
  onCardClick: (outfit: Outfit) => void;
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
  // 已收藏穿搭的 key（組成單品）；收藏清單由首頁從伺服器載入並管理
  savedKeys?: ReadonlySet<string>;
  onToggleSave?: (outfit: Outfit) => Promise<'saved' | 'removed'>;
}

export function StackedCards({ outfits, onCardClick, weather, occasion, savedKeys, onToggleSave }: StackedCardsProps) {
  const [cards, setCards] = useState(outfits);
  // 首頁一開始給的是預設卡片，Gemini 結果幾秒後才到；props 換了卡片要跟著換
  useEffect(() => {
    setCards(outfits);
  }, [outfits]);
  const [isDragging, setIsDragging] = useState(false);
  const [exitX, setExitX] = useState(0);
  const [saveBusy, setSaveBusy] = useState(false);
  // 今日計畫選定的那一套（以組成單品辨認），每人每天只有一套
  const [plannedKey, setPlannedKey] = useState<string | null>(null);
  const [planBusy, setPlanBusy] = useState(false);

  // 初始化：從 Supabase 回填今日已選定的穿搭（使用者身分由 session 決定）
  useEffect(() => {
    const fetchTodayPlan = async () => {
      try {
        const res = await fetch(`/api/reco/daily-outfits/plan?date=${localDate()}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.ok && data.plan) {
          setPlannedKey(outfitKey(data.plan));
        }
      } catch (error) {
        console.error('[StackedCards] 載入今日計畫失敗:', error);
      }
    };

    fetchTodayPlan();
  }, []);

  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 80;

    // 左右滑都換下一張（原本只認向左，往右滑等於沒反應）
    if (Math.abs(info.offset.x) > threshold) {
      setExitX(info.offset.x < 0 ? -400 : 400);

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
    if (saveBusy || !onToggleSave) return;
    haptic('medium');

    const outfit = cards.find(card => card.id === cardId);
    if (!outfit) return;
    if (!outfitKey(outfit)) {
      toast('這是範例穿搭，衣櫃裡至少放 3 件衣服後就能收藏推薦');
      return;
    }

    setSaveBusy(true);
    try {
      const result = await onToggleSave(outfit);
      haptic('success');
      if (result === 'saved') {
        toast.success('已儲存穿搭');
      } else {
        toast('已取消收藏');
      }
    } catch (error) {
      console.error('[StackedCards] 更新收藏失敗:', error);
      toast.error('收藏失敗，請再試一次');
    } finally {
      setSaveBusy(false);
    }
  };

  const handleConfirm = async (e: React.MouseEvent, cardId: number) => {
    e.stopPropagation();
    if (planBusy) return;
    haptic('medium');

    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    const key = outfitKey(card);
    if (!key) {
      toast('這是範例穿搭，衣櫃裡至少放 3 件衣服後就能加入今日計畫');
      return;
    }

    const previousKey = plannedKey;
    const isCurrentlyConfirmed = previousKey === key;
    const date = localDate();

    // Optimistic UI：每天只有一套，選新的就取代舊的
    setPlannedKey(isCurrentlyConfirmed ? null : key);
    setPlanBusy(true);

    try {
      const response = isCurrentlyConfirmed
        ? await fetch(`/api/reco/daily-outfits/plan?date=${date}`, { method: 'DELETE' })
        : await fetch('/api/reco/daily-outfits/plan', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              date,
              outfitId: card.id,
              layoutSlots: card.layoutSlots,
              occasion: occasion || 'casual',
              ...(weather ? { weather } : {}),
            }),
          });

      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) {
        throw new Error(result.error || '保存失敗');
      }

      haptic('success');
      toast.success(isCurrentlyConfirmed ? '已取消今日穿搭' : '已加入今日穿搭計畫');
    } catch (error) {
      setPlannedKey(previousKey);
      console.error('[StackedCards] 更新今日穿搭計畫失敗:', error);
      toast.error(isCurrentlyConfirmed ? '取消失敗，請重試' : '保存失敗，請重試');
    } finally {
      setPlanBusy(false);
    }
  };

  return (
    <div className="relative h-[400px] w-auto px-4">
      <div className="relative h-full w-full max-w-[300px] mx-auto">
        <AnimatePresence mode="popLayout">
          {cards.slice(0, 3).map((card, index) => {
            const isTop = index === 0;
            const cardKey = outfitKey(card);
            const isSaved = cardKey !== null && (savedKeys?.has(cardKey) ?? false);
            const isConfirmed = cardKey !== null && cardKey === plannedKey;

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
                onClick={() => {
                  if (isTop && !isDragging) {
                    haptic('light');
                    onCardClick(card);
                  }
                }}
              >
                <motion.div
                  className="overflow-hidden rounded-[24px] bg-card shadow-[0_8px_32px_rgba(41,108,125,0.18)] border-2 border-white cursor-pointer select-none h-full"
                  drag={isTop ? 'x' : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.7}
                  onDragStart={isTop ? handleDragStart : undefined}
                  onDragEnd={isTop ? handleDragEnd : undefined}
                  whileTap={isTop ? { cursor: 'grabbing' } : undefined}
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
                      <div className="flex h-full w-full flex-col bg-white px-2 pt-3 pb-[86px]">
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
                              <div className={`relative flex items-end justify-center gap-1 overflow-visible z-20 pb-1 ${accessories.length > 0 ? 'flex-[1.0]' : ''}`}>
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
                              <div className={`grid w-full items-center justify-items-center py-0 z-10 ${topInner || topOuter ? 'flex-[2.8]' : ''}`}>
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
                              <div className={`flex items-end justify-center w-full z-0 px-4 ${bottom ? 'flex-[3.5]' : ''}`}>
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
                              <div className={`flex items-end justify-center w-full pb-0.5 ${shoes ? 'flex-[1.5]' : ''}`}>
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
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent pointer-events-none" />

                    {/* 底部：這套叫什麼、要穿哪幾件、Gemini 為什麼這樣搭 */}
                    <div className="absolute inset-x-0 bottom-0 z-20 bg-black/55 px-4 pb-3 pt-2 text-white backdrop-blur-sm pointer-events-none">
                      <p className="truncate text-[13px] font-semibold leading-tight">{card.styleName}</p>
                      {card.layoutSlots && card.layoutSlots.length > 0 && (
                        <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-white/95">
                          {card.layoutSlots.map((s) => s.item?.name).filter(Boolean).join('・')}
                        </p>
                      )}
                      {card.description && (
                        <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-white/75">{card.description}</p>
                      )}
                    </div>

                    {/* 右上角按鈕組 - z-30 確保在白板佈局元素之上 */}
                    {isTop && (
                      <div className="absolute right-3 top-3 flex gap-2 z-30">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => handleSave(e, card.id)}
                          aria-label={isSaved ? '取消收藏' : '收藏穿搭'}
                          aria-pressed={isSaved}
                          className={`flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md transition-all shadow-md ${isSaved
                            ? 'bg-[var(--vesti-primary)] shadow-lg'
                            : 'bg-black/20 hover:bg-black/30'
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
                          aria-label={isConfirmed ? '取消今日穿搭' : '選為今日穿搭'}
                          aria-pressed={isConfirmed}
                          className={`flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md transition-all shadow-md ${isConfirmed
                            ? 'bg-[var(--vesti-accent)] shadow-lg'
                            : 'bg-black/20 hover:bg-black/30'
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