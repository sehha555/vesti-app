import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, CreditCard, Plus, MoreVertical, Trash2, Star } from 'lucide-react';
import { AddPaymentCardModal, PaymentCard } from './AddPaymentCardModal';
import { toast } from 'sonner';

interface PaymentMethodsPageProps {
  onBack: () => void;
  savedCards: PaymentCard[];
  onCardsUpdate: (cards: PaymentCard[]) => void;
}

export function PaymentMethodsPage({ onBack, savedCards, onCardsUpdate }: PaymentMethodsPageProps) {
  const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  // 新增卡片
  const handleAddCard = (newCard: PaymentCard) => {
    // 如果這是第一張卡片，自動設為預設
    if (savedCards.length === 0) {
      newCard.isDefault = true;
    }
    onCardsUpdate([...savedCards, newCard]);
  };

  // 設為預設卡片
  const handleSetDefault = (cardId: string) => {
    const updatedCards = savedCards.map((card) => ({
      ...card,
      isDefault: card.id === cardId,
    }));
    onCardsUpdate(updatedCards);
    setExpandedCardId(null);
    toast.success('已設為預設付款方式');
  };

  // 刪除卡片
  const handleDeleteCard = (cardId: string) => {
    const cardToDelete = savedCards.find((card) => card.id === cardId);
    if (!cardToDelete) return;

    if (cardToDelete.isDefault && savedCards.length > 1) {
      toast.error('無法刪除預設卡片，請先設定其他卡片為預設');
      setExpandedCardId(null);
      return;
    }

    const updatedCards = savedCards.filter((card) => card.id !== cardId);
    onCardsUpdate(updatedCards);
    setExpandedCardId(null);
    toast.success('信用卡已刪除');
  };

  // 取得卡片品牌顯示名稱
  const getCardBrandName = (brand: PaymentCard['brand']): string => {
    const brandNames = {
      visa: 'Visa',
      mastercard: 'Mastercard',
      jcb: 'JCB',
      amex: 'American Express',
      unknown: '信用卡',
    };
    return brandNames[brand];
  };

  // 渲染卡片品牌 Logo
  const renderCardBrandLogo = (brand: PaymentCard['brand']) => {
    switch (brand) {
      case 'visa':
        return (
          <div className="flex h-8 w-12 items-center justify-center rounded bg-blue-600 text-white" style={{ fontSize: '10px', fontWeight: 700 }}>
            VISA
          </div>
        );
      case 'mastercard':
        return (
          <div className="flex h-8 w-12 items-center justify-center">
            <div className="flex gap-0.5">
              <div className="h-6 w-6 rounded-full bg-red-500" />
              <div className="h-6 w-6 rounded-full bg-orange-400 -ml-3" />
            </div>
          </div>
        );
      case 'jcb':
        return (
          <div className="flex h-8 w-12 items-center justify-center rounded bg-blue-700 text-white" style={{ fontSize: '9px', fontWeight: 700 }}>
            JCB
          </div>
        );
      case 'amex':
        return (
          <div className="flex h-8 w-12 items-center justify-center rounded bg-blue-500 text-white" style={{ fontSize: '8px', fontWeight: 700 }}>
            AMEX
          </div>
        );
      default:
        return <CreditCard className="h-6 w-6 text-[var(--vesti-primary)]" strokeWidth={2} />;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--vesti-background)] pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[var(--vesti-gray-mid)]/20 bg-white/95 px-5 py-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--vesti-dark)] transition-colors hover:bg-[var(--vesti-gray-light)]"
          >
            <ChevronLeft className="h-6 w-6" strokeWidth={2} />
          </button>
          <h1 className="text-[var(--vesti-primary)]">支付方式</h1>
        </div>
      </header>

      {/* 內容 */}
      <div className="px-5 py-6">
        {/* 新增卡片按鈕 */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsAddCardModalOpen(true)}
          className="mb-6 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--vesti-primary)]/40 bg-[var(--vesti-primary)]/5 py-4 text-[var(--vesti-primary)] transition-all hover:border-[var(--vesti-primary)]/60 hover:bg-[var(--vesti-primary)]/10"
        >
          <Plus className="h-5 w-5" strokeWidth={2.5} />
          <span style={{ fontWeight: 600 }}>新增信用卡</span>
        </motion.button>

        {/* 卡片列表 */}
        {savedCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--vesti-gray-light)]">
              <CreditCard className="h-10 w-10 text-[var(--vesti-gray-mid)]" strokeWidth={1.5} />
            </div>
            <h3 className="mb-2 text-[var(--vesti-dark)]">尚未新增付款方式</h3>
            <p className="mb-6 text-[var(--vesti-gray-mid)]" style={{ fontSize: 'var(--text-body)' }}>
              新增信用卡以快速完成結帳
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsAddCardModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-[var(--vesti-primary)] px-6 py-3 text-white shadow-lg hover:bg-[var(--vesti-primary)]/90 transition-all"
              style={{ fontWeight: 500 }}
            >
              <Plus className="h-5 w-5" strokeWidth={2.5} />
              新增付款方式
            </motion.button>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {savedCards.map((card, index) => (
                <motion.div
                  key={card.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className="overflow-hidden rounded-2xl border-2 border-[var(--vesti-gray-mid)]/30 bg-white shadow-sm"
                >
                  <div className="p-4">
                    <div className="flex items-center gap-4">
                      {/* 卡片品牌 Logo */}
                      <div className="flex-shrink-0">{renderCardBrandLogo(card.brand)}</div>

                      {/* 卡片資訊 */}
                      <div className="flex-1 min-w-0">
                        <div className="mb-1 flex items-center gap-2">
                          <h4 className="text-[var(--vesti-dark)]" style={{ fontWeight: 600 }}>
                            {getCardBrandName(card.brand)}
                          </h4>
                          {card.isDefault && (
                            <div className="flex items-center gap-1 rounded-full bg-[var(--vesti-primary)]/10 px-2 py-0.5">
                              <Star className="h-3 w-3 text-[var(--vesti-primary)]" fill="currentColor" strokeWidth={2} />
                              <span className="text-[var(--vesti-primary)]" style={{ fontSize: '11px', fontWeight: 600 }}>
                                預設
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="text-[var(--vesti-gray-mid)]" style={{ fontSize: 'var(--text-label)' }}>
                          •••• •••• •••• {card.lastFourDigits}
                        </p>
                        <p className="text-[var(--vesti-gray-mid)]" style={{ fontSize: 'var(--text-label)' }}>
                          到期日：{card.expiryMonth}/{card.expiryYear}
                        </p>
                      </div>

                      {/* 操作按鈕 */}
                      <div className="relative flex-shrink-0">
                        <button
                          onClick={() => setExpandedCardId(expandedCardId === card.id ? null : card.id)}
                          className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--vesti-gray-mid)] transition-colors hover:bg-[var(--vesti-gray-light)]"
                        >
                          <MoreVertical className="h-5 w-5" strokeWidth={2} />
                        </button>

                        {/* 下拉選單 */}
                        <AnimatePresence>
                          {expandedCardId === card.id && (
                            <>
                              {/* 背景遮罩 */}
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setExpandedCardId(null)}
                                className="fixed inset-0 z-10"
                              />

                              {/* 選單內容 */}
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                transition={{ duration: 0.15 }}
                                className="absolute right-0 top-12 z-20 w-48 overflow-hidden rounded-xl border-2 border-[var(--vesti-gray-mid)]/30 bg-white shadow-lg"
                              >
                                {!card.isDefault && (
                                  <button
                                    onClick={() => handleSetDefault(card.id)}
                                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-[var(--vesti-dark)] transition-colors hover:bg-[var(--vesti-gray-light)]"
                                    style={{ fontSize: 'var(--text-body)' }}
                                  >
                                    <Star className="h-4 w-4 text-[var(--vesti-primary)]" strokeWidth={2} />
                                    <span>設為預設</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteCard(card.id)}
                                  className="flex w-full items-center gap-3 border-t border-[var(--vesti-gray-mid)]/20 px-4 py-3 text-left text-red-500 transition-colors hover:bg-red-50"
                                  style={{ fontSize: 'var(--text-body)' }}
                                >
                                  <Trash2 className="h-4 w-4" strokeWidth={2} />
                                  <span>刪除卡片</span>
                                </button>
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* 提示說明 */}
        {savedCards.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 rounded-xl border-2 border-[var(--vesti-secondary)]/30 bg-white p-4"
          >
            <h4 className="mb-2 text-[var(--vesti-dark)]" style={{ fontWeight: 600 }}>
               安全提示
            </h4>
            <ul className="space-y-1 text-[var(--vesti-gray-mid)]" style={{ fontSize: 'var(--text-label)' }}>
              <li className="flex items-start gap-2">
                <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--vesti-secondary)]" />
                <span>您的卡片資訊已加密儲存</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--vesti-secondary)]" />
                <span>預設卡片將在結帳時優先使用</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--vesti-secondary)]" />
                <span>您可以隨時管理或刪除卡片</span>
              </li>
            </ul>
          </motion.div>
        )}
      </div>

      {/* 新增卡片 Modal */}
      <AddPaymentCardModal
        isOpen={isAddCardModalOpen}
        onClose={() => setIsAddCardModalOpen(false)}
        onAdd={handleAddCard}
      />
    </div>
  );
}