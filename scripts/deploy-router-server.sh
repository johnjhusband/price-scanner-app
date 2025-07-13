#!/bin/bash

SERVER_IP="157.245.142.145"
SERVER_PASS="Thisismynewpassord!"

echo "=== Deploying Router Architecture on Server ==="

# Copy files and deploy on server
sshpass -p "$SERVER_PASS" ssh root@$SERVER_IP << 'EOF'
cd /root/price-scanner-app

echo "1. Creating router setup..."
mkdir -p router

cat > router/docker-compose.yml << 'YAML'
services:
  nginx-proxy:
    image: nginxproxy/nginx-proxy
    container_name: nginx-proxy
    ports:
      - "8080:80"
      - "8443:443"
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
YAML

echo "2. Creating network..."
docker network create proxy_network 2>/dev/null || true

echo "3. Starting router on ports 8080/8443 (prod stays on 80/443)..."
cd router
docker compose up -d

echo "4. Checking router status..."
docker ps | grep -E "nginx-proxy|letsencrypt"

echo "=== Router deployed on 8080/8443 ==="
echo "Production remains untouched on 80/443"
EOF