import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, User, Ruler, Settings, Upload, Edit2, Check, X, Package, ChevronRight, Sparkles, Search, Plus, ShoppingBag, Blend, Star, ShoppingCart, LogOut, CreditCard } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner';
import { UploadOptionsDialog } from './UploadOptionsDialog';

import { Switch } from './ui/switch';
import { Input } from './ui/input';

interface BodyMeasurements {
  height: string;
  weight: string;
  bust: string;
  waist: string;
  hips: string;
}

interface AISettings {
  weatherBased: boolean;
  recommendationType: 'conservative' | 'exploratory' | 'mixed';
  brandBlacklist: string[];
  favoriteStores: string[];
}

interface Order {
  id: string;
  date: string;
  total: number;
  status: 'completed' | 'processing' | 'cancelled';
  items: number;
}

const categoryDistribution = [
  { name: '上衣', count: 26 },
  { name: '下身', count: 18 },
  { name: '鞋子', count: 15 },
  { name: '外套', count: 14 },
  { name: '配件', count: 20 },
];

const recentOrders: Order[] = [
  {
    id: 'ORD-2024-1108-001',
    date: '2024-11-08',
    total: 4980,
    status: 'completed',
    items: 3,
  },
  {
    id: 'ORD-2024-11-05-002',
    date: '2024-11-05',
    total: 2890,
    status: 'processing',
    items: 2,
  },
  {
    id: 'ORD-2024-11-01-003',
    date: '2024-11-01',
    total: 1590,
    status: 'completed',
    items: 1,
  },
];

interface ProfilePageProps {
  onNavigateToCheckout?: () => void;
  onNavigateToDelivery?: (merchant?: string) => void;
  onLogout?: () => void;
  onNavigateToPaymentMethods?: () => void;
}

export function ProfilePage({ onNavigateToCheckout, onNavigateToDelivery, onLogout, onNavigateToPaymentMethods }: ProfilePageProps = {}) {
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [tryOnPhoto, setTryOnPhoto] = useState<string | null>(null);
  const [isEditingMeasurements, setIsEditingMeasurements] = useState(false);
  const [measurements, setMeasurements] = useState<BodyMeasurements>({
    height: '170',
    weight: '60',
    bust: '',
    waist: '',
    hips: '',
  });
  const [tempMeasurements, setTempMeasurements] = useState<BodyMeasurements>(measurements);
  const [aiSettings, setAISettings] = useState<AISettings>({
    weatherBased: true,
    recommendationType: 'exploratory',
    brandBlacklist: [],
    favoriteStores: ['UNIQLO', 'ZARA', 'H&M'],
  });
  const [brandInput, setBrandInput] = useState('');
  const [storeInput, setStoreInput] = useState('');

  // 上傳對話框狀態
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadType, setUploadType] = useState<'profile' | 'tryon'>('profile');

  // 檔案選擇器 refs
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // 點擊頭像或全身照區域
  const handleAvatarClick = () => {
    setUploadType('profile');
    setIsUploadDialogOpen(true);
  };

  const handleTryOnClick = () => {
    setUploadType('tryon');
    setIsUploadDialogOpen(true);
  };

  // 相機上傳
  const handleCameraUpload = () => {
    setIsUploadDialogOpen(false);
    cameraInputRef.current?.click();
  };

  // 相簿上傳
  const handleGalleryUpload = () => {
    setIsUploadDialogOpen(false);
    galleryInputRef.current?.click();
  };

  // 處理檔案選擇
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (uploadType === 'profile') {
          setProfilePhoto(result);
          toast.success('頭像已更新 ✨');
        } else {
          setTryOnPhoto(result);
          toast.success('試穿照片已上傳 ✨');
        }
      };
      reader.readAsDataURL(file);
    }
    // 重置 input 以便可以重複選擇同一張照片
    event.target.value = '';
  };

  const handleSaveMeasurements = () => {
    setMeasurements(tempMeasurements);
    setIsEditingMeasurements(false);
    toast.success('身體數據已更新');
  };

  const handleCancelEdit = () => {
    setTempMeasurements(measurements);
    setIsEditingMeasurements(false);
  };

  const addBrand = () => {
    if (brandInput.trim() && !aiSettings.brandBlacklist.includes(brandInput.trim())) {
      setAISettings((prev) => ({
        ...prev,
        brandBlacklist: [...prev.brandBlacklist, brandInput.trim()],
      }));
      setBrandInput('');
      toast.success('品牌已加入黑名單');
    }
  };

  const removeBrand = (brand: string) => {
    setAISettings((prev) => ({
      ...prev,
      brandBlacklist: prev.brandBlacklist.filter((b) => b !== brand),
    }));
  };

  const addStore = () => {
    if (storeInput.trim() && !aiSettings.favoriteStores.includes(storeInput.trim())) {
      setAISettings((prev) => ({
        ...prev,
        favoriteStores: [...prev.favoriteStores, storeInput.trim()],
      }));
      setStoreInput('');
      toast.success('店家已加入最愛');
    }
  };

  const removeStore = (store: string) => {
    setAISettings((prev) => ({
      ...prev,
      favoriteStores: prev.favoriteStores.filter((s) => s !== store),
    }));
  };

  const getOrderStatusText = (status: Order['status']) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'processing':
        return '處理中';
      case 'cancelled':
        return '已取消';
    }
  };

  const getOrderStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'completed':
        return 'text-success';
      case 'processing':
        return 'text-primary';
      case 'cancelled':
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border"
      >
        <div className="flex items-center justify-center px-5 py-4">
          <h1 className="text-foreground">個人檔案</h1>
        </div>
      </motion.header>

      <div className="px-5 pt-6 space-y-5">
        {/* Profile Photo Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-white border-2 border-muted-foreground/30 p-5 shadow-[0_4px_16px_rgba(0,0,0,0.12)]"
        >
          <div className="flex items-center gap-4">
            <div 
              className="relative cursor-pointer"
              onClick={handleAvatarClick}
            >
              {profilePhoto ? (
                <div className="h-20 w-20 overflow-hidden rounded-full bg-muted">
                  <ImageWithFallback
                    src={profilePhoto}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-dashed border-primary/30 transition-all hover:border-primary/50 hover:bg-primary/10">
                  <User className="h-8 w-8 text-primary/40" strokeWidth={1.5} />
                </div>
              )}
              <div className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:bg-primary/90">
                <Camera className="h-4 w-4" strokeWidth={2} />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-foreground font-semibold">
                個人頭像
              </h3>
              <p className="text-muted-foreground text-sm">
                設定您的個人檔案照片
              </p>
            </div>
          </div>
        </motion.section>

        {/* Try-On Photo Upload Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl bg-white border-2 border-muted-foreground/30 p-5 shadow-[0_4px_16px_rgba(0,0,0,0.12)]"
        >
          <div className="mb-3">
            <h3 className="text-foreground font-semibold">
              試穿用照片
            </h3>
            <p className="text-muted-foreground text-sm">
              上傳全身照以獲得更準確的虛擬試穿效果
            </p>
          </div>
          
          {tryOnPhoto ? (
            <div 
              className="relative rounded-xl overflow-hidden bg-muted cursor-pointer"
              onClick={handleTryOnClick}
            >
              <ImageWithFallback
                src={tryOnPhoto}
                alt="Try On Photo"
                className="w-full h-64 object-cover"
              />
              <div className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:bg-primary/90">
                <Camera className="h-5 w-5" strokeWidth={2} />
              </div>
            </div>
          ) : (
            <div
              onClick={handleTryOnClick}
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 py-8 transition-all hover:border-primary/50 hover:bg-primary/10"
            >
              <Upload className="mb-2 h-8 w-8 text-primary" strokeWidth={2} />
              <p className="text-primary font-semibold">
                點擊上傳照片
              </p>
              <p className="text-muted-foreground text-sm">
                建議使用全身正面照
              </p>
            </div>
          )}
        </motion.section>

        {/* Body Measurements Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl bg-white border-2 border-muted-foreground/30 p-5 shadow-[0_4px_16px_rgba(0,0,0,0.12)]"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ruler className="h-5 w-5 text-primary" strokeWidth={2} />
              <h3 className="text-foreground font-semibold">
                身體數據
              </h3>
            </div>
            {!isEditingMeasurements ? (
              <button
                onClick={() => {
                  setIsEditingMeasurements(true);
                  setTempMeasurements(measurements);
                }}
                className="flex items-center gap-1 text-primary text-sm"
              >
                <Edit2 className="h-4 w-4" strokeWidth={2} />
                <span>編輯</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancelEdit}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors hover:bg-muted/80"
                >
                  <X className="h-4 w-4" strokeWidth={2} />
                </button>
                <button
                  onClick={handleSaveMeasurements}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <Check className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {/* Height & Weight */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-background p-3">
                <label className="mb-1 block text-muted-foreground text-sm">
                  身高 (cm)
                </label>
                {isEditingMeasurements ? (
                  <Input
                    type="number"
                    value={tempMeasurements.height}
                    onChange={(e) => setTempMeasurements({ ...tempMeasurements, height: e.target.value })}
                    className="w-full bg-white rounded-lg border border-border px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                ) : (
                  <p className="text-foreground font-semibold">
                    {measurements.height || '—'} {measurements.height && 'cm'}
                  </p>
                )}
              </div>
              <div className="rounded-xl bg-background p-3">
                <label className="mb-1 block text-muted-foreground text-sm">
                  體重 (kg)
                </label>
                {isEditingMeasurements ? (
                  <Input
                    type="number"
                    value={tempMeasurements.weight}
                    onChange={(e) => setTempMeasurements({ ...tempMeasurements, weight: e.target.value })}
                    className="w-full bg-white rounded-lg border border-border px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                ) : (
                  <p className="text-foreground font-semibold">
                    {measurements.weight || '—'} {measurements.weight && 'kg'}
                  </p>
                )}
              </div>
            </div>

            {/* Three Measurements */}
            <div className="rounded-xl bg-background p-3">
              <label className="mb-2 block text-muted-foreground text-sm">
                三圍 (cm) <span className="text-muted-foreground/60">— 選填</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="mb-1 block text-muted-foreground text-xs">
                    胸圍
                  </label>
                  {isEditingMeasurements ? (
                    <Input
                      type="number"
                      placeholder="—"
                      value={tempMeasurements.bust}
                      onChange={(e) => setTempMeasurements({ ...tempMeasurements, bust: e.target.value })}
                      className="w-full bg-white rounded-lg border border-border px-2 py-1.5 text-foreground text-center focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                    />
                  ) : (
                    <p className="text-foreground text-center font-semibold">
                      {measurements.bust || '—'}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-muted-foreground text-xs">
                    腰圍
                  </label>
                  {isEditingMeasurements ? (
                    <Input
                      type="number"
                      placeholder="—"
                      value={tempMeasurements.waist}
                      onChange={(e) => setTempMeasurements({ ...tempMeasurements, waist: e.target.value })}
                      className="w-full bg-white rounded-lg border border-border px-2 py-1.5 text-foreground text-center focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                    />
                  ) : (
                    <p className="text-foreground text-center font-semibold">
                      {measurements.waist || '—'}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-muted-foreground text-xs">
                    臀圍
                  </label>
                  {isEditingMeasurements ? (
                    <Input
                      type="number"
                      placeholder="—"
                      value={tempMeasurements.hips}
                      onChange={(e) => setTempMeasurements({ ...tempMeasurements, hips: e.target.value })}
                      className="w-full bg-white rounded-lg border border-border px-2 py-1.5 text-foreground text-center focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                    />
                  ) : (
                    <p className="text-foreground text-center font-semibold">
                      {measurements.hips || '—'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Wardrobe Overview Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl bg-muted/50 border-2 border-muted-foreground/20 p-5 shadow-[0_4px_16px_rgba(0,0,0,0.12)]"
        >
          <div className="mb-4">
            <h3 className="text-foreground font-semibold">
              衣櫃概覽
            </h3>
            <p className="text-muted-foreground text-sm">
              最後更新：今天
            </p>
          </div>

          {/* Stats Grid */}
          <div className="mb-5 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/40 p-3 text-center">
              <p className="mb-1 text-primary text-2xl font-bold">
                93
              </p>
              <p className="text-muted-foreground text-sm">
                衣物總數
              </p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/40 p-3 text-center">
              <p className="mb-1 text-primary text-2xl font-bold">
                38
              </p>
              <p className="text-muted-foreground text-sm">
                搭配套數
              </p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/40 p-3 text-center">
              <p className="mb-1 text-primary text-2xl font-bold">
                67
              </p>
              <p className="text-muted-foreground text-sm">
                常穿單品
              </p>
            </div>
          </div>

          {/* Category Distribution */}
          <div>
            <h4 className="mb-3 text-foreground font-semibold text-base">
              品類分布
            </h4>
            <div className="space-y-2">
              {categoryDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-3">
                  <span className="w-12 text-foreground text-sm">
                    {item.name}
                  </span>
                  <div className="flex-1 h-6 rounded-full bg-white overflow-hidden border border-border">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                      style={{ width: `${(item.count / 30) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-foreground text-sm font-semibold">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Shopping Cart Quick Access */}
        {onNavigateToCheckout && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={onNavigateToCheckout}
              className="w-full overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-secondary p-5 shadow-lg transition-all hover:shadow-xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                    <ShoppingCart className="h-7 w-7 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="text-left">
                    <h3 className="mb-1 text-white font-semibold">
                      購物車
                    </h3>
                    <p className="text-white/90 text-sm">
                      3 件商品待結帳
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-6 w-6 text-white" strokeWidth={2.5} />
              </div>
            </motion.button>
          </motion.section>
        )}

        {/* Payment Methods Management Section */}
        {onNavigateToPaymentMethods && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38 }}
          >
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={onNavigateToPaymentMethods}
              className="w-full overflow-hidden rounded-2xl bg-white border-2 border-muted-foreground/30 p-5 shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-all hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <CreditCard className="h-7 w-7 text-primary" strokeWidth={2.5} />
                  </div>
                  <div className="text-left">
                    <h3 className="mb-1 text-foreground font-semibold">
                      支付方式
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      管理您的信用卡和付款資訊
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-6 w-6 text-muted-foreground" strokeWidth={2.5} />
              </div>
            </motion.button>
          </motion.section>
        )}

        {/* Order History Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl bg-muted/50 border-2 border-muted-foreground/20 p-5 shadow-[0_4px_16px_rgba(0,0,0,0.12)]"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" strokeWidth={2} />
              <h3 className="text-foreground font-semibold">
                訂單紀錄
              </h3>
            </div>
            <button 
              onClick={onNavigateToDelivery}
              className="flex items-center gap-1 text-primary text-sm"
            >
              <span>查看全部</span>
              <ChevronRight className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>

          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="rounded-xl bg-background p-3 transition-all hover:shadow-sm"
              >
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <p className="text-foreground font-semibold text-sm">
                      {order.id}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {order.date}
                    </p>
                  </div>
                  <span className={`${getOrderStatusColor(order.status)} text-sm font-semibold`}>
                    {getOrderStatusText(order.status)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    共 {order.items} 件商品
                  </span>
                  <span className="text-primary font-bold">
                    NT$ {order.total.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* AI Settings Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl bg-muted/50 border-2 border-muted-foreground/20 p-5 shadow-[0_4px_16px_rgba(0,0,0,0.12)]"
        >
          <div className="mb-4 flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" strokeWidth={2} />
            <h3 className="text-foreground font-semibold">
              AI 推薦設定
            </h3>
          </div>

          <div className="space-y-4">
            {/* Weather Based */}
            <div className="flex items-center justify-between rounded-xl bg-background p-3">
              <div>
                <p className="text-foreground font-semibold">
                  天氣智能推薦
                </p>
                <p className="text-muted-foreground text-sm">
                  根據當日天氣調整穿搭建議
                </p>
              </div>
              <Switch
                checked={aiSettings.weatherBased}
                onCheckedChange={(checked) =>
                  setAISettings({ ...aiSettings, weatherBased: checked })
                }
              />
            </div>

            {/* Recommendation Type */}
            <div className="rounded-xl bg-background p-3">
              <label className="mb-2 block text-foreground font-semibold">
                推薦類型
              </label>
              <p className="mb-3 text-muted-foreground text-sm">
                選擇 AI 為您推薦的穿搭風格傾向
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setAISettings({ ...aiSettings, recommendationType: 'conservative' })}
                  className={`rounded-xl border p-2.5 transition-all ${
                    aiSettings.recommendationType === 'conservative'
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-white hover:border-primary/50'
                  }`}
                >
                  <div className="mb-1.5 flex justify-center">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full ${
                      aiSettings.recommendationType === 'conservative'
                        ? 'bg-primary'
                        : 'bg-muted'
                    }`}>
                      <Settings className={`h-4 w-4 ${
                        aiSettings.recommendationType === 'conservative'
                          ? 'text-white'
                          : 'text-muted-foreground'
                      }`} strokeWidth={2} />
                    </div>
                  </div>
                  <p className={`text-center ${
                    aiSettings.recommendationType === 'conservative'
                      ? 'text-primary'
                      : 'text-foreground'
                  } font-semibold text-sm`}>
                    保守推薦
                  </p>
                  <p className="text-center text-muted-foreground text-xs">
                    符合風格
                  </p>
                </button>

                <button
                  onClick={() => setAISettings({ ...aiSettings, recommendationType: 'exploratory' })}
                  className={`rounded-xl border p-2.5 transition-all ${
                    aiSettings.recommendationType === 'exploratory'
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-white hover:border-primary/50'
                  }`}
                >
                  <div className="mb-1.5 flex justify-center">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full ${
                      aiSettings.recommendationType === 'exploratory'
                        ? 'bg-primary'
                        : 'bg-muted'
                    }`}>
                      <Sparkles className={`h-4 w-4 ${
                        aiSettings.recommendationType === 'exploratory'
                          ? 'text-white'
                          : 'text-muted-foreground'
                      }`} strokeWidth={2} />
                    </div>
                  </div>
                  <p className={`text-center ${
                    aiSettings.recommendationType === 'exploratory'
                      ? 'text-primary'
                      : 'text-foreground'
                  } font-semibold text-sm`}>
                    探索推薦
                  </p>
                  <p className="text-center text-muted-foreground text-xs">
                    嘗試新風格
                  </p>
                </button>

                <button
                  onClick={() => setAISettings({ ...aiSettings, recommendationType: 'mixed' })}
                  className={`rounded-xl border p-2.5 transition-all ${
                    aiSettings.recommendationType === 'mixed'
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-white hover:border-primary/50'
                  }`}
                >
                  <div className="mb-1.5 flex justify-center">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full ${
                      aiSettings.recommendationType === 'mixed'
                        ? 'bg-primary'
                        : 'bg-muted'
                    }`}>
                      <Blend className={`h-4 w-4 ${
                        aiSettings.recommendationType === 'mixed'
                          ? 'text-white'
                          : 'text-muted-foreground'
                      }`} strokeWidth={2} />
                    </div>
                  </div>
                  <p className={`text-center ${
                    aiSettings.recommendationType === 'mixed'
                      ? 'text-primary'
                      : 'text-foreground'
                  } font-semibold text-sm`}>
                    混合推薦
                  </p>
                  <p className="text-center text-muted-foreground text-xs">
                    平衡搭配
                  </p>
                </button>
              </div>
            </div>

            {/* Brand Blacklist */}
            <div className="rounded-xl bg-background p-3">
              <label className="mb-2 block text-foreground font-semibold">
                品牌黑名單
              </label>
              <p className="mb-3 text-muted-foreground text-sm">
                新增不想要推薦的品牌
              </p>
              <div className="mb-3 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={2} />
                  <Input
                    value={brandInput}
                    onChange={(e) => setBrandInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addBrand()}
                    placeholder="輸入品牌名稱..."
                    className="pl-9 bg-white border-border focus:border-primary"
                  />
                </div>
                <button
                  onClick={addBrand}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <Plus className="h-5 w-5" strokeWidth={2} />
                </button>
              </div>
              {aiSettings.brandBlacklist.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {aiSettings.brandBlacklist.map((brand) => (
                    <div
                      key={brand}
                      className="flex items-center gap-1.5 rounded-lg bg-white border border-border px-2.5 py-1.5"
                    >
                      <span className="text-foreground text-sm">
                        {brand}
                      </span>
                      <button
                        onClick={() => removeBrand(brand)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5" strokeWidth={2} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Favorite Stores */}
            <div className="rounded-xl bg-background p-3">
              <label className="mb-2 block text-foreground font-semibold">
                最愛店家
              </label>
              <p className="mb-3 text-muted-foreground text-sm">
                新增您常逛的店家，AI 會優先推薦
              </p>
              <div className="mb-3 flex gap-2">
                <div className="relative flex-1">
                  <ShoppingBag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={2} />
                  <Input
                    value={storeInput}
                    onChange={(e) => setStoreInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addStore()}
                    placeholder="輸入店家名稱..."
                    className="pl-9 bg-white border-border focus:border-primary"
                  />
                </div>
                <button
                  onClick={addStore}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground transition-colors hover:bg-accent/90"
                >
                  <Plus className="h-5 w-5" strokeWidth={2} />
                </button>
              </div>
              {aiSettings.favoriteStores.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {aiSettings.favoriteStores.map((store) => (
                    <div
                      key={store}
                      className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/20 px-2.5 py-1.5"
                    >
                      <Star className="h-3.5 w-3.5 text-accent" strokeWidth={2} fill="currentColor" />
                      <span className="text-foreground font-medium text-sm">
                        {store}
                      </span>
                      <button
                        onClick={() => removeStore(store)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5" strokeWidth={2} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.section>

        {onLogout && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="pt-2 pb-6"
          >
             <button 
               onClick={onLogout}
               className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-white border-2 border-muted/50 text-muted-foreground font-bold hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all shadow-sm"
             >
               <LogOut className="h-5 w-5" />
               <span>登出帳號</span>
             </button>
          </motion.div>
        )}
      </div>

      {/* 上傳選項對話框 */}
      <UploadOptionsDialog
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        onSelectCamera={handleCameraUpload}
        onSelectGallery={handleGalleryUpload}
      />

      {/* 隱藏的檔案選擇器 */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}