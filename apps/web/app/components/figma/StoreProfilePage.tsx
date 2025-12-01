import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Search, ShoppingBag, ShoppingCart, Shirt, X, MapPin, Star, Clock } from 'lucide-react';
import { useState } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { ProductDetailView } from './ProductDetailView';
import { toast } from 'sonner';

interface Store {
  id: number;
  name: string;
  imageUrl: string;
  category: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  brand: string;
  category: string;
  tags?: string[];
}

// Mock products for the store
const storeProducts: Product[] = [
  {
    id: 101,
    name: '設計感寬鬆襯衫',
    price: 1290,
    imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=600',
    brand: 'Urban Style',
    category: '上衣',
    tags: ['新品'],
  },
  {
    id: 102,
    name: '高腰落地西裝褲',
    price: 1590,
    imageUrl: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&q=80&w=600',
    brand: 'Urban Style',
    category: '褲裝',
  },
  {
    id: 103,
    name: '簡約皮革單肩包',
    price: 2480,
    imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=600',
    brand: 'Urban Style',
    category: '配件',
    tags: ['熱銷'],
  },
  {
    id: 104,
    name: '針織開襟外套',
    price: 1890,
    imageUrl: 'https://images.unsplash.com/photo-1579566346927-c68383817a25?auto=format&fit=crop&q=80&w=600',
    brand: 'Urban Style',
    category: '外套',
  },
  {
    id: 105,
    name: '法式優雅連身裙',
    price: 2280,
    imageUrl: 'https://images.unsplash.com/photo-1612336307429-8a898d10e223?auto=format&fit=crop&q=80&w=600',
    brand: 'Urban Style',
    category: '裙裝',
  },
  {
    id: 106,
    name: '復古方頭短靴',
    price: 3280,
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=600',
    brand: 'Urban Style',
    category: '鞋履',
  },
];

interface StoreProfilePageProps {
  store: Store;
  onBack: () => void;
  tryOnCount: number;
  onAddToBag: () => void;
  onNavigateToTryOn: () => void;
  onNavigateToCheckout?: () => void;
}

export function StoreProfilePage({ 
  store, 
  onBack,
  tryOnCount,
  onAddToBag,
  onNavigateToTryOn,
  onNavigateToCheckout
}: StoreProfilePageProps) {
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [isFabExpanded, setIsFabExpanded] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const categories = ['全部', '上衣', '褲裝', '外套', '裙裝', '配件'];

  const filteredProducts = selectedCategory === '全部' 
    ? storeProducts 
    : storeProducts.filter(p => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-[var(--vesti-background)] pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[var(--vesti-background)]/95 backdrop-blur-sm transition-all">
        <div className="flex items-center justify-between px-5 py-3">
          <button 
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-sm hover:bg-[var(--vesti-gray-light)] transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-[var(--vesti-dark)]" />
          </button>
          <h1 className="text-lg font-bold text-[var(--vesti-dark)] opacity-90">
            店家資訊
          </h1>
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-sm hover:bg-[var(--vesti-gray-light)] transition-colors">
            <Search className="h-5 w-5 text-[var(--vesti-dark)]" />
          </button>
        </div>
      </header>

      {/* Store Info Section */}
      <div className="px-5 mb-6">
        <div className="relative w-full h-48 rounded-[32px] overflow-hidden shadow-md mb-4">
          <ImageWithFallback
            src={store.imageUrl}
            alt={store.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4 text-white">
            <h2 className="text-2xl font-bold mb-1">{store.name}</h2>
            <div className="flex items-center gap-2 text-sm opacity-90">
              <span className="bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full text-xs">
                {store.category}
              </span>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span>4.8</span>
              </div>
            </div>
          </div>
        </div>

        {/* Store Description */}
        <div className="space-y-3 mb-6">
          <p className="text-[var(--vesti-gray-mid)] text-sm leading-relaxed">
            專注於現代都會女性的穿搭美學，結合極簡設計與舒適質感，打造自信優雅的日常風格。
            從選料到剪裁，我們堅持每一個細節，為您呈現最完美的穿著體驗。
          </p>
          
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-1.5 text-xs text-[var(--vesti-gray-mid)] bg-white px-3 py-1.5 rounded-full border border-[var(--vesti-gray-light)]">
              <MapPin className="w-3.5 h-3.5" />
              <span>台北市信義區松壽路11號</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[var(--vesti-gray-mid)] bg-white px-3 py-1.5 rounded-full border border-[var(--vesti-gray-light)]">
              <Clock className="w-3.5 h-3.5" />
              <span>11:00 - 21:30</span>
            </div>
          </div>
        </div>

        <div className="h-px w-full bg-[var(--vesti-gray-light)] mb-6" />
      </div>

      {/* Filters */}
      <div className="px-5 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-[var(--vesti-dark)] text-white'
                  : 'bg-white text-[var(--vesti-gray-mid)] border border-[var(--vesti-gray-light)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="px-5">
        <div className="grid grid-cols-2 gap-3">
          {filteredProducts.map((product) => (
            <motion.div
              key={product.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedProduct(product)}
              className="overflow-hidden rounded-3xl bg-card border-2 border-[var(--vesti-gray-mid)]/30 shadow-[0_4px_16px_rgba(0,0,0,0.12)] cursor-pointer flex flex-col h-full"
            >
              <div className="aspect-square overflow-hidden">
                <ImageWithFallback
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>
              <div className="flex items-center gap-2 p-3 flex-1">
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <p className="mb-1 text-[var(--vesti-primary)] truncate" style={{ fontSize: 'var(--text-label)' }}>
                    {product.brand}
                  </p>
                  <h4 className="mb-2 text-[var(--vesti-dark)] truncate">{product.name}</h4>
                  <p className="text-[var(--vesti-primary)]" style={{ fontWeight: 700 }}>
                    NT$ {product.price.toLocaleString()}
                  </p>
                </div>
                <div className="mr-1 flex-shrink-0 self-center">
                  <button 
                    className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[var(--vesti-primary)] text-white shadow-md transition-all hover:scale-110 hover:shadow-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToBag();
                      toast.success(`已將 ${product.name} 加入試穿籃`);
                    }}
                  >
                    <ShoppingBag className="h-4 w-4" />
                    <span className="absolute -right-0.5 -top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full border-2 border-[var(--vesti-primary)] bg-white text-[var(--vesti-primary)]" style={{ fontSize: '13px', fontWeight: 700 }}>
                      +
                    </span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductDetailView
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            onAddToBag={(p) => {
              onAddToBag();
              toast.success(`已將 ${p.name} 加入試穿籃`);
              setSelectedProduct(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      {tryOnCount > 0 && (
        <div className="fixed bottom-24 right-5 z-50 flex flex-col items-end p-2">
          <AnimatePresence>
            {isFabExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                onClick={() => setIsFabExpanded(false)}
                className="fixed inset-0 bg-black/40 -z-10"
                style={{ top: 0, left: 0, right: 0, bottom: 0 }}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isFabExpanded && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ 
                  duration: 0.2,
                  ease: [0.4, 0, 0.2, 1]
                }}
                className="mb-3 flex flex-col gap-3 items-end"
                style={{ overflow: 'visible' }}
              >
                {onNavigateToCheckout && (
                  <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ 
                      duration: 0.2,
                      ease: [0.4, 0, 0.2, 1],
                      delay: 0.08
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setIsFabExpanded(false);
                      onNavigateToCheckout();
                    }}
                    className="flex items-center justify-between gap-3 rounded-full bg-white pr-5 pl-3 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.15)] border-2 border-[var(--vesti-primary)]/30 transition-all hover:shadow-[0_12px_32px_rgba(0,0,0,0.2)] w-[160px]"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--vesti-primary)] flex-shrink-0">
                      <ShoppingCart className="h-5 w-5 text-white" strokeWidth={2.5} />
                    </div>
                    <span className="text-[var(--vesti-dark)] whitespace-nowrap flex-1 text-center" style={{ fontWeight: 600 }}>
                      前往結帳
                    </span>
                  </motion.button>
                )}

                <motion.button
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ 
                    duration: 0.2,
                    ease: [0.4, 0, 0.2, 1],
                    delay: 0
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setIsFabExpanded(false);
                    onNavigateToTryOn();
                  }}
                  className="flex items-center justify-between gap-3 rounded-full bg-white pr-5 pl-3 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.15)] border-2 border-[var(--vesti-primary)]/30 transition-all hover:shadow-[0_12px_32px_rgba(0,0,0,0.2)] w-[160px]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--vesti-primary)] flex-shrink-0">
                    <Shirt className="h-5 w-5 text-white" strokeWidth={2.5} />
                  </div>
                  <span className="text-[var(--vesti-dark)] whitespace-nowrap flex-1 text-center" style={{ fontWeight: 600 }}>
                    試穿籃 ({tryOnCount})
                  </span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--vesti-accent)] text-white shadow-[0_12px_32px_rgba(221,129,176,0.4)] transition-all hover:shadow-[0_16px_40px_rgba(221,129,176,0.5)] hover:scale-105 active:scale-95"
            onClick={() => setIsFabExpanded(!isFabExpanded)}
          >
            <AnimatePresence mode="wait">
              {isFabExpanded ? (
                <motion.div
                  key="close"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <X className="h-5 w-5" strokeWidth={2.5} />
                </motion.div>
              ) : (
                <motion.div
                  key="bag"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <ShoppingBag className="h-5 w-5" strokeWidth={2.5} />
                </motion.div>
              )}
            </AnimatePresence>
            
            {!isFabExpanded && (
              <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white border-2 border-[var(--vesti-accent)] shadow-md">
                <span style={{ fontSize: '10px', fontWeight: 700 }} className="text-[var(--vesti-accent)]">
                  {tryOnCount}
                </span>
              </div>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
