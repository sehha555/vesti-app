import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Package, Truck, MapPin, CheckCircle2, Clock, Phone, MessageCircle, ChevronDown, Navigation, Store } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface DeliveryItem {
  id: number;
  name: string;
  imageUrl: string;
  price: number;
  quantity: number;
}

interface MerchantDelivery {
  merchantId: string;
  merchantName: string;
  orderId: string;
  items: DeliveryItem[];
  totalAmount: number;
  currentStatus: 'pending' | 'shipped' | 'transit' | 'delivery' | 'delivered';
  estimatedDate: string;
  trackingNumber: string;
  timeline: TimelineEvent[];
}

interface TimelineEvent {
  status: string;
  location: string;
  timestamp: string;
  description: string;
  completed: boolean;
}

interface DeliveryTrackingPageProps {
  onBack: () => void;
  initialMerchant?: string;
}

export function DeliveryTrackingPage({ onBack, initialMerchant }: DeliveryTrackingPageProps) {
  const [selectedMerchant, setSelectedMerchant] = useState<string>(initialMerchant || 'MUJI');
  const [expandedTimeline, setExpandedTimeline] = useState(true);

  // Mock delivery data - grouped by merchant
  const merchantDeliveries: MerchantDelivery[] = [
    {
      merchantId: 'MUJI',
      merchantName: 'MUJI',
      orderId: 'VT20241212003',
      items: [
        {
          id: 1,
          name: '羊毛針織衫',
          imageUrl: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&q=80',
          price: 1280,
          quantity: 1,
        },
        {
          id: 2,
          name: '棉質襯衫',
          imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&q=80',
          price: 890,
          quantity: 2,
        },
        {
          id: 3,
          name: '亞麻長褲',
          imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&q=80',
          price: 1450,
          quantity: 1,
        },
        {
          id: 4,
          name: '基本款T恤',
          imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80',
          price: 390,
          quantity: 2,
        },
        {
          id: 5,
          name: '輕羽絨外套',
          imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&q=80',
          price: 2990,
          quantity: 1,
        },
      ],
      totalAmount: 7390,
      currentStatus: 'delivered',
      estimatedDate: '12月13日',
      trackingNumber: 'TW1122334455',
      timeline: [
        {
          status: '商家發貨',
          location: '台北市松山區',
          timestamp: '12月11日 09:00',
          description: '商品已從倉庫出貨',
          completed: true,
        },
        {
          status: '物流中心',
          location: '桃園物流園區',
          timestamp: '12月11日 15:20',
          description: '包裹已抵達物流中心',
          completed: true,
        },
        {
          status: '運送中',
          location: '台北轉運站',
          timestamp: '12月12日 08:45',
          description: '包裹正在配送途中',
          completed: true,
        },
        {
          status: '最後一哩',
          location: '台北市中正區',
          timestamp: '12月13日 10:30',
          description: '配送員準備送達',
          completed: true,
        },
        {
          status: '已送達',
          location: '收件地址',
          timestamp: '12月13日 13:45',
          description: '包裹已成功送達，感謝購買',
          completed: true,
        },
      ],
    },
    {
      merchantId: 'BasicWear',
      merchantName: 'BasicWear',
      orderId: 'VT20241214001',
      items: [
        {
          id: 6,
          name: '經典白T恤',
          imageUrl: 'https://images.unsplash.com/photo-1643881080033-e67069c5e4df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
          price: 890,
          quantity: 1,
        },
        {
          id: 7,
          name: '圓領衛衣',
          imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&q=80',
          price: 1290,
          quantity: 1,
        },
      ],
      totalAmount: 2180,
      currentStatus: 'delivery',
      estimatedDate: '12月15日',
      trackingNumber: 'TW1234567890',
      timeline: [
        {
          status: '商家發貨',
          location: '台北市信義區',
          timestamp: '12月13日 14:30',
          description: '商品已從倉庫出貨',
          completed: true,
        },
        {
          status: '物流中心',
          location: '桃園物流園區',
          timestamp: '12月13日 18:45',
          description: '包裹已抵達物流中心',
          completed: true,
        },
        {
          status: '運送中',
          location: '台中轉運站',
          timestamp: '12月14日 09:20',
          description: '包裹正在配送途中',
          completed: true,
        },
        {
          status: '最後一哩',
          location: '台中市西屯區',
          timestamp: '預計 12月15日 14:00',
          description: '配送員準備送達',
          completed: false,
        },
        {
          status: '已送達',
          location: '收件地址',
          timestamp: '---',
          description: '包裹已成功送達',
          completed: false,
        },
      ],
    },
    {
      merchantId: 'DenimCo',
      merchantName: 'Denim Co.',
      orderId: 'VT20241214002',
      items: [
        {
          id: 8,
          name: '直筒牛仔褲',
          imageUrl: 'https://images.unsplash.com/photo-1602585198422-d795fa9bfd6f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
          price: 1590,
          quantity: 1,
        },
      ],
      totalAmount: 1590,
      currentStatus: 'transit',
      estimatedDate: '12月17日',
      trackingNumber: 'TW0987654321',
      timeline: [
        {
          status: '商家發貨',
          location: '台北市大安區',
          timestamp: '12月14日 10:15',
          description: '商品已從倉庫出貨',
          completed: true,
        },
        {
          status: '物流中心',
          location: '新竹物流園區',
          timestamp: '12月14日 16:30',
          description: '包裹已抵達物流中心',
          completed: true,
        },
        {
          status: '運送中',
          location: '---',
          timestamp: '預計 12月15日',
          description: '包裹正在配送途中',
          completed: false,
        },
        {
          status: '最後一哩',
          location: '---',
          timestamp: '預計 12月17日',
          description: '配送員準備送達',
          completed: false,
        },
        {
          status: '已送達',
          location: '收件地址',
          timestamp: '---',
          description: '包裹已成功送達',
          completed: false,
        },
      ],
    },
  ];

  const currentMerchant = merchantDeliveries.find(m => m.merchantId === selectedMerchant) || merchantDeliveries[0];
  const totalItems = merchantDeliveries.reduce((sum, m) => sum + m.items.length, 0);

  // Progress calculation
  const completedSteps = currentMerchant.timeline.filter(event => event.completed).length;
  const totalSteps = currentMerchant.timeline.length;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  const getStatusIcon = (status: string, completed: boolean) => {
    if (status === '商家發貨') return <Package className="h-5 w-5" strokeWidth={2} />;
    if (status === '物流中心') return <MapPin className="h-5 w-5" strokeWidth={2} />;
    if (status === '運送中') return <Truck className="h-5 w-5" strokeWidth={2} />;
    if (status === '最後一哩') return <Navigation className="h-5 w-5" strokeWidth={2} />;
    if (status === '已送達') return <CheckCircle2 className="h-5 w-5" strokeWidth={2} />;
    return <Clock className="h-5 w-5" strokeWidth={2} />;
  };

  const getStatusColor = (currentStatus: string) => {
    switch (currentStatus) {
      case 'delivered': return 'text-green-600';
      case 'delivery': return 'text-orange-500';
      case 'transit': return 'text-blue-500';
      case 'shipped': return 'text-purple-500';
      default: return 'text-[var(--vesti-gray-mid)]';
    }
  };

  const getStatusText = (currentStatus: string) => {
    switch (currentStatus) {
      case 'delivered': return '已送達';
      case 'delivery': return '配送中';
      case 'transit': return '運送中';
      case 'shipped': return '已出貨';
      default: return '準備中';
    }
  };

  return (
    <div className="min-h-screen bg-[var(--vesti-background)] pb-6">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-border">
        <div className="flex items-center justify-between px-5 py-4">
          <button
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[var(--vesti-gray-light)] transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-[var(--vesti-dark)]" strokeWidth={2} />
          </button>
          
          <div className="text-center flex-1">
            <h1 className="text-[var(--vesti-dark)]" style={{ fontWeight: 700 }}>物流追蹤</h1>
            <p className="text-[var(--vesti-gray-mid)] mt-0.5" style={{ fontSize: 'var(--text-label)' }}>
              {totalItems} 件商品配送中
            </p>
          </div>

          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Order Tabs */}
      <div className="px-5 py-4 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {merchantDeliveries.map((merchant) => (
            <button
              key={merchant.merchantId}
              onClick={() => setSelectedMerchant(merchant.merchantId)}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all ${
                selectedMerchant === merchant.merchantId
                  ? 'bg-[var(--vesti-primary)] border-[var(--vesti-primary)] text-white'
                  : 'bg-white border-border text-[var(--vesti-dark)] hover:border-[var(--vesti-primary)]'
              }`}
            >
              <Store className={`h-5 w-5 flex-shrink-0 ${
                selectedMerchant === merchant.merchantId ? 'text-white' : 'text-[var(--vesti-primary)]'
              }`} strokeWidth={2} />
              <div className="text-left">
                <p style={{ fontWeight: 600, fontSize: 'var(--text-label)' }}>
                  {merchant.merchantName}
                </p>
                <p className={selectedMerchant === merchant.merchantId ? 'text-white/80' : 'text-[var(--vesti-gray-mid)]'} style={{ fontSize: '11px' }}>
                  {merchant.items.length} 件商品
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-5 space-y-4">
        {/* Order Info Card */}
        <motion.div
          key={selectedMerchant}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-3xl border-2 border-border p-5 shadow-sm"
        >
          {/* Product Info */}
          <div className="flex items-center gap-4 mb-5">
            <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border-2 border-border bg-white">
              <ImageWithFallback
                src={currentMerchant.items[0].imageUrl}
                alt={currentMerchant.items[0].name}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-[var(--vesti-dark)] mb-1" style={{ fontWeight: 700 }}>
                {currentMerchant.items[0].name}
              </h2>
              <p className="text-[var(--vesti-gray-mid)] mb-2" style={{ fontSize: 'var(--text-label)' }}>
                {currentMerchant.merchantName} · 數量 {currentMerchant.items[0].quantity}
              </p>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full ${getStatusColor(currentMerchant.currentStatus)} bg-opacity-10`} style={{ fontSize: 'var(--text-label)', fontWeight: 600 }}>
                  {getStatusText(currentMerchant.currentStatus)}
                </span>
                <span className="text-[var(--vesti-dark)]" style={{ fontWeight: 700 }}>
                  ${currentMerchant.items[0].price.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Estimated Delivery */}
          <div className="bg-[var(--vesti-bg-secondary)] rounded-2xl p-4 mb-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[var(--vesti-gray-mid)] mb-1" style={{ fontSize: 'var(--text-label)' }}>
                  預計送達時間
                </p>
                <p className="text-[var(--vesti-primary)]" style={{ fontWeight: 700, fontSize: '18px' }}>
                  {currentMerchant.estimatedDate}
                </p>
              </div>
              <Clock className="h-8 w-8 text-[var(--vesti-primary)]" strokeWidth={2} />
            </div>
          </div>

          {/* Items Grid - Show all items from this merchant */}
          {currentMerchant.items.length > 1 && (
            <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[var(--vesti-dark)]" style={{ fontWeight: 600, fontSize: 'var(--text-label)' }}>
                  本批次商品
                </h3>
                <span className="text-[var(--vesti-gray-mid)]" style={{ fontSize: 'var(--text-label)' }}>
                  共 {currentMerchant.items.length} 件
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {currentMerchant.items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-[var(--vesti-bg-secondary)] rounded-xl p-2 border border-border hover:border-[var(--vesti-primary)] transition-all"
                  >
                    <div className="aspect-square overflow-hidden rounded-lg mb-2 bg-white">
                      <ImageWithFallback
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <p className="text-[var(--vesti-dark)] line-clamp-1 mb-1" style={{ fontSize: '11px', fontWeight: 600 }}>
                      {item.name}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--vesti-primary)]" style={{ fontSize: '11px', fontWeight: 700 }}>
                        ${item.price}
                      </span>
                      {item.quantity > 1 && (
                        <span className="text-[var(--vesti-gray-mid)]" style={{ fontSize: '10px' }}>
                          x{item.quantity}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                <span className="text-[var(--vesti-gray-mid)]" style={{ fontSize: 'var(--text-label)' }}>
                  訂單總額
                </span>
                <span className="text-[var(--vesti-dark)]" style={{ fontWeight: 700 }}>
                  ${currentMerchant.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* Tracking Number */}
          <div className="flex items-center justify-between py-3 border-t border-border">
            <span className="text-[var(--vesti-gray-mid)]" style={{ fontSize: 'var(--text-label)' }}>
              追蹤編號
            </span>
            <span className="text-[var(--vesti-dark)]" style={{ fontWeight: 600, fontSize: 'var(--text-label)' }}>
              {currentMerchant.trackingNumber}
            </span>
          </div>
        </motion.div>

        {/* Progress Bar */}
        <div className="bg-white rounded-3xl border-2 border-border p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[var(--vesti-dark)]" style={{ fontWeight: 700 }}>
              配送進度
            </h3>
            <span className="text-[var(--vesti-primary)]" style={{ fontWeight: 600, fontSize: 'var(--text-label)' }}>
              {completedSteps}/{totalSteps}
            </span>
          </div>

          {/* Progress Visualization */}
          <div className="relative mb-6">
            {/* Background Line */}
            <div className="absolute top-6 left-0 right-0 h-1 bg-[var(--vesti-gray-light)] rounded-full" />
            {/* Progress Line */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="absolute top-6 left-0 h-1 bg-[var(--vesti-primary)] rounded-full"
            />

            {/* Step Indicators */}
            <div className="relative flex justify-between">
              {currentMerchant.timeline.map((event, index) => (
                <div key={index} className="flex flex-col items-center" style={{ flex: 1 }}>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`h-12 w-12 rounded-full border-4 flex items-center justify-center mb-2 ${
                      event.completed
                        ? 'bg-[var(--vesti-primary)] border-white text-white shadow-lg'
                        : 'bg-white border-[var(--vesti-gray-light)] text-[var(--vesti-gray-mid)]'
                    }`}
                  >
                    {getStatusIcon(event.status, event.completed)}
                  </motion.div>
                  <p
                    className={`text-center ${
                      event.completed ? 'text-[var(--vesti-dark)]' : 'text-[var(--vesti-gray-mid)]'
                    }`}
                    style={{ fontSize: '11px', fontWeight: event.completed ? 600 : 400 }}
                  >
                    {event.status}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline Details */}
        <div className="bg-white rounded-3xl border-2 border-border p-5 shadow-sm">
          <button
            onClick={() => setExpandedTimeline(!expandedTimeline)}
            className="flex items-center justify-between w-full mb-4"
          >
            <h3 className="text-[var(--vesti-dark)]" style={{ fontWeight: 700 }}>
              物流軌跡
            </h3>
            <motion.div
              animate={{ rotate: expandedTimeline ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-5 w-5 text-[var(--vesti-gray-mid)]" strokeWidth={2} />
            </motion.div>
          </button>

          <AnimatePresence>
            {expandedTimeline && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="relative space-y-4">
                  {/* Vertical Line */}
                  <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-[var(--vesti-gray-light)]" />

                  {currentMerchant.timeline.map((event, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative flex gap-4"
                    >
                      {/* Timeline Dot */}
                      <div
                        className={`relative z-10 h-8 w-8 flex-shrink-0 rounded-full border-4 flex items-center justify-center ${
                          event.completed
                            ? 'bg-[var(--vesti-primary)] border-white shadow-md'
                            : 'bg-white border-[var(--vesti-gray-light)]'
                        }`}
                      >
                        {event.completed && (
                          <CheckCircle2 className="h-4 w-4 text-white" strokeWidth={3} />
                        )}
                      </div>

                      {/* Event Details */}
                      <div className="flex-1 pb-4">
                        <div className="flex items-start justify-between mb-1">
                          <h4
                            className={event.completed ? 'text-[var(--vesti-dark)]' : 'text-[var(--vesti-gray-mid)]'}
                            style={{ fontWeight: 600 }}
                          >
                            {event.status}
                          </h4>
                          <span
                            className="text-[var(--vesti-gray-mid)]"
                            style={{ fontSize: '11px' }}
                          >
                            {event.timestamp}
                          </span>
                        </div>
                        <p className="text-[var(--vesti-gray-mid)] mb-1" style={{ fontSize: 'var(--text-label)' }}>
                          {event.location}
                        </p>
                        <p className="text-[var(--vesti-gray-mid)]" style={{ fontSize: '11px' }}>
                          {event.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Contact Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center gap-2 bg-white border-2 border-border rounded-2xl py-4 hover:border-[var(--vesti-primary)] transition-all">
            <Phone className="h-5 w-5 text-[var(--vesti-primary)]" strokeWidth={2} />
            <span className="text-[var(--vesti-dark)]" style={{ fontWeight: 600 }}>
              聯絡物流
            </span>
          </button>
          <button className="flex items-center justify-center gap-2 bg-white border-2 border-border rounded-2xl py-4 hover:border-[var(--vesti-primary)] transition-all">
            <MessageCircle className="h-5 w-5 text-[var(--vesti-primary)]" strokeWidth={2} />
            <span className="text-[var(--vesti-dark)]" style={{ fontWeight: 600 }}>
              聯絡商家
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}