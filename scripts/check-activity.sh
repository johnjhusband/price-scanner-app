#!/bin/bash

# Quick script to check if it's safe to deploy
# Usage: ./check-activity.sh

echo "🔍 Checking Flippi Activity..."
echo "================================"

# Check deployment safety
RESPONSE=$(curl -s -H "Authorization: Bearer $YOUR_AUTH_TOKEN" https://app.flippi.ai/api/analytics/deployment-check)

if [ $? -ne 0 ]; then
    echo "❌ Failed to connect to API"
    exit 1
fi

# Parse JSON response
SAFE=$(echo $RESPONSE | jq -r '.safe_to_deploy')
MESSAGE=$(echo $RESPONSE | jq -r '.message')
COUNT=$(echo $RESPONSE | jq -r '.recent_activity_count')

if [ "$SAFE" = "true" ]; then
    echo "✅ Safe to deploy!"
    echo "   No activity in last 15 minutes"
else
    echo "⚠️  Active users detected!"
    echo "   $COUNT scans in last 15 minutes"
    echo "   Maybe wait 30 minutes"
fi

echo ""
echo "Message: $MESSAGE"
echo "================================"

# Optional: Get more details
if [ "$1" = "--details" ]; then
    echo ""
    echo "Last 24 hours activity:"
    curl -s -H "Authorization: Bearer $YOUR_AUTH_TOKEN" https://app.flippi.ai/api/analytics/activity | jq .
fi