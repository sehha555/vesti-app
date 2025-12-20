import { useState } from 'react';
import { Button } from './ui/Button';
import { Heart, ShoppingCart, Send, Download, Trash2, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

/**
 * Button 元件示範頁面
 * 展示不同的按鈕樣式、尺寸和互動效果
 */
export function ButtonShowcase() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLoadingDemo = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[var(--vesti-background)] p-6 pb-32">
      <h1 className="mb-2 text-[var(--vesti-dark)]">按鈕元件示範</h1>
      <p className="mb-8 text-[var(--vesti-gray-mid)]" style={{ fontSize: 'var(--text-label)' }}>
        展示不同的按鈕樣式、尺寸和觸覺回饋效果
      </p>

      {/* 變體 */}
      <section className="mb-8">
        <h2 className="mb-4 text-[var(--vesti-dark)]" style={{ fontWeight: 600 }}>
          按鈕變體
        </h2>
        <div className="space-y-3">
          <Button variant="primary" fullWidth>
            Primary 主要按鈕
          </Button>
          <Button variant="secondary" fullWidth>
            Secondary 次要按鈕
          </Button>
          <Button variant="outline" fullWidth>
            Outline 外框按鈕
          </Button>
          <Button variant="ghost" fullWidth>
            Ghost 幽靈按鈕
          </Button>
          <Button variant="danger" fullWidth>
            Danger 危險按鈕
          </Button>
        </div>
      </section>

      {/* 尺寸 */}
      <section className="mb-8">
        <h2 className="mb-4 text-[var(--vesti-dark)]" style={{ fontWeight: 600 }}>
          按鈕尺寸
        </h2>
        <div className="space-y-3">
          <Button size="sm" fullWidth>
            Small 小按鈕
          </Button>
          <Button size="md" fullWidth>
            Medium 中按鈕
          </Button>
          <Button size="lg" fullWidth>
            Large 大按鈕
          </Button>
        </div>
      </section>

      {/* 帶圖示 */}
      <section className="mb-8">
        <h2 className="mb-4 text-[var(--vesti-dark)]" style={{ fontWeight: 600 }}>
          帶圖示的按鈕
        </h2>
        <div className="space-y-3">
          <Button 
            variant="primary" 
            fullWidth 
            leftIcon={<Heart className="h-5 w-5" />}
            hapticStrength="medium"
          >
            加入最愛
          </Button>
          <Button 
            variant="primary" 
            fullWidth 
            rightIcon={<ShoppingCart className="h-5 w-5" />}
            hapticStrength="medium"
          >
            加入購物車
          </Button>
          <Button 
            variant="outline" 
            fullWidth 
            leftIcon={<Send className="h-5 w-5" />}
            rightIcon={<Sparkles className="h-5 w-5" />}
            hapticStrength="light"
          >
            分享穿搭
          </Button>
        </div>
      </section>

      {/* 特殊狀態 */}
      <section className="mb-8">
        <h2 className="mb-4 text-[var(--vesti-dark)]" style={{ fontWeight: 600 }}>
          特殊狀態
        </h2>
        <div className="space-y-3">
          <Button 
            variant="primary" 
            fullWidth 
            isLoading={isLoading}
            onClick={handleLoadingDemo}
          >
            {isLoading ? '處理中...' : '點擊測試載入'}
          </Button>
          <Button variant="primary" fullWidth disabled>
            已停用按鈕
          </Button>
        </div>
      </section>

      {/* 觸覺回饋強度 */}
      <section className="mb-8">
        <h2 className="mb-4 text-[var(--vesti-dark)]" style={{ fontWeight: 600 }}>
          觸覺回饋強度
        </h2>
        <p className="mb-4 text-[var(--vesti-gray-mid)]" style={{ fontSize: 'var(--text-label)' }}>
          點擊感受不同的震動強度
        </p>
        <div className="space-y-3">
          <Button variant="outline" fullWidth hapticStrength="light">
            Light 輕微震動
          </Button>
          <Button variant="outline" fullWidth hapticStrength="medium">
            Medium 中等震動
          </Button>
          <Button variant="outline" fullWidth hapticStrength="heavy">
            Heavy 強烈震動
          </Button>
          <Button variant="primary" fullWidth hapticStrength="success">
            Success 成功震動
          </Button>
          <Button variant="danger" fullWidth hapticStrength="error">
            Error 錯誤震動
          </Button>
        </div>
      </section>

      {/* 無漣漪效果 */}
      <section className="mb-8">
        <h2 className="mb-4 text-[var(--vesti-dark)]" style={{ fontWeight: 600 }}>
          漣漪效果控制
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="primary" enableRipple={true}>
            有漣漪
          </Button>
          <Button variant="primary" enableRipple={false}>
            無漣漪
          </Button>
        </div>
      </section>

      {/* 組合按鈕 */}
      <section>
        <h2 className="mb-4 text-[var(--vesti-dark)]" style={{ fontWeight: 600 }}>
          按鈕組合
        </h2>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            fullWidth 
            leftIcon={<Download className="h-5 w-5" />}
          >
            下載
          </Button>
          <Button 
            variant="danger" 
            leftIcon={<Trash2 className="h-5 w-5" />}
            hapticStrength="error"
          >
            刪除
          </Button>
        </div>
      </section>
    </div>
  );
}
