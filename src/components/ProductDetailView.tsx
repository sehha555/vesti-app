import { motion } from 'motion/react';
import { ChevronLeft, Heart, ShoppingBag, Star, Share2 } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useState } from 'react';

interface Product {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  brand: string;
  category: string;
  tags?: string[];
  originalPrice?: number;
  description?: string;
}

interface ProductDetailViewProps {
  product: Product;
  onClose: () => void;
  onAddToBag: (product: Product) => void;
}

export function ProductDetailView({ product, onClose, onAddToBag }: ProductDetailViewProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [selectedSize, setSelectedSize] = useState('M');
  
  const sizes = ['S', 'M', 'L', 'XL'];

  return (
    <motion.div
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[60] bg-white flex flex-col overflow-hidden h-[100dvh]"
    >
      {/* Header Actions */}
      <div className="absolute top-0 left-0 right-0 z-10 p-5 pt-12 flex items-center justify-between pointer-events-none">
        <button 
          onClick={onClose}
          className="pointer-events-auto w-10 h-10 rounded-full bg-white/80 backdrop-blur-md border border-gray-100 shadow-sm flex items-center justify-center text-[var(--vesti-dark)] hover:bg-white transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="flex gap-3 pointer-events-auto">
           <button 
            className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md border border-gray-100 shadow-sm flex items-center justify-center text-[var(--vesti-dark)] hover:bg-white transition-colors"
          >
            <Share2 size={20} />
          </button>
          <button 
            onClick={() => setIsLiked(!isLiked)}
            className={`w-10 h-10 rounded-full bg-white/80 backdrop-blur-md border border-gray-100 shadow-sm flex items-center justify-center transition-colors ${isLiked ? 'text-red-500' : 'text-[var(--vesti-dark)]'}`}
          >
            <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      {/* Main Image Area */}
      <div className="relative h-[50vh] w-full bg-[#F4F4F4]">
         <ImageWithFallback 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-full object-cover"
         />
         {/* Pagination Dots (Mock) */}
         <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-2 z-10">
            <div className="w-2 h-2 rounded-full bg-[var(--vesti-primary)]" />
            <div className="w-2 h-2 rounded-full bg-black/10" />
            <div className="w-2 h-2 rounded-full bg-black/10" />
            <div className="w-2 h-2 rounded-full bg-black/10" />
         </div>
         {/* Gradient overlay for content transition */}
         <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
      </div>

      {/* Content Sheet */}
      <div className="flex-1 -mt-8 relative bg-white rounded-t-[32px] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] flex flex-col z-20">
         {/* Drag Handle */}
         <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-3 mb-6" />
         
         <div className="px-6 flex-1 overflow-y-auto pb-32 scrollbar-hide">
            {/* Header Info */}
            <div className="flex items-start justify-between mb-2">
               <div>
                  <div className="flex gap-2 mb-2">
                     {product.tags?.map(tag => (
                        <span key={tag} className="px-2.5 py-1 rounded-full bg-[var(--vesti-primary)]/10 text-[var(--vesti-primary)] text-[10px] font-bold uppercase tracking-wider">
                           {tag}
                        </span>
                     ))}
                     {!product.tags?.length && (
                        <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                           Classic
                        </span>
                     )}
                  </div>
                  <h2 className="text-2xl font-bold text-[var(--vesti-dark)] mb-1">{product.name}</h2>
                  <p className="text-gray-500 font-medium text-sm">{product.brand} • {product.category}</p>
               </div>
               <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100">
                  <Star size={14} className="fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-bold text-yellow-700">5.0</span>
                  <span className="text-xs text-yellow-600/60">(284)</span>
               </div>
            </div>

            {/* Description */}
            <div className="mt-6">
               <h3 className="text-sm font-bold text-[var(--vesti-dark)] mb-2">商品描述</h3>
               <p className="text-gray-500 text-sm leading-relaxed">
                  {product.description || '這款精緻的單品採用高品質面料製作，剪裁俐落，適合各種場合穿著。舒適透氣，展現您的個人風格。'}
                  <button className="ml-1 text-[var(--vesti-primary)] font-bold text-sm">閱讀更多</button>
               </p>
            </div>

            {/* Size Selector */}
            <div className="mt-6">
               <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-[var(--vesti-dark)]">選擇尺寸</h3>
                  <button className="text-xs text-gray-400 hover:text-[var(--vesti-primary)]">尺寸表</button>
               </div>
               <div className="flex gap-3">
                  {sizes.map(size => (
                     <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`w-12 h-12 rounded-full border flex items-center justify-center text-sm font-bold transition-all ${
                           selectedSize === size
                              ? 'border-[var(--vesti-primary)] bg-[var(--vesti-primary)] text-white shadow-md'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                     >
                        {size}
                     </button>
                  ))}
               </div>
            </div>
         </div>

         {/* Bottom Bar */}
         <div className="absolute bottom-0 left-0 right-0 p-5 bg-white border-t border-gray-100 pb-10 shadow-[0_-4px_16px_rgba(0,0,0,0.03)] z-30">
            <div className="flex items-center gap-5">
               <div className="flex flex-col">
                  <span className="text-xs text-gray-400 font-medium">總金額</span>
                  <span className="text-2xl font-bold text-[var(--vesti-dark)]">NT$ {product.price.toLocaleString()}</span>
               </div>
               
               <button 
                  onClick={() => onAddToBag(product)}
                  className="flex-1 h-14 bg-[var(--vesti-dark)] rounded-[20px] flex items-center justify-between px-6 text-white shadow-lg shadow-gray-200 hover:scale-[1.02] active:scale-[0.98] transition-all group"
               >
                  <span className="font-bold text-base">加入試穿籃</span>
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                     <ShoppingBag size={18} />
                  </div>
               </button>
            </div>
         </div>
      </div>
    </motion.div>
  );
}
