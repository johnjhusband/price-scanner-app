#!/bin/bash

# Enable FotoFlip Luxe Photo feature for Blue environment
# Issue #175: Add FotoFlip Luxe Photo Feature

echo "=== Enabling FotoFlip Luxe Photo for Blue Environment ==="
echo ""

# Check if we're on the server
if [ ! -f "/var/www/blue.flippi.ai/backend/.env" ]; then
    echo "ERROR: This script must be run on the Blue environment server"
    echo "Please SSH into the server and run this script there."
    exit 1
fi

# Backup current .env file
cp /var/www/blue.flippi.ai/backend/.env /var/www/blue.flippi.ai/backend/.env.backup.$(date +%Y%m%d_%H%M%S)

# Add FotoFlip configuration to .env if not already present
echo ""
echo "Adding FotoFlip configuration..."

# Check if ENABLE_LUXE_PHOTO already exists
if grep -q "ENABLE_LUXE_PHOTO" /var/www/blue.flippi.ai/backend/.env; then
    # Update existing value
    sed -i 's/ENABLE_LUXE_PHOTO=.*/ENABLE_LUXE_PHOTO=true/' /var/www/blue.flippi.ai/backend/.env
else
    # Add new configuration
    cat >> /var/www/blue.flippi.ai/backend/.env << 'EOF'

# FotoFlip Luxe Photo Configuration
ENABLE_LUXE_PHOTO=true
ENVIRONMENT=blue
FOTOFLIP_MODE=beautify
FOTOFLIP_BG_COLOR=#FAF6F1

# Optional: Add these if you have API keys
# OPENAI_API_KEY=your-openai-api-key-here
# IMGBB_API_KEY=your-imgbb-api-key-here
EOF
fi

# Install Python dependencies if not already installed
echo ""
echo "Checking Python dependencies..."
if ! python3 -c "import rembg" 2>/dev/null; then
    echo "Installing rembg for background removal..."
    pip3 install rembg pillow numpy
fi

# Restart backend to apply changes
echo ""
echo "Restarting backend service..."
pm2 restart blue-backend

# Wait for service to start
sleep 5

# Test the endpoint
echo ""
echo "Testing FotoFlip health endpoint..."
curl -s https://blue.flippi.ai/api/fotoflip/health | python3 -m json.tool

echo ""
echo "=== FotoFlip Luxe Photo Feature Enabled ==="
echo ""
echo "Configuration:"
echo "- Feature enabled for Blue environment only"
echo "- Background color: Hermès cream (#FAF6F1)"
echo "- Mode: beautify"
echo ""
echo "Available endpoints:"
echo "- POST /api/fotoflip/luxe-photo - Process image with Luxe Photo"
echo "- GET /api/fotoflip/health - Check service health"
echo "- POST /api/fotoflip/process-base64 - Process and return as base64"
echo ""
echo "To test from command line:"
echo 'curl -X POST -F "image=@test.jpg" https://blue.flippi.ai/api/fotoflip/luxe-photo'
echo ""
echo "Note: For full functionality, add OPENAI_API_KEY and IMGBB_API_KEY to .env"