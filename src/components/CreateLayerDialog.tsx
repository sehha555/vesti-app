import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface CreateLayerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (layerName: string) => void;
  editingLayer?: { id: string; name: string } | null;
}

export function CreateLayerDialog({ isOpen, onClose, onConfirm, editingLayer }: CreateLayerDialogProps) {
  const [layerName, setLayerName] = useState(editingLayer?.name || '');

  const handleConfirm = () => {
    if (layerName.trim()) {
      onConfirm(layerName.trim());
      setLayerName('');
      onClose();
    }
  };

  const handleClose = () => {
    setLayerName('');
    onClose();
  };

  // 當編輯層時更新輸入框
  useState(() => {
    if (editingLayer) {
      setLayerName(editingLayer.name);
    }
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* 對話框 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
            }}
            className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[24px] bg-card p-6 shadow-2xl"
          >
            {/* 關閉按鈕 */}
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleClose}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--vesti-secondary)] transition-colors hover:bg-[var(--vesti-primary)] hover:text-white"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </motion.button>

            {/* 標題 */}
            <h2 className="mb-4 pr-8 text-[var(--vesti-dark)]">
              {editingLayer ? '編輯層名稱' : '新增衣櫃層'}
            </h2>

            {/* 輸入框 */}
            <div className="mb-6">
              <label className="mb-2 block text-sm text-[var(--vesti-gray-mid)]" style={{ fontWeight: 400 }}>
                層名稱
              </label>
              <input
                type="text"
                value={layerName}
                onChange={(e) => setLayerName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                placeholder="例如：襯衫、外套、配件..."
                className="w-full rounded-xl border-2 border-border bg-[var(--vesti-secondary)] px-4 py-3 text-[var(--vesti-dark)] transition-all focus:border-[var(--vesti-primary)] focus:outline-none"
                autoFocus
              />
            </div>

            {/* 按鈕組 */}
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleClose}
                className="flex-1 rounded-xl border-2 border-border bg-card py-3 text-[var(--vesti-dark)] transition-all hover:bg-[var(--vesti-secondary)] text-center"
                style={{ fontWeight: 400 }}
              >
                取消
              </motion.button>
              <motion.button
                whileHover={{ scale: layerName.trim() ? 1.02 : 1 }}
                whileTap={{ scale: layerName.trim() ? 0.98 : 1 }}
                onClick={handleConfirm}
                disabled={!layerName.trim()}
                className={`flex-1 rounded-xl py-3 transition-all text-center ${
                  layerName.trim()
                    ? 'bg-[#5A5158] text-white hover:bg-[#4A434A]'
                    : 'cursor-not-allowed bg-[#8B8089] text-white opacity-40'
                }`}
                style={{ fontWeight: 400 }}
              >
                {editingLayer ? '保存' : '創建'}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
