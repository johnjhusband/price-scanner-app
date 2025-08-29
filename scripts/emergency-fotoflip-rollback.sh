#!/bin/bash
# Emergency FotoFlip Rollback Script
# Run this if FotoFlip feature causes issues

echo "🚨 EMERGENCY FOTOFLIP ROLLBACK 🚨"
echo "================================="

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if we're on the server
check_environment() {
    if [[ ! -f "/var/www/blue.flippi.ai/backend/server.js" ]]; then
        echo -e "${RED}ERROR: This script must be run on the blue.flippi.ai server${NC}"
        echo "Please SSH to the server first: ssh blue.flippi.ai"
        exit 1
    fi
}

# Function to disable feature flag
disable_feature() {
    echo -e "${YELLOW}Disabling Luxe Photo feature...${NC}"
    pm2 set ENABLE_LUXE_PHOTO false
    
    echo -e "${YELLOW}Restarting backend...${NC}"
    pm2 restart dev-backend
    
    # Wait for restart
    sleep 3
    
    # Verify
    if pm2 status | grep -q "dev-backend.*online"; then
        echo -e "${GREEN}✅ Backend restarted successfully${NC}"
    else
        echo -e "${RED}⚠️  Backend may not be running properly${NC}"
    fi
}

# Function to check system health
check_health() {
    echo -e "\n${YELLOW}Checking system health...${NC}"
    
    # Check backend health
    if curl -s -f https://blue.flippi.ai/health > /dev/null; then
        echo -e "${GREEN}✅ Main health endpoint responding${NC}"
    else
        echo -e "${RED}❌ Main health endpoint not responding${NC}"
    fi
    
    # Check FotoFlip health
    if curl -s https://blue.flippi.ai/api/fotoflip/health | grep -q "ENABLE_LUXE_PHOTO"; then
        local status=$(curl -s https://blue.flippi.ai/api/fotoflip/health | grep -o '"ENABLE_LUXE_PHOTO":[^,]*' | cut -d':' -f2)
        echo -e "FotoFlip feature status: ${status}"
    fi
    
    # Check CPU and memory
    echo -e "\n${YELLOW}Resource usage:${NC}"
    pm2 status dev-backend
}

# Function to kill stuck Python processes
cleanup_python() {
    echo -e "\n${YELLOW}Checking for stuck Python processes...${NC}"
    
    # Find rembg processes
    PIDS=$(ps aux | grep -E "python.*rembg|rembg" | grep -v grep | awk '{print $2}')
    
    if [ ! -z "$PIDS" ]; then
        echo -e "${RED}Found stuck Python processes:${NC}"
        ps aux | grep -E "python.*rembg|rembg" | grep -v grep
        
        echo -e "\n${YELLOW}Killing processes...${NC}"
        echo $PIDS | xargs -r kill -9
        echo -e "${GREEN}✅ Cleaned up Python processes${NC}"
    else
        echo -e "${GREEN}✅ No stuck Python processes found${NC}"
    fi
}

# Function to show recent errors
show_errors() {
    echo -e "\n${YELLOW}Recent backend errors:${NC}"
    pm2 logs dev-backend --lines 20 --err --nostream | grep -E "ERROR|Error|error" || echo "No recent errors found"
}

# Function for full git rollback
git_rollback() {
    echo -e "\n${RED}PERFORMING FULL GIT ROLLBACK${NC}"
    echo "This will revert the FotoFlip feature completely"
    read -p "Are you sure? (y/N) " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd /var/www/blue.flippi.ai
        
        # Find FotoFlip commit
        COMMIT=$(git log --oneline --grep="FotoFlip\|Luxe Photo" -n 1 | awk '{print $1}')
        
        if [ ! -z "$COMMIT" ]; then
            echo -e "${YELLOW}Reverting commit: $COMMIT${NC}"
            git revert $COMMIT --no-edit
            
            echo -e "${YELLOW}Pushing revert...${NC}"
            git push origin develop
            
            echo -e "${GREEN}✅ Git rollback completed${NC}"
            echo "Auto-deploy will apply changes in 2-3 minutes"
        else
            echo -e "${RED}Could not find FotoFlip commit${NC}"
        fi
    else
        echo "Git rollback cancelled"
    fi
}

# Main menu
main() {
    check_environment
    
    echo -e "\n${YELLOW}What type of rollback do you need?${NC}"
    echo "1) Quick disable (feature flag only)"
    echo "2) Clean up stuck processes"
    echo "3) Full git rollback"
    echo "4) Just check health"
    echo "5) Exit"
    
    read -p "Select option (1-5): " choice
    
    case $choice in
        1)
            disable_feature
            cleanup_python
            check_health
            show_errors
            ;;
        2)
            cleanup_python
            pm2 restart dev-backend
            check_health
            ;;
        3)
            git_rollback
            ;;
        4)
            check_health
            show_errors
            ;;
        5)
            echo "Exiting..."
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid option${NC}"
            exit 1
            ;;
    esac
    
    echo -e "\n${GREEN}Rollback procedure completed${NC}"
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Test main functionality at https://blue.flippi.ai"
    echo "2. Check logs: pm2 logs dev-backend"
    echo "3. Monitor for any issues"
}

# Run main function
main