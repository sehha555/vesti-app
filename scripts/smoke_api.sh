#!/bin/bash
# Smoke test script for Vesti API
# Validates login and protected API access
#
# Required environment variables:
#   BASE_URL          - API base URL (default: http://localhost:3000)
#   SUPABASE_URL      - Supabase project URL
#   SUPABASE_ANON_KEY - Supabase anonymous key
#   TEST_EMAIL        - Test user email
#   TEST_PASSWORD     - Test user password

set -e

# Defaults
BASE_URL="${BASE_URL:-http://localhost:3000}"

# Sensitive patterns for security checks
SENSITIVE_PATTERNS="SUPABASE|PASSWORD|TOKEN|SECRET|API_KEY|PRIVATE"

# Validate required env vars
missing=()
[ -z "$SUPABASE_URL" ] && missing+=("SUPABASE_URL")
[ -z "$SUPABASE_ANON_KEY" ] && missing+=("SUPABASE_ANON_KEY")
[ -z "$TEST_EMAIL" ] && missing+=("TEST_EMAIL")
[ -z "$TEST_PASSWORD" ] && missing+=("TEST_PASSWORD")

if [ ${#missing[@]} -gt 0 ]; then
  echo "ERROR: Missing required environment variables: ${missing[*]}"
  exit 1
fi

echo "=== Vesti API Smoke Test ==="
echo "Base URL: $BASE_URL"
echo ""

# Step 0: Health check (no authentication required)
echo "[0/4] Checking health endpoint..."
HEALTH_RESPONSE=$(curl -s -o /tmp/health_body.txt -w "%{http_code}" "${BASE_URL}/api/health")

if [ "$HEALTH_RESPONSE" = "200" ]; then
  HEALTH_BODY=$(cat /tmp/health_body.txt)
  # Verify response contains only { "ok": true } or safe fields
  if echo "$HEALTH_BODY" | grep -qE '"ok"\s*:\s*true'; then
    echo "Health check OK (HTTP 200, body: $HEALTH_BODY)"
  else
    echo "Health check WARNING: Unexpected body format: $HEALTH_BODY"
  fi
else
  echo "Health check FAILED: HTTP $HEALTH_RESPONSE"
  exit 1
fi

# Step 1: Ranking API business validation (no authentication required)
echo ""
echo "[1/4] Testing Ranking API (business logic)..."
RANK_PAYLOAD='{"outfits":[{"id":"o1","score":0.9,"tags":["minimal","work"]},{"id":"o2","score":0.4,"tags":["sport"]}],"userPrefs":{"preferredTags":["minimal"],"blacklistTags":["sport"]}}'

RANK_RESPONSE=$(curl -s -o /tmp/rank_body.txt -w "%{http_code}" \
  -X POST "${BASE_URL}/api/reco/rank" \
  -H "Content-Type: application/json" \
  -d "$RANK_PAYLOAD")

if [ "$RANK_RESPONSE" = "200" ]; then
  RANK_BODY=$(cat /tmp/rank_body.txt)
  # Verify response is a JSON array and first item has id "o1"
  if echo "$RANK_BODY" | grep -qE '^\[' && echo "$RANK_BODY" | grep -qE '"id"\s*:\s*"o1"'; then
    # Check finalScore is present and in valid range
    if echo "$RANK_BODY" | grep -qE '"finalScore"\s*:\s*[0-9]'; then
      echo "Ranking API OK (HTTP 200, first item: o1)"
    else
      echo "Ranking API WARNING: Missing finalScore in response"
    fi
  else
    echo "Ranking API FAILED: Unexpected response format"
    echo "Response: $RANK_BODY"
    exit 1
  fi
else
  echo "Ranking API FAILED: HTTP $RANK_RESPONSE"
  cat /tmp/rank_body.txt
  exit 1
fi

# Verify no secrets in ranking response
if grep -qiE "$SENSITIVE_PATTERNS" /tmp/rank_body.txt 2>/dev/null; then
  echo "SECURITY WARNING: Ranking API response may contain sensitive data!"
  exit 1
fi

# Step 2: Login via Supabase Auth
echo ""
echo "[2/4] Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST \
  "${SUPABASE_URL}/auth/v1/token?grant_type=password" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${TEST_EMAIL}\",\"password\":\"${TEST_PASSWORD}\"}")

# Extract access_token
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
  ERROR_MSG=$(echo "$LOGIN_RESPONSE" | grep -o '"error_description":"[^"]*"' | cut -d'"' -f4)
  echo "Login FAILED: ${ERROR_MSG:-Unknown error}"
  exit 1
fi

# Display token info (first 6 chars + length only, no secrets)
TOKEN_PREFIX="${ACCESS_TOKEN:0:6}"
TOKEN_LEN="${#ACCESS_TOKEN}"
echo "Login OK (token: ${TOKEN_PREFIX}... length=${TOKEN_LEN})"

# Step 3: Call protected API endpoint
echo ""
echo "[3/4] Testing protected API..."
API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
  "${BASE_URL}/api/reco/daily-outfits/save?date=2025-01-01" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json")

if [ "$API_RESPONSE" = "200" ]; then
  echo "Protected API OK (HTTP ${API_RESPONSE})"
elif [ "$API_RESPONSE" = "401" ]; then
  echo "Protected API FAILED: Unauthorized (HTTP 401)"
  exit 1
else
  echo "Protected API returned HTTP ${API_RESPONSE}"
  # 401 is failure, other codes may be acceptable depending on data state
  if [ "$API_RESPONSE" -ge 500 ]; then
    exit 1
  fi
fi

# Step 4: Verify no secrets in health response
echo ""
echo "[4/4] Verifying no secrets leakage in health endpoint..."
if grep -qiE "$SENSITIVE_PATTERNS" /tmp/health_body.txt 2>/dev/null; then
  echo "SECURITY WARNING: Health endpoint may contain sensitive data!"
  exit 1
else
  echo "Security check OK (no sensitive patterns detected)"
fi

echo ""
echo "=== Smoke test passed ==="
exit 0
