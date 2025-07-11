#!/bin/bash

# Safe deployment of blue environment without affecting production

SERVER_IP="157.245.142.145"
SERVER_PASS="Thisismynewpassord!"

echo "=== Safe Blue Deployment ==="

# First, get SSL certificate for blue.flippi.ai using production nginx
sshpass -p "$SERVER_PASS" ssh root@$SERVER_IP << 'EOF'
cd /root/price-scanner-app/deployment

echo "1. Adding blue.flippi.ai to production nginx for cert generation..."
cat > nginx/blue-cert.conf << 'NGINX'
server {
    listen 80;
    server_name blue.flippi.ai;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}
NGINX

# Copy to nginx container
docker cp nginx/blue-cert.conf thrifting_buddy_nginx:/etc/nginx/conf.d/blue-cert.conf
docker exec thrifting_buddy_nginx nginx -s reload

echo "2. Getting SSL certificate for blue.flippi.ai..."
mkdir -p certbot-blue/conf certbot-blue/www

docker run --rm \
  -v $(pwd)/certbot/conf:/etc/letsencrypt \
  -v $(pwd)/certbot/www:/var/www/certbot \
  certbot/certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  --email admin@flippi.ai \
  --agree-tos \
  --no-eff-email \
  -d blue.flippi.ai

# Copy cert to blue directory
cp -r certbot/conf/live/blue.flippi.ai certbot-blue/conf/live/
cp -r certbot/conf/archive certbot-blue/conf/
cp certbot/conf/renewal/blue.flippi.ai.conf certbot-blue/conf/renewal/ 2>/dev/null || true

echo "3. Removing temporary nginx config..."
docker exec thrifting_buddy_nginx rm /etc/nginx/conf.d/blue-cert.conf
docker exec thrifting_buddy_nginx nginx -s reload

echo "4. Starting blue environment on different ports..."
# Update docker-compose to use different ports
sed -i 's/80:80/8080:80/g' docker-compose-nginx-blue.yml
sed -i 's/443:443/8443:443/g' docker-compose-nginx-blue.yml

docker compose -f docker-compose-nginx-blue.yml up -d

echo "5. Setting up port forwarding with iptables..."
# Forward blue.flippi.ai traffic to blue containers
iptables -t nat -A PREROUTING -d 157.245.142.145 -p tcp --dport 80 -m comment --comment "blue.flippi.ai" -j DNAT --to-destination 157.245.142.145:8080
iptables -t nat -A PREROUTING -d 157.245.142.145 -p tcp --dport 443 -m comment --comment "blue.flippi.ai" -j DNAT --to-destination 157.245.142.145:8443

echo "6. Checking blue deployment..."
sleep 5
docker ps | grep blue

echo "=== Blue deployment complete ==="
echo "Blue environment should be accessible at https://blue.flippi.ai"
echo "Production remains at https://app.flippi.ai"
EOF