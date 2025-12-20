import { useState, useEffect, forwardRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { Check, ShoppingCart, RotateCw, Sparkles, X, Sun, Cloud, CloudRain, Snowflake, Wind } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner';

// -------------------
// Types
// -------------------
interface OutfitItem {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  brand: string;
  category: string;
}

interface OutfitSet {
  id: number;
  imageUrl: string;
  styleName: string;
  description: string;
  price: number;
  items: OutfitItem[];
  weatherSuitable?: {
    tempMin: number;
    tempMax: number;
    weatherTypes: ('sunny' | 'cloudy' | 'rainy' | 'windy' | 'snowy')[];
  };
}

interface DeckCard {
  uniqueId: string;
  data: OutfitSet;
  isNew: boolean;
}

interface OutfitPackCardProps {
  outfits: OutfitSet[];
  onSwitchToShopping?: () => void;
}

interface StyleCardProps {
  outfit: OutfitSet;
  index: number;
  total: number;
  onFlip: () => void;
  isFlipped: boolean;
  selectedItems: number[];
  onToggleItem: (id: number) => void;
  onAddToBag: () => void;
  onBuy: () => void;
  uniqueId: string;
  isNew: boolean;
  onSwipe: (direction: 'left' | 'right') => void;
  exitX?: number;
  dragConstraints?: any;
}

// -------------------
// Components
// -------------------

// 1. VESTI INSTANT CAMERA Dispenser
const CardDispenser = ({ onDispense, isDispensing }: { onDispense: () => void, isDispensing: boolean }) => {
  return (
    <div className="relative z-50 w-full flex flex-col items-center perspective-[1200px] pointer-events-none">
      
      {/* Camera Body */}
      <motion.div 
        initial={{ rotateX: 5, opacity: 0, y: -20 }}
        animate={{ rotateX: 5, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 50, damping: 20 }}
        className="relative w-[360px] h-[120px] rounded-[24px] bg-gradient-to-b from-[#FEFDFB] to-[#F5F4F0] shadow-[0_20px_50px_rgba(0,0,0,0.15),0_8px_20px_rgba(0,0,0,0.08),inset_0_1px_2px_rgba(255,255,255,0.8)] border border-white/50 pointer-events-auto"
        style={{ transformStyle: 'preserve-3d' }}
      >
         {/* --- Surface Details --- */}
         <div className="absolute inset-0 rounded-[24px] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.08] mix-blend-multiply pointer-events-none" />
         <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />
         <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-[#EBF5FF]/10 to-transparent pointer-events-none rounded-t-[24px]" />

         {/* Pseudo-3D Bottom Thickness */}
         <div 
            className="absolute -bottom-[6px] left-[2px] right-[2px] h-[10px] bg-[#E6E5E0] rounded-b-[24px] -z-10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]"
            style={{ transform: 'translateZ(-10px)' }}
         />

         {/* --- Controls Interface --- */}
         <div className="absolute inset-0 flex items-center justify-between px-8">
            
            {/* Left: Indicators */}
            <div className="flex flex-col gap-3">
               <div className="group flex items-center gap-2">
                  <div className="relative w-2 h-2">
                     <div className={`absolute inset-0 rounded-full blur-[4px] ${isDispensing ? 'bg-green-400 scale-150' : 'bg-[#4ADE80] opacity-40'}`} />
                     <div className={`relative w-full h-full rounded-full shadow-[inset_0_1px_1px_rgba(0,0,0,0.2)] ${isDispensing ? 'bg-green-400 animate-pulse' : 'bg-[#4ADE80]'}`}>
                        <div className="absolute top-[1px] left-[1px] w-[2px] h-[2px] bg-white/80 rounded-full blur-[0.5px]" />
                     </div>
                  </div>
                  <span className="text-[9px] font-bold text-[#A0A09C] tracking-widest group-hover:text-[#80807C] transition-colors">READY</span>
               </div>
               <div className="group flex items-center gap-2">
                  <div className="relative w-2 h-2">
                     <div className="absolute inset-0 rounded-full bg-[#60A5FA] blur-[4px] opacity-30" />
                     <div className="relative w-full h-full rounded-full bg-[#60A5FA] shadow-[inset_0_1px_1px_rgba(0,0,0,0.2)]">
                        <div className="absolute top-[1px] left-[1px] w-[2px] h-[2px] bg-white/80 rounded-full blur-[0.5px]" />
                     </div>
                  </div>
                  <span className="text-[9px] font-bold text-[#A0A09C] tracking-widest group-hover:text-[#80807C] transition-colors">LINK</span>
               </div>
            </div>

            {/* Center: Lens */}
            <div className="flex flex-col items-center gap-2.5 mt-1">
               <div className="relative w-[72px] h-[72px] rounded-full bg-[#F2F2F0] shadow-[inset_0_2px_6px_rgba(0,0,0,0.08),0_1px_0_white] flex items-center justify-center">
                  <div className="absolute inset-[4px] rounded-full border border-[#E8E8E4]" />
                  <div className="w-[56px] h-[56px] rounded-full bg-[#1A1A1A] shadow-[0_2px_8px_rgba(0,0,0,0.15)] flex items-center justify-center relative overflow-hidden">
                     <div className="absolute inset-0 rounded-full border-[6px] border-[#222] opacity-50" />
                     <div className="absolute inset-[8px] rounded-full border-[4px] border-[#282828] opacity-50" />
                     <div className="relative w-[32px] h-[32px] bg-[#080808] rounded-full shadow-[inset_0_4px_12px_rgba(0,0,0,0.8)]">
                        <div className="absolute top-2 left-2 w-4 h-3 bg-gradient-to-br from-white/30 to-blue-400/10 rounded-full rotate-45 blur-[1px]" />
                        <div className="absolute bottom-2 right-3 w-1.5 h-1.5 bg-blue-500/40 rounded-full blur-[0.5px]" />
                     </div>
                  </div>
               </div>
               <span className="text-[9px] font-medium text-[#D0CFC8] tracking-[0.25em] drop-shadow-[0_1px_1px_rgba(255,255,255,1)] shadow-inner-text">VESTI</span>
            </div>

            {/* Right: Button */}
            <div className="relative w-12 h-12 flex items-center justify-center">
               <div className="absolute inset-0 bg-[#F2F2F0] rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]" />
               <motion.button
                  onClick={onDispense}
                  disabled={isDispensing}
                  whileTap={{ scale: 0.95, y: 2 }}
                  className="relative w-9 h-9 rounded-full bg-gradient-to-br from-[#4A7C7E] to-[#5D9597] shadow-[0_3px_8px_rgba(74,124,126,0.3),inset_0_1px_2px_rgba(255,255,255,0.3)] flex items-center justify-center group active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] cursor-pointer"
               >
                   <div className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-2 bg-white/20 rounded-full blur-[1px]" />
                   {isDispensing && <Sparkles className="w-4 h-4 text-white animate-spin" />}
               </motion.button>
            </div>
         </div>

         {/* --- Output Slot (The Chin) --- */}
         <div 
            className="absolute -bottom-[28px] left-1/2 -translate-x-1/2 w-[320px] h-[28px] bg-[#F0EFE9] rounded-b-[12px] border-x border-b border-[#E6E5E0] shadow-[0_12px_24px_-8px_rgba(0,0,0,0.1)] z-[-1] flex items-end justify-center pb-0 overflow-hidden"
         >
             <div className="w-full h-[2px] bg-[#D8D8D4] absolute top-0" />
             <div className="w-[300px] h-[8px] bg-[#121212] mb-2 rounded-sm shadow-[inset_0_2px_6px_rgba(0,0,0,0.9)] relative overflow-hidden">
                 <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/5" />
                 <div className="absolute bottom-0 w-full h-[1px] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjEiPjxwYXRoIGQ9Ik0wIDBoMnYxaC0yeiIgZmlsbD0iIzIyMiIvPjwvc3ZnPg==')] opacity-30" />
             </div>
         </div>

      </motion.div>
    </div>
  );
};

// 2. Style Card
const StyleCard = forwardRef<HTMLDivElement, StyleCardProps>(({ 
  outfit, 
  index, 
  total, 
  onFlip, 
  isFlipped,
  selectedItems,
  onToggleItem, 
  onAddToBag, 
  onBuy, 
  uniqueId, 
  isNew, 
  onSwipe,
  exitX,
  dragConstraints
}, ref) => {
  const isTop = index === 0;
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  
  const randomRotate = (index % 2 === 0 ? 1 : -1) * ((index * 0.8) % 2);

  const handleDragEnd = (_: any, info: any) => {
    const threshold = 80;
    if (info.offset.x > threshold) {
      onSwipe('right');
    } else if (info.offset.x < -threshold) {
      onSwipe('left');
    }
  };

  const getWeatherIcon = (types: string[] = []) => {
    if (types.includes('sunny')) return <Sun className="h-4 w-4" />;
    if (types.includes('rainy')) return <CloudRain className="h-4 w-4" />;
    if (types.includes('snowy')) return <Snowflake className="h-4 w-4" />;
    if (types.includes('windy')) return <Wind className="h-4 w-4" />;
    return <Cloud className="h-4 w-4" />;
  };

  const selectedTotal = outfit.items
      .filter(item => selectedItems.includes(item.id))
      .reduce((sum, item) => sum + item.price, 0);

  return (
    <motion.div
      ref={ref}
      layoutId={uniqueId}
      style={{
        width: 340, 
        height: 520, 
        zIndex: total - index, 
        position: 'absolute',
        top: 0,
        x: isTop && (!exitX) ? x : 0,
        rotate: isTop && (!exitX) ? rotate : randomRotate,
        opacity: isTop && (!exitX) ? opacity : 1,
      }}
      // IMPORTANT: Start heavily negative Y to be "inside" the machine. 
      // The container clipping will hide the top part.
      initial={isNew ? { y: -550, opacity: 1, scale: 0.95 } : { scale: 1 - index * 0.04, y: index * 12 + 85 }}
      animate={{ 
        scale: isTop && exitX ? 0.9 : (1 - index * 0.04),
        y: isTop && exitX ? 85 : (index * 12 + 85), 
        x: isTop && exitX ? exitX : 0,
        rotate: isTop && exitX ? (exitX > 0 ? 15 : -15) : (isTop ? 0 : randomRotate),
        opacity: isTop && exitX ? 0 : 1,
        filter: index === 0 ? 'brightness(100%)' : 'brightness(96%)',
      }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      transition={{
        type: "spring",
        stiffness: isNew ? 120 : 200, // Slower stiffness for extrusion
        damping: isNew ? 18 : 25,    // Higher damping to prevent bounce-back into slot
        mass: 1,
        delay: isNew ? index * 0.08 : 0 // Stagger if multiple (though we usually do 1 deck at a time)
      }}
      drag={isTop && !isFlipped ? "x" : false}
      dragConstraints={dragConstraints || { left: 0, right: 0 }}
      dragElastic={0.08}
      onDragEnd={handleDragEnd}
      whileTap={isTop && !isFlipped ? { cursor: 'grabbing', scale: 1.02 } : {}}
      className="origin-top bg-white shadow-[0_12px_32px_rgba(0,0,0,0.15)] rounded-[24px] overflow-hidden border border-gray-200"
    >
      <div className="relative w-full h-full perspective-1000" style={{ transformStyle: 'preserve-3d' }}>
        <motion.div
          className="relative w-full h-full"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          {/* --- FRONT SIDE --- */}
          <div 
            className="absolute inset-0 backface-hidden flex flex-col bg-white"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="relative h-full w-full bg-gray-100 overflow-hidden">
              <ImageWithFallback src={outfit.imageUrl} alt={outfit.styleName} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/60 pointer-events-none" />
              
              {outfit.weatherSuitable && (
                <div 
                  onClick={(e) => { e.stopPropagation(); onFlip(); }}
                  className="absolute top-4 left-4 flex items-center gap-1.5 text-xs font-bold text-gray-800 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-md z-20 border border-white/50 cursor-pointer hover:bg-white transition-colors"
                >
                  {getWeatherIcon(outfit.weatherSuitable.weatherTypes)}
                  <span>{outfit.weatherSuitable.tempMin}-{outfit.weatherSuitable.tempMax}°C</span>
                </div>
              )}

              <button 
                onClick={(e) => { e.stopPropagation(); onFlip(); }}
                className="absolute top-4 right-4 p-2.5 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md text-white transition-colors border border-white/20 z-20"
              >
                <RotateCw size={18} />
              </button>

              <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-20">
                 <div className="flex items-end justify-between mb-2">
                    <h3 className="text-2xl font-bold text-white drop-shadow-lg leading-tight">{outfit.styleName}</h3>
                    <p className="text-xl font-bold text-[#F9FAFB] drop-shadow-lg bg-white/20 px-3 py-1 rounded-lg backdrop-blur-md border border-white/20">NT$ {outfit.price.toLocaleString()}</p>
                 </div>
                 <p className="text-sm text-white/90 line-clamp-2 drop-shadow-md mb-2 opacity-90">{outfit.description}</p>
                 
                 <div className="flex items-center gap-2 mt-3 opacity-70 text-xs font-medium">
                    <div className="w-4 h-4 rounded-full border border-white flex items-center justify-center"><span className="text-[8px]">i</span></div>
                    點擊翻轉查看單品
                 </div>
              </div>
            </div>
          </div>

          {/* --- BACK SIDE --- */}
          <div 
            className="absolute inset-0 backface-hidden flex flex-col bg-white rounded-[24px] overflow-hidden border border-gray-100"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
             <div className="h-14 border-b border-gray-100 flex items-center justify-between px-5 bg-gray-50/50">
               <span className="text-base font-bold text-[var(--vesti-dark)]">此套裝包含 ({outfit.items.length})</span>
               <button onClick={(e) => { e.stopPropagation(); onFlip(); }} className="p-1.5 hover:bg-gray-200 rounded-full transition-colors"><X size={20} className="text-gray-500" /></button>
             </div>

             <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
               {outfit.items.map((item) => {
                 const isSelected = selectedItems.includes(item.id);
                 return (
                   <div 
                     key={item.id}
                     onClick={(e) => { e.stopPropagation(); onToggleItem(item.id); }}
                     className={`relative flex items-center gap-3 p-3 rounded-[16px] transition-all cursor-pointer overflow-hidden group ${
                       isSelected 
                         ? 'bg-[var(--vesti-primary)]/5 border-2 border-[var(--vesti-primary)] shadow-[inset_0_2px_8px_rgba(0,0,0,0.05)]' 
                         : 'bg-white border-2 border-[var(--vesti-gray-mid)]/30 shadow-[4px_4px_16px_rgba(41,108,125,0.15)] hover:shadow-[6px_6px_20px_rgba(41,108,125,0.2)] hover:-translate-y-0.5'
                     }`}
                     style={{ transformStyle: 'preserve-3d' }}
                   >
                     <div className="h-14 w-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-[var(--vesti-gray-mid)]/20 shadow-inner">
                       <ImageWithFallback src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                     </div>
                     <div className="flex-1 min-w-0">
                       <p className="text-sm font-bold text-[var(--vesti-dark)] truncate">{item.brand}</p>
                       <p className="text-xs text-gray-500 truncate mb-0.5">{item.name}</p>
                       <p className="text-sm font-bold text-[var(--vesti-primary)]">NT$ {item.price}</p>
                     </div>
                     <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-[var(--vesti-primary)] border-[var(--vesti-primary)] scale-110 shadow-md' : 'border-gray-300 bg-white shadow-sm'}`}>
                       {isSelected && <Check size={14} className="text-white" />}
                     </div>
                     
                     {/* 3D border overlay */}
                     <div 
                        className="pointer-events-none absolute inset-0 rounded-[16px] border border-white/20"
                        style={{
                           boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.4)',
                        }}
                     />
                   </div>
                 );
               })}
             </div>

             <div className="p-5 border-t border-gray-100 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
               <div className="flex items-center justify-between mb-3 px-1">
                 <span className="text-xs text-gray-500 font-medium">已選: {selectedItems.length} 件</span>
                 <span className="text-lg font-bold text-[var(--vesti-primary)]">NT$ {selectedTotal.toLocaleString()}</span>
               </div>
               <div className="flex gap-3">
                 <button onClick={(e) => { e.stopPropagation(); onAddToBag(); }} className="flex-1 py-3 px-4 text-sm font-bold rounded-xl border-2 border-[var(--vesti-primary)] text-[var(--vesti-primary)] hover:bg-[var(--vesti-primary)]/5 transition-colors">加入試穿</button>
                 <button onClick={(e) => { e.stopPropagation(); onBuy(); }} className="flex-1 py-3 px-4 text-sm font-bold rounded-xl bg-[var(--vesti-primary)] text-white hover:opacity-90 shadow-lg hover:shadow-[var(--vesti-primary)]/30 transition-all flex items-center justify-center gap-2"><ShoppingCart size={16} />立即購買</button>
               </div>
             </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
});

StyleCard.displayName = 'StyleCard';

// -------------------
// Main Component
// -------------------
export function OutfitPackCard({ outfits, onSwitchToShopping }: OutfitPackCardProps) {
  const [cards, setCards] = useState<DeckCard[]>([]);
  const [flippedCardId, setFlippedCardId] = useState<string | null>(null);
  const [selectedItemsMap, setSelectedItemsMap] = useState<Record<number, number[]>>({});
  const [isDispensing, setIsDispensing] = useState(false);
  const [exitX, setExitX] = useState(0);

  useEffect(() => {
    const initialMap: Record<number, number[]> = {};
    outfits.forEach(o => {
      initialMap[o.id] = o.items.map(i => i.id);
    });
    setSelectedItemsMap(initialMap);
  }, [outfits]);

  const handleDispense = () => {
    if (isDispensing) return;
    setIsDispensing(true);
    setFlippedCardId(null);
    setCards([]); 
    
    setTimeout(() => {
      const sourcePool = [...outfits, ...outfits, ...outfits].slice(0, 10);
      const newCards: DeckCard[] = sourcePool.map((outfit) => ({
        uniqueId: crypto.randomUUID(),
        data: outfit,
        isNew: true
      }));
      setCards(newCards);
      setIsDispensing(false);
      
      setTimeout(() => {
        setCards(prev => prev.map(c => ({ ...c, isNew: false })));
      }, 1000); 
    }, 250); // Reduced delay for snappier feel
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    if (cards.length === 0) return;
    
    // Trigger exit animation
    setExitX(direction === 'left' ? -400 : 400);
    setFlippedCardId(null);

    // Wait for animation then rotate
    setTimeout(() => {
      setCards(prev => {
        if (prev.length === 0) return prev;
        const cleanPrev = prev.map(c => ({ ...c, isNew: false }));
        const [first, ...rest] = cleanPrev;
        return [...rest, first];
      });
      setExitX(0);
    }, 250);
  };

  const handleFlip = (uniqueId: string) => {
    setFlippedCardId(prev => prev === uniqueId ? null : uniqueId);
  };

  const handleToggleItem = (outfitId: number, itemId: number) => {
    setSelectedItemsMap(prev => {
      const current = prev[outfitId] || [];
      const exists = current.includes(itemId);
      return {
        ...prev,
        [outfitId]: exists ? current.filter(id => id !== itemId) : [...current, itemId]
      };
    });
  };

  return (
    <div 
      className="w-full min-h-[85vh] flex flex-col items-center relative pb-10 bg-gradient-to-b from-[#F9F8F5] to-[#F0EFE9]"
    >
      {/* 1. VESTI INSTANT CAMERA Dispenser */}
      <div className="w-full flex justify-center z-50 relative pt-2 mb-[-45px]">
        <CardDispenser onDispense={handleDispense} isDispensing={isDispensing} />
      </div>

      {/* 2. Card Stack Wrapper */}
      <div className="relative w-[340px] h-[600px] flex justify-center z-10" style={{ clipPath: 'inset(0px -100% -100% -100%)' }}>
        <div className="relative w-full h-full">
           <AnimatePresence mode='popLayout'>
             {cards.length > 0 ? (
               cards.slice(0, 4).map((card, index) => (
                 <StyleCard 
                   key={card.uniqueId}
                   uniqueId={card.uniqueId}
                   outfit={card.data}
                   index={index}
                   total={cards.length}
                   onFlip={() => handleFlip(card.uniqueId)}
                   isFlipped={flippedCardId === card.uniqueId}
                   selectedItems={selectedItemsMap[card.data.id] || []}
                   onToggleItem={(itemId) => handleToggleItem(card.data.id, itemId)}
                   onAddToBag={() => toast.success('已加入試穿籃 🛒')}
                   onBuy={() => toast.success('前往結帳... 💳')}
                   isNew={card.isNew}
                   onSwipe={handleSwipe}
                   exitX={exitX}
                   dragConstraints={{ left: 0, right: 0 }}
                 />
               ))
             ) : (
               // Empty State
               <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 pt-32"
               >
                  <p className="text-xs font-bold tracking-wide text-[#C4A48C] uppercase animate-pulse">Press button to dispense</p>
               </motion.div>
             )}
           </AnimatePresence>
        </div>
      </div>
      
      {/* Footer Hint */}
      {cards.length > 0 && (
        <motion.div 
           initial={{ opacity: 0 }} 
           animate={{ opacity: 1 }}
           className="mt-4 text-[#C4A48C] text-[9px] font-bold tracking-[0.2em] uppercase"
        >
           左右滑動切換 • 點擊查看
        </motion.div>
      )}
    </div>
  );
}
