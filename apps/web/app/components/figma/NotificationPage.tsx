import { useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'motion/react';
import { 
  Bell, 
  BookOpen, 
  ShirtIcon as Shirt,
  Info,
  Check,
  Trash2,
  X,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

type NotificationType = 'knowledge' | 'wardrobe' | 'system';

interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  imageUrl?: string;
  actionLabel?: string;
  actionTarget?: 'explore' | 'wardrobe' | 'profile' | 'calendar';
}

const mockNotifications: Notification[] = [
  {
    id: 1,
    type: 'knowledge',
    title: '穿搭技巧',
    message: '秋冬疊穿法則：3 層穿搭讓你兼顧保暖與時尚',
    time: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    isRead: false,
    imageUrl: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400',
    actionLabel: '閱讀文章',
    actionTarget: 'explore',
  },
  {
    id: 2,
    type: 'wardrobe',
    title: 'CPW 數據更新',
    message: '恭喜！你本週的 CPW 達到 ¥8.5，比上週進步 15%',
    time: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    isRead: false,
    actionLabel: '查看詳情',
    actionTarget: 'wardrobe',
  },
  {
    id: 3,
    type: 'system',
    title: '新功能上線',
    message: '穿搭日曆功能已上線，快來規劃你的每日造型吧！',
    time: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    isRead: false,
    actionLabel: '立即體驗',
    actionTarget: 'calendar',
  },
  {
    id: 4,
    type: 'wardrobe',
    title: '衣物提醒',
    message: '你的牛仔外套已經 30 天沒穿了，要不要搭配看看？',
    time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    isRead: true,
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
    actionLabel: '查看衣櫃',
    actionTarget: 'wardrobe',
  },
  {
    id: 5,
    type: 'knowledge',
    title: '搭配靈感',
    message: '如何用基本款打造高級感？5 個實用技巧分享',
    time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    isRead: true,
    imageUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400',
    actionLabel: '閱讀文章',
    actionTarget: 'explore',
  },
  {
    id: 6,
    type: 'system',
    title: '系統維護通知',
    message: '系統將於 12/20 凌晨 2:00-4:00 進行維護，期間部分功能將暫停使用',
    time: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    isRead: true,
  },
  {
    id: 7,
    type: 'wardrobe',
    title: '本月數據報告',
    message: '你本月穿搭了 25 套造型，利用率提升至 68%',
    time: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    isRead: true,
    actionLabel: '查看報告',
    actionTarget: 'wardrobe',
  },
  {
    id: 8,
    type: 'knowledge',
    title: '風格指南',
    message: '找到你的穿搭風格：從了解身形開始',
    time: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    isRead: true,
    imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400',
    actionLabel: '閱讀文章',
    actionTarget: 'explore',
  },
];

// 獲取通知類型的圖標和顏色
function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'knowledge':
      return { Icon: BookOpen, color: 'var(--vesti-primary)', bgColor: 'var(--vesti-primary)' };
    case 'wardrobe':
      return { Icon: Shirt, color: '#8B5CF6', bgColor: '#8B5CF6' };
    case 'system':
      return { Icon: Info, color: '#10B981', bgColor: '#10B981' };
  }
}

// 格式化時間
function formatTime(isoString: string): string {
  const now = new Date();
  const time = new Date(isoString);
  const diff = now.getTime() - time.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return '剛剛';
  if (minutes < 60) return `${minutes} 分鐘前`;
  if (hours < 24) return `${hours} 小時前`;
  if (days === 1) return '昨天';
  if (days < 7) return `${days} 天前`;
  
  return time.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' });
}

// 將通知按時間分組
function groupNotificationsByTime(notifications: Notification[]) {
  const groups: { [key: string]: Notification[] } = {
    '今天': [],
    '昨天': [],
    '本週': [],
    '更早': [],
  };

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
  const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);

  notifications.forEach((notification) => {
    const time = new Date(notification.time);
    if (time >= todayStart) {
      groups['今天'].push(notification);
    } else if (time >= yesterdayStart) {
      groups['昨天'].push(notification);
    } else if (time >= weekStart) {
      groups['本週'].push(notification);
    } else {
      groups['更早'].push(notification);
    }
  });

  return groups;
}

interface NotificationPageProps {
  onBack?: () => void;
}

export function NotificationPage({ onBack }: NotificationPageProps) {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [swipedNotification, setSwipedNotification] = useState<number | null>(null);
  const [filter, setFilter] = useState<NotificationType | 'all'>('all');

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  
  // 根據篩選條件過濾通知
  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter((n) => n.type === filter);

  // 標記全部為已讀
  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    toast.success('已標記全部為已讀');
  };

  // 標記單條為已讀
  const handleMarkAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  // 刪除通知
  const handleDelete = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setSwipedNotification(null);
    toast('已刪除通知');
  };

  // 處理通知點擊
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    toast('功能開發中...');
  };

  // 處理滑動
  const handleDragEnd = (notificationId: number, info: PanInfo) => {
    const threshold = -80;
    if (info.offset.x < threshold) {
      setSwipedNotification(notificationId);
    } else if (info.offset.x > 20) {
      setSwipedNotification(null);
    }
  };

  const groupedNotifications = groupNotificationsByTime(filteredNotifications);

  return (
    <div className="h-screen flex flex-col bg-[var(--vesti-background)]">
      {/* Header */}
      <div className="flex-shrink-0 bg-[var(--vesti-background)] border-b border-[var(--vesti-border)]">
        <div className="flex h-16 items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <h1 className="tracking-widest text-[var(--vesti-primary)]">通知</h1>
            {unreadCount > 0 && (
              <div className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-[var(--vesti-accent)] px-2">
                <span className="text-white" style={{ fontSize: 'var(--text-label)' }}>
                  {unreadCount}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[var(--vesti-primary)] hover:bg-[var(--vesti-primary)]/10 transition-colors"
              >
                <Check className="h-4 w-4" strokeWidth={2} />
                <span style={{ fontSize: 'var(--text-label)' }}>全部已讀</span>
              </motion.button>
            )}
            
            {onBack && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onBack}
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[var(--vesti-light-bg)] transition-colors"
              >
                <X className="h-5 w-5 text-[var(--vesti-dark)]" strokeWidth={2} />
              </motion.button>
            )}
          </div>
        </div>

        {/* 篩選 Tabs */}
        <div className="flex gap-2 px-5 pb-3 overflow-x-auto">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
              filter === 'all'
                ? 'bg-[var(--vesti-primary)] text-white'
                : 'bg-[var(--vesti-light-bg)] text-[var(--vesti-text-secondary)]'
            }`}
            style={{ fontSize: 'var(--text-label)' }}
          >
            全部
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter('knowledge')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
              filter === 'knowledge'
                ? 'bg-[var(--vesti-primary)] text-white'
                : 'bg-[var(--vesti-light-bg)] text-[var(--vesti-text-secondary)]'
            }`}
            style={{ fontSize: 'var(--text-label)' }}
          >
            <BookOpen className="h-3.5 w-3.5" strokeWidth={2} />
            穿搭知識
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter('wardrobe')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
              filter === 'wardrobe'
                ? 'bg-[var(--vesti-primary)] text-white'
                : 'bg-[var(--vesti-light-bg)] text-[var(--vesti-text-secondary)]'
            }`}
            style={{ fontSize: 'var(--text-label)' }}
          >
            <Shirt className="h-3.5 w-3.5" strokeWidth={2} />
            衣櫃管理
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter('system')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
              filter === 'system'
                ? 'bg-[var(--vesti-primary)] text-white'
                : 'bg-[var(--vesti-light-bg)] text-[var(--vesti-text-secondary)]'
            }`}
            style={{ fontSize: 'var(--text-label)' }}
          >
            <Info className="h-3.5 w-3.5" strokeWidth={2} />
            系統通知
          </motion.button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto pb-20">
        {notifications.length === 0 ? (
          /* 空狀態 */
          <div className="flex flex-col items-center justify-center h-full px-6 text-center">
            <div className="w-20 h-20 rounded-full bg-[var(--vesti-light-bg)] flex items-center justify-center mb-4">
              <Bell className="w-10 h-10 text-[var(--vesti-gray-mid)]" strokeWidth={1.5} />
            </div>
            <h3 className="text-[var(--vesti-dark)] mb-2" style={{ fontSize: 'var(--text-h3)' }}>
              暫無通知
            </h3>
            <p className="text-[var(--vesti-text-secondary)]" style={{ fontSize: 'var(--text-base)' }}>
              有新消息時會顯示在這裡
            </p>
          </div>
        ) : (
          <div className="py-4">
            {Object.entries(groupedNotifications).map(([group, groupNotifications]) => {
              if (groupNotifications.length === 0) return null;

              return (
                <div key={group} className="mb-6">
                  {/* 時間分組標題 */}
                  <div className="px-5 mb-3">
                    <h3
                      className="text-[var(--vesti-text-secondary)]"
                      style={{ fontSize: 'var(--text-label)', fontWeight: 600 }}
                    >
                      {group}
                    </h3>
                  </div>

                  {/* 通知列表 */}
                  <div className="space-y-2 px-4">
                    <AnimatePresence mode="popLayout">
                      {groupNotifications.map((notification) => {
                        const { Icon, color, bgColor } = getNotificationIcon(notification.type);
                        const isSwiped = swipedNotification === notification.id;

                        return (
                          <motion.div
                            key={notification.id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -100, height: 0 }}
                            className="relative overflow-hidden"
                          >
                            {/* 背景刪除按鈕 */}
                            <AnimatePresence>
                              {isSwiped && (
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  className="absolute inset-y-0 right-0 flex items-center gap-2 px-3"
                                >
                                  <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleMarkAsRead(notification.id)}
                                    className="h-16 w-16 rounded-2xl bg-[var(--vesti-primary)] flex items-center justify-center text-white"
                                  >
                                    <Check className="h-5 w-5" strokeWidth={2.5} />
                                  </motion.button>
                                  <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleDelete(notification.id)}
                                    className="h-16 w-16 rounded-2xl bg-[var(--vesti-accent)] flex items-center justify-center text-white"
                                  >
                                    <Trash2 className="h-5 w-5" strokeWidth={2.5} />
                                  </motion.button>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* 通知卡片 */}
                            <motion.div
                              drag="x"
                              dragConstraints={{ left: -160, right: 0 }}
                              dragElastic={0.1}
                              onDragEnd={(_, info) => handleDragEnd(notification.id, info)}
                              onClick={() => handleNotificationClick(notification)}
                              className={`relative bg-[var(--vesti-background)] rounded-2xl border transition-all cursor-pointer ${
                                notification.isRead
                                  ? 'border-[var(--vesti-border)]'
                                  : 'border-[var(--vesti-primary)]/20 bg-[var(--vesti-primary)]/5'
                              }`}
                              whileTap={{ scale: 0.98 }}
                            >
                              <div className="flex items-start gap-3 p-4">
                                {/* 圖標 */}
                                <div
                                  className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                                  style={{ backgroundColor: `${color}15` }}
                                >
                                  <Icon
                                    className="w-5 h-5"
                                    style={{ color }}
                                    strokeWidth={2}
                                  />
                                </div>

                                {/* 內容 */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2 mb-1">
                                    <h4
                                      className="text-[var(--vesti-dark)]"
                                      style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}
                                    >
                                      {notification.title}
                                    </h4>
                                    {!notification.isRead && (
                                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-[var(--vesti-accent)] mt-1.5" />
                                    )}
                                  </div>
                                  
                                  <p
                                    className="text-[var(--vesti-text-secondary)] mb-2 line-clamp-2"
                                    style={{ fontSize: 'var(--text-base)', fontWeight: 400 }}
                                  >
                                    {notification.message}
                                  </p>

                                  {/* 縮圖 */}
                                  {notification.imageUrl && (
                                    <div className="mb-2">
                                      <img
                                        src={notification.imageUrl}
                                        alt=""
                                        className="w-full h-32 object-cover rounded-lg"
                                      />
                                    </div>
                                  )}

                                  <div className="flex items-center justify-between">
                                    <span
                                      className="text-[var(--vesti-gray-mid)]"
                                      style={{ fontSize: 'var(--text-label)', fontWeight: 400 }}
                                    >
                                      {formatTime(notification.time)}
                                    </span>

                                    {notification.actionLabel && (
                                      <span
                                        className="text-[var(--vesti-primary)]"
                                        style={{ fontSize: 'var(--text-label)', fontWeight: 600 }}
                                      >
                                        {notification.actionLabel}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}