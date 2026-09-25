import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage, H2, OPERATOR, CONTACT_EMAIL } from '../LegalPage';
import { SHOP_DISCLOSURE } from '@/lib/links/outbound';

export const metadata: Metadata = { title: '服務條款 - Vesti' };

export default function TermsPage() {
  return (
    <LegalPage title="服務條款" updated="2026-09-25">
      <p>
        歡迎使用 Vesti。Vesti 由{OPERATOR}營運，提供衣櫃整理與 AI 穿搭建議。註冊或使用本服務，即表示您同意本條款與
        <Link href="/legal/privacy">隱私權政策</Link>。
      </p>

      <H2>一、服務內容</H2>
      <p>
        我們依您的衣櫃、天氣與回饋提供穿搭建議。建議僅供參考，AI 可能判斷錯誤（例如認錯衣物類別或顏色），我們不保證建議適合每個場合。
      </p>

      <H2>二、外部購物連結</H2>
      <p>
        Vesti 不販售商品、不經手付款，也不是商品的出賣人。點選「前往購買」會開啟第三方商店網站，
        交易、付款、出貨、退換貨與七日猶豫期等事項，由該商店依其條款與相關法令負責。
      </p>
      <p>{SHOP_DISCLOSURE}</p>

      <H2>三、您上傳的內容</H2>
      <ul>
        <li>您保證有權使用您上傳的照片與貼上的網址，且不侵害他人的著作權、肖像權或隱私。</li>
        <li>照片中若有他人，請先取得同意；請盡量不要拍到臉部。</li>
        <li>內容的權利仍屬於您。您授權我們在提供服務所需的範圍內保存、處理（例如去背、交給 AI 分析）與對您本人顯示這些內容。衣櫃內容不會公開給其他使用者。</li>
        <li>貼上商品網址時，我們的程式（VestiBot）只會代您抓取該頁的商品圖片，並遵守網站的 robots.txt，詳見<Link href="/legal/bot">VestiBot 說明</Link>。</li>
      </ul>

      <H2>四、權利人檢舉</H2>
      <p>
        若您認為 Vesti 上的內容侵害您的權利，請寄信至 {CONTACT_EMAIL}，註明您的身分、權利內容、相關網址或截圖。
        我們收到後會盡速處理，必要時移除內容並通知上傳者。
      </p>

      <H2>五、禁止行為</H2>
      <p>不得以自動化方式大量存取本服務、嘗試存取他人資料、干擾系統運作，或利用本服務抓取您無權使用的內容。</p>

      <H2>六、帳號</H2>
      <p>
        請妥善保管密碼。您可以隨時在「個人」頁刪除帳號，刪除後資料無法復原。違反本條款時，我們得暫停或終止您的帳號。
      </p>

      <H2>七、責任限制</H2>
      <p>在法律允許範圍內，我們對第三方商店的商品與交易、以及因服務中斷造成的損失不負責任；但依法不得排除的責任不在此限。</p>

      <H2>八、條款修改與準據法</H2>
      <p>
        條款修改時會更新本頁日期，重大變更會在 App 內通知。本條款以中華民國法律為準據法，並以〔臺灣臺北地方法院〕為第一審管轄法院。
      </p>
    </LegalPage>
  );
}
