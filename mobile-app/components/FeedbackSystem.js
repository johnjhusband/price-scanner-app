import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { brandColors, typography } from '../theme/brandColors';
import FeedbackPrompt from './FeedbackPrompt';
import FlippiBot from './FlippiBot';

const FeedbackSystem = ({ scanData, userDescription, imageData, onComplete }) => {
  const [showChat, setShowChat] = useState(false);
  const [helpedDecision, setHelpedDecision] = useState(null);
  
  // Initial question: Did this help?
  if (helpedDecision === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>How did we do?</Text>
        <Text style={styles.subtitle}>Did this valuation help with your decision?</Text>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.decisionButton, styles.yesButton]}
            onPress={() => {
              setHelpedDecision(true);
              // If yes, just submit positive feedback
              if (onComplete) {
                // Quick submit positive feedback
                fetch('/api/feedback', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    analysis_id: scanData?.analysis_id || `analysis_${Date.now()}`,
                    helped_decision: true,
                    feedback_text: 'Helpful valuation',
                    scan_data: scanData
                  })
                }).then(() => onComplete());
              }
            }}
          >
            <Feather name="thumbs-up" size={24} color="#FFFFFF" />
            <Text style={styles.buttonText}>Yes, helpful!</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.decisionButton, styles.noButton]}
            onPress={() => {
              setHelpedDecision(false);
              // Show feedback options
            }}
          >
            <Feather name="thumbs-down" size={24} color="#FFFFFF" />
            <Text style={styles.buttonText}>Not really</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  // If they said no, show chat/form toggle
  if (helpedDecision === false && !showChat) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>We'd love to improve!</Text>
        <Text style={styles.subtitle}>How would you like to share feedback?</Text>
        
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => setShowChat(true)}
        >
          <Feather name="message-circle" size={20} color={brandColors.primary} />
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Chat with FlippiBot</Text>
            <Text style={styles.optionDescription}>Quick conversation about your experience</Text>
          </View>
          <Feather name="chevron-right" size={20} color={brandColors.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => {
            // Don't set showChat, just render FeedbackPrompt directly
            setShowChat(null);
          }}
        >
          <Feather name="edit-3" size={20} color={brandColors.primary} />
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Classic Form</Text>
            <Text style={styles.optionDescription}>Traditional feedback form</Text>
          </View>
          <Feather name="chevron-right" size={20} color={brandColors.textSecondary} />
        </TouchableOpacity>
      </View>
    );
  }
  
  // Show chosen feedback method
  if (showChat === true) {
    return (
      <FlippiBot
        scanData={scanData}
        userDescription={userDescription}
        imageData={imageData}
        onComplete={onComplete}
        initialSentiment="negative"
      />
    );
  } else if (showChat === null) {
    return (
      <FeedbackPrompt
        scanData={scanData}
        userDescription={userDescription}
        imageData={imageData}
        onComplete={onComplete}
        initialData={{ helped_decision: false }}
      />
    );
  }
  
  // Should not reach here
  return null;
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: typography.weights.bold,
    color: brandColors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: brandColors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  decisionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 8,
  },
  yesButton: {
    backgroundColor: brandColors.primary,
  },
  noButton: {
    backgroundColor: '#EF4444',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: typography.weights.semiBold,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: brandColors.border,
  },
  optionContent: {
    flex: 1,
    marginLeft: 12,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: typography.weights.semiBold,
    color: brandColors.text,
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 14,
    color: brandColors.textSecondary,
  },
});

export default FeedbackSystem;