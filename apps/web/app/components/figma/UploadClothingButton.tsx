import { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Plus } from 'lucide-react';
import { UploadOptionsDialog } from './UploadOptionsDialog';
import { UploadProgressDialog } from './UploadProgressDialog';
import { toast } from 'sonner';

interface UploadClothingButtonProps {
  onUpload: (imageUrl: string) => void;
}

export function UploadClothingButton({ onUpload }: UploadClothingButtonProps) {
  const [showOptionsDialog, setShowOptionsDialog] = useState(false);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploadComplete, setIsUploadComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    setShowOptionsDialog(true);
  };

  const handleSelectCamera = () => {
    setShowOptionsDialog(false);
    // 在真實應用中，這裡會打開相機
    toast.info('相機功能需要在真實設備上使用');
    
    // 模擬相機拍照後的上傳
    simulateUpload();
  };

  const handleSelectGallery = () => {
    setShowOptionsDialog(false);
    // 觸發文件選擇器
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 檢查文件類型
    if (!file.type.startsWith('image/')) {
      toast.error('請選擇圖片文件');
      return;
    }

    // 檢查文件大小（10MB 限制）
    if (file.size > 10 * 1024 * 1024) {
      toast.error('圖片大小不能超過 10MB');
      return;
    }

    // 開始上傳流程
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      simulateUpload(imageUrl);
    };
    reader.readAsDataURL(file);
  };

  const simulateUpload = (imageUrl?: string) => {
    setShowProgressDialog(true);
    setUploadProgress(0);
    setIsUploadComplete(false);

    // 模擬上傳進度
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setUploadProgress(100);
        setIsUploadComplete(true);

        // 1秒後關閉進度對話框並跳轉到上傳頁面
        setTimeout(() => {
          setShowProgressDialog(false);
          setUploadProgress(0);
          setIsUploadComplete(false);
          
          // 使用默認圖片或用戶選擇的圖片
          const finalImageUrl = imageUrl || 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&q=80';
          onUpload(finalImageUrl);
        }, 1000);
      } else {
        setUploadProgress(progress);
      }
    }, 200);
  };

  return (
    <>
      <motion.button
        onClick={handleButtonClick}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--vesti-primary)] shadow-lg transition-shadow hover:shadow-xl"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 20,
        }}
      >
        <Plus className="h-6 w-6 text-white" strokeWidth={2.5} />
        
        {/* 光暈效果 */}
        <div className="absolute inset-0 -z-10 animate-pulse rounded-full bg-[var(--vesti-primary)] opacity-40 blur-xl" />
      </motion.button>

      {/* 隱藏的文件輸入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* 上傳選項對話框 */}
      <UploadOptionsDialog
        isOpen={showOptionsDialog}
        onClose={() => setShowOptionsDialog(false)}
        onSelectCamera={handleSelectCamera}
        onSelectGallery={handleSelectGallery}
      />

      {/* 上傳進度對話框 */}
      <UploadProgressDialog
        isOpen={showProgressDialog}
        progress={uploadProgress}
        isComplete={isUploadComplete}
        fileName="衣服照片.jpg"
      />
    </>
  );
}
