import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { brandColors, typography } from '../theme/brandColors';
import { touchTargets, a11yLabels } from '../theme/accessibility';
import { Feather } from '@expo/vector-icons';

const FeedbackPrompt = ({ scanData, userDescription, imageData, onComplete }) => {
  const [helpedDecision, setHelpedDecision] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async () => {
    // Validate that user has either selected Yes/No or entered text
    if (helpedDecision === null && !feedbackText.trim()) {
      alert('Please select Yes/No or provide feedback');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get the backend URL based on environment
      const baseUrl = Platform.OS === 'web' 
        ? '' // Same domain - nginx routes /api to backend
        : 'http://localhost:3000';

      const response = await fetch(`${baseUrl}/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          helped_decision: helpedDecision,
          feedback_text: feedbackText.trim(),
          user_description: userDescription || '',
          image_data: imageData,
          scan_data: scanData
        })
      });

      const result = await response.json();

      if (result.success) {
        setIsSubmitted(true);
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 2000);
      } else {
        throw new Error(result.error || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Feedback submission error:', error);
      console.error('Error details:', error.message);
      alert(`Failed to submit feedback: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <View style={styles.container}>
        <View style={styles.successContent}>
          <Feather name="check-circle" size={24} color={brandColors.success} />
          <Text style={styles.successMessage}>
            Thanks for your feedback — we use every note to make the app better.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.question}>Did this result help you make a decision?</Text>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[
            styles.optionButton,
            helpedDecision === true && styles.selectedButton
          ]}
          onPress={() => setHelpedDecision(true)}
          disabled={isSubmitting}
        >
          <View style={styles.buttonContent}>
            <Feather 
              name="thumbs-up" 
              size={20} 
              color={helpedDecision === true ? brandColors.accent : brandColors.textSecondary} 
            />
            <Text style={[
              styles.buttonText,
              helpedDecision === true && styles.selectedButtonText
            ]}>Yes</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.optionButton,
            helpedDecision === false && styles.selectedButton
          ]}
          onPress={() => setHelpedDecision(false)}
          disabled={isSubmitting}
        >
          <View style={styles.buttonContent}>
            <Feather 
              name="thumbs-down" 
              size={20} 
              color={helpedDecision === false ? brandColors.accent : brandColors.textSecondary} 
            />
            <Text style={[
              styles.buttonText,
              helpedDecision === false && styles.selectedButtonText
            ]}>No</Text>
          </View>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.textInput}
        placeholder="Tell us what worked or didn't (optional)"
        placeholderTextColor={brandColors.disabledText}
        accessibilityLabel="Additional feedback text input"
        value={feedbackText}
        onChangeText={setFeedbackText}
        multiline
        numberOfLines={3}
        maxLength={500}
        editable={!isSubmitting}
      />

      {(helpedDecision !== null || feedbackText.trim()) && (
        <TouchableOpacity
          style={[
            styles.submitButton,
            isSubmitting && styles.disabledButton
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting || (!helpedDecision && !feedbackText.trim())}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: brandColors.surface,
    borderRadius: 14, // Apple style
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
    marginBottom: 20,
    color: brandColors.text,
    lineHeight: 27,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 20,
  },
  optionButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 14, // Apple style
    backgroundColor: brandColors.background,
    borderWidth: 1,
    borderColor: brandColors.border,
    minWidth: 120,
    minHeight: touchTargets.minimum, // WCAG touch target
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedButton: {
    borderColor: brandColors.accent,
    backgroundColor: brandColors.accentLight,
    borderWidth: 1.5,
  },
  buttonText: {
    fontSize: 17,
    fontFamily: typography.bodyFont,
    textAlign: 'center',
    color: brandColors.textSecondary,
  },
  selectedButtonText: {
    color: brandColors.accent,
    fontWeight: typography.weights.semiBold,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  successContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  textInput: {
    backgroundColor: brandColors.background,
    borderWidth: 1,
    borderColor: brandColors.border,
    borderRadius: 14, // Apple style
    padding: 16,
    fontSize: 17,
    fontFamily: typography.bodyFont,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 15,
    color: brandColors.text,
    lineHeight: 27,
  },
  submitButton: {
    backgroundColor: brandColors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14, // Apple style
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: touchTargets.recommended,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: brandColors.background,
    fontSize: 17,
    fontFamily: typography.bodyFont,
    fontWeight: typography.weights.semiBold,
    letterSpacing: typography.letterSpacing.wide,
  },
  successMessage: {
    fontSize: 17,
    fontFamily: typography.bodyFont,
    textAlign: 'center',
    color: brandColors.success,
    fontWeight: typography.weights.semiBold,
    paddingVertical: 20,
    lineHeight: 27,
  },
});

export default FeedbackPrompt;