import React from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking, Platform } from 'react-native';
import { brandColors, typography } from '../theme/brandColors';
import { focusStyles, a11yLabels, ariaRoles } from '../theme/accessibility';
import { Feather, MaterialIcons } from '@expo/vector-icons';

const MissionModal = ({ visible, onClose }) => {
  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Our Mission</Text>
            <TouchableOpacity 
              onPress={onClose} 
              style={styles.closeButton}
              accessibilityLabel={a11yLabels.closeButton}
              accessibilityRole="button"
            >
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.tagline}>Smarter Resale Starts Here.</Text>
          
          <Text style={styles.paragraph}>
            Flippi.ai is a mission-driven tool built to help resellers buy powerfully, resell faster, and make the most of their time and effort. Whether it's new with tags, vintage, or secondhand—Flippi brings clarity, confidence, and speed to every sourcing decision.
          </Text>
          
          <Text style={styles.sectionTitle}>With every scan, Flippi helps you:</Text>
          <View style={styles.benefitList}>
            <View style={styles.benefitRow}>
              <Feather name="search" size={20} color={brandColors.accent} />
              <Text style={styles.benefitItem}>Instantly understand resale potential</Text>
            </View>
            <View style={styles.benefitRow}>
              <Feather name="trending-down" size={20} color={brandColors.accent} />
              <Text style={styles.benefitItem}>Avoid costly mistakes</Text>
            </View>
            <View style={styles.benefitRow}>
              <MaterialIcons name="eco" size={20} color={brandColors.accent} />
              <Text style={styles.benefitItem}>Track your positive environmental impact</Text>
            </View>
            <View style={styles.benefitRow}>
              <Feather name="trending-up" size={20} color={brandColors.accent} />
              <Text style={styles.benefitItem}>Make faster, better decisions—on the spot</Text>
            </View>
          </View>
          
          <View style={styles.missionSection}>
            <Text style={styles.sectionTitle}>Why Flippi Exists</Text>
            <Text style={styles.paragraph}>
              I know what it's like to scan a rack and wonder,{'\n'}
              <Text style={styles.italic}>"Shall I buy this? Will it make money?"</Text>{'\n'}
              Flippi exists to answer that question—fast.
            </Text>
            
            <Text style={styles.paragraph}>
              Not every item is secondhand. Some come from truckloads, estate sales, or our own closets. But the mission is the same:
            </Text>
            
            <Text style={[styles.paragraph, styles.bold]}>
              Support smarter buying. Keep good products in circulation. Help the planet—while turning a profit.
            </Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Flippi's Authentication Philosophy</Text>
            <Text style={styles.paragraph}>
              Flippi uses computer vision to give you a Real Score — a percentage-based confidence rating powered by AI.
            </Text>
            <Text style={styles.paragraph}>
              We analyze visual cues from a single photo, including logo placement, stitching patterns, shapes, and known design elements. It's not authentication — it's signal-based guidance. A fast, lightweight tool built to support smarter sourcing decisions, especially in the real-world chaos of thrifting, reselling, or flipping.
            </Text>
            <Text style={[styles.paragraph, styles.italic]}>
              We believe in buying authentic and building trust. This feature is here to help — not to certify. Use it as a first impression, not a final verdict.
            </Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Accessibility Commitment</Text>
            <Text style={styles.paragraph}>
              Flippi is designed to be accessible to everyone. Our interface uses high contrast colors 
              and clear visual indicators that work for users with color blindness. We're committed to 
              improving accessibility as we grow.
            </Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Powered by Boca Belle</Text>
            <Text style={styles.paragraph}>
              Flippi.ai is based in Boca Raton, Florida and operated by John and Tara Husband LLC, doing business as Boca Belle.
            </Text>
          </View>
          
          <View style={styles.contactSection}>
            <Text style={styles.sectionTitle}>Contact</Text>
            <TouchableOpacity onPress={() => Linking.openURL('mailto:teamflippi@gmail.com')}>
              <Text style={styles.link}>Email: teamflippi@gmail.com</Text>
            </TouchableOpacity>
            <Text style={styles.paragraph}>Have feedback, ideas, or questions? Reach out.</Text>
          </View>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Flippi™ and Flippi.ai™ are trademarks of Boca Belle. All rights reserved.
            </Text>
            <Text style={[styles.footerText, styles.italic]}>
              Not for children under 13
            </Text>
            <Text style={[styles.footerText, styles.italic]}>
              *ai can make mistakes. check important info.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brandColors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 48,
    fontFamily: typography.headingFont,
    fontWeight: typography.weights.bold,
    color: brandColors.text,
    letterSpacing: typography.letterSpacing.tight,
  },
  closeButton: {
    padding: 12,
    minWidth: 44, // WCAG touch target
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    ...(Platform.OS === 'web' && {
      ':focus': focusStyles,
      cursor: 'pointer',
    }),
  },
  closeText: {
    fontSize: 28,
    color: brandColors.textSecondary,
    fontWeight: typography.weights.light,
  },
  tagline: {
    fontSize: 17,
    fontFamily: typography.bodyFont,
    fontWeight: typography.weights.light,
    fontStyle: 'italic',
    color: brandColors.textSecondary,
    marginBottom: 30,
    lineHeight: 27,
  },
  sectionTitle: {
    fontSize: 28,
    fontFamily: typography.headingFont,
    fontWeight: typography.weights.semiBold,
    color: brandColors.text,
    marginTop: 30,
    marginBottom: 15,
    letterSpacing: typography.letterSpacing.tight,
  },
  paragraph: {
    fontSize: 17,
    fontFamily: typography.bodyFont,
    lineHeight: 27,
    color: brandColors.text,
    marginBottom: 15,
    letterSpacing: typography.letterSpacing.normal,
  },
  benefitList: {
    marginBottom: 20,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitItem: {
    fontSize: 17,
    fontFamily: typography.bodyFont,
    lineHeight: 31,
    color: brandColors.text,
    paddingLeft: 10,
    flex: 1,
  },
  missionSection: {
    backgroundColor: brandColors.surface,
    padding: 24,
    borderRadius: 14, // Apple style
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  section: {
    marginVertical: 20,
  },
  contactSection: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: brandColors.border,
  },
  link: {
    fontSize: 17,
    fontFamily: typography.bodyFont,
    fontWeight: typography.weights.medium,
    color: brandColors.accent,
    textDecorationLine: 'underline',
    marginBottom: 10,
    minHeight: 44, // WCAG touch target
    justifyContent: 'center',
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: brandColors.border,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontFamily: typography.bodyFont,
    color: brandColors.textSecondary,
    textAlign: 'center',
    marginBottom: 5,
    lineHeight: 25,
  },
  italic: {
    fontStyle: 'italic',
  },
  bold: {
    fontWeight: typography.weights.semiBold,
  },
});

export default MissionModal;