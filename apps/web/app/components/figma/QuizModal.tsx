import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

interface QuizOption {
  id: string;
  label: string;
  icon?: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
  multiSelect?: boolean;
}

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (answers: Record<string, string[]>) => void;
}

const quizQuestions: QuizQuestion[] = [
  {
    id: 'occasion',
    question: '您想要什麼場合的穿搭？',
    options: [
      { id: 'casual', label: '休閒日常' },
      { id: 'work', label: '上班通勤' },
      { id: 'formal', label: '正式場合' },
      { id: 'sport', label: '運動健身' },
      { id: 'party', label: '聚會派對' },
    ],
  },
  {
    id: 'style',
    question: '您偏好的風格是？',
    options: [
      { id: 'minimal', label: '簡約時尚' },
      { id: 'street', label: '街頭潮流' },
      { id: 'elegant', label: '優雅知性' },
      { id: 'sporty', label: '運動休閒' },
      { id: 'vintage', label: '復古經典' },
    ],
    multiSelect: true,
  },
  {
    id: 'color',
    question: '您喜歡的顏色系列？',
    options: [
      { id: 'neutral', label: '中性色系' },
      { id: 'warm', label: '溫暖色系' },
      { id: 'cool', label: '冷色系' },
      { id: 'pastel', label: '柔和色系' },
      { id: 'bold', label: '鮮豔色系' },
    ],
    multiSelect: true,
  },
  {
    id: 'budget',
    question: '您的預算範圍？',
    options: [
      { id: 'low', label: 'NT$ 1,000 以下' },
      { id: 'medium', label: 'NT$ 1,000 - 3,000' },
      { id: 'high', label: 'NT$ 3,000 - 5,000' },
      { id: 'luxury', label: 'NT$ 5,000 以上' },
    ],
  },
];

export function QuizModal({ isOpen, onClose, onComplete }: QuizModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});

  const currentQuestion = quizQuestions[currentStep];
  const isLastStep = currentStep === quizQuestions.length - 1;
  const canProceed = answers[currentQuestion?.id]?.length > 0;

  const handleOptionSelect = (optionId: string) => {
    const questionId = currentQuestion.id;
    const currentAnswers = answers[questionId] || [];

    if (currentQuestion.multiSelect) {
      // 多選模式
      if (currentAnswers.includes(optionId)) {
        setAnswers({
          ...answers,
          [questionId]: currentAnswers.filter(id => id !== optionId),
        });
      } else {
        setAnswers({
          ...answers,
          [questionId]: [...currentAnswers, optionId],
        });
      }
    } else {
      // 單選模式
      setAnswers({
        ...answers,
        [questionId]: [optionId],
      });
    }
  };

  const handleNext = () => {
    if (isLastStep) {
      onComplete(answers);
      handleClose();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    setAnswers({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative mx-4 w-full max-w-md rounded-[24px] bg-card shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 關閉按鈕 */}
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md transition-all hover:bg-[var(--vesti-gray-light)]"
          >
            <X className="h-5 w-5 text-[var(--vesti-gray-mid)]" strokeWidth={2} />
          </button>

          {/* 進度條 */}
          <div className="px-6 pt-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[var(--vesti-gray-mid)]" style={{ fontSize: 'var(--text-label)' }}>
                步驟 {currentStep + 1} / {quizQuestions.length}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--vesti-gray-light)]">
              <motion.div
                className="h-full bg-[var(--vesti-primary)]"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / quizQuestions.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* 問題內容 */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="mb-6 text-[var(--vesti-dark)]">
                  {currentQuestion.question}
                </h3>

                {currentQuestion.multiSelect && (
                  <p className="mb-4 text-[var(--vesti-gray-mid)]" style={{ fontSize: 'var(--text-label)' }}>
                    可選擇多項
                  </p>
                )}

                <div className="space-y-3">
                  {currentQuestion.options.map((option) => {
                    const isSelected = answers[currentQuestion.id]?.includes(option.id);
                    return (
                      <motion.button
                        key={option.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleOptionSelect(option.id)}
                        className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
                          isSelected
                            ? 'border-[var(--vesti-primary)] bg-[var(--vesti-primary)]/5'
                            : 'border-border bg-white hover:border-[var(--vesti-secondary)]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            style={{
                              fontSize: 'var(--text-base)',
                              fontWeight: isSelected ? 600 : 400,
                              color: isSelected ? 'var(--vesti-primary)' : 'var(--vesti-dark)',
                            }}
                          >
                            {option.label}
                          </span>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--vesti-primary)]"
                            >
                              <div className="h-2 w-2 rounded-full bg-white" />
                            </motion.div>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* 底部按鈕 */}
          <div className="flex gap-3 border-t border-border p-6">
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                className="flex items-center justify-center gap-2 rounded-xl border-2 border-border bg-white px-6 py-3 transition-all hover:bg-[var(--vesti-gray-light)]"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={2} />
                上一步
              </button>
            )}

            <button
              onClick={handleNext}
              disabled={!canProceed}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 transition-all ${
                canProceed
                  ? 'bg-[var(--vesti-primary)] text-white hover:opacity-90'
                  : 'bg-[var(--vesti-gray-light)] text-[var(--vesti-gray-mid)] cursor-not-allowed'
              }`}
            >
              {isLastStep ? '完成' : '下一步'}
              {!isLastStep && <ChevronRight className="h-4 w-4" strokeWidth={2} />}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
