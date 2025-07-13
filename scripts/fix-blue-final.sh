#!/bin/bash

# Final fix for blue styles

SERVER_IP="157.245.142.145"
SERVER_PASS="Thisismynewpassord!"
LOCAL_SUDO="a"

echo "=== Final Blue Style Fix ==="

# Get the original enhanced App.js from prod (which works)
echo "1. Getting working App.js from prod..."
cp prod/mobile-app/App.js blue/mobile-app/App.js

# Add the score helper functions
echo "2. Adding score helper functions..."
cat >> /tmp/score-functions.txt << 'EOF'

const getBocaScoreColor = (score) => {
  const numScore = parseInt(score);
  if (numScore >= 80) return "#2e7d32"; // Green - High trend
  if (numScore >= 60) return "#f57c00"; // Orange - Medium trend
  return "#d32f2f"; // Red - Low trend
};

const getAuthenticityColor = (score) => {
  const numScore = parseInt(score);
  if (numScore >= 80) return "#2e7d32"; // Green - Likely authentic
  if (numScore >= 60) return "#f57c00"; // Orange - Uncertain
  return "#d32f2f"; // Red - Likely fake
};
EOF

# Insert functions after export default
line_num=$(grep -n "export default function App()" blue/mobile-app/App.js | cut -d: -f1)
head -n $((line_num-1)) blue/mobile-app/App.js > /tmp/app-top.js
echo "" >> /tmp/app-top.js
cat /tmp/score-functions.txt >> /tmp/app-top.js
echo "" >> /tmp/app-top.js
tail -n +$line_num blue/mobile-app/App.js > /tmp/app-bottom.js
cat /tmp/app-top.js /tmp/app-bottom.js > blue/mobile-app/App.js

# Add score display in results section
echo "3. Adding score display components..."
cat > /tmp/score-display.txt << 'EOF'

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

# Find where to insert (after condition line)
condition_line=$(grep -n "Condition: {results.condition}" blue/mobile-app/App.js | cut -d: -f1)
head -n $condition_line blue/mobile-app/App.js > /tmp/app-before-scores.js
cat /tmp/score-display.txt >> /tmp/app-before-scores.js
tail -n +$((condition_line+1)) blue/mobile-app/App.js >> /tmp/app-before-scores.js
cp /tmp/app-before-scores.js blue/mobile-app/App.js

# Add styles
echo "4. Adding score styles..."
# Find buyPrice style and add score styles after it
buyPrice_line=$(grep -n "buyPrice: {" blue/mobile-app/App.js | tail -1 | cut -d: -f1)
# Find the closing brace
close_line=$((buyPrice_line + 6))

head -n $close_line blue/mobile-app/App.js > /tmp/app-before-styles.js
cat >> /tmp/app-before-styles.js << 'EOF'
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  scoreDescription: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    fontStyle: 'italic',
  },
EOF
tail -n +$((close_line+1)) blue/mobile-app/App.js >> /tmp/app-before-styles.js
cp /tmp/app-before-styles.js blue/mobile-app/App.js

# Build and deploy
echo "5. Building final blue frontend..."
cd blue/mobile-app
echo $LOCAL_SUDO | sudo -S docker build -t thrifting-buddy/frontend:blue-complete .

echo "6. Deploying..."
cd /mnt/c/Users/jhusband/price-scanner-app
echo $LOCAL_SUDO | sudo -S docker save thrifting-buddy/frontend:blue-complete | gzip > /tmp/blue-complete.tar.gz
sshpass -p "$SERVER_PASS" scp /tmp/blue-complete.tar.gz root@$SERVER_IP:/tmp/

sshpass -p "$SERVER_PASS" ssh root@$SERVER_IP << 'EOF'
gunzip -c /tmp/blue-complete.tar.gz | docker load
rm /tmp/blue-complete.tar.gz

cd /root/price-scanner-app/blue/deployment
sed -i 's|image: thrifting-buddy/frontend:blue.*|image: thrifting-buddy/frontend:blue-complete|' docker-compose.yml
docker compose up -d blue_frontend

sleep 5
echo "Final test..."
curl -s https://blue.flippi.ai/health && echo " ✓ Blue is up"
docker ps | grep blue
EOF

# Cleanup
rm -f /tmp/blue-complete.tar.gz /tmp/app-*.js /tmp/score-*.txt

echo ""
echo "=== Blue should now work properly! ==="
echo "Test at: https://blue.flippi.ai"
echo "Features:"
echo "- Camera button"
echo "- Image analysis"
echo "- Authenticity scores"
echo "- Boca scores"
echo "- All enhanced features"