import React from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  TouchableWithoutFeedback
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import PricingPage from '../screens/PricingPage';
import { brandColors } from '../theme/brandColors';

const PricingModal = ({ visible, onClose, onSelectPlan }) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                accessibilityLabel="Close pricing"
                accessibilityRole="button"
              >
                <Feather name="x" size={24} color={brandColors.textSecondary} />
              </TouchableOpacity>
              
              <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <PricingPage 
                  navigation={{ goBack: onClose }}
                  onSelectPlan={onSelectPlan}
                />
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: brandColors.background,
    borderRadius: Platform.OS === 'web' ? 16 : 0,
    width: Platform.OS === 'web' ? '90%' : '100%',
    maxWidth: Platform.OS === 'web' ? 800 : undefined,
    height: Platform.OS === 'web' ? '85%' : '100%',
    marginTop: Platform.OS === 'web' ? 0 : Platform.OS === 'ios' ? 50 : 0,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 16 : Platform.OS === 'ios' ? 60 : 16,
    right: 16,
    zIndex: 10,
    padding: 8,
    backgroundColor: brandColors.background,
    borderRadius: 20,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  scrollView: {
    flex: 1,
  },
});

export default PricingModal;