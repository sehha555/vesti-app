
import React, { useEffect, useState } from 'react';
import { DailyOutfitResponse } from '@/packages/types/src/daily';
import { SaveDailyOutfitRequest } from '@/packages/types/src/persistence';

const DailyOutfitPage = () => {
  const [outfits, setOutfits] = useState<DailyOutfitResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const userId = '1'; // 佔位符使用者 ID

  const fetchOutfit = async () => {
    setLoading(true);
    const res = await fetch('/api/reco/daily-outfits', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        latitude: 40.7128,
        longitude: -74.0060,
        occasion: 'casual',
      }),
    });
    const data = await res.json();
    setOutfits(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchOutfit();
  }, []);

  const handleSaveOutfits = async () => {
    if (outfits) {
      const saveRequest: SaveDailyOutfitRequest = {
        userId,
        recommendations: outfits.recommendations,
        timestamp: new Date(),
      };
      const res = await fetch('/api/reco/daily-outfits/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saveRequest),
      });
      const data = await res.json();
      alert(`儲存狀態: ${data.success ? '成功' : '失敗'}`);
    }
  };

  const handleShareOutfits = () => {
    if (outfits) {
      // 佔位符：實際的分享邏輯將在此處實作
      alert('分享功能即將推出！');
      console.log('分享的搭配:', outfits.recommendations);
    }
  };

  if (loading) {
    return <div>正在生成您的每日搭配...</div>;
  }

  if (!outfits) {
    return <div>無法生成搭配。</div>;
  }

  return (
    <div>
      <h1>您的每日搭配</h1>
      <button onClick={handleSaveOutfits}>儲存搭配</button>
      <button onClick={handleShareOutfits}>分享搭配</button>
<div className='flex gap-2 mt-4'>
  <button onClick={() => console.log('Save outfit')} className='px-4 py-2 bg-blue-500 text-white rounded'>儲存整套</button>
  <button onClick={() => console.log('Share outfit')} className='px-4 py-2 bg-green-500 text-white rounded'>分享連結</button>
</div>
      {outfits.recommendations.map((rec, index) => (
        <div key={index}>
          <h2>搭配 #{index + 1}</h2>
          <p>原因: {rec.reasons.join(', ')}</p>
          <p>分數: {rec.scores.total}</p>
          <div>
            <h3>上衣</h3>
            <p>{rec.outfit.top.name}</p>
            <img src={rec.outfit.top.imageUrl} alt={rec.outfit.top.name} />
            <button onClick={() => console.log('Add to cart:', rec.outfit.top.id)} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-2 rounded text-sm mt-2">
              加入購物車
            </button>
          </div>
          <div>
            <h3>下裝</h3>
            <p>{rec.outfit.bottom.name}</p>
            <img src={rec.outfit.bottom.imageUrl} alt={rec.outfit.bottom.name} />
            <button onClick={() => console.log('Add to cart:', rec.outfit.bottom.id)} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-2 rounded text-sm mt-2">
              加入購物車
            </button>
          </div>
          {rec.outfit.outerwear && <div>
            <h3>外套</h3>
            <p>{rec.outfit.outerwear.name}</p>
            <img src={rec.outfit.outerwear.imageUrl} alt={rec.outfit.outerwear.name} />
            <button onClick={() => console.log('Add to cart:', rec.outfit.outerwear.id)} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-2 rounded text-sm mt-2">
              加入購物車
            </button>
          </div>}
          <div>
            <h3>鞋子</h3>
            <p>{rec.outfit.shoes.name}</p>
            <img src={rec.outfit.shoes.imageUrl} alt={rec.outfit.shoes.name} />
            <button onClick={() => console.log('Add to cart:', rec.outfit.shoes.id)} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-2 rounded text-sm mt-2">
              加入購物車
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DailyOutfitPage;
