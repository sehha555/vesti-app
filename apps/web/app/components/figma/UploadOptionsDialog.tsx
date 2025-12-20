import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Image, X } from 'lucide-react';

interface UploadOptionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCamera: () => void;
  onSelectGallery: () => void;
}

export function UploadOptionsDialog({
  isOpen,
  onClose,
  onSelectCamera,
  onSelectGallery
}: UploadOptionsDialogProps) {
  const [selectedOption, setSelectedOption] = useState<'camera' | 'gallery' | null>(null);

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
              <div className="relative rounded-3xl bg-white/95 backdrop-blur-xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
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
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
