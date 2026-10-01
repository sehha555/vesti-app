import { redirect } from 'next/navigation';

/**
 * /daily - 舊的每日推薦頁
 * 首頁（/）已經有同樣的每日穿搭卡片，這頁的資料格式也早就跟 /api/daily-outfits 對不上，
 * 直接導回首頁，避免舊連結看到「衣服不夠」的錯誤畫面。
 */
export default function DailyPage() {
  redirect('/');
}
