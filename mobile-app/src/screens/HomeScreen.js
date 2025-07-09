import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert, Platform } from 'react-native';
import { 
  Button, 
  Card, 
  Title, 
  Paragraph, 
  Surface,
  useTheme,
  IconButton,
  Divider
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { checkServerHealth, getCurrentApiUrl } from '../services/apiService';

export default function HomeScreen({ navigation }) {
  const theme = useTheme();
  const [isServerConnected, setIsServerConnected] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkConnection = async () => {
    try {
      await checkServerHealth();
      setIsServerConnected(true);
    } catch (error) {
      setIsServerConnected(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await checkConnection();
    setIsRefreshing(false);
  };

  const handleScanPress = () => {
    if (isServerConnected === false) {
      Alert.alert(
        'Connection Error',
        `Unable to connect to server. Please ensure the backend is running at ${getCurrentApiUrl()}`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    // For web platform, navigate to FilePicker screen instead of Camera
    if (Platform.OS === 'web') {
      navigation.navigate('FilePicker');
    } else {
      navigation.navigate('Camera');
    }
  };

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          colors={[theme.colors.primary]}
        />
      }
    >
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryContainer]}
        style={styles.headerGradient}
      >
        <Animatable.View animation="fadeInDown" duration={1000}>
          <View style={styles.headerContent}>
            <IconButton 
              icon="camera-outline" 
              size={60} 
              iconColor={theme.colors.onPrimary}
            />
            <Title style={[styles.headerTitle, { color: theme.colors.onPrimary }]}>
              My Thrifting Buddy
            </Title>
            <Paragraph style={[styles.headerSubtitle, { color: theme.colors.onPrimary }]}>
              Discover the resale value of secondhand items instantly
            </Paragraph>
          </View>
        </Animatable.View>
      </LinearGradient>

      <View style={styles.content}>
        <Animatable.View animation="fadeInUp" duration={1000} delay={300}>
          <Surface style={styles.scanCard} elevation={4}>
            <Card.Content style={styles.scanCardContent}>
              <IconButton 
                icon="camera" 
                size={48} 
                iconColor={theme.colors.primary}
                style={styles.scanIcon}
              />
              <Title style={styles.scanTitle}>Ready to Scan?</Title>
              <Paragraph style={styles.scanDescription}>
                Point your camera at any item to get instant price estimates from multiple platforms
              </Paragraph>
              <Button
                mode="contained"
                onPress={handleScanPress}
                style={styles.scanButton}
                contentStyle={styles.scanButtonContent}
                icon="camera"
              >
                Start Scanning
              </Button>
            </Card.Content>
          </Surface>
          
          {isServerConnected === false && (
            <Surface style={styles.warningCard} elevation={2}>
              <Card.Content>
                <View style={styles.warningRow}>
                  <IconButton 
                    icon="alert-circle" 
                    size={24} 
                    iconColor={theme.colors.error}
                  />
                  <View style={styles.warningText}>
                    <Paragraph style={styles.warningMessage}>
                      Backend server not connected
                    </Paragraph>
                    <Paragraph style={styles.warningDetail}>
                      Pull down to refresh
                    </Paragraph>
                  </View>
                </View>
              </Card.Content>
            </Surface>
          )}
        </Animatable.View>

        <Animatable.View animation="fadeInUp" duration={1000} delay={600}>
          <Title style={styles.sectionTitle}>How It Works</Title>
          
          <Card style={styles.featureCard}>
            <Card.Content>
              <View style={styles.featureRow}>
                <IconButton 
                  icon="camera-outline" 
                  size={32} 
                  iconColor={theme.colors.primary}
                />
                <View style={styles.featureText}>
                  <Title style={styles.featureTitle}>1. Capture</Title>
                  <Paragraph>Take a photo of the item you want to price</Paragraph>
                </View>
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.featureCard}>
            <Card.Content>
              <View style={styles.featureRow}>
                <IconButton 
                  icon="brain" 
                  size={32} 
                  iconColor={theme.colors.primary}
                />
                <View style={styles.featureText}>
                  <Title style={styles.featureTitle}>2. Analyze</Title>
                  <Paragraph>AI identifies the item and searches current market prices</Paragraph>
                </View>
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.featureCard}>
            <Card.Content>
              <View style={styles.featureRow}>
                <IconButton 
                  icon="chart-line" 
                  size={32} 
                  iconColor={theme.colors.primary}
                />
                <View style={styles.featureText}>
                  <Title style={styles.featureTitle}>3. Price</Title>
                  <Paragraph>Get estimates from eBay, Poshmark, Facebook & more</Paragraph>
                </View>
              </View>
            </Card.Content>
          </Card>
        </Animatable.View>

        <Animatable.View animation="fadeInUp" duration={1000} delay={900}>
          <Divider style={styles.divider} />
          
          <Title style={styles.sectionTitle}>Supported Platforms</Title>
          
          <View style={styles.platformsGrid}>
            {['eBay', 'Poshmark', 'Facebook', 'Mercari', 'WhatNot'].map((platform, index) => (
              <Surface key={platform} style={styles.platformChip} elevation={2}>
                <Paragraph style={styles.platformText}>{platform}</Paragraph>
              </Surface>
            ))}
          </View>
        </Animatable.View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBFE',
  },
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 10,
  },
  headerSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.9,
  },
  content: {
    padding: 20,
    marginTop: -20,
  },
  scanCard: {
    borderRadius: 16,
    marginBottom: 30,
  },
  scanCardContent: {
    alignItems: 'center',
    padding: 20,
  },
  scanIcon: {
    marginBottom: 10,
  },
  scanTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  scanDescription: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
    lineHeight: 24,
  },
  scanButton: {
    borderRadius: 25,
    paddingHorizontal: 20,
  },
  scanButtonContent: {
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    marginTop: 10,
  },
  featureCard: {
    marginBottom: 12,
    borderRadius: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
    marginLeft: 10,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  divider: {
    marginVertical: 20,
  },
  platformsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  platformChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
    minWidth: '30%',
    alignItems: 'center',
  },
  platformText: {
    fontSize: 14,
    fontWeight: '500',
  },
  warningCard: {
    borderRadius: 12,
    marginTop: 12,
    backgroundColor: '#FFF3E0',
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningText: {
    flex: 1,
  },
  warningMessage: {
    fontWeight: 'bold',
    color: '#E65100',
  },
  warningDetail: {
    fontSize: 12,
    color: '#BF360C',
    marginTop: 2,
  },
}); 