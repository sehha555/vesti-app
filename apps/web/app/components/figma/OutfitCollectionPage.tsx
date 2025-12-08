import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Plus, Heart, Trash2, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

// 🔐 真實的 Supabase 使用者 UUID
// TODO: 未來改成從認證系統取得 userId
const REAL_USER_ID = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";

interface SavedOutfit {
  id: string;
  name: string;
  date: string;
  imageUrl: string;
  items: string[];
  isLiked?: boolean;
}

export function OutfitCollectionPage() {
  const [outfits, setOutfits] = useState<SavedOutfit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 載入儲存的穿搭
  useEffect(() => {
    const fetchSavedOutfits = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/saved-outfits?userId=${REAL_USER_ID}&outfitType=saved`);

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || '載入失敗');
        }

        // 轉換 API 資料格式
        const convertedOutfits: SavedOutfit[] = (data.outfits || []).map((outfit: any) => ({
          id: outfit.id,
          name: outfit.outfit_data?.styleName || '未命名穿搭',
          date: new Date(outfit.created_at).toLocaleDateString('zh-TW'),
          imageUrl: outfit.outfit_data?.imageUrl || outfit.outfit_data?.heroImageUrl || '',
          items: outfit.outfit_data?.items?.map((item: any) => item.name) || [],
          isLiked: false,
        }));

        setOutfits(convertedOutfits);
        console.log(`[OutfitCollectionPage] 載入 ${convertedOutfits.length} 套穿搭`);
      } catch (error) {
        console.error('載入穿搭失敗:', error);
        toast.error(error instanceof Error ? error.message : '載入穿搭失敗');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSavedOutfits();
  }, []);

  const handleLike = (id: string) => {
    setOutfits(prev => prev.map(outfit =>
      outfit.id === id ? { ...outfit, isLiked: !outfit.isLiked } : outfit
    ));
    const outfit = outfits.find(o => o.id === id);
    if (!outfit?.isLiked) {
      toast.success('已加入最愛 ❤️');
    }
  };

  const handleDelete = (id: string) => {
    setOutfits(prev => prev.filter(outfit => outfit.id !== id));
    toast('已移除搭配');
  };

  const handleCreateNew = () => {
    toast.success('創建新搭配功能開發中 ✨');
  };

  return (
    <div className="min-h-screen bg-[var(--vesti-background)] pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[var(--vesti-background)]/95 backdrop-blur-sm">
        <div className="flex h-16 items-center justify-between px-5">
          <h1 className="tracking-widest text-[var(--vesti-primary)]">我的搭配</h1>
          <motion.button
            onClick={handleCreateNew}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 rounded-full bg-[var(--vesti-primary)] px-4 py-2 text-white shadow-md transition-all hover:shadow-lg"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            <span className="text-sm">新建</span>
          </motion.button>
        </div>
      </div>

      {/* 載入狀態 */}
      {isLoading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="flex h-[400px] items-center justify-center px-5"
        >
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[var(--vesti-secondary)] border-t-[var(--vesti-primary)] mx-auto" />
            <p className="text-sm text-[var(--vesti-gray-mid)]">載入穿搭中...</p>
          </div>
        </motion.div>
      ) : outfits.length === 0 ? (
        /* 空狀態 */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col items-center justify-center px-5 pt-20"
        >
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--vesti-secondary)]">
            <Plus className="h-10 w-10 text-[var(--vesti-gray-mid)]" strokeWidth={1.5} />
          </div>
          <h3 className="mb-2 text-[var(--vesti-dark)]">尚未儲存任何穿搭</h3>
          <p className="mb-6 text-center text-sm text-[var(--vesti-gray-mid)]" style={{ fontWeight: 400 }}>
            在主頁推薦卡片點擊書籤圖示<br />即可儲存喜歡的穿搭
          </p>
        </motion.div>
      ) : (
        /* 搭配網格 */
        <div className="grid grid-cols-2 gap-4 p-5">
        {outfits.map((outfit, index) => (
          <motion.div
            key={outfit.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="group relative"
          >
            <div className="overflow-hidden rounded-[20px] bg-card shadow-md transition-all duration-300 hover:shadow-xl">
              {/* 圖片區域 */}
              <div className="relative aspect-[3/4] overflow-hidden bg-[var(--vesti-secondary)]">
                <ImageWithFallback
                  src={outfit.imageUrl}
                  alt={outfit.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                
                {/* 漸層遮罩 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                {/* 按鈕組 */}
                <div className="absolute right-2 top-2 flex flex-col gap-1.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleLike(outfit.id)}
                    className={`flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md transition-all ${
                      outfit.isLiked
                        ? 'bg-[var(--vesti-accent)] shadow-lg'
                        : 'bg-white/80 hover:bg-white'
                    }`}
                  >
                    <Heart
                      className={`h-4 w-4 ${outfit.isLiked ? 'fill-white text-white' : 'text-[var(--vesti-dark)]'}`}
                      strokeWidth={2}
                    />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleDelete(outfit.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-md transition-all hover:bg-white"
                  >
                    <Trash2 className="h-4 w-4 text-[var(--vesti-dark)]" strokeWidth={2} />
                  </motion.button>
                </div>

                {/* 底部資訊 */}
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                  <h3 className="mb-1 text-sm drop-shadow-lg">{outfit.name}</h3>
                  <div className="flex items-center gap-1 text-[11px] opacity-90">
                    <Calendar className="h-3 w-3" strokeWidth={2} />
                    <span style={{ fontWeight: 400 }}>{outfit.date}</span>
                  </div>
                </div>
              </div>

              {/* 衣物列表 */}
              <div className="p-3">
                <div className="flex flex-wrap gap-1.5">
                  {outfit.items.slice(0, 3).map((item, idx) => (
                    <span
                      key={idx}
                      className="rounded-full bg-[var(--vesti-secondary)] px-2 py-0.5 text-[10px] text-[var(--vesti-dark)]"
                      style={{ fontWeight: 400 }}
                    >
                      {item}
                    </span>
                  ))}
                  {outfit.items.length > 3 && (
                    <span
                      className="rounded-full bg-[var(--vesti-secondary)] px-2 py-0.5 text-[10px] text-[var(--vesti-gray-mid)]"
                      style={{ fontWeight: 400 }}
                    >
                      +{outfit.items.length - 3}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        </div>
      )}
    </div>
  );
}
