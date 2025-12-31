/**
 * Daily Outfits Service (stub)
 * Real implementation is in /services/reco
 */

export class DailyOutfitsService {
  static async generateRecommendations() {
    return {
      outfits: [],
      date: new Date().toISOString(),
    };
  }
}
