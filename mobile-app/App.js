import React, { useState } from 'react';
import { View, Text, Button, Image, StyleSheet, Alert, Platform, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';

const API_URL = Platform.OS === 'web' 
  ? 'http://localhost:3000' 
  : Platform.OS === 'ios'
    ? 'http://localhost:3000' // iOS simulator
    : 'http://10.0.2.2:3000'; // Android emulator

export default function App() {
  const [image, setImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);

  const pickImage = async () => {
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
      // Mobile camera
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
          <Text>Item: {results.item_name}</Text>
          <Text>Estimated Value: {results.price_range}</Text>
          <Text>Best Platform: {results.recommended_platform}</Text>
          <Text>Condition: {results.condition}</Text>
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
});