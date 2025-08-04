import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Alert, Platform, ScrollView, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';

// Import brand components and theme
import FlippiLogo from './components/FlippiLogo';
import BrandButton from './components/BrandButton';
import FeedbackPrompt from './components/FeedbackPrompt';
import EnterScreen from './components/EnterScreen';
import AuthService from './services/authService';
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
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // First effect: Get camera permissions
  useEffect(() => {
    if (hasPermission === null) {
      requestCameraPermission();
    }
  }, [hasPermission]);

  // Second effect: Attach stream to video element when both are ready
  useEffect(() => {
    if (hasPermission === true && stream && videoRef.current) {
      attachStreamToVideo();
    }
  }, [hasPermission, stream]);
  
  // Cleanup effect
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const requestCameraPermission = async () => {
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
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      streamRef.current = mediaStream;
      setStream(mediaStream);
      setHasPermission(true);
    } catch (err) {
      console.error('Camera permission error:', err);
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

  const attachStreamToVideo = () => {
    if (!videoRef.current || !stream) {
      console.error('Missing video ref or stream');
      return;
    }
    videoRef.current.srcObject = stream;
    
    // Add multiple event listeners for better compatibility
    videoRef.current.onloadedmetadata = () => {
      videoRef.current.play().then(() => {
        setIsReady(true);
      }).catch(err => {
        console.error('Error playing video:', err);
        // Try to set ready anyway
        setIsReady(true);
      });
    };
    
    // Fallback for some browsers
    videoRef.current.oncanplay = () => {
      if (!isReady) {
        setIsReady(true);
      }
    };
    
    // Force a play attempt after a short delay
    setTimeout(() => {
      if (videoRef.current && !isReady) {
        videoRef.current.play().catch(() => {});
        setIsReady(true);
      }
    }, 1000);
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

  const handleCloseCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    onCancel();
  };

  if (hasPermission === null) {
    return (
      <View style={[styles.cameraContainer, { backgroundColor: brandColors.background }]}>
        <ActivityIndicator size="large" color={brandColors.charcoalGray} />
        <Text style={[styles.cameraText, { color: brandColors.text }]}>Initializing camera...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={[styles.cameraContainer, { backgroundColor: brandColors.background }]}>
        <Text style={[styles.cameraText, { color: brandColors.danger }]}>Camera permission not granted</Text>
        <BrandButton title="Close" onPress={handleCloseCamera} />
      </View>
    );
  }

  return (
    <View style={[styles.cameraContainer, { backgroundColor: brandColors.background }]}>
      <View style={{ width: '100%', maxWidth: 600, height: 400, position: 'relative' }}>
        <video
          ref={videoRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'black',
            objectFit: 'cover'
          }}
          autoPlay={true}
          playsInline={true}
          muted={true}
        />
      </View>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <View style={styles.cameraButtonContainer}>
        <BrandButton 
          title="Cancel" 
          onPress={handleCloseCamera} 
          variant="secondary"
        />
        <BrandButton 
          title="Capture Photo" 
          onPress={capturePhoto} 
          disabled={!isReady}
        />
      </View>
    </View>
  );
};

export default function App() {
  // Build version for cache busting
  const [image, setImage] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [hasCamera, setHasCamera] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);
  const [productDescription, setProductDescription] = useState('');
  const [imageBase64, setImageBase64] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const scrollViewRef = useRef(null);
  const resultsRef = useRef(null);

  // Check if camera is available (v2.0 feature)
  const checkCameraAvailability = async () => {
    if (Platform.OS === 'web') {
      // Check if browser supports camera and we're on HTTPS
      const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
      const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      setHasCamera(isSecure && hasMediaDevices);
    } else {
      // Mobile platforms - check camera permissions
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasCamera(status === 'granted');
    }
  };

  // Helper function to check if a file is an image
  const isImageFile = (file) => {
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif'];
    
    // Check MIME type
    if (file.type && imageTypes.includes(file.type.toLowerCase())) {
      return true;
    }
    
    // Check file extension as fallback
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif'];
    const fileName = file.name.toLowerCase();
    return validExtensions.some(ext => fileName.endsWith(ext));
  };

  // Enhanced error handling
  const showError = (message) => {
    if (Platform.OS === 'web') {
      // Web-specific error display
      Alert.alert('Error', message);
    } else {
      Alert.alert('Error', message);
    }
  };

  // Check camera availability on web
  const checkWebCameraSupport = () => {
    if (Platform.OS === 'web') {
      const isHttps = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
      const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      
      if (!isHttps) {
        return { supported: false, reason: 'Camera requires HTTPS connection' };
      }
      if (!hasGetUserMedia) {
        return { supported: false, reason: 'Camera not supported in this browser' };
      }
      return { supported: true };
    }
    return { supported: true };
  };

  // Enhanced mobile camera check
  const requestCameraPermission = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Camera permission error:', error);
      setHasCamera(false);
    }
  };

  // Enhanced paste handler for Mac compatibility
  const handlePaste = (event) => {
    event.preventDefault(); // Important for Mac
    
    // Try multiple ways to access clipboard data for better compatibility
    const clipboardData = event.clipboardData || window.clipboardData;
    if (!clipboardData) {
      return;
    }

    // Check items first (modern browsers)
    if (clipboardData.items) {
      const items = Array.from(clipboardData.items);
      for (let item of items) {
        if (item.type.indexOf('image') !== -1 || item.kind === 'file') {
          const file = item.getAsFile();
          if (file) {
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
        processImageFile(file);
      }
    }
  };

  // Setup paste listener with Mac-specific options
  const setupPasteListener = () => {
    if (Platform.OS === 'web') {
      // Use capture phase and non-passive for better Mac compatibility
      document.addEventListener('paste', handlePaste, { capture: true, passive: false });
    }
  };

  const removePasteListener = () => {
    if (Platform.OS === 'web') {
      document.removeEventListener('paste', handlePaste, { capture: true });
    }
  };

  // Process image file from drag/drop or paste (v2.0 feature)
  const processImageFile = (file) => {
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
      // Don't auto-analyze, wait for Go button
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
      const dataTransfer = e.dataTransfer;
      if (!dataTransfer) return;

      // Try items first (modern approach, better for Mac)
      if (dataTransfer.items && dataTransfer.items.length > 0) {
        const items = Array.from(dataTransfer.items);
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
    
    // Set document title on web
    if (Platform.OS === 'web') {
      document.title = 'Flippi.ai™ - Never Over Pay';
    }
    
    // Check authentication on web
    if (Platform.OS === 'web') {
      // Check if token in URL (OAuth callback)
      if (AuthService.parseTokenFromUrl()) {
        setIsAuthenticated(true);
        setUser(AuthService.getUser());
        setAuthLoading(false);
      } else if (AuthService.isAuthenticated()) {
        // Check existing session
        setIsAuthenticated(true);
        setUser(AuthService.getUser());
        setAuthLoading(false);
      } else {
        setAuthLoading(false);
      }
    } else {
      // Mobile platforms - for now, no auth required
      setAuthLoading(false);
    }
    
    return () => removePasteListener();
  }, []);
  
  // Debug analysisResult changes
  useEffect(() => {
  }, [analysisResult]);

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
          processImageFile(file);
        }
      };
      
      // Trigger file picker
      input.click();
    } else {
      // Mobile file picker
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [4, 3],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        // Check file size for mobile
        if (asset.fileSize && asset.fileSize > 10 * 1024 * 1024) {
          Alert.alert('Error', 'Image file is too large. Please select an image under 10MB.');
          return;
        }
        setImage(asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri);
        // Don't auto-analyze, wait for Go button
      }
    }
  };

  const takePhoto = async () => {
    if (Platform.OS === 'web') {
      setShowCamera(true);
    } else {
      // Mobile camera
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
        return;
      }

      let result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        aspect: [4, 3],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setImage(asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri);
        // Don't auto-analyze, wait for Go button
      }
    }
  };

  const handleWebCameraCapture = (imageData) => {
    setShowCamera(false);
    setImage(imageData);
    // Don't auto-analyze, wait for Go button
  };

  const analyzeImage = async () => {
    if (!image) {
      Alert.alert('Error', 'Please select an image first');
      return;
    }
    
    setIsLoading(true);
    setAnalysisResult(null);
    try {
      const formData = new FormData();
      
      let base64Data;
      
      if (Platform.OS === 'web') {
        // Convert base64 to blob for web
        const response = await fetch(image);
        const blob = await response.blob();
        formData.append('image', blob, 'image.jpg');
        
        // Also convert to base64 for feedback storage
        const reader = new FileReader();
        base64Data = await new Promise((resolve) => {
          reader.onloadend = () => {
            const base64 = reader.result.split(',')[1]; // Remove data:image/jpeg;base64, prefix
            resolve(base64);
          };
          reader.readAsDataURL(blob);
        });
      } else {
        // Mobile
        formData.append('image', {
          uri: image,
          type: 'image/jpeg',
          name: 'photo.jpg',
        });
        
        // Convert to base64 for feedback storage
        const response = await fetch(image);
        const blob = await response.blob();
        const reader = new FileReader();
        base64Data = await new Promise((resolve) => {
          reader.onloadend = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
          };
          reader.readAsDataURL(blob);
        });
      }
      
      // Store base64 for feedback
      setImageBase64(base64Data);
      
      // Add description if provided
      if (productDescription.trim()) {
        formData.append('description', productDescription.trim());
      }

      const apiResponse = await fetch(`${API_URL}/api/scan`, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - let browser set it with boundary
      });

      const responseText = await apiResponse.text();
      if (apiResponse.ok) {
        try {
          const data = JSON.parse(responseText);
          if (data.success && data.data) {
            // Create a new object to ensure React detects the change
            const newResult = { ...data.data };
            setAnalysisResult(newResult);
            setShowFeedback(true);
            // Scroll to results after a brief delay
            setTimeout(() => {
              if (resultsRef.current && scrollViewRef.current) {
                if (Platform.OS === 'web') {
                  // For web, use scrollIntoView
                  resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                  // For mobile, use ScrollView's scrollTo
                  resultsRef.current.measureLayout(
                    scrollViewRef.current.getInnerViewNode(),
                    (x, y) => {
                      scrollViewRef.current.scrollTo({ y: y - 20, animated: true });
                    }
                  );
                }
              }
            }, 300);
          } else {
            throw new Error(data.error || 'Invalid response format');
          }
        } catch (parseError) {
          console.error('Parse error:', parseError);
          throw new Error('Failed to parse server response');
        }
      } else {
        throw new Error(`Server error: ${apiResponse.status} - ${responseText}`);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      Alert.alert(
        'Analysis Failed',
        error.message || 'Unable to analyze image. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const resetApp = () => {
    setImage(null);
    setAnalysisResult(null);
    setIsLoading(false);
    setProductDescription('');
    setImageBase64(null);
    setShowFeedback(false);
  };
  
  const handleExit = async () => {
    if (Platform.OS === 'web') {
      try {
        // Call backend to logout
        await fetch(`${API_URL}/auth/exit`, {
          method: 'GET',
          credentials: 'include'
        });
      } catch (error) {
        console.error('Exit error:', error);
      }
      
      // Clear local auth
      AuthService.exit();
      setIsAuthenticated(false);
      setUser(null);
      resetApp();
    }
  };

  if (showCamera) {
    return <WebCameraView onCapture={handleWebCameraCapture} onCancel={() => setShowCamera(false)} />;
  }
  
  // Show loading while checking auth
  if (authLoading && Platform.OS === 'web') {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={brandColors.charcoalGray} />
      </View>
    );
  }
  
  // Show Enter screen if not authenticated (web only)
  if (Platform.OS === 'web' && !isAuthenticated) {
    return <EnterScreen />;
  }

  // Main Flip interface
  return (
    <ScrollView 
      ref={scrollViewRef}
      style={[styles.container, { backgroundColor: brandColors.background }]}
      contentContainerStyle={styles.contentContainer}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Environment Banner - Only show in non-production */}
      {Platform.OS === 'web' && window.location.hostname === 'blue.flippi.ai' && (
        <View style={styles.environmentBanner}>
          <Text style={styles.environmentText}>DEVELOPMENT ENVIRONMENT</Text>
        </View>
      )}
      {Platform.OS === 'web' && window.location.hostname === 'green.flippi.ai' && (
        <View style={styles.environmentBannerStaging}>
          <Text style={styles.environmentText}>STAGING ENVIRONMENT</Text>
        </View>
      )}
      
      {/* You section - User info and Exit - Outside content for better positioning */}
      {Platform.OS === 'web' && user && (
        <View style={styles.userSection}>
          <View style={styles.userInfo}>
            <Text style={styles.userEmail} numberOfLines={1}>{user.email}</Text>
          </View>
          <TouchableOpacity onPress={handleExit} style={styles.exitButton}>
            <Text style={styles.exitText}>Exit</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.content}>
        
        <FlippiLogo />
        <Text style={[styles.title, { color: brandColors.text }]}>
          Never Over Pay
        </Text>
        
        <View style={[
          styles.uploadContainer,
          isDragOver && styles.dragOver
        ]}>
          {/* Text input always visible at top */}
          <TextInput
            style={[styles.descriptionInput, { 
              backgroundColor: brandColors.surface,
              color: brandColors.text,
              borderColor: brandColors.border || '#ddd',
              marginBottom: 20
            }]}
            placeholder="Describe your item (optional)"
            placeholderTextColor={brandColors.textSecondary}
            value={productDescription}
            onChangeText={setProductDescription}
            multiline
            numberOfLines={3}
          />
          
          {!image ? (
            <>
              <BrandButton
                title="Choose from Gallery"
                onPress={pickImage}
                style={styles.actionButton}
              />
              
              {hasCamera && (
                <BrandButton
                  title="Take Photo"
                  onPress={takePhoto}
                  style={styles.actionButton}
                  variant="secondary"
                />
              )}
              
              {Platform.OS === 'web' && (
                <View style={[styles.dropZone, isDragOver && styles.dropZoneActive]}>
                  <Text style={[styles.dropZoneText, { color: brandColors.textSecondary }]}>
                    {isDragOver ? 'Drop image here' : 'Or drag and drop an image here'}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.resultContainer}>
              <Image source={{ uri: image }} style={styles.image} />
              
              {!analysisResult && !isLoading && (
                <BrandButton
                  title="Go"
                  onPress={analyzeImage}
                  style={styles.goButton}
                />
              )}
            
            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={brandColors.charcoalGray} />
                <Text style={[styles.loadingText, { color: brandColors.text }]}>
                  Analyzing image...
                </Text>
              </View>
            )}
            
            {analysisResult ? (
              <View 
                ref={(ref) => {
                  resultsRef.current = ref;
                  // For web, we need the actual DOM node
                  if (Platform.OS === 'web' && ref) {
                    resultsRef.current = ref._nativeTag || ref;
                  }
                }}
                style={[styles.analysisResult, { backgroundColor: brandColors.surface }]}>
                <Text style={[styles.resultTitle, { color: brandColors.text }]}>Analysis Results</Text>
                
                <View style={styles.resultItem}>
                  <Text style={[styles.resultLabel, { color: brandColors.textSecondary }]}>Item:</Text>
                  <Text style={[styles.resultValue, { color: brandColors.text }]}>{analysisResult.item_name}</Text>
                </View>
                
                <View style={styles.resultItem}>
                  <Text style={[styles.resultLabel, { color: brandColors.textSecondary }]}>Estimated Value:</Text>
                  <Text style={[styles.resultValue, styles.priceValue, { color: brandColors.success }]}>
                    {analysisResult.price_range}
                  </Text>
                </View>
                
                <View style={styles.resultItem}>
                  <Text style={[styles.resultLabel, { color: brandColors.textSecondary }]}>Condition:</Text>
                  <Text style={[styles.resultValue, { color: brandColors.text }]}>{analysisResult.condition}</Text>
                </View>
                
                <View style={styles.resultItem}>
                  <Text style={[styles.resultLabel, { color: brandColors.textSecondary }]}>Style Tier:</Text>
                  <View style={[styles.styleTierBadge, {
                    backgroundColor: (() => {
                      const tier = analysisResult.style_tier.toLowerCase();
                      if (tier === 'luxury') return componentColors.scores.high;
                      if (tier === 'designer') return componentColors.scores.medium;
                      return brandColors.slateBlueGray;
                    })()
                  }]}>
                    <Text style={styles.styleTierBadgeText}>{analysisResult.style_tier}</Text>
                  </View>
                </View>
                
                {analysisResult.recommended_platform && (
                  <View style={styles.resultItem}>
                    <Text style={[styles.resultLabel, { color: brandColors.textSecondary }]}>Best Listing Platform:</Text>
                    <Text style={[styles.resultValue, { color: brandColors.text }]}>{analysisResult.recommended_platform}</Text>
                  </View>
                )}
                
                {analysisResult.recommended_live_platform && (
                  <View style={styles.resultItem}>
                    <Text style={[styles.resultLabel, { color: brandColors.textSecondary }]}>Best Live Platform:</Text>
                    <Text style={[styles.resultValue, { color: brandColors.text }]}>{analysisResult.recommended_live_platform}</Text>
                  </View>
                )}
                
                {analysisResult.authenticity_score && (
                  <View style={styles.resultItem}>
                    <Text style={[styles.resultLabel, { color: brandColors.textSecondary }]}>Authenticity Score:</Text>
                    <View>
                      <Text style={[styles.resultValue, { 
                        color: (() => {
                          const score = parseInt(analysisResult.authenticity_score);
                          if (score >= 80) return componentColors.scores.high;
                          if (score >= 50) return componentColors.scores.medium;
                          return componentColors.scores.low;
                        })()
                      }]}>
                        {(() => {
                          const score = parseInt(analysisResult.authenticity_score);
                          if (score >= 80) return '✓ ';
                          if (score >= 50) return '◐ ';
                          return '○ ';
                        })()}
                        {analysisResult.authenticity_score}
                      </Text>
                      {parseInt(analysisResult.authenticity_score) < 50 && (
                        <Text style={[styles.warningText, { color: componentColors.scores.low }]}>
                          ⚠️ Warning: Low authenticity - verify carefully
                        </Text>
                      )}
                    </View>
                  </View>
                )}
                
                {analysisResult.trending_score !== undefined && (
                  <View style={styles.resultItem}>
                    <Text style={[styles.resultLabel, { color: brandColors.textSecondary }]}>Boca Score (Sellability):</Text>
                    <Text style={[styles.resultValue, { 
                      color: (() => {
                        const score = parseInt(analysisResult.trending_score);
                        if (score >= 80) return componentColors.scores.high;
                        if (score >= 50) return componentColors.scores.medium;
                        return componentColors.scores.low;
                      })()
                    }]}>
                      {analysisResult.trending_score}/100 {(() => {
                        const score = parseInt(analysisResult.trending_score);
                        if (score >= 80) return '🔥';
                        if (score >= 50) return '📈';
                        return '📉';
                      })()} - {analysisResult.trending_label || 'N/A'}
                    </Text>
                  </View>
                )}
                
                {analysisResult.buy_price && (
                  <View style={[styles.suggestedPriceContainer, { backgroundColor: brandColors.softCream }]}>
                    <Text style={[styles.suggestedPriceLabel, { color: brandColors.slateTeal }]}>
                      Suggested Buy Price:
                    </Text>
                    <Text style={[styles.suggestedPriceValue, { color: brandColors.deepTeal }]}>
                      {analysisResult.buy_price}
                    </Text>
                  </View>
                )}
                
                {analysisResult.market_insights && (
                  <View style={styles.resultItem}>
                    <Text style={[styles.resultLabel, { color: brandColors.textSecondary }]}>Market Insights:</Text>
                    <Text style={[styles.resultValue, { color: brandColors.text }]}>{analysisResult.market_insights}</Text>
                  </View>
                )}
                
                {analysisResult.selling_tips && (
                  <View style={styles.resultItem}>
                    <Text style={[styles.resultLabel, { color: brandColors.textSecondary }]}>Selling Tips:</Text>
                    <Text style={[styles.resultValue, { color: brandColors.text }]}>
                      {analysisResult.selling_tips}
                    </Text>
                  </View>
                )}
                
                {analysisResult.environmental_tag && (
                  <View style={[styles.environmentalContainer, { backgroundColor: '#E8F5E9' }]}>
                    <Text style={[styles.environmentalTag, { color: '#2E7D32' }]}>
                      {analysisResult.environmental_tag}
                    </Text>
                  </View>
                )}
              </View>
            ) : (!isLoading && !analysisResult && image) ? (
              <Text style={{ color: brandColors.text, marginTop: 20 }}>No results yet. Press Go to analyze.</Text>
            ) : null}
            
            
            {analysisResult && showFeedback && (
              <FeedbackPrompt
                scanData={analysisResult}
                userDescription={productDescription}
                imageData={imageBase64}
                onComplete={() => setShowFeedback(false)}
              />
            )}
            
            {analysisResult && (
              <BrandButton
                title="Scan Another Item"
                onPress={resetApp}
                style={styles.resetButton}
              />
            )}
            </View>
          )}
        </View>
      </View>
      
      {/* Legal Footer */}
      <View style={styles.legalFooter}>
        <Text style={[styles.legalText, { marginBottom: 4 }]}>
          *ai makes mistakes. check important info
        </Text>
        <Text style={styles.legalText}>
          Flippi™ and Flippi.ai™ are trademarks of Boca Belle. All rights reserved.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%', // Ensure full width
  },
  contentContainer: {
    flexGrow: 1,
    alignItems: 'center', // Center the content column
    width: '100%', // Full width
  },
  environmentBanner: {
    backgroundColor: '#2196F3',
    padding: 8,
    alignItems: 'center',
  },
  environmentBannerStaging: {
    backgroundColor: '#4CAF50',
    padding: 8,
    alignItems: 'center',
  },
  environmentText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    padding: Platform.OS === 'web' ? 40 : 10, // Less padding on mobile for more width
    paddingTop: Platform.OS === 'web' ? 60 : 80, // More top padding to avoid user section
  },
  title: {
    fontSize: 24,
    fontWeight: typography.weights.bold,
    fontFamily: typography.fontFamily,
    marginTop: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  uploadContainer: {
    width: Platform.OS === 'web' ? '80%' : '100%', // 80% on desktop, full on mobile
    maxWidth: 1000, // Only prevent extreme stretching
    alignItems: 'center',
    marginTop: 10,
  },
  resultContainer: {
    width: '100%',
    alignItems: 'center',
  },
  actionButton: {
    marginVertical: 5,
    width: '100%',
  },
  dropZone: {
    width: '100%',
    minHeight: 150,
    borderWidth: 2,
    borderColor: brandColors.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    padding: 20,
  },
  dropZoneActive: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  dropZoneText: {
    fontSize: 16,
  },
  dragOver: {
    opacity: 0.8,
  },
  image: {
    width: '100%',
    height: 300,
    resizeMode: 'contain',
    marginBottom: 20,
    borderRadius: 10,
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  analysisResult: {
    width: Platform.OS === 'web' ? '80%' : '100%', // 80% on desktop, full on mobile
    maxWidth: 1000, // Generous limit only for ultra-wide
    padding: Platform.OS === 'web' ? 20 : 12,
    borderRadius: 10,
    marginBottom: 20,
    alignSelf: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  resultItem: {
    marginBottom: 12,
    width: '100%',
  },
  resultLabel: {
    fontSize: Platform.OS === 'web' ? 14 : 13,
    marginBottom: 4,
  },
  resultValue: {
    fontSize: Platform.OS === 'web' ? 16 : 14,
    fontWeight: '500',
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  priceValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  suggestedPriceContainer: {
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: brandColors.softTaupeBeige,
    width: '100%',
  },
  suggestedPriceLabel: {
    fontSize: 14,
    marginBottom: 5,
  },
  suggestedPriceValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  styleTierBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  styleTierBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  warningText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  disclaimer: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  disclaimerText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  resetButton: {
    marginTop: 10,
    width: '100%',
  },
  // Camera styles
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraPreview: {
    width: '100%',
    maxWidth: 600,
    height: 400,
    backgroundColor: 'black',
  },
  cameraText: {
    fontSize: 16,
    marginVertical: 10,
  },
  cameraButtonContainer: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 20,
  },
  // Analysis controls
  analysisControls: {
    width: '100%',
    marginVertical: 20,
  },
  descriptionInput: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 15,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  goButton: {
    width: '100%',
  },
  // User section styles
  userSection: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 40 : 20, // Move down to avoid dev banner
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent', // Remove background
    paddingVertical: 4,
    paddingHorizontal: 0,
    shadowColor: 'transparent', // Remove shadow
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    zIndex: 1000,
    maxWidth: 280,
  },
  userInfo: {
    marginRight: 8,
    maxWidth: 200, // Limit width to prevent overflow
  },
  userName: {
    fontSize: 13,
    fontWeight: typography.weights.semiBold,
    color: brandColors.text,
  },
  userGreeting: {
    fontSize: 13,
    fontWeight: typography.weights.semiBold,
    color: brandColors.text,
  },
  userEmail: {
    fontSize: 12,
    color: brandColors.text,
    fontWeight: typography.weights.medium,
  },
  exitButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: brandColors.deepTeal,
    borderRadius: 4,
    marginLeft: 8,
  },
  exitText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: typography.weights.medium,
  },
  legalFooter: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: brandColors.border,
    alignItems: 'center',
  },
  legalText: {
    fontSize: 12,
    color: brandColors.textSecondary,
    fontFamily: typography.fontFamily,
    textAlign: 'center',
  },
  environmentalContainer: {
    marginTop: 12,
    marginHorizontal: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  environmentalTag: {
    fontSize: 14,
    fontFamily: typography.fontFamily,
    fontWeight: typography.weights.medium,
    textAlign: 'center',
  },
});