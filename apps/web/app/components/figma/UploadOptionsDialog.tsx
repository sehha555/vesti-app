import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Image, Link, X } from 'lucide-react';

interface UploadOptionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCamera: () => void;
  onSelectGallery: () => void;
  // 回傳錯誤訊息；成功回 null（由呼叫端關閉對話框）
  onImportUrl?: (input: { url: string; name?: string; category?: string }) => Promise<string | null>;
}

const IMPORT_CATEGORIES = [
  { value: '', label: '自動判斷（未分類）' },
  { value: 'top', label: '上身' },
  { value: 'outerwear', label: '外套' },
  { value: 'bottom', label: '下身' },
  { value: 'shoes', label: '鞋子' },
  { value: 'accessory', label: '配件' },
];

export function UploadOptionsDialog({
  isOpen,
  onClose,
  onSelectCamera,
  onSelectGallery,
  onImportUrl
}: UploadOptionsDialogProps) {
  const [selectedOption, setSelectedOption] = useState<'camera' | 'gallery' | null>(null);
  const [showUrlForm, setShowUrlForm] = useState(false);
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onImportUrl) return;
    setSubmitting(true);
    setImportError(null);
    try {
      const error = await onImportUrl({
        url: url.trim(),
        ...(name.trim() ? { name: name.trim() } : {}),
        ...(category ? { category } : {}),
      });
      if (error) {
        setImportError(error);
        return;
      }
      setUrl('');
      setName('');
      setCategory('');
      setShowUrlForm(false);
    } catch {
      setImportError('匯入失敗，請稍後再試');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCameraClick = () => {
    setSelectedOption('camera');
    setTimeout(() => {
      onSelectCamera();
      setSelectedOption(null);
    }, 300);
  };

  const handleGalleryClick = () => {
    setSelectedOption('gallery');
    setTimeout(() => {
      onSelectGallery();
      setSelectedOption(null);
    }, 300);
  };
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Dialog */}
          <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ 
                type: 'spring',
                stiffness: 300,
                damping: 30
              }}
              className="w-full max-w-md pointer-events-auto mb-32 mx-4"
            >
              <div
                data-testid="upload-options-dialog"
                className="relative rounded-3xl bg-white/95 backdrop-blur-xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.3)]"
              >
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--vesti-light-bg)] hover:bg-[var(--vesti-light-gray)] transition-colors"
                >
                  <X className="h-4 w-4 text-[var(--vesti-dark)]" strokeWidth={2.5} />
                </button>

                {/* Title */}
                <div className="mb-6">
                  <h3 className="text-[var(--vesti-dark)] mb-1" style={{ fontWeight: 600 }}>
                    上傳衣服
                  </h3>
                  <p className="text-[var(--vesti-text-secondary)]" style={{ fontSize: '14px' }}>
                    選擇上傳方式
                  </p>
                </div>

                {/* Options */}
                <div className="flex flex-col gap-3">
                  {/* Camera Option */}
                  <motion.button
                    onClick={handleCameraClick}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center gap-4 rounded-2xl p-4 text-left shadow-lg transition-all duration-300 ${
                      selectedOption === 'camera'
                        ? 'bg-gradient-to-br from-[var(--vesti-primary)] to-[var(--vesti-primary-dark)] shadow-xl'
                        : 'bg-[var(--vesti-secondary)]/30 hover:bg-[var(--vesti-secondary)]/40 hover:shadow-xl'
                    }`}
                  >
                    <div className={`flex h-14 w-14 items-center justify-center rounded-full transition-all duration-300 ${
                      selectedOption === 'camera'
                        ? 'bg-white/20 backdrop-blur-sm'
                        : 'bg-white/60'
                    }`}>
                      <Camera 
                        className={`h-7 w-7 transition-all duration-300 ${
                          selectedOption === 'camera' ? 'text-white' : 'text-[var(--vesti-primary)]'
                        }`} 
                        strokeWidth={2.5} 
                      />
                    </div>
                    <div className="flex-1">
                      <div 
                        className={`mb-1 transition-all duration-300 ${
                          selectedOption === 'camera' ? 'text-white' : 'text-[var(--vesti-dark)]'
                        }`} 
                        style={{ fontWeight: 600 }}
                      >
                        拍照
                      </div>
                      <div 
                        className={`transition-all duration-300 ${
                          selectedOption === 'camera' ? 'text-white/80' : 'text-[var(--vesti-text-secondary)]'
                        }`} 
                        style={{ fontSize: '13px' }}
                      >
                        使用相機拍攝衣服
                      </div>
                    </div>
                  </motion.button>

                  {/* Gallery Option */}
                  <motion.button
                    onClick={handleGalleryClick}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center gap-4 rounded-2xl p-4 text-left shadow-lg transition-all duration-300 ${
                      selectedOption === 'gallery'
                        ? 'bg-gradient-to-br from-[var(--vesti-primary)] to-[var(--vesti-primary-dark)] shadow-xl'
                        : 'bg-[var(--vesti-secondary)]/30 hover:bg-[var(--vesti-secondary)]/40 hover:shadow-xl'
                    }`}
                  >
                    <div className={`flex h-14 w-14 items-center justify-center rounded-full transition-all duration-300 ${
                      selectedOption === 'gallery'
                        ? 'bg-white/20 backdrop-blur-sm'
                        : 'bg-white/60'
                    }`}>
                      <Image 
                        className={`h-7 w-7 transition-all duration-300 ${
                          selectedOption === 'gallery' ? 'text-white' : 'text-[var(--vesti-primary)]'
                        }`} 
                        strokeWidth={2.5} 
                      />
                    </div>
                    <div className="flex-1">
                      <div 
                        className={`mb-1 transition-all duration-300 ${
                          selectedOption === 'gallery' ? 'text-white' : 'text-[var(--vesti-dark)]'
                        }`} 
                        style={{ fontWeight: 600 }}
                      >
                        從相簿選擇
                      </div>
                      <div 
                        className={`transition-all duration-300 ${
                          selectedOption === 'gallery' ? 'text-white/80' : 'text-[var(--vesti-text-secondary)]'
                        }`} 
                        style={{ fontSize: '13px' }}
                      >
                        從手機相簿中挑選照片
                      </div>
                    </div>
                  </motion.button>

                  {/* 貼商品網址匯入 */}
                  {onImportUrl && !showUrlForm && (
                    <motion.button
                      onClick={() => setShowUrlForm(true)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-4 rounded-2xl p-4 text-left shadow-lg transition-all duration-300 bg-[var(--vesti-secondary)]/30 hover:bg-[var(--vesti-secondary)]/40 hover:shadow-xl"
                    >
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/60">
                        <Link className="h-7 w-7 text-[var(--vesti-primary)]" strokeWidth={2.5} />
                      </div>
                      <div className="flex-1">
                        <div className="mb-1 text-[var(--vesti-dark)]" style={{ fontWeight: 600 }}>
                          貼商品網址
                        </div>
                        <div className="text-[var(--vesti-text-secondary)]" style={{ fontSize: '13px' }}>
                          UNIQLO 台灣可貼商品頁；其他品牌貼圖片網址
                        </div>
                      </div>
                    </motion.button>
                  )}

                  {onImportUrl && showUrlForm && (
                    <form onSubmit={handleImportSubmit} className="flex flex-col gap-3 rounded-2xl bg-[var(--vesti-secondary)]/30 p-4">
                      <input
                        type="url"
                        required
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://www.uniqlo.com/tw/..."
                        className="w-full rounded-xl bg-white px-3 py-2 text-[var(--vesti-dark)] outline-none"
                        style={{ fontSize: '14px' }}
                      />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={100}
                        placeholder="名稱（選填）"
                        className="w-full rounded-xl bg-white px-3 py-2 text-[var(--vesti-dark)] outline-none"
                        style={{ fontSize: '14px' }}
                      />
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full rounded-xl bg-white px-3 py-2 text-[var(--vesti-dark)] outline-none"
                        style={{ fontSize: '14px' }}
                      >
                        {IMPORT_CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        disabled={submitting || !url.trim()}
                        className="rounded-xl bg-[var(--vesti-primary)] py-2 text-white disabled:opacity-50"
                        style={{ fontWeight: 600 }}
                      >
                        {submitting ? '匯入中…' : '加入衣櫃'}
                      </button>
                      {importError && (
                        <p className="text-[var(--vesti-accent)]" style={{ fontSize: '13px' }}>{importError}</p>
                      )}
                    </form>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
