import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Button, Image, StyleSheet, Alert, Platform, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';

const API_URL = Platform.OS === 'web' 
  ? '' // Same domain - nginx routes /api to backend
  : Platform.OS === 'ios'
    ? 'http://localhost:3000' // iOS simulator
    : 'http://10.0.2.2:3000'; // Android emulator

// Web Camera Component for mobile browsers
const WebCameraView = ({ onCapture, onCancel }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    initializeCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const initializeCamera = async () => {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasPermission(false);
        Alert.alert('Camera Error', 'Camera access is not supported in this browser.');
        return;
      }

      // Check if we're on HTTPS (required for camera access)
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        setHasPermission(false);
        Alert.alert('Security Error', 'Camera access requires HTTPS connection.');
        return;
      }

      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setIsReady(true);
          console.log('Camera ready');
        };
      }
      setHasPermission(true);
    } catch (err) {
      console.error('Camera initialization error:', err);
      setHasPermission(false);
      
      // Provide specific error messages
      let errorMessage = 'Unable to access camera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = 'Camera permission was denied. Please allow camera access and reload the page.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Camera is already in use by another application.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = 'Camera does not support the requested settings.';
      } else if (err.name === 'SecurityError') {
        errorMessage = 'Camera access is not allowed due to security restrictions. Please use HTTPS.';
      }
      
      Alert.alert('Camera Error', errorMessage);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    const imageData = canvas.toDataURL('image/jpeg', 0.7);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    onCapture(imageData);
  };

  if (hasPermission === false) {
    return (
      <View style={styles.cameraContainer}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Camera Access Issue</Text>
          <Text style={styles.errorMessage}>
            {window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' 
              ? '🔒 Camera requires HTTPS connection.\nThis site is using HTTP.'
              : '📷 Please allow camera access when prompted by your browser.'}
          </Text>
          <Text style={styles.errorHint}>
            For now, please use the "Choose Image" button to select photos from your gallery.
          </Text>
          <TouchableOpacity style={styles.button} onPress={onCancel}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.cameraContainer}>
      <View style={styles.cameraHeader}>
        <Text style={styles.cameraTitle}>Take Photo</Text>
        <TouchableOpacity onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.videoWrapper}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </View>
      
      {!isReady && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Initializing camera...</Text>
        </View>
      )}
      
      <View style={styles.captureContainer}>
        <TouchableOpacity 
          style={[styles.captureButton, !isReady && styles.captureButtonDisabled]} 
          onPress={capturePhoto}
          disabled={!isReady}
        >
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Helper functions for score colors
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

// Enhanced file type checking for Mac
const isImageFile = (file) => {
  if (!file) return false;
  
  // Check MIME type
  const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg', 'image/heic', 'image/heif'];
  if (file.type && imageTypes.some(type => file.type.toLowerCase().startsWith(type))) {
    return true;
  }
  
  // Fallback to file name extension check (important for Mac)
  const fileName = file.name || '';
  return /\.(jpg|jpeg|png|gif|webp|bmp|svg|heic|heif)$/i.test(fileName);
};

export default function App() {
  const [image, setImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [showWebCamera, setShowWebCamera] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Check if running on mobile web browser
  const isMobileWeb = () => {
    return Platform.OS === 'web' && 
           /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  // Check for camera availability on web (v2.0 feature)
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

  // Enhanced paste handler for Mac compatibility
  const handlePaste = (event) => {
    console.log('Paste event triggered');
    event.preventDefault(); // Important for Mac
    
    // Try multiple ways to access clipboard data for better compatibility
    const clipboardData = event.clipboardData || window.clipboardData;
    if (!clipboardData) {
      console.log('No clipboard data available');
      return;
    }

    // Check items first (modern browsers)
    if (clipboardData.items) {
      const items = Array.from(clipboardData.items);
      console.log('Clipboard items:', items.map(item => item.type));
      
      for (let item of items) {
        if (item.type.indexOf('image') !== -1 || item.kind === 'file') {
          const file = item.getAsFile();
          if (file) {
            console.log('Processing pasted file:', file.name, file.type, file.size);
            processImageFile(file);
            return;
          }
        }
      }
    }

    // Fallback to files (older browsers)
    if (clipboardData.files && clipboardData.files.length > 0) {
      const file = clipboardData.files[0];
      if (isImageFile(file)) {
        console.log('Processing pasted file (fallback):', file.name, file.type);
        processImageFile(file);
      }
    }
  };

  // Setup paste listener with Mac-specific options
  const setupPasteListener = () => {
    if (Platform.OS === 'web') {
      // Use capture phase and non-passive for better Mac compatibility
      document.addEventListener('paste', handlePaste, { capture: true, passive: false });
      console.log('Paste listener added');
    }
  };

  const removePasteListener = () => {
    if (Platform.OS === 'web') {
      document.removeEventListener('paste', handlePaste, { capture: true });
      console.log('Paste listener removed');
    }
  };

  // Process image file from drag/drop or paste (v2.0 feature)
  const processImageFile = (file) => {
    console.log('Processing file:', file.name, file.type, file.size);
    
    if (!isImageFile(file)) {
      Alert.alert('Error', 'Please select an image file (JPEG, PNG, GIF, WEBP, HEIC, or HEIF)');
      return;
    }

    // Check file size
    if (file.size > 10 * 1024 * 1024) {
      Alert.alert('Error', 'Image file is too large. Please select an image under 10MB.');
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

  // Enhanced drag and drop handlers for Mac
  const handleDragOver = (e) => {
    if (Platform.OS === 'web') {
      e.preventDefault();
      e.stopPropagation();
      
      // Set the drop effect for better visual feedback on Mac
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
      }
      
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    if (Platform.OS === 'web') {
      e.preventDefault();
      e.stopPropagation();
      
      // Check if we're actually leaving the drop zone
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX;
      const y = e.clientY;
      
      if (x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom) {
        setIsDragOver(false);
      }
    }
  };

  const handleDrop = (e) => {
    if (Platform.OS === 'web') {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      
      console.log('Drop event triggered');
      
      const dataTransfer = e.dataTransfer;
      if (!dataTransfer) return;

      // Try items first (modern approach, better for Mac)
      if (dataTransfer.items && dataTransfer.items.length > 0) {
        const items = Array.from(dataTransfer.items);
        console.log('Dropped items:', items.map(item => `${item.kind}: ${item.type}`));
        
        for (let item of items) {
          if (item.kind === 'file') {
            const file = item.getAsFile();
            if (file && isImageFile(file)) {
              processImageFile(file);
              return;
            }
          }
        }
      }

      // Fallback to files
      if (dataTransfer.files && dataTransfer.files.length > 0) {
        const file = dataTransfer.files[0];
        console.log('Dropped file:', file.name, file.type);
        if (isImageFile(file)) {
          processImageFile(file);
        }
      }
    }
  };

  // Prevent default drag behavior on the entire document for Mac
  useEffect(() => {
    if (Platform.OS === 'web') {
      const preventDragDefault = (e) => {
        if (e.dataTransfer && e.dataTransfer.types.includes('Files')) {
          e.preventDefault();
        }
      };

      document.addEventListener('dragover', preventDragDefault);
      document.addEventListener('drop', preventDragDefault);

      return () => {
        document.removeEventListener('dragover', preventDragDefault);
        document.removeEventListener('drop', preventDragDefault);
      };
    }
  }, []);

  // Initialize v2.0 features
  useEffect(() => {
    checkCameraAvailability();
    setupPasteListener();
    return () => removePasteListener();
  }, []);

  const pickImage = async () => {
    if (Platform.OS === 'web') {
      // Web file picker - no camera capture attribute (fixed from blue)
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      // Don't set capture attribute - let user choose between camera and gallery
      
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          console.log('File selected:', file.name, file.type, file.size);
          processImageFile(file);
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

  const analyzeImage = async (imageData) => {
    console.log("analyzeImage called");
    setAnalyzing(true);
    setResults(null);
    setShowDetails(false);

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

  const handleWebCameraCapture = (imageData) => {
    setImage(imageData);
    setShowWebCamera(false);
    analyzeImage(imageData);
  };

  // Show camera interface if active
  if (showWebCamera) {
    return (
      <WebCameraView
        onCapture={handleWebCameraCapture}
        onCancel={() => setShowWebCamera(false)}
      />
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>My Thrifting Buddy</Text>
      <Text style={styles.subtitle}>Upload a photo to get resale prices</Text>

      {/* ChatGPT-style upload area (v2.0 feature) */}
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
          You can also paste an image (Ctrl+V or Cmd+V) or use your camera
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

      {image && (
        <Image source={{ uri: image }} style={styles.image} />
      )}

      {analyzing && (
        <Text style={styles.analyzing}>Analyzing...</Text>
      )}

      {results && (
        <View style={styles.results}>
          <Text style={styles.resultTitle}>Results:</Text>
          <Text style={styles.itemName}>Item: {results.item_name}</Text>
          
          {results.style_tier && (
            <View style={styles.tierContainer}>
              <Text style={styles.label}>Style Tier: </Text>
              <View style={[styles.tierBadge, styles[`tier${results.style_tier}`]]}>
                <Text style={styles.tierText}>{results.style_tier}</Text>
              </View>
            </View>
          )}
          
          <Text style={styles.resultRow}>Resale Value: {results.price_range}</Text>
          {results.buy_price && (
            <Text style={[styles.resultRow, styles.buyPrice]}>
              Max Buy Price: {results.buy_price} (÷5 rule)
            </Text>
          )}
          
          <Text style={styles.resultRow}>Best Platform: {results.recommended_platform}</Text>
          <Text style={styles.resultRow}>Condition: {results.condition}</Text>

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

          {/* Expandable details section (v2.0 feature) */}
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
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 50,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  // v2.0 Upload area styles
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
  uploadButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  uploadButtonDisabled: {
    backgroundColor: '#ccc',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cameraButton: {
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cameraButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  image: {
    width: '100%',
    height: 300,
    marginTop: 20,
    resizeMode: 'contain',
  },
  analyzing: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 18,
  },
  results: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  itemName: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  resultRow: {
    fontSize: 15,
    marginBottom: 5,
  },
  buyPrice: {
    fontWeight: 'bold',
    color: '#2e7d32',
    fontSize: 16,
    marginTop: 5,
    marginBottom: 10,
  },
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
  tierContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 15,
  },
  tierBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  tierEntry: {
    backgroundColor: '#e3f2fd',
  },
  tierDesigner: {
    backgroundColor: '#f3e5f5',
  },
  tierLuxury: {
    backgroundColor: '#fff3e0',
  },
  tierText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  // v2.0 Details section styles
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
  // Camera styles
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  cameraTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelText: {
    color: '#fff',
    fontSize: 16,
  },
  videoWrapper: {
    flex: 1,
    position: 'relative',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
  },
  captureContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#000',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  errorMessage: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  errorHint: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
  },
});
