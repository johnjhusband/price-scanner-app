#!/bin/bash
# Deployment validation script - ensures deployment will succeed

set -e

echo "=== Validating Deployment Prerequisites ==="

# Check Docker
if ! docker info >/dev/null 2>&1; then
  echo "❌ Docker is not running"
  exit 1
fi

# Check Docker Compose v2
if ! docker compose version >/dev/null 2>&1; then
  echo "❌ Docker Compose v2 not found"
  exit 1
fi

# Check required files
if [ ! -f "backend/.env" ]; then
  echo "❌ backend/.env file missing"
  exit 1
fi

if [ ! -f "docker-compose.yml" ]; then
  echo "❌ docker-compose.yml missing"
  exit 1
fi

# Check required images exist
if ! docker images | grep -q "thrifting-buddy/backend"; then
  echo "❌ Backend image not built. Run: docker build -f backend/Dockerfile.backend -t thrifting-buddy/backend ./backend"
  exit 1
fi

if ! docker images | grep -q "thrifting-buddy/frontend"; then
  echo "❌ Frontend image not built. Run: docker build -f mobile-app/Dockerfile.frontend -t thrifting-buddy/frontend ./mobile-app"
  exit 1
fi

# Check ports are available
for port in 80 443 3000 5432 6379 19006; do
  if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "❌ Port $port is already in use"
    exit 1
  fi
done

# Check disk space (need at least 3GB)
available=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')
if [ "$available" -lt 3 ]; then
  echo "❌ Insufficient disk space. Need 3GB, have ${available}GB"
  exit 1
fi

# Clean up any existing deployment
if docker compose ps -q 2>/dev/null | grep -q .; then
  echo "⚠️  Existing deployment found, cleaning up..."
  docker compose down >/dev/null 2>&1
fi

echo "✅ All prerequisites met. Ready to deploy."
echo ""
echo "Run: docker compose up -d"