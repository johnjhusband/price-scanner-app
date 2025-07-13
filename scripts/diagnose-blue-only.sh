#!/bin/bash

# DIAGNOSTIC ONLY - No changes will be made
# Find out why blue API routing isn't working

SERVER_IP="157.245.142.145"
SERVER_PASS="Thisismynewpassord!"

echo "=== Blue Environment Diagnostics (READ-ONLY) ==="
echo "No changes will be made to the system"
echo ""

sshpass -p "$SERVER_PASS" ssh root@$SERVER_IP << 'EOF'
echo "1. Current Docker Networks:"
docker network ls
echo ""

echo "2. What's on thrifting_buddy_network:"
docker network inspect thrifting_buddy_network --format '{{range .Containers}}{{.Name}} {{end}}' | tr ' ' '\n' | sort
echo ""

echo "3. Blue container network details:"
echo "blue_backend networks:"
docker inspect blue_backend --format '{{range $key, $value := .NetworkSettings.Networks}}{{$key}} {{end}}'
echo "blue_frontend networks:"
docker inspect blue_frontend --format '{{range $key, $value := .NetworkSettings.Networks}}{{$key}} {{end}}'
echo ""

echo "4. Nginx container networks:"
docker inspect thrifting_buddy_nginx --format '{{range $key, $value := .NetworkSettings.Networks}}{{$key}} {{end}}'
echo ""

echo "5. Current nginx configs:"
docker exec thrifting_buddy_nginx ls -la /etc/nginx/conf.d/
echo ""

echo "6. Blue routing in nginx (if any):"
docker exec thrifting_buddy_nginx grep -r "blue" /etc/nginx/conf.d/ 2>/dev/null || echo "No blue config found"
echo ""

echo "7. How blue.flippi.ai currently works:"
echo "Testing frontend (this works):"
curl -sI https://blue.flippi.ai/ | head -3
echo ""
echo "Testing API (this might fail):"
curl -sI https://blue.flippi.ai/api/scan | head -3
echo ""

echo "8. Check if prod is on same network as nginx:"
docker inspect thrifting_buddy_api --format '{{range $key, $value := .NetworkSettings.Networks}}{{$key}} {{end}}' || echo "Prod backend not found"
echo ""

echo "9. Test connectivity from nginx container:"
echo "To prod backend:"
docker exec thrifting_buddy_nginx ping -c 1 thrifting_buddy_api 2>&1 | grep -E "1 received|Destination" || echo "Cannot reach prod backend"
echo "To blue backend:"
docker exec thrifting_buddy_nginx ping -c 1 blue_backend 2>&1 | grep -E "1 received|Destination" || echo "Cannot reach blue backend"
echo ""

echo "10. Blue compose file location:"
find /root -name "docker-compose.yml" -path "*/blue/*" 2>/dev/null | head -5
EOF

echo ""
echo "=== Diagnostics Complete ==="
echo "This shows the current state without making any changes"