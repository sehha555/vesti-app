import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCw, Maximize2, User, Shirt, ChevronLeft, ChevronRight } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ClothingItem {
  id: number;
  name: string;
  imageUrl: string;
  category: string;
  brand?: string;
}

interface Layer {
  id: string;
  name: string;
  items: ClothingItem[];
  yOffset: number; // 衣架上的垂直位置
  zOffset: number; // 深度位置
}

interface VirtualHangerDisplayProps {
  layers: Array<{
    id: string;
    name: string;
    items: any[];
  }>;
  onExpand?: () => void;
}

export function VirtualHangerDisplay({ layers, onExpand }: VirtualHangerDisplayProps) {
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);

  // 將層級映射到 3D 衣架位置
  const hangerLayers: Layer[] = [
    { 
      id: 'outer', 
      name: '外層', 
      items: layers.find(l => l.id === 'outer')?.items || [],
      yOffset: 0,    // 最上方（外套）
      zOffset: 0,    // 最前面
    },
    { 
      id: 'inner', 
      name: '內層', 
      items: layers.find(l => l.id === 'inner')?.items || [],
      yOffset: 50,   // 中間偏上
      zOffset: 20,   // 稍微往後
    },
    { 
      id: 'bottom', 
      name: '下身', 
      items: layers.find(l => l.id === 'bottom')?.items || [],
      yOffset: 120,  // 中間偏下
      zOffset: 10,   // 中間深度
    },
    { 
      id: 'accessories', 
      name: '配件', 
      items: layers.find(l => l.id === 'accessories')?.items || [],
      yOffset: 200,  // 最下方
      zOffset: 15,   // 稍微往後
    },
  ];

  const totalItems = hangerLayers.reduce((sum, layer) => sum + layer.items.length, 0);

  // 拖曳旋轉控制
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - startX;
    setRotation(prev => prev + deltaX * 0.5);
    setStartX(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const deltaX = e.touches[0].clientX - startX;
    setRotation(prev => prev + deltaX * 0.5);
    setStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const rotateLeft = () => {
    setRotation(prev => prev - 45);
  };

  const rotateRight = () => {
    setRotation(prev => prev + 45);
  };

  return (
    <div className="relative w-full aspect-[4/5] bg-gradient-to-br from-[var(--vesti-light-bg)] to-white rounded-3xl overflow-hidden border-2 border-[var(--vesti-gray-light)] shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
      
      {/* 背景網格 - 增加深度感 */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `
          linear-gradient(to right, var(--vesti-gray-mid) 1px, transparent 1px),
          linear-gradient(to bottom, var(--vesti-gray-mid) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }} />

      {/* 頂部控制欄 */}
      <div className="absolute top-0 left-0 right-0 p-4 z-20 flex items-center justify-between">
        <div className="bg-white/90 backdrop-blur-md px-3 py-2 rounded-xl flex items-center gap-2 shadow-md border border-[var(--vesti-gray-light)]">
          <Shirt className="w-4 h-4 text-[var(--vesti-primary)]" />
          <span className="text-[var(--vesti-dark)]" style={{ fontSize: 'var(--text-label)', fontWeight: 600 }}>
            3D 虛擬衣架
          </span>
          <span className="text-[var(--vesti-text-secondary)]" style={{ fontSize: 'var(--text-label)' }}>
            {totalItems} 件
          </span>
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onExpand}
          className="w-10 h-10 rounded-xl bg-white/90 backdrop-blur-md flex items-center justify-center border border-[var(--vesti-gray-light)] text-[var(--vesti-dark)] hover:bg-[var(--vesti-primary)] hover:text-white transition-colors shadow-md"
        >
          <Maximize2 className="w-5 h-5" />
        </motion.button>
      </div>

      {/* 3D 衣架場景 */}
      <div 
        className="absolute inset-0 flex items-center justify-center"
        style={{ perspective: '1200px' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <motion.div
          animate={{ rotateY: rotation }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          style={{ 
            transformStyle: 'preserve-3d',
            width: '280px',
            height: '400px',
          }}
          className="relative"
        >
          {/* 衣架桿 */}
          <div 
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-3 rounded-full"
            style={{
              background: 'linear-gradient(135deg, #B8B8B8 0%, #E8E8E8 50%, #B8B8B8 100%)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15), inset 0 2px 4px rgba(255,255,255,0.5)',
              transform: 'translateZ(10px)',
            }}
          />
          
          {/* 衣架支撐架（左） */}
          <div 
            className="absolute top-0 left-[20px] w-2 h-32 rounded-full"
            style={{
              background: 'linear-gradient(90deg, #C0C0C0 0%, #E8E8E8 50%, #C0C0C0 100%)',
              boxShadow: '2px 4px 8px rgba(0,0,0,0.1)',
              transform: 'translateZ(5px) rotateZ(-10deg)',
              transformOrigin: 'top center',
            }}
          />
          
          {/* 衣架支撐架（右） */}
          <div 
            className="absolute top-0 right-[20px] w-2 h-32 rounded-full"
            style={{
              background: 'linear-gradient(90deg, #C0C0C0 0%, #E8E8E8 50%, #C0C0C0 100%)',
              boxShadow: '-2px 4px 8px rgba(0,0,0,0.1)',
              transform: 'translateZ(5px) rotateZ(10deg)',
              transformOrigin: 'top center',
            }}
          />

          {/* 衣物層級 */}
          {hangerLayers.map((layer, layerIndex) => (
            <div
              key={layer.id}
              className="absolute left-1/2 -translate-x-1/2"
              style={{
                top: `${layer.yOffset}px`,
                transform: `translateX(-50%) translateZ(${-layer.zOffset}px)`,
                transformStyle: 'preserve-3d',
              }}
            >
              {layer.items.length > 0 ? (
                <div className="flex gap-2">
                  {layer.items.map((item, itemIndex) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: itemIndex * 0.1 }}
                      className="relative group"
                      style={{
                        transform: `translateZ(${itemIndex * 5}px) rotateY(${itemIndex * 2}deg)`,
                        transformStyle: 'preserve-3d',
                      }}
                    >
                      {/* 衣架鉤 */}
                      <div 
                        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full w-1 h-4 rounded-full"
                        style={{
                          background: 'linear-gradient(180deg, #D0D0D0 0%, #A0A0A0 100%)',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        }}
                      />
                      
                      {/* 衣物卡片 */}
                      <div 
                        className="relative w-24 rounded-xl overflow-hidden bg-white border-2 border-[var(--vesti-gray-light)] shadow-[0_8px_24px_rgba(0,0,0,0.15)] group-hover:border-[var(--vesti-primary)] transition-all"
                        style={{
                          aspectRatio: '4/5',
                        }}
                      >
                        <ImageWithFallback
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                        
                        {/* 懸停資訊 */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                          <p 
                            className="text-white truncate"
                            style={{ fontSize: '10px', fontWeight: 600 }}
                          >
                            {item.brand}
                          </p>
                          <p 
                            className="text-white/80 truncate"
                            style={{ fontSize: '9px' }}
                          >
                            {item.name}
                          </p>
                        </div>
                      </div>

                      {/* 衣物陰影 */}
                      <div 
                        className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[90%] h-2 rounded-full blur-md"
                        style={{
                          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.2) 0%, transparent 70%)',
                        }}
                      />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div 
                  className="w-24 h-32 rounded-xl border-2 border-dashed border-[var(--vesti-gray-mid)]/30 bg-white/50 flex items-center justify-center"
                  style={{ aspectRatio: '4/5' }}
                >
                  <span 
                    className="text-[var(--vesti-gray-mid)]"
                    style={{ fontSize: '10px' }}
                  >
                    空
                  </span>
                </div>
              )}

              {/* 層級標籤 */}
              <div className="absolute -left-20 top-1/2 -translate-y-1/2">
                <div 
                  className="bg-white/80 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm border border-[var(--vesti-gray-light)]"
                  style={{
                    transform: 'rotateY(-20deg)',
                    transformStyle: 'preserve-3d',
                  }}
                >
                  <span 
                    className="text-[var(--vesti-text-secondary)] whitespace-nowrap"
                    style={{ fontSize: '10px', fontWeight: 500 }}
                  >
                    {layer.name}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* 空狀態 */}
          {totalItems === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Shirt className="w-16 h-16 text-[var(--vesti-gray-mid)]/30 mx-auto mb-3" />
                <p 
                  className="text-[var(--vesti-gray-mid)]"
                  style={{ fontSize: 'var(--text-base)' }}
                >
                  尚無衣物
                </p>
                <p 
                  className="text-[var(--vesti-text-secondary)] mt-1"
                  style={{ fontSize: 'var(--text-label)' }}
                >
                  從籃子或衣櫃選擇商品
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* 底部旋轉控制 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={rotateLeft}
          className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center border border-[var(--vesti-gray-light)] text-[var(--vesti-dark)] hover:bg-[var(--vesti-primary)] hover:text-white transition-colors shadow-md"
        >
          <ChevronLeft className="w-5 h-5" />
        </motion.button>

        <div className="bg-white/90 backdrop-blur-md px-3 py-2 rounded-full flex items-center gap-2 shadow-md border border-[var(--vesti-gray-light)]">
          <RotateCw className="w-4 h-4 text-[var(--vesti-primary)]" />
          <span 
            className="text-[var(--vesti-text-secondary)]"
            style={{ fontSize: 'var(--text-label)' }}
          >
            拖曳旋轉
          </span>
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={rotateRight}
          className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center border border-[var(--vesti-gray-light)] text-[var(--vesti-dark)] hover:bg-[var(--vesti-primary)] hover:text-white transition-colors shadow-md"
        >
          <ChevronRight className="w-5 h-5" />
        </motion.button>
      </div>

      {/* 拖曳游標提示 */}
      {isDragging && (
        <div className="absolute inset-0 cursor-grabbing" />
      )}
      {!isDragging && totalItems > 0 && (
        <div className="absolute inset-0 cursor-grab" />
      )}
    </div>
  );
}
