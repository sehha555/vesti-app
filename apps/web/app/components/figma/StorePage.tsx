import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Sparkles, ShoppingBag, Grid3x3, LayoutGrid, Shirt, ShoppingCart, X, Plus, ChevronLeft } from 'lucide-react';
import { StoreOutfitCard } from './StoreOutfitCard';
import { OutfitPackCard } from './OutfitPackCard';
import { AIOutfitRecommendation } from './AIOutfitRecommendation';
import { QuizModal } from './QuizModal';
import { ProductDetailView } from './ProductDetailView';
import { StoreProfilePage } from './StoreProfilePage';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

type ViewMode = 'shopping' | 'outfit';

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
  originalPrice?: number;
}

const featuredStores: Store[] = [
  {
    id: 1,
    name: 'Urban Style',
    imageUrl: 'https://images.unsplash.com/photo-1599012307530-d163bd04ecab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwY2xvdGhpbmclMjBzdG9yZXxlbnwxfHx8fDE3NjI1NTk0MzV8MA&ixlib=rb-4.1.0&q=80&w=1080',
    category: '街頭潮流',
  },
  {
    id: 2,
    name: 'Minimal Chic',
    imageUrl: 'https://images.unsplash.com/photo-1634316164986-3d65b05f123f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwZmFzaGlvbiUyMGJvdXRpcXVlfGVufDF8fHx8MTc2MjYwMjk2OXww&ixlib=rb-4.1.0&q=80&w=1080',
    category: '極簡風格',
  },
  {
    id: 3,
    name: 'Vintage Treasures',
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjbG90aGluZyUyMHN0b3JlfGVufDF8fHx8MTc2MjYwMjk2OXww&ixlib=rb-4.1.0&q=80&w=1080',
    category: '復古風尚',
  },
  {
    id: 4,
    name: 'Sport Life',
    imageUrl: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcG9ydHMlMjBzdG9yZXxlbnwxfHx8fDE3NjI2MDI5Njl8MA&ixlib=rb-4.1.0&q=80&w=1080',
    category: '運動休閒',
  },
  {
    id: 5,
    name: 'Elegant Closet',
    imageUrl: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwYm91dGlxdWV8ZW58MXx8fHwxNzYyNjAyOTY5fDA&ixlib=rb-4.1.0&q=80&w=1080',
    category: '優雅正裝',
  },
  {
    id: 6,
    name: 'Street Beat',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHJlZXR3ZWFyfGVufDF8fHx8MTc2MjYwMjk2OXww&ixlib=rb-4.1.0&q=80&w=1080',
    category: '街頭風格',
  },
  {
    id: 7,
    name: 'Natural Threads',
    imageUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjbG90aGluZyUyMHJhY2t8ZW58MXx8fHwxNzYyNjAyOTY5fDA&ixlib=rb-4.1.0&q=80&w=1080',
    category: '自然風尚',
  },
  {
    id: 8,
    name: 'Modern Edge',
    imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBmYXNoaW9ufGVufDF8fHx8MTc2MjYwMjk2OXww&ixlib=rb-4.1.0&q=80&w=1080',
    category: '現代時尚',
  },
];

const featuredProducts: Product[] = [
  {
    id: 1,
    name: '經典白T恤',
    price: 890,
    imageUrl: 'https://images.unsplash.com/photo-1643881080033-e67069c5e4df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aGl0ZSUyMHRzaGlydCUyMGNsb3RoaW5nfGVufDF8fHx8MTc2MjU1NDc2Mnww&ixlib=rb-4.1.0&q=80&w=1080',
    brand: 'BasicWear',
    category: '上衣',
    tags: ['新品', '熱銷'],
  },
  {
    id: 2,
    name: '直筒牛仔褲',
    price: 1590,
    imageUrl: 'https://images.unsplash.com/photo-1602585198422-d795fa9bfd6f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZW5pbSUyMGplYW5zJTIwZmFzaGlvbnxlbnwxfHx8fDE3NjI1NzE5ODN8MA&ixlib=rb-4.1.0&q=80&w=1080',
    brand: 'Denim Co.',
    category: '褲裝',
    tags: ['新品', '折扣'],
    originalPrice: 1980,
  },
  {
    id: 3,
    name: '運動休閒鞋',
    price: 2490,
    imageUrl: 'https://images.unsplash.com/photo-1650320079970-b4ee8f0dae33?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwc25lYWtlcnMlMjBzaG9lc3xlbnwxfHx8fDE3NjI2MDI5NzB8MA&ixlib=rb-4.1.0&q=80&w=1080',
    brand: 'StepStyle',
    category: '鞋履',
    tags: ['新品', '熱銷', '折扣'],
    originalPrice: 3200,
  },
  {
    id: 4,
    name: '復古飛行外套',
    price: 3280,
    imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxqYWNrZXQlMjBmYXNoaW9ufGVufDF8fHx8MTc2MjYwNjE4OXww&ixlib=rb-4.1.0&q=80&w=1080',
    brand: 'VintageSoul',
    category: '外套',
    tags: ['熱銷'],
  },
  {
    id: 5,
    name: '百褶長裙',
    price: 1280,
    imageUrl: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxza2lydHxlbnwxfHx8fDE3NjI2MDYyMTJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    brand: 'SoftTouch',
    category: '裙裝',
    tags: ['折扣'],
    originalPrice: 1680,
  },
  {
    id: 6,
    name: '條紋襯衫',
    price: 1190,
    imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHJpcGVkJTIwc2hpcnR8ZW58MXx8fHwxNzYyNjAyOTcwfDA&ixlib=rb-4.1.0&q=80&w=1080',
    brand: 'ClassicFit',
    category: '上衣',
    tags: ['新品'],
  },
  {
    id: 7,
    name: '針織開襟外套',
    price: 2180,
    imageUrl: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXJkaWdhbnxlbnwxfHx8fDE3NjI2MDI5NzB8MA&ixlib=rb-4.1.0&q=80&w=1080',
    brand: 'CozyKnit',
    category: '外套',
    tags: ['熱銷'],
  },
  {
    id: 8,
    name: '高腰闊腿褲',
    price: 1490,
    imageUrl: 'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aWRlJTIwbGVnJTIwcGFudHN8ZW58MXx8fHwxNzYyNjAyOTcwfDA&ixlib=rb-4.1.0&q=80&w=1080',
    brand: 'TrendLine',
    category: '褲裝',
    tags: ['新品', '熱銷'],
  },
  {
    id: 9,
    name: '輕量羽絨背心',
    price: 2680,
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb3duJTIwdmVzdHxlbnwxfHx8fDE3NjI2MDI5NzB8MA&ixlib=rb-4.1.0&q=80&w=1080',
    brand: 'WarmLayer',
    category: '外套',
    tags: ['新品'],
  },
  {
    id: 10,
    name: '棉質工作褲',
    price: 1390,
    imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXJnbyUyMHBhbnRzfGVufDF8fHx8MTc2MjYwMjk3MHww&ixlib=rb-4.1.0&q=80&w=1080',
    brand: 'UrbanWork',
    category: '褲裝',
    tags: ['折扣'],
    originalPrice: 1790,
  },
  {
    id: 11,
    name: '絲質印花洋裝',
    price: 2890,
    imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaWxrJTIwZHJlc3N8ZW58MXx8fHwxNzYyNjAyOTcwfDA&ixlib=rb-4.1.0&q=80&w=1080',
    brand: 'SilkGrace',
    category: '裙裝',
    tags: ['新品', '熱銷'],
  },
  {
    id: 12,
    name: '皮革托特包',
    price: 3580,
    imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsZWF0aGVyJTIwYmFnfGVufDF8fHx8MTc2MjYwMjk3MHww&ixlib=rb-4.1.0&q=80&w=1080',
    brand: 'LeatherCraft',
    category: '配件',
    tags: ['熱銷'],
  },
];

const outfitSets = [
  {
    id: 1,
    imageUrl: 'https://images.unsplash.com/photo-1599016461690-8a24d561319e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXN1YWwlMjBvdXRmaXQlMjBjb21wbGV0ZXxlbnwxfHx8fDE3NjI2MDI5NzF8MA&ixlib=rb-4.1.0&q=80&w=1080',
    styleName: '都市休閒套裝',
    description: '輕鬆自在的日常穿搭，適合週末出遊或咖啡約會',
    price: 4980,
    weatherSuitable: {
      tempMin: 18,
      tempMax: 26,
      weatherTypes: ['sunny', 'cloudy'] as const,
    },
    wardrobeMatch: {
      matchScore: 85,
      matchingItems: 7,
    },
    storeCount: 2,
    occasions: ['休閒', '約會'],
    styleTag: '休閒',
    items: [
      {
        id: 1,
        name: '純色圓領T恤',
        price: 890,
        imageUrl: 'https://images.unsplash.com/photo-1643881080033-e67069c5e4df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aGl0ZSUyMHRzaGlydCUyMGNsb3RoaW5nfGVufDF8fHx8MTc2MjU1NDc2Mnww&ixlib=rb-4.1.0&q=80&w=1080',
        brand: 'BasicWear',
        category: '上衣',
      },
      {
        id: 2,
        name: '修身牛仔褲',
        price: 1590,
        imageUrl: 'https://images.unsplash.com/photo-1602585198422-d795fa9bfd6f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZW5pbSUyMGplYW5zJTIwZmFzaGlvbnxlbnwxfHx8fDE3NjI1NzE5ODN8MA&ixlib=rb-4.1.0&q=80&w=1080',
        brand: 'Denim Co.',
        category: '褲裝',
      },
      {
        id: 3,
        name: '經典白色球鞋',
        price: 2490,
        imageUrl: 'https://images.unsplash.com/photo-1650320079970-b4ee8f0dae33?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwc25lYWtlcnMlMjBzaG9lc3xlbnwxfHx8fDE3NjI2MDI5NzB8MA&ixlib=rb-4.1.0&q=80&w=1080',
        brand: 'StepStyle',
        category: '鞋履',
      },
    ],
  },
  {
    id: 2,
    imageUrl: 'https://images.unsplash.com/photo-1762343287340-8aa94082e98b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXN1YWwlMjBmYXNoaW9uJTIwb3V0Zml0JTIwc3RyZWV0JTIwc3R5bGV8ZW58MXx8fHwxNzYyNTI5NjgzfDA&ixlib=rb-4.1.0&q=80&w=1080',
    styleName: '商務休閒組合',
    description: '專業又不失個性的辦公室穿搭，展現專業形象',
    price: 6780,
    weatherSuitable: {
      tempMin: 15,
      tempMax: 22,
      weatherTypes: ['cloudy', 'rainy'] as const,
    },
    wardrobeMatch: {
      matchScore: 72,
      matchingItems: 5,
    },
    storeCount: 1,
    occasions: ['工作', '正式'],
    styleTag: '正式',
    items: [
      {
        id: 4,
        name: '襯衫外套',
        price: 2290,
        imageUrl: 'https://images.unsplash.com/photo-1643881080033-e67069c5e4df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aGl0ZSUyMHRzaGlydCUyMGNsb3RoaW5nfGVufDF8fHx8MTc2MjU1NDc2Mnww&ixlib=rb-4.1.0&q=80&w=1080',
        brand: 'WorkStyle',
        category: '外套',
      },
      {
        id: 5,
        name: '西裝長褲',
        price: 1990,
        imageUrl: 'https://images.unsplash.com/photo-1602585198422-d795fa9bfd6f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZW5pbSUyMGplYW5zJTIwZmFzaGlvbnxlbnwxfHx8fDE3NjI1NzE5ODN8MA&ixlib=rb-4.1.0&q=80&w=1080',
        brand: 'Formal Fit',
        category: '褲裝',
      },
      {
        id: 6,
        name: '皮革休閒鞋',
        price: 2490,
        imageUrl: 'https://images.unsplash.com/photo-1650320079970-b4ee8f0dae33?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwc25lYWtlcnMlMjBzaG9lc3xlbnwxfHx8fDE3NjI2MDI5NzB8MA&ixlib=rb-4.1.0&q=80&w=1080',
        brand: 'LeatherCraft',
        category: '鞋履',
      },
    ],
  },
  {
    id: 3,
    imageUrl: 'https://images.unsplash.com/photo-1599016461690-8a24d561319e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXN1YWwlMjBvdXRmaXQlMjBjb21wbGV0ZXxlbnwxfHx8fDE3NjI2MDI5NzF8MA&ixlib=rb-4.1.0&q=80&w=1080',
    styleName: '運動休閒風',
    description: '舒適有型的運動風穿搭，展現活力與時尚感',
    price: 5480,
    weatherSuitable: {
      tempMin: 20,
      tempMax: 28,
      weatherTypes: ['sunny'] as const,
    },
    wardrobeMatch: {
      matchScore: 93,
      matchingItems: 12,
    },
    storeCount: 3,
    occasions: ['運動', '休閒'],
    styleTag: '運動',
    items: [
      {
        id: 7,
        name: '運動連帽外套',
        price: 1890,
        imageUrl: 'https://images.unsplash.com/photo-1643881080033-e67069c5e4df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aGl0ZSUyMHRzaGlydCUyMGNsb3RoaW5nfGVufDF8fHx8MTc2MjU1NDc2Mnww&ixlib=rb-4.1.0&q=80&w=1080',
        brand: 'SportLife',
        category: '外套',
      },
      {
        id: 8,
        name: '彈性運動褲',
        price: 1290,
        imageUrl: 'https://images.unsplash.com/photo-1602585198422-d795fa9bfd6f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZW5pbSUyMGplYW5zJTIwZmFzaGlvbnxlbnwxfHx8fDE3NjI1NzE5ODN8MA&ixlib=rb-4.1.0&q=80&w=1080',
        brand: 'ActiveWear',
        category: '褲裝',
      },
      {
        id: 9,
        name: '氣墊運動鞋',
        price: 2290,
        imageUrl: 'https://images.unsplash.com/photo-1650320079970-b4ee8f0dae33?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwc25lYWtlcnMlMjBzaG9lc3xlbnwxfHx8fDE3NjI2MDI5NzB8MA&ixlib=rb-4.1.0&q=80&w=1080',
        brand: 'RunStyle',
        category: '鞋履',
      },
    ],
  },
];

interface StorePageProps {
  onNavigateToTryOn: () => void;
  onNavigateToDiscount?: () => void;
  onNavigateToTrending?: () => void;
  onNavigateToCheckout?: () => void;
  initialTag?: string;
}

export function StorePage({ onNavigateToTryOn, onNavigateToDiscount, onNavigateToTrending, onNavigateToCheckout, initialTag }: StorePageProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('shopping');
  const [searchQuery, setSearchQuery] = useState('');
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [tryOnCount, setTryOnCount] = useState(3); // 試穿籃中的商品數量
  const [selectedTag, setSelectedTag] = useState(initialTag || '新品');
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [isFabExpanded, setIsFabExpanded] = useState(false); // FAB 展開狀態
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [showAllStores, setShowAllStores] = useState(false); // 顯示全部商家頁面
  const [showAllProducts, setShowAllProducts] = useState(false); // 顯示全部商品頁面
  
  // If a store is selected, render the store profile page
  if (selectedStore) {
    return (
      <StoreProfilePage 
        store={selectedStore} 
        onBack={() => setSelectedStore(null)}
        tryOnCount={tryOnCount}
        onAddToBag={() => setTryOnCount(c => c + 1)}
        onNavigateToTryOn={onNavigateToTryOn}
        onNavigateToCheckout={onNavigateToCheckout}
      />
    );
  }
  
  // Update selected tag when initialTag changes
  if (initialTag && selectedTag !== initialTag && initialTag !== '新品') {
      setSelectedTag(initialTag);
  }

  const tags = ['新品', '折扣', '熱銷'];
  const categories = ['全部', '上衣', '褲子', '外套', '裙裝', '鞋履', '配件'];

  const handleQuizComplete = (answers: Record<string, string[]>) => {
    console.log('Quiz answers:', answers);
    toast.success('正在為您尋找最適合的商品 ');
  };

  // 如果顯示全部商家頁面
  if (showAllStores) {
    return (
      <div className="min-h-screen bg-[var(--vesti-background)] pb-20">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-40 bg-[var(--vesti-background)]/95 backdrop-blur-sm px-5 pt-5 pb-4"
        >
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setShowAllStores(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white border-2 border-[var(--vesti-gray-mid)]/30 text-[var(--vesti-dark)] transition-all hover:border-[var(--vesti-primary)] hover:text-[var(--vesti-primary)]"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
            </button>
            <h1 className="text-[var(--vesti-primary)]">全部商家</h1>
          </div>

          {/* 搜索欄 */}
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--vesti-gray-mid)]"
              strokeWidth={2}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋商家..."
              className="w-full rounded-xl border-2 border-[var(--vesti-gray-mid)]/30 bg-white py-3 pl-12 pr-4 shadow-sm transition-all focus:border-[var(--vesti-primary)] focus:outline-none"
            />
          </div>
        </motion.header>

        {/* 商家網格 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-5"
        >
          <div className="grid grid-cols-2 gap-3">
            {featuredStores
              .filter(store => 
                searchQuery === '' || 
                store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                store.category.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((store, index) => (
                <motion.div
                  key={store.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="cursor-pointer"
                  onClick={() => {
                    setShowAllStores(false);
                    setSelectedStore(store);
                  }}
                >
                  <div className="overflow-hidden rounded-3xl bg-card border-2 border-[var(--vesti-gray-mid)]/30 shadow-[0_4px_16px_rgba(0,0,0,0.12)]">
                    <div className="aspect-[4/3] overflow-hidden">
                      <ImageWithFallback
                        src={store.imageUrl}
                        alt={store.name}
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    </div>
                    <div className="p-3">
                      <h4 className="mb-1 text-[var(--vesti-dark)] truncate">{store.name}</h4>
                      <p className="text-[var(--vesti-gray-mid)] truncate" style={{ fontSize: 'var(--text-label)' }}>
                        {store.category}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // 如果顯示全部商品頁面
  if (showAllProducts) {
    return (
      <div className="min-h-screen bg-[var(--vesti-background)] pb-20">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-40 bg-[var(--vesti-background)]/95 backdrop-blur-sm px-5 pt-5 pb-4"
        >
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setShowAllProducts(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white border-2 border-[var(--vesti-gray-mid)]/30 text-[var(--vesti-dark)] transition-all hover:border-[var(--vesti-primary)] hover:text-[var(--vesti-primary)]"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
            </button>
            <h1 className="text-[var(--vesti-primary)]">全部商品</h1>
          </div>

          {/* 搜索欄 */}
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--vesti-gray-mid)]"
              strokeWidth={2}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋款式、品牌..."
              className="w-full rounded-xl border-2 border-[var(--vesti-gray-mid)]/30 bg-white py-3 pl-12 pr-4 shadow-sm transition-all focus:border-[var(--vesti-primary)] focus:outline-none"
            />
          </div>
        </motion.header>

        {/* 商品網格 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-5"
        >
          <div className="grid grid-cols-2 gap-3">
            {featuredProducts
              .filter(product => 
                searchQuery === '' || 
                product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.category.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowAllProducts(false);
                    setSelectedProduct(product);
                  }}
                  className="relative overflow-hidden rounded-3xl bg-card border-2 border-[var(--vesti-gray-mid)]/30 shadow-[0_4px_16px_rgba(0,0,0,0.12)] cursor-pointer"
                >
                  <div className="aspect-[4/5] overflow-hidden">
                    <ImageWithFallback
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex items-center gap-2 p-3">
                    <div className="flex-1 min-w-0">
                      <p className="mb-1 text-[var(--vesti-primary)] truncate" style={{ fontSize: 'var(--text-label)' }}>
                        {product.brand}
                      </p>
                      <h4 className="mb-2 text-[var(--vesti-dark)] truncate">{product.name}</h4>
                      <p className="text-[var(--vesti-primary)]" style={{ fontWeight: 700 }}>
                        NT$ {product.price.toLocaleString()}
                      </p>
                    </div>
                    {/* 加入試穿籃按鈕 - 位於右側 */}
                    <div className="mr-1 flex-shrink-0">
                      <button 
                        className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[var(--vesti-primary)] text-white shadow-lg transition-all hover:scale-110 hover:shadow-xl active:scale-95 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTryOnCount(c => c + 1);
                          toast.success(`已將 ${product.name} 加入試穿籃`);
                        }}
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
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--vesti-background)] pb-20">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="sticky top-0 z-40 bg-[var(--vesti-background)]/95 backdrop-blur-sm"
      >
        <div className="px-5 pt-5">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-[var(--vesti-primary)]">商店</h1>
            
            {/* 視圖切換 */}
            <div className="flex gap-2 rounded-full bg-card p-1 shadow-sm">
              <button
                onClick={() => setViewMode('shopping')}
                className={`flex items-center gap-2 rounded-full px-4 py-2 transition-all ${
                  viewMode === 'shopping'
                    ? 'bg-[var(--vesti-primary)] text-white'
                    : 'text-[var(--vesti-gray-mid)] hover:text-[var(--vesti-dark)]'
                }`}
              >
                <Grid3x3 className="h-4 w-4" strokeWidth={2} />
                <span style={{ fontSize: 'var(--text-label)' }}>單品</span>
              </button>
              <button
                onClick={() => setViewMode('outfit')}
                className={`flex items-center gap-2 rounded-full px-4 py-2 transition-all ${
                  viewMode === 'outfit'
                    ? 'bg-[var(--vesti-primary)] text-white'
                    : 'text-[var(--vesti-gray-mid)] hover:text-[var(--vesti-dark)]'
                }`}
              >
                <LayoutGrid className="h-4 w-4" strokeWidth={2} />
                <span style={{ fontSize: 'var(--text-label)' }}>整套</span>
              </button>
            </div>
          </div>

          {/* 搜索欄 */}
          {viewMode === 'shopping' && (
            <div className="relative mb-4">
              <Search
                className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--vesti-gray-mid)]"
                strokeWidth={2}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋款式、品牌..."
                className="w-full rounded-xl border-2 border-[var(--vesti-gray-mid)]/30 bg-white py-3 pl-12 pr-4 shadow-sm transition-all focus:border-[var(--vesti-primary)] focus:outline-none"
              />
            </div>
          )}
          
          {/* 篩選選單區 */}
          {viewMode === 'shopping' && (
            <div className="mb-4 flex items-center gap-3">
              {/* 類別篩選下拉選單 */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[110px] h-[40px] rounded-full border-2 border-[var(--vesti-gray-mid)]/30 bg-white shadow-sm transition-all hover:border-[var(--vesti-primary)]/40 flex-shrink-0">
                  <SelectValue placeholder="類別" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* 標籤按鈕列表 */}
              <div className="flex gap-2 overflow-x-auto flex-1">
                {tags.map((tag) => {
                  const handleTagClick = () => {
                    if (tag === '折扣') {
                      onNavigateToDiscount?.();
                    } else if (tag === '熱銷') {
                      onNavigateToTrending?.();
                    } else {
                      setSelectedTag(tag);
                    }
                  };
                  
                  return (
                    <button
                      key={tag}
                      onClick={handleTagClick}
                      className={`flex-shrink-0 h-[40px] rounded-full px-4 py-2 border-2 transition-all ${
                        selectedTag === tag
                          ? 'bg-[var(--vesti-primary)] text-white border-[var(--vesti-primary)]'
                          : 'bg-white text-[var(--vesti-gray-mid)] border-[var(--vesti-gray-mid)]/30 hover:bg-[var(--vesti-gray-light)]'
                      }`}
                      style={{ fontSize: 'var(--text-label)' }}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* AI 引導式問答按鈕 */}
          {viewMode === 'shopping' && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsQuizOpen(true)}
              className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--vesti-primary)] py-3 text-white shadow-[0_4px_12px_rgba(41,108,125,0.3),0_8px_24px_rgba(41,108,125,0.2),inset_0_1px_2px_rgba(255,255,255,0.2)] transition-all hover:shadow-[0_6px_16px_rgba(41,108,125,0.35),0_12px_32px_rgba(41,108,125,0.25),inset_0_1px_2px_rgba(255,255,255,0.3)] hover:-translate-y-0.5"
            >
              <Sparkles className="h-5 w-5" strokeWidth={2} />
              不知道買什麼？
            </motion.button>
          )}
        </div>
      </motion.header>

      {/* Content */}
      <AnimatePresence mode="wait">
        {viewMode === 'shopping' ? (
          <motion.div
            key="shopping"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* 推薦店家 */}
            <section className="mb-6 px-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[var(--vesti-dark)]">推薦店家</h2>
                <button 
                  onClick={() => setShowAllStores(true)}
                  className="text-[var(--vesti-dark)]" 
                  style={{ fontSize: 'var(--text-label)' }}
                >
                  查看全部
                </button>
              </div>

              <div className="flex gap-3 overflow-x-auto pb-2">
                {featuredStores.map((store) => (
                  <motion.div
                    key={store.id}
                    whileTap={{ scale: 0.95 }}
                    className="flex-shrink-0 cursor-pointer"
                    onClick={() => setSelectedStore(store)}
                  >
                    <div className="w-40 overflow-hidden rounded-3xl bg-card border-2 border-[var(--vesti-gray-mid)]/30 shadow-[0_4px_16px_rgba(0,0,0,0.12)]">
                      <div className="aspect-[4/3] overflow-hidden">
                        <ImageWithFallback
                          src={store.imageUrl}
                          alt={store.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="p-3">
                        <h4 className="mb-1 text-[var(--vesti-dark)] truncate">{store.name}</h4>
                        <p className="text-[var(--vesti-gray-mid)] truncate" style={{ fontSize: 'var(--text-label)' }}>
                          {store.category}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* 單品推薦 */}
            <section className="px-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[var(--vesti-dark)]">精選單品</h2>
                <button 
                  onClick={() => setShowAllProducts(true)}
                  className="text-[var(--vesti-dark)]" 
                  style={{ fontSize: 'var(--text-label)' }}
                >
                  查看全部
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {featuredProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedProduct(product)}
                    className="relative overflow-hidden rounded-3xl bg-card border-2 border-[var(--vesti-gray-mid)]/30 shadow-[0_4px_16px_rgba(0,0,0,0.12)] cursor-pointer"
                  >
                    <div className="aspect-[4/5] overflow-hidden">
                      <ImageWithFallback
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    </div>
                    <div className="flex items-center gap-2 p-3">
                      <div className="flex-1 min-w-0">
                        <p className="mb-1 text-[var(--vesti-primary)] truncate" style={{ fontSize: 'var(--text-label)' }}>
                          {product.brand}
                        </p>
                        <h4 className="mb-2 text-[var(--vesti-dark)] line-clamp-1" style={{ lineHeight: 1.3 }}>{product.name}</h4>
                        <p className="text-[var(--vesti-primary)] whitespace-nowrap" style={{ fontWeight: 700, fontSize: '15px' }}>
                          NT$ {product.price.toLocaleString()}
                        </p>
                      </div>
                      {/* 加入試穿籃按鈕 - 位於右側 */}
                      <div className="mr-1 flex-shrink-0">
                        <button 
                          className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[var(--vesti-primary)] text-white shadow-lg transition-all hover:scale-110 hover:shadow-xl active:scale-95 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            toast.success(`已將 ${product.name} 加入試穿籃`);
                          }}
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
          </motion.div>
        ) : (
          <motion.div
            key="outfit"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* 整套推薦 - AI 搭配推薦 */}
            <section>
              <AIOutfitRecommendation outfits={outfitSets} />
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quiz Modal */}
      <QuizModal
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        onComplete={handleQuizComplete}
      />

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

      {/* 浮動 FAB 按鈕組 - 僅在購物模式且非整套搭配時顯示 */}
      {tryOnCount > 0 && viewMode === 'shopping' && (
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