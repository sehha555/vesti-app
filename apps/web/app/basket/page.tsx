'use client';

import React, { useEffect, useState } from 'react';
import { BasketMixmatchResponse, BasketMixmatchRecommendation } from '@/packages/types/src/basket';
import { SaveBasketMixmatchRequest } from '@/packages/types/src/persistence';

const BasketPage = () => {
  const [recommendations, setRecommendations] = useState<BasketMixmatchRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalRecommendations, setTotalRecommendations] = useState(0);

  const userId = '1'; // 佔位符使用者 ID

  const fetchOutfits = async (currentPage: number) => {
    setLoading(true);
    const res = await fetch('/api/reco/basket-mixmatch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        basket: ['1', '2'],
        page: currentPage,
        pageSize: 5,
      }),
    });
    const data: BasketMixmatchResponse = await res.json();
    setRecommendations(prev => [...prev, ...data.recommendations]);
    setTotalRecommendations(data.totalRecommendations || 0);
    setLoading(false);
  };

  useEffect(() => {
    fetchOutfits(1);
  }, []);

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
    fetchOutfits(page + 1);
  };

  const handleSaveOutfits = async () => {
    if (recommendations.length > 0) {
      const saveRequest: SaveBasketMixmatchRequest = {
        userId,
        recommendations,
        timestamp: new Date(),
      };
      const res = await fetch('/api/reco/basket-mixmatch/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saveRequest),
      });
      const data = await res.json();
      alert(`儲存狀態: ${data.success ? '成功' : '失敗'}`);
    }
  };

  const handleShareOutfits = () => {
    if (recommendations.length > 0) {
      // 佔位符：實際的分享邏輯將在此處實作
      alert('分享功能即將推出！');
      console.log('分享的搭配:', recommendations);
    }
  };

  if (loading && recommendations.length === 0) {
    return <div>正在為您的購物車尋找搭配...</div>;
  }

  if (recommendations.length === 0 && !loading) {
    return <div>找不到搭配。</div>;
  }

  return (
    <div>
      <h1>完成您的搭配</h1>
      <button onClick={handleSaveOutfits}>儲存搭配</button>
      <button onClick={handleShareOutfits}>分享搭配</button>
      <div className='flex gap-2 mt-4'>
        <button onClick={() => console.log('Save outfit')} className='px-4 py-2 bg-blue-500 text-white rounded'>儲存整套</button>
        <button onClick={() => console.log('Share outfit')} className='px-4 py-2 bg-green-500 text-white rounded'>分享連結</button>
      </div>
      {recommendations.map((rec, index) => (
        <div key={index}>
          <h2>搭配 #{index + 1}</h2>
          <p>原因: {rec.reasons.join(', ')}</p>
          <p>分數: {rec.scores.total.toFixed(2)}</p>
          <p>相容性: {rec.scores.compatibility.toFixed(2)}</p>
          <div>
            <h4>規則分數</h4>
            <ul>
              {Object.entries(rec.scores.rules).map(([rule, score]) => (
                <li key={rule}>_**{rule}**_: {score}</li>
              ))}
            </ul>
          </div>
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
            <button onClick={() => console.log('Add to cart:', rec.outfit.outerwear?.id)} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-2 rounded text-sm mt-2">
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
      {recommendations.length < totalRecommendations && (
        <button onClick={handleLoadMore} disabled={loading}>
          {loading ? '載入中...' : '載入更多'}
        </button>
      )}
    </div>
  );
};

export default BasketPage;
