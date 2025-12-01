import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Upload, 
  Camera, 
  X, 
  Sparkles,
  Loader2,
  Check,
  Plus
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface UploadClothingPageProps {
  onBack: () => void;
  onSave?: (clothingData: ClothingData) => void;
  initialImageUrl?: string;
}

interface ClothingData {
  imageUrl: string;
  name: string;
  category: string;
  brand?: string;
  color?: string;
  material?: string;
  size?: string;
  price?: number;
  tags?: string[];
  source: 'user-upload';
}

const CATEGORIES = [
  '上衣',
  '外套',
  '褲子',
  '裙子',
  '洋裝',
  '鞋子',
  '配件',
  '包包',
  '其他',
];

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];

export function UploadClothingPage({ onBack, onSave, initialImageUrl }: UploadClothingPageProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(initialImageUrl || '');
  const [isAnalyzing, setIsAnalyzing] = useState(!!initialImageUrl);
  const [isAiSuggested, setIsAiSuggested] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tagInput, setTagInput] = useState('');

  // 表單資料
  const [formData, setFormData] = useState<ClothingData>({
    imageUrl: initialImageUrl || '',
    name: '',
    category: '',
    brand: '',
    color: '',
    material: '',
    size: '',
    price: undefined,
    tags: [],
    source: 'user-upload',
  });

  // 如果有初始圖片，自動觸發 AI 分析
  useEffect(() => {
    if (initialImageUrl && !isAiSuggested) {
      analyzeImage();
    }
  }, [initialImageUrl]);

  // 模擬 AI 分析
  const analyzeImage = async () => {
    setIsAnalyzing(true);
    
    // 模擬 API 呼叫延遲
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 模擬 AI 預測結果
    const aiPrediction = {
      name: '棉質條紋 T-shirt',
      category: '上衣',
      brand: 'Uniqlo',
      color: 'blue',
      material: '100% 純棉',
      size: 'M',
      tags: ['休閒', '條紋', '基本款', '夏季'],
    };

    setFormData(prev => ({
      ...prev,
      ...aiPrediction,
    }));
    
    setIsAnalyzing(false);
    setIsAiSuggested(true);
    toast.success('AI 已完成分析！你可以修改任何內容', {
      icon: <Sparkles className="h-4 w-4" />,
    });
  };

  // 處理圖片上傳
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('圖片大小不能超過 10MB');
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setFormData(prev => ({ ...prev, imageUrl: result }));
        
        // 自動開始 AI 分析
        analyzeImage();
      };
      reader.readAsDataURL(file);
    }
  };

  // 移除圖片
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    setFormData(prev => ({ ...prev, imageUrl: '' }));
    setIsAiSuggested(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 新增標籤
  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  // 移除標籤
  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(t => t !== tag) || [],
    }));
  };

  // 儲存
  const handleSave = () => {
    if (!formData.imageUrl) {
      toast.error('請先上傳圖片');
      return;
    }
    if (!formData.name) {
      toast.error('請輸入衣物名稱');
      return;
    }
    if (!formData.category) {
      toast.error('請選擇類別');
      return;
    }

    onSave?.(formData);
    toast.success('成功新增衣物到衣櫃！', {
      icon: <Check className="h-4 w-4" />,
    });
    onBack();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--vesti-background)]">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur-sm"
      >
        <div className="flex h-16 items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onBack}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--vesti-secondary)] transition-colors hover:bg-[var(--vesti-primary)] hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={2} />
            </motion.button>
            <h1 className="text-[var(--vesti-dark)]">上傳衣物</h1>
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            disabled={!formData.imageUrl || !formData.name || !formData.category}
            className="rounded-xl bg-[var(--vesti-primary)] px-5 py-2 text-white transition-all hover:bg-[var(--vesti-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontWeight: 600 }}
          >
            儲存
          </motion.button>
        </div>
      </motion.header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-40">
        <div className="mx-auto max-w-2xl px-5 pt-6">
          {/* 圖片上傳區 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, delay: 0.05 }}
            className="mb-6"
          >
            <Label className="mb-3 block">
              衣物照片 <span className="text-[var(--vesti-accent)]">*</span>
            </Label>

            {!imagePreview ? (
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => fileInputRef.current?.click()}
                className="relative flex h-[280px] cursor-pointer flex-col items-center justify-center gap-4 rounded-[24px] border-2 border-dashed border-[var(--vesti-gray-mid)]/40 bg-[var(--vesti-secondary)]/30 transition-all hover:border-[var(--vesti-primary)] hover:bg-[var(--vesti-secondary)]"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--vesti-primary)]/10">
                  <Camera className="h-8 w-8 text-[var(--vesti-primary)]" strokeWidth={2} />
                </div>
                <div className="text-center">
                  <p className="mb-1 text-[var(--vesti-dark)]" style={{ fontWeight: 600 }}>
                    點擊上傳照片
                  </p>
                  <p className="text-sm text-[var(--vesti-gray-mid)]" style={{ fontWeight: 400 }}>
                    支援 JPG、PNG 格式，最大 10MB
                  </p>
                </div>
                <Badge className="bg-[var(--vesti-primary)] text-white">
                  <Sparkles className="mr-1 h-3 w-3" />
                  AI 自動辨識
                </Badge>
              </motion.div>
            ) : (
              <div className="relative">
                <div className="relative h-[280px] overflow-hidden rounded-[24px] bg-[var(--vesti-secondary)]">
                  <ImageWithFallback
                    src={imagePreview}
                    alt="上傳預覽"
                    className="h-full w-full object-cover"
                  />

                  {/* AI 分析中遮罩 */}
                  <AnimatePresence>
                    {isAnalyzing && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 backdrop-blur-sm"
                      >
                        <Loader2 className="h-10 w-10 animate-spin text-white" strokeWidth={2} />
                        <p className="text-white" style={{ fontWeight: 600 }}>
                          AI 正在分析中...
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* 移除按鈕 */}
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleRemoveImage}
                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-lg transition-colors hover:bg-white"
                  >
                    <X className="h-5 w-5 text-[var(--vesti-dark)]" strokeWidth={2.5} />
                  </motion.button>

                  {/* AI 標籤 */}
                  {isAiSuggested && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute left-3 top-3"
                    >
                      <Badge className="bg-[var(--vesti-primary)] text-white shadow-lg">
                        <Sparkles className="mr-1 h-3 w-3" />
                        AI 已辨識
                      </Badge>
                    </motion.div>
                  )}
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              onChange={handleImageChange}
              className="hidden"
            />
          </motion.div>

          {/* 表單區域 */}
          <AnimatePresence>
            {imagePreview && !isAnalyzing && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.15 }}
                className="space-y-5"
              >
                {/* 名稱 */}
                <div>
                  <Label htmlFor="name" className="mb-2 block">
                    衣物名稱 <span className="text-[var(--vesti-accent)]">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="例如：白色棉質 T-shirt"
                    className="h-12"
                  />
                </div>

                {/* 類別 */}
                <div>
                  <Label htmlFor="category" className="mb-2 block">
                    類別 <span className="text-[var(--vesti-accent)]">*</span>
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="選擇類別" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 品牌 */}
                <div>
                  <Label htmlFor="brand" className="mb-2 block">
                    品牌
                  </Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                    placeholder="例如：Uniqlo、Zara"
                    className="h-12"
                  />
                </div>

                {/* 尺寸 */}
                <div>
                  <Label className="mb-2 block">尺寸</Label>
                  <div className="flex flex-wrap gap-2">
                    {SIZES.map((size) => (
                      <motion.button
                        key={size}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setFormData(prev => ({ ...prev, size }))}
                        className={`rounded-xl border-2 px-4 py-2 transition-all ${
                          formData.size === size
                            ? 'border-[var(--vesti-primary)] bg-[var(--vesti-primary)] text-white'
                            : 'border-border bg-card hover:border-[var(--vesti-primary)]/50'
                        }`}
                        style={{ fontWeight: 500 }}
                      >
                        {size}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* 材質 */}
                <div>
                  <Label htmlFor="material" className="mb-2 block">
                    材質
                  </Label>
                  <Input
                    id="material"
                    value={formData.material}
                    onChange={(e) => setFormData(prev => ({ ...prev, material: e.target.value }))}
                    placeholder="例如：100% 純棉、聚酯纖維"
                    className="h-12"
                  />
                </div>

                {/* 購買價格 */}
                <div>
                  <Label htmlFor="price" className="mb-2 block">
                    購買價格
                  </Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--vesti-gray-mid)]">
                      NT$
                    </span>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        price: e.target.value ? parseFloat(e.target.value) : undefined 
                      }))}
                      placeholder="0"
                      className="h-12 pl-14"
                    />
                  </div>
                </div>

                {/* 標籤 */}
                <div>
                  <Label htmlFor="tags" className="mb-2 block">
                    標籤
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="tags"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      placeholder="輸入標籤後按 Enter"
                      className="h-12 flex-1"
                    />
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleAddTag}
                      className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--vesti-primary)] text-white transition-colors hover:bg-[var(--vesti-primary)]/90"
                    >
                      <Plus className="h-5 w-5" strokeWidth={2} />
                    </motion.button>
                  </div>

                  {/* 標籤列表 */}
                  {formData.tags && formData.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="flex items-center gap-1.5 rounded-full bg-[var(--vesti-secondary)] pl-3.5 pr-2 py-1.5"
                        >
                          <span className="text-xs text-[var(--vesti-dark)]" style={{ fontWeight: 500 }}>
                            {tag}
                          </span>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleRemoveTag(tag)}
                            className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-[var(--vesti-gray-mid)]/20"
                          >
                            <X className="h-3 w-3" strokeWidth={2} />
                          </motion.button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* AI 提示 */}
                {isAiSuggested && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-[var(--vesti-primary)]/30 bg-[var(--vesti-primary)]/5 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--vesti-primary)]/10">
                        <Sparkles className="h-4 w-4 text-[var(--vesti-primary)]" />
                      </div>
                      <div>
                        <p className="mb-1 text-sm" style={{ fontWeight: 600 }}>
                          AI 智能建議
                        </p>
                        <p className="text-xs text-[var(--vesti-gray-mid)]" style={{ fontWeight: 400 }}>
                          以上資訊由 AI 自動識別，你可以自由修改任何內容以確保準確性
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
