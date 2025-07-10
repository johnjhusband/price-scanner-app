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
});