// BUILD VERSION: 2025-08-20 01:00 - Force rebuild after account migration cache fix
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Alert, Platform, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Linking, Dimensions } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';

// Import Feather icons per brand guide
import { Feather } from '@expo/vector-icons';

// Import brand components and theme
import FlippiLogo from './components/FlippiLogo';
import BrandButton from './components/BrandButton';
import FeedbackSystem from './components/FeedbackSystem';
import EnterScreen from './components/EnterScreen';
import MissionModal from './components/MissionModal';
import PageContainer from './components/PageContainer';
import AdminDashboard from './screens/AdminDashboard';
import GrowthDashboard from './screens/GrowthDashboard';
import PricingModal from './components/PricingModal';
import UpgradeModal from './components/UpgradeModal';
import AuthService from './services/authService';
import { brandColors, typography, componentColors } from './theme/brandColors';
import { getDeviceFingerprint } from './utils/deviceFingerprint';
import { appleStyles } from './theme/appleStyles';

// Import web styles for web platform
if (Platform.OS === 'web') {
  require('./web-styles.css');
}

// Responsive design breakpoints
const { width: windowWidth } = Dimensions.get('window');
const isMobile = windowWidth < 768;
const isTablet = windowWidth >= 768 && windowWidth < 1024;
const isDesktop = windowWidth >= 1024;

/* BUTTON HIERARCHY GUIDE
 * =====================
 * 1. PRIMARY CTAs (accent/bright blue) - One per screen max
 *    - "Go" (analyze image)
 *    - "Capture Photo" (in camera view)
 * 
 * 2. BRAND ACTIONS (primary/navy) - Core functionality
 *    - "Take Photo" (main action)
 * 
 * 3. SECONDARY ACTIONS (secondary/light gray) - Supporting
 *    - "Upload Photo"
 *    - "Scan Another Item"
 * 
 * 4. TERTIARY ACTIONS (ghost/transparent) - De-emphasized
 *    - "Paste Image"
 *    - "Cancel"
 *    - "Exit" (custom styled)
 * 
 * 5. SYSTEM ACTIONS (text links or custom) - Minimal
 *    - Legal links
 *    - "View More/Less Details"
 */

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
    console.log('[FLIPPI] App version 2.2.1 - Build fix 2025-08-19 21:15');
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
        <Text style={[styles.cameraText, { color: brandColors.text }]}>Initializing camera</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={[styles.cameraContainer, { backgroundColor: brandColors.background }]}>
        <Text style={[styles.cameraText, { color: brandColors.error }]}>Camera permission not granted</Text>
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
            backgroundColor: '#18181b',
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
          variant="ghost"
        />
        <BrandButton 
          title="Capture Photo" 
          onPress={capturePhoto} 
          disabled={!isReady}
          variant="accent"
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
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [showMissionModal, setShowMissionModal] = useState(false);
  const [flipCount, setFlipCount] = useState(0);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [showGrowthDashboard, setShowGrowthDashboard] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showPricingPage, setShowPricingPage] = useState(false);
  const [flipStatus, setFlipStatus] = useState(null);
  const [deviceFingerprint, setDeviceFingerprint] = useState(null);
  
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
      console.log('[DEBUG] Setting image from file upload:', event.target.result ? 'Data URL created' : 'No data');
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
      console.log('[Auth] Starting authentication check...');
      
      // Set a timeout for auth check to prevent infinite loading
      const authTimeout = setTimeout(() => {
        console.error('[Auth] Authentication check timed out after 5 seconds');
        setAuthLoading(false);
        setIsAuthenticated(false);
      }, 5000); // 5 second timeout
      
      // Check if token in URL (OAuth callback)
      console.log('[Auth] Checking for token in URL...');
      AuthService.parseTokenFromUrl().then(hasToken => {
        console.log('[Auth] Token in URL:', hasToken);
        
        if (hasToken) {
          setIsAuthenticated(true);
          // Get user asynchronously
          AuthService.getUser().then(userData => {
            console.log('[Auth] User data loaded:', userData?.email);
            setUser(userData);
            clearTimeout(authTimeout);
            setAuthLoading(false);
          }).catch(error => {
            console.error('Error getting user data:', error);
            clearTimeout(authTimeout);
            setAuthLoading(false);
          });
        } else {
          // No token in URL, check existing session
          console.log('[Auth] No token in URL, checking existing session...');
          AuthService.isAuthenticated().then(isAuth => {
            console.log('[Auth] Existing session found:', isAuth);
            
            if (isAuth) {
              setIsAuthenticated(true);
              AuthService.getUser().then(userData => {
                console.log('[Auth] User data loaded from session:', userData?.email);
                setUser(userData);
                clearTimeout(authTimeout);
                setAuthLoading(false);
              }).catch(error => {
                console.error('Error getting user from session:', error);
                clearTimeout(authTimeout);
                setAuthLoading(false);
              });
            } else {
              console.log('[Auth] No authentication found');
              clearTimeout(authTimeout);
              setAuthLoading(false);
            }
          }).catch(error => {
            console.error('Error checking auth status:', error);
            clearTimeout(authTimeout);
            setAuthLoading(false);
          });
        }
      }).catch(error => {
        console.error('Error during authentication:', error);
        clearTimeout(authTimeout);
        setAuthLoading(false);
      });
    } else {
      // Mobile platforms - for now, no auth required
      setAuthLoading(false);
    }
    
    return () => removePasteListener();
  }, []);
  
  // Initialize device fingerprint and check flip status
  useEffect(() => {
    const initializeFlipTracking = async () => {
      try {
        // Get or create device fingerprint
        const fingerprint = await getDeviceFingerprint();
        setDeviceFingerprint(fingerprint);
        
        // Check current flip status
        const response = await fetch(`${API_URL}/api/payment/flip-status`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-device-fingerprint': fingerprint
          },
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setFlipStatus(data.data);
          console.log('Flip status:', data.data);
        }
      } catch (error) {
        console.error('Error initializing flip tracking:', error);
      }
    };
    
    initializeFlipTracking();
  }, [user]); // Re-check when user changes

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
    
    // Check flip limit
    if (flipStatus && !flipStatus.can_flip) {
      setShowUpgradeModal(true);
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
      
      // Store base64 for feedback with full data URL prefix
      setImageBase64(`data:image/jpeg;base64,${base64Data}`);
      
      // Add description if provided
      if (productDescription.trim()) {
        formData.append('description', productDescription.trim());
      }
      
      // Add device fingerprint for tracking
      if (deviceFingerprint) {
        formData.append('device_fingerprint', deviceFingerprint);
      }

      const apiResponse = await fetch(`${API_URL}/api/scan`, {
        method: 'POST',
        body: formData,
        headers: deviceFingerprint ? {
          'x-device-fingerprint': deviceFingerprint
        } : {},
        credentials: 'include'
      });

      const responseText = await apiResponse.text();
      
      // Handle payment required response
      if (apiResponse.status === 402) {
        try {
          const data = JSON.parse(responseText);
          if (data.flip_status) {
            setFlipStatus(data.flip_status);
          }
          setShowUpgradeModal(true);
          return;
        } catch (e) {
          // Fallback if parsing fails
          setShowUpgradeModal(true);
          return;
        }
      }
      
      if (apiResponse.ok) {
        try {
          const data = JSON.parse(responseText);
          if (data.success && data.data) {
            // Generate unique analysis ID for tracking
            const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Create a new object to ensure React detects the change
            const newResult = { ...data.data, analysis_id: analysisId };
            setAnalysisResult(newResult);
            setShowFeedback(true);
            // Increment flip count
            setFlipCount(prevCount => prevCount + 1);
            
            // Update flip status from response
            if (data.flip_status) {
              setFlipStatus(data.flip_status);
            }
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
    setShowMoreDetails(false);
    // Note: We intentionally do NOT reset flipCount here
    // so that the encouragement message persists between scans
  };

  // Render static encouragement message
  const renderEncouragementMessage = () => {
    return (
      <View style={[styles.welcomeContainer, { flexDirection: 'row', alignItems: 'center' }]}>
        <Feather 
          name="camera"
          size={16} 
          color={brandColors.textSecondary} 
        />
        <Text style={[styles.welcomeText, { color: brandColors.textSecondary, marginLeft: 8 }]}>
          Center your item and snap when ready.
        </Text>
      </View>
    );
  };

  // Generate tweet text for sharing
  const generateTweetText = (result) => {
    if (!result) return '';
    
    // Extract price from price_range (e.g., "$50-$100" -> get average)
    const getPriceEstimate = (priceRange) => {
      if (!priceRange) return 0;
      const match = priceRange.match(/\$(\d+)-\$(\d+)/);
      if (match) {
        const low = parseInt(match[1]);
        const high = parseInt(match[2]);
        return Math.round((low + high) / 2);
      }
      // Try single price format
      const singleMatch = priceRange.match(/\$(\d+)/);
      if (singleMatch) {
        return parseInt(singleMatch[1]);
      }
      return 0;
    };

    // Extract purchase price from description or use a placeholder
    const getPurchasePrice = () => {
      if (productDescription) {
        const priceMatch = productDescription.match(/\$(\d+(?:\.\d{2})?)/);
        if (priceMatch) {
          return parseFloat(priceMatch[1]);
        }
      }
      return null;
    };

    const brand = result.item_name?.split(' ')[0] || 'this';
    const itemType = result.item_name?.split(' ').slice(1).join(' ') || 'item';
    const resaleEstimate = getPriceEstimate(result.price_range);
    const pricePaid = getPurchasePrice();
    const refCode = user?.referralCode || ''; // TODO: Add referral code to user object
    
    let tweetText = `Just used @flippiAI to check ${brand} ${itemType}! `;
    
    if (resaleEstimate > 0) {
      tweetText += `Worth ~$${resaleEstimate} 👀 `;
      
      if (pricePaid) {
        const profit = resaleEstimate - pricePaid;
        if (profit > 0) {
          tweetText += `Paid $${pricePaid} = $${profit} flip 💸 `;
        }
      }
    }
    
    tweetText += `\n\nTry it: https://flippi.ai${refCode ? `?ref=${refCode}` : ''}`;
    
    return tweetText;
  };

  // Handle payment selection from upgrade modal
  const handlePaymentSelect = async (paymentType) => {
    try {
      const response = await fetch(`${API_URL}/api/payment/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-fingerprint': deviceFingerprint
        },
        body: JSON.stringify({ payment_type: paymentType }),
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.checkout_url) {
          // For now, just show the mock URL
          Alert.alert(
            'Payment System',
            `Stripe integration pending. Would redirect to: ${data.checkout_url}`,
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', 'Failed to start payment process');
    }
  };

  // Handle Luxe Photo processing
  const handleLuxePhoto = async () => {
    try {
      setIsLoading(true);
      console.log('[Luxe Photo] Starting processing...');

      // Get the current image
      const imageToProcess = image || imageBase64;
      if (!imageToProcess) {
        Alert.alert('No Image', 'Please select or capture an image first');
        return;
      }

      // Prepare form data
      const formData = new FormData();
      
      if (Platform.OS === 'web') {
        // Convert base64 to blob for web
        let blobData;
        if (imageToProcess.startsWith('data:')) {
          const base64 = imageToProcess.split(',')[1];
          const byteCharacters = atob(base64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          blobData = new Blob([byteArray], { type: 'image/jpeg' });
        } else {
          // Already a blob or file
          blobData = imageToProcess;
        }
        formData.append('image', blobData, 'photo.jpg');
      } else {
        // Mobile - use URI
        formData.append('image', {
          uri: imageToProcess,
          type: 'image/jpeg',
          name: 'photo.jpg'
        });
      }

      // Call the Luxe Photo API
      const response = await fetch(`${API_URL}/api/fotoflip/luxe-photo`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle specific HTTP error codes
        if (response.status === 403) {
          throw new Error('Luxe Photo is only available on the Blue environment');
        } else if (response.status === 500) {
          throw new Error(result.message || 'Server processing error. Our team has been notified.');
        } else if (response.status === 400) {
          throw new Error(result.error || 'Invalid image format. Please try a different photo.');
        }
        throw new Error(result.error || `Server error: ${response.status}`);
      }

      if (result.success && result.url) {
        console.log('[Luxe Photo] Processing successful:', result.url);
        
        // Download the processed image
        if (Platform.OS === 'web') {
          // Create download link
          const a = document.createElement('a');
          a.href = result.url;
          a.download = `flippi-luxe-photo-${Date.now()}.png`;
          a.target = '_blank';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          
          Alert.alert(
            'Luxe Photo Ready!',
            'Your enhanced photo has been downloaded. Check your Downloads folder.'
          );
        } else {
          // Mobile - open in browser
          Linking.openURL(result.url);
        }
      } else {
        // Handle server response errors
        const errorMessage = result.error || result.message || 'Unable to process your photo';
        throw new Error(errorMessage);
      }

    } catch (error) {
      console.error('[Luxe Photo] Error:', error);
      
      // Provide more specific error messages
      let errorTitle = 'Processing Error';
      let errorMessage = error.message || 'Unable to process your photo. Please try again.';
      
      // Check for specific error types
      if (error.message.includes('Python rembg not installed')) {
        errorMessage = 'Background removal service is currently unavailable. Please try again later.';
      } else if (error.message.includes('environment')) {
        errorTitle = 'Feature Unavailable';
      } else if (error.message.includes('Server processing error')) {
        errorMessage = 'The image processing service encountered an error. Please try again in a moment.';
      }
      
      Alert.alert(errorTitle, errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle share on X
  const handleShareOnX = () => {
    const tweetText = generateTweetText(analysisResult);
    const tweetUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    
    if (Platform.OS === 'web') {
      window.open(tweetUrl, '_blank', 'noopener,noreferrer');
    } else {
      Linking.openURL(tweetUrl);
    }
  };

  // Generate Instagram Story receipt image
  const generateInstagramStoryImage = async (result) => {
    if (!result) {
      console.log('[Instagram Story] No analysis result available');
      Alert.alert(
        'No Results Yet',
        'Please analyze an item first before sharing to Instagram Story.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Mobile implementation would go here
    if (Platform.OS !== 'web') {
      // For now, just generate and download the image
      // In the future, could use react-native-share to open Instagram directly
      Alert.alert(
        'Story Image Ready',
        'Image will be downloaded. Open Instagram and upload to your story!',
        [{ text: 'OK' }]
      );
      // Continue with image generation...
    }
    
    // Check if canvas is supported
    if (!document.createElement('canvas').getContext) {
      Alert.alert(
        'Not Supported',
        'Your browser doesn\'t support image generation. Please try a different browser.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      console.log('[Instagram Story] Starting image generation for:', result);
      
      // Create canvas for receipt
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Receipt styling
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      
      // Header
      ctx.font = 'bold 72px -apple-system, system-ui, sans-serif';
      ctx.fillText('flippi.ai', canvas.width / 2, 150);
      
      // Date
      ctx.font = '36px monospace';
      ctx.fillText(new Date().toLocaleString(), canvas.width / 2, 250);
      
      // Divider
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 10]);
      ctx.beginPath();
      ctx.moveTo(100, 300);
      ctx.lineTo(980, 300);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Item details
      ctx.font = '48px monospace';
      ctx.textAlign = 'left';
      let yPos = 400;
      
      // Item name
      ctx.fillText('ITEM:', 100, yPos);
      ctx.font = 'bold 48px monospace';
      const itemName = (result.item_name || 'Unknown Item').substring(0, 25);
      ctx.fillText(itemName, 300, yPos);
      yPos += 80;
      
      // Category
      ctx.font = '48px monospace';
      ctx.fillText('CATEGORY:', 100, yPos);
      ctx.fillText(result.category || 'N/A', 400, yPos);
      yPos += 80;
      
      // Condition
      ctx.fillText('CONDITION:', 100, yPos);
      ctx.fillText(result.condition || 'N/A', 450, yPos);
      yPos += 80;
      
      // Resale value
      ctx.fillText('RESALE VALUE:', 100, yPos);
      ctx.font = 'bold 56px monospace';
      ctx.fillText(result.price_range || 'N/A', 500, yPos);
      yPos += 100;
      
      // Real Score if available
      if (result.real_score !== undefined || result.authenticity_score !== undefined) {
        ctx.font = '48px monospace';
        ctx.fillText('REAL SCORE:', 100, yPos);
        ctx.font = 'bold 56px monospace';
        const score = result.real_score || result.authenticity_score;
        ctx.fillText(`${score}%`, 450, yPos);
        yPos += 100;
      }
      
      // Purchase price and profit calculation
      const purchasePrice = getPurchasePrice();
      if (purchasePrice) {
        // Another divider
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(100, yPos + 20);
        ctx.lineTo(980, yPos + 20);
        ctx.stroke();
        ctx.setLineDash([]);
        yPos += 80;
        
        ctx.font = '48px monospace';
        ctx.fillText('PURCHASE PRICE:', 100, yPos);
        ctx.fillText(`$${purchasePrice}`, 550, yPos);
        yPos += 80;
        
        // Calculate profit
        const getPriceEstimate = (priceRange) => {
          if (!priceRange) return 0;
          const match = priceRange.match(/\$(\d+)-\$(\d+)/);
          if (match) {
            const low = parseInt(match[1]);
            const high = parseInt(match[2]);
            return Math.round((low + high) / 2);
          }
          return 0;
        };
        
        const resaleEstimate = getPriceEstimate(result.price_range);
        if (resaleEstimate > 0) {
          const profit = resaleEstimate - purchasePrice;
          ctx.fillText('EST. PROFIT:', 100, yPos);
          ctx.font = 'bold 64px monospace';
          ctx.fillStyle = profit > 0 ? '#059669' : '#dc2626';
          ctx.fillText(`$${Math.abs(profit)}`, 450, yPos);
          ctx.fillStyle = '#000000';
          yPos += 100;
        }
      }
      
      // Footer
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(100, 1600);
      ctx.lineTo(980, 1600);
      ctx.stroke();
      
      ctx.font = '36px -apple-system, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Powered by flippi.ai', canvas.width / 2, 1700);
      
      if (refCode) {
        ctx.font = '32px monospace';
        ctx.fillText(`flippi.ai?ref=${refCode}`, canvas.width / 2, 1750);
      }
      
      ctx.font = 'italic 28px -apple-system, system-ui, sans-serif';
      ctx.fillText('*AI can make mistakes. Check important info.', canvas.width / 2, 1850);
      
      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Failed to convert canvas to blob');
        }
        
        console.log('[Instagram Story] Blob created, size:', blob.size);
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `flippi-story-${Date.now()}.png`;
        a.style.display = 'none';
        document.body.appendChild(a);
        
        // Force download
        a.click();
        
        // Cleanup
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
        
        Alert.alert(
          'Story Image Ready!',
          'Image downloaded! To share:\n\n1. Open Instagram\n2. Create a new Story\n3. Upload the downloaded image\n4. Share with your followers!',
          [{ text: 'Got it!' }]
        );
      }, 'image/png', 0.95);
    } catch (error) {
      console.error('Error generating Instagram story:', error);
      Alert.alert(
        'Error',
        'Failed to generate receipt image. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // Handle Instagram Story share
  const handleInstagramStoryShare = () => {
    console.log('[IG Story Share] Starting with:');
    console.log('  - analysisResult:', !!analysisResult);
    console.log('  - imageBase64:', !!imageBase64, imageBase64?.substring(0, 50));
    console.log('  - image:', !!image, image?.substring(0, 50));
    
    // Always prefer imageBase64 as it has the correct format after analysis
    const imageToUse = imageBase64 || image;
    
    setIsLoading(true);
    generateInstagramStoryImage(analysisResult, imageToUse).finally(() => {
      setIsLoading(false);
    });
  };

  // Helper function to generate valuation slug
  const generateValuationSlug = (result) => {
    const brand = (result.brand || '').toLowerCase().replace(/[^a-z0-9]/g, '-');
    const item = (result.item_name || 'item').toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30);
    const timestamp = Date.now().toString(36);
    return `${brand}-${item}-${timestamp}`.replace(/--+/g, '-').replace(/^-|-$/g, '');
  };

  // Helper function to draw QR placeholder
  const drawQRPlaceholder = (ctx, x, y, size) => {
    const moduleSize = size / 25;
    ctx.fillStyle = '#000000';
    
    // Draw finder patterns (corner squares)
    const drawFinderPattern = (px, py) => {
      // Outer square
      ctx.fillRect(px, py, 7 * moduleSize, 7 * moduleSize);
      // Inner white square
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(px + moduleSize, py + moduleSize, 5 * moduleSize, 5 * moduleSize);
      // Center black square
      ctx.fillStyle = '#000000';
      ctx.fillRect(px + 2 * moduleSize, py + 2 * moduleSize, 3 * moduleSize, 3 * moduleSize);
    };
    
    // Three corner patterns
    drawFinderPattern(x, y);
    drawFinderPattern(x + size - 7 * moduleSize, y);
    drawFinderPattern(x, y + size - 7 * moduleSize);
    
    // Timing patterns
    for (let i = 8; i < 17; i++) {
      if (i % 2 === 0) {
        ctx.fillRect(x + i * moduleSize, y + 6 * moduleSize, moduleSize, moduleSize);
        ctx.fillRect(x + 6 * moduleSize, y + i * moduleSize, moduleSize, moduleSize);
      }
    }
    
    // Data area (simplified pattern)
    for (let row = 8; row < 17; row++) {
      for (let col = 8; col < 17; col++) {
        if ((row + col) % 3 === 0) {
          ctx.fillRect(x + col * moduleSize, y + row * moduleSize, moduleSize, moduleSize);
        }
      }
    }
  };

  // Generate universal share image (square format)
  const generateShareImage = async (result, imageSource = null) => {
    if (!result) {
      console.log('[Share Image] No analysis result available');
      Alert.alert(
        'No Results Yet',
        'Please analyze an item first before downloading.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    console.log('[generateShareImage] Starting with:', {
      hasResult: !!result,
      hasImageSource: !!imageSource,
      imageSourceType: imageSource ? (imageSource.startsWith('data:') ? 'data URL' : 'other') : 'none',
      hasImageBase64State: !!imageBase64,
      hasImageState: !!image
    });
    
    // Only support web for now
    if (Platform.OS !== 'web') {
      Alert.alert(
        'Coming Soon',
        'Image download is coming soon for mobile. For now, take a screenshot.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Check if canvas is supported
    if (!document.createElement('canvas').getContext) {
      Alert.alert(
        'Not Supported',
        'Your browser doesn\'t support image generation. Please try a different browser.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      console.log('[Share Image] Starting image generation for:', result);
      console.log('[Share Image] Current image:', image ? 'Available' : 'Not available');
      
      // Create canvas for share image (square format)
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Flippi branding
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.font = 'bold 64px -apple-system, system-ui, sans-serif';
      ctx.fillText('flippi.ai', canvas.width / 2, 100);
      
      // Item image - Simplified approach
      const drawItemImage = async () => {
        const boxWidth = 800;
        const boxHeight = 810; // 75% of 1080px for Whatnot
        const boxX = 140;
        const boxY = 140;
        
        // Draw border around image area
        ctx.strokeStyle = '#e5e5e5';
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
        
        // Clear the area first
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        
        // Use the provided image source or fall back to state
        let imageSrc = imageSource || imageBase64 || image;
        
        if (!imageSrc) {
          console.error('[Share Image] No image source available');
          ctx.fillStyle = '#a0a0a0';
          ctx.font = '32px -apple-system, system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('No image available', canvas.width / 2, boxY + boxHeight/2);
          return;
        }
        
        // Ensure image has proper data URL format
        if (imageSrc && !imageSrc.startsWith('data:')) {
          // If it's just base64, add the prefix
          if (imageSrc.match(/^[A-Za-z0-9+/]+=*$/)) {
            console.log('[Share Image] Adding data URL prefix to base64 string');
            imageSrc = `data:image/jpeg;base64,${imageSrc}`;
          }
          // Check if it starts with /9j/ which is JPEG base64 signature
          else if (imageSrc.startsWith('/9j/')) {
            console.log('[Share Image] Detected JPEG base64 without prefix, adding it');
            imageSrc = `data:image/jpeg;base64,${imageSrc}`;
          }
          // Check if it starts with iVBOR which is PNG base64 signature
          else if (imageSrc.startsWith('iVBOR')) {
            console.log('[Share Image] Detected PNG base64 without prefix, adding it');
            imageSrc = `data:image/png;base64,${imageSrc}`;
          }
          // Otherwise assume it's a URI that needs to be converted
          else if (imageSrc.startsWith('file://') || imageSrc.startsWith('http')) {
            console.warn('[Share Image] Non-data URL detected:', imageSrc.substring(0, 50));
            // For now, show placeholder as we can't convert URIs in browser
            ctx.fillStyle = '#f5f5f5';
            ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
            ctx.fillStyle = '#a0a0a0';
            ctx.font = '24px -apple-system, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Image preview unavailable', canvas.width / 2, boxY + boxHeight/2 - 20);
            ctx.font = '18px -apple-system, system-ui, sans-serif';
            ctx.fillText('(Original image was a file URI)', canvas.width / 2, boxY + boxHeight/2 + 10);
            return;
          }
        }
        
        // Create image and set up handlers
        console.log('[Share Image] Creating image element using document.createElement');
        const img = document.createElement('img');
        img.crossOrigin = 'anonymous'; // Just in case
        
        // Create promise to handle async loading with timeout
        await new Promise((resolve) => {
          let imageLoaded = false;
          
          // Set a timeout to prevent hanging
          const timeout = setTimeout(() => {
            if (!imageLoaded) {
              console.error('[Share Image] Image load timeout after 5 seconds');
              
              // Draw timeout placeholder
              ctx.fillStyle = '#f5f5f5';
              ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
              ctx.fillStyle = '#a0a0a0';
              ctx.font = '28px -apple-system, system-ui, sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText('Image load timeout', canvas.width / 2, boxY + boxHeight/2 - 15);
              ctx.font = '20px -apple-system, system-ui, sans-serif';
              ctx.fillText('Continuing without image', canvas.width / 2, boxY + boxHeight/2 + 15);
              resolve();
            }
          }, 5000);
          
          img.onload = () => {
            imageLoaded = true;
            clearTimeout(timeout);
            console.log('[Share Image] Image loaded successfully:', img.width, 'x', img.height);
            
            // Calculate scaling to fit within box
            const scale = Math.min(boxWidth / img.width, boxHeight / img.height) * 0.9;
            const width = img.width * scale;
            const height = img.height * scale;
            const x = boxX + (boxWidth - width) / 2;
            const y = boxY + (boxHeight - height) / 2;
            
            // Draw the image
            ctx.drawImage(img, x, y, width, height);
            resolve();
          };
          
          img.onerror = () => {
            imageLoaded = true;
            clearTimeout(timeout);
            console.error('[Share Image] Failed to load image for share download');
            console.error('[Share Image] Attempted source:', imageSrc.substring(0, 100));
            
            // Draw error placeholder
            ctx.fillStyle = '#f5f5f5';
            ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
            ctx.fillStyle = '#a0a0a0';
            ctx.font = '32px -apple-system, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Image could not be loaded', canvas.width / 2, boxY + boxHeight/2);
            resolve();
          };
          
          // Set the source to trigger load
          console.log('[Share Image] Loading image from:', imageSrc.substring(0, 100) + '...');
          console.log('[Share Image] Image format check:');
          console.log('  - Starts with data:?', imageSrc.startsWith('data:'));
          console.log('  - Has base64 marker?', imageSrc.includes('base64,'));
          console.log('  - Length:', imageSrc.length);
          
          img.src = imageSrc;
        });
      };
      
      await drawItemImage();
      
      // Reset text alignment for subsequent text
      ctx.textAlign = 'center';
      
      // Title (moved 0.5 inch lower = ~48px at 96dpi, then another 0.5 inch for Whatnot)
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 36px -apple-system, system-ui, sans-serif';
      const itemName = result.item_name || 'Unknown Item';
      ctx.fillText(itemName, canvas.width / 2, 906); // 810 + 48 + 48 (moved additional 0.5" for Whatnot)
      
      // Brand (if available)
      if (result.brand) {
        ctx.font = '28px -apple-system, system-ui, sans-serif';
        ctx.fillStyle = '#666666';
        ctx.fillText(result.brand, canvas.width / 2, 936); // Adjusted for title move
      }
      
      // Market Comps with green price band (condensed for space)
      ctx.fillStyle = '#059669';
      ctx.fillRect(0, 950, canvas.width, 45); // Reduced height from 60 to 45
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 36px -apple-system, system-ui, sans-serif'; // Reduced from 42px
      ctx.fillText(result.price_range || '$0-$0', canvas.width / 2, 980);
      
      // Purchase price and profit if available
      const getPurchasePrice = () => {
        if (productDescription) {
          const priceMatch = productDescription.match(/\$(\d+(?:\.\d{2})?)/);
          if (priceMatch) {
            return parseFloat(priceMatch[1]);
          }
        }
        return null;
      };
      
      // Sellability + Authenticity row (condensed)
      let yPosition = 1005; // Moved up from 990
      ctx.font = '20px -apple-system, system-ui, sans-serif'; // Reduced from 24px
      
      // Sellability with icon
      ctx.fillStyle = '#333333';
      const sellabilityText = `Sellability: ${result.trending_score || 0}/100`;
      ctx.fillText(sellabilityText, canvas.width / 2 - 200, yPosition);
      
      // Authenticity with icon
      const realScoreText = `Authenticity: ${result.real_score || 'Unknown'}`;
      ctx.fillText(realScoreText, canvas.width / 2 + 200, yPosition);
      
      // Market Info (condensed)
      yPosition += 25; // Reduced from 35
      ctx.font = '18px -apple-system, system-ui, sans-serif'; // Reduced from 20px
      ctx.fillStyle = '#666666';
      if (result.recommended_platform) {
        ctx.fillText(`Best Platform: ${result.recommended_platform}`, canvas.width / 2, yPosition);
      }
      
      // Eco Info (condensed)
      yPosition += 20; // Reduced from 30
      if (result.environmental_tag) {
        ctx.fillStyle = '#059669';
        ctx.font = '16px -apple-system, system-ui, sans-serif';
        ctx.fillText(result.environmental_tag, canvas.width / 2, yPosition);
      }
      
      // Add prominent CTA at bottom
      ctx.fillStyle = '#1a3a52';
      ctx.font = 'bold 24px -apple-system, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Get 20 free images at flippi.ai', canvas.width / 2, canvas.height - 40);
      
      // Footer
      ctx.fillStyle = '#666666';
      ctx.font = '28px -apple-system, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Never Over Pay • Know the price. Own the profit.', canvas.width / 2, 960);
      
      if (user?.referralCode) {
        ctx.font = '24px monospace';
        ctx.fillText(`flippi.ai?ref=${user.referralCode}`, canvas.width / 2, 1000);
      }
      
      // Convert to data URL for immediate download
      console.log('[Share Image] Converting canvas for download...');
      
      try {
        // Use toDataURL for synchronous download
        const dataUrl = canvas.toDataURL('image/png');
        
        // Create download link
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `flippi-share-image-${Date.now()}.png`;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        
        // Small delay to ensure element is in DOM
        setTimeout(() => {
          a.click();
          setTimeout(() => {
            document.body.removeChild(a);
          }, 100);
        }, 10);
        
        console.log('[Share Image] Download triggered');
        
        // Show success message
        Alert.alert(
          'Image Ready!',
          'Check your Downloads folder for the share image.',
          [{ text: 'OK' }]
        );
      } catch (downloadError) {
        console.error('[Share Image] Download failed:', downloadError);
        
        // Fallback: Use blob method
        canvas.toBlob((blob) => {
          try {
            if (!blob) {
              throw new Error('Failed to create image');
            }
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `flippi-share-image-${Date.now()}.png`;
            
            // Try to trigger download
            document.body.appendChild(a);
            a.click();
            
            setTimeout(() => {
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }, 100);
          } catch (blobError) {
            console.error('[Share Image] Blob download failed:', blobError);
            
            // Last resort: Open image in new tab
            const newTab = window.open();
            if (newTab) {
              const dataUrl = canvas.toDataURL('image/png');
              newTab.document.write(`<img src="${dataUrl}" alt="Flippi Share Image" />`);
              Alert.alert(
                'Image opened in new tab',
                'Right-click to save the image',
                [{ text: 'OK' }]
              );
            }
          }
        }, 'image/png', 0.95);
      }
    } catch (error) {
      console.error('[Share Image] Error generating image:', error);
      console.error('[Share Image] Error stack:', error.stack);
      Alert.alert(
        'Download Failed',
        'Unable to download image. Please try again or use a screenshot instead.',
        [{ text: 'OK' }]
      );
    }
    
    console.log('[Share Image] generateShareImage function completed');
  };

  // Handle universal share image download
  const handleDownloadShareImage = () => {
    try {
      console.log('[Download Share] Starting download - v2');
      
      // Check what we have
      const hasAnalysisResult = !!analysisResult;
      const hasImageBase64 = !!imageBase64;
      const hasImage = !!image;
      
      console.log('[Download Share] Data available:', {
        hasAnalysisResult,
        hasImageBase64,
        hasImage
      });
      
      // Always prefer imageBase64 as it has the correct format after analysis
      const imageToUse = imageBase64 || image;
      
      if (!imageToUse) {
        Alert.alert(
          'No Image Available',
          'Please analyze an image first before downloading.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      if (!analysisResult) {
        Alert.alert(
          'No Analysis Available',
          'Please analyze an image first before downloading.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      setIsLoading(true);
      generateShareImage(analysisResult, imageToUse).finally(() => {
        setIsLoading(false);
      });
    } catch (error) {
      console.error('[Download Share] Error:', error);
      Alert.alert(
        'Download Error',
        'An error occurred while preparing the download. Please try again.',
        [{ text: 'OK' }]
      );
    }
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
      await AuthService.exit();
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
        <FlippiLogo size="large" style={{ marginBottom: 8 }} />
        <ActivityIndicator size="large" color={brandColors.primary} />
        <Text style={{ marginTop: 20, fontSize: 16, color: brandColors.textSecondary }}>
          Loading flippi.ai
        </Text>
        <TouchableOpacity 
          onPress={() => {
            console.log('[Auth] Force clearing auth state');
            setAuthLoading(false);
            setIsAuthenticated(false);
          }}
          style={{ marginTop: 40, padding: 10 }}
        >
          <Text style={{ color: brandColors.textSecondary, fontSize: 12 }}>
            Stuck? Click here to reset
          </Text>
        </TouchableOpacity>
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
      style={[styles.container, { 
        backgroundColor: isAuthenticated ? '#fafafa' : brandColors.background 
      }]}
      contentContainerStyle={styles.contentContainer}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Environment Banner - Only show in non-production */}
      {Platform.OS === 'web' && window.location.hostname === 'blue.flippi.ai' && (
        <View style={styles.environmentBanner}>
          <Text style={styles.environmentText}>SIMPLE DEPLOY TEST - {new Date().toISOString()}</Text>
        </View>
      )}
      {Platform.OS === 'web' && window.location.hostname === 'green.flippi.ai' && (
        <View style={styles.environmentBannerStaging}>
          <Text style={styles.environmentText}>STAGING ENVIRONMENT</Text>
        </View>
      )}
      
      {/* You section - Exit button only - Outside content for better positioning */}
      {Platform.OS === 'web' && user && (
        <View style={styles.userSection}>
          {/* Show admin buttons for specific users */}
          {(user.email === 'john@flippi.ai' || user.email === 'tarahusband@gmail.com' || user.email === 'teamflippi@gmail.com' || user.email === 'tara@edgy.co' || user.email === 'john@husband.llc') && (
            <>
              <TouchableOpacity onPress={() => setShowAdminDashboard(true)} style={styles.adminButton}>
                <Text style={styles.adminText}>Admin</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowGrowthDashboard(true)} style={styles.adminButton}>
                <Text style={styles.adminText}>Growth</Text>
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity onPress={handleExit} style={styles.exitButton}>
            <Text style={styles.exitText}>Exit</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <PageContainer>
        <View style={[styles.content, isAuthenticated && styles.contentLoggedIn]}>
          
          <FlippiLogo 
            size={isAuthenticated ? "small" : "large"} 
            responsive={true} 
            style={isAuthenticated ? { marginBottom: 8 } : {}}
          />
          {!isAuthenticated && (
            <>
              <Text style={[styles.title, { color: brandColors.text }]}>
                Never Over Pay
              </Text>
              <Text style={styles.subtitle}>
                Know the price. Own the profit.
              </Text>
            </>
          )}
          {isAuthenticated && !image && !analysisResult && renderEncouragementMessage()}
        
        <View style={[
          styles.uploadContainer,
          isDragOver && styles.dragOver
        ]}>
          {/* Text input only visible when no image */}
          {!image && (
            <TextInput
              style={[styles.descriptionInput, { 
                backgroundColor: '#FFFFFF',
                color: brandColors.text,
                borderColor: brandColors.border,
                marginBottom: 20,
                boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)'
              }]}
              placeholder="Brand, source, or serial number?"
              placeholderTextColor={brandColors.disabledText}
              value={productDescription}
              onChangeText={setProductDescription}
              multiline
              numberOfLines={3}
            />
          )}
          
        {console.log('[DEBUG] Current image state:', image ? 'Image exists' : 'No image')}
        {!image ? (
            <>
              {hasCamera && (
                <BrandButton
                  title="Take Photo"
                  onPress={takePhoto}
                  style={[styles.actionButton, styles.primaryActionButton]}
                  variant="primary"
                  icon={<Feather name="camera" size={20} color="#FFFFFF" />}
                />
              )}
              
              <BrandButton
                title="Upload Photo"
                onPress={pickImage}
                style={styles.actionButton}
                variant="outline"
                icon={<Feather name="upload" size={20} color={brandColors.text} />}
              />
              
              {Platform.OS === 'web' && (
                <>
                  <View style={[styles.dropZone, isDragOver && styles.dropZoneActive]}>
                    <Text style={[styles.dropZoneText, { color: brandColors.textSecondary }]}>
                      {isDragOver ? 'Drop image here' : 'Or drag and drop an image here'}
                    </Text>
                  </View>
                </>
              )}
            </>
          ) : (
            <View style={styles.resultContainer}>
              {image ? (
                <View style={styles.imagePreviewContainer}>
                  {console.log('[DEBUG] Rendering image with URI length:', image.length)}
                  <Image 
                    source={{ uri: image }} 
                    style={styles.imagePreview}
                    onError={(e) => console.error('[DEBUG] Image load error:', e.nativeEvent.error)}
                    onLoad={() => console.log('[DEBUG] Image loaded successfully')}
                  />
                </View>
              ) : (
                <Text style={{ color: brandColors.textSecondary, marginBottom: 8 }}>No image uploaded</Text>
              )}
              
              {!analysisResult && !isLoading && (
                <>
                  <TextInput
                    style={[styles.descriptionInput, { 
                      backgroundColor: brandColors.surface,
                      color: brandColors.text,
                      borderColor: brandColors.border || '#ddd',
                      marginBottom: 8,
                      marginTop: 0
                    }]}
                    placeholder="Brand, source, or serial number?"
                    placeholderTextColor={brandColors.textSecondary}
                    value={productDescription}
                    onChangeText={setProductDescription}
                    multiline
                    numberOfLines={3}
                  />
                  <View>
                    {flipStatus && !flipStatus.is_pro && (
                      <Text style={styles.flipCountText}>
                        {flipStatus.flips_remaining === 0 
                          ? 'No free flips left' 
                          : `${flipStatus.flips_remaining} free flip${flipStatus.flips_remaining === 1 ? '' : 's'} remaining`}
                      </Text>
                    )}
                    <BrandButton
                      title="Go"
                      onPress={analyzeImage}
                      style={styles.goButton}
                      variant="accent"
                      isHighImpact={true}
                    />
                  </View>
                </>
              )}
            
            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={brandColors.primary} />
                <Text style={[styles.loadingText, { color: brandColors.text }]}>
                  Analyzing image
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
                style={[styles.analysisResult, { backgroundColor: '#FFFFFF' }]}>
                <Text style={[styles.resultTitle, { color: brandColors.text }]}>Analysis Results</Text>
                
                {/* Top price container with Buy At, Estimated Resale Value, and Item */}
                <View style={[styles.topPriceContainer, { backgroundColor: '#F9FAFB' }]}>
                  <View style={styles.priceRow}>
                    {analysisResult.buy_price && (
                      <View style={styles.priceColumn}>
                        <Text style={styles.priceLabel}>Buy At</Text>
                        <Text style={[styles.priceValueLarge, styles.numericalEmphasis]}>
                          {analysisResult.buy_price}
                        </Text>
                      </View>
                    )}
                    
                    {analysisResult.price_range && (
                      <View style={styles.priceColumn}>
                        <Text style={styles.priceLabel}>Estimated Resale Value</Text>
                        <Text style={[styles.priceValueLarge, styles.numericalEmphasis]}>
                          {analysisResult.price_range}
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  {/* Item description in same box */}
                  <View style={styles.itemInPriceBox}>
                    <Text style={styles.itemLabel}>Item</Text>
                    <Text style={styles.itemValue}>{analysisResult.item_name}</Text>
                  </View>
                </View>
                
                {/* Check if potentially dupe and show friendly warning */}
                {(() => {
                  const score = analysisResult.real_score || analysisResult.authenticity_score || 0;
                  const description = productDescription?.toLowerCase() || '';
                  const insights = analysisResult.market_insights?.toLowerCase() || '';
                  const penalties = analysisResult.score_penalties?.toLowerCase() || '';
                  
                  const isPotentialDupe = 
                    score <= 40 ||
                    description.includes('fake') ||
                    description.includes('replica') ||
                    description.includes('inspired') ||
                    description.includes('dupe') ||
                    insights.includes('replica') ||
                    penalties.includes('replica') ||
                    analysisResult.platform_recommendation === 'Craft Fair' ||
                    analysisResult.platform_recommendation === 'Personal Use';
                  
                  if (isPotentialDupe) {
                    return (
                      <View style={styles.dupeAlert}>
                        <View style={styles.dupeAlertContent}>
                          <Feather name="alert-triangle" size={16} color="#EAB308" style={{ marginRight: 8 }} />
                          <Text style={styles.dupeAlertText}>
                            This item may be a dupe. Check brand details before buying or listing.
                          </Text>
                        </View>
                      </View>
                    );
                  }
                  return null;
                })()}
                
                {/* PRIMARY INFO - Always show all data */}
                <View style={[styles.primaryInfoSection, { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, marginVertical: 10 }]}>
                  
                  {(analysisResult.real_score !== undefined || analysisResult.authenticity_score !== undefined) && (
                    <View style={styles.resultItem}>
                      <View style={styles.labelWithIcon}>
                        <Text style={[styles.resultLabel]}>Real Score</Text>
                        <TouchableOpacity
                          onPress={() => setShowMissionModal(true)}
                          accessibilityLabel="Learn about Real Score"
                          accessibilityRole="button"
                          style={styles.infoIconButton}
                        >
                          <Feather name="info" size={16} color={brandColors.textSecondary} />
                        </TouchableOpacity>
                      </View>
                      <View>
                        <Text style={[styles.resultValue, styles.realScoreEmphasis, { fontSize: 20 }]}>
                          {analysisResult.real_score || analysisResult.authenticity_score}%
                        </Text>
                        <Text style={[styles.realScoreExplanation]}>
                          {(() => {
                            const score = analysisResult.real_score || analysisResult.authenticity_score;
                            let explanation = "";
                            let details = "";
                            
                            if (score >= 80) {
                              explanation = "Strong authenticity signals detected. Clear branding and quality markers.";
                              details = "Logo placement, stitching, and materials appear consistent with authentic pieces.";
                            } else if (score >= 60) {
                              explanation = "Good visual indicators. Brand elements appear consistent.";
                              details = "Most authenticity markers present, but verify interior tags and serial numbers.";
                            } else if (score >= 40) {
                              explanation = "Mixed signals detected. Check brand details and authentication carefully.";
                              // Check for specific penalties mentioned
                              if (analysisResult.score_penalties) {
                                const penalties = analysisResult.score_penalties.toLowerCase();
                                if (penalties.includes("colorway")) {
                                  details = "Unusual color combination not typical for this brand. Research this specific style.";
                                } else if (penalties.includes("logo")) {
                                  details = "Logo density or placement differs from standard. Compare with official images.";
                                } else if (penalties.includes("single photo")) {
                                  details = "Limited view provided. Request photos of tags, serial numbers, and interior.";
                                } else {
                                  details = "Some elements don't match typical authentic patterns. Get professional authentication.";
                                }
                              } else {
                                details = "Inconsistent quality markers detected. Compare carefully with authentic examples.";
                              }
                            } else {
                              explanation = "Multiple red flags detected. Verify authenticity before purchasing.";
                              // Check market insights for specific issues
                              if (analysisResult.market_insights && analysisResult.market_insights.toLowerCase().includes("replica")) {
                                details = "Design elements strongly suggest replica. Proceed with extreme caution.";
                              } else if (analysisResult.score_penalties && analysisResult.score_penalties.includes("source")) {
                                details = "Source marketplace known for replicas. Request proof of authenticity.";
                              } else {
                                details = "Multiple authenticity concerns including branding, construction, or materials.";
                              }
                            }
                            
                            return `${explanation} ${details}`;
                          })()}
                        </Text>
                      </View>
                    </View>
                  )}
                  
                </View>
                
                {/* TOGGLE BUTTON */}
                <TouchableOpacity
                  style={[styles.viewMoreButton, { 
                    backgroundColor: 'transparent',
                    borderWidth: 1,
                    borderColor: brandColors.border,
                  }]}
                  onPress={() => setShowMoreDetails(!showMoreDetails)}
                >
                  <Text style={[styles.viewMoreText, { color: brandColors.text }]}>
                    {showMoreDetails ? '− Hide Details' : '+ View Details'}
                  </Text>
                </TouchableOpacity>
                
                {/* SECONDARY INFO - Hidden by default */}
                {showMoreDetails && (
                  <View style={styles.secondaryInfoSection}>
                    <View style={styles.resultItem}>
                      <Text style={[styles.resultLabel, { color: brandColors.textSecondary }]}>Condition</Text>
                      <Text style={[styles.resultValue, { color: brandColors.text }]}>{analysisResult.condition}</Text>
                    </View>
                    
                    <View style={styles.resultItem}>
                      <Text style={[styles.resultLabel, { color: brandColors.textSecondary }]}>Style Tier</Text>
                      <Text style={[styles.resultValue, { 
                        color: brandColors.text,
                        fontWeight: typography.weights.semibold,
                        textTransform: 'capitalize'
                      }]}>
                        {analysisResult.style_tier}
                      </Text>
                    </View>
                    
                    {analysisResult.recommended_platform && (
                      <View style={styles.resultItem}>
                        <Text style={[styles.resultLabel, { color: brandColors.textSecondary }]}>Best Platforms</Text>
                        <Text style={[styles.resultValue, { color: brandColors.text }]}>
                          {(() => {
                            const platforms = [];
                            if (analysisResult.recommended_live_platform && analysisResult.recommended_live_platform !== 'uknown') {
                              platforms.push(analysisResult.recommended_live_platform === 'uknown' ? 'Personal Use' : analysisResult.recommended_live_platform);
                            }
                            if (analysisResult.recommended_platform && analysisResult.recommended_platform !== 'uknown') {
                              platforms.push(analysisResult.recommended_platform === 'uknown' ? 'Craft Fair' : analysisResult.recommended_platform);
                            }
                            return platforms.join(', ') || 'Craft Fair, Personal Use';
                          })()}
                        </Text>
                      </View>
                    )}
                    
                
                {analysisResult.trending_score !== undefined && (
                  <View style={styles.resultItem}>
                    <Text style={[styles.resultLabel, { color: brandColors.textSecondary }]}>Sellability</Text>
                    <Text style={[styles.resultValue, { color: brandColors.text }]}>
                      {analysisResult.trending_score}/100 {(() => {
                        const score = parseInt(analysisResult.trending_score);
                        if (score >= 80) return '▲▲▲'; // Three up arrows for hot
                        if (score >= 50) return '▲▲';   // Two up arrows for warm
                        return '▲';                      // One up arrow for cool
                      })()} - {analysisResult.trending_label || 'N/A'}
                    </Text>
                  </View>
                )}
                
                {analysisResult.legacy_brand && (
                  <View style={[styles.legacyBrandBadge, { backgroundColor: brandColors.border }]}>
                    <Text style={[styles.legacyBrandText, { color: brandColors.text }]}>
                      ⭐ Legacy Brand — Premium Hold
                    </Text>
                  </View>
                )}
                
                {analysisResult.price_adjusted && (
                  <Text style={[styles.priceAdjustmentNote, { color: brandColors.textSecondary }]}>
                    {analysisResult.adjustment_reason}
                  </Text>
                )}
                
                {analysisResult.market_insights && (
                  <View style={styles.resultItem}>
                    <Text style={[styles.resultLabel, { color: brandColors.textSecondary }]}>Market</Text>
                    <Text style={[styles.resultValue, { color: brandColors.text }]}>
                      {analysisResult.market_insights.replace(/Note:.*?Low authenticity.*?verify carefully\.?\s*/gi, '').trim()}
                    </Text>
                  </View>
                )}
                
                {analysisResult.selling_tips && (
                  <View style={styles.resultItem}>
                    <Text style={[styles.resultLabel, { color: brandColors.textSecondary }]}>Selling Tips</Text>
                    <Text style={[styles.resultValue, { color: brandColors.text, lineHeight: 22 }]}>
                      {analysisResult.selling_tips.replace(/Note:.*?Low authenticity.*?verify carefully\.?\s*/gi, '').trim()}
                    </Text>
                  </View>
                )}
                
                {analysisResult.environmental_tag && (
                  <View style={[styles.environmentalContainer, { backgroundColor: '#E8F5E9' }]}>
                    <View style={styles.environmentalContent}>
                      <Text style={[styles.environmentalTag, { color: '#2E7D32' }]}>
                        {analysisResult.environmental_tag}
                      </Text>
                      <TouchableOpacity
                        onPress={() => setShowMissionModal(true)}
                        accessibilityLabel="Learn about our mission"
                        accessibilityRole="button"
                        style={styles.missionLink}
                      >
                        <Feather name="info" size={14} color="#2E7D32" style={{ opacity: 0.8 }} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                  </View>
                )}
              </View>
            ) : (!isLoading && !analysisResult && image) ? (
              <Text style={{ color: brandColors.text, marginTop: 20 }}>No results yet. Press Go to analyze.</Text>
            ) : null}
            
            
            {analysisResult && showFeedback && (
              <FeedbackSystem
                scanData={analysisResult}
                userDescription={productDescription}
                imageData={imageBase64}
                onComplete={() => setShowFeedback(false)}
              />
            )}
            
            {analysisResult && (
              <View style={styles.postAnalysisActions}>
                {/* Luxe Photo Button - Blue Environment Only */}
                {Platform.OS === 'web' && window.location.hostname === 'blue.flippi.ai' && (
                  <BrandButton
                    title="Luxe Photo"
                    onPress={handleLuxePhoto}
                    style={[styles.shareButton, { backgroundColor: '#FAF6F1', borderWidth: 1, borderColor: '#E5E5E5' }]}
                    variant="primary"
                    icon={<Feather name="star" size={20} color="#333333" />}
                    textStyle={{ color: '#333333' }}
                    disabled={isLoading || !image}
                  />
                )}
                <BrandButton
                  title="Share on X"
                  onPress={handleShareOnX}
                  style={[styles.shareButton, { backgroundColor: '#18181b' }]}
                  variant="primary"
                  icon={<Feather name="share-2" size={20} color="#FFFFFF" />}
                />
                {Platform.OS !== 'web' && (
                  <>
                    <BrandButton
                      title="Share to Instagram Story"
                      onPress={handleInstagramStoryShare}
                      style={[styles.shareButton, { backgroundColor: '#E1306C' }]}
                      variant="primary"
                      disabled={isLoading}
                      icon={<Feather name="camera" size={20} color="#FFFFFF" />}
                    />
                  </>
                )}
                <BrandButton
                  title="Scan Another Item"
                  onPress={resetApp}
                  style={[styles.resetButton, { backgroundColor: brandColors.accent }]}
                  variant="primary"
                />
              </View>
            )}
            </View>
          )}
        </View>
      </View>
      </PageContainer>
      
      {/* Legal Footer */}
      <View style={styles.legalFooter}>
        <View style={styles.footerLinks}>
          <TouchableOpacity
            onPress={() => setShowPricingPage(true)}
            style={styles.footerLink}
          >
            <Text style={styles.footerLinkText}>Pricing</Text>
          </TouchableOpacity>
          <Text style={styles.footerDivider}>•</Text>
          <TouchableOpacity
            onPress={() => setShowMissionModal(true)}
            style={styles.footerLink}
          >
            <Text style={styles.footerLinkText}>Mission</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.legalText, { marginBottom: 4 }]}>
          ai makes mistakes. check important info
        </Text>
        <Text style={styles.legalText}>
          Flippi™ and Flippi.ai™ are trademarks of Boca Belle. All rights reserved.
        </Text>
      </View>
      
      <MissionModal 
        visible={showMissionModal} 
        onClose={() => setShowMissionModal(false)} 
      />
      
      <AdminDashboard
        isVisible={showAdminDashboard}
        onClose={() => setShowAdminDashboard(false)}
      />
      
      <GrowthDashboard
        isVisible={showGrowthDashboard}
        onClose={() => setShowGrowthDashboard(false)}
      />
      
      <PricingModal
        visible={showPricingPage}
        onClose={() => setShowPricingPage(false)}
        onSelectPlan={handlePaymentSelect}
      />
      
      <UpgradeModal
        isVisible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onSelectPayment={handlePaymentSelect}
        onLearnMore={() => {
          setShowUpgradeModal(false);
          setShowPricingPage(true);
        }}
        currentFlipCount={flipStatus?.flips_used || 0}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%', // Ensure full width
    backgroundColor: brandColors.background, // Ensure white background
  },
  contentContainer: {
    flexGrow: 1,
    alignItems: 'center', // Center the content column horizontally
    justifyContent: 'flex-start', // Start from top, not center
    paddingTop: 0, // No top padding
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
    fontWeight: typography.weights.bold,
    letterSpacing: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    padding: isMobile ? 16 : 20, // Restore proper padding
    paddingTop: isMobile ? 40 : 60, // Restore top padding for proper spacing
  },
  contentLoggedIn: {
    paddingTop: isMobile ? 16 : 20, // Proper spacing when logged in
  },
  title: {
    fontSize: isMobile ? 24 : 28,
    fontWeight: typography.weights.bold,
    fontFamily: typography.bodyFont,
    color: brandColors.text,
    marginTop: 20,
    marginBottom: 12,
    lineHeight: isMobile ? 28.8 : 33.6, // 1.2 line height
    textAlign: 'center',
  },
  subtitle: {
    fontSize: isMobile ? 16 : 18,
    fontWeight: typography.weights.regular,
    fontFamily: typography.bodyFont,
    color: brandColors.aiGray, // Same gray as .ai
    marginBottom: 8,
    textAlign: 'center',
    maxWidth: isMobile ? '100%' : '80%',
    alignSelf: 'center',
  },
  uploadContainer: {
    flex: 1, // Allow container to grow
    width: '100%', // Full width within PageContainer
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20,
    padding: 20,
  },
  resultContainer: {
    width: '100%',
    paddingHorizontal: 16, // px-4
    paddingTop: 16, // pt-4
    backgroundColor: brandColors.background, // Ensure white background
  },
  actionButton: {
    marginVertical: 8,
    width: '100%',
    maxWidth: 400, // Prevent buttons from being too wide on desktop
  },
  primaryActionButton: {
    // Warmer styling for primary actions
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeText: {
    fontSize: 14,
    fontWeight: typography.weights.regular,
    color: brandColors.textSecondary,
    textAlign: 'center',
  },
  welcomeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  helperText: {
    fontSize: 13,
    color: brandColors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  dropZone: {
    width: '100%',
    minHeight: 150,
    borderWidth: 2,
    borderColor: brandColors.border,
    borderStyle: 'dashed',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    padding: 20,
    // Shadow removed for Chrome compatibility
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
  imagePreviewContainer: {
    width: '100%',
    backgroundColor: 'transparent', // No background
    marginBottom: 12, // mb-3
  },
  imagePreview: {
    width: '100%',
    height: 300, // Fixed height to ensure visibility
    minHeight: 200, // Minimum height
    resizeMode: 'contain',
    borderRadius: 8, // rounded-md
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
    width: isMobile ? '100%' : '80%', // Responsive width based on screen size
    maxWidth: isMobile ? '100%' : 800, // Full width on mobile, constrained on desktop
    padding: isMobile ? 16 : 24, // More padding for better touch targets
    paddingVertical: isMobile ? 20 : 28, // Extra vertical padding
    borderRadius: isMobile ? 0 : 14, // More rounded corners
    marginBottom: isMobile ? 0 : 20, // No margin on mobile
    alignSelf: 'center',
    backgroundColor: brandColors.surface,
    // Shadow removed for Chrome compatibility
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: typography.weights.bold,
    marginBottom: 15,
    textAlign: 'center',
  },
  resultItem: {
    marginBottom: 12,
    width: '100%',
    ...(isDesktop && {
      width: 'auto',
      flex: '1 1 45%',
      minWidth: 200,
    }),
  },
  resultLabel: {
    fontSize: 16,
    fontFamily: typography.bodyFont,
    fontWeight: typography.weights.regular,
    color: brandColors.textSecondary,
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 18,
    fontFamily: typography.bodyFont,
    fontWeight: typography.weights.medium,
    color: brandColors.text,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  priceValue: {
    fontSize: 20,
    fontWeight: typography.weights.bold,
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
    fontWeight: typography.weights.bold,
  },
  legacyBrandBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 5,
  },
  legacyBrandText: {
    fontSize: 14,
    fontWeight: typography.weights.semiBold,
  },
  priceAdjustmentNote: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 10,
  },
  styleTierBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20, // More rounded for badge look
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  styleTierBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: typography.weights.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
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
  postAnalysisActions: {
    width: '100%',
    marginTop: 20,
    gap: 12,
  },
  shareButton: {
    marginBottom: 8,
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
    padding: 16,
    borderWidth: 1,
    borderRadius: 14,
    fontSize: 16,
    marginBottom: 15,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  goButton: {
    width: '100%',
  },
  flipCountText: {
    textAlign: 'center',
    color: brandColors.textSecondary,
    fontSize: 14,
    marginBottom: 8,
  },
  // User section styles
  userSection: {
    position: 'absolute',
    top: isMobile ? 20 : 40, // Responsive top spacing
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
    backgroundColor: 'transparent',
    borderRadius: 8,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: brandColors.border,
  },
  exitText: {
    fontSize: 12,
    color: brandColors.text,
    fontWeight: typography.weights.medium,
  },
  pricingButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  pricingText: {
    fontSize: 12,
    color: brandColors.primary,
    fontWeight: typography.weights.medium,
  },
  adminButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: brandColors.primary,
    borderRadius: 8,
    marginRight: 8,
  },
  adminText: {
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
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  footerLink: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  footerLinkText: {
    fontSize: 14,
    color: brandColors.primary,
    fontFamily: typography.fontFamily,
    textDecorationLine: 'underline',
  },
  footerDivider: {
    fontSize: 14,
    color: brandColors.textSecondary,
    marginHorizontal: 8,
  },
  legalText: {
    fontSize: 12,
    color: brandColors.textSecondary,
    fontFamily: typography.fontFamily,
    textAlign: 'center',
    fontWeight: typography.weights.medium,
    textDecorationLine: 'underline',
  },
  footerSeparator: {
    fontSize: 14,
    color: brandColors.textSecondary,
    marginHorizontal: 12,
  },
  environmentalContainer: {
    marginTop: 12,
    marginHorizontal: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  environmentalContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  environmentalTag: {
    fontSize: 14,
    fontFamily: typography.fontFamily,
    fontWeight: typography.weights.medium,
    textAlign: 'center',
  },
  missionLink: {
    marginLeft: 6,
    padding: 2,
  },
  primaryInfoSection: {
    marginVertical: 10,
    ...(isDesktop && {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 16,
    }),
  },
  secondaryInfoSection: {
    marginTop: 10,
    ...(isDesktop && {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 16,
    }),
  },
  viewMoreButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: 'center',
    marginVertical: 10,
  },
  viewMoreText: {
    fontSize: 16,
    fontWeight: typography.weights.semiBold,
  },
  numericalEmphasis: {
    color: '#F59E0B', // Amber for numerical values
    fontWeight: typography.weights.semiBold,
    fontSize: 24,
  },
  realScoreEmphasis: {
    color: '#10B981', // Emerald green for Real Score
    fontWeight: typography.weights.semiBold,
    fontSize: 24,
  },
  trendingLabel: {
    color: brandColors.textSecondary,
    fontStyle: 'italic',
    fontSize: 14,
  },
  labelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoIconButton: {
    marginLeft: 6,
    padding: 4,
    minWidth: 24,
    minHeight: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  realScoreExplanation: {
    fontSize: 14,
    fontFamily: typography.bodyFont,
    color: brandColors.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
    lineHeight: 20,
  },
  dupeAlert: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginVertical: 12,
    marginHorizontal: 0,
  },
  dupeAlertContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dupeAlertText: {
    fontSize: 14,
    fontFamily: typography.bodyFont,
    color: '#92400E',
    lineHeight: 20,
    flex: 1,
  },
  topPriceContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginVertical: 10,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  priceColumn: {
    flex: 1,
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 16,
    fontFamily: typography.bodyFont,
    fontWeight: typography.weights.regular,
    color: brandColors.textSecondary,
    marginBottom: 4,
  },
  priceValueLarge: {
    fontSize: 24,
    fontFamily: typography.bodyFont,
    fontWeight: typography.weights.bold,
    color: brandColors.accent,
  },
  itemInPriceBox: {
    borderTopWidth: 1,
    borderTopColor: brandColors.border,
    paddingTop: 12,
  },
  itemLabel: {
    fontSize: 14,
    fontFamily: typography.bodyFont,
    color: brandColors.textSecondary,
    marginBottom: 4,
  },
  itemValue: {
    fontSize: 18,
    fontFamily: typography.bodyFont,
    fontWeight: typography.weights.medium,
    color: brandColors.text,
  },
});