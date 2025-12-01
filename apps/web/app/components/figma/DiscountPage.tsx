import { useState } from 'react';
import { motion } from 'motion/react';
import { Search, ShoppingBag, Plus, ChevronLeft } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner';

interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice: number;
  discount: number;
  imageUrl: string;
  brand: string;
  category: string;
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

  const handleAddToTryOn = (product: Product) => {
    toast.success(`已將 ${product.name} 加入試穿籃`);
  };

  const filteredProducts = searchQuery
    ? discountProducts.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.brand.toLowerCase().includes(searchQuery.toLowerCase())
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

        <div className="grid grid-cols-2 gap-4">
          {filteredProducts.map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileTap={{ scale: 0.97 }}
              className="group relative overflow-hidden rounded-2xl bg-white border-2 border-[var(--vesti-gray-mid)]/30 shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-shadow hover:shadow-md"
            >
              {/* Discount Badge */}
              <div className="absolute left-2 top-2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--vesti-destructive)] shadow-md">
                <div className="text-center">
                  <div className="text-white" style={{ fontSize: '10px', fontWeight: 700, lineHeight: 1 }}>
                    -{product.discount}%
                  </div>
                  <div className="text-white" style={{ fontSize: '8px', fontWeight: 500, lineHeight: 1.2 }}>
                    OFF
                  </div>
                </div>
              </div>

              {/* Product Image */}
              <div className="aspect-square overflow-hidden bg-[var(--vesti-gray-light)]">
                <ImageWithFallback
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              {/* Product Info */}
              <div className="p-3">
                <p className="mb-1 text-[var(--vesti-primary)]" style={{ fontSize: 'var(--text-label)' }}>
                  {product.brand}
                </p>
                <h4 className="mb-2 text-[var(--vesti-dark)] line-clamp-1" style={{ fontSize: 'var(--text-label)' }}>
                  {product.name}
                </h4>

                {/* Price and Button */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-[var(--vesti-destructive)]" style={{ fontWeight: 700 }}>
                      NT$ {product.price.toLocaleString()}
                    </span>
                    <span
                      className="text-[var(--vesti-gray-mid)] line-through"
                      style={{ fontSize: 'var(--text-label)' }}
                    >
                      NT$ {product.originalPrice.toLocaleString()}
                    </span>
                  </div>

                  {/* Add to Try-On Button */}
                  <button
                    onClick={() => handleAddToTryOn(product)}
                    className="group/btn flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--vesti-primary)] text-white transition-all hover:bg-[var(--vesti-primary)]/90"
                  >
                    <div className="relative">
                      <ShoppingBag className="h-4 w-4" strokeWidth={2} />
                      <div className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full bg-white border border-[var(--vesti-primary)]">
                        <Plus className="h-2 w-2 text-[var(--vesti-primary)]" strokeWidth={3} />
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
