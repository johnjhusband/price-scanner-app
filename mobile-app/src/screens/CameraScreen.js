import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, Text, TouchableOpacity, Image, Platform } from 'react-native';
import { Camera } from 'expo-camera';
import { Button, IconButton, useTheme, ActivityIndicator } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import { analyzeImage } from '../services/apiService';

export default function CameraScreen({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const cameraRef = useRef(null);
  const theme = useTheme();

  // Redirect to FilePicker if on web platform
  useEffect(() => {
    if (Platform.OS === 'web') {
      navigation.replace('FilePicker');
      return;
    }
  }, [navigation]);

  useEffect(() => {
    (async () => {
      // Skip camera permission request on web
      if (Platform.OS === 'web') return;
      
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: true,
        });
        
        // Compress image to reduce size
        const compressedPhoto = await ImageManipulator.manipulateAsync(
          photo.uri,
          [{ resize: { width: 1200 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );
        
        setCapturedImage({
          uri: compressedPhoto.uri,
          base64: compressedPhoto.base64,
        });
      } catch (error) {
        Alert.alert('Error', 'Failed to capture photo');
        console.error('Camera capture error:', error);
      }
    }
  };

  const retakePicture = () => {
    setCapturedImage(null);
  };

  const analyzePhoto = async () => {
    if (!capturedImage || !capturedImage.base64) {
      Alert.alert('Error', 'No image to analyze');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const result = await analyzeImage(capturedImage.uri, capturedImage.base64);
      
      // Navigate to results with the analysis data
      navigation.navigate('Results', {
        analysisData: result.analysis || result,
        imageUri: capturedImage.uri
      });
    } catch (error) {
      console.error('Analysis error:', error);
      Alert.alert(
        'Analysis Failed', 
        'Unable to analyze the image. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsAnalyzing(false);
      setCapturedImage(null);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Camera permission is required</Text>
        <Button mode="contained" onPress={() => Camera.requestCameraPermissionsAsync()}>
          Grant Permission
        </Button>
      </View>
    );
  }

  // If image is captured, show preview
  if (capturedImage) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: capturedImage.uri }} style={styles.preview} />
        <View style={styles.previewControls}>
          <Button
            mode="outlined"
            onPress={retakePicture}
            style={styles.previewButton}
            disabled={isAnalyzing}
          >
            Retake
          </Button>
          <Button
            mode="contained"
            onPress={analyzePhoto}
            loading={isAnalyzing}
            disabled={isAnalyzing}
            style={styles.previewButton}
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze'}
          </Button>
        </View>
      </View>
    );
  }

  // Camera view
  return (
    <View style={styles.container}>
      <Camera style={styles.camera} type={type} ref={cameraRef}>
        <View style={styles.cameraOverlay}>
          <View style={styles.topControls}>
            <IconButton
              icon="close"
              iconColor="white"
              size={30}
              onPress={() => navigation.goBack()}
            />
            <IconButton
              icon="camera-flip"
              iconColor="white"
              size={30}
              onPress={() => {
                setType(
                  type === Camera.Constants.Type.back
                    ? Camera.Constants.Type.front
                    : Camera.Constants.Type.back
                );
              }}
            />
          </View>
          
          <View style={styles.bottomControls}>
            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.helpText}>
            <Text style={styles.helpTextContent}>
              Center the item in frame for best results
            </Text>
          </View>
        </View>
      </Camera>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  bottomControls: {
    alignItems: 'center',
    paddingBottom: 50,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  helpText: {
    position: 'absolute',
    bottom: 150,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  helpTextContent: {
    color: 'white',
    fontSize: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  preview: {
    width: '90%',
    height: '70%',
    resizeMode: 'contain',
  },
  previewControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  previewButton: {
    minWidth: 120,
  },
  permissionText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
    color: '#666',
  },
});