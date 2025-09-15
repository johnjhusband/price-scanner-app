#!/bin/bash
set -euo pipefail

echo "🔐 Applying Google OAuth credentials to blue.flippi.ai..."

# Check if we're on the blue server
if [[ "$(hostname)" != *"blue"* ]] && [[ "$PWD" != *"/var/www/blue.flippi.ai"* ]]; then
    echo "⚠️  This script should only run on the blue server"
    exit 1
fi

# Path to shared .env file
SHARED_ENV="/var/www/shared/.env"

# Create shared directory if it doesn't exist
mkdir -p /var/www/shared

# Backup existing .env if it exists
if [ -f "$SHARED_ENV" ]; then
    cp "$SHARED_ENV" "$SHARED_ENV.backup.$(date +%Y%m%d_%H%M%S)"
fi

# Check if OAuth credentials are already configured correctly
if grep -q "^GOOGLE_CLIENT_ID=54703081262" "$SHARED_ENV" 2>/dev/null; then
    echo "✅ OAuth credentials already configured correctly"
else
    echo "📝 Updating OAuth credentials in shared .env..."
    
    # Remove any existing OAuth entries and OPENAI_API_KEY
    if [ -f "$SHARED_ENV" ]; then
        grep -v -E "^(GOOGLE_CLIENT_ID|GOOGLE_CLIENT_SECRET|JWT_SECRET|OPENAI_API_KEY)=" "$SHARED_ENV" > "$SHARED_ENV.tmp" || true
        mv "$SHARED_ENV.tmp" "$SHARED_ENV"
    fi
    
    # Append OAuth credentials
    cat >> "$SHARED_ENV" << EOF

# Google OAuth Credentials (Created July 25, 2025)
GOOGLE_CLIENT_ID=54703081262-jfcfm1h0jiljenmmrg59kjv0cfta2hdu.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
JWT_SECRET=flippi-jwt-secret-2025-blue-environment

# OpenAI API Key (Required for backend to start)
OPENAI_API_KEY=${OPENAI_API_KEY}
EOF
fi

echo "✅ OAuth credentials applied successfully"
echo "📋 Current OAuth configuration:"
grep -E "^(GOOGLE_CLIENT_ID|GOOGLE_CLIENT_SECRET|JWT_SECRET|OPENAI_API_KEY)=" "$SHARED_ENV" | sed 's/SECRET=.*/SECRET=***hidden***/' | sed 's/API_KEY=.*/API_KEY=***hidden***/'

# Restart backend to pick up new environment variables
echo "🔄 Restarting backend to apply changes..."
pm2 restart dev-backend

echo "✅ OAuth configuration complete!"