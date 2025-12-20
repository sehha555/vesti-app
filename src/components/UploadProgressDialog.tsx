import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Check } from 'lucide-react';
import { Progress } from './ui/progress';

interface UploadProgressDialogProps {
  isOpen: boolean;
  progress: number;
  isComplete: boolean;
  fileName?: string;
}

export function UploadProgressDialog({
  isOpen,
  progress,
  isComplete,
  fileName = '照片.jpg'
}: UploadProgressDialogProps) {
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
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Dialog */}
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ 
                type: 'spring',
                stiffness: 300,
                damping: 25
              }}
              className="w-full max-w-sm pointer-events-auto mx-4"
            >
              <div className="relative rounded-3xl bg-white/95 backdrop-blur-xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                  <motion.div
                    animate={isComplete ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.4 }}
                    className={`flex h-20 w-20 items-center justify-center rounded-full ${
                      isComplete 
                        ? 'bg-gradient-to-br from-green-400 to-green-600' 
                        : 'bg-gradient-to-br from-[var(--vesti-primary)] to-[var(--vesti-primary-dark)]'
                    } shadow-lg`}
                  >
                    <AnimatePresence mode="wait">
                      {isComplete ? (
                        <motion.div
                          key="check"
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ 
                            type: 'spring',
                            stiffness: 200,
                            damping: 15
                          }}
                        >
                          <Check className="h-10 w-10 text-white" strokeWidth={3} />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="upload"
                          animate={{ y: [0, -4, 0] }}
                          transition={{ 
                            duration: 1.5,
                            repeat: Infinity,
                            ease: 'easeInOut'
                          }}
                        >
                          <Upload className="h-10 w-10 text-white" strokeWidth={2.5} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>

                {/* Title & Status */}
                <div className="text-center mb-6">
                  <h3 className="text-[var(--vesti-dark)] mb-2" style={{ fontWeight: 600 }}>
                    {isComplete ? '上傳完成！' : '正在上傳...'}
                  </h3>
                  <p className="text-[var(--vesti-text-secondary)]" style={{ fontSize: '14px' }}>
                    {fileName}
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <Progress 
                    value={progress} 
                    className="h-2"
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--vesti-text-secondary)]" style={{ fontSize: '13px' }}>
                      {isComplete ? '已完成' : '上傳中'}
                    </span>
                    <span className="text-[var(--vesti-primary)]" style={{ fontSize: '13px', fontWeight: 600 }}>
                      {Math.round(progress)}%
                    </span>
                  </div>
                </div>

                {/* Success Message */}
                {isComplete && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-6 text-center"
                  >
                    <p className="text-[var(--vesti-text-secondary)]" style={{ fontSize: '13px' }}>
                      即將開始 AI 分析...
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
