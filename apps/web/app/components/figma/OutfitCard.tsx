import { Check, Bookmark } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useState } from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

interface OutfitCardProps {
  imageUrl: string;
  styleName: string;
  description: string;
}

export function OutfitCard({ imageUrl, styleName, description }: OutfitCardProps) {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleConfirm = () => {
    setIsConfirmed(true);
    toast.success('已加入今日穿搭計畫 ✓');
    setTimeout(() => setIsConfirmed(false), 1500);
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    if (!isSaved) {
      toast.success('已收藏穿搭靈感 🔖');
    }
  };

  return (
    <motion.div 
      className="mx-5 overflow-hidden rounded-[20px] bg-card border-2 border-[var(--vesti-gray-mid)]/30 shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Image Section */}
      <div className="relative h-[300px] overflow-hidden">
        <ImageWithFallback
          src={imageUrl}
          alt={styleName}
          className="h-full w-full object-cover"
        />
        
        {/* Confirm Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleConfirm}
          className={`absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition-all duration-300 ${
            isConfirmed 
              ? 'bg-[var(--fashion-success)]' 
              : 'bg-white hover:bg-[var(--fashion-gray-light)]'
          }`}
        >
          <Check 
            className={`h-5 w-5 transition-colors ${
              isConfirmed ? 'text-white' : 'text-[var(--fashion-dark)]'
            }`} 
            strokeWidth={2.5}
          />
        </motion.button>

        {/* Save Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSave}
          className="absolute right-4 top-16 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg transition-all duration-300 hover:bg-[var(--fashion-gray-light)]"
        >
          <Bookmark 
            className={`h-5 w-5 transition-all ${
              isSaved 
                ? 'fill-[var(--fashion-gold)] text-[var(--fashion-gold)]' 
                : 'text-[var(--fashion-dark)]'
            }`}
            strokeWidth={2}
          />
        </motion.button>
      </div>

      {/* Info Section */}
      <div className="p-5">
        <h3 className="mb-2 text-[var(--fashion-dark)]">{styleName}</h3>
        <p className="leading-relaxed text-[var(--fashion-gray-mid)]">
          {description}
        </p>
      </div>
    </motion.div>
  );
}
