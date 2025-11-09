#!/bin/bash

# API Test Script
# This script tests the core endpoints of the recommendation and wardrobe services.

BASE_URL="http://localhost:3000"
USER_ID="user-`date +%s`" # Create a unique user ID for each test run

# Function to check if jq is installed
command -v jq >/dev/null 2>&1 || { echo >&2 "I require jq but it's not installed. Please install it (e.g., 'apt-get install jq', 'brew install jq'). Aborting."; exit 1; }

# Header for pretty printing
_print_header() {
    echo "\n======================================================================"
    echo "  $1"
    echo "======================================================================"
}

# 1. Test: Add a new item to the wardrobe
_print_header "1. TESTING: POST /api/wardrobe/items (Add new item)"

ADD_ITEM_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
-d '{ 
  "userId": "'$USER_ID'",
  "name": "Classic Blue Jeans",
  "type": "bottom",
  "imageUrl": "http://example.com/jeans.jpg",
  "colors": ["blue"],
  "style": "casual",
  
  "season": "all-season",
  "occasions": ["casual", "daily", "travel"]
}' \
$BASE_URL/api/wardrobe/items)

if [ -z "$ADD_ITEM_RESPONSE" ]; then
    echo "Error: No response from server for adding item."
    exit 1
fi

ITEM_ID=$(echo $ADD_ITEM_RESPONSE | jq -r '.id')

echo "Server Response:"
echo $ADD_ITEM_RESPONSE | jq .

if [ "$ITEM_ID" == "null" ] || [ -z "$ITEM_ID" ]; then
    echo "\nVerification FAILED: Could not get a valid item ID from the response."
else
    echo "\nVerification PASSED: Successfully created item with ID: $ITEM_ID"
fi


# 2. Test: Retrieve items for the user
_print_header "2. TESTING: GET /api/wardrobe/items?userId=$USER_ID (Get items)"

GET_ITEMS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/wardrobe/items?userId=$USER_ID")

echo "Server Response:"
echo $GET_ITEMS_RESPONSE | jq .

ITEM_COUNT=$(echo $GET_ITEMS_RESPONSE | jq 'length')

if [ "$ITEM_COUNT" -ge 1 ]; then
    echo "\nVerification PASSED: Found $ITEM_COUNT item(s) for user $USER_ID."
else
    echo "\nVerification FAILED: Did not find any items for user $USER_ID."
fi


# 3. Test: Get daily outfit recommendations
_print_header "3. TESTING: GET /api/daily-outfits (Get recommendations)"

GET_OUTFITS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/daily-outfits?userId=$USER_ID&latitude=34.0522&longitude=-118.2437&occasion=casual")

echo "Server Response:"
echo $GET_OUTFITS_RESPONSE | jq .

OUTFIT_COUNT=$(echo $GET_OUTFITS_RESPONSE | jq 'length')

if [ "$OUTFIT_COUNT" -gt 0 ]; then
    echo "\nVerification PASSED: Received $OUTFIT_COUNT outfit recommendation(s)."
else
    echo "\nVerification FAILED or No outfits could be generated."
fi

echo "\nAPI tests complete."
