
import { WardrobeItem, Occasion, Style } from '@/packages/types/src/wardrobe';
import { OutfitCombination } from '@/packages/types/src/basket';
import { WeatherSummary } from '@/packages/types/src/weather';
import { WardrobeService } from '@/services/wardrobe/items.service';
import { Location } from '@/services/weather/weather.types';
import { generateOutfitCombinations } from '@/services/reco/modules/retrieval/simple';
import { weatherFitFilter, scoreCompatibility } from '@/services/reco/modules/scoring/rules';

/**
 * Service for generating daily outfit recommendations.
 */
export class DailyOutfitsService {
    /**
     * @param wardrobeService - An instance of WardrobeService to access user's items.
     * @param getWeather - An async function that returns weather summary for a location.
     */
    constructor(
        private wardrobeService: WardrobeService,
        private getWeather: (location: Location) => Promise<WeatherSummary>
    ) {}

    /**
     * Generates daily outfit recommendations for a user based on location and occasion.
     * @param userId - The ID of the user.
     * @param location - The user's current location (latitude and longitude).
     * @param occasion - The occasion for the outfits (e.g., work, casual).
     * @returns A promise that resolves to an array of recommended outfit combinations.
     */
    async generateDailyOutfits(
        userId: string,
        location: Location,
        occasion: Occasion
    ): Promise<OutfitCombination[]> {
        // 1. Load user's wardrobe
        const allItems = this.wardrobeService.getItems(userId);
        if (allItems.length < 3) { // Need at least a top, bottom, and shoes
            return [];
        }

        // 2. Get current weather summary
        const weatherSummary = await this.getWeather(location);

        // 3. Filter items based on weather
        const suitableItems = weatherFitFilter(allItems, weatherSummary);

        // 4. Generate candidate outfits
        const candidateOutfits = generateOutfitCombinations(suitableItems);
        if (candidateOutfits.length === 0) {
            return [];
        }

        // 5. Score and rank outfits
        const scoredOutfits = candidateOutfits.map(outfit => {
            const score = scoreCompatibility(outfit, occasion, weatherSummary, undefined);
            return { outfit, score };
        });

        // Sort by highest score
        scoredOutfits.sort((a, b) => b.score - a.score);

        // 6. Select up to 2 non-overlapping outfits
        const finalOutfits: OutfitCombination[] = [];
        const usedItemIds = new Set<string>();

        for (const { outfit } of scoredOutfits) {
            const outfitItems = [outfit.top, outfit.bottom, outfit.shoes, outfit.outerwear].filter(Boolean) as WardrobeItem[];
            const outfitItemIds = outfitItems.map(item => item.id);

            // Check if any item in this outfit has already been used
            const hasOverlap = outfitItemIds.some(id => usedItemIds.has(id));

            if (!hasOverlap) {
                // If no overlap, add this outfit to the results
                finalOutfits.push(outfit);

                // And add its items to the used set
                outfitItemIds.forEach(id => usedItemIds.add(id));

                // Stop when we have found 2 outfits
                if (finalOutfits.length === 2) {
                    break;
                }
            }
        }

        return finalOutfits;
    }
}
