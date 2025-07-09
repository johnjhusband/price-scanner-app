import React, { useState, useRef } from 'react';
import { View, StyleSheet, Alert, Text, Image, Platform } from 'react-native';
import { Button, useTheme, ActivityIndicator, Surface, Title, Paragraph } from 'react-native-paper';
import * as ImageManipulator from 'expo-image-manipulator';
import { analyzeImage } from '../services/apiService';

export default function FilePickerScreen({ navigation }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef(null);
  const theme = useTheme();

  // Handle file selection
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      Alert.alert('Invalid File', 'Please select an image file');
      return;
    }

    // Read file as data URL
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      
      try {
        // Compress image to reduce size
        const compressedPhoto = await ImageManipulator.manipulateAsync(
          dataUrl,
          [{ resize: { width: 1200 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );
        
        setSelectedImage({
          uri: compressedPhoto.uri,
          base64: compressedPhoto.base64,
        });
      } catch (error) {
        console.error('Error processing image:', error);
        Alert.alert('Error', 'Failed to process image');
      }
    };
    
    reader.readAsDataURL(file);
  };

  const selectNewImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const analyzePhoto = async () => {
    if (!selectedImage || !selectedImage.base64) {
      Alert.alert('Error', 'No image to analyze');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const result = await analyzeImage(selectedImage.uri, selectedImage.base64);
      
      // Navigate to results with the analysis data
      navigation.navigate('Results', {
        analysisData: result.analysis || result,
        imageUri: selectedImage.uri
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
      setSelectedImage(null);
    }
  };

  // If image is selected, show preview
  if (selectedImage) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Title style={styles.title}>Review Image</Title>
          <Paragraph style={styles.subtitle}>
            Make sure the item is clearly visible
          </Paragraph>
        </View>
        
        <Surface style={styles.imageContainer} elevation={2}>
          <Image source={{ uri: selectedImage.uri }} style={styles.preview} />
        </Surface>
        
        <View style={styles.previewControls}>
          <Button
            mode="outlined"
            onPress={selectNewImage}
            style={styles.previewButton}
            disabled={isAnalyzing}
          >
            Select Different Image
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

  // File picker view
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.title}>Select an Image</Title>
        <Paragraph style={styles.subtitle}>
          Choose a photo from your device to analyze
        </Paragraph>
      </View>

      <Surface style={styles.uploadCard} elevation={4}>
        <View style={styles.uploadContent}>
          <Text style={styles.uploadIcon}>📁</Text>
          <Title style={styles.uploadTitle}>Upload Image</Title>
          <Paragraph style={styles.uploadDescription}>
            Select a clear photo of the item you want to price
          </Paragraph>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            id="file-input"
          />
          
          <Button
            mode="contained"
            onPress={() => fileInputRef.current?.click()}
            style={styles.selectButton}
            icon="folder-open"
          >
            Choose Image
          </Button>
          
          <Paragraph style={styles.formatText}>
            Supported formats: JPG, PNG, GIF, WebP
          </Paragraph>
        </View>
      </Surface>

      <View style={styles.tipsContainer}>
        <Title style={styles.tipsTitle}>Tips for Best Results</Title>
        <View style={styles.tip}>
          <Text style={styles.tipIcon}>💡</Text>
          <Paragraph style={styles.tipText}>
            Use a well-lit photo with the item clearly visible
          </Paragraph>
        </View>
        <View style={styles.tip}>
          <Text style={styles.tipIcon}>📐</Text>
          <Paragraph style={styles.tipText}>
            Center the item in frame with minimal background
          </Paragraph>
        </View>
        <View style={styles.tip}>
          <Text style={styles.tipIcon}>🎯</Text>
          <Paragraph style={styles.tipText}>
            Include any labels or brand markings when possible
          </Paragraph>
        </View>
      </View>

      <Button
        mode="text"
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        Back to Home
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBFE',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
  uploadCard: {
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    marginBottom: 30,
  },
  uploadContent: {
    alignItems: 'center',
    width: '100%',
  },
  uploadIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  uploadTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  uploadDescription: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
    color: '#666',
  },
  selectButton: {
    marginTop: 10,
    paddingHorizontal: 30,
  },
  formatText: {
    marginTop: 15,
    fontSize: 12,
    color: '#999',
  },
  imageContainer: {
    borderRadius: 12,
    padding: 10,
    marginBottom: 20,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  preview: {
    width: '100%',
    height: 400,
    resizeMode: 'contain',
  },
  previewControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
  },
  previewButton: {
    minWidth: 150,
  },
  tipsContainer: {
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  tipIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  backButton: {
    marginTop: 10,
  },
});