#!/bin/bash

# Add Enhanced Features to Blue
# This safely adds scoring features to the working production code

SERVER_IP="157.245.142.145"
SERVER_PASS="Thisismynewpassord!"
LOCAL_SUDO="a"

echo "=== Adding Enhanced Features to Blue ==="
echo "Strategy: Use working prod code + add new features"
echo ""

# Step 1: Copy working production files to blue
echo "1. Copying working production code to blue..."
cp prod/mobile-app/App.js blue/mobile-app/App.js
cp prod/backend/server.js blue/backend/server.js
echo "   ✓ Copied working App.js and server.js"

# Step 2: Get enhanced server.js from git (backend is safe to replace)
echo "2. Getting enhanced backend from git..."
git show 13d8bc1:backend/server-enhanced.js > blue/backend/server.js
echo "   ✓ Replaced with enhanced server.js"

# Step 3: Add scoring display to App.js (minimal changes)
echo "3. Adding score displays to App.js..."

# Add the score display functions after getBuyPrice
sed -i '/const getBuyPrice/a\
\
  const getBocaScoreColor = (score) => {\
    const numScore = parseInt(score);\
    if (numScore >= 80) return "#2e7d32"; // Green - High trend\
    if (numScore >= 60) return "#f57c00"; // Orange - Medium trend\
    return "#d32f2f"; // Red - Low trend\
  };\
\
  const getAuthenticityColor = (score) => {\
    const numScore = parseInt(score);\
    if (numScore >= 80) return "#2e7d32"; // Green - Likely authentic\
    if (numScore >= 60) return "#f57c00"; // Orange - Uncertain\
    return "#d32f2f"; // Red - Likely fake\
  };' blue/mobile-app/App.js 2>/dev/null || echo "   Note: Score functions might already exist"

# Add score display after condition (line ~352)
cat >> /tmp/scores-display.txt << 'EOF'

          {results.authenticity_score && (
            <View style={styles.scoreContainer}>
              <Text style={styles.label}>Authenticity: </Text>
              <Text style={[styles.scoreText, { color: getAuthenticityColor(results.authenticity_score) }]}>
                {results.authenticity_score}
              </Text>
            </View>
          )}

          {results.boca_score && (
            <View style={styles.scoreContainer}>
              <Text style={styles.label}>Boca Score: </Text>
              <Text style={[styles.scoreText, { color: getBocaScoreColor(results.boca_score) }]}>
                {results.boca_score}/100
              </Text>
              <Text style={styles.scoreDescription}>
                {parseInt(results.boca_score) >= 80 ? '🔥 High Trend' : 
                 parseInt(results.boca_score) >= 60 ? '📈 Medium Trend' : '📉 Low Trend'}
              </Text>
            </View>
          )}
EOF

# Insert scores after condition display (find the line and add after)
sed -i '/Condition: {results.condition}/r /tmp/scores-display.txt' blue/mobile-app/App.js

# Add the score styles to StyleSheet
sed -i '/buyPrice: {/a\
  scoreContainer: {\
    flexDirection: "row",\
    alignItems: "center",\
    marginBottom: 8,\
    flexWrap: "wrap",\
  },\
  scoreText: {\
    fontSize: 16,\
    fontWeight: "bold",\
    marginLeft: 8,\
  },\
  scoreDescription: {\
    fontSize: 12,\
    color: "#666",\
    marginLeft: 8,\
    fontStyle: "italic",\
  },' blue/mobile-app/App.js

# Step 4: Build and deploy
echo "4. Building blue images..."
cd /mnt/c/Users/jhusband/price-scanner-app

# Build backend
echo "   Building blue backend with enhanced analysis..."
cd blue/backend
echo $LOCAL_SUDO | sudo -S docker build -t thrifting-buddy/backend:blue-v2 .

# Build frontend
echo "   Building blue frontend with score display..."
cd ../mobile-app
echo $LOCAL_SUDO | sudo -S docker build -t thrifting-buddy/frontend:blue-v2 .

# Step 5: Save and transfer
echo "5. Transferring to server..."
cd /mnt/c/Users/jhusband/price-scanner-app
echo $LOCAL_SUDO | sudo -S docker save thrifting-buddy/backend:blue-v2 thrifting-buddy/frontend:blue-v2 | gzip > /tmp/blue-v2.tar.gz
sshpass -p "$SERVER_PASS" scp /tmp/blue-v2.tar.gz root@$SERVER_IP:/tmp/

# Step 6: Deploy on server
echo "6. Deploying enhanced blue..."
sshpass -p "$SERVER_PASS" ssh root@$SERVER_IP << 'DEPLOY'
# Load images
gunzip -c /tmp/blue-v2.tar.gz | docker load
rm /tmp/blue-v2.tar.gz

# Update compose
cd /root/price-scanner-app/blue/deployment
sed -i 's|image: thrifting-buddy/backend:blue.*|image: thrifting-buddy/backend:blue-v2|' docker-compose.yml
sed -i 's|image: thrifting-buddy/frontend:blue.*|image: thrifting-buddy/frontend:blue-v2|' docker-compose.yml

# Restart blue
docker compose down
docker compose up -d

# Wait and test
sleep 10
echo "Testing enhanced blue..."
curl -s https://blue.flippi.ai/health && echo " ✓ API working" || echo " ✗ API failed"

echo ""
echo "=== Deployment Complete ==="
docker ps --format "table {{.Names}}\t{{.Image}}" | grep blue
DEPLOY

# Cleanup
rm -f /tmp/scores-display.txt /tmp/blue-v2.tar.gz

echo ""
echo "Blue should now have:"
echo "- Working camera (from prod)"
echo "- Working Android buttons (from prod)"  
echo "- Authenticity scores (new)"
echo "- Boca scores (new)"
echo "- Enhanced AI analysis (new)"
echo ""
echo "Test at: https://blue.flippi.ai"