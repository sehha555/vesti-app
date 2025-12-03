import { WardrobeItem } from '@/packages/types/src/wardrobe';
import { DailyOutfitRuleEngine, OutfitCandidate, WeatherInfoSubset } from './rule-engine';
import { WeatherInfo } from '@/services/weather/open-weather.service';

/**
 * 前端期望的每日穿搭型別
 */
export interface DailyOutfit {
  id: string;
  title: string;
  description: string;
  heroImageUrl: string;
  items: {
    id: string;
    name: string;
    imageUrl: string;
  }[];
}

/**
 * Hybrid 引擎模式
 */
export type HybridMode = 'rule-only' | 'hybrid';

/**
 * 生成推薦的選項
 */
export interface GenerateRecommendationsOptions {
  items: WardrobeItem[];
  weather: WeatherInfo;
  occasion?: string;
  mode?: HybridMode;
}

/**
 * Hybrid 每日穿搭引擎
 *
 * 負責整合規則引擎與 AI 模型，生成最終的每日穿搭推薦
 *
 * 架構設計：
 * - Rule-only 模式：純粹使用 JSON 規則篩選與組合
 * - Hybrid 模式：規則篩選候選 + AI 模型打分與重排序
 */
export class HybridDailyOutfitEngine {
  private ruleEngine: DailyOutfitRuleEngine;

  constructor() {
    this.ruleEngine = new DailyOutfitRuleEngine();
  }

  /**
   * 生成每日穿搭推薦
   *
   * @param options - 生成選項
   * @returns 推薦的穿搭列表
   */
  async generateRecommendations(options: GenerateRecommendationsOptions): Promise<DailyOutfit[]> {
    const { items, weather, occasion = 'casual', mode = 'rule-only' } = options;

    // 沒有衣物，直接回傳空陣列
    if (!items || items.length === 0) {
      console.warn('No wardrobe items provided');
      return [];
    }

    // 階段 1: 使用規則引擎篩選與生成候選
    const candidates = await this.generateRuleBasedCandidates(items, weather, occasion);

    if (candidates.length === 0) {
      console.warn('No outfit candidates generated from rules');
      return [];
    }

    // 階段 2: 根據模式選擇處理方式
    let finalCandidates: OutfitCandidate[];

    if (mode === 'rule-only') {
      // Rule-only 模式：直接使用規則篩選結果
      finalCandidates = this.selectTopCandidates(candidates, 5);
    } else {
      // Hybrid 模式：加入 AI 評分（未來實作）
      finalCandidates = await this.applyAIScoring(candidates, weather, occasion);
    }

    // 階段 3: 轉換為前端期望的 DailyOutfit 格式
    const dailyOutfits = this.convertToDailyOutfits(finalCandidates, weather, occasion);

    return dailyOutfits;
  }

  /**
   * 使用規則引擎生成候選穿搭
   */
  private async generateRuleBasedCandidates(
    items: WardrobeItem[],
    weather: WeatherInfo,
    occasion: string
  ): Promise<OutfitCandidate[]> {
    // 將完整的 WeatherInfo 轉換為 Rule Engine 需要的子集
    const weatherSubset: WeatherInfoSubset = {
      temp_c: weather.temp_c,
      condition: weather.condition,
      humidity: weather.humidity,
    };

    // 1. 根據天氣篩選
    const weatherFiltered = this.ruleEngine.filterByWeather(items, weatherSubset);

    // 2. 根據場合篩選
    const occasionFiltered = this.ruleEngine.filterByOccasion(weatherFiltered, occasion);

    // 3. 生成候選組合
    const candidates = this.ruleEngine.generateOutfitCandidates(occasionFiltered, weatherSubset, occasion);

    return candidates;
  }

  /**
   * 應用 AI 評分（Hybrid 模式）
   *
   * TODO: 未來在這裡加入 AI 模型打分
   * - 輸入: 規則引擎生成的候選穿搭 (OutfitCandidate[])
   * - 處理: 使用 LLM 或 Multimodal Model 對每套穿搭打分
   *   * 可以使用 OpenAI GPT-4 Vision API 分析穿搭圖片
   *   * 或使用自訓練的穿搭評分模型
   * - 輸出: 帶有 AI 分數的候選穿搭，並根據分數重新排序
   *
   * 範例 AI 評分流程：
   * 1. 將候選穿搭的圖片與資訊轉成 prompt
   * 2. 呼叫 LLM API (如 GPT-4 Vision)
   * 3. 取得 AI 評分 (0-100)
   * 4. 將 AI 分數與規則分數加權平均
   * 5. 根據最終分數排序
   */
  private async applyAIScoring(
    candidates: OutfitCandidate[],
    weather: WeatherInfo,
    occasion: string
  ): Promise<OutfitCandidate[]> {
    console.log('[Hybrid Mode] AI scoring is not implemented yet, falling back to rule-only');

    // TODO: 實作 AI 評分邏輯
    // const scoredCandidates = await Promise.all(
    //   candidates.map(async (candidate) => {
    //     const aiScore = await this.callAIModel(candidate, weather, occasion);
    //     return {
    //       ...candidate,
    //       score: aiScore,
    //     };
    //   })
    // );
    //
    // // 根據 AI 分數排序
    // scoredCandidates.sort((a, b) => (b.score || 0) - (a.score || 0));
    //
    // return this.selectTopCandidates(scoredCandidates, 5);

    // 暫時回傳規則篩選結果
    return this.selectTopCandidates(candidates, 5);
  }

  /**
   * 選擇前 N 個候選
   *
   * 使用簡單的多樣性演算法，確保推薦的穿搭有變化
   */
  private selectTopCandidates(candidates: OutfitCandidate[], topN: number): OutfitCandidate[] {
    if (candidates.length <= topN) {
      return candidates;
    }

    // 簡單的多樣性選擇：確保不同候選使用不同的單品
    const selected: OutfitCandidate[] = [];
    const usedItemIds = new Set<string>();

    for (const candidate of candidates) {
      // 檢查是否與已選擇的候選有重疊
      const hasOverlap = candidate.items.some((item) => usedItemIds.has(item.id));

      if (!hasOverlap || selected.length === 0) {
        selected.push(candidate);
        candidate.items.forEach((item) => usedItemIds.add(item.id));

        if (selected.length >= topN) {
          break;
        }
      }
    }

    // 如果還不足 topN，補充候選（允許重疊）
    if (selected.length < topN) {
      for (const candidate of candidates) {
        if (!selected.includes(candidate)) {
          selected.push(candidate);
          if (selected.length >= topN) {
            break;
          }
        }
      }
    }

    return selected;
  }

  /**
   * 轉換為前端期望的 DailyOutfit 格式
   */
  private convertToDailyOutfits(
    candidates: OutfitCandidate[],
    weather: WeatherInfo,
    occasion: string
  ): DailyOutfit[] {
    return candidates.map((candidate, index) => {
      // 生成標題
      const title = this.generateOutfitTitle(candidate, weather, occasion, index);

      // 生成描述
      const description = this.generateOutfitDescription(candidate, weather, occasion);

      // 選擇 heroImageUrl（優先使用上衣或外套的圖片）
      const heroItem =
        candidate.items.find((item) => item.type === 'outerwear') ||
        candidate.items.find((item) => item.type === 'top') ||
        candidate.items[0];
      const heroImageUrl = heroItem?.imageUrl || '';

      // 轉換 items 格式
      const items = candidate.items.map((item) => ({
        id: item.id,
        name: item.name,
        imageUrl: item.imageUrl,
      }));

      return {
        id: candidate.id,
        title,
        description,
        heroImageUrl,
        items,
      };
    });
  }

  /**
   * 生成穿搭標題
   */
  private generateOutfitTitle(
    candidate: OutfitCandidate,
    weather: WeatherInfo,
    occasion: string,
    index: number
  ): string {
    const temp = weather.temp_c;

    // 根據溫度與場合生成標題
    const tempDescriptions: Record<string, string> = {
      cold: '保暖',
      cool: '微涼',
      warm: '舒適',
      hot: '清涼',
    };

    const occasionDescriptions: Record<string, string> = {
      casual: '休閒',
      work: '上班',
      date: '約會',
      formal: '正式',
      outdoor: '戶外',
    };

    let tempCategory: string;
    if (temp < 10) tempCategory = 'cold';
    else if (temp < 20) tempCategory = 'cool';
    else if (temp < 28) tempCategory = 'warm';
    else tempCategory = 'hot';

    const tempDesc = tempDescriptions[tempCategory] || '舒適';
    const occasionDesc = occasionDescriptions[occasion.toLowerCase()] || occasion;

    // 取得主要風格
    const styles = candidate.items.map((item) => item.style).filter(Boolean);
    const mainStyle = styles.length > 0 ? styles[0] : null;

    const styleDescriptions: Record<string, string> = {
      casual: '輕鬆',
      formal: '典雅',
      sporty: '運動',
      elegant: '優雅',
      business: '專業',
      streetwear: '街頭',
      minimalist: '簡約',
    };

    const styleDesc = mainStyle ? styleDescriptions[mainStyle] || mainStyle : '';

    return `${tempDesc}${occasionDesc}風 ${styleDesc ? `- ${styleDesc}` : ''}`.trim();
  }

  /**
   * 生成穿搭描述
   */
  private generateOutfitDescription(
    candidate: OutfitCandidate,
    weather: WeatherInfo,
    occasion: string
  ): string {
    const itemNames = candidate.items.map((item) => item.name);

    // 組合描述
    const itemsDesc = itemNames.join('、');

    return `搭配 ${itemsDesc}，適合 ${weather.temp_c}°C 的天氣`;
  }

  /**
   * TODO: 呼叫 AI 模型進行評分
   *
   * 未來可整合：
   * - OpenAI GPT-4 Vision API
   * - Google Gemini Vision API
   * - 自訓練的穿搭評分模型
   *
   * @param candidate - 候選穿搭
   * @param weather - 天氣資訊
   * @param occasion - 場合
   * @returns AI 評分 (0-100)
   */
  // private async callAIModel(
  //   candidate: OutfitCandidate,
  //   weather: WeatherInfo,
  //   occasion: string
  // ): Promise<number> {
  //   // 範例 Prompt 結構:
  //   // const prompt = `
  //   //   請評分以下穿搭組合 (0-100):
  //   //   - 單品: ${candidate.items.map(i => i.name).join(', ')}
  //   //   - 天氣: ${weather.temperature}°C
  //   //   - 場合: ${occasion}
  //   //   - 考量因素: 顏色搭配、風格一致性、天氣適合度
  //   // `;
  //   //
  //   // const response = await openai.chat.completions.create({
  //   //   model: 'gpt-4-vision-preview',
  //   //   messages: [{ role: 'user', content: prompt }],
  //   // });
  //   //
  //   // return parseInt(response.choices[0].message.content);
  //
  //   return 0;
  // }
}
