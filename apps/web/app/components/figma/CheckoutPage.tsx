import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  Trash2,
  Plus,
  Minus,
  MapPin,
  CreditCard,
  Tag,
  ChevronRight,
  Truck,
  ShieldCheck,
  Star,
  Store,
  Package,
  Home,
  Edit3,
  X,
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner';
import { AddPaymentCardModal, PaymentCard } from './AddPaymentCardModal';
import { AddressModal, Address as AddressType } from './AddressModal';

interface CartItem {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  brand: string;
  quantity: number;
  size?: string;
  color?: string;
}

interface Address {
  id: number;
  name: string;
  phone: string;
  address: string;
  isDefault: boolean;
}

interface CheckoutPageProps {
  onBack: () => void;
}

// 模擬購物車商品
const mockCartItems: CartItem[] = [
  {
    id: 1,
    name: '經典白T恤',
    price: 890,
    imageUrl:
      'https://images.unsplash.com/photo-1643881080033-e67069c5e4df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aGl0ZSUyMHRzaGlydCUyMGNsb3RoaW5nfGVufDF8fHx8MTc2MjU1NDc2Mnww&ixlib=rb-4.1.0&q=80&w=1080',
    brand: 'BasicWear',
    quantity: 1,
    size: 'M',
    color: '白色',
  },
  {
    id: 2,
    name: '直筒牛仔褲',
    price: 1590,
    imageUrl:
      'https://images.unsplash.com/photo-1602585198422-d795fa9bfd6f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZW5pbSUyMGplYW5zJTIwZmFzaGlvbnxlbnwxfHx8fDE3NjI1NzE5ODN8MA&ixlib=rb-4.1.0&q=80&w=1080',
    brand: 'Denim Co.',
    quantity: 1,
    size: 'L',
    color: '深藍',
  },
  {
    id: 3,
    name: '輕量風衣外套',
    price: 2890,
    imageUrl:
      'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxqYWNrZXQlMjBmYXNoaW9ufGVufDF8fHx8MTc2MjU1NDc2M3ww&ixlib=rb-4.1.0&q=80&w=1080',
    brand: 'UrbanStyle',
    quantity: 1,
    size: 'M',
    color: '卡其',
  },
];

// 模擬地址
const mockAddresses: Address[] = [
  {
    id: 1,
    name: '王小明',
    phone: '0912-345-678',
    address: '台北市大安區忠孝東路四段 100 號 5F',
    isDefault: true,
  },
  {
    id: 2,
    name: '王小明',
    phone: '0912-345-678',
    address: '台北市信義區信義路五段 7 號',
    isDefault: false,
  },
];

// 模擬付款方式
const paymentMethods = [
  { id: 'credit', name: '信用卡', icon: CreditCard },
  { id: 'atm', name: 'ATM 轉帳', icon: CreditCard },
  { id: 'cod', name: '貨到付款', icon: Truck },
];

// 物流方式
const shippingMethods = [
  { id: '7-11', name: '7-ELEVEN 取貨', icon: Store },
  { id: 'family', name: '全家便利商店', icon: Store },
  { id: 'home', name: '宅配到府', icon: Home },
];

export function CheckoutPage({ onBack }: CheckoutPageProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>(mockCartItems);
  const [addresses, setAddresses] = useState<Address[]>(mockAddresses);
  const [selectedAddress, setSelectedAddress] = useState(mockAddresses[0]);
  const [selectedPayment, setSelectedPayment] = useState('credit');
  const [selectedShipping, setSelectedShipping] = useState('home');
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [savedCards, setSavedCards] = useState<PaymentCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<PaymentCard | null>(null);
  const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressType | null>(null);
  
  // ATM 轉帳資訊
  const [atmBankCode, setAtmBankCode] = useState('');
  const [atmAccountNumber, setAtmAccountNumber] = useState('');
  const [atmAccountName, setAtmAccountName] = useState('');
  
  // 便利商店門市資訊
  const [selectedStore, setSelectedStore] = useState('');
  
  // 宅配資訊
  const [homeDeliveryName, setHomeDeliveryName] = useState('');
  const [homeDeliveryPhone, setHomeDeliveryPhone] = useState('');
  const [homeDeliveryAddress, setHomeDeliveryAddress] = useState('');

  // 計算總價
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = subtotal >= 1000 ? 0 : 80;
  const total = subtotal + shippingFee - appliedDiscount;

  // 確認結帳
  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast.error('購物車是空的');
      return;
    }
    toast.success('訂單已送出！感謝您的購買 ✨');
    // 這裡可以導航到訂單確認頁面或清空購物車
  };

  // 按店家分組商品
  const groupItemsByBrand = (items: CartItem[]) => {
    const grouped = items.reduce((acc, item) => {
      if (!acc[item.brand]) {
        acc[item.brand] = [];
      }
      acc[item.brand].push(item);
      return acc;
    }, {} as Record<string, CartItem[]>);
    return Object.entries(grouped);
  };

  const groupedCartItems = groupItemsByBrand(cartItems);

  // 計算每個店家的小計
  const getBrandSubtotal = (items: CartItem[]) => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  // 增加數量
  const handleIncreaseQuantity = (itemId: number) => {
    setCartItems((items) =>
      items.map((item) => (item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item))
    );
  };

  // 減少數量
  const handleDecreaseQuantity = (itemId: number) => {
    setCartItems((items) =>
      items.map((item) =>
        item.id === itemId && item.quantity > 1 ? { ...item, quantity: item.quantity - 1 } : item
      )
    );
  };

  // 刪除商品
  const handleRemoveItem = (itemId: number) => {
    setCartItems((items) => items.filter((item) => item.id !== itemId));
    toast.success('已從購物車移除');
  };

  // 套用優惠券
  const handleApplyCoupon = () => {
    if (couponCode.toUpperCase() === 'VESTI100') {
      setAppliedDiscount(100);
      toast.success('優惠券套用成功！折扣 NT$ 100');
    } else if (couponCode) {
      toast.error('無效的優惠券代碼');
    }
  };

  // 新增卡片
  const handleAddCard = (newCard: PaymentCard) => {
    // 如果是第一張卡片，設為預設並自動選中
    if (savedCards.length === 0) {
      newCard.isDefault = true;
      setSelectedCard(newCard);
    }
    setSavedCards([...savedCards, newCard]);
  };

  // 新增或編輯地址
  const handleSaveAddress = (newAddress: AddressType) => {
    if (editingAddress) {
      // 編輯現有地址
      setAddresses((prevAddresses) =>
        prevAddresses.map((addr) => (addr.id === editingAddress.id ? newAddress : addr))
      );
      if (selectedAddress.id === editingAddress.id) {
        setSelectedAddress(newAddress);
      }
    } else {
      // 新增地址
      setAddresses((prevAddresses) => [...prevAddresses, newAddress]);
    }
    setEditingAddress(null);
    setIsAddressModalOpen(false);
  };

  // 開啟新增地址 Modal
  const handleAddAddress = () => {
    setEditingAddress(null);
    setIsAddressModalOpen(true);
  };

  // 開啟編輯地址 Modal
  const handleEditAddress = (address: Address, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAddress(address);
    setIsAddressModalOpen(true);
  };

  // 渲染卡片品牌 Logo (簡化版)
  const renderCardBrandIcon = (brand: PaymentCard['brand']) => {
    switch (brand) {
      case 'visa':
        return <div className="text-blue-600" style={{ fontSize: '10px', fontWeight: 700 }}>VISA</div>;
      case 'mastercard':
        return (
          <div className="flex gap-0.5">
            <div className="h-4 w-4 rounded-full bg-red-500" />
            <div className="h-4 w-4 rounded-full bg-orange-400 -ml-2" />
          </div>
        );
      case 'jcb':
        return <div className="text-blue-700" style={{ fontSize: '9px', fontWeight: 700 }}>JCB</div>;
      case 'amex':
        return <div className="text-blue-500" style={{ fontSize: '8px', fontWeight: 700 }}>AMEX</div>;
      default:
        return <CreditCard className="h-5 w-5 text-[var(--vesti-primary)]" strokeWidth={2} />;
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--vesti-gray-light)]">
        {/* Header */}
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-white/90 px-5 py-4 backdrop-blur-md">
          <button
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[var(--vesti-gray-light)] transition-colors"
          >
            <ChevronLeft className="h-6 w-6 text-[var(--vesti-dark)]" strokeWidth={2} />
          </button>
          <h1 className="text-[var(--vesti-dark)]">購物車</h1>
          <div className="w-10" />
        </header>

        {/* 空購物車 */}
        <div className="flex flex-1 flex-col items-center justify-center px-5 text-center">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[var(--vesti-gray-light)]">
            <Tag className="h-12 w-12 text-[var(--vesti-gray-mid)]" strokeWidth={1.5} />
          </div>
          <h2 className="mb-2 text-[var(--vesti-dark)]">購物車是空的</h2>
          <p className="mb-6 text-[var(--vesti-gray-mid)]" style={{ fontSize: 'var(--text-body)' }}>
            快去商店逛逛，找到喜歡的商品吧！
          </p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onBack}
            className="rounded-xl bg-[var(--vesti-primary)] px-8 py-3 text-white shadow-lg hover:shadow-xl transition-shadow"
          >
            前往購物
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--vesti-gray-light)]">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-white/90 px-5 py-4 backdrop-blur-md">
        <button
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[var(--vesti-gray-light)] transition-colors"
        >
          <ChevronLeft className="h-6 w-6 text-[var(--vesti-dark)]" strokeWidth={2} />
        </button>
        <h1 className="text-[var(--vesti-dark)]">結帳</h1>
        <div className="w-10" />
      </header>

      {/* 內容區 */}
      <div className="flex-1 overflow-y-auto pb-[300px]">
        {/* 商品列表 */}
        <section className="px-5 py-6">
          <h2 className="mb-4 text-[var(--vesti-dark)]">購物清單</h2>
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {groupedCartItems.map(([brand, items], groupIndex) => (
                <motion.div
                  key={brand}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: groupIndex * 0.05 }}
                  className="overflow-hidden rounded-2xl border-2 border-[var(--vesti-gray-mid)]/30 bg-white shadow-sm"
                >
                  {/* 店家標頭 */}
                  <div className="flex items-center justify-between border-b border-[var(--vesti-gray-mid)]/20 bg-[var(--vesti-gray-light)] px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--vesti-primary)]/10">
                        <Store className="h-4 w-4 text-[var(--vesti-primary)]" strokeWidth={2} />
                      </div>
                      <span
                        className="text-[var(--vesti-dark)]"
                        style={{ fontWeight: 600, fontSize: 'var(--text-h4)' }}
                      >
                        {brand}
                      </span>
                    </div>
                    <span
                      className="text-[var(--vesti-primary)]"
                      style={{ fontWeight: 700, fontSize: 'var(--text-label)' }}
                    >
                      NT$ {getBrandSubtotal(items).toLocaleString()}
                    </span>
                  </div>

                  {/* 店家商品列表 */}
                  <div className="divide-y divide-[var(--vesti-gray-mid)]/10">
                    {items.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        className="flex gap-4 p-4"
                      >
                        {/* 商品圖片 */}
                        <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl">
                          <ImageWithFallback
                            src={item.imageUrl}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        {/* 商品資訊 */}
                        <div className="flex flex-1 flex-col">
                          <div className="mb-2 flex items-start justify-between">
                            <div className="flex-1">
                              <h4
                                className="mb-1 text-[var(--vesti-dark)] line-clamp-2"
                                style={{ fontSize: 'var(--text-h4)', fontWeight: 600 }}
                              >
                                {item.name}
                              </h4>
                              {(item.size || item.color) && (
                                <p
                                  className="text-[var(--vesti-gray-mid)]"
                                  style={{ fontSize: 'var(--text-label)' }}
                                >
                                  {item.size && `尺寸: ${item.size}`}
                                  {item.size && item.color && ' / '}
                                  {item.color && `顏色: ${item.color}`}
                                </p>
                              )}
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleRemoveItem(item.id)}
                              className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--vesti-gray-mid)] hover:bg-[var(--vesti-gray-light)] transition-colors"
                            >
                              <Trash2 className="h-4 w-4" strokeWidth={2} />
                            </motion.button>
                          </div>

                          {/* 價格和數量 */}
                          <div className="mt-auto flex items-center justify-between">
                            <p
                              className="text-[var(--vesti-primary)]"
                              style={{ fontWeight: 700, fontSize: 'var(--text-h4)' }}
                            >
                              NT$ {(item.price * item.quantity).toLocaleString()}
                            </p>

                            {/* 數量控制 */}
                            <div className="flex items-center gap-3 rounded-full border-2 border-[var(--vesti-gray-light)] bg-white px-2 py-1">
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleDecreaseQuantity(item.id)}
                                disabled={item.quantity <= 1}
                                className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-[var(--vesti-gray-light)] transition-colors disabled:opacity-30"
                              >
                                <Minus className="h-3 w-3 text-[var(--vesti-dark)]" strokeWidth={2.5} />
                              </motion.button>
                              <span
                                className="min-w-[20px] text-center text-[var(--vesti-dark)]"
                                style={{ fontWeight: 600 }}
                              >
                                {item.quantity}
                              </span>
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleIncreaseQuantity(item.id)}
                                className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-[var(--vesti-gray-light)] transition-colors"
                              >
                                <Plus className="h-3 w-3 text-[var(--vesti-dark)]" strokeWidth={2.5} />
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>

        {/* 配送地址 */}
        <section className="px-5 pb-6">
          <h2 className="mb-4 text-[var(--vesti-dark)]">配送地址</h2>
          <div className="space-y-3">
            {addresses.map((address) => (
              <motion.div
                key={address.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedAddress(address)}
                className={`cursor-pointer overflow-hidden rounded-2xl border-2 bg-white p-4 transition-all ${
                  selectedAddress.id === address.id
                    ? 'border-[var(--vesti-primary)] shadow-[0_4px_16px_rgba(41,108,125,0.12)]'
                    : 'border-transparent shadow-sm hover:border-[var(--vesti-secondary)]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <MapPin
                    className={`mt-0.5 h-5 w-5 flex-shrink-0 ${
                      selectedAddress.id === address.id
                        ? 'text-[var(--vesti-primary)]'
                        : 'text-[var(--vesti-gray-mid)]'
                    }`}
                    strokeWidth={2}
                  />
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className="text-[var(--vesti-dark)]"
                        style={{ fontWeight: 600, fontSize: 'var(--text-h4)' }}
                      >
                        {address.name}
                      </span>
                      <span
                        className="text-[var(--vesti-gray-mid)]"
                        style={{ fontSize: 'var(--text-label)' }}
                      >
                        {address.phone}
                      </span>
                      {address.isDefault && (
                        <span
                          className="rounded-full bg-[var(--vesti-primary)]/10 px-2 py-0.5 text-[var(--vesti-primary)]"
                          style={{ fontSize: '11px' }}
                        >
                          預設
                        </span>
                      )}
                    </div>
                    <p
                      className="text-[var(--vesti-gray-mid)]"
                      style={{ fontSize: 'var(--text-body)' }}
                    >
                      {address.address}
                    </p>
                  </div>
                  {selectedAddress.id === address.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--vesti-primary)]"
                    >
                      <div className="h-2 w-2 rounded-full bg-white" />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAddAddress}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--vesti-primary)]/40 bg-[var(--vesti-primary)]/5 py-4 text-[var(--vesti-primary)] transition-all hover:border-[var(--vesti-primary)]/60 hover:bg-[var(--vesti-primary)]/10"
            >
              <Plus className="h-5 w-5" strokeWidth={2.5} />
              <span style={{ fontWeight: 600 }}>新增地址</span>
            </motion.button>
          </div>
        </section>

        {/* 付款方式 */}
        <section className="px-5 pb-6">
          <h2 className="mb-4 text-[var(--vesti-dark)]">付款方式</h2>
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <motion.div
                key={method.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedPayment(method.id)}
                className={`cursor-pointer overflow-hidden rounded-2xl border-2 bg-white p-4 transition-all ${
                  selectedPayment === method.id
                    ? 'border-[var(--vesti-primary)] shadow-[0_4px_16px_rgba(41,108,125,0.12)]'
                    : 'border-transparent shadow-sm hover:border-[var(--vesti-secondary)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <method.icon
                      className={`h-5 w-5 ${
                        selectedPayment === method.id
                          ? 'text-[var(--vesti-primary)]'
                          : 'text-[var(--vesti-gray-mid)]'
                      }`}
                      strokeWidth={2}
                    />
                    <span
                      className="text-[var(--vesti-dark)]"
                      style={{ fontWeight: 600, fontSize: 'var(--text-h4)' }}
                    >
                      {method.name}
                    </span>
                  </div>
                  {selectedPayment === method.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--vesti-primary)]"
                    >
                      <div className="h-2 w-2 rounded-full bg-white" />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 信用卡選擇 (當選擇信用卡支付時顯示) */}
        {selectedPayment === 'credit' && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-5 pb-6"
          >
            <h2 className="mb-4 text-[var(--vesti-dark)]">選擇信用卡</h2>
            <div className="space-y-3">
              {/* 已儲存的卡片列表 */}
              {savedCards.map((card) => (
                <motion.div
                  key={card.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedCard(card)}
                  className={`cursor-pointer overflow-hidden rounded-2xl border-2 bg-white p-4 transition-all ${
                    selectedCard?.id === card.id
                      ? 'border-[var(--vesti-primary)] shadow-[0_4px_16px_rgba(41,108,125,0.12)]'
                      : 'border-transparent shadow-sm hover:border-[var(--vesti-secondary)]'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* 卡片品牌 Logo */}
                    <div className="flex h-10 w-10 items-center justify-center flex-shrink-0">
                      {renderCardBrandIcon(card.brand)}
                    </div>

                    {/* 卡片資訊 */}
                    <div className="flex-1 min-w-0">
                      <div className="mb-1 flex items-center gap-2">
                        <span
                          className="text-[var(--vesti-dark)]"
                          style={{ fontWeight: 600, fontSize: 'var(--text-h4)' }}
                        >
                          •••• {card.lastFourDigits}
                        </span>
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
                        到期日：{card.expiryMonth}/{card.expiryYear}
                      </p>
                    </div>

                    {/* 選中標記 */}
                    {selectedCard?.id === card.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--vesti-primary)]"
                      >
                        <div className="h-2 w-2 rounded-full bg-white" />
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* 新增卡片按鈕 */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsAddCardModalOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--vesti-primary)]/40 bg-[var(--vesti-primary)]/5 py-4 text-[var(--vesti-primary)] transition-all hover:border-[var(--vesti-primary)]/60 hover:bg-[var(--vesti-primary)]/10"
              >
                <Plus className="h-5 w-5" strokeWidth={2.5} />
                <span style={{ fontWeight: 600 }}>新增信用卡</span>
              </motion.button>
            </div>
          </motion.section>
        )}

        {/* ATM 轉帳資訊輸入 (當選擇 ATM 支付時顯示) */}
        {selectedPayment === 'atm' && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-5 pb-6"
          >
            <h2 className="mb-4 text-[var(--vesti-dark)]">ATM 轉帳資訊</h2>
            <div className="space-y-3 rounded-2xl border-2 border-[var(--vesti-gray-mid)]/30 bg-white p-4 shadow-sm">
              {/* 銀行代碼 */}
              <div>
                <label className="mb-2 block text-[var(--vesti-dark)]" style={{ fontSize: 'var(--text-label)', fontWeight: 600 }}>
                  銀行代碼
                </label>
                <input
                  type="text"
                  value={atmBankCode}
                  onChange={(e) => setAtmBankCode(e.target.value)}
                  placeholder="例如：012"
                  maxLength={3}
                  className="h-12 w-full rounded-xl border-2 border-[var(--vesti-gray-light)] bg-white px-4 text-[var(--vesti-dark)] outline-none transition-colors focus:border-[var(--vesti-primary)]"
                  style={{ fontSize: 'var(--text-base)' }}
                />
              </div>

              {/* 帳號 */}
              <div>
                <label className="mb-2 block text-[var(--vesti-dark)]" style={{ fontSize: 'var(--text-label)', fontWeight: 600 }}>
                  銀行帳號
                </label>
                <input
                  type="text"
                  value={atmAccountNumber}
                  onChange={(e) => setAtmAccountNumber(e.target.value)}
                  placeholder="請輸入銀行帳號"
                  className="h-12 w-full rounded-xl border-2 border-[var(--vesti-gray-light)] bg-white px-4 text-[var(--vesti-dark)] outline-none transition-colors focus:border-[var(--vesti-primary)]"
                  style={{ fontSize: 'var(--text-base)' }}
                />
              </div>

              {/* 戶名 */}
              <div>
                <label className="mb-2 block text-[var(--vesti-dark)]" style={{ fontSize: 'var(--text-label)', fontWeight: 600 }}>
                  帳戶戶名
                </label>
                <input
                  type="text"
                  value={atmAccountName}
                  onChange={(e) => setAtmAccountName(e.target.value)}
                  placeholder="請輸入戶名"
                  className="h-12 w-full rounded-xl border-2 border-[var(--vesti-gray-light)] bg-white px-4 text-[var(--vesti-dark)] outline-none transition-colors focus:border-[var(--vesti-primary)]"
                  style={{ fontSize: 'var(--text-base)' }}
                />
              </div>

              {/* 提示訊息 */}
              <div className="mt-3 rounded-xl bg-[var(--vesti-primary)]/5 p-3">
                <p className="text-[var(--vesti-gray-mid)]" style={{ fontSize: 'var(--text-label)' }}>
                  💡 請確認轉帳資訊正確，我們將於收到款項後儘快安排出貨。
                </p>
              </div>
            </div>
          </motion.section>
        )}

        {/* 物流方式選擇 */}
        <section className="px-5 pb-6">
          <h2 className="mb-4 text-[var(--vesti-dark)]">配送方式</h2>
          <div className="space-y-3">
            {shippingMethods.map((method) => (
              <motion.div
                key={method.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedShipping(method.id)}
                className={`cursor-pointer overflow-hidden rounded-2xl border-2 bg-white p-4 transition-all ${
                  selectedShipping === method.id
                    ? 'border-[var(--vesti-primary)] shadow-[0_4px_16px_rgba(41,108,125,0.12)]'
                    : 'border-transparent shadow-sm hover:border-[var(--vesti-secondary)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <method.icon
                      className={`h-5 w-5 ${
                        selectedShipping === method.id
                          ? 'text-[var(--vesti-primary)]'
                          : 'text-[var(--vesti-gray-mid)]'
                      }`}
                      strokeWidth={2}
                    />
                    <span
                      className="text-[var(--vesti-dark)]"
                      style={{ fontWeight: 600, fontSize: 'var(--text-h4)' }}
                    >
                      {method.name}
                    </span>
                  </div>
                  {selectedShipping === method.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--vesti-primary)]"
                    >
                      <div className="h-2 w-2 rounded-full bg-white" />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 便利商店門市選擇 (當選擇便利商店取貨時顯示) */}
        {(selectedShipping === '7-11' || selectedShipping === 'family') && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-5 pb-6"
          >
            <h2 className="mb-4 text-[var(--vesti-dark)]">選擇門市</h2>
            <div className="space-y-3 rounded-2xl border-2 border-[var(--vesti-gray-mid)]/30 bg-white p-4 shadow-sm">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  toast.success('開啟門市選擇地圖（功能開發中）');
                }}
                className="flex w-full items-center justify-between rounded-xl border-2 border-[var(--vesti-gray-light)] bg-white px-4 py-3 transition-all hover:border-[var(--vesti-primary)]"
              >
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-[var(--vesti-primary)]" strokeWidth={2} />
                  <span className="text-[var(--vesti-dark)]" style={{ fontSize: 'var(--text-base)' }}>
                    {selectedStore || '請選擇取貨門市'}
                  </span>
                </div>
                <ChevronRight className="h-5 w-5 text-[var(--vesti-gray-mid)]" strokeWidth={2} />
              </motion.button>
              
              <div className="rounded-xl bg-[var(--vesti-primary)]/5 p-3">
                <p className="text-[var(--vesti-gray-mid)]" style={{ fontSize: 'var(--text-label)' }}>
                  💡 選擇最近的 {selectedShipping === '7-11' ? '7-ELEVEN' : '全家'} 門市，商品到店後將以簡訊通知。
                </p>
              </div>
            </div>
          </motion.section>
        )}

        {/* 宅配資訊輸入 (當選擇宅配到府時顯示) */}
        {selectedShipping === 'home' && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-5 pb-6"
          >
            <h2 className="mb-4 text-[var(--vesti-dark)]">宅配資訊</h2>
            <div className="space-y-3 rounded-2xl border-2 border-[var(--vesti-gray-mid)]/30 bg-white p-4 shadow-sm">
              {/* 收件人姓名 */}
              <div>
                <label className="mb-2 block text-[var(--vesti-dark)]" style={{ fontSize: 'var(--text-label)', fontWeight: 600 }}>
                  收件人姓名
                </label>
                <input
                  type="text"
                  value={homeDeliveryName}
                  onChange={(e) => setHomeDeliveryName(e.target.value)}
                  placeholder="請輸入收件人姓名"
                  className="h-12 w-full rounded-xl border-2 border-[var(--vesti-gray-light)] bg-white px-4 text-[var(--vesti-dark)] outline-none transition-colors focus:border-[var(--vesti-primary)]"
                  style={{ fontSize: 'var(--text-base)' }}
                />
              </div>

              {/* 聯絡電話 */}
              <div>
                <label className="mb-2 block text-[var(--vesti-dark)]" style={{ fontSize: 'var(--text-label)', fontWeight: 600 }}>
                  聯絡電話
                </label>
                <input
                  type="tel"
                  value={homeDeliveryPhone}
                  onChange={(e) => setHomeDeliveryPhone(e.target.value)}
                  placeholder="例如：0912-345-678"
                  className="h-12 w-full rounded-xl border-2 border-[var(--vesti-gray-light)] bg-white px-4 text-[var(--vesti-dark)] outline-none transition-colors focus:border-[var(--vesti-primary)]"
                  style={{ fontSize: 'var(--text-base)' }}
                />
              </div>

              {/* 配送地址 */}
              <div>
                <label className="mb-2 block text-[var(--vesti-dark)]" style={{ fontSize: 'var(--text-label)', fontWeight: 600 }}>
                  配送地址
                </label>
                <textarea
                  value={homeDeliveryAddress}
                  onChange={(e) => setHomeDeliveryAddress(e.target.value)}
                  placeholder="請輸入完整地址，包含縣市、區域、街道和門牌號碼"
                  rows={3}
                  className="w-full rounded-xl border-2 border-[var(--vesti-gray-light)] bg-white p-4 text-[var(--vesti-dark)] outline-none transition-colors focus:border-[var(--vesti-primary)] resize-none"
                  style={{ fontSize: 'var(--text-base)' }}
                />
              </div>

              <div className="rounded-xl bg-[var(--vesti-primary)]/5 p-3">
                <p className="text-[var(--vesti-gray-mid)]" style={{ fontSize: 'var(--text-label)' }}>
                  💡 請確保收件資訊正確，配送時間為 2-3 個工作天。
                </p>
              </div>
            </div>
          </motion.section>
        )}

        {/* 優惠券 */}
        <section className="px-5 pb-6">
          <h2 className="mb-4 text-[var(--vesti-dark)]">優惠券</h2>
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="flex gap-2 p-4">
              <div className="relative flex-1">
                <Tag
                  className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--vesti-gray-mid)]"
                  strokeWidth={2}
                />
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="輸入優惠碼"
                  className="h-12 w-full rounded-xl border-2 border-[var(--vesti-gray-light)] bg-white pl-10 pr-4 text-[var(--vesti-dark)] outline-none transition-colors focus:border-[var(--vesti-primary)]"
                  style={{ fontSize: 'var(--text-body)' }}
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleApplyCoupon}
                className="rounded-xl bg-[var(--vesti-primary)] px-6 text-white transition-all hover:opacity-90"
              >
                套用
              </motion.button>
            </div>
            {appliedDiscount > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="border-t border-border bg-[var(--vesti-primary)]/5 px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[var(--vesti-primary)]" style={{ fontSize: 'var(--text-label)' }}>
                    ✨ 優惠券已套用
                  </span>
                  <span className="text-[var(--vesti-primary)]" style={{ fontWeight: 700 }}>
                    - NT$ {appliedDiscount}
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        </section>

        {/* 配送資訊提示 */}
        <section className="px-5 pb-6">
          <div className="rounded-2xl border-2 border-[var(--vesti-secondary)]/30 bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[var(--vesti-primary)]" strokeWidth={2} />
              <span
                className="text-[var(--vesti-dark)]"
                style={{ fontWeight: 600, fontSize: 'var(--text-h4)' }}
              >
                購物保障
              </span>
            </div>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-[var(--vesti-gray-mid)]" style={{ fontSize: 'var(--text-label)' }}>
                <div className="h-1.5 w-1.5 rounded-full bg-[var(--vesti-primary)]" />
                滿 NT$ 1,000 免運費
              </li>
              <li className="flex items-center gap-2 text-[var(--vesti-gray-mid)]" style={{ fontSize: 'var(--text-label)' }}>
                <div className="h-1.5 w-1.5 rounded-full bg-[var(--vesti-primary)]" />
                7 天鑑賞期無條件退換貨
              </li>
              <li className="flex items-center gap-2 text-[var(--vesti-gray-mid)]" style={{ fontSize: 'var(--text-label)' }}>
                <div className="h-1.5 w-1.5 rounded-full bg-[var(--vesti-primary)]" />
                安全交易保障
              </li>
            </ul>
          </div>
        </section>
      </div>

      {/* 底部固定結帳欄 */}
      <div className="fixed bottom-16 left-0 right-0 z-40 border-t border-border bg-white/95 backdrop-blur-md">
        {/* 價格明細 */}
        <div className="px-5 py-4">
          <div className="mb-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[var(--vesti-gray-mid)]" style={{ fontSize: 'var(--text-body)' }}>
                小計
              </span>
              <span className="text-[var(--vesti-dark)]" style={{ fontSize: 'var(--text-body)' }}>
                NT$ {subtotal.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--vesti-gray-mid)]" style={{ fontSize: 'var(--text-body)' }}>
                運費
              </span>
              <span className="text-[var(--vesti-dark)]" style={{ fontSize: 'var(--text-body)' }}>
                {shippingFee === 0 ? '免運' : `NT$ ${shippingFee}`}
              </span>
            </div>
            {appliedDiscount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-[var(--vesti-primary)]" style={{ fontSize: 'var(--text-body)' }}>
                  優惠折扣
                </span>
                <span className="text-[var(--vesti-primary)]" style={{ fontSize: 'var(--text-body)' }}>
                  - NT$ {appliedDiscount}
                </span>
              </div>
            )}
          </div>

          <div className="mb-4 flex items-center justify-between border-t border-border pt-3">
            <span className="text-[var(--vesti-dark)]" style={{ fontWeight: 600 }}>
              總計
            </span>
            <span className="text-[var(--vesti-primary)]" style={{ fontWeight: 700, fontSize: 'var(--text-h3)' }}>
              NT$ {total.toLocaleString()}
            </span>
          </div>

          {/* 結帳按鈕 */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCheckout}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--vesti-primary)] py-4 text-white shadow-lg transition-all hover:shadow-xl"
          >
            <span style={{ fontWeight: 600 }}>確認結帳</span>
            <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
          </motion.button>
        </div>
      </div>

      {/* 新增卡片 Modal */}
      <AddPaymentCardModal
        isOpen={isAddCardModalOpen}
        onClose={() => setIsAddCardModalOpen(false)}
        onAdd={handleAddCard}
      />

      {/* 地址 Modal */}
      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => {
          setIsAddressModalOpen(false);
          setEditingAddress(null);
        }}
        editingAddress={editingAddress}
        onSave={handleSaveAddress}
      />
    </div>
  );
}