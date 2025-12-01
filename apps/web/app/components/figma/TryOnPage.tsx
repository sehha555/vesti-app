import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Minus, Trash2, Save, ChevronLeft, Camera, Sparkles, ShoppingCart, ChevronRight, Search, Filter, Maximize2, Minimize2, User } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';

interface TryOnItem {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  brand: string;
  category: string;
  source: 'store' | 'wardrobe';
}

interface OutfitLayer {
  id: string;
  name: string;
  items: TryOnItem[];
  categories: string[];
}

// 模擬試穿籃商品
const mockTryOnItems: TryOnItem[] = [
  {
    id: 1,
    name: '經典白T恤',
    price: 890,
    imageUrl: 'https://images.unsplash.com/photo-1643881080033-e67069c5e4df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aGl0ZSUyMHRzaGlydCUyMGNsb3RoaW5nfGVufDF8fHx8MTc2MjU1NDc2Mnww&ixlib=rb-4.1.0&q=80&w=1080',
    brand: 'BasicWear',
    category: '上衣',
    source: 'store',
  },
  {
    id: 2,
    name: '直筒牛仔褲',
    price: 1590,
    imageUrl: 'https://images.unsplash.com/photo-1602585198422-d795fa9bfd6f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZW5pbSUyMGplYW5zJTIwZmFzaGlvbnxlbnwxfHx8fDE3NjI1NzE5ODN8MA&ixlib=rb-4.1.0&q=80&w=1080',
    brand: 'Denim Co.',
    category: '褲裝',
    source: 'store',
  },
  {
    id: 3,
    name: '運動休閒鞋',
    price: 2490,
    imageUrl: 'https://images.unsplash.com/photo-1650320079970-b4ee8f0dae33?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwc25lYWtlcnMlMjBzaG9lc3xlbnwxfHx8fDE3NjI2MDI5NzB8MA&ixlib=rb-4.1.0&q=80&w=1080',
    brand: 'StepStyle',
    category: '鞋履',
    source: 'store',
  },
];

// 模擬衣櫃商品
const mockWardrobeItems: TryOnItem[] = [
  {
    id: 101,
    name: '黑色針織衫',
    price: 0,
    imageUrl: 'https://images.unsplash.com/photo-1643881080033-e67069c5e4df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aGl0ZSUyMHRzaGlydCUyMGNsb3RoaW5nfGVufDF8fHx8MTc2MjU1NDc2Mnww&ixlib=rb-4.1.0&q=80&w=1080',
    brand: '我的衣櫃',
    category: '上衣',
    source: 'wardrobe',
  },
  {
    id: 102,
    name: '卡其色長褲',
    price: 0,
    imageUrl: 'https://images.unsplash.com/photo-1602585198422-d795fa9bfd6f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZW5pbSUyMGplYW5zJTIwZmFzaGlvbnxlbnwxfHx8fDE3NjI1NzE5ODN8MA&ixlib=rb-4.1.0&q=80&w=1080',
    brand: '我的衣櫃',
    category: '褲裝',
    source: 'wardrobe',
  },
  {
    id: 103,
    name: '帆布鞋',
    price: 0,
    imageUrl: 'https://images.unsplash.com/photo-1650320079970-b4ee8f0dae33?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwc25lYWtlcnMlMjBzaG9lc3xlbnwxfHx8fDE3NjI2MDI5NzB8MA&ixlib=rb-4.1.0&q=80&w=1080',
    brand: '我的衣櫃',
    category: '鞋履',
    source: 'wardrobe',
  },
  {
    id: 104,
    name: '羊毛大衣',
    price: 0,
    imageUrl: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aW50ZXIlMjBjb2F0JTIwZmFzaGlvbnxlbnwxfHx8fDE3NjI2MDU4Njh8MA&ixlib=rb-4.1.0&q=80&w=1080',
    brand: '我的衣櫃',
    category: '外套',
    source: 'wardrobe',
  },
  {
    id: 105,
    name: '棒球帽',
    price: 0,
    imageUrl: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwY2FwJTIwaGF0fGVufDF8fHx8MTc2MjYwNTg5NHww&ixlib=rb-4.1.0&q=80&w=1080',
    brand: '我的衣櫃',
    category: '配件',
    source: 'wardrobe',
  },
];

interface TryOnPageProps {
  onBack: () => void;
  onNavigateToCheckout?: () => void;
}

export function TryOnPage({ onBack, onNavigateToCheckout }: TryOnPageProps) {
  const [tryOnItems, setTryOnItems] = useState<TryOnItem[]>(mockTryOnItems);
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isTryingOn, setIsTryingOn] = useState(false);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [selectorTab, setSelectorTab] = useState<'basket' | 'wardrobe'>('basket');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // Mock model image
  const modelImage = "https://images.unsplash.com/photo-1660681436459-24798da1a9a4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwbW9kZWwlMjBmdWxsJTIwYm9keSUyMHN0dWRpbyUyMHNob3QlMjBuZXV0cmFsJTIwYmFja2dyb3VuZHxlbnwxfHx8fDE3NjQzOTQwNTh8MA&ixlib=rb-4.1.0&q=80&w=1080";
  
  // 分層式搭配區域
  const [outfitLayers, setOutfitLayers] = useState<OutfitLayer[]>([
    { id: 'inner', name: '內層', items: [], categories: ['上衣', '襯衫', '背心'] },
    { id: 'bottom', name: '下身', items: [], categories: ['褲裝', '裙裝', '短褲'] },
    { id: 'outer', name: '外層', items: [], categories: ['外套', '大衣', '夾克'] },
    { id: 'accessories', name: '配件', items: [], categories: ['鞋履', '包包', '配件', '帽子', '飾品'] },
  ]);

  const categories = ['全部', '上衣', '褲裝', '鞋履', '外套', '配件'];

  const getLayerIdForItem = (item: TryOnItem): string => {
    for (const layer of outfitLayers) {
      if (layer.categories.includes(item.category)) {
        return layer.id;
      }
    }
    return 'accessories'; // 預設放配件層
  };

  const handleAddToLayer = (item: TryOnItem) => {
    const layerId = getLayerIdForItem(item);
    const newLayers = outfitLayers.map(layer => {
      if (layer.id === layerId) {
        // 檢查是否已存在
        if (layer.items.find(i => i.id === item.id)) {
          toast.error('此商品已在該層');
          return layer;
        }
        return { ...layer, items: [...layer.items, item] };
      }
      return layer;
    });
    setOutfitLayers(newLayers);
    toast.success(`已加入 ${item.name} 到${outfitLayers.find(l => l.id === layerId)?.name}`);
    setIsSelectorOpen(false);
  };

  const handleRemoveFromLayer = (itemId: number, layerId: string) => {
    const newLayers = outfitLayers.map(layer => {
      if (layer.id === layerId) {
        return { ...layer, items: layer.items.filter(item => item.id !== itemId) };
      }
      return layer;
    });
    setOutfitLayers(newLayers);
    toast.success('已移除商品');
  };

  const handleRemoveFromTryOn = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setTryOnItems(tryOnItems.filter(item => item.id !== id));
    toast.success('已從試穿籃移除');
  };

  const handleSaveOutfit = () => {
    const totalItems = outfitLayers.reduce((sum, layer) => sum + layer.items.length, 0);
    if (totalItems > 0) {
      toast.success('搭配已儲存！');
    } else {
      toast.error('請先選擇商品');
    }
  };

  const handleStartTryOn = () => {
    const totalItems = outfitLayers.reduce((sum, layer) => sum + layer.items.length, 0);
    if (totalItems === 0) {
      toast.error('請先選擇要試穿的商品');
      return;
    }
    
    setIsTryingOn(true);
    toast.success('正在啟動 AI 虛擬試穿 📸');
    
    // 模擬處理
    setTimeout(() => {
      setIsTryingOn(false);
      toast.success('試穿效果已生成！');
    }, 2500);
  };

  const handleAnalyzeCompatibility = () => {
    setIsAnalyzing(true);
    toast.success('正在分析衣櫃適配性 ✨');
    
    // 模擬分析
    setTimeout(() => {
      setIsAnalyzing(false);
      const score = Math.floor(Math.random() * 30) + 70; // 70-100分
      toast.success(`適配度評分：${score}分 - 與您的衣櫃風格高度契合！`);
    }, 2500);
  };

  const totalPrice = outfitLayers.reduce((sum, layer) => {
    return sum + layer.items.reduce((layerSum, item) => layerSum + item.price, 0);
  }, 0);

  const totalItems = outfitLayers.reduce((sum, layer) => sum + layer.items.length, 0);

  const displayedItems = selectorTab === 'basket' 
    ? (selectedCategory === '全部' ? tryOnItems : tryOnItems.filter(i => i.category === selectedCategory))
    : (selectedCategory === '全部' ? mockWardrobeItems : mockWardrobeItems.filter(i => i.category === selectedCategory));

  // View Switching logic
  if (isSelectorOpen) {
    return (
      <div className="min-h-screen bg-[var(--vesti-background)] flex flex-col">
        {/* Selector Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
           <button 
              onClick={() => setIsSelectorOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors -ml-2"
           >
              <ChevronLeft className="h-6 w-6 text-[var(--vesti-dark)]" />
           </button>
           <h2 className="text-lg font-bold text-[var(--vesti-dark)]">選擇商品</h2>
           <div className="w-10" /> {/* Spacer for centering */}
        </div>

        {/* Selector Tabs */}
        <div className="px-5 py-3 bg-[var(--vesti-background)]">
           <div className="flex p-1 bg-gray-200/50 rounded-xl">
              <button
                 onClick={() => setSelectorTab('basket')}
                 className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${selectorTab === 'basket' ? 'bg-white text-[var(--vesti-primary)] shadow-sm' : 'text-[var(--vesti-gray-mid)] hover:text-[var(--vesti-dark)]'}`}
              >
                 試穿籃 ({tryOnItems.length})
              </button>
              <button
                 onClick={() => setSelectorTab('wardrobe')}
                 className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${selectorTab === 'wardrobe' ? 'bg-white text-[var(--vesti-primary)] shadow-sm' : 'text-[var(--vesti-gray-mid)] hover:text-[var(--vesti-dark)]'}`}
              >
                 我的衣櫃
              </button>
           </div>
        </div>

        {/* Categories Filter */}
        <div className="px-5 pb-3 overflow-x-auto scrollbar-hide flex gap-2 sticky top-[60px] z-10 bg-[var(--vesti-background)] border-b border-gray-100/50">
           {categories.map((cat) => (
              <button
                 key={cat}
                 onClick={() => setSelectedCategory(cat)}
                 className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${selectedCategory === cat ? 'bg-[var(--vesti-dark)] text-white' : 'bg-white border border-gray-200 text-gray-500'}`}
              >
                 {cat}
              </button>
           ))}
        </div>

        {/* Grid Content */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar-hide">
           {/* Analyze Button (Only in Basket) */}
           {selectorTab === 'basket' && (
              <button
                 onClick={handleAnalyzeCompatibility}
                 className="w-full mb-6 relative overflow-hidden flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white border-2 border-[var(--vesti-primary)] text-[var(--vesti-primary)] shadow-[0_4px_12px_rgba(41,108,125,0.15)] hover:bg-[var(--vesti-primary)] hover:text-white hover:shadow-[0_6px_20px_rgba(41,108,125,0.25)] hover:-translate-y-0.5 transition-all duration-300 group"
              >
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
                 <Sparkles className="h-5 w-5 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300" />
                 <span className="font-bold text-sm tracking-wide">分析試穿籃適配性</span>
              </button>
           )}

           {displayedItems.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 pb-20">
                 {displayedItems.map((item) => (
                     <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.03, y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleAddToLayer(item)}
                        className="group relative aspect-[3/4] flex-shrink-0 cursor-pointer"
                        style={{ perspective: '1000px' }}
                     >
                        <div
                           className="relative h-full w-full overflow-hidden rounded-[16px] bg-card border-2 border-[var(--vesti-gray-mid)]/30 shadow-[4px_4px_16px_rgba(41,108,125,0.15)] transition-all duration-300 group-hover:shadow-[8px_8px_24px_rgba(41,108,125,0.2)]"
                           style={{ transformStyle: 'preserve-3d' }}
                        >
                           <ImageWithFallback src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                           
                           {/* Hover Overlay with Plus */}
                           <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <div className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform">
                                 <Plus className="h-6 w-6 text-[var(--vesti-primary)]" strokeWidth={3} />
                              </div>
                           </div>

                           {/* Info Bar */}
                           <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                              {item.brand !== '我的衣櫃' && (
                                 <p className="text-white font-bold text-sm truncate">{item.brand}</p>
                              )}
                              <p className="text-white/80 text-xs truncate text-[13px]">{item.name}</p>
                           </div>

                           {/* Delete Button (Only in Basket Tab) */}
                           {selectorTab === 'basket' && (
                              <button
                                 onClick={(e) => handleRemoveFromTryOn(item.id, e)}
                                 className="absolute top-2 right-2 w-8 h-8 rounded-full bg-[var(--vesti-gray-light)] border border-white/50 flex items-center justify-center text-[var(--vesti-gray-mid)] hover:bg-[var(--vesti-destructive)] hover:text-white transition-colors shadow-sm z-20"
                              >
                                 <Minus className="h-4 w-4" strokeWidth={3} />
                              </button>
                           )}

                           {/* 3D border overlay */}
                           <div 
                              className="pointer-events-none absolute inset-0 rounded-[16px] border border-white/20"
                              style={{
                                 boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.4)',
                              }}
                           />
                        </div>
                     </motion.div>
                 ))}
              </div>
           ) : (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                 <Search className="h-12 w-12 mb-3 opacity-20" />
                 <p>沒有找到相關商品</p>
              </div>
           )}
        </div>

        {/* Checkout Footer (Only in Basket Tab) */}
        {selectorTab === 'basket' && tryOnItems.length > 0 && (
           <div className="p-5 border-t border-gray-100 bg-white/95 backdrop-blur-sm sticky bottom-0 z-20 pb-8 shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">
             <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500 font-medium">共 {tryOnItems.length} 件商品</span>
                <span className="text-lg font-bold text-[var(--vesti-primary)]">
                   NT$ {tryOnItems.reduce((sum, item) => sum + item.price, 0).toLocaleString()}
                </span>
             </div>
             <button
                onClick={onNavigateToCheckout}
                className="w-full py-3.5 rounded-xl bg-[var(--vesti-dark)] text-white font-bold shadow-lg shadow-gray-200 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
             >
                <ShoppingCart size={18} />
                前往結帳
             </button>
           </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--vesti-background)] relative">
      {/* Main View */}
      <div className="pb-44">
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
            <h1 className="text-[var(--vesti-dark)]">虛擬試穿</h1>
            <button
              onClick={handleSaveOutfit}
              className="flex items-center gap-1 text-[var(--vesti-primary)]"
            >
              <Save className="h-5 w-5" strokeWidth={2} />
              <span style={{ fontSize: 'var(--text-label)' }}>儲存</span>
            </button>
          </div>
        </motion.header>

        {/* Main Content - My Outfit Layers */}
        <section className="px-5 py-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[var(--vesti-dark)] flex items-center gap-2">
                <span className="bg-[var(--vesti-primary)] w-1.5 h-6 rounded-full block"></span>
                我的搭配
              </h2>
              <p className="mt-1 pl-3.5 text-[var(--vesti-gray-mid)] text-sm font-medium">
                {totalItems > 0 ? `已選擇 ${totalItems} 件商品` : '點擊下方區塊來選擇商品'}
              </p>
            </div>
          </div>

          <div className="rounded-3xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.08)] overflow-hidden border border-[var(--vesti-gray-mid)] ring-1 ring-black/5">
            <Accordion type="multiple" defaultValue={['inner', 'bottom', 'outer', 'accessories']} className="w-full divide-y divide-[var(--vesti-gray-light)]/80">
              {outfitLayers.map((layer) => (
                <AccordionItem key={layer.id} value={layer.id} className="border-0">
                  <AccordionTrigger className="px-6 py-5 hover:bg-[var(--vesti-gray-light)]/30 transition-all group data-[state=open]:bg-[var(--vesti-gray-light)]/10">
                    <div className="flex items-center justify-between w-full pr-3">
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-bold text-[var(--vesti-dark)] group-hover:text-[var(--vesti-primary)] transition-colors">
                          {layer.name}
                        </span>
                        {layer.items.length > 0 && (
                          <span className="flex h-6 px-2.5 items-center justify-center rounded-full bg-[var(--vesti-primary)] text-white text-xs font-bold shadow-sm">
                            {layer.items.length}
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-[var(--vesti-gray-mid)] font-medium group-hover:text-[var(--vesti-dark)]/70 transition-colors">
                        {layer.categories.join(' · ')}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6 pt-2 bg-[var(--vesti-gray-light)]/5">
                    {layer.items.length > 0 ? (
                      <div className="flex flex-wrap gap-4">
                        {layer.items.map((item) => (
                          <motion.div
                            key={item.id}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            whileHover={{ y: -2 }}
                            className="relative group"
                          >
                            <div className="h-20 w-20 overflow-hidden rounded-xl border border-[var(--vesti-gray-light)] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-all">
                              <ImageWithFallback
                                src={item.imageUrl}
                                alt={item.name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <button
                              onClick={() => handleRemoveFromLayer(item.id, layer.id)}
                              className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--vesti-dark)] text-white shadow-lg opacity-100 transition-all hover:scale-110 border-2 border-[var(--vesti-background)] z-10"
                            >
                              <X className="h-4 w-4" strokeWidth={3} />
                            </button>
                          </motion.div>
                        ))}
                        {/* Add more button inside populated layer */}
                        <button
                           onClick={() => {
                              setSelectorTab('wardrobe');
                              setIsSelectorOpen(true);
                           }}
                           className="h-20 w-20 rounded-xl border-2 border-dashed border-[var(--vesti-gray-mid)] bg-[var(--vesti-gray-light)]/5 flex items-center justify-center text-[var(--vesti-gray-mid)] hover:border-[var(--vesti-primary)] hover:text-[var(--vesti-primary)] transition-colors"
                        >
                           <Plus className="h-6 w-6" />
                        </button>
                      </div>
                    ) : (
                      <div 
                        onClick={() => {
                           setSelectorTab('basket');
                           setIsSelectorOpen(true);
                        }}
                        className="flex flex-col items-center justify-center py-8 text-[var(--vesti-gray-mid)] border-2 border-dashed border-[var(--vesti-gray-mid)]/50 hover:border-[var(--vesti-gray-mid)] rounded-xl bg-[var(--vesti-gray-light)]/5 cursor-pointer hover:bg-[var(--vesti-gray-light)]/20 transition-all group"
                      >
                        <Plus className="h-8 w-8 mb-2 opacity-30 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                        <p style={{ fontSize: 'var(--text-label)' }}>尚未選擇{layer.name}商品</p>
                        <p style={{ fontSize: 'var(--text-label)', marginTop: '4px' }}>點擊此處選擇商品</p>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {/* 總價 */}
            {totalPrice > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between border-t border-border px-5 py-4 bg-[var(--vesti-gray-light)]/30"
              >
                <span className="text-[var(--vesti-dark)] font-medium">商品總價</span>
                <span className="text-[var(--vesti-primary)]" style={{ fontWeight: 700, fontSize: 'var(--text-h4)' }}>
                  NT$ {totalPrice.toLocaleString()}
                </span>
              </motion.div>
            )}
          </div>
        </section>

        {/* Live Preview Card */}
        <section className="px-5 pb-6">
           <h3 className="text-sm font-bold text-[var(--vesti-dark)] mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--vesti-primary)]" />
              <span>即時合成預覽</span>
           </h3>
           <motion.div 
              layoutId="preview-card"
              onClick={() => setIsPreviewOpen(true)}
              className="relative w-full aspect-[4/5] bg-gray-100 rounded-3xl shadow-md overflow-hidden cursor-pointer group ring-1 ring-black/5"
           >
               {/* Main Preview Image */}
               <ImageWithFallback 
                  src={modelImage} 
                  alt="Model Preview" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
               />
               
               {/* Overlay Gradient */}
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

               {/* Floating Tag */}
               <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm z-10">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-bold text-[var(--vesti-dark)]">AI 預覽中</span>
               </div>

               {/* Compare Button Overlay */}
               <div className="absolute top-4 right-4">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-white group-hover:bg-white group-hover:text-[var(--vesti-dark)] transition-all">
                     <Maximize2 className="w-5 h-5" />
                  </div>
               </div>

               {/* Applied Items Preview */}
               <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center -space-x-2">
                        {totalItems > 0 ? (
                           <>
                              {outfitLayers.flatMap(l => l.items).slice(0, 4).map((item, idx) => (
                                 <div key={idx} className="w-10 h-10 rounded-full border-2 border-white bg-white overflow-hidden shadow-sm">
                                    <ImageWithFallback src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                 </div>
                              ))}
                              {totalItems > 4 && (
                                 <div className="w-10 h-10 rounded-full border-2 border-white bg-[var(--vesti-dark)] flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                    +{totalItems - 4}
                                 </div>
                              )}
                           </>
                        ) : (
                           <span className="text-white/90 text-sm font-medium">尚未選擇商品</span>
                        )}
                     </div>
                     
                     {/* Action Text */}
                     <div className="flex items-center gap-1 text-white/90 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-4 group-hover:translate-x-0">
                        <span>查看詳情</span>
                        <ChevronRight className="w-4 h-4" />
                     </div>
                  </div>
               </div>
           </motion.div>
        </section>

        {/* Full Screen Preview Modal */}
        <AnimatePresence>
           {isPreviewOpen && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center p-5">
                 <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    onClick={() => setIsPreviewOpen(false)}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                 />
                 <motion.div 
                    layoutId="preview-card"
                    className="relative w-full max-w-sm aspect-[3/4] bg-white rounded-[32px] overflow-hidden shadow-2xl z-10 flex flex-col"
                 >
                    {/* Close Button */}
                    <button 
                       onClick={(e) => {
                          e.stopPropagation();
                          setIsPreviewOpen(false);
                       }}
                       className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/20 backdrop-blur-md text-white flex items-center justify-center z-20 hover:bg-black/30 transition-colors"
                    >
                       <Minimize2 className="w-5 h-5" />
                    </button>

                    {/* Main Preview Area */}
                    <div className="flex-1 relative bg-gray-100">
                       {/* Base Model */}
                       <ImageWithFallback src={modelImage} alt="Model" className="w-full h-full object-cover" />
                       
                       {/* Overlay Items (Simulated) */}
                       <div className="absolute inset-0 pointer-events-none mix-blend-multiply opacity-50">
                          {/* This is a simulated overlay effect */}
                          <div className="w-full h-full bg-gradient-to-t from-[var(--vesti-primary)]/10 to-transparent" />
                       </div>
                       
                       {/* Item List Overlay at Bottom */}
                       <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                          <h3 className="text-white font-bold text-lg mb-3">目前搭配預覽</h3>
                          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                             {outfitLayers.flatMap(l => l.items).map(item => (
                                <div key={item.id} className="flex-shrink-0 w-14 h-14 rounded-xl border-2 border-white/30 bg-white/10 backdrop-blur-sm overflow-hidden">
                                   <ImageWithFallback src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                </div>
                             ))}
                          </div>
                       </div>
                    </div>
                 </motion.div>
              </div>
           )}
        </AnimatePresence>

        {/* Actions */}
        <div className="fixed bottom-16 left-0 right-0 bg-[var(--vesti-background)]/95 backdrop-blur-md border-t border-border px-4 py-3 flex gap-3 z-30">
           {/* Secondary Action: Checkout */}
          {tryOnItems.length > 0 && onNavigateToCheckout && (
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={onNavigateToCheckout}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-3.5 rounded-2xl bg-white border-2 border-[var(--vesti-dark)] text-[var(--vesti-dark)] font-bold shadow-[0_2px_8px_rgba(0,0,0,0.05)] hover:bg-gray-50 transition-all active:scale-[0.98]"
            >
               <ShoppingCart className="h-5 w-5" strokeWidth={2.5} />
               <span>結帳</span>
               <span className="bg-[var(--vesti-dark)] text-white text-[11px] font-bold px-2 py-0.5 rounded-full ml-0.5 min-w-[20px] flex items-center justify-center">{tryOnItems.length}</span>
            </motion.button>
          )}

          {/* Primary Action: AI Try On */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleStartTryOn}
            disabled={isTryingOn}
            className={`relative overflow-hidden rounded-2xl bg-[var(--vesti-dark)] text-white px-4 py-3.5 shadow-[0_8px_20px_rgba(0,0,0,0.15)] transition-all disabled:opacity-70 ${tryOnItems.length > 0 ? 'flex-[1.5]' : 'w-full'}`}
          >
            <div className="relative z-10 flex items-center justify-center gap-2">
              <Camera className="h-6 w-6" strokeWidth={2} />
              <span className="text-lg font-bold tracking-wide whitespace-nowrap">
                {isTryingOn ? '生成中...' : 'AI 試穿'}
              </span>
            </div>
            {isTryingOn && (
               <motion.div 
                  className="absolute inset-0 bg-white/10"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
               />
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}