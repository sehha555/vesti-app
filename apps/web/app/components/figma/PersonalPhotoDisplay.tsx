import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Upload, User, X, Maximize2, Shirt, Image as ImageIcon, Sparkles } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner';

interface ClothingItem {
  id: number;
  name: string;
  imageUrl: string;
  category: string;
  brand?: string;
  price?: number;
}

interface Layer {
  id: string;
  name: string;
  items: ClothingItem[];
}

interface PersonalPhotoDisplayProps {
  layers: Layer[];
  onExpand?: () => void;
  onUploadPhoto?: (file: File) => void;
  userPhoto?: string;
}

export function PersonalPhotoDisplay({ layers, onExpand, onUploadPhoto, userPhoto }: PersonalPhotoDisplayProps) {
  const [localUserPhoto, setLocalUserPhoto] = useState<string | null>(userPhoto || null);
  const [isUploadHovered, setIsUploadHovered] = useState(false);

  // 預設使用示範照片
  const defaultUserPhoto = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMHBlcnNvbiUyMG5ldXRyYWwlMjBiYWNrZ3JvdW5kfGVufDF8fHx8MTc2NDM5NDA1OHww&ixlib=rb-4.1.0&q=80&w=1080";

  const displayPhoto = localUserPhoto || defaultUserPhoto;
  const totalItems = layers.reduce((sum, layer) => sum + layer.items.length, 0);
  const allItems = layers.flatMap(layer => layer.items);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('照片大小不能超過 10MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalUserPhoto(reader.result as string);
        toast.success('照片已上傳！');
        if (onUploadPhoto) {
          onUploadPhoto(file);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setLocalUserPhoto(null);
    toast.success('已恢復預設照片');
  };

  return (
    <div className="relative w-full rounded-3xl overflow-hidden bg-white border-2 border-[var(--vesti-gray-light)] shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
      
      {/* 主要展示區域 */}
      <div className="relative">
        {/* 個人照片區域 */}
        <div className="relative aspect-[4/3] bg-gradient-to-br from-[var(--vesti-light-bg)] to-white">
          <ImageWithFallback
            src={displayPhoto}
            alt="個人照片"
            className="w-full h-full object-cover"
          />
          
          {/* 照片遮罩 */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
          
          {/* 頂部控制欄 */}
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
            <div className="bg-white/90 backdrop-blur-md px-3 py-2 rounded-xl flex items-center gap-2 shadow-md border border-[var(--vesti-gray-light)]">
              <User className="w-4 h-4 text-[var(--vesti-primary)]" />
              <span className="text-[var(--vesti-dark)]" style={{ fontSize: 'var(--text-label)', fontWeight: 600 }}>
                我的試穿
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* 上傳/更換照片按鈕 */}
              <motion.label
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onHoverStart={() => setIsUploadHovered(true)}
                onHoverEnd={() => setIsUploadHovered(false)}
                className="w-10 h-10 rounded-xl bg-white/90 backdrop-blur-md flex items-center justify-center border border-[var(--vesti-gray-light)] text-[var(--vesti-dark)] hover:bg-[var(--vesti-primary)] hover:text-white transition-colors shadow-md cursor-pointer"
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                {localUserPhoto ? <Camera className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
              </motion.label>

              {/* 放大按鈕 */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onExpand}
                className="w-10 h-10 rounded-xl bg-white/90 backdrop-blur-md flex items-center justify-center border border-[var(--vesti-gray-light)] text-[var(--vesti-dark)] hover:bg-[var(--vesti-primary)] hover:text-white transition-colors shadow-md"
              >
                <Maximize2 className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          {/* 上傳提示（首次使用） */}
          {!localUserPhoto && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isUploadHovered ? 1 : 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center pointer-events-none"
            >
              <div className="text-center text-white">
                <Upload className="w-12 h-12 mx-auto mb-3" />
                <p style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>
                  上傳您的照片
                </p>
                <p className="text-white/80 mt-1" style={{ fontSize: 'var(--text-label)' }}>
                  讓試穿更貼近真實效果
                </p>
              </div>
            </motion.div>
          )}

          {/* 移除照片按鈕 */}
          {localUserPhoto && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={handleRemovePhoto}
              className="absolute top-4 left-4 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-colors shadow-md z-20"
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}
        </div>

        {/* 服裝平鋪展示區 */}
        <div className="bg-gradient-to-b from-[var(--vesti-background)] to-white p-5">
          {totalItems > 0 ? (
            <div className="space-y-4">
              {/* 標題 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shirt className="w-5 h-5 text-[var(--vesti-primary)]" />
                  <h3 
                    className="text-[var(--vesti-dark)]"
                    style={{ fontSize: 'var(--text-base)', fontWeight: 700 }}
                  >
                    搭配商品
                  </h3>
                  <span 
                    className="px-2 py-0.5 rounded-full bg-[var(--vesti-primary)]/10 text-[var(--vesti-primary)]"
                    style={{ fontSize: 'var(--text-label)', fontWeight: 600 }}
                  >
                    {totalItems} 件
                  </span>
                </div>
              </div>

              {/* 商品網格展示 */}
              <div className="grid grid-cols-4 gap-3">
                {allItems.map((item, index) => (
                  <motion.div
                    key={`${item.id}-${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative"
                  >
                    {/* 商品卡片 */}
                    <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-white border-2 border-[var(--vesti-gray-light)] shadow-[0_4px_12px_rgba(0,0,0,0.08)] group-hover:shadow-[0_8px_24px_rgba(0,0,0,0.15)] group-hover:border-[var(--vesti-primary)]/50 transition-all">
                      <ImageWithFallback
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* 商品資訊懸浮層 */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                        <p 
                          className="text-white truncate"
                          style={{ fontSize: '10px', fontWeight: 600 }}
                        >
                          {item.brand || item.category}
                        </p>
                        <p 
                          className="text-white/80 truncate"
                          style={{ fontSize: '9px' }}
                        >
                          {item.name}
                        </p>
                      </div>
                    </div>

                    {/* 層級標籤 */}
                    <div className="absolute -top-1.5 -left-1.5 z-10">
                      <div className="px-1.5 py-0.5 rounded-md bg-[var(--vesti-primary)] text-white shadow-sm">
                        <span style={{ fontSize: '9px', fontWeight: 700 }}>
                          {layers.find(l => l.items.some(i => i.id === item.id))?.name || ''}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* 分層詳細資訊（可選） */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--vesti-gray-light)]">
                {layers.filter(l => l.items.length > 0).map((layer) => (
                  <div 
                    key={layer.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--vesti-gray-light)]/30"
                  >
                    <div className="w-2 h-2 rounded-full bg-[var(--vesti-primary)]" />
                    <span 
                      className="text-[var(--vesti-text-secondary)]"
                      style={{ fontSize: 'var(--text-label)', fontWeight: 500 }}
                    >
                      {layer.name}
                    </span>
                    <span 
                      className="ml-auto text-[var(--vesti-dark)]"
                      style={{ fontSize: 'var(--text-label)', fontWeight: 600 }}
                    >
                      {layer.items.length}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* 空狀態 */
            <div className="py-8 text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-[var(--vesti-gray-light)]/30 flex items-center justify-center">
                <Shirt className="w-8 h-8 text-[var(--vesti-gray-mid)]" />
              </div>
              <p 
                className="text-[var(--vesti-gray-mid)] mb-1"
                style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}
              >
                尚未選擇商品
              </p>
              <p 
                className="text-[var(--vesti-text-secondary)]"
                style={{ fontSize: 'var(--text-label)' }}
              >
                從籃子或衣櫃選擇商品開始試穿
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 底部提示（可選顯示） */}
      {!localUserPhoto && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[var(--vesti-primary)]/90 to-transparent p-3 backdrop-blur-sm">
          <div className="flex items-center justify-center gap-2 text-white">
            <Sparkles className="w-4 h-4" />
            <span style={{ fontSize: 'var(--text-label)', fontWeight: 600 }}>
              點擊右上角上傳您的照片，讓試穿更真實
            </span>
          </div>
        </div>
      )}
    </div>
  );
}