import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ShoppingBag, Plus, ChevronLeft } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { ProductDetailView } from './ProductDetailView';
import { toast } from 'sonner';
import { useDebounce } from './hooks/useDebounce';

interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice: number;
  discount: number;
  imageUrl: string;
  brand: string;
  category: string;
  tags?: string[];
}

const discountProducts: Product[] = [
  {
    id: 1,
    name: '經典白T恤',
    price: 623,
    originalPrice: 890,
    discount: 30,
    imageUrl: 'https://images.unsplash.com/photo-1643881080033-e67069c5e4df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aGl0ZSUyMHRzaGlydCUyMGNsb3RoaW5nfGVufDF8fHx8MTc2MjU1NDc2Mnww&ixlib=rb-4.1.0&q=80&w=1080',
    brand: 'BasicWear',
    category: '上衣',
  },
  {
    id: 2,
    name: '直筒牛仔褲',
    price: 1113,
    originalPrice: 1590,
    discount: 30,
    imageUrl: 'https://images.unsplash.com/photo-1602585198422-d795fa9bfd6f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZW5pbSUyMGplYW5zJTIwZmFzaGlvbnxlbnwxfHx8fDE3NjI1NzE5ODN8MA&ixlib=rb-4.1.0&q=80&w=1080',
    brand: 'Denim Co.',
    category: '褲裝',
  },
  {
    id: 3,
    name: '運動休閒鞋',
    price: 1743,
    originalPrice: 2490,
    discount: 30,
    imageUrl: 'https://images.unsplash.com/photo-1650320079970-b4ee8f0dae33?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwc25lYWtlcnMlMjBzaG9lc3xlbnwxfHx8fDE3NjI2MDI5NzB8MA&ixlib=rb-4.1.0&q=80&w=1080',
    brand: 'StepStyle',
    category: '鞋履',
  },
  {
    id: 4,
    name: '羊毛大衣',
    price: 2793,
    originalPrice: 3990,
    discount: 30,
    imageUrl: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aW50ZXIlMjBjb2F0JTIwZmFzaGlvbnxlbnwxfHx8fDE3NjI2MDU4Njh8MA&ixlib=rb-4.1.0&q=80&w=1080',
    brand: 'WarmStyle',
    category: '外套',
  },
  {
    id: 5,
    name: '棒球帽',
    price: 419,
    originalPrice: 599,
    discount: 30,
    imageUrl: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwY2FwJTIwaGF0fGVufDF8fHx8MTc2MjYwNTg5NHww&ixlib=rb-4.1.0&q=80&w=1080',
    brand: 'CapStyle',
    category: '配件',
  },
  {
    id: 6,
    name: '針織毛衣',
    price: 1043,
    originalPrice: 1490,
    discount: 30,
    imageUrl: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrbml0JTIwc3dlYXRlciUyMGZhc2hpb258ZW58MXx8fHwxNzYyNjA1ODY4fDA&ixlib=rb-4.1.0&q=80&w=1080',
    brand: 'CozyKnit',
    category: '上衣',
  },
];

interface DiscountPageProps {
  onBack: () => void;
  onNavigateToTryOn?: () => void;
}

export function DiscountPage({ onBack, onNavigateToTryOn }: DiscountPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleAddToTryOn = (product: Product) => {
    toast.success(`已將 ${product.name} 加入試穿籃`);
  };

  // 使用 debounce 優化搜尋效能
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const filteredProducts = debouncedSearchQuery
    ? discountProducts.filter(
        (product) =>
          product.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          product.brand.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      )
    : discountProducts;

  return (
    <div className="min-h-screen bg-[var(--vesti-background)] pb-20">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-[var(--vesti-background)]/95 backdrop-blur-sm border-b border-border"
      >
        <div className="flex items-center justify-between px-5 py-4">
          <button onClick={onBack} className="flex items-center gap-2 text-[var(--vesti-primary)]">
            <ChevronLeft className="h-5 w-5" strokeWidth={2} />
            <span>返回</span>
          </button>
          <h1 className="text-[var(--vesti-dark)]">限時折扣</h1>
          <div className="w-12" /> {/* Spacer for alignment */}
        </div>
      </motion.header>

      {/* Search Bar */}
      <section className="px-5 pt-5 pb-4">
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--vesti-gray-mid)]"
            strokeWidth={2}
          />
          <input
            type="text"
            placeholder="搜尋折扣商品..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border-2 border-[var(--vesti-gray-mid)]/30 bg-white py-3 pl-12 pr-4 text-[var(--vesti-dark)] placeholder-[var(--vesti-gray-mid)] shadow-sm focus:border-[var(--vesti-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--vesti-primary)]/20"
            style={{ fontSize: 'var(--text-label)' }}
          />
        </div>
      </section>

      {/* Discount Info Banner */}
      <section className="px-5 pb-5">
        <div className="rounded-2xl bg-gradient-to-br from-[var(--vesti-accent)]/10 to-[var(--vesti-accent)]/5 border border-[var(--vesti-accent)]/20 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--vesti-accent)]/20">
              <span className="text-[var(--vesti-accent)]" style={{ fontWeight: 700 }}>30%</span>
            </div>
            <div>
              <h3 className="text-[var(--vesti-dark)]" style={{ fontWeight: 600 }}>全館折扣優惠</h3>
              <p className="text-[var(--vesti-gray-mid)]" style={{ fontSize: 'var(--text-label)' }}>
                限時特惠，把握機會！
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="px-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[var(--vesti-dark)]">折扣商品</h2>
          <span className="text-[var(--vesti-gray-mid)]" style={{ fontSize: 'var(--text-label)' }}>
            {filteredProducts.length} 件商品
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {filteredProducts.map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelectedProduct(product)}
              className="group relative overflow-hidden rounded-3xl bg-card border-2 border-[var(--vesti-gray-mid)]/30 shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-all hover:shadow-md cursor-pointer flex flex-col"
            >
              {/* Discount Badge - Floating Glass Style */}
              <div className="absolute right-3 top-3 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--vesti-primary)] border-2 border-white shadow-[0_8px_20px_rgba(0,0,0,0.25)]">
                <div className="text-center">
                  <div className="text-white" style={{ fontSize: '13px', fontWeight: 800, lineHeight: 1 }}>
                    -{product.discount}%
                  </div>
                  <div className="text-white" style={{ fontSize: '9px', fontWeight: 600, lineHeight: 1.2 }}>
                    OFF
                  </div>
                </div>
              </div>

              {/* Product Image - Much Taller & Dominant */}
              <div className="aspect-[2/3] w-full overflow-hidden bg-[var(--vesti-gray-light)]">
                <ImageWithFallback
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>

              {/* Product Info - Compact and Aligned */}
              <div className="flex flex-col justify-between p-3 bg-white">
                <div className="flex flex-col gap-1 mb-2">
                  <p className="text-[var(--vesti-primary)] truncate" style={{ fontSize: '11px', fontWeight: 600, lineHeight: 1.2 }}>
                    {product.brand}
                  </p>
                  <h4 className="text-[var(--vesti-dark)] line-clamp-2" style={{ fontSize: '14px', fontWeight: 700, lineHeight: 1.3, minHeight: '2.6em' }}>
                    {product.name}
                  </h4>
                </div>

                <div className="flex items-end justify-between gap-2">
                  <div className="flex flex-col min-w-0 flex-1">
                    <span
                      className="text-[var(--vesti-gray-mid)] line-through whitespace-nowrap overflow-hidden text-ellipsis"
                      style={{ fontSize: '10px', lineHeight: 1.2 }}
                    >
                      NT$ {product.originalPrice.toLocaleString()}
                    </span>
                    <span className="text-[var(--vesti-destructive)] whitespace-nowrap" style={{ fontWeight: 800, fontSize: '15px', lineHeight: 1.2 }}>
                      NT$ {product.price.toLocaleString()}
                    </span>
                  </div>

                  {/* Add to Try-On Button - Large & Center Aligned with Text */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToTryOn(product);
                    }}
                    className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[var(--vesti-primary)] text-white shadow-lg transition-all hover:scale-110 hover:shadow-xl active:scale-95 flex-shrink-0"
                  >
                    <ShoppingBag className="h-5 w-5" strokeWidth={2.5} />
                    <div className="absolute -right-0.5 -top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full border-2 border-[var(--vesti-primary)] bg-white text-[var(--vesti-primary)] shadow-sm">
                      <Plus className="h-2.5 w-2.5" strokeWidth={4} />
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <AnimatePresence>
        {selectedProduct && (
          <ProductDetailView
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            onAddToBag={(p) => {
              toast.success(`已將 ${p.name} 加入試穿籃`);
              setSelectedProduct(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}