import { useState } from 'react';
import { motion } from 'motion/react';
import { Search, ShoppingBag, Plus, ChevronLeft, TrendingUp, Flame, Star } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner';

interface TrendingProduct {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  brand: string;
  category: string;
  trendScore: number;
  soldCount: number;
}

const trendingProducts: TrendingProduct[] = [
  {
    id: 1,
    name: '經典白T恤',
    price: 890,
    imageUrl: 'https://images.unsplash.com/photo-1643881080033-e67069c5e4df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aGl0ZSUyMHRzaGlydCUyMGNsb3RoaW5nfGVufDF8fHx8MTc2MjU1NDc2Mnww&ixlib=rb-4.1.0&q=80&w=1080',
    brand: 'BasicWear',
    category: '上衣',
    trendScore: 98,
    soldCount: 2580,
  },
  {
    id: 2,
    name: '直筒牛仔褲',
    price: 1590,
    imageUrl: 'https://images.unsplash.com/photo-1602585198422-d795fa9bfd6f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZW5pbSUyMGplYW5zJTIwZmFzaGlvbnxlbnwxfHx8fDE3NjI1NzE5ODN8MA&ixlib=rb-4.1.0&q=80&w=1080',
    brand: 'Denim Co.',
    category: '褲裝',
    trendScore: 95,
    soldCount: 1920,
  },
  {
    id: 3,
    name: '運動休閒鞋',
    price: 2490,
    imageUrl: 'https://images.unsplash.com/photo-1650320079970-b4ee8f0dae33?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwc25lYWtlcnMlMjBzaG9lc3xlbnwxfHx8fDE3NjI2MDI5NzB8MA&ixlib=rb-4.1.0&q=80&w=1080',
    brand: 'StepStyle',
    category: '鞋履',
    trendScore: 92,
    soldCount: 1560,
  },
  {
    id: 4,
    name: '羊毛大衣',
    price: 3990,
    imageUrl: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aW50ZXIlMjBjb2F0JTIwZmFzaGlvbnxlbnwxfHx8fDE3NjI2MDU4Njh8MA&ixlib=rb-4.1.0&q=80&w=1080',
    brand: 'WarmStyle',
    category: '外套',
    trendScore: 89,
    soldCount: 890,
  },
];

interface TrendingPageProps {
  onBack: () => void;
  onNavigateToTryOn?: () => void;
}

export function TrendingPage({ onBack, onNavigateToTryOn }: TrendingPageProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleAddToTryOn = (product: TrendingProduct) => {
    toast.success(`已將 ${product.name} 加入試穿籃`);
  };

  const filteredProducts = searchQuery
    ? trendingProducts.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.brand.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : trendingProducts;

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
          <h1 className="text-[var(--vesti-dark)]">熱門單品</h1>
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
            placeholder="搜尋熱門單品..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-border bg-white py-3 pl-12 pr-4 text-[var(--vesti-dark)] placeholder-[var(--vesti-gray-mid)] focus:border-[var(--vesti-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--vesti-primary)]/20"
            style={{ fontSize: 'var(--text-label)' }}
          />
        </div>
      </section>

      {/* Trending Info Banner */}
      <section className="px-5 pb-5">
        <div className="rounded-2xl bg-gradient-to-br from-[var(--vesti-primary)]/10 to-[var(--vesti-primary)]/5 border border-[var(--vesti-primary)]/20 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--vesti-primary)]/20">
              <Flame className="h-6 w-6 text-[var(--vesti-primary)]" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-[var(--vesti-dark)]" style={{ fontWeight: 600 }}>本週最熱門</h3>
              <p className="text-[var(--vesti-gray-mid)]" style={{ fontSize: 'var(--text-label)' }}>
                根據銷量與流行度精選
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Products List */}
      <section className="px-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[var(--vesti-dark)]">熱銷榜單</h2>
          <span className="text-[var(--vesti-gray-mid)]" style={{ fontSize: 'var(--text-label)' }}>
            {filteredProducts.length} 件商品
          </span>
        </div>

        <div className="space-y-4">
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group relative overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex gap-3 p-3">
                {/* Ranking Badge */}
                <div className="absolute left-0 top-0 z-10 flex h-10 w-10 items-center justify-center rounded-br-2xl bg-gradient-to-br from-[var(--vesti-accent)] to-[var(--vesti-accent)]/80 shadow-md">
                  <span className="text-white" style={{ fontWeight: 700 }}>
                    {index + 1}
                  </span>
                </div>

                {/* Product Image */}
                <div className="relative flex-shrink-0">
                  <div className="h-28 w-28 overflow-hidden rounded-xl bg-[var(--vesti-gray-light)]">
                    <ImageWithFallback
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                </div>

                {/* Product Info */}
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <p className="mb-1 text-[var(--vesti-primary)]" style={{ fontSize: 'var(--text-label)' }}>
                      {product.brand}
                    </p>
                    <h4 className="mb-1 text-[var(--vesti-dark)] line-clamp-2" style={{ fontWeight: 600 }}>
                      {product.name}
                    </h4>
                    
                    {/* Stats */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-[var(--vesti-accent)] text-[var(--vesti-accent)]" />
                        <span className="text-[var(--vesti-gray-mid)]" style={{ fontSize: '11px' }}>
                          {product.trendScore}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Flame className="h-3 w-3 text-[var(--vesti-accent)]" />
                        <span className="text-[var(--vesti-gray-mid)]" style={{ fontSize: '11px' }}>
                          {product.soldCount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Price and Button */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[var(--vesti-primary)]" style={{ fontWeight: 700 }}>
                      NT$ {product.price.toLocaleString()}
                    </span>
                    <button
                      onClick={() => handleAddToTryOn(product)}
<<<<<<< HEAD
                      className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[var(--vesti-primary)] text-white shadow-lg transition-all hover:scale-110 hover:shadow-xl active:scale-95 flex-shrink-0"
                    >
                      <ShoppingBag className="h-5 w-5" strokeWidth={2.5} />
                      <div className="absolute -right-0.5 -top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full border-2 border-[var(--vesti-primary)] bg-white text-[var(--vesti-primary)] shadow-sm">
                        <Plus className="h-2.5 w-2.5" strokeWidth={4} />
=======
                      className="group/btn flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--vesti-primary)] text-white transition-all hover:bg-[var(--vesti-primary)]/90"
                    >
                      <div className="relative">
                        <ShoppingBag className="h-4 w-4" strokeWidth={2} />
                        <div className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full bg-white border border-[var(--vesti-primary)]">
                          <Plus className="h-2 w-2 text-[var(--vesti-primary)]" strokeWidth={3} />
                        </div>
>>>>>>> de3ed00c33a5d0df6cf810802fd173e4ca4388a2
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Trending Effect Border */}
              <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-[var(--vesti-accent)]/30 transition-colors pointer-events-none" />
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> de3ed00c33a5d0df6cf810802fd173e4ca4388a2
