const BASE_URL = 'http://localhost:3000';
const USER_ID = `user-${Date.now()}`;

const itemsToAdd = [
  { name: 'White T-shirt', type: 'top', colors: ['white'], style: 'casual' },
  { name: 'Blue Jeans', type: 'bottom', colors: ['blue'], style: 'casual' },
  { name: 'White Sneakers', type: 'shoes', colors: ['white'], style: 'casual' },
];

/**
 * Helper function to post a single item to the wardrobe.
 * @param {object} item - The item data to post.
 * @returns {Promise<object>} The response from the server.
 */
async function postItem(item) {
  console.log(`  - Adding: ${item.name}...`);
  const response = await fetch(`${BASE_URL}/api/wardrobe/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: USER_ID,
      ...item,
      imageUrl: `http://example.com/${item.name.replace(/\s/g, '-')}.jpg`,
      season: 'all-season',
      occasions: ['casual', 'daily'],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to add item ${item.name}: ${response.status} ${response.statusText}\n${errorBody}`);
  }
  return response.json();
}

/**
 * Main test runner function.
 */
async function runTests() {
  try {
    console.log(`--- Starting API tests for user: ${USER_ID} ---\n`);

    // 1. Add items
    console.log('--- 1. Adding 3 wardrobe items... ---');
    for (const item of itemsToAdd) {
      const addedItem = await postItem(item);
      console.log(`    ✅ Added: ${addedItem.name} (ID: ${addedItem.id})`);
    }
    console.log('\n');

    // 2. Get items
    console.log('--- 2. Fetching wardrobe items... ---');
    const getItemsResponse = await fetch(`${BASE_URL}/api/wardrobe/items?userId=${USER_ID}`);
    if (!getItemsResponse.ok) {
      throw new Error(`Failed to get items: ${getItemsResponse.status} ${getItemsResponse.statusText}`);
    }
    const items = await getItemsResponse.json();
    console.log(`  ✅ Found ${items.length} items for user ${USER_ID}.`);
    // console.log(JSON.stringify(items, null, 2)); // Uncomment for full details
    console.log('\n');

    // 3. Get outfits
    console.log('--- 3. Fetching daily outfit recommendation... ---');
    const outfitUrl = `${BASE_URL}/api/daily-outfits?userId=${USER_ID}&latitude=40.7&longitude=-74&occasion=casual`;
    console.log(`  - Calling: ${outfitUrl}`);
    const outfitResponse = await fetch(outfitUrl);
    if (!outfitResponse.ok) {
      const errorBody = await outfitResponse.text();
      throw new Error(`Failed to get outfits: ${outfitResponse.status} ${outfitResponse.statusText}\n${errorBody}`);
    }
    const outfits = await outfitResponse.json();
    console.log(`  ✅ Found ${outfits.length} outfit recommendation(s).`);
    console.log(JSON.stringify(outfits, null, 2));
    console.log('\n');

    console.log('--- API tests completed successfully! ---');

  } catch (error) {
    console.error('🚨 Test run failed:', error.message);
    process.exit(1);
  }
}

runTests();
