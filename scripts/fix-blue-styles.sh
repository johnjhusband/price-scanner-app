#!/bin/bash

# Fix Blue Frontend Style Issues
# The buyPrice style was corrupted during the merge

echo "=== Fixing Blue Frontend Styles ==="

# Fix the StyleSheet in App.js
echo "1. Fixing corrupted styles in App.js..."

# The buyPrice style should be complete before scoreContainer
sed -i '431,450d' blue/mobile-app/App.js

# Insert the correct styles
sed -i '430a\
  buyPrice: {\
    fontWeight: '"'"'bold'"'"',\
    color: '"'"'#2e7d32'"'"',\
    fontSize: 16,\
    marginTop: 5,\
    marginBottom: 10,\
  },\
  scoreContainer: {\
    flexDirection: '"'"'row'"'"',\
    alignItems: '"'"'center'"'"',\
    marginBottom: 8,\
    flexWrap: '"'"'wrap'"'"',\
  },\
  scoreText: {\
    fontSize: 16,\
    fontWeight: '"'"'bold'"'"',\
    marginLeft: 8,\
  },\
  scoreDescription: {\
    fontSize: 12,\
    color: '"'"'#666'"'"',\
    marginLeft: 8,\
    fontStyle: '"'"'italic'"'"',\
  },' blue/mobile-app/App.js

# Also add the missing errorContainer style
echo "2. Adding missing errorContainer style..."
sed -i '/errorHint: {/a\
  errorContainer: {\
    flex: 1,\
    justifyContent: '"'"'center'"'"',\
    alignItems: '"'"'center'"'"',\
    padding: 20,\
  },' blue/mobile-app/App.js

echo "3. Building and deploying fixed version..."

# Build new image
cd blue/mobile-app
sudo docker build -t thrifting-buddy/frontend:blue-fixed .

# Deploy
echo "4. Deploying to server..."
cd /mnt/c/Users/jhusband/price-scanner-app
sudo docker save thrifting-buddy/frontend:blue-fixed | gzip > /tmp/blue-fixed.tar.gz
sshpass -p "Thisismynewpassord!" scp /tmp/blue-fixed.tar.gz root@157.245.142.145:/tmp/

sshpass -p "Thisismynewpassord!" ssh root@157.245.142.145 << 'EOF'
gunzip -c /tmp/blue-fixed.tar.gz | docker load
rm /tmp/blue-fixed.tar.gz

cd /root/price-scanner-app/blue/deployment
sed -i 's|image: thrifting-buddy/frontend:blue.*|image: thrifting-buddy/frontend:blue-fixed|' docker-compose.yml
docker compose up -d blue_frontend

sleep 5
echo "Testing..."
curl -s https://blue.flippi.ai/health && echo " ✓ Blue working"
EOF

rm -f /tmp/blue-fixed.tar.gz

echo "Done! Blue should now render properly after analysis."