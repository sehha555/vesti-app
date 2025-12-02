import { useState, useEffect, useRef } from 'react'; // ✨ 新增 useEffect, useRef
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { motion } from 'motion/react';
import { DroppableClothingRow } from './DroppableClothingRow';
import { CreateLayerDialog } from './CreateLayerDialog';
import { ClothingDetailModal } from './ClothingDetailModal';
import { UploadOptionsDialog } from './UploadOptionsDialog';
import { BatchUploadDialog } from './BatchUploadDialog'; // ✨ 批次上傳 Dialog
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import type { WardrobeItem } from '@/packages/types/src/wardrobe'; // ✨ 匯入後端型別

// 🔐 真實的 Supabase 使用者 UUID
// TODO: 未來改成從認證系統 (如 Supabase Auth) 取得 userId
const REAL_USER_ID = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";

interface ClothingItem {
  id: number;
  imageUrl: string;
  name: string;
  category: string;
  brand?: string;
  source: 'app-purchase' | 'user-upload' | 'saved' | 'merchant';
  isPurchased?: boolean;
  price?: number;
  material?: string;
  size?: string;
  wearCount?: number;
  uploadDate?: string;
  lastWornDate?: string;
  tags?: string[];
}

interface Layer {
  id: string;
  name: string;
  items: ClothingItem[];
}

const initialLayers: Layer[] = [
  {
    id: 'layer-1',
    name: '上衣',
    items: [
      { 
        id: 1, 
        imageUrl: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=400', 
        name: '白色 T-shirt', 
        category: '上衣',
        brand: 'UNIQLO',
        source: 'user-upload',
        size: 'M',
        material: '100% 棉',
        wearCount: 12,
        uploadDate: '2024-09-15',
        lastWornDate: '2025-11-01',
        tags: ['休閒', '基本款'],
      },
      { 
        id: 2, 
        imageUrl: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400', 
        name: '藍色襯衫', 
        category: '上衣',
        brand: 'ZARA',
        source: 'app-purchase',
        isPurchased: true,
        price: 890,
        size: 'L',
        material: '65% 棉, 35% 聚酯纖維',
        wearCount: 8,
        uploadDate: '2024-10-20',
        lastWornDate: '2025-10-28',
        tags: ['正式', '商務'],
      },
      { 
        id: 3, 
        imageUrl: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400', 
        name: '黑色針織衫', 
        category: '上衣',
        brand: 'H&M',
        source: 'saved',
        size: 'M',
        material: '80% 羊毛, 20% 尼龍',
        wearCount: 5,
        uploadDate: '2024-11-01',
        lastWornDate: '2025-11-05',
        tags: ['保暖', '秋冬'],
      },
      { 
        id: 4, 
        imageUrl: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400', 
        name: '條紋上衣', 
        category: '上衣',
        brand: 'GAP',
        source: 'merchant',
        size: 'S',
        material: '95% 棉, 5% 彈性纖維',
        wearCount: 15,
        uploadDate: '2024-08-10',
        lastWornDate: '2025-11-03',
        tags: ['休閒', '條紋'],
      },
    ],
  },
  {
    id: 'layer-2',
    name: '下身',
    items: [
      { 
        id: 11, 
        imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400', 
        name: '牛仔褲', 
        category: '下身',
        brand: "LEVI'S",
        source: 'app-purchase',
        isPurchased: false,
        price: 1580,
        size: '32',
        material: '98% 棉, 2% 彈性纖維',
        wearCount: 0,
        uploadDate: '2025-11-06',
        tags: ['牛仔', '經典'],
      },
      { 
        id: 12, 
        imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400', 
        name: '卡其褲', 
        category: '下身',
        brand: 'MUJI',
        source: 'user-upload',
        size: '30',
        material: '100% 棉',
        wearCount: 20,
        uploadDate: '2024-07-15',
        lastWornDate: '2025-11-02',
        tags: ['休閒', '百搭'],
      },
      { 
        id: 13, 
        imageUrl: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=400', 
        name: '黑色長褲', 
        category: '下身',
        brand: 'UNIQLO',
        source: 'user-upload',
        size: '31',
        material: '70% 聚酯纖維, 30% 人造纖維',
        wearCount: 18,
        uploadDate: '2024-09-01',
        lastWornDate: '2025-11-04',
        tags: ['正式', '西裝褲'],
      },
    ],
  },
  {
    id: 'layer-3',
    name: '外套',
    items: [
      { 
        id: 21, 
        imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400', 
        name: '牛仔外套', 
        category: '外套',
        brand: "LEVI'S",
        source: 'app-purchase',
        isPurchased: true,
        price: 2390,
        size: 'M',
        material: '100% 棉',
        wearCount: 10,
        uploadDate: '2024-10-01',
        lastWornDate: '2025-10-30',
        tags: ['牛仔', '休閒'],
      },
      { 
        id: 22, 
        imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400', 
        name: '米色運動外套', 
        category: '外套',
        brand: 'ADIDAS',
        source: 'app-purchase',
        isPurchased: true,
        price: 780,
        size: 'M',
        material: '87% 尼龍, 13% 彈性纖維',
        wearCount: 15,
        uploadDate: '2024-08-01',
        lastWornDate: '2025-11-04',
        tags: ['Sporty', '運動', '毒軟'],
      },
    ],
  },
  {
    id: 'layer-4',
    name: '鞋子',
    items: [
      { 
        id: 31, 
        imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400', 
        name: '白色球鞋', 
        category: '鞋子',
        brand: 'NIKE',
        source: 'merchant',
        size: 'US 9',
        material: '合成皮革',
        wearCount: 25,
        uploadDate: '2024-06-10',
        lastWornDate: '2025-11-06',
        tags: ['運動', '百搭'],
      },
      { 
        id: 32, 
        imageUrl: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400', 
        name: '黑色靴子', 
        category: '鞋子',
        brand: 'Dr. Martens',
        source: 'user-upload',
        size: 'UK 8',
        material: '真皮',
        wearCount: 7,
        uploadDate: '2024-10-15',
        lastWornDate: '2025-11-01',
        tags: ['正式', '皮革'],
      },
    ],
  },
];

type ViewMode = 'items' | 'outfits';

interface WardrobePageProps {
  onNavigateToUpload?: (imageUrl?: string) => void;
}

export function WardrobePage({ onNavigateToUpload }: WardrobePageProps = {} as WardrobePageProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('items');
  const [layers, setLayers] = useState<Layer[]>(initialLayers);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLayer, setEditingLayer] = useState<{ id: string; name: string } | null>(null);
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  // ✨ 批次上傳相關狀態
  const [isBatchUploadDialogOpen, setIsBatchUploadDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ✨ 新增 API 相關狀態
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✨ 轉換後端 WardrobeItem 到前端 Layer 結構
  const convertWardrobeItemsToLayers = (items: WardrobeItem[]): Layer[] => {
    const layerMap: Record<string, { name: string; items: ClothingItem[] }> = {
      top: { name: '上衣', items: [] },
      bottom: { name: '下身', items: [] },
      outerwear: { name: '外套', items: [] },
      shoes: { name: '鞋子', items: [] },
      accessory: { name: '配件', items: [] },
    };

    items.forEach((item) => {
      const type = item.type;
      if (layerMap[type]) {
        layerMap[type].items.push({
          id: parseInt(item.id) || Math.random(), // 轉換 string id 為 number
          imageUrl: item.imageUrl,
          name: item.name,
          category: type,
          source: item.source === 'shop' ? 'merchant' : 'user-upload',
          isPurchased: item.purchased,
          material: item.material,
          tags: item.customTags,
        });
      }
    });

    return Object.entries(layerMap)
      .filter(([_, layer]) => layer.items.length > 0) // 只保留有衣物的層
      .map(([key, layer], index) => ({
        id: `layer-${key}`,
        name: layer.name,
        items: layer.items,
      }));
  };

  // ✨ 載入衣櫃資料
  const fetchWardrobeItems = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/wardrobe/items?userId=${REAL_USER_ID}`);

      if (!response.ok) {
        throw new Error(`API 錯誤: ${response.status}`);
      }

      const data: WardrobeItem[] = await response.json();

      // 將後端資料轉換成 Layer 結構
      const convertedLayers = convertWardrobeItemsToLayers(data);

      // 如果後端有資料就用後端的，沒有就保留 mock data
      if (convertedLayers.length > 0) {
        setLayers(convertedLayers);
      }

    } catch (err) {
      console.error('載入衣櫃失敗:', err);
      setError(err instanceof Error ? err.message : '載入失敗');
      // 發生錯誤時保留 mock data，讓使用者仍可看到畫面
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWardrobeItems();
  }, []); // 元件載入時執行一次

  const handleLike = (id: number) => {
    toast.success('已加入最愛 ❤️');
  };

  const handleItemClick = (id: number) => {
    // 從所有層中找到對應的衣物
    for (const layer of layers) {
      const item = layer.items.find(i => i.id === id);
      if (item) {
        setSelectedItem(item);
        setIsDetailModalOpen(true);
        break;
      }
    }
  };

  const handleDeleteItem = (id: number) => {
    setLayers(prev => 
      prev.map(layer => ({
        ...layer,
        items: layer.items.filter(item => item.id !== id),
      }))
    );
    toast('已移除衣物');
  };

  const handleDrop = (item: ClothingItem & { sourceLayerId: string }, targetLayerId: string) => {
    setLayers(prev => {
      // 從來源層移除
      const newLayers = prev.map(layer => {
        if (layer.id === item.sourceLayerId) {
          return {
            ...layer,
            items: layer.items.filter(i => i.id !== item.id),
          };
        }
        return layer;
      });

      // 添加到目標層
      return newLayers.map(layer => {
        if (layer.id === targetLayerId) {
          return {
            ...layer,
            items: [...layer.items, { id: item.id, imageUrl: item.imageUrl, name: item.name, category: item.category }],
          };
        }
        return layer;
      });
    });

    toast.success('已移動衣物');
  };

  const handleCreateLayer = (layerName: string) => {
    if (editingLayer) {
      // 編輯現有層
      setLayers(prev =>
        prev.map(layer =>
          layer.id === editingLayer.id ? { ...layer, name: layerName } : layer
        )
      );
      toast.success('已更新層名稱');
      setEditingLayer(null);
    } else {
      // 創建新層
      const newLayer: Layer = {
        id: `layer-${Date.now()}`,
        name: layerName,
        items: [],
      };
      setLayers(prev => [...prev, newLayer]);
      toast.success('已創建新層 ✨');
    }
  };

  const handleEditLayer = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (layer) {
      setEditingLayer({ id: layer.id, name: layer.name });
      setIsDialogOpen(true);
    }
  };

  const handleDeleteLayer = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (layer && layer.items.length > 0) {
      toast.error('請先清空此層的衣物');
      return;
    }
    setLayers(prev => prev.filter(l => l.id !== layerId));
    toast('已移除層');
  };

  const handleEditItem = () => {
    toast('編輯功能開發中...');
    setIsDetailModalOpen(false);
  };

  const handleCreateOutfit = () => {
    toast.success('已加入穿搭組合 ✨');
    setIsDetailModalOpen(false);
  };

  const handleShareItem = () => {
    toast.success('已複製分享連結 🔗');
    setIsDetailModalOpen(false);
  };

  const handleUploadClick = () => {
    setIsUploadDialogOpen(true);
  };

  const handleCameraUpload = () => {
    setIsUploadDialogOpen(false);
    // 模擬相機上傳
    toast.success('開啟相機中...');
    setTimeout(() => {
      onNavigateToUpload?.();
    }, 300);
  };

  // ✨ 處理檔案選擇
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // 轉換 FileList 為 Array
    const fileArray = Array.from(files);

    // 過濾：只接受圖片，且小於 10MB
    const validFiles = fileArray.filter((file) => {
      const isImage = file.type.startsWith('image/');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB

      if (!isImage) {
        toast.error(`${file.name} 不是圖片檔案`);
        return false;
      }
      if (!isValidSize) {
        toast.error(`${file.name} 超過 10MB 限制`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) {
      toast.error('沒有選擇有效的圖片');
      return;
    }

    // 設定選擇的檔案並打開批次上傳 Dialog
    setSelectedFiles(validFiles);
    setIsBatchUploadDialogOpen(true);

    // 清空 input，讓下次選擇相同檔案也能觸發 onChange
    event.target.value = '';
  };

  const handleGalleryUpload = () => {
    setIsUploadDialogOpen(false);
    // ✨ 觸發隱藏的 file input
    fileInputRef.current?.click();
  };

  // ✨ 批次上傳完成後的回調
  const handleBatchUploadComplete = async () => {
    // 重新載入衣櫃列表
    await fetchWardrobeItems();
    toast.success('衣櫃已更新 ✨');
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-[var(--vesti-background)] pb-20">
        {/* ✨ 隱藏的 file input（支援多選） */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Header */}
        <div className="sticky top-0 z-30 bg-[var(--vesti-background)]/95 backdrop-blur-sm">
          <div className="flex h-16 items-center px-5">
            <h1 className="tracking-widest text-[var(--vesti-primary)]">衣櫃</h1>
          </div>

          {/* 視圖模式切換 */}
          <div className="mb-4 flex gap-3 px-5">
            <motion.button
              onClick={() => setViewMode('items')}
              whileTap={{ scale: 0.95 }}
              className={`flex flex-1 items-center justify-center rounded-xl border-2 py-2.5 transition-all ${
                viewMode === 'items'
                  ? 'border-[var(--vesti-primary)] bg-[var(--vesti-primary)] text-white shadow-md'
                  : 'border-border bg-card text-[var(--vesti-gray-mid)] hover:border-[var(--vesti-primary)]/30'
              }`}
            >
              <span style={{ fontWeight: viewMode === 'items' ? 600 : 400 }}>
                單品衣櫃
              </span>
            </motion.button>

            <motion.button
              onClick={() => setViewMode('outfits')}
              whileTap={{ scale: 0.95 }}
              className={`flex flex-1 items-center justify-center rounded-xl border-2 py-2.5 transition-all ${
                viewMode === 'outfits'
                  ? 'border-[var(--vesti-primary)] bg-[var(--vesti-primary)] text-white shadow-md'
                  : 'border-border bg-card text-[var(--vesti-gray-mid)] hover:border-[var(--vesti-primary)]/30'
              }`}
            >
              <span style={{ fontWeight: viewMode === 'outfits' ? 600 : 400 }}>
                整套搭配
              </span>
            </motion.button>
          </div>
        </div>

        {/* 內容區域 */}
        <motion.div
          key={viewMode}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="px-0 pt-4"
        >
          {/* ✨ Loading 狀態 */}
          {isLoading && (
            <div className="flex min-h-[60vh] items-center justify-center px-5">
              <div className="text-center">
                <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[var(--vesti-secondary)] border-t-[var(--vesti-primary)] mx-auto" />
                <p className="text-sm text-[var(--vesti-gray-mid)]">載入衣櫃中...</p>
              </div>
            </div>
          )}

          {/* ✨ Error 狀態 */}
          {!isLoading && error && (
            <div className="mx-5 rounded-xl bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-600">⚠️ {error}</p>
              <p className="text-xs text-red-500 mt-1">將顯示範例資料</p>
            </div>
          )}

          {/* ✨ 正常內容（只在非 loading 時顯示） */}
          {!isLoading && viewMode === 'items' ? (
            <>
              {/* 衣櫃層列表 */}
              {layers.map((layer) => (
                <DroppableClothingRow
                  key={layer.id}
                  layerId={layer.id}
                  title={layer.name}
                  items={layer.items}
                  onLike={handleLike}
                  onDelete={handleDeleteItem}
                  onDrop={handleDrop}
                  onEditLayer={handleEditLayer}
                  onDeleteLayer={handleDeleteLayer}
                  onItemClick={handleItemClick}
                  onUpload={handleUploadClick}
                />
              ))}

              {/* 添加新層按鈕 */}
              <div className="px-5">
                <motion.button
                  onClick={() => {
                    setEditingLayer(null);
                    setIsDialogOpen(true);
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--vesti-gray-mid)] bg-[var(--vesti-secondary)]/50 py-4 text-[var(--vesti-gray-mid)] transition-all hover:border-[var(--vesti-primary)] hover:text-[var(--vesti-primary)]"
                >
                  <Plus className="h-5 w-5" strokeWidth={2} />
                  <span style={{ fontWeight: 400 }}>新增衣櫃層</span>
                </motion.button>
              </div>
            </>
          ) : null}

          {/* ✨ 整套搭配模式（只在非 loading 時顯示） */}
          {!isLoading && viewMode === 'outfits' && (
            <div className="flex min-h-[60vh] items-center justify-center px-5">
              <div className="text-center">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--vesti-secondary)] mx-auto">
                  <Plus className="h-10 w-10 text-[var(--vesti-gray-mid)]" strokeWidth={1.5} />
                </div>
                <h3 className="mb-2 text-[var(--vesti-dark)]">整套搭配功能</h3>
                <p className="text-sm text-[var(--vesti-gray-mid)]" style={{ fontWeight: 400 }}>
                  從單品衣櫃中選擇搭配，創建您的完整造型
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* 創建/編輯層對話框 */}
        <CreateLayerDialog
          isOpen={isDialogOpen}
          onClose={() => {
            setIsDialogOpen(false);
            setEditingLayer(null);
          }}
          onConfirm={handleCreateLayer}
          editingLayer={editingLayer}
        />

        {/* 衣物詳細資訊彈窗 */}
        {selectedItem && (
          <ClothingDetailModal
            isOpen={isDetailModalOpen}
            onClose={() => setIsDetailModalOpen(false)}
            item={selectedItem}
            onEdit={handleEditItem}
            onCreateOutfit={handleCreateOutfit}
            onShare={handleShareItem}
          />
        )}

        {/* 上傳選項對話框 */}
        <UploadOptionsDialog
          isOpen={isUploadDialogOpen}
          onClose={() => setIsUploadDialogOpen(false)}
          onSelectCamera={handleCameraUpload}
          onSelectGallery={handleGalleryUpload}
        />

        {/* ✨ 批次上傳設定對話框 */}
        <BatchUploadDialog
          isOpen={isBatchUploadDialogOpen}
          files={selectedFiles}
          onClose={() => {
            setIsBatchUploadDialogOpen(false);
            setSelectedFiles([]);
          }}
          onComplete={handleBatchUploadComplete}
        />
      </div>
    </DndProvider>
  );
}
