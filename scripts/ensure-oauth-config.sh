#!/bin/bash
set -euo pipefail

echo "🔐 Ensuring OAuth configuration..."

# Only run on blue server
if [[ "$PWD" != *"/var/www/blue.flippi.ai"* ]]; then
    echo "✅ Not on blue server, skipping OAuth setup"
    exit 0
fi

# Path to shared .env
SHARED_ENV="/var/www/shared/.env"
mkdir -p /var/www/shared

# Check if OAuth is already configured
if grep -q "^GOOGLE_CLIENT_ID=54703081262" "$SHARED_ENV" 2>/dev/null; then
    echo "✅ OAuth already configured"
    exit 0
fi

echo "📝 Configuring OAuth..."

# Remove old OAuth entries if they exist
if [ -f "$SHARED_ENV" ]; then
    grep -v -E "^(GOOGLE_CLIENT_ID|GOOGLE_CLIENT_SECRET|JWT_SECRET)=" "$SHARED_ENV" > "$SHARED_ENV.tmp" || true
    mv "$SHARED_ENV.tmp" "$SHARED_ENV"
fi

# Add OAuth credentials
cat >> "$SHARED_ENV" << 'EOF'

# Google OAuth 
GOOGLE_CLIENT_ID=54703081262-jfcfm1h0jiljenmmrg59kjv0cfta2hdu.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
JWT_SECRET=flippi-jwt-secret-2025-blue-environment
EOF

echo "✅ OAuth configured successfully"
echo "🔄 Restarting backend..."
pm2 restart dev-backend

echo "💖 OAuth setup complete!"