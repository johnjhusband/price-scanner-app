import React from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { 
  Card, 
  Title, 
  Paragraph, 
  Chip, 
  Surface, 
  useTheme,
  Button,
  Divider,
  IconButton
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';

export default function ResultsScreen({ route, navigation }) {
  const { analysisData, imageUri } = route.params;
  const theme = useTheme();

  const handleScanAnother = () => {
    navigation.navigate('Camera');
  };

  const handleGoHome = () => {
    navigation.navigate('Home');
  };

  const getConfidenceColor = (score) => {
    if (score >= 80) return theme.colors.primary;
    if (score >= 60) return '#FF9800';
    return theme.colors.error;
  };

  const getConfidenceText = (score) => {
    if (score >= 80) return 'High Confidence';
    if (score >= 60) return 'Medium Confidence';
    return 'Low Confidence';
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header with image and basic info */}
      <Surface style={styles.headerCard} elevation={4}>
        <View style={styles.headerContent}>
          <Image source={{ uri: imageUri }} style={styles.itemImage} />
          <View style={styles.itemInfo}>
            <Title style={styles.itemName}>{analysisData.item.name}</Title>
            <Paragraph style={styles.itemCategory}>{analysisData.item.category}</Paragraph>
            <Paragraph style={styles.itemBrand}>Brand: {analysisData.item.brand}</Paragraph>
            
            {/* Confidence Score */}
            <View style={styles.confidenceContainer}>
              <Chip 
                icon="check-circle"
                style={[styles.confidenceChip, { backgroundColor: getConfidenceColor(analysisData.confidence_score) }]}
                textStyle={{ color: 'white', fontWeight: 'bold' }}
              >
                {getConfidenceText(analysisData.confidence_score)} ({analysisData.confidence_score}%)
              </Chip>
            </View>
          </View>
        </View>
      </Surface>

      {/* Estimated Value */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryContainer]}
        style={styles.valueCard}
      >
        <View style={styles.valueContent}>
          <IconButton 
            icon="currency-usd" 
            size={32} 
            iconColor="white"
          />
          <Title style={styles.valueTitle}>Estimated Value</Title>
          <Title style={styles.valueAmount}>{analysisData.estimated_value}</Title>
        </View>
      </LinearGradient>

      {/* Platform Pricing */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Platform Pricing</Title>
          <View style={styles.pricingGrid}>
            {Object.entries(analysisData.pricing).map(([platform, price]) => (
              <Surface key={platform} style={styles.priceCard} elevation={2}>
                <View style={styles.priceContent}>
                  <Paragraph style={styles.platformName}>
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </Paragraph>
                  <Paragraph style={styles.priceText}>
                    {price === 'N/A' ? 'No data' : price}
                  </Paragraph>
                </View>
              </Surface>
            ))}
          </View>
        </Card.Content>
      </Card>

      {/* Condition Tips */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Condition Assessment Tips</Title>
          {analysisData.condition_tips.map((tip, index) => (
            <View key={index} style={styles.tipContainer}>
              <IconButton 
                icon="lightbulb-outline" 
                size={20} 
                iconColor={theme.colors.primary}
                style={styles.tipIcon}
              />
              <Paragraph style={styles.tipText}>{tip}</Paragraph>
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button
          mode="contained"
          onPress={handleScanAnother}
          style={[styles.actionButton, styles.primaryButton]}
          contentStyle={styles.buttonContent}
          icon="camera"
        >
          Scan Another Item
        </Button>
        
        <Button
          mode="outlined"
          onPress={handleGoHome}
          style={[styles.actionButton, styles.secondaryButton]}
          contentStyle={styles.buttonContent}
          icon="home"
        >
          Back to Home
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBFE',
  },
  headerCard: {
    margin: 16,
    borderRadius: 16,
  },
  headerContent: {
    flexDirection: 'row',
    padding: 16,
  },
  itemImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginRight: 16,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 2,
  },
  itemBrand: {
    fontSize: 14,
    marginBottom: 8,
  },
  confidenceContainer: {
    marginTop: 8,
  },
  confidenceChip: {
    alignSelf: 'flex-start',
  },
  valueCard: {
    margin: 16,
    borderRadius: 16,
    padding: 20,
  },
  valueContent: {
    alignItems: 'center',
  },
  valueTitle: {
    color: 'white',
    fontSize: 18,
    marginBottom: 8,
  },
  valueAmount: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  sectionCard: {
    margin: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  pricingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  priceCard: {
    width: '48%',
    marginBottom: 12,
    borderRadius: 8,
  },
  priceContent: {
    padding: 12,
    alignItems: 'center',
  },
  platformName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  priceText: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: '600',
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipIcon: {
    margin: 0,
    marginRight: 8,
    marginTop: -2,
  },
  tipText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  actionButtons: {
    padding: 16,
    gap: 12,
  },
  actionButton: {
    borderRadius: 25,
  },
  primaryButton: {
    marginBottom: 8,
  },
  secondaryButton: {
    marginBottom: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
}); 