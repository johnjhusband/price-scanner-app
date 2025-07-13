#!/bin/bash

# Fix Blue Image Picker Issues
# 1. Choose Image should open gallery, not camera
# 2. Fix image processing on both platforms

SERVER_IP="157.245.142.145"
SERVER_PASS="Thisismynewpassord!"
LOCAL_SUDO="a"

echo "=== Fixing Blue Image Picker Issues ==="

# First, let's check the current pickImage function
echo "1. Current pickImage function:"
grep -n -A30 "const pickImage" blue/mobile-app/App.js | grep -E "capture|input.type|onchange|analyzeImage"

# The issue is input.capture = 'environment' forces camera
# We need to remove that for "Choose Image"
echo -e "\n2. Creating fixed App.js..."

# Copy current blue App.js to backup
cp blue/mobile-app/App.js blue/mobile-app/App.js.backup

# Fix the pickImage function
# Remove the capture attribute so it opens gallery
sed -i '/input.capture = '\''environment'\'';/d' blue/mobile-app/App.js

# Also need to separate the two button behaviors
# Let's rewrite the pickImage function to properly handle gallery selection
cat > /tmp/fixed-pickImage.js << 'EOF'
  const pickImage = async () => {
    if (Platform.OS === 'web') {
      // Web file picker - no camera capture attribute
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      // Don't set capture attribute - let user choose between camera and gallery
      
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          console.log('File selected:', file.name, file.type, file.size);
          
          const reader = new FileReader();
          reader.onload = (event) => {
            console.log('File read successfully, analyzing...');
            setImage(event.target.result);
            analyzeImage(event.target.result);
          };
          reader.onerror = (error) => {
            console.error('FileReader error:', error);
            Alert.alert('Error', 'Failed to read file');
          };
          reader.readAsDataURL(file);
        }
      };
      
      // Trigger file picker
      input.click();
    } else {
      // Native mobile - use image library picker
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Sorry, we need gallery permissions!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
        analyzeImage(result.assets[0].base64);
      }
    }
  };
EOF

# Replace the pickImage function
echo "3. Replacing pickImage function..."
# Find the start and end of pickImage function
start_line=$(grep -n "const pickImage = async" blue/mobile-app/App.js | cut -d: -f1)
# Find the closing brace (it's before analyzeImage function)
end_line=$(tail -n +$start_line blue/mobile-app/App.js | grep -n "^  };" | head -1 | cut -d: -f1)
end_line=$((start_line + end_line - 1))

# Replace the function
head -n $((start_line - 1)) blue/mobile-app/App.js > /tmp/app-before-pick.js
cat /tmp/fixed-pickImage.js >> /tmp/app-before-pick.js
tail -n +$((end_line + 1)) blue/mobile-app/App.js >> /tmp/app-before-pick.js
cp /tmp/app-before-pick.js blue/mobile-app/App.js

# Also ensure analyzeImage logs what it's doing
echo "4. Adding debug logs to analyzeImage..."
sed -i '/const analyzeImage = async (imageData) => {/a\
    console.log("analyzeImage called with data type:", typeof imageData);\
    console.log("Data starts with:", imageData.substring(0, 50));' blue/mobile-app/App.js

# Add log before fetch
sed -i '/const response = await fetch(`${API_URL}\/api\/scan`, {/i\
      console.log("Sending request to:", `${API_URL}/api/scan`);' blue/mobile-app/App.js

# Log the response
sed -i '/const data = await response.json();/a\
      console.log("API response:", data);' blue/mobile-app/App.js

# Build and deploy
echo "5. Building and deploying..."
cd blue/mobile-app
echo $LOCAL_SUDO | sudo -S docker build -t thrifting-buddy/frontend:blue-picker-fix .

cd /mnt/c/Users/jhusband/price-scanner-app
echo $LOCAL_SUDO | sudo -S docker save thrifting-buddy/frontend:blue-picker-fix | gzip > /tmp/blue-picker.tar.gz
sshpass -p "$SERVER_PASS" scp /tmp/blue-picker.tar.gz root@$SERVER_IP:/tmp/

sshpass -p "$SERVER_PASS" ssh root@$SERVER_IP << 'EOF'
gunzip -c /tmp/blue-picker.tar.gz | docker load
rm /tmp/blue-picker.tar.gz

cd /root/price-scanner-app/blue/deployment
sed -i 's|image: thrifting-buddy/frontend:blue.*|image: thrifting-buddy/frontend:blue-picker-fix|' docker-compose.yml
docker compose up -d blue_frontend

sleep 5
echo "Testing deployment..."
curl -s https://blue.flippi.ai/health && echo " ✓ Blue is up"
EOF

rm -f /tmp/blue-picker.tar.gz /tmp/app-*.js /tmp/fixed-pickImage.js

echo ""
echo "=== Fix Complete ==="
echo "Changes made:"
echo "1. Choose Image button now opens gallery/file picker (no camera forced)"
echo "2. Added console logging to debug processing issues"
echo "3. Fixed native mobile to use image library instead of camera"
echo ""
echo "To debug further:"
echo "- Open browser console (F12) to see the logs"
echo "- Check if 'analyzeImage called' appears in console"
echo "- Check if API request is being made"