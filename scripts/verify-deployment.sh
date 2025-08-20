#!/bin/bash

# Deployment Verification Script for Flippi.ai
# Usage: ./verify-deployment.sh [app|green|blue]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get environment parameter
ENV=$1
if [ -z "$ENV" ]; then
    echo "Usage: $0 [app|green|blue]"
    echo "Example: $0 blue"
    exit 1
fi

# Validate environment
case $ENV in
    app)
        DOMAIN="app.flippi.ai"
        PORT="3000"
        PM2_PREFIX="prod"
        ;;
    green)
        DOMAIN="green.flippi.ai"
        PORT="3001"
        PM2_PREFIX="staging"
        ;;
    blue)
        DOMAIN="blue.flippi.ai"
        PORT="3002"
        PM2_PREFIX="dev"
        ;;
    *)
        echo -e "${RED}Error: Invalid environment '$ENV'${NC}"
        echo "Valid options: app, green, blue"
        exit 1
        ;;
esac

echo -e "${YELLOW}=== Verifying Deployment for $DOMAIN ===${NC}"
echo ""

# Function to check endpoint
check_endpoint() {
    local url=$1
    local expected=$2
    local description=$3
    
    echo -n "Checking $description... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
    
    if [ "$response" = "$expected" ]; then
        echo -e "${GREEN}✓ OK${NC} (HTTP $response)"
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (HTTP $response, expected $expected)"
        return 1
    fi
}

# Function to check PM2 process
check_pm2_process() {
    local process_name=$1
    local description=$2
    
    echo -n "Checking $description... "
    
    # Check if process exists and is online
    if pm2 describe "$process_name" 2>/dev/null | grep -q "status.*online"; then
        # Get restart count
        restarts=$(pm2 describe "$process_name" | grep "restarts" | awk '{print $4}')
        if [ "$restarts" -gt 5 ]; then
            echo -e "${YELLOW}⚠ WARNING${NC} (online but $restarts restarts)"
        else
            echo -e "${GREEN}✓ ONLINE${NC} (restarts: $restarts)"
        fi
        return 0
    else
        echo -e "${RED}✗ OFFLINE${NC}"
        return 1
    fi
}

# Function to check JSON response
check_json_health() {
    local url=$1
    
    echo -n "Checking health endpoint response... "
    
    response=$(curl -s "$url")
    
    # Check if response is valid JSON
    if echo "$response" | jq . >/dev/null 2>&1; then
        status=$(echo "$response" | jq -r '.status')
        version=$(echo "$response" | jq -r '.version')
        
        if [ "$status" = "OK" ]; then
            echo -e "${GREEN}✓ OK${NC} (version: $version)"
            return 0
        else
            echo -e "${RED}✗ FAILED${NC} (status: $status)"
            return 1
        fi
    else
        echo -e "${RED}✗ FAILED${NC} (invalid JSON)"
        return 1
    fi
}

# Function to check recent errors
check_recent_errors() {
    local process_name=$1
    local description=$2
    
    echo -n "Checking $description for recent errors... "
    
    # Count errors in last 100 lines
    error_count=$(pm2 logs "$process_name" --err --lines 100 --nostream 2>/dev/null | grep -E "(Error|ERROR|error)" | wc -l || echo "0")
    
    if [ "$error_count" -eq 0 ]; then
        echo -e "${GREEN}✓ NO ERRORS${NC}"
        return 0
    elif [ "$error_count" -lt 5 ]; then
        echo -e "${YELLOW}⚠ WARNING${NC} ($error_count errors found)"
        return 0
    else
        echo -e "${RED}✗ CRITICAL${NC} ($error_count errors found)"
        return 1
    fi
}

# Track failures
FAILURES=0

echo "1. Infrastructure Checks"
echo "------------------------"

# Check PM2 processes
check_pm2_process "${PM2_PREFIX}-backend" "Backend process" || ((FAILURES++))
check_pm2_process "${PM2_PREFIX}-frontend" "Frontend process" || ((FAILURES++))

echo ""
echo "2. Endpoint Checks"
echo "------------------"

# Check endpoints
check_endpoint "https://$DOMAIN" "200" "Frontend" || ((FAILURES++))
check_json_health "https://$DOMAIN/health" || ((FAILURES++))
check_endpoint "https://$DOMAIN/terms" "200" "Terms page" || ((FAILURES++))
check_endpoint "https://$DOMAIN/privacy" "200" "Privacy page" || ((FAILURES++))

echo ""
echo "3. Error Log Checks"
echo "-------------------"

# Check for recent errors
check_recent_errors "${PM2_PREFIX}-backend" "Backend logs" || ((FAILURES++))
check_recent_errors "${PM2_PREFIX}-frontend" "Frontend logs" || ((FAILURES++))

echo ""
echo "4. Performance Checks"
echo "--------------------"

# Check response time
echo -n "Checking API response time... "
start_time=$(date +%s%N)
curl -s "https://$DOMAIN/health" > /dev/null
end_time=$(date +%s%N)
response_time=$(( ($end_time - $start_time) / 1000000 ))

if [ "$response_time" -lt 500 ]; then
    echo -e "${GREEN}✓ FAST${NC} (${response_time}ms)"
elif [ "$response_time" -lt 2000 ]; then
    echo -e "${YELLOW}⚠ MODERATE${NC} (${response_time}ms)"
else
    echo -e "${RED}✗ SLOW${NC} (${response_time}ms)"
    ((FAILURES++))
fi

# Check memory usage
echo -n "Checking backend memory usage... "
memory=$(pm2 describe "${PM2_PREFIX}-backend" 2>/dev/null | grep "memory" | head -1 | awk '{print $4}' | sed 's/mb//i' || echo "0")

if [ "$memory" -lt 200 ]; then
    echo -e "${GREEN}✓ NORMAL${NC} (${memory}MB)"
elif [ "$memory" -lt 500 ]; then
    echo -e "${YELLOW}⚠ ELEVATED${NC} (${memory}MB)"
else
    echo -e "${RED}✗ HIGH${NC} (${memory}MB)"
    ((FAILURES++))
fi

echo ""
echo "5. Functional Tests"
echo "-------------------"

# Test image analysis endpoint (with small test image)
echo -n "Testing image analysis API... "
test_response=$(curl -s -X POST "https://$DOMAIN/api/scan" \
    -F "description=test deployment verification" \
    -o /dev/null -w "%{http_code}" || echo "000")

if [ "$test_response" = "400" ] || [ "$test_response" = "422" ]; then
    # 400/422 is expected without an actual image
    echo -e "${GREEN}✓ API RESPONSIVE${NC}"
elif [ "$test_response" = "200" ]; then
    echo -e "${GREEN}✓ API WORKING${NC}"
else
    echo -e "${RED}✗ API ERROR${NC} (HTTP $test_response)"
    ((FAILURES++))
fi

echo ""
echo "======================================"

if [ "$FAILURES" -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo "Deployment verification successful for $DOMAIN"
    exit 0
else
    echo -e "${RED}✗ $FAILURES checks failed!${NC}"
    echo "Deployment may have issues. Check logs for details."
    exit 1
fi