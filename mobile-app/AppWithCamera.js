import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Button, Image, StyleSheet, Alert, Platform, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';

const API_URL = Platform.OS === 'web' 
  ? `${window.location.protocol}//${window.location.hostname}:3000`
  : Platform.OS === 'ios'
    ? 'http://localhost:3000' // iOS simulator
    : 'http://10.0.2.2:3000'; // Android emulator

// Camera component for web-based mobile browsers
const CameraComponent = ({ onCapture, onCancel, onError }) => {
  const [stream, setStream] = useState(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      // Request camera access with back camera preference
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          setIsCameraReady(true);
        };
      }
    } catch (error) {
      console.error('Camera start error:', error);
      setCameraError(error);
      handleCameraError(error);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleCameraError = (error) => {
    let errorMessage = 'Unable to access camera';
    
    if (error.name === 'NotAllowedError') {
      errorMessage = 'Camera permission denied. Please allow camera access.';
    } else if (error.name === 'NotFoundError') {
      errorMessage = 'No camera found on this device.';
    } else if (error.name === 'NotSupportedError') {
      errorMessage = 'Camera not supported in this browser.';
    } else if (error.name === 'NotReadableError') {
      errorMessage = 'Camera is already in use by another application.';
    }

    if (onError) {
      onError(errorMessage);
    } else {
      Alert.alert('Camera Error', errorMessage);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !isCameraReady) {
      Alert.alert('Camera not ready', 'Please wait for camera to initialize');
      return;
    }

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      // Convert to base64 JPEG with 70% quality
      const imageData = canvas.toDataURL('image/jpeg', 0.7);
      
      // Stop camera and call capture callback
      stopCamera();
      onCapture(imageData);
      
    } catch (error) {
      console.error('Photo capture error:', error);
      Alert.alert('Capture Error', 'Failed to capture photo. Please try again.');
    }
  };

  const switchCamera = async () => {
    if (!stream) return;
    
    try {
      // Stop current stream
      stopCamera();
      
      // Get current facing mode
      const currentTrack = stream.getVideoTracks()[0];
      const currentFacingMode = currentTrack.getSettings().facingMode;
      const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
      
      // Start new stream with opposite camera
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: newFacingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (error) {
      console.error('Camera switch error:', error);
      Alert.alert('Camera Switch Error', 'Unable to switch cameras');
    }
  };

  if (cameraError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Camera Error</Text>
        <Text style={styles.errorMessage}>
          {cameraError.name === 'NotAllowedError' 
            ? 'Please allow camera access to take photos'
            : 'Unable to access camera on this device'
          }
        </Text>
        <Button title="Try Again" onPress={startCamera} />
        <Button title="Cancel" onPress={onCancel} />
      </View>
    );
  }

  return (
    <View style={styles.cameraContainer}>
      <View style={styles.cameraHeader}>
        <Text style={styles.cameraTitle}>Take Photo</Text>
        <Button title="Cancel" onPress={onCancel} />
      </View>
      
      <View style={styles.videoContainer}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={styles.cameraVideo}
        />
        
        {/* Hidden canvas for capturing */}
        <canvas
          ref={canvasRef}
          style={{ display: 'none' }}
        />
        
        {/* Camera overlay with capture button */}
        <View style={styles.cameraOverlay}>
          <View style={styles.captureButtonContainer}>
            <Button
              title="📷"
              onPress={capturePhoto}
              disabled={!isCameraReady}
              style={styles.captureButton}
            />
          </View>
          
          <View style={styles.cameraControls}>
            <Button
              title="🔄"
              onPress={switchCamera}
              style={styles.switchButton}
            />
          </View>
        </View>
      </View>
      
      {!isCameraReady && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Initializing camera...</Text>
        </View>
      )}
    </View>
  );
};

// Main App Component
export default function AppWithCamera() {
  const [image, setImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [showCamera, setShowCamera] = useState(false);

  // Check if running on mobile web browser
  const isMobileWeb = () => {
    return Platform.OS === 'web' && 
           /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  const pickImage = async () => {
    if (Platform.OS === 'web') {
      if (isMobileWeb()) {
        // Show choice: Camera or Gallery for mobile web
        Alert.alert(
          'Choose Option',
          'Take photo or select from gallery?',
          [
            { text: '📷 Camera', onPress: () => setShowCamera(true) },
            { text: '📁 Gallery', onPress: pickImageFromGallery },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      } else {
        // Desktop web - use file picker
        pickImageFromGallery();
      }
    } else {
      // Native mobile app - existing camera logic
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Sorry, we need camera permissions!');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
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

  const pickImageFromGallery = () => {
    if (Platform.OS === 'web') {
      // Web file input
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            setImage(e.target.result);
            analyzeImage(e.target.result);
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      // Mobile gallery picker
      ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true,
      }).then((result) => {
        if (!result.canceled) {
          setImage(result.assets[0].uri);
          analyzeImage(result.assets[0].base64);
        }
      });
    }
  };

  const analyzeImage = async (imageData) => {
    setAnalyzing(true);
    setResults(null);

    try {
      const formData = new FormData();
      if (Platform.OS === 'web') {
        // Convert data URL to blob for web
        const response = await fetch(imageData);
        const blob = await response.blob();
        formData.append('image', blob, 'image.jpg');
      } else {
        // Mobile - use base64
        formData.append('image', {
          uri: imageData,
          type: 'image/jpeg',
          name: 'photo.jpg',
        });
      }

      const response = await fetch(`${API_URL}/api/scan`, {
        method: 'POST',
        body: formData,
        headers: Platform.OS === 'web' ? {} : { 'Content-Type': 'multipart/form-data' },
      });

      const data = await response.json();
      
      if (data.success) {
        setResults(data.analysis);
      } else {
        Alert.alert('Error', data.error || 'Failed to analyze image');
      }
    } catch (error) {
      console.error('API Error:', error);
      Alert.alert(
        'Connection Error', 
        `Failed to connect to server at ${API_URL}. Make sure the backend is running.`
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCameraCapture = (imageData) => {
    setImage(imageData);
    setShowCamera(false);
    analyzeImage(imageData);
  };

  const handleCameraError = (message) => {
    Alert.alert('Camera Error', message);
    setShowCamera(false);
  };

  // Show camera interface if camera is active
  if (showCamera) {
    return (
      <CameraComponent
        onCapture={handleCameraCapture}
        onCancel={() => setShowCamera(false)}
        onError={handleCameraError}
      />
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>My Thrifting Buddy</Text>
      <Text style={styles.subtitle}>Upload a photo to get resale prices</Text>

      <Button 
        title={Platform.OS === 'web' ? "Choose Image" : "Take Photo"}
        onPress={pickImage}
        disabled={analyzing}
      />

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
  // Camera component styles
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
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  cameraVideo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    padding: 20,
  },
  captureButtonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 24,
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingBottom: 20,
  },
  switchButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
}); 