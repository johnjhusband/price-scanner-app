// EMERGENCY SIMPLIFIED APP.JS - REMOVING ALL POTENTIAL ISSUES
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Animated,
  Dimensions,
  Modal,
  Linking,
  Share,
  Clipboard
} from 'react-native';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FlippiBot from './components/FlippiBot';
import ShareModal from './components/ShareModal';
import { brandColors } from './theme/brandColors';
import { appleStyles } from './theme/appleStyles';

// Import web styles for web platform
if (Platform.OS === 'web') {
  require('./web-styles.css');
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function App() {
  const [imageUri, setImageUri] = useState(null);
  const [description, setDescription] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraType, setCameraType] = useState(Camera.Constants.Type.back);
  const [showCamera, setShowCamera] = useState(false);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackDecision, setFeedbackDecision] = useState(null);
  const [currentAnalysisId, setCurrentAnalysisId] = useState(null);
  const [scansRemaining, setScansRemaining] = useState(null);
  const [scanCount, setScanCount] = useState(0);
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [generatedShareImage, setGeneratedShareImage] = useState(null);
  const [pricePaid, setPricePaid] = useState('');
  const [showGrowthDashboard, setShowGrowthDashboard] = useState(false);
  
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const dragCounter = useRef(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  // Load history and user status on mount
  useEffect(() => {
    loadHistory();
    checkUserStatus();
    checkPremiumStatus();
  }, []);

  // Animation for results
  useEffect(() => {
    if (analysisResult) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
    }
  }, [analysisResult]);

  const loadHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem('analysisHistory');
      if (stored) {
        setAnalysisHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const checkUserStatus = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/user/status`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.scansRemaining !== undefined) {
        setScansRemaining(data.scansRemaining);
        setScanCount(data.scanCount || 0);
      }
    } catch (error) {
      console.error('Error checking user status:', error);
    }
  };

  const checkPremiumStatus = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/user/premium-status`, {
        credentials: 'include'
      });
      const data = await response.json();
      setIsPremiumUser(data.isPremium || false);
    } catch (error) {
      console.error('Error checking premium status:', error);
    }
  };

  const saveToHistory = async (result, imageUri, description) => {
    try {
      const newItem = {
        id: Date.now().toString(),
        result,
        imageUri,
        description,
        timestamp: new Date().toISOString(),
      };
      
      const updatedHistory = [newItem, ...analysisHistory].slice(0, 50);
      setAnalysisHistory(updatedHistory);
      await AsyncStorage.setItem('analysisHistory', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error saving to history:', error);
    }
  };

  const clearHistory = async () => {
    try {
      await AsyncStorage.removeItem('analysisHistory');
      setAnalysisHistory([]);
      Alert.alert('Success', 'History cleared');
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };

  const getApiUrl = () => {
    if (Platform.OS === 'web') {
      return '';
    }
    return 'http://localhost:3000';
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      if (result.assets[0].base64) {
        setImageUri(`data:image/jpeg;base64,${result.assets[0].base64}`);
      }
    }
  };

  const openCamera = async () => {
    if (Platform.OS === 'web') {
      setShowCamera(true);
      return;
    }

    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
    
    if (status === 'granted') {
      setShowCamera(true);
    } else {
      Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
    }
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({ base64: true });
      setImageUri(`data:image/jpeg;base64,${photo.base64}`);
      setShowCamera(false);
    }
  };

  const analyzeImage = async () => {
    if (!imageUri) {
      Alert.alert('Error', 'Please select an image first');
      return;
    }

    if (scansRemaining !== null && scansRemaining <= 0 && !isPremiumUser) {
      Alert.alert(
        'Scan Limit Reached',
        'You\'ve used all your free scans for today. Upgrade to Premium for unlimited scans!',
        [
          { text: 'Maybe Later', style: 'cancel' },
          { text: 'Upgrade Now', onPress: () => Linking.openURL(`${getApiUrl()}/pricing`) }
        ]
      );
      return;
    }

    setLoading(true);
    setAnalysisResult(null);

    try {
      const formData = new FormData();
      
      if (Platform.OS === 'web') {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        formData.append('image', blob, 'image.jpg');
      } else {
        formData.append('image', {
          uri: imageUri,
          type: 'image/jpeg',
          name: 'photo.jpg',
        });
      }
      
      formData.append('description', description);

      const response = await fetch(`${getApiUrl()}/api/analyze`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const result = await response.json();
      
      if (result.error) {
        Alert.alert('Error', result.error);
      } else {
        setAnalysisResult(result);
        setCurrentAnalysisId(result.analysisId);
        await saveToHistory(result, imageUri, description);
        
        if (result.scansRemaining !== undefined) {
          setScansRemaining(result.scansRemaining);
        }

        setTimeout(() => {
          if (result.helped_decision !== undefined) {
            setFeedbackDecision(result.helped_decision);
          }
          setShowFeedbackModal(true);
        }, 3000);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to analyze image. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetAnalysis = () => {
    setImageUri(null);
    setDescription('');
    setAnalysisResult(null);
    setPricePaid('');
    setGeneratedShareImage(null);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;

    const files = e.dataTransfer.files;
    if (files && files[0] && files[0].type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageUri(event.target.result);
      };
      reader.readAsDataURL(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
  };

  const handlePaste = (e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        const reader = new FileReader();
        reader.onload = (event) => {
          setImageUri(event.target.result);
        };
        reader.readAsDataURL(blob);
        break;
      }
    }
  };

  useEffect(() => {
    if (Platform.OS === 'web') {
      document.addEventListener('paste', handlePaste);
      return () => {
        document.removeEventListener('paste', handlePaste);
      };
    }
  }, []);

  const shareResults = async () => {
    const shareText = `Check out what I found using Flippi AI!\n\n${analysisResult.item_name}\nEstimated Value: $${analysisResult.estimated_value || '0'}\nAuthenticity: ${analysisResult.authenticity || 'Unknown'}%`;
    
    try {
      await Share.share({
        message: shareText,
        title: 'Flippi AI Analysis Result',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const renderPriceRangeBar = () => {
    if (!analysisResult?.price_range) return null;

    const { min, max, estimated } = analysisResult.price_range;
    const range = max - min;
    const position = ((estimated - min) / range) * 100;

    return (
      <View style={styles.priceRangeContainer}>
        <View style={styles.priceRangeBar}>
          <View style={styles.priceRangeTrack} />
          <View 
            style={[styles.priceRangeIndicator, { left: `${position}%` }]} 
          />
        </View>
        <View style={styles.priceRangeLabels}>
          <Text style={styles.priceRangeLabel}>${min}</Text>
          <Text style={[styles.priceRangeLabel, styles.priceRangeEstimated]}>
            ${estimated}
          </Text>
          <Text style={styles.priceRangeLabel}>${max}</Text>
        </View>
      </View>
    );
  };

  const cameraRef = useRef(null);

  return (
    <SafeAreaView style={[styles.container, appleStyles.container]}>
      <StatusBar barStyle="dark-content" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Image 
            source={require('./assets/flippiapp2.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.historyButton}
              onPress={() => setShowHistory(true)}
            >
              <Feather name="clock" size={24} color={brandColors.text} />
            </TouchableOpacity>
          </View>
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.content}
        >
          {!analysisResult ? (
            <View style={styles.uploadSection}>
              <Text style={[styles.title, appleStyles.title]}>
                What's it worth?
              </Text>
              <Text style={[styles.subtitle, appleStyles.subtitle]}>
                Get instant AI valuations for your items
              </Text>

              {scansRemaining !== null && !isPremiumUser && (
                <View style={styles.scanLimitBadge}>
                  <Text style={styles.scanLimitText}>
                    {scansRemaining} free scans remaining today
                  </Text>
                </View>
              )}

              <View 
                style={[
                  styles.imageUploadArea,
                  appleStyles.card,
                  { borderStyle: imageUri ? 'solid' : 'dashed' }
                ]}
                onDrop={Platform.OS === 'web' ? handleDrop : undefined}
                onDragOver={Platform.OS === 'web' ? handleDragOver : undefined}
                onDragEnter={Platform.OS === 'web' ? handleDragEnter : undefined}
                onDragLeave={Platform.OS === 'web' ? handleDragLeave : undefined}
              >
                {imageUri ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                    <TouchableOpacity 
                      style={styles.removeImageButton}
                      onPress={() => setImageUri(null)}
                    >
                      <Feather name="x-circle" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.uploadPrompt}>
                    <Feather name="image" size={48} color={brandColors.textSecondary} />
                    <Text style={styles.uploadText}>
                      Drag & drop an image here
                    </Text>
                    <Text style={styles.uploadSubtext}>
                      or use the options below
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.uploadButtons}>
                <TouchableOpacity 
                  style={[styles.uploadButton, appleStyles.button]}
                  onPress={pickImage}
                >
                  <Feather name="folder" size={20} color="#FFFFFF" />
                  <Text style={[styles.uploadButtonText, appleStyles.buttonText]}>
                    Choose Photo
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.uploadButton, appleStyles.button]}
                  onPress={openCamera}
                >
                  <Feather name="camera" size={20} color="#FFFFFF" />
                  <Text style={[styles.uploadButtonText, appleStyles.buttonText]}>
                    Take Photo
                  </Text>
                </TouchableOpacity>
              </View>

              {Platform.OS === 'web' && (
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        setImageUri(event.target.result);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              )}

              <TextInput
                style={[styles.descriptionInput, appleStyles.input]}
                placeholder="Add details (brand, condition, etc.)"
                placeholderTextColor={brandColors.textSecondary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity 
                style={[
                  styles.analyzeButton, 
                  appleStyles.primaryButton,
                  (!imageUri || loading) && styles.analyzeButtonDisabled
                ]}
                onPress={analyzeImage}
                disabled={!imageUri || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Feather name="search" size={20} color="#FFFFFF" />
                    <Text style={[styles.analyzeButtonText, appleStyles.buttonText]}>
                      Get Valuation
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <Animated.View 
              style={[
                styles.resultsSection,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }]
                }
              ]}
            >
              <View style={[styles.resultCard, appleStyles.card]}>
                <View style={styles.resultHeader}>
                  <Text style={[styles.itemName, appleStyles.title]}>
                    {analysisResult.item_name || 'Unknown Item'}
                  </Text>
                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={() => setShowShareModal(true)}
                  >
                    <Feather name="share-2" size={20} color={brandColors.primary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.priceSection}>
                  <Text style={styles.priceLabel}>Estimated Value</Text>
                  <Text style={[styles.priceValue, appleStyles.largeTitle]}>
                    ${analysisResult.estimated_value || '0'}
                  </Text>
                  {renderPriceRangeBar()}
                </View>

                <View style={styles.metricsGrid}>
                  <View style={styles.metricCard}>
                    <View style={styles.metricHeader}>
                      <Feather name="shield" size={16} color={brandColors.primary} />
                      <Text style={styles.metricLabel}>Authenticity</Text>
                    </View>
                    <Text style={styles.metricValue}>
                      {analysisResult.real_score || analysisResult.authenticity || 'Unknown'}
                      {analysisResult.real_score && '%'}
                    </Text>
                  </View>

                  <View style={styles.metricCard}>
                    <View style={styles.metricHeader}>
                      <Feather name="trending-up" size={16} color={brandColors.primary} />
                      <Text style={styles.metricLabel}>Market Trend</Text>
                    </View>
                    <Text style={styles.metricValue}>
                      {analysisResult.market_trend || analysisResult.trending_score || 'Stable'}
                      {analysisResult.trending_score && '/100'}
                    </Text>
                  </View>
                </View>

                {analysisResult.key_points && (
                  <View style={styles.keyPointsSection}>
                    <Text style={styles.sectionTitle}>Key Insights</Text>
                    {analysisResult.key_points.map((point, index) => (
                      <View key={index} style={styles.keyPoint}>
                        <Feather name="check-circle" size={16} color={brandColors.success} />
                        <Text style={styles.keyPointText}>{point}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {analysisResult.platforms && analysisResult.platforms.length > 0 && (
                  <View style={styles.platformsSection}>
                    <Text style={styles.sectionTitle}>Best Places to Sell</Text>
                    <View style={styles.platformsGrid}>
                      {analysisResult.platforms.map((platform, index) => (
                        <View key={index} style={styles.platformBadge}>
                          <Text style={styles.platformName}>{platform}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={[styles.actionButton, appleStyles.secondaryButton]}
                    onPress={resetAnalysis}
                  >
                    <Feather name="refresh-cw" size={18} color={brandColors.primary} />
                    <Text style={[styles.actionButtonText, { color: brandColors.primary }]}>
                      Scan Another Item
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.actionButton, appleStyles.primaryButton]}
                    onPress={shareResults}
                  >
                    <Feather name="share" size={18} color="#FFFFFF" />
                    <Text style={[styles.actionButtonText, appleStyles.buttonText]}>
                      Share Results
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          )}
        </KeyboardAvoidingView>
      </ScrollView>

      {/* Camera Modal */}
      <Modal
        visible={showCamera}
        animationType="slide"
        onRequestClose={() => setShowCamera(false)}
      >
        <View style={styles.cameraContainer}>
          {Platform.OS === 'web' ? (
            <View style={styles.webCameraContainer}>
              <video
                ref={cameraRef}
                style={styles.webCamera}
                autoPlay
                playsInline
              />
              <View style={styles.cameraControls}>
                <TouchableOpacity
                  style={styles.captureButton}
                  onPress={() => {
                    if (cameraRef.current) {
                      const canvas = document.createElement('canvas');
                      canvas.width = cameraRef.current.videoWidth;
                      canvas.height = cameraRef.current.videoHeight;
                      canvas.getContext('2d').drawImage(cameraRef.current, 0, 0);
                      canvas.toBlob((blob) => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setImageUri(reader.result);
                          setShowCamera(false);
                        };
                        reader.readAsDataURL(blob);
                      });
                    }
                  }}
                >
                  <View style={styles.captureButtonInner} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.closeCameraButton}
                  onPress={() => setShowCamera(false)}
                >
                  <Feather name="x" size={30} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Camera
              style={styles.camera}
              type={cameraType}
              ref={cameraRef}
            >
              <View style={styles.cameraControls}>
                <TouchableOpacity
                  style={styles.flipButton}
                  onPress={() => {
                    setCameraType(
                      cameraType === Camera.Constants.Type.back
                        ? Camera.Constants.Type.front
                        : Camera.Constants.Type.back
                    );
                  }}
                >
                  <Feather name="rotate-cw" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.captureButton}
                  onPress={takePicture}
                >
                  <View style={styles.captureButtonInner} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.closeCameraButton}
                  onPress={() => setShowCamera(false)}
                >
                  <Feather name="x" size={30} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </Camera>
          )}
        </View>
      </Modal>

      {/* History Modal */}
      <Modal
        visible={showHistory}
        animationType="slide"
        onRequestClose={() => setShowHistory(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, appleStyles.title]}>History</Text>
            <View style={styles.modalHeaderButtons}>
              {analysisHistory.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={clearHistory}
                >
                  <Feather name="trash-2" size={20} color={brandColors.danger} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowHistory(false)}
              >
                <Feather name="x" size={24} color={brandColors.text} />
              </TouchableOpacity>
            </View>
          </View>
          
          <ScrollView style={styles.historyList}>
            {analysisHistory.length === 0 ? (
              <View style={styles.emptyState}>
                <Feather name="inbox" size={48} color={brandColors.textSecondary} />
                <Text style={styles.emptyStateText}>No history yet</Text>
              </View>
            ) : (
              analysisHistory.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.historyItem, appleStyles.card]}
                  onPress={() => {
                    setSelectedHistoryItem(item);
                    setShowHistory(false);
                    setAnalysisResult(item.result);
                    setImageUri(item.imageUri);
                    setDescription(item.description);
                  }}
                >
                  <Image 
                    source={{ uri: item.imageUri }} 
                    style={styles.historyThumbnail} 
                  />
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyItemName}>
                      {item.result.item_name || 'Unknown Item'}
                    </Text>
                    <Text style={styles.historyItemValue}>
                      ${item.result.estimated_value || '0'}
                    </Text>
                    <Text style={styles.historyItemDate}>
                      {new Date(item.timestamp).toLocaleDateString()}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={20} color={brandColors.textSecondary} />
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <FlippiBot
          isVisible={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          initialDecision={feedbackDecision}
          analysisId={currentAnalysisId}
          analysisResult={analysisResult}
        />
      )}

      {/* Share Modal */}
      {showShareModal && analysisResult && (
        <ShareModal
          isVisible={showShareModal}
          onClose={() => setShowShareModal(false)}
          result={analysisResult}
          imageUri={imageUri}
          pricePaid={pricePaid}
          onPricePaidChange={setPricePaid}
        />
      )}

      {/* Hidden canvas for image generation */}
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
        width={1080}
        height={1080}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brandColors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    paddingBottom: 10,
  },
  logo: {
    width: 120,
    height: 40,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  historyButton: {
    padding: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  uploadSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: brandColors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: brandColors.textSecondary,
    marginBottom: 30,
    textAlign: 'center',
  },
  scanLimitBadge: {
    backgroundColor: brandColors.warning + '20',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  scanLimitText: {
    color: brandColors.warning,
    fontSize: 14,
    fontWeight: '600',
  },
  imageUploadArea: {
    width: '100%',
    maxWidth: 400,
    height: 300,
    borderWidth: 2,
    borderColor: brandColors.border,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  uploadPrompt: {
    alignItems: 'center',
  },
  uploadText: {
    fontSize: 18,
    color: brandColors.text,
    marginTop: 16,
    fontWeight: '600',
  },
  uploadSubtext: {
    fontSize: 14,
    color: brandColors.textSecondary,
    marginTop: 4,
  },
  imagePreviewContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: 8,
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: brandColors.primary,
    borderRadius: 12,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  descriptionInput: {
    width: '100%',
    maxWidth: 400,
    minHeight: 80,
    borderWidth: 1,
    borderColor: brandColors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: brandColors.primary,
    borderRadius: 12,
    minWidth: 200,
  },
  analyzeButtonDisabled: {
    opacity: 0.5,
  },
  analyzeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  resultsSection: {
    flex: 1,
    paddingVertical: 20,
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  itemName: {
    fontSize: 24,
    fontWeight: '700',
    color: brandColors.text,
    flex: 1,
  },
  shareButton: {
    padding: 8,
  },
  priceSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  priceLabel: {
    fontSize: 16,
    color: brandColors.textSecondary,
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 48,
    fontWeight: '700',
    color: brandColors.primary,
  },
  priceRangeContainer: {
    width: '100%',
    marginTop: 16,
  },
  priceRangeBar: {
    height: 8,
    backgroundColor: brandColors.background,
    borderRadius: 4,
    position: 'relative',
    marginBottom: 8,
  },
  priceRangeTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: '100%',
    backgroundColor: brandColors.primary + '30',
    borderRadius: 4,
  },
  priceRangeIndicator: {
    position: 'absolute',
    width: 16,
    height: 16,
    backgroundColor: brandColors.primary,
    borderRadius: 8,
    top: -4,
    marginLeft: -8,
  },
  priceRangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceRangeLabel: {
    fontSize: 12,
    color: brandColors.textSecondary,
  },
  priceRangeEstimated: {
    fontWeight: '600',
    color: brandColors.primary,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    backgroundColor: brandColors.background,
    padding: 16,
    borderRadius: 12,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 14,
    color: brandColors.textSecondary,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '600',
    color: brandColors.text,
  },
  keyPointsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: brandColors.text,
    marginBottom: 12,
  },
  keyPoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  keyPointText: {
    flex: 1,
    fontSize: 16,
    color: brandColors.text,
    lineHeight: 22,
  },
  platformsSection: {
    marginBottom: 24,
  },
  platformsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  platformBadge: {
    backgroundColor: brandColors.primary + '20',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  platformName: {
    fontSize: 14,
    fontWeight: '500',
    color: brandColors.primary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Camera styles
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  webCameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webCamera: {
    width: '100%',
    maxWidth: 600,
    height: 'auto',
  },
  cameraControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  flipButton: {
    padding: 20,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFFFFF',
    padding: 5,
  },
  captureButtonInner: {
    flex: 1,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000',
  },
  closeCameraButton: {
    padding: 20,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: brandColors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: brandColors.border,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: brandColors.text,
  },
  modalHeaderButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  clearButton: {
    padding: 8,
  },
  closeButton: {
    padding: 8,
  },
  historyList: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyStateText: {
    fontSize: 18,
    color: brandColors.textSecondary,
    marginTop: 16,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  historyThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 16,
  },
  historyInfo: {
    flex: 1,
  },
  historyItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: brandColors.text,
    marginBottom: 4,
  },
  historyItemValue: {
    fontSize: 18,
    fontWeight: '700',
    color: brandColors.primary,
    marginBottom: 4,
  },
  historyItemDate: {
    fontSize: 14,
    color: brandColors.textSecondary,
  },
});