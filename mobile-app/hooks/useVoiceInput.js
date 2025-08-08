import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';

const useVoiceInput = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Check if Web Speech API is supported
    if (Platform.OS === 'web') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        setIsSupported(true);
        
        // Create recognition instance
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;
        
        recognitionRef.current = recognition;
      }
    }
  }, []);

  const startListening = (onResult) => {
    if (!isSupported || !recognitionRef.current) {
      setError('Voice input is not supported on this browser');
      return;
    }

    const recognition = recognitionRef.current;
    
    // Clear any previous error
    setError(null);
    
    // Set up event handlers
    recognition.onstart = () => {
      console.log('[Voice] Started listening');
      setIsListening(true);
    };
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      console.log('[Voice] Transcript:', transcript);
      onResult(transcript);
      setIsListening(false);
    };
    
    recognition.onerror = (event) => {
      console.error('[Voice] Error:', event.error);
      let errorMessage = 'Voice input error';
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone access denied. Please allow microphone access.';
          break;
        case 'network':
          errorMessage = 'Network error. Please check your connection.';
          break;
        default:
          errorMessage = `Voice input error: ${event.error}`;
      }
      
      setError(errorMessage);
      setIsListening(false);
    };
    
    recognition.onend = () => {
      console.log('[Voice] Stopped listening');
      setIsListening(false);
    };
    
    // Start recognition
    try {
      recognition.start();
    } catch (error) {
      console.error('[Voice] Failed to start:', error);
      setError('Failed to start voice input');
      setIsListening(false);
    }
  };
  
  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('[Voice] Failed to stop:', error);
      }
      setIsListening(false);
    }
  };

  return {
    isSupported,
    isListening,
    error,
    startListening,
    stopListening
  };
};

export default useVoiceInput;