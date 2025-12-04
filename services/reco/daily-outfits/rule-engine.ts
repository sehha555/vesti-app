import { WardrobeItem } from '@/packages/types/src/wardrobe';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 氣溫規則定義
 */
interface TemperatureRule {
  condition: {
    temp_min: number;
    temp_max: number;
  };
  filters: {
    required_types: string[];
    optional_types: string[];
    seasons: string[];
    materials?: string[];
    avoid_materials?: string[];
  };
  description: string;
}

/**
 * 場合規則定義
 */
interface OccasionRule {
  preferred_styles: string[];
  avoid_styles: string[];
  color_preference: string;
  avoid_colors?: string[];
  required_colors?: string[];
  description: string;
}

/**
 * 完整規則結構
 */
interface DailyOutfitRules {
  temperature_rules: TemperatureRule[];
  occasion_rules: Record<string, OccasionRule>;
  color_compatibility: Record<string, string[]>;
  style_compatibility: Record<string, string[]>;
  scoring_weights: {
    weather_match: number;
    occasion_match: number;
    color_harmony: number;
    style_consistency: number;
    variety: number;
  };
  output_settings: {
    max_recommendations: number;
    min_items_per_outfit: number;
    max_items_per_outfit: number;
    max_color_variety: number;
    prefer_complete_outfits: boolean;
  };
}

/**
 * 穿搭候選項
 */
export interface OutfitCandidate {
  id: string;
  items: WardrobeItem[];
  score?: number;
  reasons?: string[];
}

/**
 * 天氣資訊（簡化版 - 僅供內部使用）
 *
 * 注意：完整的 WeatherInfo 定義在 @/services/weather/open-weather.service
 * 這裡僅定義 Rule Engine 需要的最小子集
 */
export interface WeatherInfoSubset {
  temp_c: number; // 攝氏溫度
  condition?: string; // 天氣狀況（Clear, Rain, Clouds 等）
  humidity?: number;
}

/**
 * 每日穿搭規則引擎
 *
 * 負責從 JSON 規則檔載入規則，並根據天氣、場合等條件篩選與組合衣物
 */
export class DailyOutfitRuleEngine {
  private rules: DailyOutfitRules | null = null;

  constructor() {
    // 路徑解析延遲到 loadRules()，以支援多環境
  }

  /**
   * 嘗試從多個可能的路徑載入規則檔
   *
   * 支援以下執行環境：
   * 1. apps/web 目錄執行（Next.js dev server）
   * 2. Monorepo root 執行
   * 3. 編譯後的環境（使用 __dirname）
   */
  private findRulesPath(): string | null {
    const possiblePaths = [
      // 路徑 1: 當在 Monorepo root 執行時
      path.join(process.cwd(), 'services', 'reco', 'daily-outfits', 'daily-outfits-rules.json'),

      // 路徑 2: 當在 apps/web 目錄執行時 (Next.js 預設 - 需要回溯兩層)
      path.join(process.cwd(), '..', '..', 'services', 'reco', 'daily-outfits', 'daily-outfits-rules.json'),

      // 路徑 3: 當在 apps/* 子目錄執行時
      path.join(process.cwd(), '..', 'services', 'reco', 'daily-outfits', 'daily-outfits-rules.json'),

      // 路徑 4: 使用 __dirname（編譯後相對路徑）
      path.join(__dirname, 'daily-outfits-rules.json'),

      // 路徑 5: 嘗試從 apps/web 下的 services（如果有符號連結或複製）
      path.join(process.cwd(), 'services', 'reco', 'daily-outfits', 'daily-outfits-rules.json'),
    ];

    console.log('[DailyOutfitRuleEngine] Searching for rules file...');
    console.log('[DailyOutfitRuleEngine] process.cwd():', process.cwd());
    console.log('[DailyOutfitRuleEngine] __dirname:', __dirname);

    for (const filepath of possiblePaths) {
      try {
        if (fs.existsSync(filepath)) {
          console.log('[DailyOutfitRuleEngine] Found rules at:', filepath);
          return filepath;
        } else {
          console.log('[DailyOutfitRuleEngine] Not found:', filepath);
        }
      } catch (error) {
        console.log('[DailyOutfitRuleEngine] Error checking:', filepath, error);
      }
    }

    console.error('[DailyOutfitRuleEngine] Failed to find rules file in any of the following locations:');
    possiblePaths.forEach((p, i) => {
      console.error(`  ${i + 1}. ${p}`);
    });

    return null;
  }

  /**
   * 載入規則檔（同步載入並快取）
   *
   * 實作強健的錯誤處理：
   * - 如果找不到檔案，回傳預設規則而非 crash
   * - 快取載入結果以提升效能
   */
  loadRules(): DailyOutfitRules {
    // 如果已經載入過，直接回傳快取
    if (this.rules) {
      return this.rules;
    }

    try {
      // 嘗試找到規則檔路徑
      const rulesPath = this.findRulesPath();

      if (!rulesPath) {
        console.warn('[DailyOutfitRuleEngine] Rules file not found, using default rules');
        this.rules = this.getDefaultRules();
        return this.rules;
      }

      // 讀取並解析 JSON
      console.log('[DailyOutfitRuleEngine] Loading rules from:', rulesPath);
      const rulesContent = fs.readFileSync(rulesPath, 'utf-8');
      this.rules = JSON.parse(rulesContent) as DailyOutfitRules;

      console.log('[DailyOutfitRuleEngine]  Rules loaded successfully');
      console.log('[DailyOutfitRuleEngine] Temperature rules:', this.rules.temperature_rules.length);
      console.log('[DailyOutfitRuleEngine] Occasion rules:', Object.keys(this.rules.occasion_rules).join(', '));

      return this.rules;
    } catch (error) {
      console.error('[DailyOutfitRuleEngine]  Failed to load daily outfit rules:', error);

      if (error instanceof Error) {
        console.error('[DailyOutfitRuleEngine] Error details:', error.message);
        console.error('[DailyOutfitRuleEngine] Stack trace:', error.stack);
      }

      console.warn('[DailyOutfitRuleEngine]   Falling back to default rules');

      // 回傳預設規則以避免 API crash
      this.rules = this.getDefaultRules();
      return this.rules;
    }
  }

  /**
   * 根據天氣篩選衣物
   */
  filterByWeather(items: WardrobeItem[], weather: WeatherInfoSubset): WardrobeItem[] {
    const rules = this.loadRules();
    const temp = weather.temp_c;

    // 找到符合溫度的規則
    const matchedRule = rules.temperature_rules.find(
      (rule) => temp >= rule.condition.temp_min && temp <= rule.condition.temp_max
    );

    if (!matchedRule) {
      console.warn(`No temperature rule matched for ${temp}°C, returning all items`);
      return items;
    }

    // 根據規則篩選
    return items.filter((item) => {
      // 檢查季節
      if (matchedRule.filters.seasons.length > 0) {
        if (!item.season || !matchedRule.filters.seasons.includes(item.season)) {
          return false;
        }
      }

      // 檢查避免的材質
      if (matchedRule.filters.avoid_materials && matchedRule.filters.avoid_materials.length > 0) {
        if (item.material && matchedRule.filters.avoid_materials.some((m) => item.material?.toLowerCase().includes(m.toLowerCase()))) {
          return false;
        }
      }

      // 檢查推薦的材質（寬鬆條件，有材質資訊時才檢查）
      if (matchedRule.filters.materials && matchedRule.filters.materials.length > 0 && item.material) {
        const hasRecommendedMaterial = matchedRule.filters.materials.some((m) =>
          item.material?.toLowerCase().includes(m.toLowerCase())
        );
        // 如果有材質資訊但不符合推薦材質，降低優先級但不排除
        // 這裡先保留，後續在評分時處理
      }

      return true;
    });
  }

  /**
   * 根據場合篩選衣物
   */
  filterByOccasion(items: WardrobeItem[], occasion: string): WardrobeItem[] {
    const rules = this.loadRules();
    const occasionRule = rules.occasion_rules[occasion.toLowerCase()];

    if (!occasionRule) {
      console.warn(`No occasion rule found for "${occasion}", returning all items`);
      return items;
    }

    return items.filter((item) => {
      // 檢查是否為避免的風格
      if (occasionRule.avoid_styles && occasionRule.avoid_styles.length > 0) {
        if (item.style && occasionRule.avoid_styles.includes(item.style)) {
          return false;
        }
      }

      // 檢查是否為避免的顏色
      if (occasionRule.avoid_colors && occasionRule.avoid_colors.length > 0) {
        if (item.colors && item.colors.some((color) => occasionRule.avoid_colors!.includes(color))) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * 生成穿搭候選項
   *
   * 根據類型組合出 (top + bottom [+ outerwear] [+ shoes]) 的候選項
   */
  generateOutfitCandidates(
    items: WardrobeItem[],
    weather: WeatherInfoSubset,
    occasion: string
  ): OutfitCandidate[] {
    const rules = this.loadRules();
    const candidates: OutfitCandidate[] = [];

    // 按類型分組
    const tops = items.filter((item) => item.type === 'top');
    const bottoms = items.filter((item) => item.type === 'bottom');
    const outerwears = items.filter((item) => item.type === 'outerwear');
    const shoes = items.filter((item) => item.type === 'shoes');

    // 基本組合：top + bottom
    for (const top of tops) {
      for (const bottom of bottoms) {
        const outfitItems = [top, bottom];

        // 檢查顏色相容性
        if (!this.checkColorCompatibility(outfitItems)) {
          continue; // 顏色不搭配，跳過
        }

        // 檢查風格一致性
        if (!this.checkStyleCompatibility(outfitItems)) {
          continue; // 風格不一致，跳過
        }

        // 根據天氣決定是否需要外套
        const temp = weather.temp_c;
        const needsOuterwear = temp < 20;

        if (needsOuterwear && outerwears.length > 0) {
          // 嘗試加入外套
          for (const outerwear of outerwears.slice(0, 3)) { // 限制外套選項，避免組合爆炸
            const withOuterwear = [...outfitItems, outerwear];
            if (this.checkColorCompatibility(withOuterwear) && this.checkStyleCompatibility(withOuterwear)) {
              // 可選：加入鞋子
              if (shoes.length > 0) {
                const withShoes = [...withOuterwear, shoes[0]];
                if (this.checkColorCompatibility(withShoes)) {
                  candidates.push({
                    id: `outfit-${candidates.length + 1}`,
                    items: withShoes,
                  });
                }
              } else {
                candidates.push({
                  id: `outfit-${candidates.length + 1}`,
                  items: withOuterwear,
                });
              }
            }
          }
        } else {
          // 不需要外套，可選加入鞋子
          if (shoes.length > 0) {
            const withShoes = [...outfitItems, shoes[0]];
            if (this.checkColorCompatibility(withShoes)) {
              candidates.push({
                id: `outfit-${candidates.length + 1}`,
                items: withShoes,
              });
            }
          } else {
            candidates.push({
              id: `outfit-${candidates.length + 1}`,
              items: outfitItems,
            });
          }
        }

        // 限制候選數量，避免過多
        if (candidates.length >= rules.output_settings.max_recommendations * 3) {
          break;
        }
      }

      if (candidates.length >= rules.output_settings.max_recommendations * 3) {
        break;
      }
    }

    return candidates;
  }

  /**
   * 檢查顏色相容性
   *
   * 使用規則中的 color_compatibility 來檢查顏色是否搭配
   */
  private checkColorCompatibility(items: WardrobeItem[]): boolean {
    const rules = this.loadRules();
    const maxColorVariety = rules.output_settings.max_color_variety;

    // 收集所有顏色
    const allColors = items.flatMap((item) => item.colors || []);
    const uniqueColors = Array.from(new Set(allColors));

    // 檢查主色數量
    if (uniqueColors.length > maxColorVariety) {
      return false; // 主色超過限制
    }

    // 檢查兩兩顏色是否相容
    for (let i = 0; i < uniqueColors.length; i++) {
      for (let j = i + 1; j < uniqueColors.length; j++) {
        const color1 = uniqueColors[i];
        const color2 = uniqueColors[j];

        const compatibleColors = rules.color_compatibility[color1] || [];
        if (!compatibleColors.includes(color2)) {
          // 檢查反向
          const reverseCompatible = rules.color_compatibility[color2] || [];
          if (!reverseCompatible.includes(color1)) {
            return false; // 顏色不相容
          }
        }
      }
    }

    return true;
  }

  /**
   * 檢查風格一致性
   *
   * 使用規則中的 style_compatibility 來檢查風格是否一致
   */
  private checkStyleCompatibility(items: WardrobeItem[]): boolean {
    const rules = this.loadRules();

    // 收集所有風格
    const styles = items.map((item) => item.style).filter(Boolean) as string[];
    if (styles.length === 0) return true; // 沒有風格資訊，預設相容

    const uniqueStyles = Array.from(new Set(styles));
    if (uniqueStyles.length === 1) return true; // 所有風格相同，一定相容

    // 檢查兩兩風格是否相容
    for (let i = 0; i < uniqueStyles.length; i++) {
      for (let j = i + 1; j < uniqueStyles.length; j++) {
        const style1 = uniqueStyles[i];
        const style2 = uniqueStyles[j];

        const compatibleStyles = rules.style_compatibility[style1] || [];
        if (!compatibleStyles.includes(style2)) {
          // 檢查反向
          const reverseCompatible = rules.style_compatibility[style2] || [];
          if (!reverseCompatible.includes(style1)) {
            return false; // 風格不一致
          }
        }
      }
    }

    return true;
  }

  /**
   * 預設規則（當規則檔載入失敗時使用）
   */
  private getDefaultRules(): DailyOutfitRules {
    return {
      temperature_rules: [
        {
          condition: { temp_min: -999, temp_max: 999 },
          filters: {
            required_types: ['top', 'bottom'],
            optional_types: [],
            seasons: [],
          },
          description: '預設規則',
        },
      ],
      occasion_rules: {
        casual: {
          preferred_styles: ['casual'],
          avoid_styles: [],
          color_preference: 'any',
          description: '休閒',
        },
      },
      color_compatibility: {
        black: ['white', 'gray'],
        white: ['black', 'gray'],
      },
      style_compatibility: {
        casual: ['casual'],
      },
      scoring_weights: {
        weather_match: 0.35,
        occasion_match: 0.25,
        color_harmony: 0.20,
        style_consistency: 0.15,
        variety: 0.05,
      },
      output_settings: {
        max_recommendations: 5,
        min_items_per_outfit: 2,
        max_items_per_outfit: 4,
        max_color_variety: 3,
        prefer_complete_outfits: true,
      },
    };
  }
}
