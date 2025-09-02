import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import FeedbackPrompt from './FeedbackPrompt';
import FlippiBot from './FlippiBot';
import { brandColors, typography } from '../theme/brandColors';

const FeedbackWrapper = ({ scanData, userDescription, imageData, onComplete }) => {
  const [useFlippiBot, setUseFlippiBot] = useState(true); // Default to FlippiBot
  const [initialDecision, setInitialDecision] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);

  // Initial thumbs up/down selection
  if (!showFeedback && useFlippiBot) {
    return (
      <View style={styles.container}>
        <Text style={styles.question}>Was this analysis helpful?</Text>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.thumbButton}
            onPress={() => {
              setInitialDecision(true);
              setShowFeedback(true);
            }}
          >
            <Text style={styles.thumbEmoji}>👍</Text>
            <Text style={styles.thumbText}>Yes</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.thumbButton}
            onPress={() => {
              setInitialDecision(false);
              setShowFeedback(true);
            }}
          >
            <Text style={styles.thumbEmoji}>👎</Text>
            <Text style={styles.thumbText}>No</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity
          style={styles.switchLink}
          onPress={() => setUseFlippiBot(false)}
        >
          <Text style={styles.switchText}>Use classic feedback form</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show the selected feedback interface
  if (useFlippiBot && showFeedback) {
    return (
      <FlippiBot
        scanData={scanData}
        userDescription={userDescription}
        imageData={imageData}
        onComplete={onComplete}
        initialDecision={initialDecision}
      />
    );
  }

  // Classic feedback form
  return (
    <View>
      <FeedbackPrompt
        scanData={scanData}
        userDescription={userDescription}
        imageData={imageData}
        onComplete={onComplete}
      />
      {!showFeedback && (
        <TouchableOpacity
          style={styles.switchLink}
          onPress={() => setUseFlippiBot(true)}
        >
          <Text style={styles.switchText}>Try FlippiBot instead 🤖</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: brandColors.surface,
    borderRadius: 14,
    marginTop: 20,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  question: {
    fontSize: 17,
    fontFamily: typography.bodyFont,
    fontWeight: typography.weights.semiBold,
    textAlign: 'center',
    marginBottom: 24,
    color: brandColors.text,
    lineHeight: 27,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    marginBottom: 20,
  },
  thumbButton: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    backgroundColor: brandColors.background,
    borderWidth: 1,
    borderColor: brandColors.border,
    minWidth: 100,
  },
  thumbEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  thumbText: {
    fontSize: 16,
    fontWeight: typography.weights.medium,
    color: brandColors.text,
  },
  switchLink: {
    alignItems: 'center',
    marginTop: 12,
    padding: 8,
  },
  switchText: {
    fontSize: 14,
    color: brandColors.primary,
    textDecorationLine: 'underline',
  },
});

export default FeedbackWrapper;