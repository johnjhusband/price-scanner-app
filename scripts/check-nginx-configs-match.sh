#!/bin/bash
# CI check to ensure blue and green nginx configs match (except for specific substitutions)

echo "=== Checking nginx configs match between blue and green ==="

# Files to compare
GREEN_CONFIG="nginx/green.flippi.ai.conf"
BLUE_CONFIG="nginx/blue.flippi.ai.conf"

# Check if files exist
if [ ! -f "$GREEN_CONFIG" ]; then
    echo "❌ Green config not found: $GREEN_CONFIG"
    exit 1
fi

if [ ! -f "$BLUE_CONFIG" ]; then
    echo "❌ Blue config not found: $BLUE_CONFIG"
    exit 1
fi

# Create temp files with substitutions applied
TEMP_GREEN="/tmp/green-normalized.conf"
TEMP_BLUE="/tmp/blue-normalized.conf"

# Normalize green config (replace green-specific values with placeholders)
sed -e 's/green\.flippi\.ai/DOMAIN_PLACEHOLDER/g' \
    -e 's/3001/BACKEND_PORT/g' \
    -e 's/8081/FRONTEND_PORT/g' \
    "$GREEN_CONFIG" > "$TEMP_GREEN"

# Normalize blue config (replace blue-specific values with same placeholders)
sed -e 's/blue\.flippi\.ai/DOMAIN_PLACEHOLDER/g' \
    -e 's/3002/BACKEND_PORT/g' \
    -e 's/8082/FRONTEND_PORT/g' \
    "$BLUE_CONFIG" > "$TEMP_BLUE"

# Compare normalized configs
if diff -q "$TEMP_GREEN" "$TEMP_BLUE" > /dev/null; then
    echo "✅ Configs match! Blue is an exact copy of green with only allowed substitutions."
    rm -f "$TEMP_GREEN" "$TEMP_BLUE"
    exit 0
else
    echo "❌ Configs differ! Showing differences:"
    echo ""
    diff -u "$TEMP_GREEN" "$TEMP_BLUE" || true
    echo ""
    echo "Blue config MUST be an exact copy of green with only these changes:"
    echo "  - green.flippi.ai → blue.flippi.ai"
    echo "  - Port 3001 → 3002"
    echo "  - Port 8081 → 8082"
    rm -f "$TEMP_GREEN" "$TEMP_BLUE"
    exit 1
fi