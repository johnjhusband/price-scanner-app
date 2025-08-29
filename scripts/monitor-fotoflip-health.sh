#!/bin/bash
# FotoFlip Health Monitor
# Continuously monitors the health of FotoFlip feature

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
CHECK_INTERVAL=30  # seconds
ERROR_THRESHOLD=3  # consecutive errors before alert
ERROR_COUNT=0

echo "🔍 FotoFlip Health Monitor"
echo "========================="
echo "Checking every ${CHECK_INTERVAL} seconds..."
echo "Press Ctrl+C to stop"
echo ""

# Function to check health
check_health() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -n "[$timestamp] "
    
    # Check main health
    if ! curl -s -f https://blue.flippi.ai/health > /dev/null 2>&1; then
        echo -e "${RED}❌ Main backend DOWN${NC}"
        ((ERROR_COUNT++))
        return 1
    fi
    
    # Check FotoFlip health
    local fotoflip_response=$(curl -s https://blue.flippi.ai/api/fotoflip/health 2>/dev/null)
    
    if [[ -z "$fotoflip_response" ]]; then
        echo -e "${RED}❌ FotoFlip not responding${NC}"
        ((ERROR_COUNT++))
        return 1
    fi
    
    # Parse response
    if echo "$fotoflip_response" | grep -q '"status":"healthy"'; then
        echo -e "${GREEN}✅ FotoFlip healthy${NC}"
        
        # Check if feature is enabled
        if echo "$fotoflip_response" | grep -q '"imageHosting":true'; then
            echo "   └─ ImgBB: ✅ Configured"
        else
            echo "   └─ ImgBB: ⚠️  Not configured (using base64)"
        fi
        
        if echo "$fotoflip_response" | grep -q '"pythonRembg":true'; then
            echo "   └─ Python: ✅ Ready"
        else
            echo "   └─ Python: ❌ Not installed"
        fi
        
        ERROR_COUNT=0
        return 0
    else
        echo -e "${YELLOW}⚠️  FotoFlip unhealthy${NC}"
        ((ERROR_COUNT++))
        return 1
    fi
}

# Function to check process health
check_processes() {
    echo -e "\n📊 Process Status:"
    
    # Check PM2 status
    if pm2 status | grep -q "dev-backend.*online"; then
        echo -e "   Backend: ${GREEN}✅ Running${NC}"
    else
        echo -e "   Backend: ${RED}❌ Not running${NC}"
    fi
    
    # Check for stuck Python processes
    local python_count=$(ps aux | grep -E "python.*rembg" | grep -v grep | wc -l)
    if [ $python_count -gt 0 ]; then
        echo -e "   Python processes: ${YELLOW}⚠️  $python_count running${NC}"
        if [ $python_count -gt 3 ]; then
            echo -e "   ${RED}⚠️  WARNING: Too many Python processes, may need cleanup${NC}"
        fi
    else
        echo -e "   Python processes: ${GREEN}✅ None running${NC}"
    fi
}

# Function to check recent errors
check_errors() {
    echo -e "\n📝 Recent Errors:"
    local errors=$(pm2 logs dev-backend --lines 50 --err --nostream 2>/dev/null | grep -i "fotoflip" | tail -5)
    
    if [[ -z "$errors" ]]; then
        echo -e "   ${GREEN}✅ No recent FotoFlip errors${NC}"
    else
        echo -e "   ${YELLOW}Recent FotoFlip errors found:${NC}"
        echo "$errors" | sed 's/^/   /'
    fi
}

# Function to send alert
send_alert() {
    echo -e "\n${RED}🚨 ALERT: FotoFlip has failed $ERROR_COUNT consecutive health checks!${NC}"
    echo "Recommended actions:"
    echo "1. Check logs: pm2 logs dev-backend --lines 100"
    echo "2. Run rollback: bash scripts/emergency-fotoflip-rollback.sh"
    echo "3. Disable feature: pm2 set ENABLE_LUXE_PHOTO false && pm2 restart dev-backend"
}

# Main monitoring loop
while true; do
    check_health
    
    # If errors exceed threshold, show detailed info
    if [ $ERROR_COUNT -ge $ERROR_THRESHOLD ]; then
        send_alert
        check_processes
        check_errors
        echo -e "\n${YELLOW}Waiting 60 seconds before next check...${NC}\n"
        sleep 60
    else
        sleep $CHECK_INTERVAL
    fi
done