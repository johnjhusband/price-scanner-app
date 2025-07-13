#!/bin/bash

# Fix Blue Image Processing Issues
# Add more detailed error logging and fix potential issues

SERVER_IP="157.245.142.145"
SERVER_PASS="Thisismynewpassord!"
LOCAL_SUDO="a"

echo "=== Fixing Blue Image Processing ==="

# First check if the API is responding correctly
echo "1. Testing API directly..."
curl -s -X POST https://blue.flippi.ai/api/scan \
  -F "image=@/tmp/test.png" \
  -H "Accept: application/json" | jq . || echo "API test failed"

# Add better error handling and logging to analyzeImage
echo -e "\n2. Improving error handling in App.js..."

# Create improved analyzeImage function with better error handling
cat > /tmp/improved-analyze.js << 'EOF'
  const analyzeImage = async (imageData) => {
    console.log("analyzeImage called with data type:", typeof imageData);
    console.log("Data starts with:", imageData.substring(0, 50));
    setAnalyzing(true);
    setResults(null);

    try {
      const formData = new FormData();
      if (Platform.OS === 'web') {
        // Convert data URL to blob for web
        console.log("Converting data URL to blob...");
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
      console.log("Full URL:", window.location.origin + '/api/scan');
      
      const response = await fetch(`${API_URL}/api/scan`, {
        method: 'POST',
        body: formData,
        headers: Platform.OS === 'web' ? {} : { 'Content-Type': 'multipart/form-data' },
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("API response:", data);
      
      if (data.success) {
        setResults(data.analysis);
      } else {
        Alert.alert('Error', data.error || 'Failed to analyze image');
      }
    } catch (error) {
      console.error('API Error details:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      Alert.alert(
        'Connection Error', 
        `Failed to analyze image: ${error.message}`
      );
    } finally {
      setAnalyzing(false);
    }
  };
EOF

# Replace analyzeImage function
echo "3. Replacing analyzeImage function..."
start_line=$(grep -n "const analyzeImage = async" blue/mobile-app/App.js | cut -d: -f1)
# Find the end (before handleWebCameraCapture)
end_line=$(tail -n +$start_line blue/mobile-app/App.js | grep -n "^  };" | head -1 | cut -d: -f1)
end_line=$((start_line + end_line - 1))

head -n $((start_line - 1)) blue/mobile-app/App.js > /tmp/app-before-analyze.js
cat /tmp/improved-analyze.js >> /tmp/app-before-analyze.js
tail -n +$((end_line + 1)) blue/mobile-app/App.js >> /tmp/app-before-analyze.js
cp /tmp/app-before-analyze.js blue/mobile-app/App.js

# Also add a test button to verify API connectivity
echo "4. Adding API test button for debugging..."
# Find where the camera button is and add test button after it
sed -i '/Use Web Camera (Beta)<\/Text>/a\
        </TouchableOpacity>\
      )}\
      \
      {Platform.OS === '\''web'\'' && (\
        <TouchableOpacity \
          style={[styles.testButton, analyzing && styles.uploadButtonDisabled]}\
          onPress={async () => {\
            console.log("Testing API connection...");\
            try {\
              const response = await fetch(`${API_URL}/health`);\
              const text = await response.text();\
              console.log("Health check response:", text);\
              Alert.alert("API Test", `Health check: ${text}`);\
            } catch (e) {\
              console.error("Health check failed:", e);\
              Alert.alert("API Test Failed", e.message);\
            }\
          }}\
          disabled={analyzing}\
          activeOpacity={0.7}\
        >\
          <Text style={styles.testButtonText}>Test API Connection</Text>' blue/mobile-app/App.js

# Add test button styles
sed -i '/cameraButtonText: {/a\
  testButton: {\
    backgroundColor: '\''#FF9500'\'',\
    padding: 15,\
    borderRadius: 8,\
    alignItems: '\''center'\'',\
    marginHorizontal: 20,\
    marginTop: 10,\
  },\
  testButtonText: {\
    color: '\''#fff'\'',\
    fontSize: 16,\
    fontWeight: '\''600'\'',\
  },' blue/mobile-app/App.js

# Build and deploy
echo "5. Building and deploying..."
cd blue/mobile-app
echo $LOCAL_SUDO | sudo -S docker build -t thrifting-buddy/frontend:blue-process-fix .

cd /mnt/c/Users/jhusband/price-scanner-app
echo $LOCAL_SUDO | sudo -S docker save thrifting-buddy/frontend:blue-process-fix | gzip > /tmp/blue-process.tar.gz
sshpass -p "$SERVER_PASS" scp /tmp/blue-process.tar.gz root@$SERVER_IP:/tmp/

sshpass -p "$SERVER_PASS" ssh root@$SERVER_IP << 'EOF'
gunzip -c /tmp/blue-process.tar.gz | docker load
rm /tmp/blue-process.tar.gz

cd /root/price-scanner-app/blue/deployment
sed -i 's|image: thrifting-buddy/frontend:blue.*|image: thrifting-buddy/frontend:blue-process-fix|' docker-compose.yml
docker compose up -d blue_frontend

sleep 5
echo "Checking logs..."
docker logs blue_frontend --tail 20
docker logs blue_backend --tail 20
EOF

rm -f /tmp/blue-process.tar.gz /tmp/app-*.js /tmp/improved-analyze.js

echo ""
echo "=== Debugging Steps ==="
echo "1. Open https://blue.flippi.ai in Chrome"
echo "2. Open Developer Console (F12)"
echo "3. Try 'Test API Connection' button first"
echo "4. Then try 'Choose Image' and watch console logs"
echo "5. Look for:"
echo "   - 'analyzeImage called' message"
echo "   - 'Blob created' with size"
echo "   - 'Response status' (should be 200)"
echo "   - Any error messages"