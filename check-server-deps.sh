#!/bin/bash

echo "=== Checking Server Dependencies Outside Containers ==="

SERVER_IP="157.245.142.145"
SERVER_PASS="Thisismynewpassord!"

sshpass -p "$SERVER_PASS" ssh root@$SERVER_IP << 'EOF'
echo "1. Docker & Docker Compose:"
docker --version
docker compose version

echo -e "\n2. Code repository:"
ls -la /root/price-scanner-app/

echo -e "\n3. Environment files:"
ls -la /root/price-scanner-app/backend/.env 2>/dev/null || echo "No .env file found"

echo -e "\n4. Running processes (non-Docker):"
ps aux | grep -v docker | grep -v kernel | grep -v systemd | grep -v ssh | grep -v bash | grep -v ps | head -10

echo -e "\n5. Open ports:"
netstat -tlnp | grep -E ':(80|443|3000|8080)\s'

echo -e "\n6. System services:"
systemctl list-units --type=service --state=running | grep -v systemd | head -10
EOF

echo "=== Check Complete ==="