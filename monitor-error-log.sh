#!/bin/bash
# Error Log Monitor Script
# Watches the error-log.txt file for new entries and displays them

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the initial line count
ERROR_LOG="/root/price-scanner-app/error-log.txt"
if [ ! -f "$ERROR_LOG" ]; then
    echo -e "${RED}Error: error-log.txt not found at $ERROR_LOG${NC}"
    exit 1
fi

initial_lines=$(wc -l < "$ERROR_LOG")
echo -e "${GREEN}Monitoring error log for new entries...${NC}"
echo "Current lines: $initial_lines"
echo "Press Ctrl+C to stop monitoring"
echo "---"

# Monitor loop
while true; do
    current_lines=$(wc -l < "$ERROR_LOG")
    
    if [ $current_lines -gt $initial_lines ]; then
        new_lines=$((current_lines - initial_lines))
        echo -e "${YELLOW}NEW ENTRIES DETECTED! ($new_lines new lines)${NC}"
        echo "---"
        tail -n $new_lines "$ERROR_LOG"
        echo "---"
        initial_lines=$current_lines
    fi
    
    sleep 5
done