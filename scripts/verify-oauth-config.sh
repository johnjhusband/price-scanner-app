#!/bin/bash
# Script to verify OAuth configuration on staging/production environments

set -e

echo "=== OAuth Configuration Verification Script ==="
echo ""

# Detect environment based on current directory or command line argument
if [ -n "$1" ]; then
    ENV="$1"
else
    CURRENT_DIR=$(pwd)
    if [[ "$CURRENT_DIR" == *"app.flippi.ai"* ]]; then
        ENV="production"
    elif [[ "$CURRENT_DIR" == *"green.flippi.ai"* ]]; then
        ENV="staging"
    elif [[ "$CURRENT_DIR" == *"blue.flippi.ai"* ]]; then
        ENV="development"
    else
        echo "Usage: $0 [production|staging|development]"
        echo "Or run from within an environment directory"
        exit 1
    fi
fi

# Set environment-specific variables
case "$ENV" in
    production)
        DOMAIN="app.flippi.ai"
        PORT="3000"
        ENV_FILE="/var/www/app.flippi.ai/backend/.env"
        NGINX_CONFIG="/etc/nginx/sites-available/app.flippi.ai"
        ;;
    staging)
        DOMAIN="green.flippi.ai"
        PORT="3001"
        ENV_FILE="/var/www/green.flippi.ai/backend/.env"
        NGINX_CONFIG="/etc/nginx/sites-available/green.flippi.ai"
        ;;
    development)
        DOMAIN="blue.flippi.ai"
        PORT="3002"
        ENV_FILE="/var/www/blue.flippi.ai/backend/.env"
        NGINX_CONFIG="/etc/nginx/sites-available/blue.flippi.ai"
        ;;
    *)
        echo "ERROR: Invalid environment: $ENV"
        exit 1
        ;;
esac

echo "Checking OAuth configuration for: $DOMAIN"
echo "================================================"
echo ""

# Check 1: Environment Variables
echo "1. Checking Environment Variables..."
echo "   Location: $ENV_FILE"
echo ""

if [ -f "$ENV_FILE" ]; then
    # Check for required OAuth variables
    MISSING_VARS=()
    
    if ! grep -q "GOOGLE_CLIENT_ID=" "$ENV_FILE"; then
        MISSING_VARS+=("GOOGLE_CLIENT_ID")
    else
        echo "   ✓ GOOGLE_CLIENT_ID is set"
        CLIENT_ID=$(grep "GOOGLE_CLIENT_ID=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' | tr -d "'" | head -1)
        echo "     Value: ${CLIENT_ID:0:20}... (truncated for security)"
    fi
    
    if ! grep -q "GOOGLE_CLIENT_SECRET=" "$ENV_FILE"; then
        MISSING_VARS+=("GOOGLE_CLIENT_SECRET")
    else
        echo "   ✓ GOOGLE_CLIENT_SECRET is set"
        SECRET=$(grep "GOOGLE_CLIENT_SECRET=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' | tr -d "'" | head -1)
        echo "     Value: ${SECRET:0:10}... (truncated for security)"
    fi
    
    if ! grep -q "JWT_SECRET=" "$ENV_FILE"; then
        MISSING_VARS+=("JWT_SECRET")
    else
        echo "   ✓ JWT_SECRET is set"
        JWT=$(grep "JWT_SECRET=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' | tr -d "'" | head -1)
        echo "     Length: ${#JWT} characters"
        if [ ${#JWT} -lt 32 ]; then
            echo "     ⚠ WARNING: JWT_SECRET should be at least 32 characters"
        fi
    fi
    
    if ! grep -q "FRONTEND_URL=" "$ENV_FILE"; then
        MISSING_VARS+=("FRONTEND_URL")
    else
        echo "   ✓ FRONTEND_URL is set"
        FRONTEND=$(grep "FRONTEND_URL=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' | tr -d "'" | head -1)
        echo "     Value: $FRONTEND"
        if [ "$FRONTEND" != "https://$DOMAIN" ]; then
            echo "     ⚠ WARNING: FRONTEND_URL should be https://$DOMAIN"
        fi
    fi
    
    if [ ${#MISSING_VARS[@]} -gt 0 ]; then
        echo ""
        echo "   ✗ Missing environment variables:"
        for var in "${MISSING_VARS[@]}"; do
            echo "     - $var"
        done
    fi
else
    echo "   ✗ Environment file not found: $ENV_FILE"
fi

echo ""

# Check 2: Nginx Configuration
echo "2. Checking Nginx Configuration..."
echo "   Location: $NGINX_CONFIG"
echo ""

if [ -f "$NGINX_CONFIG" ]; then
    if grep -q "location /auth" "$NGINX_CONFIG"; then
        echo "   ✓ OAuth routes configured in nginx"
        
        # Check if proxy_pass is correct
        if grep -A5 "location /auth" "$NGINX_CONFIG" | grep -q "proxy_pass http://localhost:$PORT"; then
            echo "   ✓ Proxy pass correctly set to port $PORT"
        else
            echo "   ✗ Proxy pass may be incorrect for port $PORT"
        fi
    else
        echo "   ✗ OAuth routes NOT configured in nginx"
        echo "   Run: sudo bash scripts/apply-staging-oauth-fix.sh"
    fi
else
    echo "   ✗ Nginx config not found: $NGINX_CONFIG"
fi

echo ""

# Check 3: Backend Service
echo "3. Checking Backend Service..."
echo ""

# Check if PM2 process is running
PM2_NAME="${ENV}-backend"
if [ "$ENV" = "production" ]; then
    PM2_NAME="prod-backend"
elif [ "$ENV" = "development" ]; then
    PM2_NAME="dev-backend"
fi

if pm2 show "$PM2_NAME" > /dev/null 2>&1; then
    echo "   ✓ Backend service is running (PM2: $PM2_NAME)"
    
    # Check if backend is responding
    if curl -s -f "http://localhost:$PORT/health" > /dev/null 2>&1; then
        echo "   ✓ Backend is responding on port $PORT"
    else
        echo "   ✗ Backend not responding on port $PORT"
    fi
else
    echo "   ✗ Backend service not running (PM2: $PM2_NAME)"
fi

echo ""

# Check 4: OAuth Endpoint Test
echo "4. Testing OAuth Endpoints..."
echo ""

# Test internal endpoint
INTERNAL_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT/auth/google" 2>/dev/null || echo "000")
if [ "$INTERNAL_RESPONSE" = "302" ] || [ "$INTERNAL_RESPONSE" = "301" ]; then
    echo "   ✓ Internal OAuth endpoint responding correctly (redirect)"
else
    echo "   ✗ Internal OAuth endpoint not working (status: $INTERNAL_RESPONSE)"
fi

# Test external endpoint
EXTERNAL_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -I "https://$DOMAIN/auth/google" 2>/dev/null || echo "000")
if [ "$EXTERNAL_RESPONSE" = "302" ] || [ "$EXTERNAL_RESPONSE" = "301" ]; then
    echo "   ✓ External OAuth endpoint responding correctly (redirect)"
else
    echo "   ✗ External OAuth endpoint not working (status: $EXTERNAL_RESPONSE)"
    if [ "$EXTERNAL_RESPONSE" = "200" ]; then
        echo "     (Getting HTML instead of redirect - nginx not configured)"
    fi
fi

echo ""

# Check 5: Database
echo "5. Checking Database..."
echo ""

DB_PATH="/var/lib/flippi${ENV:+-$ENV}/flippi.db"
if [ "$ENV" = "production" ]; then
    DB_PATH="/var/lib/flippi/flippi.db"
elif [ "$ENV" = "development" ]; then
    DB_PATH="/var/lib/flippi-dev/flippi.db"
fi

if [ -f "$DB_PATH" ]; then
    echo "   ✓ Database exists: $DB_PATH"
    
    # Check if users table exists
    if sqlite3 "$DB_PATH" ".tables" 2>/dev/null | grep -q "users"; then
        echo "   ✓ Users table exists"
        USER_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "0")
        echo "   Total users: $USER_COUNT"
    else
        echo "   ⚠ Users table does not exist (will be created on first login)"
    fi
else
    echo "   ⚠ Database does not exist yet: $DB_PATH"
    echo "     (Will be created on first use)"
fi

echo ""
echo "================================================"
echo "Summary for $DOMAIN:"
echo ""

# Final summary
ALL_GOOD=true

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo "❌ Missing environment variables (${#MISSING_VARS[@]})"
    ALL_GOOD=false
else
    echo "✅ All environment variables configured"
fi

if ! grep -q "location /auth" "$NGINX_CONFIG" 2>/dev/null; then
    echo "❌ Nginx OAuth routes not configured"
    ALL_GOOD=false
else
    echo "✅ Nginx OAuth routes configured"
fi

if [ "$EXTERNAL_RESPONSE" != "302" ] && [ "$EXTERNAL_RESPONSE" != "301" ]; then
    echo "❌ OAuth endpoint not accessible"
    ALL_GOOD=false
else
    echo "✅ OAuth endpoint accessible"
fi

echo ""

if $ALL_GOOD; then
    echo "🎉 OAuth configuration looks good!"
    echo "   Test login at: https://$DOMAIN"
else
    echo "⚠️  OAuth configuration needs attention"
    echo ""
    echo "Next steps:"
    if [ ${#MISSING_VARS[@]} -gt 0 ]; then
        echo "1. Add missing environment variables to $ENV_FILE"
    fi
    if ! grep -q "location /auth" "$NGINX_CONFIG" 2>/dev/null; then
        echo "2. Run: sudo bash scripts/apply-staging-oauth-fix.sh"
    fi
    if [ "$EXTERNAL_RESPONSE" != "302" ] && [ "$EXTERNAL_RESPONSE" != "301" ]; then
        echo "3. Check nginx configuration and reload"
    fi
fi

echo ""
echo "Don't forget to add this callback URL in Google Cloud Console:"
echo "👉 https://$DOMAIN/auth/google/callback"