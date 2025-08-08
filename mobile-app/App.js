import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Alert, Platform, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Linking, Dimensions } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';

// Import Lucide icons - our licensed icon system
import { 
  Camera as CameraIcon, 
  Upload, 
  Clipboard, 
  Info,
  Share2,
  Download,
  Heart,
  Sparkles,
  Package,
  BadgeCheck,
  Flame,
  Repeat,
  Briefcase,
  AlertTriangle
} from 'lucide-react-native';

// Import brand components and theme
import FlippiLogo from './components/FlippiLogo';
import BrandButton from './components/BrandButton';
import FeedbackPrompt from './components/FeedbackPrompt';
import EnterScreen from './components/EnterScreen';
import MissionModal from './components/MissionModal';
import PageContainer from './components/PageContainer';
import AuthService from './services/authService';
import { brandColors, typography, componentColors } from './theme/brandColors';
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
      // Check authentication
      
      // Set a timeout for auth check to prevent infinite loading
      const authTimeout = setTimeout(() => {
        // Auth check timeout
        setAuthLoading(false);
        setIsAuthenticated(false);
      }, 5000); // 5 second timeout
      
      // Check if token in URL (OAuth callback)
      AuthService.parseTokenFromUrl().then(hasToken => {
        // Check if we have a token
        
        if (hasToken) {
          setIsAuthenticated(true);
          // Get user asynchronously
          AuthService.getUser().then(userData => {
            // User data loaded
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
          AuthService.isAuthenticated().then(isAuth => {
            // Check existing session
            
            if (isAuth) {
              setIsAuthenticated(true);
              AuthService.getUser().then(userData => {
                // User data loaded from session
                setUser(userData);
                clearTimeout(authTimeout);
                setAuthLoading(false);
              }).catch(error => {
                console.error('Error getting user from session:', error);
                clearTimeout(authTimeout);
                setAuthLoading(false);
              });
            } else {
              // No authentication found
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
      
      // Store base64 for feedback with full data URL prefix
      setImageBase64(`data:image/jpeg;base64,${base64Data}`);
      
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
            // Increment flip count
            setFlipCount(prevCount => prevCount + 1);
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
        <CameraIcon 
          size={16} 
          color={brandColors.textSecondary} 
          strokeWidth={2}
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
    setIsLoading(true);
    generateInstagramStoryImage(analysisResult, imageBase64, image).finally(() => {
      setIsLoading(false);
    });
  };

  // Generate universal share image (square format)
  const generateShareImage = async (result, base64Image = null, originalImage = null) => {
    if (!result) {
      console.log('[Share Image] No analysis result available');
      Alert.alert(
        'No Results Yet',
        'Please analyze an item first before downloading.',
        [{ text: 'OK' }]
      );
      return;
    }
    
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
        const boxHeight = 380;
        const boxX = 140;
        const boxY = 140;
        
        // Draw border around image area
        ctx.strokeStyle = '#e5e5e5';
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
        
        // Use passed parameters or fall back to component state
        const imageBase64ToUse = base64Image || imageBase64;
        const imageToUse = originalImage || image;
        
        // Debug: Log what images we have available
        console.log('[Share Image Debug] base64Image param:', !!base64Image);
        console.log('[Share Image Debug] originalImage param:', !!originalImage);
        console.log('[Share Image Debug] imageBase64ToUse available:', !!imageBase64ToUse);
        console.log('[Share Image Debug] imageBase64ToUse length:', imageBase64ToUse?.length);
        console.log('[Share Image Debug] imageToUse available:', !!imageToUse);
        console.log('[Share Image Debug] imageToUse type:', imageToUse?.substring(0, 30));
        
        // Try different image sources
        let imageLoaded = false;
        
        // Method 1: Try imageBase64 first (most reliable)
        if (imageBase64ToUse && !imageLoaded) {
          try {
            console.log('[Share Image] Trying imageBase64ToUse...');
            const img = new Image();
            
            // Set up promise for load/error
            const loadPromise = new Promise((resolve, reject) => {
              img.onload = () => {
                console.log('[Share Image] imageBase64ToUse loaded!', img.width, 'x', img.height);
                resolve(true);
              };
              img.onerror = (e) => {
                console.error('[Share Image] imageBase64ToUse failed to load:', e);
                reject(e);
              };
            });
            
            // Set source after handlers (already has data URL prefix)
            img.src = imageBase64ToUse;
            
            // Wait for load
            await loadPromise;
            
            // Draw the image
            const scale = Math.min(boxWidth / img.width, boxHeight / img.height);
            const width = img.width * scale;
            const height = img.height * scale;
            const x = boxX + (boxWidth - width) / 2;
            const y = boxY + (boxHeight - height) / 2;
            
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
            ctx.drawImage(img, x, y, width, height);
            
            imageLoaded = true;
            console.log('[Share Image] Successfully drew imageBase64');
          } catch (error) {
            console.error('[Share Image] Failed with imageBase64:', error);
          }
        }
        
        // Method 2: Try original image
        if (image && !imageLoaded) {
          try {
            console.log('[Share Image] Trying original image...');
            const img = new Image();
            
            // If it's a blob URL, we need to handle it differently
            if (image.startsWith('blob:')) {
              console.log('[Share Image] Detected blob URL, skipping for now');
              // Skip blob URLs for now as they're problematic
            } else {
              const loadPromise = new Promise((resolve, reject) => {
                img.onload = () => {
                  console.log('[Share Image] Original image loaded!', img.width, 'x', img.height);
                  resolve(true);
                };
                img.onerror = (e) => {
                  console.error('[Share Image] Original image failed:', e);
                  reject(e);
                };
              });
              
              img.src = image;
              await loadPromise;
              
              // Draw the image
              const scale = Math.min(boxWidth / img.width, boxHeight / img.height);
              const width = img.width * scale;
              const height = img.height * scale;
              const x = boxX + (boxWidth - width) / 2;
              const y = boxY + (boxHeight - height) / 2;
              
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
              ctx.drawImage(img, x, y, width, height);
              
              imageLoaded = true;
              console.log('[Share Image] Successfully drew original image');
            }
          } catch (error) {
            console.error('[Share Image] Failed with original image:', error);
          }
        }
        
        // If nothing worked, show placeholder
        if (!imageLoaded) {
          console.error('[Share Image] No image could be loaded, showing placeholder');
          ctx.fillStyle = '#f5f5f5';
          ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
          ctx.fillStyle = '#a0a0a0';
          ctx.font = '32px -apple-system, system-ui, sans-serif';
          ctx.fillText('Image could not be loaded', canvas.width / 2, boxY + boxHeight/2);
        }
      };
      
      await drawItemImage();
      
      // Item name
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 42px -apple-system, system-ui, sans-serif';
      const itemName = result.item_name || 'Unknown Item';
      ctx.fillText(itemName, canvas.width / 2, 560);
      
      // Brand (if available)
      if (result.brand) {
        ctx.font = '32px -apple-system, system-ui, sans-serif';
        ctx.fillStyle = '#666666';
        ctx.fillText(result.brand, canvas.width / 2, 600);
      }
      
      // Price range
      ctx.font = 'bold 56px -apple-system, system-ui, sans-serif';
      ctx.fillStyle = '#059669';
      ctx.fillText(result.price_range || '$0-$0', canvas.width / 2, 660);
      
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
      
      const purchasePrice = getPurchasePrice();
      let yPosition = 720;
      
      if (purchasePrice) {
        ctx.font = '32px -apple-system, system-ui, sans-serif';
        ctx.fillStyle = '#666666';
        ctx.fillText(`Bought for $${purchasePrice}`, canvas.width / 2, yPosition);
        yPosition += 50;
        
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
          ctx.font = 'bold 42px -apple-system, system-ui, sans-serif';
          ctx.fillStyle = profit > 0 ? '#059669' : '#dc2626';
          ctx.fillText(`${profit > 0 ? '+' : ''}$${Math.abs(profit)} profit potential`, canvas.width / 2, yPosition);
          yPosition += 60;
        }
      }
      
      // Add key metrics in a row
      ctx.font = '24px -apple-system, system-ui, sans-serif';
      ctx.fillStyle = '#333333';
      
      // Real Score
      if (result.real_score) {
        const realScoreText = `Real Score: ${result.real_score}%`;
        ctx.fillText(realScoreText, canvas.width / 2 - 200, yPosition);
      }
      
      // Sellability
      if (result.trending_score) {
        const sellabilityText = `Sellability: ${result.trending_score}/100`;
        ctx.fillText(sellabilityText, canvas.width / 2 + 200, yPosition);
      }
      yPosition += 40;
      
      // Platform recommendation
      if (result.platform_recommendation) {
        ctx.font = '28px -apple-system, system-ui, sans-serif';
        ctx.fillStyle = '#666666';
        ctx.fillText(`Best on: ${result.platform_recommendation}`, canvas.width / 2, yPosition);
        yPosition += 40;
      }
      
      // Environmental impact
      if (result.environmental_tag) {
        ctx.font = '26px -apple-system, system-ui, sans-serif';
        ctx.fillStyle = '#059669';
        ctx.fillText(result.environmental_tag, canvas.width / 2, yPosition);
        yPosition += 50;
      }
      
      // Footer
      ctx.fillStyle = '#666666';
      ctx.font = '28px -apple-system, system-ui, sans-serif';
      ctx.fillText('Never Over Pay • Know the price. Own the profit.', canvas.width / 2, 960);
      
      if (user?.referralCode) {
        ctx.font = '24px monospace';
        ctx.fillText(`flippi.ai?ref=${user.referralCode}`, canvas.width / 2, 1000);
      }
      
      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Failed to convert canvas to blob');
        }
        
        console.log('[Share Image] Blob created, size:', blob.size);
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `flippi-share-image-${Date.now()}.png`;
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
          'Image downloaded!',
          'Ready to share on any platform!',
          [{ text: 'Awesome!' }]
        );
      }, 'image/png', 0.95);
    } catch (error) {
      console.error('[Share Image] Error generating image:', error);
      Alert.alert(
        'Download Failed',
        'Unable to download image. Please try again or use a screenshot instead.',
        [{ text: 'OK' }]
      );
    }
  };

  // Handle universal share image download
  const handleDownloadShareImage = () => {
    setIsLoading(true);
    generateShareImage(analysisResult, imageBase64, image).finally(() => {
      setIsLoading(false);
    });
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
          <Text style={styles.environmentText}>DEVELOPMENT ENVIRONMENT</Text>
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
                  icon={<CameraIcon size={20} color="#FFFFFF" />}
                />
              )}
              
              <BrandButton
                title="Upload Photo"
                onPress={pickImage}
                style={styles.actionButton}
                variant="outline"
                icon={<Upload size={20} color={brandColors.text} />}
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
                  <BrandButton
                    title="Go"
                    onPress={analyzeImage}
                    style={styles.goButton}
                    variant="accent"
                    isHighImpact={true}
                  />
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
                          <AlertTriangle size={16} color="#EAB308" strokeWidth={2} style={{ marginRight: 8 }} />
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
                          <Info size={16} color={brandColors.textSecondary} strokeWidth={2} />
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
                        <Info size={14} color="#2E7D32" strokeWidth={2} style={{ opacity: 0.8 }} />
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
              <FeedbackPrompt
                scanData={analysisResult}
                userDescription={productDescription}
                imageData={imageBase64}
                onComplete={() => setShowFeedback(false)}
              />
            )}
            
            {analysisResult && (
              <View style={styles.postAnalysisActions}>
                <BrandButton
                  title="Share on X"
                  onPress={handleShareOnX}
                  style={[styles.shareButton, { backgroundColor: '#18181b' }]}
                  variant="primary"
                  icon={<Share2 size={20} color="#FFFFFF" />}
                />
                {Platform.OS !== 'web' && (
                  <>
                    <BrandButton
                      title="Share to Instagram Story"
                      onPress={handleInstagramStoryShare}
                      style={[styles.shareButton, { backgroundColor: '#E1306C' }]}
                      variant="primary"
                      disabled={isLoading}
                      icon={<CameraIcon size={20} color="#FFFFFF" />}
                    />
                    <Text style={[styles.helperText, { marginTop: -8, marginBottom: 8 }]}>
                      Downloads story image to share
                    </Text>
                  </>
                )}
                <BrandButton
                  title="Download Image"
                  onPress={handleDownloadShareImage}
                  style={[styles.shareButton, { backgroundColor: '#52525b' }]}
                  variant="primary"
                  disabled={isLoading}
                  icon={<Download size={20} color="#FFFFFF" />}
                />
                {Platform.OS === 'web' && (
                  <Text style={[styles.helperText, { marginTop: -8, marginBottom: 8 }]}>
                    Save to share anywhere
                  </Text>
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
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  footerLink: {
    fontSize: 14,
    color: brandColors.textSecondary,
    fontFamily: typography.fontFamily,
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