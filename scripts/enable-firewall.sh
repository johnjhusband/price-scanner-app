#!/bin/bash
# Enable UFW firewall with proper rules for Flippi.ai
# IMPORTANT: Run this script ON THE SERVER, not locally
# WARNING: Ensure you have SSH access before running this to avoid lockout

echo "=== Enabling UFW Firewall for Flippi.ai ==="
echo ""
echo "WARNING: This script will enable the firewall."
echo "Ensure you are running this from a stable SSH connection."
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Firewall configuration cancelled."
    exit 0
fi

# Set default policies
echo "Setting default policies..."
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (critical - do this first to avoid lockout)
echo "Allowing SSH access..."
sudo ufw allow 22/tcp comment 'SSH'

# Allow HTTP and HTTPS
echo "Allowing web traffic..."
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'

# Allow Node.js ports for PM2 apps (internal only, not from outside)
# These are already proxied through nginx, so no need to expose directly

# Enable firewall
echo ""
echo "Enabling firewall..."
echo "y" | sudo ufw enable

# Show status
echo ""
echo "Firewall status:"
sudo ufw status verbose

echo ""
echo "=== Firewall enabled successfully ==="
echo ""
echo "Current rules:"
echo "- SSH (22/tcp) - ALLOWED"
echo "- HTTP (80/tcp) - ALLOWED" 
echo "- HTTPS (443/tcp) - ALLOWED"
echo "- All other incoming traffic - DENIED"
echo ""
echo "Node.js applications are accessible through nginx proxy only."