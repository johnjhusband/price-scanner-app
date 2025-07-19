import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { brandColors } from '../theme/brandColors';

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

      console.log('Submitting feedback to:', `${baseUrl}/api/feedback`);
      
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

      console.log('Response status:', response.status);
      
      const result = await response.json();
      console.log('Response data:', result);

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
        <Text style={styles.successMessage}>
          ✅ Thanks for your feedback — we use every note to make the app better.
        </Text>
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
          <Text style={[
            styles.buttonText,
            helpedDecision === true && styles.selectedButtonText
          ]}>✅ Yes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.optionButton,
            helpedDecision === false && styles.selectedButton
          ]}
          onPress={() => setHelpedDecision(false)}
          disabled={isSubmitting}
        >
          <Text style={[
            styles.buttonText,
            helpedDecision === false && styles.selectedButtonText
          ]}>❌ No</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.textInput}
        placeholder="Tell us what worked or didn't (optional)"
        placeholderTextColor="#999"
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
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginTop: 20,
    marginHorizontal: 10,
  },
  question: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    color: brandColors.text,
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
    borderRadius: 25,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ddd',
    minWidth: 100,
  },
  selectedButton: {
    borderColor: brandColors.actionBlue,
    backgroundColor: '#F0F4FF',
  },
  buttonText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
  selectedButtonText: {
    color: brandColors.actionBlue,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 15,
  },
  submitButton: {
    backgroundColor: brandColors.actionBlue,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  successMessage: {
    fontSize: 16,
    textAlign: 'center',
    color: brandColors.successGreen,
    fontWeight: '600',
    paddingVertical: 20,
  },
});

export default FeedbackPrompt;