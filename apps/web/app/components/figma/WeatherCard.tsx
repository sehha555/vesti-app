'use client';

import { Cloud, Droplets, Sun, CloudRain, CloudSnow, MapPin, Thermometer, Wind } from 'lucide-react';
import type { WeatherSummary } from '@/packages/types/src/weather';

// 不同天氣狀況的背景樣式
const weatherBackgrounds: Record<WeatherSummary['condition'], string> = {
  sunny: 'bg-gradient-to-br from-[#5AB2FF] via-[#A0DEFF] to-[#CAF4FF]',
  cloudy: 'bg-gradient-to-br from-[#6BA3BE] via-[#89B9CC] to-[#A8DADC]',
  rainy: 'bg-gradient-to-br from-[#4A5C6A] via-[#6B7F8F] to-[#8BA3B1]',
  snowy: 'bg-gradient-to-br from-[#C8D8E4] via-[#E8F1F5] to-[#FFFFFF]',
  windy: 'bg-gradient-to-br from-[#6BA3BE] via-[#89B9CC] to-[#A8DADC]',
};

// 天氣條件描述映射
const conditionDescriptions: Record<WeatherSummary['condition'], string> = {
  sunny: '晴朗',
  cloudy: '多雲',
  rainy: '下雨',
  snowy: '下雪',
  windy: '有風',
};

interface WeatherCardProps {
  weather?: WeatherSummary;
}

export function WeatherCard({ weather }: WeatherCardProps) {
  const currentWeather = weather?.condition || 'cloudy';
  const temperature = Math.round(weather?.temperature ?? 24);
  const feelsLike = Math.round(weather?.feelsLike ?? temperature);
  const humidity = Math.round(weather?.humidity ?? 60);
  const windSpeed = Math.round(weather?.windSpeed ?? 0);
  const conditionDesc = conditionDescriptions[currentWeather];
  const locationName = weather?.locationName || '載入中...';
  
  const WeatherIcon = () => {
    switch (currentWeather) {
      case 'sunny':
        return <Sun className="h-10 w-10 text-white drop-shadow-md" strokeWidth={1.5} />;
      case 'rainy':
        return <CloudRain className="h-10 w-10 text-white drop-shadow-md" strokeWidth={1.5} />;
      case 'snowy':
        return <CloudSnow className="h-10 w-10 text-white drop-shadow-md" strokeWidth={1.5} />;
      case 'cloudy':
      case 'windy':
      default:
        return <Cloud className="h-10 w-10 text-white drop-shadow-md" strokeWidth={1.5} />;
    }
  };

  return (
    <div className={`relative mx-5 mt-2 overflow-hidden rounded-2xl ${weatherBackgrounds[currentWeather]} transition-all duration-700 shadow-md`}>
      {/* 背景裝飾 - 縮小尺寸 */}
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
      <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/10" />
      
      <div className="relative z-10 flex items-center justify-between px-5 py-4">
        {/* Left side - Icon, Location and Temperature */}
        <div className="flex items-center gap-3">
          <WeatherIcon />
          <div>
            <div className="flex items-center gap-1 text-white/80 mb-0.5">
              <MapPin size={10} />
              <p className="text-xs font-medium">{locationName}</p>
            </div>
            <p className="text-2xl font-bold text-white drop-shadow-md leading-none">{temperature}°C</p>
            <p className="text-xs text-white/70 mt-0.5">體感 {feelsLike}°C</p>
          </div>
        </div>

        {/* Right side - Weather details */}
        <div className="text-right">
          <p className="text-sm font-medium text-white/90">{conditionDesc}</p>
          <div className="mt-1.5 flex flex-col gap-1">
            <div className="flex items-center justify-end gap-1.5">
              <Droplets className="h-3.5 w-3.5 text-white/90" strokeWidth={2} />
              <span className="text-xs font-medium text-white/80">{humidity}%</span>
            </div>
            <div className="flex items-center justify-end gap-1.5">
              <Wind className="h-3.5 w-3.5 text-white/90" strokeWidth={2} />
              <span className="text-xs font-medium text-white/80">{windSpeed} km/h</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
