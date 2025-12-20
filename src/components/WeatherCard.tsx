import { Cloud, Droplets, Sun, CloudRain, CloudSnow, MapPin } from 'lucide-react';
import { useState } from 'react';

// 不同天氣狀況的背景樣式
const weatherBackgrounds = {
  sunny: 'bg-gradient-to-br from-[#5AB2FF] via-[#A0DEFF] to-[#CAF4FF]',
  cloudy: 'bg-gradient-to-br from-[#6BA3BE] via-[#89B9CC] to-[#A8DADC]',
  rainy: 'bg-gradient-to-br from-[#4A5C6A] via-[#6B7F8F] to-[#8BA3B1]',
  snowy: 'bg-gradient-to-br from-[#C8D8E4] via-[#E8F1F5] to-[#FFFFFF]',
};

export function WeatherCard() {
  const [currentWeather] = useState<'sunny' | 'cloudy' | 'rainy' | 'snowy'>('cloudy');
  
  const WeatherIcon = () => {
    switch (currentWeather) {
      case 'sunny':
        return <Sun className="h-10 w-10 text-white drop-shadow-md" strokeWidth={1.5} />;
      case 'rainy':
        return <CloudRain className="h-10 w-10 text-white drop-shadow-md" strokeWidth={1.5} />;
      case 'snowy':
        return <CloudSnow className="h-10 w-10 text-white drop-shadow-md" strokeWidth={1.5} />;
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
              <p className="text-xs font-medium">Central District</p>
            </div>
            <p className="text-2xl font-bold text-white drop-shadow-md leading-none">24°C</p>
          </div>
        </div>

        {/* Right side - Weather details */}
        <div className="text-right">
          <p className="text-sm font-medium text-white/90">Partly Cloudy</p>
          <div className="mt-1.5 flex items-center justify-end gap-1.5">
            <Droplets className="h-3.5 w-3.5 text-white/90" strokeWidth={2} />
            <span className="text-xs font-medium text-white/80">65%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
