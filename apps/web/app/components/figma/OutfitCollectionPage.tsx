import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Plus, Heart, Trash2, Calendar, LayoutGrid, CircleDot } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

// 真實的 Supabase 使用者 UUID
// TODO: 未來改成從認證系統取得 userId
const userId = "123e4567-e89b-12d3-a456-426614174000";

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
  const [viewMode, setViewMode] = useState<'grid' | 'carousel'>('grid');

  // 載入儲存的穿搭
  useEffect(() => {
    // 模擬 API 載入延遲
    const timer = setTimeout(() => {
      // 在實際應用中，你可以在這裡獲取數據
      // e.g., fetchOutfits().then(data => setOutfits(data));
      setIsLoading(false);
    }, 1000);

    // 清除 timeout 以避免 memory leak
    return () => clearTimeout(timer);
  }, []); // 空依賴項陣列確保 effect 只在組件掛載時運行一次

  const handleLike = async (id: string) => {
    // 找到當前穿搭的原始狀態（用於回滾）
    const outfit = outfits.find(o => o.id === id);
    if (!outfit) return;

    const previousIsLiked = outfit.isLiked;
    const newLikedState = !previousIsLiked;

    // 樂觀更新：立即更新本地 state，讓 UI 瞬間反應
    setOutfits(prev => prev.map(o =>
      o.id === id ? { ...o, isLiked: newLikedState } : o
    ));

    // 顯示對應的 toast 提示
    const toastMessage = newLikedState ? '已加入最愛' : '已移除最愛';
    toast.success(toastMessage);

    // 後台發送 API 請求，無需等待
    try {
      const response = await fetch('/api/saved-outfits/like', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          outfitId: id,
          userId: userId,
          isLiked: newLikedState,
        }),
      });

      if (!response.ok) {
        throw new Error(`API 請求失敗: ${response.statusText}`);
      }

      // API 成功，無需額外操作（因為 UI 已經更新）
      console.log(`穿搭 ${id} 的點讚狀態已同步到服務器`);
    } catch (error) {
      // API 失敗：回滾狀態到原本的值
      console.error('保存點讚狀態失敗:', error);

      setOutfits(prev => prev.map(o =>
        o.id === id ? { ...o, isLiked: previousIsLiked } : o
      ));

      // 顯示錯誤 toast
      toast.error('保存失敗，請重試');
    }
  };

  const handleDelete = (id: string) => {
    setOutfits(prev => prev.filter(outfit => outfit.id !== id));
    toast('已移除搭配');
  };

  const handleCreateNew = () => {
    toast.success('創建新搭配功能開發中');
  };



  return (
    <div className="min-h-screen bg-[var(--vesti-background)] pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[var(--vesti-background)]/95 backdrop-blur-sm">
        <div className="flex h-16 items-center justify-between px-5">
          <h1 className="tracking-widest text-[var(--vesti-primary)]">我的搭配</h1>

          <div className="flex items-center gap-2">
            {/* View Mode 切換按鈕 */}
            <motion.button
              onClick={() => setViewMode(viewMode === 'grid' ? 'carousel' : 'grid')}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 rounded-full border-2 border-[var(--vesti-primary)] px-3 py-2 text-[var(--vesti-primary)] transition-all hover:bg-[var(--vesti-primary)]/10"
            >
              {viewMode === 'grid' ? (
                <CircleDot className="h-4 w-4" strokeWidth={2.5} />
              ) : (
                <LayoutGrid className="h-4 w-4" strokeWidth={2.5} />
              )}
              <span className="text-xs font-medium">
                {viewMode === 'grid' ? '輪播' : '網格'}
              </span>
            </motion.button>

            {/* 新建按鈕 */}
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
      ) : viewMode === 'grid' ? (
        /* Grid 模式 - 2x2 網格 */
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
              <div className="relative w-full h-[400px] overflow-hidden bg-gray-100 rounded-[20px]">
                <ImageWithFallback
                  src={outfit.imageUrl}
                  alt={outfit.name}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
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
      ) : (
        /* Carousel 模式 - 橫向滑動輪播 */
        <div className="relative h-[70vh] overflow-hidden px-5">
          <motion.div
            drag="x"
            dragConstraints={{ left: -((outfits.length - 1) * 300), right: 0 }}
            className="flex gap-6 py-10 cursor-grab active:cursor-grabbing"
          >
            {outfits.map((outfit, index) => (
              <motion.div
                key={outfit.id}
                className="flex-shrink-0 w-[280px] group relative"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="overflow-hidden rounded-[20px] bg-card shadow-lg transition-all duration-300 hover:shadow-2xl">
                  {/* 圖片區域 */}
                  <div className="relative w-full h-[400px] overflow-hidden bg-gray-100 rounded-[20px]">
                    <ImageWithFallback
                      src={outfit.imageUrl}
                      alt={outfit.name}
                      className="h-full w-full object-cover transition-transform duration-700"
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
          </motion.div>
        </div>
      )}
    </div>
  );
}
