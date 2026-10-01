import type { Metadata } from 'next';
import { LegalPage, H2, CONTACT_EMAIL } from '../LegalPage';

export const metadata: Metadata = { title: 'VestiBot 說明 - Vesti' };

const CODE = { background: '#f3f4f6', borderRadius: 8, padding: '10px 12px', fontSize: 13, whiteSpace: 'pre-wrap' as const, wordBreak: 'break-all' as const };

// 部署後把 VESTI_BOT_INFO_URL 設成這頁的網址，VestiBot 的 User-Agent 會附上它
export default function BotPage() {
  return (
    <LegalPage title="VestiBot 說明" updated="2026-09-25">
      <p>VestiBot 是 Vesti 用來抓取商品圖片的程式。如果您在網站紀錄裡看到它，以下說明它做什麼、以及如何要求它停止。</p>

      <H2>VestiBot 會做什麼</H2>
      <ul>
        <li>只在 Vesti 使用者主動貼上某個商品網址、要把自己的衣服加進衣櫃時才會連線；不會自行爬取、也不跟隨頁面上的其他連結。</li>
        <li>每次只讀取該商品頁，取出商品圖片網址（例如 og:image），再下載少數幾張商品圖片。</li>
        <li>圖片去背後只存在該使用者的私人衣櫃，不會公開給其他人，並標示圖片來源網站。</li>
        <li>每位使用者 10 分鐘內最多 10 次，且不嘗試繞過登入、驗證碼或其他防護。</li>
      </ul>

      <H2>如何辨識</H2>
      <p>VestiBot 的 User-Agent 會包含：</p>
      <pre style={CODE}>Mozilla/5.0 (compatible; VestiBot/1.0; +本頁網址)</pre>

      <H2>如何阻擋</H2>
      <p>VestiBot 遵守 robots.txt（RFC 9309）。要禁止 VestiBot 抓取整個網站，請在 robots.txt 加上：</p>
      <pre style={CODE}>{'User-agent: VestiBot\nDisallow: /'}</pre>
      <p>
        robots.txt 暫時無法讀取（伺服器錯誤或連不上）時，VestiBot 會當作全部禁止。使用者貼上被禁止的網址時，Vesti 會請對方改用拍照上傳。
      </p>

      <H2>聯絡我們</H2>
      <p>如有任何問題，或希望我們把您的網域加入封鎖名單，請寄信至 {CONTACT_EMAIL}。</p>
    </LegalPage>
  );
}
