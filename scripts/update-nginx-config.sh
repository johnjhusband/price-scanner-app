#!/bin/bash

# Script to update nginx configuration for larger request bodies
# This must be run on the server with sudo privileges

set -e

echo "=== Updating Nginx Configuration for Flippi.ai ==="
echo "This script will add client_max_body_size 50M to all Flippi server blocks"
echo

# Backup existing configurations
echo "Creating backups..."
sudo cp /etc/nginx/sites-available/app.flippi.ai /etc/nginx/sites-available/app.flippi.ai.backup-$(date +%Y%m%d-%H%M%S)
sudo cp /etc/nginx/sites-available/green.flippi.ai /etc/nginx/sites-available/green.flippi.ai.backup-$(date +%Y%m%d-%H%M%S)
sudo cp /etc/nginx/sites-available/blue.flippi.ai /etc/nginx/sites-available/blue.flippi.ai.backup-$(date +%Y%m%d-%H%M%S)

# Function to add client_max_body_size to a config file
add_client_max_body_size() {
    local config_file=$1
    local domain=$2
    
    echo "Updating $domain configuration..."
    
    # Check if client_max_body_size already exists
    if grep -q "client_max_body_size" "$config_file"; then
        echo "  client_max_body_size already exists in $domain config, updating value..."
        sudo sed -i 's/client_max_body_size.*/client_max_body_size 50M;/g' "$config_file"
    else
        echo "  Adding client_max_body_size to $domain config..."
        # Add after the server_name line
        sudo sed -i '/server_name/a\    client_max_body_size 50M;' "$config_file"
    fi
}

# Update each configuration
add_client_max_body_size "/etc/nginx/sites-available/app.flippi.ai" "app.flippi.ai"
add_client_max_body_size "/etc/nginx/sites-available/green.flippi.ai" "green.flippi.ai"
add_client_max_body_size "/etc/nginx/sites-available/blue.flippi.ai" "blue.flippi.ai"

echo
echo "Testing nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo
    echo "Configuration test passed. Reloading nginx..."
    sudo nginx -s reload
    echo "✅ Nginx configuration updated successfully!"
    echo
    echo "The following changes were made:"
    echo "- Added client_max_body_size 50M to all Flippi domains"
    echo "- This allows upload of images up to 50MB"
    echo
    echo "Backups were created with timestamp suffix"
else
    echo
    echo "❌ Nginx configuration test failed!"
    echo "Please check the error messages above"
    echo "Backups are available with .backup-* suffix"
    exit 1
fi