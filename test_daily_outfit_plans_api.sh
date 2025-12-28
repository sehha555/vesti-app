#!/bin/bash

################################################################################
# Daily Outfit Plans API 完整驗證測試腳本
################################################################################
# 用途：驗證 RLS + API 安全性（包含 JWT 登入）
# 執行方式：bash test_daily_outfit_plans_api.sh
# 前置條件：
#   1. 設定環境變數（BASE_URL, SUPABASE_URL, 各帳號等）
#   2. 已在 Supabase 建立測試帳號（a@test.com, b@test.com）
#   3. 開發伺服器已運行在 BASE_URL
################################################################################

set -e  # Exit on error

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================
# 環境變數驗證
# ============================================================

verify_env() {
  local missing=0

  local required_vars=(
    "BASE_URL"
    "SUPABASE_URL"
    "ANON_KEY"
    "TEST_DATE"
    "USER_A_EMAIL"
    "USER_A_PASSWORD"
    "USER_B_EMAIL"
    "USER_B_PASSWORD"
  )

  for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
      echo -e "${RED}❌ 缺少環境變數: $var${NC}"
      missing=$((missing + 1))
    fi
  done

  if [ $missing -gt 0 ]; then
    echo -e "${RED}請先設定所有必要的環境變數。${NC}"
    echo ""
    echo "範例："
    echo "  export BASE_URL='http://localhost:3003'"
    echo "  export SUPABASE_URL='https://your-project.supabase.co'"
    echo "  export ANON_KEY='your-anon-key'"
    echo "  export TEST_DATE='2025-12-26'"
    echo "  export USER_A_EMAIL='a@test.com'"
    echo "  export USER_A_PASSWORD='Passw0rd!'"
    echo "  export USER_B_EMAIL='b@test.com'"
    echo "  export USER_B_PASSWORD='Passw0rd!'"
    exit 1
  fi
}

# ============================================================
# 登入函數：通過 Supabase auth API 獲取 JWT
# ============================================================

login_user() {
  local email=$1
  local password=$2
  local user_name=$3

  echo -e "${BLUE}正在登入 $user_name ($email)...${NC}"

  local auth_url="${SUPABASE_URL}/auth/v1/token?grant_type=password"

  local response=$(curl -s -X POST \
    "$auth_url" \
    -H "apikey: $ANON_KEY" \
    -H "Authorization: Bearer $ANON_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$password\"}")

  # 檢查是否返回 access_token
  local token=$(echo "$response" | jq -r '.access_token // empty' 2>/dev/null)

  if [ -z "$token" ]; then
    echo -e "${RED}❌ 登入失敗：$user_name${NC}"
    echo "響應: $response"
    exit 1
  fi

  echo -e "${GREEN}✅ $user_name 登入成功${NC}"
  echo "$token"
}

# ============================================================
# API 呼叫函數
# ============================================================

call_api() {
  local method=$1
  local endpoint=$2
  local token=$3
  local data=$4
  local description=$5

  echo -e "${BLUE}→ $description${NC}"

  local cmd="curl -s -w '\n%{http_code}' -X $method"
  cmd="$cmd \"${BASE_URL}${endpoint}\""

  if [ -n "$token" ]; then
    cmd="$cmd -H \"Authorization: Bearer \$token\""
  fi

  cmd="$cmd -H \"Content-Type: application/json\""

  if [ -n "$data" ]; then
    cmd="$cmd -d '$data'"
  fi

  # 執行 curl 並分離響應和 HTTP 狀態碼
  local full_response=$(eval "$cmd")
  local http_code=$(echo "$full_response" | tail -n1)
  local body=$(echo "$full_response" | head -n-1)

  echo "HTTP $http_code"

  if [ $http_code -lt 400 ]; then
    echo -e "${GREEN}✅ 成功${NC}"
  else
    echo -e "${RED}❌ 失敗${NC}"
  fi

  echo "Response: $body"
  echo ""

  # 回傳 body 和 http_code（透過全域變數）
  LAST_RESPONSE_BODY="$body"
  LAST_HTTP_CODE="$http_code"
}

# ============================================================
# 測試場景
# ============================================================

test_1_unauthorized() {
  echo ""
  echo -e "${YELLOW}═══════════════════════════════════════════════${NC}"
  echo -e "${YELLOW}Test 1: 未登入不可存取 (應返回 401)${NC}"
  echo -e "${YELLOW}═══════════════════════════════════════════════${NC}"

  call_api "GET" "/api/reco/daily-outfits/save?date=${TEST_DATE}" "" "" \
    "未登入呼叫 GET /api/reco/daily-outfits/save"

  if [ "$LAST_HTTP_CODE" = "401" ]; then
    echo -e "${GREEN}✓ Test 1 通過${NC}"
    return 0
  else
    echo -e "${RED}✗ Test 1 失敗：預期 401，但得到 $LAST_HTTP_CODE${NC}"
    return 1
  fi
}

test_2_user_a_save() {
  echo ""
  echo -e "${YELLOW}═══════════════════════════════════════════════${NC}"
  echo -e "${YELLOW}Test 2: User A 保存計畫 (應返回 200)${NC}"
  echo -e "${YELLOW}═══════════════════════════════════════════════${NC}"

  local data=$(cat <<EOF
{
  "date": "${TEST_DATE}",
  "outfitId": 1,
  "layoutSlots": {
    "top_inner": {"item_id": "t1", "name": "白T恤", "imageUrl": "https://example.com/t1.jpg"},
    "bottom": {"item_id": "b1", "name": "牛仔褲", "imageUrl": "https://example.com/b1.jpg"}
  },
  "occasion": "work",
  "weather": {"tempC": 18, "condition": "rain"}
}
EOF
)

  call_api "POST" "/api/reco/daily-outfits/save" "$USER_A_TOKEN" "$data" \
    "User A 保存穿搭計畫"

  if [ "$LAST_HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Test 2 通過${NC}"
    return 0
  else
    echo -e "${RED}✗ Test 2 失敗：預期 200，但得到 $LAST_HTTP_CODE${NC}"
    return 1
  fi
}

test_3_user_a_read() {
  echo ""
  echo -e "${YELLOW}═══════════════════════════════════════════════${NC}"
  echo -e "${YELLOW}Test 3: User A 讀取自己的計畫 (應返回 200 + 資料)${NC}"
  echo -e "${YELLOW}═══════════════════════════════════════════════${NC}"

  call_api "GET" "/api/reco/daily-outfits/save?date=${TEST_DATE}" "$USER_A_TOKEN" "" \
    "User A 讀取穿搭計畫"

  if [ "$LAST_HTTP_CODE" = "200" ] && echo "$LAST_RESPONSE_BODY" | grep -q "outfitId"; then
    echo -e "${GREEN}✓ Test 3 通過${NC}"
    return 0
  else
    echo -e "${RED}✗ Test 3 失敗：無法取得計畫資料${NC}"
    return 1
  fi
}

test_4_user_b_isolation() {
  echo ""
  echo -e "${YELLOW}═══════════════════════════════════════════════${NC}"
  echo -e "${YELLOW}Test 4: User B 無法讀取 User A 的計畫 (RLS 防護)${NC}"
  echo -e "${YELLOW}═══════════════════════════════════════════════${NC}"

  call_api "GET" "/api/reco/daily-outfits/save?date=${TEST_DATE}" "$USER_B_TOKEN" "" \
    "User B 嘗試讀取同一天的計畫"

  # 檢查是否返回空陣列或沒有 User A 的資料
  if [ "$LAST_HTTP_CODE" = "200" ] && echo "$LAST_RESPONSE_BODY" | grep -q '"outfits":\[\]'; then
    echo -e "${GREEN}✓ Test 4 通過：User B 無法看到 User A 的計畫（RLS 防護成功）${NC}"
    return 0
  elif [ "$LAST_HTTP_CODE" = "200" ] && ! echo "$LAST_RESPONSE_BODY" | grep -q '"outfitId":1'; then
    echo -e "${GREEN}✓ Test 4 通過：User B 無法看到 User A 的計畫（RLS 防護成功）${NC}"
    return 0
  else
    echo -e "${RED}✗ Test 4 失敗：User B 仍能看到 User A 的數據（RLS 防護失敗）${NC}"
    return 1
  fi
}

test_5_upsert() {
  echo ""
  echo -e "${YELLOW}═══════════════════════════════════════════════${NC}"
  echo -e "${YELLOW}Test 5: 同一天重複選定會 Upsert 更新 (無重複記錄)${NC}"
  echo -e "${YELLOW}═══════════════════════════════════════════════${NC}"

  # Step A: 再次選定不同的 outfit
  echo -e "${BLUE}Step A: User A 再次選定不同的 outfit...${NC}"

  local data=$(cat <<EOF
{
  "date": "${TEST_DATE}",
  "outfitId": 2,
  "layoutSlots": {
    "top_inner": {"item_id": "t2", "name": "黑色上衣", "imageUrl": "https://example.com/t2.jpg"},
    "bottom": {"item_id": "b2", "name": "運動褲", "imageUrl": "https://example.com/b2.jpg"}
  },
  "occasion": "casual",
  "weather": {"tempC": 20, "condition": "sunny"}
}
EOF
)

  call_api "POST" "/api/reco/daily-outfits/save" "$USER_A_TOKEN" "$data" \
    "User A 再次保存穿搭計畫 (outfit_id: 2)"

  if [ "$LAST_HTTP_CODE" != "200" ]; then
    echo -e "${RED}✗ Test 5 失敗：保存第二次失敗${NC}"
    return 1
  fi

  # Step B: 驗證只有一筆記錄被更新
  echo -e "${BLUE}Step B: 驗證只有一筆記錄...${NC}"
  sleep 1  # 稍微等待以確保資料庫更新

  call_api "GET" "/api/reco/daily-outfits/save?date=${TEST_DATE}" "$USER_A_TOKEN" "" \
    "User A 讀取更新後的計畫"

  if [ "$LAST_HTTP_CODE" = "200" ] && echo "$LAST_RESPONSE_BODY" | grep -q '"outfitId":2'; then
    # 檢查是否只有一筆記錄
    local outfit_count=$(echo "$LAST_RESPONSE_BODY" | jq '.outfits | length' 2>/dev/null)
    if [ "$outfit_count" = "1" ]; then
      echo -e "${GREEN}✓ Test 5 通過：Upsert 成功（只有一筆記錄，已更新為 outfit_id: 2）${NC}"
      return 0
    else
      echo -e "${RED}✗ Test 5 失敗：有 $outfit_count 筆記錄（應該只有 1 筆）${NC}"
      return 1
    fi
  else
    echo -e "${RED}✗ Test 5 失敗：無法驗證 Upsert 行為${NC}"
    return 1
  fi
}

# ============================================================
# 主程序
# ============================================================

main() {
  clear

  echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║  Daily Outfit Plans API 完整驗證測試                    ║${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
  echo ""

  # 驗證環境變數
  verify_env

  echo -e "${GREEN}✓ 環境變數已驗證${NC}"
  echo ""

  # 登入兩個測試帳號
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}第一步：登入測試帳號${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

  USER_A_TOKEN=$(login_user "$USER_A_EMAIL" "$USER_A_PASSWORD" "User A")
  USER_B_TOKEN=$(login_user "$USER_B_EMAIL" "$USER_B_PASSWORD" "User B")

  echo ""

  # 執行 5 個測試
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}第二步：執行 5 個測試${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

  # 追蹤測試結果
  local passed=0
  local failed=0

  test_1_unauthorized && ((passed++)) || ((failed++))
  test_2_user_a_save && ((passed++)) || ((failed++))
  test_3_user_a_read && ((passed++)) || ((failed++))
  test_4_user_b_isolation && ((passed++)) || ((failed++))
  test_5_upsert && ((passed++)) || ((failed++))

  # 總結
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}測試結果總結${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

  echo ""
  echo -e "通過：${GREEN}$passed/5${NC}"
  echo -e "失敗：${RED}$failed/5${NC}"

  if [ $failed -eq 0 ]; then
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  🎉 所有測試通過！RLS + API 驗證成功              ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
    exit 0
  else
    echo ""
    echo -e "${RED}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ⚠️  部分測試失敗，請檢查上面的錯誤訊息          ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════╝${NC}"
    exit 1
  fi
}

# 執行主程序
main
