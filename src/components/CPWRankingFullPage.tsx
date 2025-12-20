import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Trophy, TrendingUp, TrendingDown, Filter, Search, ChevronDown } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface RankingItem {
  id: number;
  name: string;
  imageUrl: string;
  price: number;
  wearCount: number;
  cpw: number;
  brand: string;
  category: string;
  trend?: 'up' | 'down' | 'stable';
  trendChange?: number;
}

interface CPWRankingFullPageProps {
  onBack: () => void;
}

export function CPWRankingFullPage({ onBack }: CPWRankingFullPageProps) {
  const [activeTab, setActiveTab] = useState<'best' | 'worst'>('best');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // 完整榜單資料 - TOP 50
  const allItems: RankingItem[] = [
    {
      id: 1,
      name: "經典丹寧牛仔褲",
      imageUrl: "https://images.unsplash.com/photo-1475178626620-a4d074967452?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
      price: 2480,
      wearCount: 156,
      cpw: 15.8,
      brand: "Levi's",
      category: "褲裝",
      trend: 'stable',
    },
    {
      id: 2,
      name: "純白重磅 T-Shirt",
      imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80",
      price: 980,
      wearCount: 82,
      cpw: 11.9,
      brand: "UNIQLO",
      category: "上衣",
      trend: 'up',
      trendChange: 2,
    },
    {
      id: 3,
      name: "復古慢跑鞋",
      imageUrl: "https://images.unsplash.com/photo-1560769625-47ab3335ef61?w=400&q=80",
      price: 3680,
      wearCount: 210,
      cpw: 17.5,
      brand: "Nike",
      category: "鞋類",
      trend: 'down',
      trendChange: 1,
    },
    {
      id: 4,
      name: "羊毛針織衫",
      imageUrl: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&q=80",
      price: 3200,
      wearCount: 145,
      cpw: 22.0,
      brand: "MUJI",
      category: "上衣",
      trend: 'up',
      trendChange: 3,
    },
    {
      id: 5,
      name: "帆布後背包",
      imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80",
      price: 1680,
      wearCount: 98,
      cpw: 17.1,
      brand: "Herschel",
      category: "配件",
      trend: 'stable',
    },
    {
      id: 6,
      name: "極簡皮革錢包",
      imageUrl: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&q=80",
      price: 2800,
      wearCount: 280,
      cpw: 10.0,
      brand: "Bellroy",
      category: "配件",
      trend: 'up',
      trendChange: 4,
    },
    {
      id: 7,
      name: "工裝風外套",
      imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&q=80",
      price: 4200,
      wearCount: 89,
      cpw: 47.2,
      brand: "Carhartt",
      category: "外套",
      trend: 'down',
      trendChange: 2,
    },
    {
      id: 8,
      name: "黑色斜背包",
      imageUrl: "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=400&q=80",
      price: 2200,
      wearCount: 156,
      cpw: 14.1,
      brand: "Porter",
      category: "配件",
      trend: 'stable',
    },
    {
      id: 9,
      name: "條紋襯衫",
      imageUrl: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&q=80",
      price: 1580,
      wearCount: 67,
      cpw: 23.5,
      brand: "GU",
      category: "上衣",
      trend: 'up',
      trendChange: 1,
    },
    {
      id: 10,
      name: "運動休閒鞋",
      imageUrl: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&q=80",
      price: 2980,
      wearCount: 123,
      cpw: 24.2,
      brand: "Adidas",
      category: "鞋類",
      trend: 'down',
      trendChange: 3,
    },
    // 繼續添加更多項目到 50
    {
      id: 11,
      name: "休閒卡其褲",
      imageUrl: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&q=80",
      price: 1980,
      wearCount: 92,
      cpw: 21.5,
      brand: "GAP",
      category: "褲裝",
      trend: 'stable',
    },
    {
      id: 12,
      name: "連帽衛衣",
      imageUrl: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&q=80",
      price: 2480,
      wearCount: 78,
      cpw: 31.7,
      brand: "Champion",
      category: "上衣",
      trend: 'up',
      trendChange: 2,
    },
    {
      id: 13,
      name: "絲絨晚禮服",
      imageUrl: "https://images.unsplash.com/photo-1763336016195-1942264993d3?w=400&q=80",
      price: 12800,
      wearCount: 3,
      cpw: 4266.7,
      brand: "ZARA",
      category: "洋裝",
      trend: 'down',
      trendChange: 5,
    },
    {
      id: 14,
      name: "設計師聯名外套",
      imageUrl: "https://images.unsplash.com/photo-1544923408-75c5cef46f14?w=400&q=80",
      price: 18900,
      wearCount: 5,
      cpw: 3780.0,
      brand: "Collaboration",
      category: "外套",
      trend: 'down',
      trendChange: 8,
    },
    {
      id: 15,
      name: "限量球鞋",
      imageUrl: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&q=80",
      price: 8600,
      wearCount: 8,
      cpw: 1075.0,
      brand: "Jordan",
      category: "鞋類",
      trend: 'stable',
    },
  ];

  const categories = ['全部', '上衣', '褲裝', '外套', '鞋類', '配件', '洋裝'];

  const bestItems = [...allItems].sort((a, b) => a.cpw - b.cpw);
  const worstItems = [...allItems].sort((a, b) => b.cpw - a.cpw);

  const displayItems = activeTab === 'best' ? bestItems : worstItems;

  const filteredItems = displayItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === '全部' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-br from-yellow-400 to-yellow-600';
    if (rank === 2) return 'bg-gradient-to-br from-gray-300 to-gray-500';
    if (rank === 3) return 'bg-gradient-to-br from-orange-400 to-orange-600';
    return 'bg-[var(--vesti-gray-light)]';
  };

  const getRankTextColor = (rank: number) => {
    if (rank <= 3) return 'text-white';
    return 'text-[var(--vesti-dark)]';
  };

  return (
    <div className="min-h-screen bg-[var(--vesti-background)]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-border">
        <div className="flex items-center justify-between px-5 py-4">
          <button
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[var(--vesti-gray-light)] transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-[var(--vesti-dark)]" strokeWidth={2} />
          </button>
          
          <div className="text-center flex-1">
            <h1 className="text-[var(--vesti-dark)]" style={{ fontWeight: 700 }}>CPW 完整榜單</h1>
            <p className="text-[var(--vesti-gray-mid)]" style={{ fontSize: 'var(--text-label)' }}>
              每次穿搭成本分析
            </p>
          </div>

          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[var(--vesti-gray-light)] transition-colors"
          >
            <Filter className="h-5 w-5 text-[var(--vesti-dark)]" strokeWidth={2} />
          </button>
        </div>

        {/* 搜尋欄 */}
        <div className="px-5 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--vesti-gray-mid)]" strokeWidth={2} />
            <input
              type="text"
              placeholder="搜尋商品或品牌..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border-2 border-border bg-white pl-10 pr-4 py-2.5 text-[var(--vesti-dark)] placeholder:text-[var(--vesti-gray-mid)] focus:border-[var(--vesti-primary)] focus:outline-none transition-colors"
              style={{ fontSize: 'var(--text-label)' }}
            />
          </div>
        </div>

        {/* 分類篩選 */}
        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-border"
            >
              <div className="px-5 py-4">
                <p className="mb-3 text-[var(--vesti-dark)]" style={{ fontWeight: 600, fontSize: 'var(--text-label)' }}>
                  商品分類
                </p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`rounded-full px-4 py-2 border-2 transition-all ${
                        selectedCategory === category
                          ? 'bg-[var(--vesti-primary)] text-white border-[var(--vesti-primary)]'
                          : 'bg-white text-[var(--vesti-gray-mid)] border-border hover:border-[var(--vesti-primary)]'
                      }`}
                      style={{ fontSize: 'var(--text-label)' }}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab 切換 */}
        <div className="flex border-t border-border">
          <button
            onClick={() => setActiveTab('best')}
            className={`flex-1 py-3 relative transition-colors ${
              activeTab === 'best' ? 'text-[var(--vesti-primary)]' : 'text-[var(--vesti-gray-mid)]'
            }`}
            style={{ fontWeight: 600 }}
          >
            <div className="flex items-center justify-center gap-2">
              <Trophy className="h-4 w-4" strokeWidth={2} />
              最划算榜
            </div>
            {activeTab === 'best' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--vesti-primary)]"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
          </button>

          <button
            onClick={() => setActiveTab('worst')}
            className={`flex-1 py-3 relative transition-colors ${
              activeTab === 'worst' ? 'text-[var(--vesti-primary)]' : 'text-[var(--vesti-gray-mid)]'
            }`}
            style={{ fontWeight: 600 }}
          >
            <div className="flex items-center justify-center gap-2">
              <TrendingDown className="h-4 w-4" strokeWidth={2} />
              待改善榜
            </div>
            {activeTab === 'worst' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--vesti-primary)]"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
          </button>
        </div>
      </header>

      {/* 榜單列表 */}
      <div className="px-5 py-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[var(--vesti-gray-mid)]" style={{ fontSize: 'var(--text-label)' }}>
                  沒有找到符合條件的商品
                </p>
              </div>
            ) : (
              filteredItems.map((item, index) => {
                const rank = index + 1;
                const isCPWGood = item.cpw < 30;
                
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-2xl border-2 border-border p-4 hover:border-[var(--vesti-primary)] transition-all"
                  >
                    <div className="flex items-center gap-4">
                      {/* 排名徽章 */}
                      <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${getRankBadgeColor(rank)} shadow-md`}>
                        <span className={`${getRankTextColor(rank)}`} style={{ fontWeight: 700, fontSize: '18px' }}>
                          {rank}
                        </span>
                      </div>

                      {/* 商品圖片 */}
                      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border-2 border-border bg-white">
                        <ImageWithFallback
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      {/* 商品資訊 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-[var(--vesti-dark)] truncate" style={{ fontWeight: 600 }}>
                              {item.name}
                            </h3>
                            <p className="text-[var(--vesti-gray-mid)] mt-0.5" style={{ fontSize: '11px' }}>
                              {item.brand} · {item.category}
                            </p>
                          </div>

                          {/* 趨勢指示器 */}
                          {item.trend && (
                            <div className={`flex items-center gap-0.5 ${
                              item.trend === 'up' ? 'text-green-600' : 
                              item.trend === 'down' ? 'text-red-600' : 
                              'text-[var(--vesti-gray-mid)]'
                            }`}>
                              {item.trend === 'up' && <TrendingUp className="h-3 w-3" strokeWidth={2} />}
                              {item.trend === 'down' && <TrendingDown className="h-3 w-3" strokeWidth={2} />}
                              {item.trendChange && (
                                <span style={{ fontSize: '10px', fontWeight: 600 }}>
                                  {item.trendChange}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* CPW 資訊 */}
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-baseline gap-1">
                            <span className="text-[var(--vesti-gray-mid)]" style={{ fontSize: '11px' }}>
                              CPW
                            </span>
                            <span className={`${isCPWGood ? 'text-green-600' : 'text-[var(--vesti-primary)]'}`} style={{ fontWeight: 700, fontSize: '16px' }}>
                              ${item.cpw.toFixed(1)}
                            </span>
                          </div>

                          <div className="h-3 w-px bg-border" />

                          <div className="flex items-baseline gap-1">
                            <span className="text-[var(--vesti-gray-mid)]" style={{ fontSize: '11px' }}>
                              穿著
                            </span>
                            <span className="text-[var(--vesti-dark)]" style={{ fontWeight: 600, fontSize: 'var(--text-label)' }}>
                              {item.wearCount}次
                            </span>
                          </div>

                          <div className="h-3 w-px bg-border" />

                          <div className="flex items-baseline gap-1">
                            <span className="text-[var(--vesti-gray-mid)]" style={{ fontSize: '11px' }}>
                              價格
                            </span>
                            <span className="text-[var(--vesti-dark)]" style={{ fontWeight: 600, fontSize: 'var(--text-label)' }}>
                              ${item.price}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 底部說明 */}
      <div className="px-5 py-8 text-center">
        <p className="text-[var(--vesti-gray-mid)]" style={{ fontSize: '11px' }}>
          CPW (Cost Per Wear) = 商品價格 ÷ 穿著次數
        </p>
        <p className="text-[var(--vesti-gray-mid)] mt-1" style={{ fontSize: '11px' }}>
          數值越低代表每次穿搭成本越划算
        </p>
      </div>
    </div>
  );
}
