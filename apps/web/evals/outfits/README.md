# 穿搭考卷

用固定的 20 道題目測「推薦好不好」。每次改了穿搭守則（prompt）或推薦程式，就跑一次，看分數有沒有變好。

每一題 = **一個衣櫃**（從照片裡挑幾件）＋ **天氣** ＋ **場合**，有些題目還會模擬使用者之前按過的「不要」或「穿過」。
考卷用的是**正式推薦的同一套程式**（AI 認衣服、挑候選、回饋摘要、搭配），所以量到的就是 App 真正的表現。

## 怎麼評分

每一題有兩種分數，兩個一起看：

1. **規則檢查**（不用 AI、每次結果一樣）：抓明顯的錯。
   - 至少給出 2 套、每套都不一樣
   - AI 給的搭配都合法（有上身和下身、沒有衣櫃裡不存在的衣服）
   - 熱天沒有厚衣服、冷天有保暖層
   - 同一套的正式度接近、上班不穿拖鞋
   - 避開使用者說過「不要」的組合、不重複最近穿過的整套
2. **評審分數**（1～5 分）：請另一個 AI 當評審看照片打分數，並寫出理由。
   - 評審最好跟搭配用**不同的模型**，不然像學生改自己的考卷。在 `apps/web/.env.local` 加一行 `GEMINI_JUDGE_MODEL=模型名稱` 就能換。
   - 評審也可能看走眼，所以成績單裡有「抽查區」，列出每套搭配和評審理由，**請你偶爾看幾套**，確認分數跟你的感覺差不多。

## 第一次使用

需要 Gemini 金鑰（放在 `apps/web/.env.local` 的 `GEMINI_API_KEY`），不需要 Supabase、不需要開網站。

**1. 準備衣服照片**（二選一）

- 自動下載公開資料集的照片（約 60 張，Kaggle 的 Fashion Product Images，透過 Hugging Face）：
  ```bash
  npm run eval:outfits -- fetch
  ```
  預設下載男裝；要女裝加 `--gender Women`。
- 或自己放照片：照類別放進下面的資料夾（jpg / png / webp 都可以）。
  ```
  apps/web/evals/outfits/images/top/        上衣
  apps/web/evals/outfits/images/outerwear/  外套
  apps/web/evals/outfits/images/bottom/     褲子、裙子
  apps/web/evals/outfits/images/shoes/      鞋子
  apps/web/evals/outfits/images/accessory/  配件
  ```
  題目最多會用到：上衣 14 張、外套 6、下身 10、鞋子 6、配件 4。照片不夠，那一題會跳過並說明缺什麼。

照片只在你電腦上，**不會上傳到 GitHub**（`images/` 已設定忽略）。

**2. 先試跑 3 題**

```bash
npm run eval:outfits -- run --limit 3
```

第一次會先讓 AI 認每一張照片（結果會存起來，下次不用重跑），再開始考試。

**3. 跑完整份**

```bash
npm run eval:outfits -- run
```

成績單在 `apps/web/evals/outfits/results/`，打開 `.md` 檔就能看。

## 比較兩個版本

AI 每次的答案不一樣，比較時每題跑 3 次比較準：

```bash
npm run eval:outfits -- run --repeat 3        # 改之前跑一次
# （修改穿搭守則）
npm run eval:outfits -- run --repeat 3        # 改之後再跑一次
npm run eval:outfits -- compare results/之前.json results/之後.json
```

分數差 0.3 以內，通常只是 AI 每次答案不同，不代表真的變好或變差。

## 其他選項

| 選項 | 做什麼 |
|---|---|
| `--scenario hot-casual` | 只跑一題（題目 id 在 `scenarios.json`） |
| `--limit 5` | 只跑前 5 題 |
| `--repeat 3` | 每題跑 3 次 |
| `--no-judge` | 不請評審，只檢查規則（比較省錢） |

## 花費

完整跑一次約 40 次 AI 呼叫（20 題 × 搭配＋評審），第一次另外要辨識約 60 張照片。每次搭配最多送 30 張照片。
金鑰錯誤或額度用完時，程式會在連續失敗幾次後自動停下來。

## 檔案

| 檔案 | 內容 |
|---|---|
| `scenarios.json` | 20 道題目 |
| `rules.ts` | 規則檢查 |
| `judge.ts` | 評審的評分標準 |
| `pipeline.ts` | 考試流程（呼叫正式推薦程式） |
| `report.ts` | 成績單 |
| `fetch-images.ts` | 下載照片 |
| `run.ts` | 指令入口 |

⚠ 寫這份考卷的雲端環境連不到 Hugging Face，也沒有 Gemini 金鑰，所以 **下載照片** 和 **真正的 AI 回應** 都還沒實際跑過；
其他部分（挑衣櫃、規則、成績單、錯誤處理）已經用假的 AI 回應測過。第一次跑遇到問題，把錯誤訊息貼給 Claude。
