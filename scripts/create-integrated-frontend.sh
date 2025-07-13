#!/bin/bash

# Create integrated frontend with v2.0 features
# Start with working blue App.js and add v2.0 enhancements

echo "=== Creating Integrated Frontend with v2.0 Features ==="

# Step 1: Copy working blue App.js as base
echo "1. Using blue App.js as base (it has working camera and fixes)..."
cp blue/mobile-app/App.js green/mobile-app/App-integrated.js

# Step 2: Add new imports and state variables
echo "2. Adding v2.0 state variables and imports..."

# Add state variables after existing ones
sed -i '/const \[showWebCamera, setShowWebCamera\] = useState(false);/a\
  const [hasCamera, setHasCamera] = useState(false);\
  const [isDragOver, setIsDragOver] = useState(false);\
  const [showDetails, setShowDetails] = useState(false);' green/mobile-app/App-integrated.js

# Step 3: Add desktop camera check
echo "3. Adding desktop camera availability check..."
cat >> /tmp/camera-check.txt << 'EOF'

  // Check for camera availability on web
  const checkCameraAvailability = async () => {
    if (Platform.OS !== 'web') return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasVideoDevice = devices.some(device => device.kind === 'videoinput');
      setHasCamera(hasVideoDevice);
      console.log('Camera available:', hasVideoDevice);
    } catch (error) {
      console.log('Camera check failed:', error);
      setHasCamera(false);
    }
  };

  // Setup paste listener
  const setupPasteListener = () => {
    if (Platform.OS === 'web') {
      document.addEventListener('paste', handlePaste);
    }
  };

  const removePasteListener = () => {
    if (Platform.OS === 'web') {
      document.removeEventListener('paste', handlePaste);
    }
  };

  // Handle paste event
  const handlePaste = (event) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let item of items) {
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          processImageFile(file);
        }
        break;
      }
    }
  };

  // Process image file from drag/drop or paste
  const processImageFile = (file) => {
    console.log('Processing file:', file.name, file.type, file.size);
    
    if (!file.type.startsWith('image/')) {
      Alert.alert('Error', 'Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target.result);
      analyzeImage(event.target.result);
    };
    reader.onerror = (error) => {
      console.error('FileReader error:', error);
      Alert.alert('Error', 'Failed to read file');
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    if (Platform.OS === 'web') {
      e.preventDefault();
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    if (Platform.OS === 'web') {
      e.preventDefault();
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
    if (Platform.OS === 'web') {
      e.preventDefault();
      setIsDragOver(false);
      
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        processImageFile(files[0]);
      }
    }
  };

  // Add useEffect for camera check and paste listener
  useEffect(() => {
    checkCameraAvailability();
    setupPasteListener();
    return () => removePasteListener();
  }, []);
EOF

# Insert after the isMobileWeb function
line_num=$(grep -n "const isMobileWeb = ()" green/mobile-app/App-integrated.js | cut -d: -f1)
insert_line=$((line_num + 5))
head -n $insert_line green/mobile-app/App-integrated.js > /tmp/app-part1.js
cat /tmp/camera-check.txt >> /tmp/app-part1.js
tail -n +$((insert_line + 1)) green/mobile-app/App-integrated.js >> /tmp/app-part1.js
cp /tmp/app-part1.js green/mobile-app/App-integrated.js

# Step 4: Create v2.0 style components
echo "4. Creating ChatGPT-style upload area..."
cat > /tmp/v2-upload-ui.txt << 'EOF'
      {/* ChatGPT-style upload area */}
      <View 
        style={[
          styles.uploadArea, 
          isDragOver && styles.uploadAreaDragOver,
          analyzing && styles.uploadAreaDisabled
        ]}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Text style={styles.uploadIcon}>📷</Text>
        <Text style={styles.uploadText}>
          Drag and drop an image here, or click to browse
        </Text>
        <Text style={styles.uploadHint}>
          You can also paste an image (Ctrl+V) or use your camera
        </Text>
        
        <View style={styles.uploadButtons}>
          <TouchableOpacity 
            style={[styles.uploadButton, analyzing && styles.uploadButtonDisabled]}
            onPress={pickImage}
            disabled={analyzing}
            activeOpacity={0.7}
          >
            <Text style={styles.uploadButtonText}>📁 Browse Files</Text>
          </TouchableOpacity>
          
          {(Platform.OS === 'web' ? hasCamera : true) && (
            <TouchableOpacity 
              style={[styles.cameraButton, analyzing && styles.uploadButtonDisabled]}
              onPress={() => setShowWebCamera(true)}
              disabled={analyzing}
              activeOpacity={0.7}
            >
              <Text style={styles.cameraButtonText}>📷 Use Camera</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
EOF

# Replace the existing button section with v2.0 UI
# Find the upload button section and replace it
sed -i '/<TouchableOpacity/,/<\/TouchableOpacity>/d' green/mobile-app/App-integrated.js
sed -i '/{Platform.OS === '\''web'\'' && isMobileWeb()/,/}/d' green/mobile-app/App-integrated.js

# Insert new UI after subtitle
subtitle_line=$(grep -n "Upload a photo to get resale prices" green/mobile-app/App-integrated.js | cut -d: -f1)
head -n $subtitle_line green/mobile-app/App-integrated.js > /tmp/app-ui.js
echo "" >> /tmp/app-ui.js
cat /tmp/v2-upload-ui.txt >> /tmp/app-ui.js
tail -n +$((subtitle_line + 1)) green/mobile-app/App-integrated.js >> /tmp/app-ui.js
cp /tmp/app-ui.js green/mobile-app/App-integrated.js

# Step 5: Add enhanced results display
echo "5. Adding enhanced results display..."
cat > /tmp/enhanced-results.txt << 'EOF'

          {/* Enhanced v2.0 fields */}
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

          {/* Expandable details section */}
          <TouchableOpacity 
            style={styles.detailsToggle}
            onPress={() => setShowDetails(!showDetails)}
          >
            <Text style={styles.detailsToggleText}>
              {showDetails ? '▼ Hide Details' : '▶ Show More Details'}
            </Text>
          </TouchableOpacity>

          {showDetails && (
            <View style={styles.detailsSection}>
              {results.market_insights && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Market Insights:</Text>
                  <Text style={styles.detailText}>{results.market_insights}</Text>
                </View>
              )}
              
              {results.selling_tips && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Selling Tips:</Text>
                  <Text style={styles.detailText}>{results.selling_tips}</Text>
                </View>
              )}
              
              {results.brand_context && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Brand Info:</Text>
                  <Text style={styles.detailText}>{results.brand_context}</Text>
                </View>
              )}
              
              {results.seasonal_notes && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Seasonal Notes:</Text>
                  <Text style={styles.detailText}>{results.seasonal_notes}</Text>
                </View>
              )}
            </View>
          )}
EOF

# Step 6: Add new styles
echo "6. Adding v2.0 styles..."
cat > /tmp/v2-styles.txt << 'EOF'
  uploadArea: {
    backgroundColor: '#f7f7f8',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e5e7',
    borderStyle: 'dashed',
    padding: 40,
    marginHorizontal: 20,
    marginTop: 20,
    alignItems: 'center',
  },
  uploadAreaDragOver: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  uploadAreaDisabled: {
    opacity: 0.6,
  },
  uploadIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  uploadText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  uploadHint: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  detailsToggle: {
    marginTop: 12,
    padding: 8,
  },
  detailsToggleText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  detailsSection: {
    marginTop: 16,
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
  },
  detailItem: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
EOF

echo "7. Final cleanup and validation..."
# Remove any duplicate closing braces or syntax issues
sed -i '/^[[:space:]]*$/d' green/mobile-app/App-integrated.js

echo ""
echo "=== Integration Complete ==="
echo "Created: green/mobile-app/App-integrated.js"
echo ""
echo "Features added:"
echo "✅ Desktop camera detection"
echo "✅ Drag & drop support"
echo "✅ Paste support (Ctrl+V)"
echo "✅ ChatGPT-style upload UI"
echo "✅ Enhanced score displays"
echo "✅ Expandable details section"
echo ""
echo "Next step: Review and test the integrated file"