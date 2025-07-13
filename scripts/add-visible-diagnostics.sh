#!/bin/bash

# Add visible diagnostics to figure out why Choose Image fails

SERVER_IP="157.245.142.145"
SERVER_PASS="Thisismynewpassord!"
LOCAL_SUDO="a"

echo "=== Adding Visible Diagnostics ==="

# Modify analyzeImage to show diagnostic info on screen
cat > /tmp/diagnostic-analyze.js << 'EOF'
  const analyzeImage = async (imageData) => {
    console.log("analyzeImage called with data type:", typeof imageData);
    console.log("Data starts with:", imageData.substring(0, 50));
    setAnalyzing(true);
    setResults(null);
    
    // Show diagnostic info on screen
    const diagnosticInfo = {
      dataType: typeof imageData,
      dataLength: imageData.length,
      startsWithDataURL: imageData.startsWith('data:'),
      timestamp: new Date().toISOString()
    };

    try {
      const formData = new FormData();
      if (Platform.OS === 'web') {
        // Convert data URL to blob for web
        console.log("Converting data URL to blob...");
        const response = await fetch(imageData);
        const blob = await response.blob();
        console.log("Blob created:", blob.type, blob.size, "bytes");
        
        diagnosticInfo.blobType = blob.type;
        diagnosticInfo.blobSize = blob.size;
        
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
      
      diagnosticInfo.responseStatus = response.status;
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("API response:", data);
      
      if (data.success) {
        setResults(data.analysis);
      } else {
        // Show error with diagnostics
        Alert.alert('API Error', `${data.error || 'Failed to analyze image'}\n\nDiagnostics:\n${JSON.stringify(diagnosticInfo, null, 2)}`);
      }
    } catch (error) {
      console.error('API Error details:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Show error with diagnostics
      Alert.alert(
        'Connection Error', 
        `${error.message}\n\nDiagnostics:\n${JSON.stringify(diagnosticInfo, null, 2)}`
      );
    } finally {
      setAnalyzing(false);
    }
  };
EOF

# Replace analyzeImage function in blue App.js
echo "1. Updating analyzeImage with diagnostics..."
cp blue/mobile-app/App.js blue/mobile-app/App.js.backup-diag

# Find and replace the analyzeImage function
start_line=$(grep -n "const analyzeImage = async" blue/mobile-app/App.js | cut -d: -f1)
end_line=$(tail -n +$start_line blue/mobile-app/App.js | grep -n "^  };" | head -1 | cut -d: -f1)
end_line=$((start_line + end_line - 1))

head -n $((start_line - 1)) blue/mobile-app/App.js > /tmp/app-before-analyze.js
cat /tmp/diagnostic-analyze.js >> /tmp/app-before-analyze.js
tail -n +$((end_line + 1)) blue/mobile-app/App.js >> /tmp/app-before-analyze.js
cp /tmp/app-before-analyze.js blue/mobile-app/App.js

# Build and deploy
echo "2. Building diagnostic version..."
cd blue/mobile-app
echo $LOCAL_SUDO | sudo -S docker build -t thrifting-buddy/frontend:blue-diagnostic .

cd /mnt/c/Users/jhusband/price-scanner-app
echo $LOCAL_SUDO | sudo -S docker save thrifting-buddy/frontend:blue-diagnostic | gzip > /tmp/blue-diag.tar.gz
sshpass -p "$SERVER_PASS" scp /tmp/blue-diag.tar.gz root@$SERVER_IP:/tmp/

echo "3. Deploying..."
sshpass -p "$SERVER_PASS" ssh root@$SERVER_IP << 'EOF'
gunzip -c /tmp/blue-diag.tar.gz | docker load
rm /tmp/blue-diag.tar.gz

cd /root/price-scanner-app/blue/deployment
sed -i 's|image: thrifting-buddy/frontend:blue.*|image: thrifting-buddy/frontend:blue-diagnostic|' docker-compose.yml
docker compose up -d blue_frontend

sleep 5
echo "Deployed diagnostic version"
EOF

rm -f /tmp/blue-diag.tar.gz /tmp/app-before-analyze.js /tmp/diagnostic-analyze.js

echo ""
echo "=== Diagnostic Version Deployed ==="
echo "Now when you use 'Choose Image' and it fails, you'll see:"
echo "- Data type and length"
echo "- Blob creation details"
echo "- Response status"
echo "This will appear in the error popup"