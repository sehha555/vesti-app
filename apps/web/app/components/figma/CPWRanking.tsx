import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, AlertCircle, ArrowDown, ArrowUp, ArrowUpRight } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface RankingItem {
  id: number;
  name: string;
  imageUrl: string;
  price: number;
  wearCount: number;
  cpw: number;
}

export function CPWRanking() {
  const [activeTab, setActiveTab] = useState<'best' | 'worst'>('best');

  const bestItems: RankingItem[] = [
    {
      id: 1,
      name: '經典素色 T-Shirt',
      imageUrl: 'https://images.unsplash.com/photo-1475178626620-a4d074967452?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200',
      price: 2480,
      wearCount: 156,
      cpw: 15.8,
    },
    {
      id: 2,
      name: '純白基本款 T-Shirt',
      imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&q=80',
      price: 980,
      wearCount: 82,
      cpw: 11.9,
    },
    {
      id: 3,
      name: '牛仔長褲',
      imageUrl: 'https://images.unsplash.com/photo-1560769625-47ab3335ef61?w=200&q=80',
      price: 3680,
      wearCount: 210,
      cpw: 17.5,
    },
  ].sort((a, b) => a.cpw - b.cpw);

  const worstItems: RankingItem[] = [
    {
      id: 4,
      name: '宴會禮服',
      imageUrl: 'https://images.unsplash.com/photo-1763336016195-1942264993d3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200',
      price: 12800,
      wearCount: 1,
      cpw: 12800,
    },
    {
      id: 5,
      name: '高價外套',
      imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=200&q=80',
      price: 25000,
      wearCount: 3,
      cpw: 8333,
    },
    {
      id: 6,
      name: '運動鞋',
      imageUrl: 'https://images.unsplash.com/photo-1582716960708-d6255b765256?w=200&q=80',
      price: 3200,
      wearCount: 2,
      cpw: 1600,
    },
  ].sort((a, b) => b.cpw - a.cpw);

  const currentItems = activeTab === 'best' ? bestItems : worstItems;

  return (
<div className="px-5 mb-5">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-3xl bg-white p-6 shadow-[0_12px_24px_rgba(0,0,0,0.08)] border-2 border-[var(--vesti-secondary)]"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-[var(--vesti-dark)]">CPW 排行榜</h3>
            <p className="text-xs text-[var(--vesti-gray-mid)] mt-1">單次穿著成本計算</p>
          </div>
          
          <div className="flex rounded-full bg-[var(--vesti-bg-secondary)] p-1">
            <button
              onClick={() => setActiveTab('best')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeTab === 'best' 
                  ? 'bg-white text-[var(--vesti-primary)] shadow-sm' 
                  : 'text-[var(--vesti-gray-mid)] hover:text-[var(--vesti-dark)]'
              }`}
            >
              最回本
            </button>
            <button
              onClick={() => setActiveTab('worst')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeTab === 'worst' 
                  ? 'bg-white text-red-500 shadow-sm' 
                  : 'text-[var(--vesti-gray-mid)] hover:text-[var(--vesti-dark)]'
              }`}
            >
              最浪費
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {currentItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4"
              >
                <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl border border-[var(--vesti-gray-light)]/50">
                  <ImageWithFallback
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                  <div className={`absolute top-0 left-0 flex h-5 w-5 items-center justify-center rounded-br-lg text-[10px] font-bold text-white ${
                    index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-gray-300' : 'bg-orange-300'
                  }`}>
                    {index + 1}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="truncate text-sm font-bold text-[var(--vesti-dark)]">{item.name}</h4>
                  <p className="text-xs text-[var(--vesti-gray-mid)]">
                    穿著 {item.wearCount} 次
                  </p>
                </div>

                <div className="text-right">
                  <p className={`text-sm font-black ${activeTab === 'best' ? 'text-[var(--vesti-primary)]' : 'text-red-500'}`}>
                    ${item.cpw.toLocaleString()}
                  </p>
                  <div className="flex items-center justify-end gap-0.5 text-[10px] text-[var(--vesti-gray-mid)]">
                    <span>/次</span>
                    {activeTab === 'best' ? <ArrowDown size={10} /> : <ArrowUp size={10} />}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="mt-5 pt-4 border-t border-[var(--vesti-gray-light)]/30 text-center">
          <button className="text-xs font-bold text-[var(--vesti-primary)] flex items-center justify-center gap-1">
            查看完整榜單
            <ArrowUpRight size={12} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

