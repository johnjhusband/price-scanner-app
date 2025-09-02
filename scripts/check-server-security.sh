#!/bin/bash
# Security audit script for Flippi.ai server
# Run this ON THE SERVER to check security status

echo "=== Flippi.ai Server Security Audit ==="
echo "Date: $(date)"
echo ""

# Check firewall status
echo "1. FIREWALL STATUS:"
if command -v ufw &> /dev/null; then
    sudo ufw status
else
    echo "⚠️  UFW is not installed"
fi
echo ""

# Check SSH configuration
echo "2. SSH CONFIGURATION:"
echo -n "   Password Authentication: "
grep -E "^PasswordAuthentication" /etc/ssh/sshd_config || echo "Not explicitly set"
echo -n "   Root Login: "
grep -E "^PermitRootLogin" /etc/ssh/sshd_config || echo "Not explicitly set"
echo -n "   SSH Port: "
grep -E "^Port" /etc/ssh/sshd_config || echo "22 (default)"
echo ""

# Check for suspicious processes
echo "3. SUSPICIOUS PROCESSES:"
echo "   Checking for unknown services..."

# Check for Docker (reported as unexpected in issue #168)
if pgrep -x "dockerd" > /dev/null; then
    echo "   ⚠️  Docker is running (unexpected per issue #168)"
    docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
fi

# Check for Python processes (issue #169 mentions Hyper-Vibe)
echo ""
echo "   Python processes:"
ps aux | grep python | grep -v grep | grep -v "pm2" || echo "   No Python processes found"

# Check for unknown users (issue #173 mentions claude-+)
echo ""
echo "4. USER ACCOUNTS:"
echo "   Checking for unexpected users..."
if id "claude-+" &> /dev/null; then
    echo "   ⚠️  Found user 'claude-+' (issue #173)"
fi

# Check listening ports
echo ""
echo "5. LISTENING PORTS:"
sudo netstat -tlpn | grep LISTEN | grep -v "127.0.0.1" | head -20

# Check PM2 status
echo ""
echo "6. PM2 STATUS:"
pm2 list

# Check for orphaned Node processes (issue #172)
echo ""
echo "7. ORPHANED NODE PROCESSES:"
ps aux | grep node | grep -v "pm2" | grep -v grep | wc -l | xargs echo "   Found orphaned Node processes:"

# Summary
echo ""
echo "=== SUMMARY ==="
echo "Review the above output for:"
echo "- Firewall should be ACTIVE with only ports 22, 80, 443 allowed"
echo "- SSH should have PasswordAuthentication no"
echo "- No unexpected Docker containers"
echo "- No unknown Python processes"
echo "- No unauthorized user accounts"
echo "- Only expected ports listening"
echo "- All Node processes managed by PM2"
echo ""
echo "Refer to GitHub issues #166-174 for security concerns"