import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, Title, Paragraph, useTheme } from 'react-native-paper';
import { analyzeImage } from '../services/apiService';

export default function CameraScreen({ navigation }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const theme = useTheme();

  const handleTestAnalysis = async () => {
    setIsAnalyzing(true);
    
    // For now, we'll simulate an analysis
    // In the full version, this would capture camera image
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Navigate to results with mock data
      navigation.navigate('Results', {
        analysisData: {
          item: {
            name: "Vintage Band T-Shirt",
            category: "Clothing",
            brand: "Unknown",
            description: "Black vintage band t-shirt in good condition",
            notable_features: ["Vintage", "Band merchandise"]
          },
          pricing: {
            ebay: "$15-25",
            facebook: "$10-20",
            poshmark: "$18-28",
            mercari: "$12-22",
            whatnot: "N/A"
          },
          condition_tips: [
            "Check for holes or stains",
            "Verify print quality and fading",
            "Examine seams and collar"
          ],
          estimated_value: "$15-25",
          market_insights: "Band t-shirts are popular on resale platforms",
          confidence_score: 85,
          platforms_with_data: ["ebay", "facebook", "poshmark", "mercari"],
          timestamp: new Date().toISOString()
        },
        imageUri: "https://via.placeholder.com/300x300/6200EE/FFFFFF?text=Sample+Item"
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to analyze image');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Title style={styles.title}>Camera Screen</Title>
        <Paragraph style={styles.description}>
          Camera functionality will be implemented here.
          For now, you can test with a sample analysis.
        </Paragraph>
        
        <Button
          mode="contained"
          onPress={handleTestAnalysis}
          loading={isAnalyzing}
          disabled={isAnalyzing}
          style={styles.button}
        >
          {isAnalyzing ? 'Analyzing...' : 'Test Analysis'}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBFE',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    marginBottom: 32,
    fontSize: 16,
    lineHeight: 24,
  },
  button: {
    borderRadius: 25,
    paddingHorizontal: 20,
  },
}); 