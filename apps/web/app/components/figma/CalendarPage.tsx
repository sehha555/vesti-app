import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { CreateEventDialog } from './CreateEventDialog';
import { WeatherStrip } from './WeatherStrip';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner';

interface CalendarEvent {
  id: number;
  date: Date;
  title: string;
  description: string;
  outfitId: number | null;
  outfitImageUrl?: string;
  outfitName?: string;
}

interface Outfit {
  id: number;
  name: string;
  imageUrl: string;
  occasion: string;
}

interface CalendarPageProps {
  onBack?: () => void;
}

// Mock 搭配資料
const mockOutfits: Outfit[] = [
  {
    id: 1,
    name: 'Casual Comfort',
    imageUrl: 'https://images.unsplash.com/photo-1762343287340-8aa94082e98b?w=400',
    occasion: '日常',
  },
  {
    id: 2,
    name: 'Summer Breeze',
    imageUrl: 'https://images.unsplash.com/photo-1704775990327-90f7c43436fc?w=400',
    occasion: '約會',
  },
  {
    id: 3,
    name: 'Urban Style',
    imageUrl: 'https://images.unsplash.com/photo-1762114468792-ced36e281323?w=400',
    occasion: '運動',
  },
  {
    id: 4,
    name: 'Weekend Vibes',
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400',
    occasion: '日常',
  },
];

// Mock 天氣資料（未來7天）
const generateWeatherData = () => {
  const conditions: Array<'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'windy'> = [
    'sunny',
    'cloudy',
    'rainy',
    'sunny',
    'cloudy',
    'sunny',
    'cloudy',
  ];
  const temps = [24, 22, 19, 23, 25, 26, 24];

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return {
      date,
      temp: temps[i],
      condition: conditions[i],
    };
  });
};

export function CalendarPage({ onBack }: CalendarPageProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([
    // Mock 初始資料
    {
      id: 1,
      date: new Date(2025, 11, 15), // 12月15日
      title: '重要會議',
      description: '需要正式一點',
      outfitId: 2,
      outfitImageUrl: mockOutfits[1].imageUrl,
      outfitName: mockOutfits[1].name,
    },
  ]);

  const weatherData = generateWeatherData();

  // 獲取當月的所有日期
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // 添加前面的空白
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // 添加當月日期
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsDialogOpen(true);
  };

  const handleCreateEvent = (eventData: {
    title: string;
    description: string;
    outfitId: number | null;
  }) => {
    if (!selectedDate) return;

    const outfit = mockOutfits.find((o) => o.id === eventData.outfitId);

    const newEvent: CalendarEvent = {
      id: Date.now(),
      date: selectedDate,
      title: eventData.title,
      description: eventData.description,
      outfitId: eventData.outfitId,
      outfitImageUrl: outfit?.imageUrl,
      outfitName: outfit?.name,
    };

    setEvents((prev) => [...prev, newEvent]);
    setIsDialogOpen(false);
    toast.success('已新增行程');
  };

  const handleAIRecommendation = () => {
    toast.success('AI 正在分析天氣與場合，推薦最適合的穿搭...');
    // 這裡可以實作 AI 推薦邏輯
  };

  const getEventsForDate = (date: Date | null) => {
    if (!date) return [];
    return events.filter(
      (event) =>
        event.date.getDate() === date.getDate() &&
        event.date.getMonth() === date.getMonth() &&
        event.date.getFullYear() === date.getFullYear()
    );
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isPastDate = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate < today;
  };

  const days = getDaysInMonth(currentDate);
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className="flex h-screen flex-col bg-[var(--vesti-background)]">
      {/* Header */}
      <div className="flex-shrink-0 bg-[var(--vesti-background)]/95 backdrop-blur-sm border-b border-[var(--vesti-gray-light)]">
        <div className="flex h-16 items-center justify-between px-5">
          <button
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--vesti-dark)] transition-colors hover:bg-[var(--vesti-light-bg)]"
          >
            <ChevronLeft className="h-6 w-6" strokeWidth={2} />
          </button>
          <h1 className="tracking-widest text-[var(--vesti-primary)]">穿搭日曆</h1>
          <div className="w-10" /> {/* 佔位平衡 */}
        </div>

        {/* 月份選擇器 */}
        <div className="flex items-center justify-between px-5 pb-4">
          <button
            onClick={handlePrevMonth}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--vesti-dark)] transition-colors hover:bg-[var(--vesti-light-bg)]"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2} />
          </button>

          <h2 className="text-[var(--vesti-dark)]" style={{ fontSize: 'var(--text-h3)' }}>
            {currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月
          </h2>

          <button
            onClick={handleNextMonth}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--vesti-dark)] transition-colors hover:bg-[var(--vesti-light-bg)]"
          >
            <ChevronRight className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* 可滾動內容 */}
      <div className="flex-1 overflow-y-auto pb-20">
        {/* 天氣資訊條 */}
        <div className="pt-4">
          <WeatherStrip weatherData={weatherData} />
        </div>

        {/* 日曆網格 */}
        <div className="px-5 pb-6">
          {/* 星期標題 */}
          <div className="mb-2 grid grid-cols-7 gap-1">
            {weekdays.map((day) => (
              <div
                key={day}
                className="flex h-10 items-center justify-center text-[var(--vesti-text-secondary)]"
                style={{ fontSize: 'var(--text-label)', fontWeight: 500 }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 日期網格 */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, index) => {
              const dayEvents = getEventsForDate(date);
              const hasEvent = dayEvents.length > 0;
              const isCurrentDay = isToday(date);
              const isPast = isPastDate(date);

              return (
                <motion.button
                  key={index}
                  onClick={() => date && handleDateClick(date)}
                  disabled={!date}
                  whileTap={date ? { scale: 0.95 } : {}}
                  className={`relative aspect-square rounded-[12px] p-1 transition-all ${
                    !date
                      ? 'cursor-default'
                      : isPast
                      ? 'bg-[var(--vesti-light-bg)]/50 text-[var(--vesti-gray-mid)] hover:bg-[var(--vesti-light-bg)]'
                      : isCurrentDay
                      ? 'bg-[var(--vesti-primary)] text-white shadow-md'
                      : hasEvent
                      ? 'bg-white text-[var(--vesti-dark)] shadow-sm hover:shadow-md'
                      : 'bg-white text-[var(--vesti-dark)] hover:bg-[var(--vesti-light-bg)]'
                  }`}
                >
                  {date && (
                    <>
                      {/* 日期數字 */}
                      <div
                        className="text-center"
                        style={{
                          fontSize: 'var(--text-base)',
                          fontWeight: isCurrentDay ? 600 : 400,
                        }}
                      >
                        {date.getDate()}
                      </div>

                      {/* 事件指示器 - 顯示搭配縮圖 */}
                      {hasEvent && dayEvents[0].outfitImageUrl && (
                        <div className="mt-0.5 overflow-hidden rounded-[6px]">
                          <ImageWithFallback
                            src={dayEvents[0].outfitImageUrl}
                            alt={dayEvents[0].title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}

                      {/* 多個事件指示點 */}
                      {hasEvent && dayEvents.length > 1 && (
                        <div className="absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-0.5">
                          {dayEvents.slice(0, 3).map((_, i) => (
                            <div
                              key={i}
                              className={`h-1 w-1 rounded-full ${
                                isCurrentDay
                                  ? 'bg-white'
                                  : 'bg-[var(--vesti-primary)]'
                              }`}
                            />
                          ))}
                        </div>
                      )}

                      {/* 無搭配時的事件點 */}
                      {hasEvent && !dayEvents[0].outfitImageUrl && (
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
                          <div
                            className={`h-1.5 w-1.5 rounded-full ${
                              isCurrentDay
                                ? 'bg-white'
                                : 'bg-[var(--vesti-accent)]'
                            }`}
                          />
                        </div>
                      )}
                    </>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* 今日行程列表 */}
        {events.filter((event) => isToday(event.date)).length > 0 && (
          <div className="px-5 pb-6">
            <h3
              className="mb-3 text-[var(--vesti-dark)]"
              style={{ fontSize: 'var(--text-h4)' }}
            >
              今日行程
            </h3>
            <div className="space-y-2">
              {events
                .filter((event) => isToday(event.date))
                .map((event) => (
                  <motion.div
                    key={event.id}
                    layout
                    className="flex gap-3 rounded-[16px] bg-white p-3 shadow-sm"
                  >
                    {event.outfitImageUrl && (
                      <div className="h-20 w-16 flex-shrink-0 overflow-hidden rounded-[12px]">
                        <ImageWithFallback
                          src={event.outfitImageUrl}
                          alt={event.outfitName || ''}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h4
                        className="text-[var(--vesti-dark)]"
                        style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}
                      >
                        {event.title}
                      </h4>
                      {event.description && (
                        <p
                          className="mt-0.5 text-[var(--vesti-text-secondary)]"
                          style={{ fontSize: 'var(--text-label)', fontWeight: 400 }}
                        >
                          {event.description}
                        </p>
                      )}
                      {event.outfitName && (
                        <p
                          className="mt-1 text-[var(--vesti-primary)]"
                          style={{ fontSize: 'var(--text-label)', fontWeight: 500 }}
                        >
                          穿搭：{event.outfitName}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* 新增行程對話框 */}
      <CreateEventDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={handleCreateEvent}
        selectedDate={selectedDate}
        availableOutfits={mockOutfits}
        onRequestAIRecommendation={handleAIRecommendation}
      />
    </div>
  );
}
