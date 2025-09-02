#!/bin/bash
# Fix for Issue #171: PM2 Process Issues - Missing prod-frontend, dev-frontend errored
# This script repairs PM2 process configuration and ensures all 6 processes are running

set -e

echo "=== Fixing PM2 Process Issues (Issue #171) ==="
echo "This script will fix PM2 processes configuration"
echo ""

# Check if running with sudo
if [ "$EUID" -ne 0 ]; then 
    echo "Please run with sudo: sudo $0"
    exit 1
fi

# Function to check if process exists in PM2
check_pm2_process() {
    local process_name=$1
    pm2 list | grep -q "$process_name" && return 0 || return 1
}

# Function to stop and delete a process if it exists
cleanup_process() {
    local process_name=$1
    if check_pm2_process "$process_name"; then
        echo "Cleaning up existing process: $process_name"
        pm2 stop "$process_name" || true
        pm2 delete "$process_name" || true
    fi
}

echo "1. Current PM2 status:"
pm2 status

echo ""
echo "2. Backing up current PM2 configuration..."
pm2 save
pm2 dump > /root/pm2-backup-$(date +%Y%m%d-%H%M%S).json || true

echo ""
echo "3. Fixing dev-frontend (errored state)..."
cleanup_process "dev-frontend"

# Check if the mobile-app directory exists and has package.json
if [ -d "/var/www/blue.flippi.ai/mobile-app" ] && [ -f "/var/www/blue.flippi.ai/mobile-app/package.json" ]; then
    echo "Starting dev-frontend..."
    cd /var/www/blue.flippi.ai
    pm2 start ecosystem.config.complete.js --only dev-frontend || {
        echo "Failed to start from ecosystem.config.complete.js, trying manual start..."
        cd /var/www/blue.flippi.ai/mobile-app
        pm2 start npm --name "dev-frontend" -- run start:web --env NODE_ENV=development PORT=4002 REACT_APP_API_URL=https://blue.flippi.ai
    }
else
    echo "ERROR: dev-frontend directory or package.json not found!"
    echo "Path checked: /var/www/blue.flippi.ai/mobile-app"
fi

echo ""
echo "4. Fixing prod-frontend (missing)..."
cleanup_process "prod-frontend"

# Check if the mobile-app directory exists and has package.json
if [ -d "/var/www/app.flippi.ai/mobile-app" ] && [ -f "/var/www/app.flippi.ai/mobile-app/package.json" ]; then
    echo "Starting prod-frontend..."
    cd /var/www/app.flippi.ai
    pm2 start ecosystem.config.complete.js --only prod-frontend || {
        echo "Failed to start from ecosystem.config.complete.js, trying manual start..."
        cd /var/www/app.flippi.ai/mobile-app
        pm2 start npm --name "prod-frontend" -- run start:web --env NODE_ENV=production PORT=4000 REACT_APP_API_URL=https://app.flippi.ai
    }
else
    echo "ERROR: prod-frontend directory or package.json not found!"
    echo "Path checked: /var/www/app.flippi.ai/mobile-app"
fi

echo ""
echo "5. Ensuring all ecosystem configs are in place..."

# Copy complete ecosystem config to each environment if missing
for env in app.flippi.ai green.flippi.ai blue.flippi.ai; do
    if [ ! -f "/var/www/$env/ecosystem.config.complete.js" ]; then
        echo "Copying ecosystem.config.complete.js to /var/www/$env/"
        cp "$(dirname "$0")/../ecosystem.config.complete.js" "/var/www/$env/" 2>/dev/null || {
            echo "WARNING: Could not copy ecosystem config to $env"
        }
    fi
done

echo ""
echo "6. Saving PM2 configuration..."
pm2 save
pm2 startup systemd -u root --hp /root || true

echo ""
echo "7. Final PM2 status:"
pm2 status

echo ""
echo "8. Checking process health..."
sleep 5

# Check each process
expected_processes=("prod-backend" "prod-frontend" "staging-backend" "staging-frontend" "dev-backend" "dev-frontend")
all_healthy=true

for process in "${expected_processes[@]}"; do
    if pm2 list | grep -q "$process.*online"; then
        echo "✅ $process is online"
    else
        echo "❌ $process is NOT online"
        all_healthy=false
        
        # Show error logs if process is not online
        echo "Recent logs for $process:"
        pm2 logs "$process" --lines 10 --nostream 2>/dev/null || echo "Could not retrieve logs"
    fi
done

echo ""
echo "=== Summary ==="
if [ "$all_healthy" = true ]; then
    echo "✅ All 6 PM2 processes are running correctly!"
    echo ""
    echo "Processes:"
    echo "- prod-backend (port 3000)"
    echo "- prod-frontend (port 4000)"
    echo "- staging-backend (port 3001)"
    echo "- staging-frontend (port 4001)"
    echo "- dev-backend (port 3002)"
    echo "- dev-frontend (port 4002)"
else
    echo "⚠️  Some processes are still having issues."
    echo "Please check the logs above for more details."
    echo ""
    echo "Troubleshooting commands:"
    echo "- pm2 logs [process-name] --lines 100"
    echo "- pm2 describe [process-name]"
    echo "- pm2 restart [process-name]"
fi

echo ""
echo "To monitor processes in real-time:"
echo "pm2 monit"