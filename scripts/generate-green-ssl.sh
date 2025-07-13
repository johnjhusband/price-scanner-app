#!/bin/bash

# Generate SSL certificate for green.flippi.ai using Let's Encrypt

SERVER_IP="157.245.142.145"
SERVER_PASS="Thisismynewpassord!"

echo "=== Generating SSL Certificate for green.flippi.ai ==="

# Create certbot command script
cat > /tmp/certbot-green.sh << 'EOF'
#!/bin/bash

echo "Checking existing certificates..."
docker exec thrifting_buddy_certbot certbot certificates

echo -e "\n1. Generating certificate for green.flippi.ai..."
docker exec thrifting_buddy_certbot certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email jhusband@digitalocean.com \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    -d green.flippi.ai

echo -e "\n2. Checking if certificate was created..."
if docker exec thrifting_buddy_certbot ls -la /etc/letsencrypt/live/green.flippi.ai/; then
    echo "✅ Certificate created successfully"
    
    echo -e "\n3. Updating nginx configuration to use the new certificate..."
    # Update the green nginx config to use its own certificate
    docker exec thrifting_buddy_nginx sed -i \
        's|ssl_certificate /etc/letsencrypt/live/app.flippi.ai/fullchain.pem;|ssl_certificate /etc/letsencrypt/live/green.flippi.ai/fullchain.pem;|' \
        /etc/nginx/conf.d/green.conf
    
    docker exec thrifting_buddy_nginx sed -i \
        's|ssl_certificate_key /etc/letsencrypt/live/app.flippi.ai/privkey.pem;|ssl_certificate_key /etc/letsencrypt/live/green.flippi.ai/privkey.pem;|' \
        /etc/nginx/conf.d/green.conf
    
    echo -e "\n4. Testing nginx configuration..."
    docker exec thrifting_buddy_nginx nginx -t
    
    echo -e "\n5. Reloading nginx..."
    docker exec thrifting_buddy_nginx nginx -s reload
    
    echo -e "\n✅ SSL certificate for green.flippi.ai has been generated and configured!"
else
    echo "❌ Failed to create certificate"
    exit 1
fi

echo -e "\n6. Verifying all certificates..."
docker exec thrifting_buddy_certbot certbot certificates
EOF

chmod +x /tmp/certbot-green.sh

# Transfer and execute on server
echo -e "\nTransferring script to server..."
sshpass -p "$SERVER_PASS" scp /tmp/certbot-green.sh root@$SERVER_IP:/tmp/

echo -e "\nExecuting on server..."
sshpass -p "$SERVER_PASS" ssh root@$SERVER_IP "bash /tmp/certbot-green.sh"

# Test the certificate
echo -e "\n=== Testing Certificate ==="
sleep 5
echo "1. Testing HTTPS connection to green.flippi.ai..."
curl -I https://green.flippi.ai 2>&1 | head -10

echo -e "\n2. Testing health endpoint..."
curl -s https://green.flippi.ai/health || echo "Health check failed"

# Cleanup
rm -f /tmp/certbot-green.sh

echo -e "\n=== Done ==="
echo "🌐 green.flippi.ai should now be accessible with HTTPS!"
echo "🔒 Certificate will auto-renew with certbot"