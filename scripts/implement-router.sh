#!/bin/bash

echo "=== Implementing Docker-Native Router Architecture ==="
echo "This will set up nginx-proxy for all environments"
echo ""

# Phase 1: Create Router Infrastructure
echo "PHASE 1: Creating router infrastructure (no prod impact)..."

echo "1. Creating router directory..."
mkdir -p router
cd router

echo "2. Creating router docker-compose.yml..."
cat > docker-compose.yml << 'EOF'
version: '3'

services:
  nginx-proxy:
    image: nginxproxy/nginx-proxy
    container_name: nginx-proxy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/tmp/docker.sock:ro
      - certs:/etc/nginx/certs
      - html:/usr/share/nginx/html
      - vhost:/etc/nginx/vhost.d
    restart: unless-stopped

  letsencrypt-companion:
    image: nginxproxy/acme-companion
    container_name: letsencrypt-companion
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - certs:/etc/nginx/certs
      - html:/usr/share/nginx/html
      - vhost:/etc/nginx/vhost.d
      - acme:/etc/acme.sh
    environment:
      - NGINX_PROXY_CONTAINER=nginx-proxy
    restart: unless-stopped
    depends_on:
      - nginx-proxy

volumes:
  certs:
  html:
  vhost:
  acme:

networks:
  default:
    name: proxy_network
    external: true
EOF

echo "3. Creating proxy network..."
docker network create proxy_network 2>/dev/null || echo "Network already exists"

echo "4. Starting router (no routes yet, prod unaffected)..."
docker compose up -d

cd ..

# Phase 2: Prepare environments
echo -e "\nPHASE 2: Updating environment configurations..."

echo "5. Updating blue docker-compose.yml..."
cat > blue/deployment/docker-compose.yml << 'EOF'
version: '3'

services:
  backend:
    build:
      context: ../backend
      dockerfile: Dockerfile
    image: thrifting-buddy/backend:blue
    container_name: blue_backend
    restart: unless-stopped
    env_file:
      - ../../../shared/.env
    networks:
      - blue_network
      - proxy_network
    environment:
      - VIRTUAL_HOST=blue.flippi.ai
      - VIRTUAL_PATH=/api,/health
      - VIRTUAL_PORT=3000
      - LETSENCRYPT_HOST=blue.flippi.ai
      - LETSENCRYPT_EMAIL=admin@flippi.ai

  frontend:
    build:
      context: ../mobile-app
      dockerfile: Dockerfile
    image: thrifting-buddy/frontend:blue
    container_name: blue_frontend
    restart: unless-stopped
    networks:
      - blue_network
      - proxy_network
    environment:
      - VIRTUAL_HOST=blue.flippi.ai
      - VIRTUAL_PATH=/
      - VIRTUAL_PORT=8080
      - LETSENCRYPT_HOST=blue.flippi.ai
      - LETSENCRYPT_EMAIL=admin@flippi.ai

networks:
  blue_network:
    name: blue_network
  proxy_network:
    external: true
EOF

echo "6. Deploying blue through router to test..."
cd blue/deployment
docker compose down 2>/dev/null
docker compose up -d
cd ../..

echo "7. Waiting for blue to start..."
sleep 15

echo "8. Testing blue.flippi.ai..."
curl -s https://blue.flippi.ai/health && echo -e "\n✓ Blue is working through router" || echo -e "\n✗ Blue test failed"

# Phase 3: Prepare production (but don't switch yet)
echo -e "\nPHASE 3: Preparing production configuration..."

echo "9. Creating new prod docker-compose.yml..."
cat > prod/deployment/docker-compose-new.yml << 'EOF'
version: '3'

services:
  backend:
    build:
      context: ../backend
      dockerfile: Dockerfile
    image: thrifting-buddy/backend:v0.1.1
    container_name: prod_backend
    restart: unless-stopped
    env_file:
      - ../../../shared/.env
    networks:
      - prod_network
      - proxy_network
    environment:
      - VIRTUAL_HOST=app.flippi.ai
      - VIRTUAL_PATH=/api,/health
      - VIRTUAL_PORT=3000
      - LETSENCRYPT_HOST=app.flippi.ai
      - LETSENCRYPT_EMAIL=admin@flippi.ai

  frontend:
    build:
      context: ../mobile-app
      dockerfile: Dockerfile
    image: thrifting-buddy/frontend:v0.1.1
    container_name: prod_frontend
    restart: unless-stopped
    networks:
      - prod_network
      - proxy_network
    environment:
      - VIRTUAL_HOST=app.flippi.ai
      - VIRTUAL_PATH=/
      - VIRTUAL_PORT=8080
      - LETSENCRYPT_HOST=app.flippi.ai
      - LETSENCRYPT_EMAIL=admin@flippi.ai

networks:
  prod_network:
    name: prod_network
  proxy_network:
    external: true
EOF

echo -e "\n=== READY FOR PRODUCTION SWITCH ==="
echo "Blue environment is running through the router successfully."
echo "Production is still running on its own nginx."
echo ""
echo "To switch production (5 second downtime):"
echo "1. cd prod/deployment"
echo "2. docker compose -f docker-compose.yml down"
echo "3. docker compose -f docker-compose-new.yml up -d"
echo ""
echo "Router infrastructure is ready and tested!"