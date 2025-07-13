#!/bin/bash

# Fix display issues in blue:
# 1. Remove extra )} characters
# 2. Ensure results display properly

SERVER_IP="157.245.142.145"
SERVER_PASS="Thisismynewpassord!"
LOCAL_SUDO="a"

echo "=== Fixing Blue Display Issues ==="

# Fix 1: Remove the extra )} on line 367
echo "1. Removing extra )} characters..."
sed -i '367s/)}//g' blue/mobile-app/App.js

# Fix 2: Remove the diagnostic Alert that might be interfering with results display
echo "2. Simplifying error handling to not interfere with results..."
# Replace the diagnostic analyzeImage with a simpler version that still logs but doesn't Alert
cat > /tmp/simple-analyze.js << 'EOF'
  const analyzeImage = async (imageData) => {
    console.log("analyzeImage called");
    setAnalyzing(true);
    setResults(null);

    try {
      const formData = new FormData();
      if (Platform.OS === 'web') {
        // Convert data URL to blob for web
        const response = await fetch(imageData);
        const blob = await response.blob();
        console.log("Blob created:", blob.type, blob.size, "bytes");
        formData.append('image', blob, 'image.jpg');
      } else {
        // Mobile - use base64
        formData.append('image', {
          uri: imageData,
          type: 'image/jpeg',
          name: 'photo.jpg',
        });
      }

      console.log("Sending request to:", `${API_URL}/api/scan`);
      
      const response = await fetch(`${API_URL}/api/scan`, {
        method: 'POST',
        body: formData,
        headers: Platform.OS === 'web' ? {} : { 'Content-Type': 'multipart/form-data' },
      });

      console.log("Response status:", response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("API response success:", data.success);
      console.log("Has analysis:", !!data.analysis);
      
      if (data.success) {
        setResults(data.analysis);
        console.log("Results set:", data.analysis);
      } else {
        Alert.alert('Error', data.error || 'Failed to analyze image');
      }
    } catch (error) {
      console.error('API Error:', error.message);
      Alert.alert('Connection Error', error.message);
    } finally {
      setAnalyzing(false);
    }
  };
EOF

# Replace the analyzeImage function
echo "3. Replacing analyzeImage function..."
start_line=$(grep -n "const analyzeImage = async" blue/mobile-app/App.js | cut -d: -f1)
end_line=$(tail -n +$start_line blue/mobile-app/App.js | grep -n "^  };" | head -1 | cut -d: -f1)
end_line=$((start_line + end_line - 1))

head -n $((start_line - 1)) blue/mobile-app/App.js > /tmp/app-before.js
cat /tmp/simple-analyze.js >> /tmp/app-before.js
tail -n +$((end_line + 1)) blue/mobile-app/App.js >> /tmp/app-before.js
cp /tmp/app-before.js blue/mobile-app/App.js

# Verify the fixes
echo "4. Verifying fixes..."
echo "Checking for extra )}:"
grep -n -A2 "Use Web Camera" blue/mobile-app/App.js | tail -5
echo ""
echo "Checking setResults call:"
grep -n "setResults" blue/mobile-app/App.js

# Build and deploy
echo -e "\n5. Building and deploying..."
cd blue/mobile-app
echo $LOCAL_SUDO | sudo -S docker build -t thrifting-buddy/frontend:blue-display-fixed .

cd /mnt/c/Users/jhusband/price-scanner-app
echo $LOCAL_SUDO | sudo -S docker save thrifting-buddy/frontend:blue-display-fixed | gzip > /tmp/blue-display.tar.gz
sshpass -p "$SERVER_PASS" scp /tmp/blue-display.tar.gz root@$SERVER_IP:/tmp/

sshpass -p "$SERVER_PASS" ssh root@$SERVER_IP << 'EOF'
gunzip -c /tmp/blue-display.tar.gz | docker load
rm /tmp/blue-display.tar.gz

cd /root/price-scanner-app/blue/deployment
sed -i 's|image: thrifting-buddy/frontend:blue.*|image: thrifting-buddy/frontend:blue-display-fixed|' docker-compose.yml
docker compose up -d blue_frontend

sleep 5
echo "Deployment complete"
curl -s https://blue.flippi.ai/health && echo " ✓ Blue is up"
EOF

rm -f /tmp/blue-display.tar.gz /tmp/app-before.js /tmp/simple-analyze.js

echo -e "\n=== Fixes Applied ==="
echo "✓ Removed extra )} characters"
echo "✓ Simplified error handling"
echo "✓ Results should now display properly"
echo ""
echo "Test at https://blue.flippi.ai"