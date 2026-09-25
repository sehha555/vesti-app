import { useState, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Bookmark, Check, ThumbsDown, ThumbsUp } from 'lucide-react';
import { toast } from 'sonner';
import { haptic } from './hooks/useHaptic';
import { BottomSheet } from './ui/bottom-sheet';
import { outfitKeyFromSlots } from '@/lib/outfits/key';
import { localDate, sendFeedback } from '@/lib/feedback/client';
import { DISLIKE_REASONS, type DislikeReason } from '@/lib/feedback/types';

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



// 卡片的 id 只是這次推薦的順序（1、2、3），重新整理後會變；用組成單品辨認是不是同一套
const outfitKey = (outfit: Pick<Outfit, 'layoutSlots'>) => outfitKeyFromSlots(outfit.layoutSlots);

// 範例卡片（首頁預設的假穿搭）沒有衣櫃單品，不能收藏 / 選定 / 回饋；回傳 key 或 null（並提示）
function requireKey(outfit: Outfit, action: string): string | null {
  const key = outfitKey(outfit);
  if (!key) toast(`這是範例穿搭，衣櫃裡至少放 3 件衣服後就能${action}`);
  return key;
}

async function fetchPlan(date: string): Promise<{ layoutSlots: LayoutSlot[]; wore: boolean | null } | null> {
  const res = await fetch(`/api/reco/daily-outfits/plan?date=${date}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.ok ? data.plan : null;
}

interface StackedCardsProps {
  outfits: Outfit[];
  onCardClick: (outfit: Outfit) => void;
  // 已收藏穿搭的 key（組成單品）；收藏清單由首頁從伺服器載入並管理
  savedKeys?: ReadonlySet<string>;
  onToggleSave?: (outfit: Outfit) => Promise<'saved' | 'removed'>;
}

export function StackedCards({ outfits, onCardClick, savedKeys, onToggleSave }: StackedCardsProps) {
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
  // 「不要這套」的原因選單
  const [dislikeTarget, setDislikeTarget] = useState<Outfit | null>(null);
  const [dislikeReasons, setDislikeReasons] = useState<DislikeReason[]>([]);
  // 昨天選的那套還沒回答有沒有穿
  const [yesterdayPlan, setYesterdayPlan] = useState<{ date: string; layoutSlots: LayoutSlot[] } | null>(null);

  // 回填今天已選定的穿搭；昨天選的還沒回答有沒有穿就問一次（最可靠的回饋）
  useEffect(() => {
    const yesterday = localDate(-1);
    Promise.all([fetchPlan(localDate()), fetchPlan(yesterday)])
      .then(([today, prev]) => {
        if (today) setPlannedKey(outfitKey(today));
        if (prev && prev.wore === null && prev.layoutSlots?.length) {
          setYesterdayPlan({ date: yesterday, layoutSlots: prev.layoutSlots });
        }
      })
      .catch((error) => console.error('[StackedCards] 載入今日計畫失敗:', error));
  }, []);

  const answerYesterday = async (wore: boolean) => {
    if (!yesterdayPlan) return;
    const plan = yesterdayPlan;
    setYesterdayPlan(null);
    try {
      const res = await fetch('/api/reco/daily-outfits/plan', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: plan.date, wore }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      sendFeedback(wore ? 'wore' : 'not_worn', { layoutSlots: plan.layoutSlots }, { date: plan.date });
      toast(wore ? '記下來了，之後會避免太快重複這套' : '收到，謝謝回覆');
    } catch (error) {
      setYesterdayPlan(plan);
      console.error('[StackedCards] 回覆昨天穿搭失敗:', error);
      toast.error('送出失敗，請再試一次');
    }
  };

  // 把最上面那張移到最後；skipped=true 代表使用者沒表態就滑走（弱負面訊號）
  const advanceTopCard = (skipped: boolean) => {
    const top = cards[0];
    if (skipped && top && outfitKey(top) !== plannedKey) {
      sendFeedback('skip', top);
    }
    setCards((prev) => (prev.length > 1 ? [...prev.slice(1), prev[0]] : prev));
  };

  const openDislike = (e: React.MouseEvent) => {
    e.stopPropagation();
    const top = cards[0];
    if (!top || !requireKey(top, '告訴我們你的喜好')) return;
    haptic('light');
    setDislikeReasons([]);
    setDislikeTarget(top);
  };

  const toggleReason = (reason: DislikeReason) => {
    setDislikeReasons((prev) => (prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]));
  };

  const submitDislike = () => {
    if (!dislikeTarget) return;
    sendFeedback('dislike', dislikeTarget, { reasons: dislikeReasons });
    setDislikeTarget(null);
    haptic('success');
    toast('收到，下次推薦會避開這種搭配');
    if (cards[0]?.id === dislikeTarget.id) advanceTopCard(false);
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 80;

    // 左右滑都換下一張（原本只認向左，往右滑等於沒反應）
    if (Math.abs(info.offset.x) > threshold) {
      setExitX(info.offset.x < 0 ? -400 : 400);

      setTimeout(() => {
        advanceTopCard(true);
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

  const handleSave = async (e: React.MouseEvent, outfit: Outfit) => {
    e.stopPropagation();
    if (saveBusy || !onToggleSave) return;
    haptic('medium');
    if (!requireKey(outfit, '收藏推薦')) return;

    setSaveBusy(true);
    try {
      const result = await onToggleSave(outfit);
      sendFeedback(result === 'saved' ? 'save' : 'unsave', outfit);
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

  const handleConfirm = async (e: React.MouseEvent, card: Outfit) => {
    e.stopPropagation();
    if (planBusy) return;
    haptic('medium');

    const key = requireKey(card, '加入今日計畫');
    if (!key) return;

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
            }),
          });

      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) {
        throw new Error(result.error || '保存失敗');
      }

      sendFeedback(isCurrentlyConfirmed ? 'unchoose' : 'choose', card, { date });
      haptic('success');
      toast.success(isCurrentlyConfirmed ? '已取消今日穿搭' : '就穿這套！已加入今日穿搭計畫');
    } catch (error) {
      setPlannedKey(previousKey);
      console.error('[StackedCards] 更新今日穿搭計畫失敗:', error);
      toast.error(isCurrentlyConfirmed ? '取消失敗，請重試' : '保存失敗，請重試');
    } finally {
      setPlanBusy(false);
    }
  };

  const topCard = cards[0];
  const topKey = topCard ? outfitKey(topCard) : null;
  const topConfirmed = topKey !== null && topKey === plannedKey;

  return (
    <div className="px-4">
      {/* 隔天回饋：昨天選的那套有穿嗎 */}
      {yesterdayPlan && (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border bg-white px-3 py-2 text-xs shadow-md">
          <span>
            昨天選的「{yesterdayPlan.layoutSlots.map((s) => s.item?.name).filter(Boolean).join(' + ')}」有穿嗎？
          </span>
          <span className="flex gap-2">
            <button type="button" onClick={() => answerYesterday(true)} className="rounded-full px-3 py-1 text-white" style={{ background: 'var(--vesti-primary)' }}>
              有穿
            </button>
            <button type="button" onClick={() => answerYesterday(false)} className="rounded-full border px-3 py-1">
              沒穿
            </button>
          </span>
        </div>
      )}

    <div className="relative h-[400px] w-auto">
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

                    {/* 左上角：已選為今日穿搭 */}
                    {isConfirmed && (
                      <div
                        className="absolute left-3 top-3 z-30 flex items-center gap-1 rounded-full px-3 py-1 text-xs text-white shadow-md"
                        style={{ background: 'var(--vesti-accent)' }}
                      >
                        <Check className="h-3 w-3" strokeWidth={3} />
                        今天穿這套
                      </div>
                    )}

                    {/* 右上角按鈕組 - z-30 確保在白板佈局元素之上 */}
                    {isTop && (
                      <div className="absolute right-3 top-3 flex gap-2 z-30">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => handleSave(e, card)}
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

      {/* 回饋：要這套 / 不要（對最上面那張） */}
      {topCard && (
        <div className="mx-auto flex gap-3" style={{ maxWidth: 300, marginTop: 48 }}>
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={openDislike}
            aria-label="不要這套"
            className="flex flex-1 items-center justify-center gap-2 rounded-full border bg-white py-3 text-sm shadow-md"
          >
            <ThumbsDown className="h-4 w-4" />
            不要
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={(e) => handleConfirm(e, topCard)}
            disabled={planBusy}
            aria-label={topConfirmed ? '取消今日穿搭' : '選為今日穿搭'}
            aria-pressed={topConfirmed}
            className="flex flex-1 items-center justify-center gap-2 rounded-full py-3 text-sm text-white shadow-md disabled:opacity-50"
            style={{ background: topConfirmed ? 'var(--vesti-accent)' : 'var(--vesti-primary)' }}
          >
            {topConfirmed ? <Check className="h-4 w-4" strokeWidth={3} /> : <ThumbsUp className="h-4 w-4" />}
            {topConfirmed ? '今天穿這套' : '要這套'}
          </motion.button>
        </div>
      )}

      {/* 「不要」的原因（可複選，也可以直接送出） */}
      {dislikeTarget && (
        <BottomSheet label="不要這套的原因" onClose={() => setDislikeTarget(null)}>
          <p className="text-sm font-medium">哪裡不喜歡？（可複選，幫我們下次推得更準）</p>
          <div className="flex flex-wrap gap-2">
            {DISLIKE_REASONS.map((r) => {
              const active = dislikeReasons.includes(r.value);
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => toggleReason(r.value)}
                  aria-pressed={active}
                  className={`rounded-full border px-3 py-2 text-xs ${active ? 'text-white' : ''}`}
                  style={active ? { background: 'var(--vesti-primary)', borderColor: 'var(--vesti-primary)' } : undefined}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setDislikeTarget(null)} className="flex-1 rounded-full border py-3 text-sm">
              取消
            </button>
            <button
              type="button"
              onClick={submitDislike}
              className="flex-1 rounded-full py-3 text-sm text-white"
              style={{ background: 'var(--vesti-primary)' }}
            >
              送出
            </button>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}