import React from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { brandColors, typography } from '../theme/brandColors';

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
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.tagline}>Smarter Resale Starts Here.</Text>
          
          <Text style={styles.paragraph}>
            Flippi.ai is a mission-driven tool built to help resellers buy powerfully, resell faster, and make the most of their time and effort. Whether it's new with tags, vintage, or secondhand—Flippi brings clarity, confidence, and speed to every sourcing decision.
          </Text>
          
          <Text style={styles.sectionTitle}>With every scan, Flippi helps you:</Text>
          <View style={styles.benefitList}>
            <Text style={styles.benefitItem}>🔍 Instantly understand resale potential</Text>
            <Text style={styles.benefitItem}>📉 Avoid costly mistakes</Text>
            <Text style={styles.benefitItem}>♻️ Track your positive environmental impact</Text>
            <Text style={styles.benefitItem}>📈 Make faster, better decisions—on the spot</Text>
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
            <Text style={styles.sectionTitle}>Accessibility Commitment</Text>
            <Text style={styles.paragraph}>
              Flippi is designed to be accessible to everyone. We meet WCAG 2.1 color contrast standards, 
              provide keyboard navigation, and ensure our interface works for users with color blindness. 
              Our clean, high-contrast design helps users with visual impairments while maintaining simplicity for all.
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
    backgroundColor: brandColors.offWhite,
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
    fontSize: 36,
    fontFamily: typography.fontFamily,
    fontWeight: '600',
    color: brandColors.deepTeal,
  },
  closeButton: {
    padding: 10,
  },
  closeText: {
    fontSize: 24,
    color: brandColors.slateTeal,
    fontWeight: '300',
  },
  tagline: {
    fontSize: 18,
    fontFamily: typography.fontFamily,
    fontWeight: '300',
    fontStyle: 'italic',
    color: brandColors.slateTeal,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: typography.fontFamily,
    fontWeight: '500',
    color: brandColors.slateTeal,
    marginTop: 30,
    marginBottom: 15,
  },
  paragraph: {
    fontSize: 16,
    fontFamily: typography.fontFamily,
    lineHeight: 24,
    color: brandColors.mutedGraphite,
    marginBottom: 15,
  },
  benefitList: {
    marginBottom: 20,
  },
  benefitItem: {
    fontSize: 16,
    fontFamily: typography.fontFamily,
    lineHeight: 28,
    color: brandColors.mutedGraphite,
    paddingLeft: 10,
  },
  missionSection: {
    backgroundColor: brandColors.softCream,
    padding: 20,
    borderRadius: 8,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: brandColors.softTaupeBeige,
  },
  section: {
    marginVertical: 20,
  },
  contactSection: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: brandColors.softTaupeBeige,
  },
  link: {
    fontSize: 16,
    fontFamily: typography.fontFamily,
    fontWeight: '500',
    color: brandColors.deepTeal,
    textDecorationLine: 'underline',
    marginBottom: 10,
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: brandColors.softTaupeBeige,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    fontFamily: typography.fontFamily,
    color: brandColors.slateTeal,
    textAlign: 'center',
    marginBottom: 5,
  },
  italic: {
    fontStyle: 'italic',
  },
  bold: {
    fontWeight: '600',
  },
});

export default MissionModal;