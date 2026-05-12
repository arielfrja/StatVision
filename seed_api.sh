#!/bin/bash

API_URL="http://localhost:3000"
TOKEN="mock-token"

echo "🚀 Seeding Roster via API (cURL)..."

# 1. Create the Team
echo "🏀 Creating Team..."
TEAM_JSON=$(curl -s -X POST "$API_URL/teams" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name": "StatVision Elite (cURL)"}')

TEAM_ID=$(echo $TEAM_JSON | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -z "$TEAM_ID" ]; then
  echo "❌ Failed to create team. API Response: $TEAM_JSON"
  exit 1
fi

echo "✅ Team Created! ID: $TEAM_ID"

# 2. Roster Data
ROSTER=(
  '{"number": 5, "name": "Danica Kuntz", "pos": "Point Guard", "height": "160 cm"}'
  '{"number": 10, "name": "Macie Hensley", "pos": "Guard", "height": "163 cm"}'
  '{"number": 12, "name": "Jocelynn Faulkner", "pos": "Guard", "height": "165 cm"}'
  '{"number": 15, "name": "Chloe Smith", "pos": "Forward", "height": "168 cm"}'
  '{"number": 22, "name": "Jenna Bules", "pos": "Guard", "height": "165 cm"}'
  '{"number": 30, "name": "Ava Brown", "pos": "Forward", "height": "170 cm"}'
  '{"number": 34, "name": "Addyson Viers", "pos": "Center", "height": "178 cm"}'
  '{"number": 52, "name": "Mia Davis", "pos": "Forward", "height": "173 cm"}'
)

# 3. Add Players
for row in "${ROSTER[@]}"; do
  NAME=$(echo $row | grep -o '"name": "[^"]*' | cut -d'"' -f4)
  NUM=$(echo $row | grep -o '"number": [0-9]*' | cut -d' ' -f2)
  DESC=$(echo $row | grep -o '"pos": "[^"]*' | cut -d'"' -f4)
  H=$(echo $row | grep -o '"height": "[^"]*' | cut -d'"' -f4)

  echo "👤 Adding Player: $NAME..."
  curl -s -X POST "$API_URL/teams/$TEAM_ID/players" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
      \"name\": \"$NAME\",
      \"jerseyNumber\": $NUM,
      \"description\": \"$DESC | $H\"
    }" > /dev/null
  echo "   ✅ Added #$NUM"
done

echo -e "\n⭐ SUCCESS: Roster seeded successfully via API!"
