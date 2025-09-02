import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { brandColors, componentColors } from '../theme/brandColors';
import { appleStyles } from '../theme/appleStyles';

const FotoFlipButton = ({ imageUri, onProcessed, style }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFotoFlip = async () => {
    if (!imageUri) {
      Alert.alert('No Image', 'Please capture or upload an image first');
      return;
    }

    setIsProcessing(true);

    try {
      // Convert image URI to blob
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // Create form data
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'photo.jpg'
      });

      // Call FotoFlip API
      const apiResponse = await fetch('/api/fotoflip/luxe-photo', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        }
      });

      const result = await apiResponse.json();

      if (result.success) {
        // Call the callback with the processed image
        if (result.url) {
          onProcessed(result.url, result);
        } else if (result.dataUrl) {
          onProcessed(result.dataUrl, result);
        }
        
        Alert.alert(
          'Luxe Photo Complete',
          'Your image has been beautified with FotoFlip Luxe Photo!',
          [{ text: 'OK', style: 'default' }]
        );
      } else {
        throw new Error(result.error || 'Processing failed');
      }
    } catch (error) {
      console.error('FotoFlip error:', error);
      Alert.alert(
        'Processing Error',
        error.message || 'Failed to process image with FotoFlip Luxe Photo',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handleFotoFlip}
      disabled={isProcessing}
    >
      <View style={styles.content}>
        {isProcessing ? (
          <>
            <ActivityIndicator size="small" color={brandColors.white} style={styles.icon} />
            <Text style={styles.text}>Processing...</Text>
          </>
        ) : (
          <>
            <Feather name="star" size={20} color={brandColors.white} style={styles.icon} />
            <Text style={styles.text}>Luxe Photo</Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: brandColors.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: appleStyles.borderRadius.medium,
    ...appleStyles.shadows.small,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    color: brandColors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FotoFlipButton;