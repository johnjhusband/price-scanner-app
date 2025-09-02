import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated
} from 'react-native';
import { brandColors, typography } from '../theme/brandColors';
import { Feather } from '@expo/vector-icons';
import useVoiceInput from '../hooks/useVoiceInput';

const FlippiBot = ({ scanData, userDescription, imageData, onComplete, initialDecision }) => {
  const [messages, setMessages] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conversationComplete, setConversationComplete] = useState(false);
  const scrollViewRef = useRef();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  const { isSupported, isListening, error: voiceError, startListening, stopListening } = useVoiceInput();

  // Initialize conversation based on thumbs up/down
  useEffect(() => {
    const initialMessage = {
      id: Date.now(),
      type: 'bot',
      text: initialDecision === true 
        ? "Great to hear it helped! Want to share what worked well?"
        : initialDecision === false
        ? "Thanks for the feedback! Want to share what didn't work?"
        : "Thanks for checking out Flippi! Want to share your thoughts?",
      timestamp: new Date()
    };
    
    setMessages([initialMessage]);
    
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true
    }).start();
  }, [initialDecision]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const addMessage = (text, type = 'user') => {
    const newMessage = {
      id: Date.now() + Math.random(),
      type,
      text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };

  const getBotResponse = (userMessage, messageHistory) => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Decision tree based on user input
    if (messageHistory.length === 2) { // First user response
      if (lowerMessage.includes('price') || lowerMessage.includes('value')) {
        return {
          text: "I see it's about the pricing. Was it the estimated value, the price range, or how we calculated it?",
          expectingMore: true
        };
      } else if (lowerMessage.includes('wrong') || lowerMessage.includes('incorrect')) {
        return {
          text: "Got it. What seemed off - the item identification, condition assessment, or something else?",
          expectingMore: true
        };
      } else if (lowerMessage.includes('great') || lowerMessage.includes('accurate')) {
        return {
          text: "Awesome! Anything specific that stood out or that we could make even better?",
          expectingMore: true
        };
      } else {
        return {
          text: "Thanks for sharing that! Anything else you'd like us to know?",
          expectingMore: true
        };
      }
    } else if (messageHistory.length === 4) { // Second user response
      if (lowerMessage.includes('brand') || lowerMessage.includes('condition')) {
        return {
          text: "That's really helpful feedback about the " + 
                (lowerMessage.includes('brand') ? 'brand recognition' : 'condition assessment') + 
                ". We'll use this to improve. Thanks for helping make Flippi better! 🙏",
          expectingMore: false
        };
      } else if (lowerMessage.includes('no') || lowerMessage.length < 10) {
        return {
          text: "Thanks for taking the time to share your thoughts! Every bit helps us improve. 🙏",
          expectingMore: false
        };
      } else {
        return {
          text: "This is super valuable feedback! We'll definitely look into this. Thanks for helping us improve Flippi! 🙏",
          expectingMore: false
        };
      }
    } else {
      // Final response
      return {
        text: "Thanks for the great conversation! Your feedback helps us make Flippi better for everyone. 🙏",
        expectingMore: false
      };
    }
  };

  const handleSend = async () => {
    if (!currentInput.trim() || isTyping || conversationComplete) return;
    
    const userMessage = currentInput.trim();
    setCurrentInput('');
    
    // Add user message
    addMessage(userMessage, 'user');
    
    // Show typing indicator
    setIsTyping(true);
    
    // Simulate thinking time
    setTimeout(() => {
      const response = getBotResponse(userMessage, messages);
      addMessage(response.text, 'bot');
      setIsTyping(false);
      
      if (!response.expectingMore) {
        // Conversation complete, prepare to submit
        setTimeout(() => {
          submitFeedback();
        }, 1500);
      }
    }, 1000 + Math.random() * 1000); // 1-2 second delay
  };

  const submitFeedback = async () => {
    setIsSubmitting(true);
    setConversationComplete(true);
    
    // Compile conversation into feedback text
    const conversation = messages
      .filter(m => m.type === 'user')
      .map(m => m.text)
      .join(' ');
    
    try {
      const baseUrl = Platform.OS === 'web' ? '' : 'http://localhost:3000';
      
      const response = await fetch(`${baseUrl}/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysis_id: scanData?.analysis_id || `analysis_${Date.now()}`,
          helped_decision: initialDecision,
          feedback_text: conversation,
          user_description: userDescription || '',
          image_data: imageData ? imageData.replace(/^data:image\/[a-z]+;base64,/, '') : imageData,
          scan_data: scanData,
          conversation_history: messages // Store full conversation
        })
      });

      const result = await response.json();

      if (result.success) {
        addMessage("Thanks! Your feedback has been submitted.", 'bot');
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 2000);
      } else {
        throw new Error(result.error || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Feedback submission error:', error);
      addMessage("Oops! Something went wrong submitting your feedback. Please try again.", 'bot');
      setIsSubmitting(false);
      setConversationComplete(false);
    }
  };

  const handleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening((transcript) => {
        setCurrentInput(prevText => {
          const separator = prevText && !prevText.endsWith(' ') ? ' ' : '';
          return prevText + separator + transcript;
        });
      });
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.header}>
        <View style={styles.botInfo}>
          <View style={styles.botAvatar}>
            <Text style={styles.botAvatarText}>🤖</Text>
          </View>
          <Text style={styles.botName}>FlippiBot</Text>
        </View>
      </View>
      
      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map((message) => (
          <View 
            key={message.id}
            style={[
              styles.messageRow,
              message.type === 'user' && styles.userMessageRow
            ]}
          >
            <View style={[
              styles.messageBubble,
              message.type === 'user' ? styles.userBubble : styles.botBubble
            ]}>
              <Text style={[
                styles.messageText,
                message.type === 'user' && styles.userMessageText
              ]}>
                {message.text}
              </Text>
            </View>
          </View>
        ))}
        
        {isTyping && (
          <View style={styles.messageRow}>
            <View style={styles.botBubble}>
              <View style={styles.typingIndicator}>
                <View style={[styles.typingDot, { animationDelay: '0ms' }]} />
                <View style={[styles.typingDot, { animationDelay: '200ms' }]} />
                <View style={[styles.typingDot, { animationDelay: '400ms' }]} />
              </View>
            </View>
          </View>
        )}
      </ScrollView>
      
      {!conversationComplete && (
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.inputContainer}
        >
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={currentInput}
              onChangeText={setCurrentInput}
              placeholder="Type your message..."
              placeholderTextColor={brandColors.disabledText}
              onSubmitEditing={handleSend}
              editable={!isTyping}
              multiline
              maxLength={300}
            />
            
            {isSupported && Platform.OS === 'web' && (
              <TouchableOpacity
                style={[styles.voiceButton, isListening && styles.voiceButtonActive]}
                onPress={handleVoiceInput}
                disabled={isTyping}
              >
                <Feather 
                  name={isListening ? "mic-off" : "mic"} 
                  size={20} 
                  color={isListening ? "#FFFFFF" : brandColors.text} 
                />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.sendButton, (!currentInput.trim() || isTyping) && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!currentInput.trim() || isTyping}
            >
              <Feather name="send" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          {voiceError && (
            <Text style={styles.voiceError}>{voiceError}</Text>
          )}
        </KeyboardAvoidingView>
      )}
      
      {isSubmitting && (
        <View style={styles.submittingOverlay}>
          <ActivityIndicator size="large" color={brandColors.primary} />
          <Text style={styles.submittingText}>Submitting feedback...</Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brandColors.surface,
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 20,
    marginHorizontal: 10,
    maxHeight: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    backgroundColor: brandColors.background,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: brandColors.border,
  },
  botInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: brandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  botAvatarText: {
    fontSize: 18,
  },
  botName: {
    fontSize: 17,
    fontWeight: typography.weights.semiBold,
    color: brandColors.text,
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messagesContent: {
    paddingBottom: 20,
  },
  messageRow: {
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  userMessageRow: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  botBubble: {
    backgroundColor: brandColors.background,
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: brandColors.primary,
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    color: brandColors.text,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  typingIndicator: {
    flexDirection: 'row',
    gap: 4,
    paddingVertical: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: brandColors.textSecondary,
    opacity: 0.6,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: brandColors.border,
    backgroundColor: brandColors.background,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: brandColors.surface,
    borderWidth: 1,
    borderColor: brandColors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    minHeight: 40,
    maxHeight: 100,
    color: brandColors.text,
  },
  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: brandColors.surface,
    borderWidth: 1,
    borderColor: brandColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceButtonActive: {
    backgroundColor: brandColors.error,
    borderColor: brandColors.error,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: brandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  voiceError: {
    color: brandColors.error,
    fontSize: 12,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  submittingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submittingText: {
    marginTop: 12,
    fontSize: 16,
    color: brandColors.textSecondary,
  },
});

// Add typing animation
if (Platform.OS === 'web') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes typing {
      0% { opacity: 0.3; transform: translateY(0); }
      50% { opacity: 1; transform: translateY(-2px); }
      100% { opacity: 0.3; transform: translateY(0); }
    }
    
    [style*="animationDelay"] {
      animation: typing 1.4s infinite;
    }
  `;
  document.head.appendChild(style);
}

export default FlippiBot;