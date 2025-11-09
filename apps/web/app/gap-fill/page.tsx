'use client';

import React, { useEffect, useState } from 'react';
import { GapFillResponse, GapSuggestion } from '@/packages/types/src/gap';
import { logInteractionEvent } from '../../lib/api';

const GapFillPage = () => {
  const [recommendations, setRecommendations] = useState<GapFillResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showExamples, setShowExamples] = useState<string | null>(null);
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [season, setSeason] = useState<'summer' | 'winter' | 'spring' | 'autumn' | 'all-season' | undefined>(undefined);

  const userId = '1'; // 佔位符使用者 ID

  const fetchRecommendations = async () => {
    setLoading(true);
    const res = await fetch('/api/reco/closet-gap-fill', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        occasion: 'casual',
        minPrice,
        maxPrice,
        season,
      }),
    });
    const data = await res.json();
    setRecommendations(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchRecommendations();
  }, [minPrice, maxPrice, season]);

  const handleShowExamples = (itemId: string) => {
    setShowExamples(showExamples === itemId ? null : itemId);
  };

  const handleSaveRecommendations = async () => {
    console.log('TODO: Call Wardrobe API to save recommendations:', recommendations?.recommendations);
    alert('推薦已儲存 (佔位符)！');
  };

  const handleShareRecommendations = () => {
    const shareToken = Math.random().toString(36).substring(2);
    console.log(`TODO: Generate share link with token: ${shareToken}`);
    alert(`分享連結已生成 (佔位符): ${shareToken}`);
  };

  const handleAddToCart = (item: GapSuggestion['item']) => {
    console.log('TODO: Add item to cart:', item.id);
    logInteractionEvent({
      userId,
      eventType: 'ADD_TO_CART',
      payload: { itemId: item.id, page: 'gap-fill' },
    });
    alert(`${item.name} 已加入購物車！`);
  };

  if (loading) {
    return <div>正在您的衣櫥中尋找空缺...</div>;
  }

  if (!recommendations || recommendations.recommendations.length === 0) {
    return <div>您的衣櫥已完整！</div>;
  }

  return (
    <div>
      <h1>填補您衣櫥的空缺</h1>
      <button onClick={handleSaveRecommendations}>儲存推薦</button>
      <button onClick={handleShareRecommendations}>分享推薦</button>
      <div className='flex gap-2 mt-4'>
        <button onClick={() => console.log('Save outfit')} className='px-4 py-2 bg-blue-500 text-white rounded'>儲存整套</button>
        <button onClick={() => console.log('Share outfit')} className='px-4 py-2 bg-green-500 text-white rounded'>分享連結</button>
      </div>

      <div>
        <h3>篩選器</h3>
        <label>
          最低價格:
          <input type="number" value={minPrice || ''} onChange={(e) => setMinPrice(e.target.value ? parseFloat(e.target.value) : undefined)} />
        </label>
        <label>
          最高價格:
          <input type="number" value={maxPrice || ''} onChange={(e) => setMaxPrice(e.target.value ? parseFloat(e.target.value) : undefined)} />
        </label>
        <label>
          季節:
          <select value={season || ''} onChange={(e) => setSeason(e.target.value as any)}>
            <option value="">所有季節</option>
            <option value="summer">夏季</option>
            <option value="winter">冬季</option>
            <option value="spring">春季</option>
            <option value="autumn">秋季</option>
            <option value="all-season">四季皆宜</option>
          </select>
        </label>
      </div>

      {recommendations.recommendations.map((rec, index) => (
        <div key={index}>
          <h2>{rec.item.name}</h2>
          <p>{rec.reason}</p>
          <p>解鎖 {rec.unlockCount} 套新搭配！</p>
          <img src={rec.item.imageUrl} alt={rec.item.name} />
          <button onClick={() => handleAddToCart(rec.item)}>加入購物車</button>
          <button onClick={() => handleShowExamples(rec.item.id)}>查看範例</button>
          {showExamples === rec.item.id && (
            <div>
              <h3>範例搭配</h3>
              {rec.examplePairings.map((pairing, i) => (
                <div key={i}>
                  <p>上衣: {pairing.top.name}</p>
                  <p>下裝: {pairing.bottom.name}</p>
                  <p>鞋子: {pairing.shoes.name}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default GapFillPage;
