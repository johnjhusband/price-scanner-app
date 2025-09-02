#!/bin/bash

# Setup SSL Certificate for flippi.ai Root Domain
# Issue #83: Add SSL Certificate for flippi.ai Root Domain

set -e

echo "=== SSL Setup for flippi.ai Root Domain ==="
echo "This script will configure SSL certificates for flippi.ai and www.flippi.ai"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Error: This script must be run as root (use sudo)"
    exit 1
fi

# Configuration
DOMAIN="flippi.ai"
WWW_DOMAIN="www.flippi.ai"
EMAIL="admin@flippi.ai"
NGINX_CONF="/etc/nginx/sites-available/flippi.ai.conf"
NGINX_ENABLED="/etc/nginx/sites-enabled/flippi.ai.conf"
SOURCE_CONF="nginx/flippi.ai.conf"

# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
    echo "Error: certbot is not installed"
    echo "Install it with: apt-get update && apt-get install -y certbot python3-certbot-nginx"
    exit 1
fi

# Check if nginx is installed
if ! command -v nginx &> /dev/null; then
    echo "Error: nginx is not installed"
    exit 1
fi

# Check DNS resolution
echo "Checking DNS resolution..."
SERVER_IP=$(curl -s http://checkip.amazonaws.com/)
DOMAIN_IP=$(dig +short $DOMAIN | tail -n1)
WWW_IP=$(dig +short $WWW_DOMAIN | tail -n1)

echo "Server IP: $SERVER_IP"
echo "$DOMAIN resolves to: $DOMAIN_IP"
echo "$WWW_DOMAIN resolves to: $WWW_IP"

if [ "$DOMAIN_IP" != "$SERVER_IP" ]; then
    echo "Warning: $DOMAIN does not point to this server!"
    echo "Please update DNS A record for $DOMAIN to point to $SERVER_IP"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

if [ "$WWW_IP" != "$SERVER_IP" ]; then
    echo "Warning: $WWW_DOMAIN does not point to this server!"
    echo "Please update DNS A record for $WWW_DOMAIN to point to $SERVER_IP"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Copy nginx configuration
echo "Installing nginx configuration..."
if [ -f "$SOURCE_CONF" ]; then
    cp "$SOURCE_CONF" "$NGINX_CONF"
else
    echo "Error: Source configuration file not found: $SOURCE_CONF"
    echo "Please run this script from the price-scanner-app directory"
    exit 1
fi

# Create symbolic link in sites-enabled
ln -sf "$NGINX_CONF" "$NGINX_ENABLED"

# Test nginx configuration
echo "Testing nginx configuration..."
nginx -t || {
    echo "Error: Nginx configuration test failed"
    exit 1
}

# Reload nginx to apply the configuration
echo "Reloading nginx..."
systemctl reload nginx

# Obtain SSL certificate
echo "Obtaining SSL certificate from Let's Encrypt..."
certbot --nginx \
    -d $DOMAIN \
    -d $WWW_DOMAIN \
    --non-interactive \
    --agree-tos \
    --email $EMAIL \
    --redirect \
    --expand

# Verify certificate installation
echo ""
echo "Verifying certificate installation..."
if certbot certificates | grep -q "$DOMAIN"; then
    echo "✓ Certificate successfully installed for $DOMAIN"
else
    echo "✗ Certificate installation may have failed"
    exit 1
fi

# Test HTTPS
echo ""
echo "Testing HTTPS endpoints..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -L "https://$DOMAIN/health")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✓ HTTPS is working for $DOMAIN"
else
    echo "✗ HTTPS test failed for $DOMAIN (HTTP $HTTP_CODE)"
fi

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -L "https://$WWW_DOMAIN/health")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✓ HTTPS is working for $WWW_DOMAIN"
else
    echo "✗ HTTPS test failed for $WWW_DOMAIN (HTTP $HTTP_CODE)"
fi

# Test redirect
echo ""
echo "Testing HTTP to HTTPS redirect..."
REDIRECT_URL=$(curl -s -o /dev/null -w "%{redirect_url}" "http://$DOMAIN/")
if [[ "$REDIRECT_URL" == "https://"* ]]; then
    echo "✓ HTTP to HTTPS redirect is working"
else
    echo "✗ HTTP to HTTPS redirect test failed"
fi

# Check auto-renewal
echo ""
echo "Checking auto-renewal configuration..."
if systemctl is-enabled certbot.timer &> /dev/null; then
    echo "✓ Auto-renewal is enabled"
    echo "Next renewal check:"
    systemctl status certbot.timer | grep "Trigger:" || true
else
    echo "Enabling auto-renewal..."
    systemctl enable certbot.timer
    systemctl start certbot.timer
    echo "✓ Auto-renewal enabled"
fi

echo ""
echo "=== SSL Setup Complete ==="
echo ""
echo "Summary:"
echo "- SSL certificate installed for $DOMAIN and $WWW_DOMAIN"
echo "- HTTP traffic will redirect to HTTPS"
echo "- Root domain will redirect to https://app.flippi.ai"
echo "- Auto-renewal is configured"
echo ""
echo "Certificate details:"
certbot certificates | grep -A 3 "$DOMAIN" || true
echo ""
echo "To manually renew certificates: sudo certbot renew"
echo "To test renewal: sudo certbot renew --dry-run"