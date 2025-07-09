#!/bin/bash
# Pre-deployment validation script for MVP

echo "=== Pre-Deployment Validation ==="

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not installed"
    exit 1
fi
echo "✓ Docker installed"

# Check Docker Compose
if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose v2 not found"
    exit 1
fi
echo "✓ Docker Compose v2 installed"

# Check required files
REQUIRED_FILES=(
    "docker-compose.yml"
    "backend/.env"
    "backend/Dockerfile.backend"
    "mobile-app/Dockerfile.frontend"
    "mobile-app/Dockerfile.mobile-web"
    "nginx/Dockerfile"
    "nginx/nginx.conf"
    "mobile-app/nginx-default.conf"
    "mobile-app/mobile-nginx.conf"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Missing required file: $file"
        exit 1
    fi
done
echo "✓ All required files present"

# Check required environment variables
REQUIRED_VARS=(
    "JWT_ACCESS_SECRET"
    "JWT_REFRESH_SECRET"
    "OPENAI_API_KEY"
)

for var in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "^${var}=" backend/.env; then
        echo "❌ Missing required variable: $var in backend/.env"
        exit 1
    fi
done
echo "✓ All required environment variables set"

# Check disk space
AVAILABLE_SPACE=$(df -BG / | awk 'NR==2 {print $4}' | sed 's/G//')
if [ "$AVAILABLE_SPACE" -lt 3 ]; then
    echo "❌ Insufficient disk space: ${AVAILABLE_SPACE}GB (need 3GB)"
    exit 1
fi
echo "✓ Sufficient disk space: ${AVAILABLE_SPACE}GB"

# Check ports
PORTS=(80 443 3000 5432 6379 19006)
for port in "${PORTS[@]}"; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "⚠️  Warning: Port $port is already in use"
    fi
done

# Security warning for default passwords
echo ""
echo "⚠️  Security Notice: Using default passwords (changeme) for PostgreSQL and Redis"
echo "   For production, set DB_PASSWORD and REDIS_PASSWORD environment variables"

echo ""
echo "✅ Pre-deployment validation passed!"
echo ""
echo "To deploy, run: docker compose up -d"