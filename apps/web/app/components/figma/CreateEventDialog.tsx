import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface Outfit {
  id: number;
  name: string;
  imageUrl: string;
  occasion: string;
}

interface CreateEventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (event: {
    title: string;
    description: string;
    outfitId: number | null;
  }) => void;
  selectedDate: Date | null;
  availableOutfits: Outfit[];
  onRequestAIRecommendation?: () => void;
}

export function CreateEventDialog({
  isOpen,
  onClose,
  onConfirm,
  selectedDate,
  availableOutfits,
  onRequestAIRecommendation,
}: CreateEventDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedOutfitId, setSelectedOutfitId] = useState<number | null>(null);

  const handleConfirm = () => {
    if (!title.trim()) return;
    onConfirm({
      title: title.trim(),
      description: description.trim(),
      outfitId: selectedOutfitId,
    });
    // 重置表單
    setTitle('');
    setDescription('');
    setSelectedOutfitId(null);
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setSelectedOutfitId(null);
    onClose();
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const weekday = weekdays[date.getDay()];
    return `${year}年${month}月${day}日 (${weekday})`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />

          {/* 對話框 */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 bottom-12 z-50 flex max-h-[75vh] flex-col rounded-[24px] bg-[var(--vesti-background)] shadow-2xl"
          >
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between border-b border-[var(--vesti-gray-light)] px-6 py-4">
              <div>
                <h2 className="text-[var(--vesti-dark)]" style={{ fontSize: 'var(--text-h3)' }}>
                  新增行程
                </h2>
                {selectedDate && (
                  <p
                    className="text-[var(--vesti-text-secondary)] mt-1"
                    style={{ fontSize: 'var(--text-label)', fontWeight: 400 }}
                  >
                    {formatDate(selectedDate)}
                  </p>
                )}
              </div>
              <button
                onClick={handleClose}
                className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--vesti-gray-mid)] transition-colors hover:bg-[var(--vesti-light-bg)] hover:text-[var(--vesti-dark)]"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>

            {/* 內容 */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {/* 行程標題 */}
              <div className="mb-5">
                <label
                  className="mb-2 block text-[var(--vesti-dark)]"
                  style={{ fontSize: 'var(--text-base)' }}
                >
                  行程名稱 *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例如：開會、約會、健身..."
                  className="w-full rounded-[12px] border-2 border-[var(--vesti-gray-light)] bg-[var(--vesti-background)] px-4 py-3 text-[var(--vesti-dark)] placeholder:text-[var(--vesti-gray-mid)] transition-colors focus:border-[var(--vesti-primary)] focus:outline-none"
                  style={{ fontSize: 'var(--text-base)' }}
                  autoFocus
                />
              </div>

              {/* 行程描述 */}
              <div className="mb-5">
                <label
                  className="mb-2 block text-[var(--vesti-dark)]"
                  style={{ fontSize: 'var(--text-base)' }}
                >
                  備註說明
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="例如：重要會議、需要正式一點..."
                  rows={3}
                  className="w-full rounded-[12px] border-2 border-[var(--vesti-gray-light)] bg-[var(--vesti-background)] px-4 py-3 text-[var(--vesti-dark)] placeholder:text-[var(--vesti-gray-mid)] transition-colors focus:border-[var(--vesti-primary)] focus:outline-none resize-none"
                  style={{ fontSize: 'var(--text-base)' }}
                />
              </div>

              {/* 選擇搭配 */}
              <div className="mb-6">
                <div className="mb-3 flex items-center justify-between">
                  <label
                    className="text-[var(--vesti-dark)]"
                    style={{ fontSize: 'var(--text-base)' }}
                  >
                    選擇穿搭
                  </label>
                  {onRequestAIRecommendation && (
                    <button
                      onClick={onRequestAIRecommendation}
                      className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[var(--vesti-primary)] to-[var(--vesti-accent)] px-3 py-1.5 text-white transition-all hover:brightness-110"
                      style={{ fontSize: 'var(--text-label)' }}
                    >
                      <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
                      AI推薦
                    </button>
                  )}
                </div>

                {/* 搭配網格 */}
                <div className="grid grid-cols-2 gap-4 pb-2">
                  {availableOutfits.map((outfit) => {
                    const isSelected = selectedOutfitId === outfit.id;
                    return (
                      <button
                        key={outfit.id}
                        onClick={() =>
                          setSelectedOutfitId(isSelected ? null : outfit.id)
                        }
                        className={`group relative overflow-hidden rounded-[16px] bg-white transition-all ${
                          isSelected
                            ? 'shadow-[0_8px_24px_rgba(0,0,0,0.15),0_0_0_3px_var(--vesti-primary)] scale-[1.02]'
                            : 'shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] hover:-translate-y-0.5'
                        }`}
                      >
                        <div className="aspect-[4/5] p-2">
                          <ImageWithFallback
                            src={outfit.imageUrl}
                            alt={outfit.name}
                            className="h-full w-full rounded-[12px] object-cover"
                          />
                        </div>
                        {isSelected && (
                          <div className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--vesti-primary)] shadow-lg">
                            <svg
                              className="h-4 w-4 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        )}
                        <div className="px-2 pb-2">
                          <p
                            className="truncate text-center text-[var(--vesti-dark)]"
                            style={{ fontSize: 'var(--text-label)', fontWeight: 400 }}
                          >
                            {outfit.name}
                          </p>
                        </div>
                      </button>
                    );
                  })}

                  {availableOutfits.length === 0 && (
                    <div className="rounded-[12px] bg-[var(--vesti-light-bg)] py-8 text-center">
                      <p
                        className="text-[var(--vesti-text-secondary)]"
                        style={{ fontSize: 'var(--text-base)', fontWeight: 400 }}
                      >
                        尚無已保存的搭配
                      </p>
                      <p
                        className="mt-1 text-[var(--vesti-gray-mid)]"
                        style={{ fontSize: 'var(--text-label)', fontWeight: 400 }}
                      >
                        前往衣櫃建立穿搭吧！
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer 按鈕 */}
            <div className="flex-shrink-0 flex gap-3 border-t border-[var(--vesti-gray-light)] px-6 pt-4 pb-6 bg-[var(--vesti-background)]">
              <button
                onClick={handleClose}
                className="flex-1 rounded-[12px] border-2 border-[var(--vesti-gray-light)] bg-[var(--vesti-background)] py-3 text-[var(--vesti-dark)] transition-colors hover:bg-[var(--vesti-light-bg)]"
                style={{ fontSize: 'var(--text-base)' }}
              >
                取消
              </button>
              <button
                onClick={handleConfirm}
                disabled={!title.trim()}
                className="flex-1 rounded-[12px] bg-[var(--vesti-primary)] py-3 text-white transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100"
                style={{ fontSize: 'var(--text-base)' }}
              >
                確定
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}