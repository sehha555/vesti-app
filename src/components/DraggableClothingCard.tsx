import { useRef, useState } from 'react';
import { useDrag } from 'react-dnd';
import { motion, useMotionValue, useSpring } from 'motion/react';
import { ClothingCard } from './ClothingCard';

interface ClothingItem {
  id: number;
  imageUrl: string;
  name: string;
  category: string;
}

interface DraggableClothingCardProps {
  item: ClothingItem;
  layerId: string;
  scrollVelocity: number;
  onLike?: (id: number) => void;
  onDelete?: (id: number) => void;
  onClick?: (id: number) => void;
}

export function DraggableClothingCard({ item, layerId, scrollVelocity, onLike, onDelete, onClick }: DraggableClothingCardProps) {
  const [isLongPressed, setIsLongPressed] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'CLOTHING_ITEM',
    item: { ...item, sourceLayerId: layerId },
    canDrag: isLongPressed,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: () => setIsLongPressed(false),
  }), [isLongPressed, item, layerId]);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    startPos.current = { x: touch.clientX, y: touch.clientY };
    
    timeoutRef.current = setTimeout(() => {
      setIsLongPressed(true);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 500);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!timeoutRef.current) return;
    const touch = e.touches[0];
    const moveX = Math.abs(touch.clientX - startPos.current.x);
    const moveY = Math.abs(touch.clientY - startPos.current.y);
    
    if (moveX > 10 || moveY > 10) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  };

  const handleTouchEnd = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    startPos.current = { x: e.clientX, y: e.clientY };
    timeoutRef.current = setTimeout(() => {
      setIsLongPressed(true);
    }, 500);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!timeoutRef.current) return;
    const moveX = Math.abs(e.clientX - startPos.current.x);
    const moveY = Math.abs(e.clientY - startPos.current.y);
    
    if (moveX > 10 || moveY > 10) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  };

  const handleMouseUp = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // 根據滑動速度計算搖擺角度
  const rotateY = useMotionValue(0);
  const rotateX = useMotionValue(0);
  
  // 使用彈簧動畫使搖擺更自然
  const springRotateY = useSpring(rotateY, {
    stiffness: 100,
    damping: 15,
    mass: 0.5,
  });
  
  const springRotateX = useSpring(rotateX, {
    stiffness: 100,
    damping: 15,
    mass: 0.5,
  });

  // 根據滑動速度更新旋轉角度
  // 滑動速度越大，搖擺幅度越大
  const targetRotateY = -15 + (scrollVelocity * 0.8); // 基礎傾斜 -15deg 加上動態搖擺
  const targetRotateX = 3 + Math.abs(scrollVelocity * 0.2); // 輕微的 X 軸旋轉
  
  rotateY.set(targetRotateY);
  rotateX.set(targetRotateX);

  // Animation for long press state
  const scale = isLongPressed && !isDragging ? 1.05 : 1;

  return (
    <div
      ref={drag}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: isLongPressed ? 'grab' : 'default',
        touchAction: 'pan-x', // Allow horizontal scrolling
      }}
    >
      <motion.div
        animate={{ scale }}
        style={{
          rotateY: springRotateY,
          rotateX: springRotateX,
          transformStyle: 'preserve-3d',
        }}
      >
        <ClothingCard
          id={item.id}
          imageUrl={item.imageUrl}
          name={item.name}
          category={item.category}
          onLike={onLike}
          onDelete={onDelete}
          onClick={(id) => {
            if (!isLongPressed) {
              onClick?.(id);
            }
          }}
        />
      </motion.div>
    </div>
  );
}
