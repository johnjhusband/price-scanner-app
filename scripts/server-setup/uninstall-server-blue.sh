#!/bin/bash
# Uninstall script for Flippi.ai Blue Environment
# This script removes everything installed by setup-new-server-blue.sh

set -e

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored status
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

echo "==========================================="
echo "Flippi.ai Server Uninstall - Blue Environment"
echo "==========================================="
echo "This will remove all components installed by setup-new-server-blue.sh"
echo ""

# Check for installation manifest
INSTALL_MANIFEST="/var/log/flippi-blue-install-manifest.txt"
if [ -f "$INSTALL_MANIFEST" ]; then
    print_status "Found installation manifest: $INSTALL_MANIFEST"
    echo "This uninstall will remove items tracked during installation."
else
    print_warning "No installation manifest found at $INSTALL_MANIFEST"
    echo "Will perform standard uninstall based on known components."
fi

echo ""
read -p "Are you sure you want to continue? (yes/no): " -r
echo
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Uninstall cancelled."
    exit 1
fi

# Track what we're removing
REMOVAL_LOG="/tmp/flippi-uninstall-$(date +%Y%m%d-%H%M%S).log"
echo "Starting uninstall at $(date)" > "$REMOVAL_LOG"

# Stop all services
print_status "Stopping services..."
pm2 kill 2>/dev/null || echo "PM2 not running" >> "$REMOVAL_LOG"
systemctl stop nginx 2>/dev/null || echo "Nginx not running" >> "$REMOVAL_LOG"
systemctl disable nginx 2>/dev/null || true

# Remove PM2
print_status "Removing PM2..."
npm uninstall -g pm2 2>/dev/null || echo "PM2 not installed" >> "$REMOVAL_LOG"
rm -rf ~/.pm2
rm -f /etc/systemd/system/pm2-root.service

# Remove Node.js and npm
print_status "Removing Node.js..."
apt-get remove -y nodejs npm 2>/dev/null || echo "Node.js not installed" >> "$REMOVAL_LOG"
rm -rf /usr/lib/node_modules
rm -f /etc/apt/sources.list.d/nodesource.list
apt-get update

# Remove Nginx
print_status "Removing Nginx..."
apt-get remove -y nginx nginx-common 2>/dev/null || echo "Nginx not installed" >> "$REMOVAL_LOG"
apt-get purge -y nginx nginx-common
rm -rf /etc/nginx
rm -rf /var/log/nginx
rm -rf /var/cache/nginx

# Remove Python packages installed for FotoFlip
print_status "Removing Python packages..."
pip3 uninstall -y numpy rembg onnxruntime coloredlogs humanfriendly imageio tqdm numba tifffile scipy scikit-image pymatting opencv-python-headless 2>/dev/null || true

# Remove certbot
print_status "Removing Certbot..."
apt-get remove -y certbot python3-certbot python3-certbot-nginx 2>/dev/null || echo "Certbot not installed" >> "$REMOVAL_LOG"
apt-get purge -y certbot python3-certbot python3-certbot-nginx
rm -rf /etc/letsencrypt

# Remove directories
print_status "Removing directories..."
rm -rf /var/www/blue.flippi.ai
rm -rf /var/www/shared
rm -rf /var/www/html
# Remove /var/www only if empty
rmdir /var/www 2>/dev/null || echo "/var/www not empty or doesn't exist" >> "$REMOVAL_LOG"

# Remove helper scripts
print_status "Removing helper scripts..."
rm -f /usr/local/bin/check-flippi
rm -f /usr/local/bin/deploy-blue
rm -f /usr/local/bin/setup-ssl-blue

# Remove any custom binaries from pip
print_status "Removing pip binaries..."
rm -f /usr/local/bin/{coloredlogs,f2py,humanfriendly,imageio_download_bin,imageio_remove_bin,isympy,lsm2bin,numba,onnxruntime_test,rembg,tiff2fsspec,tiffcomment,tifffile,tqdm}

# Reset firewall rules (keep SSH!)
print_status "Resetting firewall rules..."
ufw --force reset
ufw --force enable
ufw allow 22/tcp

# Clean up apt packages
print_status "Cleaning up packages..."
apt-get autoremove -y
apt-get autoclean

# Remove any remaining setup scripts
rm -f /tmp/setup-new-server-*.sh
rm -f /root/scripts/fix-nginx-ssl-comprehensive.sh

# Final verification
print_status "Performing final verification..."
echo "" >> "$REMOVAL_LOG"
echo "=== Final State Check ===" >> "$REMOVAL_LOG"
echo "Packages:" >> "$REMOVAL_LOG"
dpkg -l | grep -E 'nginx|nodejs|npm|pm2|certbot' >> "$REMOVAL_LOG" || echo "No web packages found" >> "$REMOVAL_LOG"
echo "" >> "$REMOVAL_LOG"
echo "Directories:" >> "$REMOVAL_LOG"
ls -la /var/www/ >> "$REMOVAL_LOG" 2>&1 || echo "/var/www not found" >> "$REMOVAL_LOG"
ls -la /etc/nginx/ >> "$REMOVAL_LOG" 2>&1 || echo "/etc/nginx not found" >> "$REMOVAL_LOG"
echo "" >> "$REMOVAL_LOG"
echo "Services:" >> "$REMOVAL_LOG"
systemctl list-units --type=service | grep -E 'nginx|pm2' >> "$REMOVAL_LOG" || echo "No web services" >> "$REMOVAL_LOG"

echo ""
print_status "Uninstall complete!"
echo "Removal log saved to: $REMOVAL_LOG"
echo ""
echo "The following items were NOT removed (system defaults):"
echo "- www-data user (Ubuntu system user)"
echo "- Basic system packages (curl, wget, git, etc.)"
echo "- UFW firewall (reset to only allow SSH)"
echo ""