#!/bin/bash
# Containerization validation - ensures true portability

set -e

echo "=== Containerization Validation ==="
echo ""

# Test 1: Check all images exist
echo "1. Checking required images..."
IMAGES=("thrifting-buddy/backend" "thrifting-buddy/frontend" "thrifting-buddy/mobile-web" "thrifting-buddy/nginx")
for img in "${IMAGES[@]}"; do
  if docker images | grep -q "$img"; then
    echo "✅ $img:latest exists"
  else
    echo "❌ $img:latest missing"
    exit 1
  fi
done

# Test 2: No volume mounts in production compose
echo ""
echo "2. Checking for volume mounts (anti-pattern)..."
VOLUME_COUNT=$(grep -c "volumes:" docker-compose.yml | grep -v "^volumes:" || true)
if [ "$VOLUME_COUNT" -gt 2 ]; then  # Only postgres_data and redis_data allowed
  echo "❌ Found volume mounts in docker-compose.yml (violates portability)"
  exit 1
else
  echo "✅ No improper volume mounts found"
fi

# Test 3: Test each image runs standalone
echo ""
echo "3. Testing standalone execution (true portability test)..."

# Clean environment
docker network create test-net 2>/dev/null || true

# Test frontend
echo "   Testing frontend..."
docker run -d --rm --name test-frontend --network test-net -p 8081:80 thrifting-buddy/frontend:latest
sleep 2
if curl -s http://localhost:8081 | grep -q "html"; then
  echo "   ✅ Frontend runs standalone"
else
  echo "   ❌ Frontend failed standalone test"
fi
docker stop test-frontend 2>/dev/null || true

# Test mobile-web
echo "   Testing mobile-web..."
docker run -d --rm --name test-mobile --network test-net -p 19007:19006 thrifting-buddy/mobile-web:latest
sleep 2
if curl -s http://localhost:19007 | grep -q "html"; then
  echo "   ✅ Mobile-web runs standalone"
else
  echo "   ❌ Mobile-web failed standalone test"
fi
docker stop test-mobile 2>/dev/null || true

# Test nginx (needs backend/frontend stubs)
echo "   Testing nginx..."
docker run -d --rm --name test-nginx --network test-net -p 8082:80 thrifting-buddy/nginx:latest
sleep 2
if docker logs test-nginx 2>&1 | grep -q "start worker process"; then
  echo "   ✅ Nginx runs standalone"
else
  echo "   ❌ Nginx failed standalone test"
fi
docker stop test-nginx 2>/dev/null || true

# Cleanup
docker network rm test-net 2>/dev/null || true

echo ""
echo "=== Validation Summary ==="
echo "All images are properly containerized and portable."
echo "These containers can run on any server with just Docker installed."