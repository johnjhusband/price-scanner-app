import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Platform,
  TouchableWithoutFeedback,
  ActivityIndicator
} from 'react-native';
import { X, Unlock, Sparkles } from 'lucide-react-native';
import { brandColors } from '../theme/brandColors';

const UpgradeModal = ({ 
  isVisible, 
  onClose, 
  onSelectPayment,
  currentFlipCount = 3,
  isProcessing = false 
}) => {
  const handlePaymentSelect = (type) => {
    if (onSelectPayment) {
      onSelectPayment(type);
    }
  };

  const PaymentOption = ({ 
    icon, 
    title, 
    price, 
    description, 
    onPress, 
    isPrimary = false,
    badge = null 
  }) => (
    <TouchableOpacity
      style={[
        styles.paymentOption,
        isPrimary && styles.paymentOptionPrimary
      ]}
      onPress={onPress}
      disabled={isProcessing}
    >
      {badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      
      <View style={styles.optionHeader}>
        <Text style={styles.optionIcon}>{icon}</Text>
        <View style={styles.optionTitleContainer}>
          <Text style={[
            styles.optionTitle,
            isPrimary && styles.optionTitlePrimary
          ]}>
            {title}
          </Text>
          <Text style={[
            styles.optionPrice,
            isPrimary && styles.optionPricePrimary
          ]}>
            {price}
          </Text>
        </View>
      </View>
      
      <Text style={[
        styles.optionDescription,
        isPrimary && styles.optionDescriptionPrimary
      ]}>
        {description}
      </Text>
      
      <View style={[
        styles.optionButton,
        isPrimary && styles.optionButtonPrimary
      ]}>
        <Text style={[
          styles.optionButtonText,
          isPrimary && styles.optionButtonTextPrimary
        ]}>
          {isProcessing ? 'Processing...' : 
           isPrimary ? 'Subscribe to Flippi Pro' : 'Unlock for $1'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                disabled={isProcessing}
              >
                <X size={24} color={brandColors.textSecondary} />
              </TouchableOpacity>

              <View style={styles.header}>
                <Text style={styles.headerIcon}>👋</Text>
                <Text style={styles.title}>You've used your 3 free flips!</Text>
                <Text style={styles.subtitle}>
                  To unlock full results (resale value, Real Score, and platform tips), 
                  choose one of the following:
                </Text>
              </View>

              <View style={styles.optionsContainer}>
                <PaymentOption
                  icon="🔓"
                  title="Unlock This Flip"
                  price="$1 one-time"
                  description="Instantly see this item's value"
                  onPress={() => handlePaymentSelect('single')}
                />

                <PaymentOption
                  icon="✨"
                  title="Go Pro"
                  price="$9/month unlimited flips"
                  description="Full access to resale value, Real Score, platforms, downloads"
                  onPress={() => handlePaymentSelect('pro')}
                  isPrimary={true}
                  badge="BEST VALUE"
                />
              </View>

              {isProcessing && (
                <View style={styles.processingOverlay}>
                  <ActivityIndicator size="large" color={brandColors.primary} />
                </View>
              )}

              <TouchableOpacity
                style={styles.learnMoreLink}
                onPress={() => {
                  onClose();
                  // TODO: Navigate to pricing page
                }}
                disabled={isProcessing}
              >
                <Text style={styles.learnMoreText}>
                  Learn more about pricing
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
      },
    }),
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: brandColors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: brandColors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 400,
  },
  optionsContainer: {
    gap: 16,
  },
  paymentOption: {
    borderWidth: 1,
    borderColor: brandColors.border,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    position: 'relative',
  },
  paymentOptionPrimary: {
    borderColor: brandColors.primary,
    borderWidth: 2,
    backgroundColor: brandColors.background,
  },
  badge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: brandColors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  optionTitleContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: brandColors.text,
  },
  optionTitlePrimary: {
    color: brandColors.primary,
  },
  optionPrice: {
    fontSize: 16,
    color: brandColors.textSecondary,
    marginTop: 2,
  },
  optionPricePrimary: {
    color: brandColors.primary,
    fontWeight: '600',
  },
  optionDescription: {
    fontSize: 14,
    color: brandColors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  optionDescriptionPrimary: {
    color: brandColors.text,
  },
  optionButton: {
    backgroundColor: brandColors.background,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: brandColors.border,
  },
  optionButtonPrimary: {
    backgroundColor: brandColors.primary,
    borderColor: brandColors.primary,
  },
  optionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: brandColors.text,
  },
  optionButtonTextPrimary: {
    color: '#ffffff',
  },
  learnMoreLink: {
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 8,
  },
  learnMoreText: {
    fontSize: 14,
    color: brandColors.primary,
    textDecorationLine: 'underline',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
});

export default UpgradeModal;