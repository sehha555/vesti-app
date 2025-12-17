import { Cloud, CloudRain, Sun, CloudSnow, Wind } from 'lucide-react';

interface WeatherDay {
  date: Date;
  temp: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'windy';
}

interface WeatherStripProps {
  weatherData: WeatherDay[];
}

export function WeatherStrip({ weatherData }: WeatherStripProps) {
  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'sunny':
        return <Sun className="h-5 w-5" strokeWidth={2} />;
      case 'cloudy':
        return <Cloud className="h-5 w-5" strokeWidth={2} />;
      case 'rainy':
        return <CloudRain className="h-5 w-5" strokeWidth={2} />;
      case 'snowy':
        return <CloudSnow className="h-5 w-5" strokeWidth={2} />;
      case 'windy':
        return <Wind className="h-5 w-5" strokeWidth={2} />;
      default:
        return <Sun className="h-5 w-5" strokeWidth={2} />;
    }
  };

  const getWeatherColor = (condition: string) => {
    switch (condition) {
      case 'sunny':
        return 'text-amber-500';
      case 'cloudy':
        return 'text-gray-400';
      case 'rainy':
        return 'text-blue-500';
      case 'snowy':
        return 'text-sky-300';
      case 'windy':
        return 'text-slate-400';
      default:
        return 'text-amber-500';
    }
  };

  const formatDay = (date: Date, index: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    if (targetDate.getTime() === today.getTime()) {
      return '今天';
    }

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (targetDate.getTime() === tomorrow.getTime()) {
      return '明天';
    }

    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    return `週${weekdays[date.getDay()]}`;
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-sky-50 rounded-[16px] p-4 mx-5 mb-4">
      <h3
        className="text-[var(--vesti-dark)] mb-3"
        style={{ fontSize: 'var(--text-base)' }}
      >
        本週天氣預報
      </h3>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {weatherData.map((day, index) => (
          <div
            key={index}
            className="flex min-w-[70px] flex-col items-center gap-1.5 rounded-[12px] bg-white/60 backdrop-blur-sm px-3 py-2.5"
          >
            <span
              className="text-[var(--vesti-dark)]"
              style={{ fontSize: 'var(--text-label)', fontWeight: 500 }}
            >
              {formatDay(day.date, index)}
            </span>
            <div className={getWeatherColor(day.condition)}>
              {getWeatherIcon(day.condition)}
            </div>
            <span
              className="text-[var(--vesti-dark)]"
              style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}
            >
              {day.temp}°
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
