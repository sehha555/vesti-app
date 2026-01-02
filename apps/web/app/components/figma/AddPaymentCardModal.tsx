import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CreditCard, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export interface PaymentCard {
  id: string;
  cardNumber: string;
  lastFourDigits: string;
  cardholderName: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  brand: 'visa' | 'mastercard' | 'jcb' | 'amex' | 'unknown';
  isDefault: boolean;
}

interface AddPaymentCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (card: PaymentCard) => void;
}

// 根據卡號前綴識別卡片品牌
const detectCardBrand = (cardNumber: string): PaymentCard['brand'] => {
  const cleaned = cardNumber.replace(/\s/g, '');
  if (/^4/.test(cleaned)) return 'visa';
  if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) return 'mastercard';
  if (/^35/.test(cleaned)) return 'jcb';
  if (/^3[47]/.test(cleaned)) return 'amex';
  return 'unknown';
};

// 格式化卡號為 **** **** **** ****
const formatCardNumber = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  const chunks = cleaned.match(/.{1,4}/g) || [];
  return chunks.join(' ').substring(0, 19); // 最多 16 位數字 + 3 個空格
};

// 格式化到期日為 MM/YY
const formatExpiry = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length >= 2) {
    return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
  }
  return cleaned;
};

export function AddPaymentCardModal({ isOpen, onClose, onAdd }: AddPaymentCardModalProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [saveCard, setSaveCard] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const cardBrand = detectCardBrand(cardNumber);

  // 重置表單
  useEffect(() => {
    if (!isOpen) {
      setCardNumber('');
      setCardholderName('');
      setExpiry('');
      setCvv('');
      setSaveCard(true);
      setErrors({});
    }
  }, [isOpen]);

  // 驗證表單
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 卡號驗證
    const cleanedCardNumber = cardNumber.replace(/\s/g, '');
    if (!cleanedCardNumber) {
      newErrors.cardNumber = '請輸入卡號';
    } else if (cleanedCardNumber.length < 13 || cleanedCardNumber.length > 16) {
      newErrors.cardNumber = '卡號長度不正確';
    }

    // 持卡人姓名驗證
    if (!cardholderName.trim()) {
      newErrors.cardholderName = '請輸入持卡人姓名';
    }

    // 到期日驗證
    const [month, year] = expiry.split('/');
    if (!month || !year) {
      newErrors.expiry = '請輸入到期日';
    } else {
      const monthNum = parseInt(month, 10);
      if (monthNum < 1 || monthNum > 12) {
        newErrors.expiry = '月份必須在 01-12 之間';
      }
    }

    // CVV 驗證
    if (!cvv) {
      newErrors.cvv = '請輸入安全碼';
    } else if (cvv.length < 3 || cvv.length > 4) {
      newErrors.cvv = '安全碼格式不正確';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 處理新增卡片
  const handleAddCard = () => {
    if (!validateForm()) {
      toast.error('請檢查表單欄位');
      return;
    }

    const cleanedCardNumber = cardNumber.replace(/\s/g, '');
    const [month, year] = expiry.split('/');

    const newCard: PaymentCard = {
      id: `card-${Date.now()}`,
      cardNumber: cleanedCardNumber,
      lastFourDigits: cleanedCardNumber.slice(-4),
      cardholderName: cardholderName.trim(),
      expiryMonth: month,
      expiryYear: year,
      cvv,
      brand: cardBrand,
      isDefault: false,
    };

    onAdd(newCard);
    toast.success('信用卡已新增');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end justify-center">
        {/* 背景遮罩 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal 內容 */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="relative z-10 flex w-full max-w-lg flex-col rounded-t-3xl bg-white shadow-2xl max-h-[85vh]"
        >
          {/* Header - 固定在頂部 */}
          <div className="flex-shrink-0 flex items-center justify-between border-b border-[var(--vesti-gray-mid)]/20 px-6 py-4">
            <h2 className="text-[var(--vesti-dark)]">新增信用卡</h2>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--vesti-gray-mid)] transition-colors hover:bg-[var(--vesti-gray-light)]"
            >
              <X className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>

          {/* 可滾動內容區域 */}
          <div className="flex-1 overflow-y-auto">
            {/* 卡片預覽 */}
            <div className="px-6 pt-6">
              <motion.div
                layout
                className="relative h-48 overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--vesti-primary)] via-[var(--vesti-secondary)] to-[var(--vesti-accent)] p-6 shadow-[0_8px_24px_rgba(41,108,125,0.3)]"
              >
                {/* 卡片品牌 Logo */}
                <div className="mb-8 flex items-center justify-between">
                  <div className="flex h-10 w-14 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                    {cardBrand === 'visa' && (
                      <span className="text-white" style={{ fontWeight: 700, fontSize: '16px' }}>
                        VISA
                      </span>
                    )}
                    {cardBrand === 'mastercard' && (
                      <div className="flex gap-1">
                        <div className="h-5 w-5 rounded-full bg-red-500 opacity-80" />
                        <div className="h-5 w-5 rounded-full bg-orange-400 opacity-80 -ml-3" />
                      </div>
                    )}
                    {cardBrand === 'jcb' && (
                      <span className="text-white" style={{ fontWeight: 700, fontSize: '14px' }}>
                        JCB
                      </span>
                    )}
                    {cardBrand === 'amex' && (
                      <span className="text-white" style={{ fontWeight: 700, fontSize: '12px' }}>
                        AMEX
                      </span>
                    )}
                    {cardBrand === 'unknown' && (
                      <CreditCard className="h-5 w-5 text-white" strokeWidth={2} />
                    )}
                  </div>
                  <div className="text-white/70" style={{ fontSize: 'var(--text-label)' }}>
                    信用卡
                  </div>
                </div>

                {/* 卡號 */}
                <div className="mb-6">
                  <p
                    className="text-white tracking-wider"
                    style={{ fontWeight: 600, fontSize: '18px', letterSpacing: '0.1em' }}
                  >
                    {cardNumber || '•••• •••• •••• ••••'}
                  </p>
                </div>

                {/* 持卡人姓名和到期日 */}
                <div className="flex items-end justify-between">
                  <div>
                    <p className="mb-1 text-white/70" style={{ fontSize: '10px' }}>
                      持卡人
                    </p>
                    <p className="text-white" style={{ fontWeight: 600, fontSize: 'var(--text-label)' }}>
                      {cardholderName || 'YOUR NAME'}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-right text-white/70" style={{ fontSize: '10px' }}>
                      有效期限
                    </p>
                    <p className="text-white" style={{ fontWeight: 600, fontSize: 'var(--text-label)' }}>
                      {expiry || 'MM/YY'}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* 表單 */}
            <div className="space-y-4 px-6 py-6">
              {/* 卡號 */}
              <div>
                <label className="mb-2 block text-[var(--vesti-dark)]" style={{ fontSize: 'var(--text-label)', fontWeight: 600 }}>
                  卡號
                </label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  className={`w-full rounded-xl border-2 bg-white px-4 py-3 text-[var(--vesti-dark)] outline-none transition-colors ${
                    errors.cardNumber
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-[var(--vesti-gray-mid)]/30 focus:border-[var(--vesti-primary)]'
                  }`}
                />
                {errors.cardNumber && (
                  <div className="mt-2 flex items-center gap-1 text-red-500" style={{ fontSize: 'var(--text-label)' }}>
                    <AlertCircle className="h-4 w-4" strokeWidth={2} />
                    <span>{errors.cardNumber}</span>
                  </div>
                )}
              </div>

              {/* 持卡人姓名 */}
              <div>
                <label className="mb-2 block text-[var(--vesti-dark)]" style={{ fontSize: 'var(--text-label)', fontWeight: 600 }}>
                  持卡人姓名
                </label>
                <input
                  type="text"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
                  placeholder="WANG XIAO MING"
                  className={`w-full rounded-xl border-2 bg-white px-4 py-3 text-[var(--vesti-dark)] outline-none transition-colors ${
                    errors.cardholderName
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-[var(--vesti-gray-mid)]/30 focus:border-[var(--vesti-primary)]'
                  }`}
                />
                {errors.cardholderName && (
                  <div className="mt-2 flex items-center gap-1 text-red-500" style={{ fontSize: 'var(--text-label)' }}>
                    <AlertCircle className="h-4 w-4" strokeWidth={2} />
                    <span>{errors.cardholderName}</span>
                  </div>
                )}
              </div>

              {/* 到期日和 CVV */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-[var(--vesti-dark)]" style={{ fontSize: 'var(--text-label)', fontWeight: 600 }}>
                    到期日
                  </label>
                  <input
                    type="text"
                    value={expiry}
                    onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                    placeholder="MM/YY"
                    maxLength={5}
                    className={`w-full rounded-xl border-2 bg-white px-4 py-3 text-[var(--vesti-dark)] outline-none transition-colors ${
                      errors.expiry
                        ? 'border-red-400 focus:border-red-500'
                        : 'border-[var(--vesti-gray-mid)]/30 focus:border-[var(--vesti-primary)]'
                    }`}
                  />
                  {errors.expiry && (
                    <div className="mt-2 flex items-center gap-1 text-red-500" style={{ fontSize: 'var(--text-label)' }}>
                      <AlertCircle className="h-4 w-4" strokeWidth={2} />
                      <span>{errors.expiry}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-[var(--vesti-dark)]" style={{ fontSize: 'var(--text-label)', fontWeight: 600 }}>
                    安全碼 (CVV)
                  </label>
                  <input
                    type="text"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').substring(0, 4))}
                    placeholder="123"
                    maxLength={4}
                    className={`w-full rounded-xl border-2 bg-white px-4 py-3 text-[var(--vesti-dark)] outline-none transition-colors ${
                      errors.cvv
                        ? 'border-red-400 focus:border-red-500'
                        : 'border-[var(--vesti-gray-mid)]/30 focus:border-[var(--vesti-primary)]'
                    }`}
                  />
                  {errors.cvv && (
                    <div className="mt-2 flex items-center gap-1 text-red-500" style={{ fontSize: 'var(--text-label)' }}>
                      <AlertCircle className="h-4 w-4" strokeWidth={2} />
                      <span>{errors.cvv}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 儲存卡片選項 */}
              <div className="flex items-center gap-3 rounded-xl border-2 border-[var(--vesti-gray-mid)]/30 bg-[var(--vesti-gray-light)] px-4 py-3">
                <input
                  id="save-card"
                  type="checkbox"
                  checked={saveCard}
                  onChange={(e) => setSaveCard(e.target.checked)}
                  className="h-5 w-5 rounded border-2 border-[var(--vesti-gray-mid)] text-[var(--vesti-primary)] focus:ring-2 focus:ring-[var(--vesti-primary)]/20"
                />
                <label htmlFor="save-card" className="flex-1 cursor-pointer text-[var(--vesti-dark)]" style={{ fontSize: 'var(--text-body)' }}>
                  儲存此卡片供未來使用
                </label>
              </div>

              {/* 安全提示 */}
              <div className="rounded-xl border-2 border-[var(--vesti-primary)]/20 bg-[var(--vesti-primary)]/5 p-3">
                <p className="text-[var(--vesti-gray-mid)]" style={{ fontSize: 'var(--text-label)' }}>
                   您的卡片資訊將被安全加密儲存
                </p>
              </div>
            </div>
          </div>

          {/* 按鈕 */}
          <div className="flex gap-3 border-t border-[var(--vesti-gray-mid)]/20 px-6 py-4 pb-24">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="flex-1 rounded-xl border-2 border-[var(--vesti-gray-mid)]/30 bg-white py-3 text-[var(--vesti-dark)] transition-all hover:bg-[var(--vesti-gray-light)]"
              style={{ fontWeight: 600 }}
            >
              取消
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAddCard}
              className="flex-1 rounded-xl bg-[var(--vesti-primary)] py-3 text-white shadow-lg transition-all hover:shadow-xl"
              style={{ fontWeight: 600 }}
            >
              新增卡片
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}