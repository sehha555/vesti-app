import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin } from 'lucide-react';
import { toast } from 'sonner';

export interface Address {
  id: number;
  name: string;
  phone: string;
  address: string;
  isDefault: boolean;
}

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (address: Address) => void;
  editingAddress: Address | null;
}

export function AddressModal({ isOpen, onClose, onSave, editingAddress }: AddressModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    if (editingAddress) {
      setName(editingAddress.name);
      setPhone(editingAddress.phone);
      setAddress(editingAddress.address);
      setIsDefault(editingAddress.isDefault);
    } else {
      setName('');
      setPhone('');
      setAddress('');
      setIsDefault(false);
    }
  }, [editingAddress, isOpen]);

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error('請輸入收件人姓名');
      return;
    }
    if (!phone.trim()) {
      toast.error('請輸入聯絡電話');
      return;
    }
    if (!address.trim()) {
      toast.error('請輸入配送地址');
      return;
    }

    const newAddress: Address = {
      id: editingAddress?.id || Date.now(),
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      isDefault,
    };

    onSave(newAddress);
    toast.success(editingAddress ? '地址已更新' : '地址已新增');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
        {/* 背景遮罩 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50"
        />

        {/* Modal 內容 */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-10 w-full max-w-lg rounded-t-3xl bg-white sm:rounded-3xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--vesti-primary)]/10">
                <MapPin className="h-5 w-5 text-[var(--vesti-primary)]" strokeWidth={2} />
              </div>
              <h2 className="text-[var(--vesti-dark)]">
                {editingAddress ? '編輯地址' : '新增地址'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[var(--vesti-gray-light)] transition-colors"
            >
              <X className="h-6 w-6 text-[var(--vesti-gray-mid)]" strokeWidth={2} />
            </button>
          </div>

          {/* 表單內容 */}
          <div className="max-h-[70vh] overflow-y-auto p-5">
            <div className="space-y-4">
              {/* 收件人姓名 */}
              <div>
                <label
                  className="mb-2 block text-[var(--vesti-dark)]"
                  style={{ fontSize: 'var(--text-label)', fontWeight: 600 }}
                >
                  收件人姓名
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="請輸入收件人姓名"
                  className="h-12 w-full rounded-xl border-2 border-[var(--vesti-gray-light)] bg-white px-4 text-[var(--vesti-dark)] outline-none transition-colors focus:border-[var(--vesti-primary)]"
                  style={{ fontSize: 'var(--text-base)' }}
                />
              </div>

              {/* 聯絡電話 */}
              <div>
                <label
                  className="mb-2 block text-[var(--vesti-dark)]"
                  style={{ fontSize: 'var(--text-label)', fontWeight: 600 }}
                >
                  聯絡電話
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="例如：0912-345-678"
                  className="h-12 w-full rounded-xl border-2 border-[var(--vesti-gray-light)] bg-white px-4 text-[var(--vesti-dark)] outline-none transition-colors focus:border-[var(--vesti-primary)]"
                  style={{ fontSize: 'var(--text-base)' }}
                />
              </div>

              {/* 配送地址 */}
              <div>
                <label
                  className="mb-2 block text-[var(--vesti-dark)]"
                  style={{ fontSize: 'var(--text-label)', fontWeight: 600 }}
                >
                  配送地址
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="請輸入完整地址，包含縣市、區域、街道和門牌號碼"
                  rows={3}
                  className="w-full resize-none rounded-xl border-2 border-[var(--vesti-gray-light)] bg-white p-4 text-[var(--vesti-dark)] outline-none transition-colors focus:border-[var(--vesti-primary)]"
                  style={{ fontSize: 'var(--text-base)' }}
                />
              </div>

              {/* 設為預設 */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsDefault(!isDefault)}
                  className={`flex h-6 w-6 items-center justify-center rounded-md border-2 transition-colors ${
                    isDefault
                      ? 'border-[var(--vesti-primary)] bg-[var(--vesti-primary)]'
                      : 'border-[var(--vesti-gray-mid)]'
                  }`}
                >
                  {isDefault && (
                    <svg
                      className="h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <label
                  onClick={() => setIsDefault(!isDefault)}
                  className="cursor-pointer text-[var(--vesti-dark)]"
                  style={{ fontSize: 'var(--text-base)' }}
                >
                  設為預設地址
                </label>
              </div>
            </div>
          </div>

          {/* 按鈕區域 */}
          <div className="border-t border-border p-5">
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="flex-1 rounded-xl border-2 border-[var(--vesti-gray-light)] bg-white py-3 text-[var(--vesti-dark)] transition-all hover:bg-[var(--vesti-gray-light)]"
                style={{ fontWeight: 600 }}
              >
                取消
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                className="flex-1 rounded-xl bg-[var(--vesti-primary)] py-3 text-white shadow-lg transition-all hover:shadow-xl"
                style={{ fontWeight: 600 }}
              >
                {editingAddress ? '儲存' : '新增'}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
