import React, { useEffect, useState } from 'react';

// TypeScript interfaces
interface OutfitItem {
  id: string;
  name: string;
  imageUrl: string;
}

interface DailyOutfitRecommendation {
  top: OutfitItem;
  bottom: OutfitItem;
  shoes: OutfitItem;
  reasons: string[];
  scores: {
    total: number;
  };
}

const DailyOutfitsPage = () => {
  const [outfits, setOutfits] = useState<DailyOutfitRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDailyOutfits = async () => {
      try {
        const userId = 'test-user-' + Date.now();
        const latitude = 25.0;
        const longitude = 121.5;
        const occasion = 'casual';

        // 新增測試衣物
        const items = [
          { name: 'White T-shirt', type: 'top', colors: ['white'], style: 'casual', season: 'all-season', imageUrl: 'https://via.placeholder.com/150/FFFFFF/000000?text=Top' },
          { name: 'Blue Jeans', type: 'bottom', colors: ['blue'], style: 'casual', season: 'all-season', imageUrl: 'https://via.placeholder.com/150/0000FF/FFFFFF?text=Bottom' },
          { name: 'White Sneakers', type: 'shoes', colors: ['white'], style: 'casual', season: 'all-season', imageUrl: 'https://via.placeholder.com/150/CCCCCC/000000?text=Shoes' }
        ];

        for (const item of items) {
          await fetch('/api/wardrobe/items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, ...item })
          });
        }

        const response = await fetch(
          `/api/daily-outfits?userId=${userId}&latitude=${latitude}&longitude=${longitude}&occasion=${occasion}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch daily outfits');
        }

        const data = await response.json();
        if (!data || !Array.isArray(data) || data.length === 0) {
          setError('目前衣櫃沒有足夠的衣物,無法生成推薦');
          setLoading(false);
          return;
        }
        
        setOutfits(data.slice(0, 2));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchDailyOutfits();
  }, []);

  if (loading) {
    return <div className="text-center mt-10">Loading...</div>;
  }

  if (error) {
    return <div className="text-center mt-10 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Your Daily Outfits</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {outfits.map((rec, index) => (
          <div key={index} className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-2">Outfit #{index + 1}</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <img src={rec.top.imageUrl} alt={rec.top.name} className="w-24 h-24 object-cover rounded" />
                  <div>
                    <h3 className="font-medium">Top</h3>
                    <p>{rec.top.name}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <img src={rec.bottom.imageUrl} alt={rec.bottom.name} className="w-24 h-24 object-cover rounded" />
                  <div>
                    <h3 className="font-medium">Bottom</h3>
                    <p>{rec.bottom.name}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <img src={rec.shoes.imageUrl} alt={rec.shoes.name} className="w-24 h-24 object-cover rounded" />
                  <div>
                    <h3 className="font-medium">Shoes</h3>
                    <p>{rec.shoes.name}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DailyOutfitsPage;