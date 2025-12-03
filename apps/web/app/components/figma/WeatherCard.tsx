import { Cloud, Droplets, Sun, CloudRain, CloudSnow, MapPin } from 'lucide-react';

// 天氣資訊型別
interface WeatherInfo {
  temp_c: number;
  condition: string;
  description: string;
  iconUrl?: string;
  humidity: number;
  feels_like: number;
  locationName?: string;
}

interface WeatherCardProps {
  weather?: WeatherInfo | null;
}

// 不同天氣狀況的背景樣式
const weatherBackgrounds = {
  Clear: 'bg-gradient-to-br from-[#5AB2FF] via-[#A0DEFF] to-[#CAF4FF]',
  Clouds: 'bg-gradient-to-br from-[#6BA3BE] via-[#89B9CC] to-[#A8DADC]',
  Rain: 'bg-gradient-to-br from-[#4A5C6A] via-[#6B7F8F] to-[#8BA3B1]',
  Drizzle: 'bg-gradient-to-br from-[#4A5C6A] via-[#6B7F8F] to-[#8BA3B1]',
  Snow: 'bg-gradient-to-br from-[#C8D8E4] via-[#E8F1F5] to-[#FFFFFF]',
  default: 'bg-gradient-to-br from-[#6BA3BE] via-[#89B9CC] to-[#A8DADC]',
};

export function WeatherCard({ weather }: WeatherCardProps) {
  // 如果沒有天氣資料，顯示載入中或預設值
  const displayWeather = weather || {
    temp_c: 24,
    condition: 'Clouds',
    description: 'Partly Cloudy',
    humidity: 65,
    feels_like: 24,
    locationName: 'Loading...',
  };

  const currentCondition = displayWeather.condition as keyof typeof weatherBackgrounds;
  const background = weatherBackgrounds[currentCondition] || weatherBackgrounds.default;
  
  const WeatherIcon = () => {
    switch (displayWeather.condition) {
      case 'Clear':
        return <Sun className="h-10 w-10 text-white drop-shadow-md" strokeWidth={1.5} />;
      case 'Rain':
      case 'Drizzle':
        return <CloudRain className="h-10 w-10 text-white drop-shadow-md" strokeWidth={1.5} />;
      case 'Snow':
        return <CloudSnow className="h-10 w-10 text-white drop-shadow-md" strokeWidth={1.5} />;
      case 'Clouds':
      default:
        return <Cloud className="h-10 w-10 text-white drop-shadow-md" strokeWidth={1.5} />;
    }
  };

  return (
    <div className={`relative mx-5 mt-2 overflow-hidden rounded-2xl ${background} transition-all duration-700 shadow-md`}>
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
              <p className="text-xs font-medium">{displayWeather.locationName || 'Unknown'}</p>
            </div>
            <p className="text-2xl font-bold text-white drop-shadow-md leading-none">
              {Math.round(displayWeather.temp_c)}°C
            </p>
          </div>
        </div>

        {/* Right side - Weather details */}
        <div className="text-right">
          <p className="text-sm font-medium text-white/90">{displayWeather.description}</p>
          <div className="mt-1.5 flex items-center justify-end gap-1.5">
            <Droplets className="h-3.5 w-3.5 text-white/90" strokeWidth={2} />
            <span className="text-xs font-medium text-white/80">{displayWeather.humidity}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
