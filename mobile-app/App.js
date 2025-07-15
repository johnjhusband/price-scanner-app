import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Alert, Platform, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';

// Import brand components and theme
import FlippiLogo from './components/FlippiLogo';
import BrandButton from './components/BrandButton';
import { brandColors, typography, componentColors } from './theme/brandColors';

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
          <BrandButton title="Go Back" variant="primary" onPress={onCancel} />
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

// Helper functions for score colors using brand colors
const getBocaScoreColor = (score) => {
  const numScore = parseInt(score);
  if (numScore >= 80) return componentColors.scores.high;
  if (numScore >= 60) return componentColors.scores.medium;
  return componentColors.scores.low;
};

const getAuthenticityColor = (score) => {
  const numScore = parseInt(score);
  if (numScore >= 80) return componentColors.scores.high;
  if (numScore >= 60) return componentColors.scores.medium;
  return componentColors.scores.low;
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
  
  const fileInputRef = useRef(null);

  // Check for camera availability and setup paste listener
  useEffect(() => {
    checkCameraAvailability();
    setupPasteListener();
    return () => removePasteListener();
  }, []);

  const checkCameraAvailability = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasVideoDevice = devices.some(device => device.kind === 'videoinput');
      setHasCamera(hasVideoDevice);
    } catch (error) {
      console.log('Camera check failed:', error);
      setHasCamera(false);
    }
  };

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

  const processImageFile = (file) => {
    console.log('Processing file:', file.name, file.type, file.size);
    
    if (!isImageFile(file)) {
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

  // Check if running on mobile web browser
  const isMobileWeb = () => {
    return Platform.OS === 'web' && 
           /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

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
      
      // Ensure the click happens (fixes the bug)
      setTimeout(() => {
        input.click();
      }, 100);
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

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processImageFile(files[0]);
    }
  };

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
      {/* Branded Header with Logo */}
      <View style={styles.header}>
        <FlippiLogo size="large" />
        <Text style={styles.subtitle}>Resell products like never before</Text>
      </View>

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
          <BrandButton 
            title="Choose Image"
            variant="primary"
            onPress={pickImage}
            disabled={analyzing}
          />
          
          {hasCamera && (
            <BrandButton 
              title="Use Web Camera (Beta)"
              variant="secondary"
              onPress={() => setShowWebCamera(true)}
              disabled={analyzing}
            />
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

          {/* Enhanced Fields */}
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
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: brandColors.coolWhite,
  },
  header: {
    alignItems: 'center',
    marginTop: 50,
    marginBottom: 30,
  },
  subtitle: {
    fontSize: parseInt(typography.sizes.h3),
    fontWeight: typography.weights.medium,
    color: brandColors.secondaryText,
    textAlign: 'center',
    marginTop: 10,
    fontFamily: typography.fontFamily,
  },
  // ChatGPT-style upload area
  uploadArea: {
    borderWidth: 2,
    borderColor: componentColors.uploadArea.border,
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 40,
    alignItems: 'center',
    backgroundColor: componentColors.uploadArea.background,
    marginBottom: 20,
  },
  uploadAreaDragOver: {
    borderColor: componentColors.uploadArea.hoverBorder,
    backgroundColor: componentColors.uploadArea.hoverBackground,
  },
  uploadAreaDisabled: {
    opacity: 0.6,
  },
  uploadIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  uploadText: {
    fontSize: parseInt(typography.sizes.body),
    fontWeight: typography.weights.medium,
    color: brandColors.primaryText,
    textAlign: 'center',
    marginBottom: 5,
    fontFamily: typography.fontFamily,
  },
  uploadHint: {
    fontSize: parseInt(typography.sizes.small),
    color: brandColors.secondaryText,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: typography.fontFamily,
  },
  uploadButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
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
    fontSize: parseInt(typography.sizes.body),
    color: brandColors.primaryText,
    fontFamily: typography.fontFamily,
  },
  results: {
    marginTop: 20,
    padding: 20,
    backgroundColor: componentColors.results.background,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: brandColors.actionBlue,
  },
  resultTitle: {
    fontSize: parseInt(typography.sizes.h3),
    fontWeight: typography.weights.bold,
    marginBottom: 10,
    color: brandColors.primaryText,
    fontFamily: typography.fontFamily,
  },
  itemName: {
    fontSize: parseInt(typography.sizes.body),
    marginBottom: 8,
    fontWeight: typography.weights.semiBold,
    color: brandColors.primaryText,
    fontFamily: typography.fontFamily,
  },
  resultRow: {
    fontSize: parseInt(typography.sizes.body),
    marginBottom: 5,
    color: brandColors.primaryText,
    fontFamily: typography.fontFamily,
  },
  buyPrice: {
    fontWeight: typography.weights.bold,
    color: componentColors.scores.high,
    fontSize: parseInt(typography.sizes.body),
    marginTop: 5,
    marginBottom: 10,
    fontFamily: typography.fontFamily,
  },
  tierContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: parseInt(typography.sizes.body),
    color: brandColors.primaryText,
    fontFamily: typography.fontFamily,
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
    fontSize: parseInt(typography.sizes.small),
    fontWeight: typography.weights.semiBold,
    color: brandColors.primaryText,
    fontFamily: typography.fontFamily,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  scoreText: {
    fontSize: parseInt(typography.sizes.body),
    fontWeight: typography.weights.bold,
    marginLeft: 8,
    fontFamily: typography.fontFamily,
  },
  scoreDescription: {
    fontSize: parseInt(typography.sizes.notes),
    color: brandColors.secondaryText,
    marginLeft: 8,
    fontStyle: 'italic',
    fontFamily: typography.fontFamily,
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
    fontSize: parseInt(typography.sizes.h3),
    fontWeight: typography.weights.bold,
    fontFamily: typography.fontFamily,
  },
  cancelText: {
    color: '#fff',
    fontSize: parseInt(typography.sizes.body),
    fontFamily: typography.fontFamily,
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
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  loadingText: {
    color: '#fff',
    fontSize: parseInt(typography.sizes.body),
    marginTop: 10,
    fontFamily: typography.fontFamily,
  },
  captureContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#ddd',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#333',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: parseInt(typography.sizes.h2),
    fontWeight: typography.weights.bold,
    marginBottom: 10,
    color: brandColors.primaryText,
    fontFamily: typography.fontFamily,
  },
  errorMessage: {
    fontSize: parseInt(typography.sizes.body),
    textAlign: 'center',
    marginBottom: 10,
    color: brandColors.secondaryText,
    fontFamily: typography.fontFamily,
  },
  errorHint: {
    fontSize: parseInt(typography.sizes.small),
    textAlign: 'center',
    marginBottom: 20,
    color: brandColors.disabledText,
    fontFamily: typography.fontFamily,
  },
}); 