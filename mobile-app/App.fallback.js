import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Alert, Platform, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Linking, Dimensions } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import { Feather } from '@expo/vector-icons';

// Import components
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

// Simple working App component
export default function App() {
  const [hasEntered, setHasEntered] = useState(false);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showMission, setShowMission] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [authState, setAuthState] = useState({
    user: null,
    isAuthenticated: false,
    isAdmin: false,
    loading: true
  });

  useEffect(() => {
    // Check authentication
    AuthService.checkAuth().then(({ user, isAuthenticated, isAdmin }) => {
      setAuthState({ user, isAuthenticated, isAdmin, loading: false });
    }).catch(() => {
      setAuthState({ user: null, isAuthenticated: false, isAdmin: false, loading: false });
    });
  }, []);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImage(result.assets[0].uri);
        setResult(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const analyzeImage = async () => {
    if (!image) return;
    
    setLoading(true);
    try {
      // Mock analysis for now
      setTimeout(() => {
        setResult({
          brand: "Example Brand",
          product_type: "Sneakers",
          estimated_retail: "$150",
          resale_range: "$100-200",
          trending_score: 85,
          real_score: "Likely Authentic"
        });
        setLoading(false);
      }, 2000);
    } catch (error) {
      Alert.alert('Error', 'Analysis failed');
      setLoading(false);
    }
  };

  if (!hasEntered) {
    return <EnterScreen onEnter={() => setHasEntered(true)} />;
  }

  if (authState.loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={brandColors.primary} />
      </View>
    );
  }

  return (
    <PageContainer>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <FlippiLogo />
          <TouchableOpacity 
            style={styles.missionButton}
            onPress={() => setShowMission(true)}
          >
            <Text style={styles.missionText}>Our Mission</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {!image ? (
            <View style={styles.uploadSection}>
              <Text style={styles.title}>Upload an Image</Text>
              <Text style={styles.subtitle}>
                Take a photo or select from your gallery
              </Text>
              
              <BrandButton
                title="Select from Gallery"
                onPress={pickImage}
                variant="primary"
                icon="image"
              />
            </View>
          ) : (
            <View style={styles.imageSection}>
              <Image source={{ uri: image }} style={styles.previewImage} />
              
              {!result ? (
                <View style={styles.actionButtons}>
                  <BrandButton
                    title={loading ? "Analyzing..." : "Analyze"}
                    onPress={analyzeImage}
                    disabled={loading}
                    loading={loading}
                    variant="accent"
                  />
                  <BrandButton
                    title="Change Image"
                    onPress={pickImage}
                    variant="secondary"
                  />
                </View>
              ) : (
                <View style={styles.results}>
                  <Text style={styles.resultTitle}>Analysis Results</Text>
                  <View style={styles.resultCard}>
                    <Text style={styles.resultText}>Brand: {result.brand}</Text>
                    <Text style={styles.resultText}>Type: {result.product_type}</Text>
                    <Text style={styles.resultText}>Retail: {result.estimated_retail}</Text>
                    <Text style={styles.resultText}>Resale: {result.resale_range}</Text>
                    <Text style={styles.resultText}>Trending: {result.trending_score}/100</Text>
                    <Text style={styles.resultText}>Authenticity: {result.real_score}</Text>
                  </View>
                  
                  <BrandButton
                    title="Scan Another Item"
                    onPress={() => {
                      setImage(null);
                      setResult(null);
                    }}
                    variant="primary"
                  />
                </View>
              )}
            </View>
          )}
        </View>

        <FeedbackSystem />
      </ScrollView>

      {showMission && (
        <MissionModal
          visible={showMission}
          onClose={() => setShowMission(false)}
        />
      )}

      {showPricing && (
        <PricingModal
          visible={showPricing}
          onClose={() => setShowPricing(false)}
        />
      )}
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brandColors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  missionButton: {
    padding: 10,
  },
  missionText: {
    color: brandColors.primary,
    fontSize: 16,
    fontFamily: typography.medium,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  uploadSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  title: {
    fontSize: 32,
    fontFamily: typography.bold,
    color: brandColors.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontFamily: typography.regular,
    color: brandColors.textSecondary,
    marginBottom: 40,
    textAlign: 'center',
  },
  imageSection: {
    alignItems: 'center',
  },
  previewImage: {
    width: 300,
    height: 300,
    borderRadius: 12,
    marginBottom: 20,
  },
  actionButtons: {
    gap: 10,
  },
  results: {
    width: '100%',
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 24,
    fontFamily: typography.bold,
    color: brandColors.text,
    marginBottom: 20,
  },
  resultCard: {
    backgroundColor: componentColors.card.background,
    padding: 20,
    borderRadius: 12,
    width: '100%',
    marginBottom: 20,
  },
  resultText: {
    fontSize: 16,
    fontFamily: typography.regular,
    color: brandColors.text,
    marginBottom: 10,
  },
});