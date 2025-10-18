
import { WardrobeItem, Occasion, Style } from '@/packages/types/src/wardrobe';
import { OutfitCombination } from '@/packages/types/src/basket';
import { WeatherSummary } from '@/packages/types/src/weather';
import { WardrobeService } from '../../../wardrobe/items.service';
import { Location } from '../../../weather/weather.types';
import { generateOutfitCombinations } from '../../modules/retrieval/simple';
import { weatherFitFilter, scoreCompatibility } from '../../modules/scoring/rules';

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
        if (allItems.length === 0) {
            return []; // Cannot generate outfits without items
        }

        // 2. Get current weather summary
        const weatherSummary = await this.getWeather(location);

        // 3. Filter items based on weather
        // Note: weatherFitFilter is a placeholder and needs a proper implementation
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

        // 6. Select top 2 diverse outfits
        const finalOutfits: OutfitCombination[] = [];
        if (scoredOutfits.length > 0) {
            finalOutfits.push(scoredOutfits[0].outfit);
        }

        if (scoredOutfits.length > 1) {
            // Find a second outfit that is sufficiently different from the first
            const firstOutfitStyle = scoredOutfits[0].outfit.top.style;
            for (let i = 1; i < scoredOutfits.length; i++) {
                const candidateOutfit = scoredOutfits[i].outfit;
                // Diversity check: prefer a different style or at least a different top
                if (candidateOutfit.top.style !== firstOutfitStyle || candidateOutfit.top.id !== finalOutfits[0].top.id) {
                    finalOutfits.push(candidateOutfit);
                    break;
                }
            }
            // If no "diverse" outfit was found, just add the second-best one
            if (finalOutfits.length < 2) {
                finalOutfits.push(scoredOutfits[1].outfit);
            }
        }

        return finalOutfits;
    }
}
