#!/bin/bash

# Diagnose Blue Routing Issues
# Figure out how blue.flippi.ai is currently routed and why API calls fail

SERVER_IP="157.245.142.145"
SERVER_PASS="Thisismynewpassord!"

echo "=== Diagnosing Blue Routing ==="
echo "Finding out how blue.flippi.ai actually works..."
echo ""

sshpass -p "$SERVER_PASS" ssh root@$SERVER_IP << 'EOF'

echo "1. Docker Networks:"
docker network ls
echo ""

echo "2. All nginx containers:"
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Ports}}" | grep -E "nginx|NAME"
echo ""

echo "3. Blue containers and their networks:"
docker inspect blue_backend blue_frontend 2>/dev/null | grep -E '"NetworkMode"|"Networks"|"IPAddress"|"Name"' | grep -B1 -A3 "Networks"
echo ""

echo "4. Main nginx config files:"
docker exec thrifting_buddy_nginx ls -la /etc/nginx/conf.d/ 2>/dev/null || echo "Main nginx not accessible"
echo ""

echo "5. Looking for blue.flippi.ai in ALL nginx configs:"
for container in $(docker ps --format "{{.Names}}" | grep nginx); do
    echo "Checking $container:"
    docker exec $container grep -r "blue.flippi.ai" /etc/nginx/ 2>/dev/null | head -5 || echo "  Not found"
done
echo ""

echo "6. Testing current blue.flippi.ai routing:"
echo "Health check (this works):"
curl -sI https://blue.flippi.ai/health | head -3
echo ""
echo "API check (this fails):"
curl -sI https://blue.flippi.ai/api/scan | head -3
echo ""

echo "7. Checking iptables/port forwarding:"
netstat -tlnp | grep -E "80|443|3000|8080" | grep LISTEN
echo ""

echo "8. Blue backend logs (last error):"
docker logs blue_backend 2>&1 | grep -E "error|Error|fail" | tail -3
echo ""

echo "9. Checking if containers can reach each other:"
docker exec blue_frontend ping -c 1 blue_backend 2>&1 | head -2 || echo "Cannot ping blue_backend from blue_frontend"
echo ""

echo "10. DNS resolution for blue.flippi.ai:"
nslookup blue.flippi.ai | grep -A2 "Answer"

EOF

echo ""
echo "=== Analysis Complete ==="
echo "This will show us:"
echo "- How blue.flippi.ai SSL is handled"
echo "- Where the routing breaks down"
echo "- Why health works but API doesn't"