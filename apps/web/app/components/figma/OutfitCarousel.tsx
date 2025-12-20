import { useState, useRef, useEffect } from 'react';
import { OutfitCard } from './OutfitCard';
import { motion, AnimatePresence } from 'motion/react';

interface Outfit {
  id: number;
  imageUrl: string;
  styleName: string;
  description: string;
}

interface OutfitCarouselProps {
  outfits: Outfit[];
}

export function OutfitCarousel({ outfits }: OutfitCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const autoPlayRef = useRef<NodeJS.Timeout>();

  // Auto-play functionality
  useEffect(() => {
    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % outfits.length);
    }, 5000);

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [outfits.length]);

  // Reset auto-play on manual interaction
  const resetAutoPlay = () => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }
    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % outfits.length);
    }, 5000);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentIndex < outfits.length - 1) {
      setCurrentIndex(currentIndex + 1);
      resetAutoPlay();
    }
    if (isRightSwipe && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      resetAutoPlay();
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  return (
    <div className="relative">
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <OutfitCard
              imageUrl={outfits[currentIndex].imageUrl}
              styleName={outfits[currentIndex].styleName}
              description={outfits[currentIndex].description}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots Indicator */}
      <div className="mt-4 flex justify-center gap-2">
        {outfits.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentIndex(index);
              resetAutoPlay();
            }}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentIndex 
                ? 'w-6 bg-[var(--fashion-gold)]' 
                : 'w-2 bg-[var(--fashion-gray-mid)]/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
