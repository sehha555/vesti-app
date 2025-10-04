export const VQA_OUTFIT_KEYWORDS_PROMPT = (imageUrl: string) => `
Analyze the clothing item in the image at ${imageUrl}.
Identify key attributes such as:
- Main color
- Material (e.g., cotton, wool, denim, leather)
- Style (e.g., casual, formal, sporty, bohemian)
- Seasonality (e.g., summer, winter, all-season)
- Occasion suitability (e.g., everyday, work, party, outdoor)
- Any prominent patterns or textures
- General description

Return these attributes as a comma-separated list of keywords.
Example: "blue, denim, casual, all-season, everyday, jacket, sturdy"
`;