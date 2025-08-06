import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Image, ScrollView, Dimensions } from 'react-native';
import FlippiLogo from './FlippiLogo';
import MissionModal from './MissionModal';
import { brandColors, typography } from '../theme/brandColors';

// Responsive design breakpoints
const { width: windowWidth } = Dimensions.get('window');
const isMobile = windowWidth < 768;
const isTablet = windowWidth >= 768 && windowWidth < 1024;
const isDesktop = windowWidth >= 1024;

const API_URL = Platform.OS === 'web' 
  ? '' // Same domain - nginx routes /api to backend
  : Platform.OS === 'ios'
    ? 'http://localhost:3000' // iOS simulator
    : 'http://10.0.2.2:3000'; // Android emulator

const EnterScreen = () => {
  const [isHovering, setIsHovering] = useState(false);
  const [isOfferHovering, setIsOfferHovering] = useState(false);
  const [showMissionModal, setShowMissionModal] = useState(false);
  
  const handleGoogleSignIn = () => {
    // Debug OAuth redirect
    console.log('[OAuth Debug] Starting Google Sign In...');
    console.log('[OAuth Debug] Platform:', Platform.OS);
    console.log('[OAuth Debug] Is Mobile:', isMobile);
    console.log('[OAuth Debug] Current URL:', window.location.href);
    console.log('[OAuth Debug] API_URL:', API_URL);
    console.log('[OAuth Debug] Redirect URL:', `${API_URL}/auth/google`);
    console.log('[OAuth Debug] User Agent:', navigator.userAgent);
    
    // Redirect to Google OAuth
    window.location.href = `${API_URL}/auth/google`;
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <FlippiLogo size="xlarge" />
          
          <Text style={styles.tagline}>Never Over Pay</Text>
          
          <Text style={styles.subtitle}>
            Know the price. Own the profit.
          </Text>
        </View>
        
        {/* Limited Time Offer */}
        <TouchableOpacity 
          style={[
            styles.offerBanner,
            isOfferHovering && styles.offerBannerHover
          ]}
          onPress={handleGoogleSignIn}
          onMouseEnter={() => Platform.OS === 'web' && setIsOfferHovering(true)}
          onMouseLeave={() => Platform.OS === 'web' && setIsOfferHovering(false)}
          activeOpacity={0.8}
        >
          <Text style={styles.offerText}>Start now. No card. Limited offer.</Text>
        </TouchableOpacity>
        
        {/* Hero Section with Image and Value Props */}
        <View style={styles.heroSection}>
          {/* Hero Image on left */}
          <View style={styles.heroImageContainer}>
            {Platform.OS === 'web' && (
              <>
                <Image 
                  source={require('../assets/flippiapp2.png')}
                  style={styles.heroImage}
                  resizeMode="contain"
                  onError={(e) => console.error('Hero image failed to load:', e.nativeEvent.error)}
                />
                <Text style={styles.testimonial}>
                  "Sold in 24 hours thanks to Flippi!"
                </Text>
              </>
            )}
          </View>
          
          {/* Value Propositions on right */}
          <View style={styles.valueProps}>
            <View style={styles.valueProp}>
              <Text style={styles.valueIcon}>💰</Text>
              <View style={styles.valueTextContainer}>
                <Text style={styles.valueTitle}>Accurate Pricing</Text>
                <Text style={styles.valueDesc}>Know the real value</Text>
              </View>
            </View>
            <View style={styles.valueProp}>
              <Text style={styles.valueIcon}>🔍</Text>
              <View style={styles.valueTextContainer}>
                <Text style={styles.valueTitle}>Authenticity Scores</Text>
                <Text style={styles.valueDesc}>Avoid fake items</Text>
              </View>
            </View>
            <View style={styles.valueProp}>
              <Text style={styles.valueIcon}>📈</Text>
              <View style={styles.valueTextContainer}>
                <Text style={styles.valueTitle}>Platform Match</Text>
                <Text style={styles.valueDesc}>Maximize your profit</Text>
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.enterSection}>
          <TouchableOpacity 
            style={[
              styles.googleButton,
              isHovering && styles.googleButtonHover
            ]}
            onPress={handleGoogleSignIn}
            onMouseEnter={() => Platform.OS === 'web' && setIsHovering(true)}
            onMouseLeave={() => Platform.OS === 'web' && setIsHovering(false)}
            activeOpacity={0.8}
          >
            <View style={styles.googleButtonContent}>
              {/* Google G Logo */}
              <View style={styles.googleLogo}>
                <Text style={styles.googleG}>G</Text>
              </View>
              <Text style={styles.googleButtonText}>Sign in with Google</Text>
            </View>
          </TouchableOpacity>
          
          <Text style={styles.securityNote}>
            Secure login. No password required.
          </Text>
          
        </View>
        
        {/* Platform Section - Moved below login */}
        <View style={styles.platformSection}>
          <Text style={styles.platformTitle}>
            Flippi scans millions of resale listings with AI spotting trends on 15+ marketplaces
          </Text>
          
          <View style={styles.platformLogoGrid}>
            <View style={styles.platformLogo}>
              <Text style={styles.logoText}>Whatnot</Text>
            </View>
            <View style={styles.platformLogo}>
              <Text style={styles.logoText}>eBay</Text>
            </View>
            <View style={styles.platformLogo}>
              <Text style={styles.logoText}>Poshmark</Text>
            </View>
            <View style={styles.platformLogo}>
              <Text style={styles.logoText}>Mercari</Text>
            </View>
            <View style={styles.platformLogo}>
              <Text style={styles.logoText}>Depop</Text>
            </View>
            <View style={styles.platformLogo}>
              <Text style={styles.logoText}>Vestiaire</Text>
            </View>
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          By entering, you agree to our{' '}
          <Text 
            style={styles.link}
            onPress={() => {
              if (Platform.OS === 'web') {
                window.open('/terms', '_blank');
              }
            }}
          >
            Terms
          </Text>
          {' '}and{' '}
          <Text 
            style={styles.link}
            onPress={() => {
              if (Platform.OS === 'web') {
                window.open('/privacy', '_blank');
              }
            }}
          >
            Privacy
          </Text>
          {' '}·{' '}
          <Text 
            style={styles.link}
            onPress={() => {
              if (Platform.OS === 'web') {
                window.location.href = 'mailto:teamflippi@gmail.com';
              }
            }}
          >
            Contact
          </Text>
          {' '}·{' '}
          <Text 
            style={styles.link}
            onPress={() => setShowMissionModal(true)}
          >
            Mission
          </Text>
        </Text>
      </View>
      
      <MissionModal 
        visible={showMissionModal} 
        onClose={() => setShowMissionModal(false)} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brandColors.background,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 20, // Same padding for all screen sizes
    paddingTop: 0,
    paddingBottom: 100,
  },
  headerSection: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: isMobile ? 20 : 40, // Responsive horizontal padding
    paddingTop: isMobile ? 10 : 40, // Responsive top padding
    paddingBottom: 30,
    marginBottom: 10,
    // Subtle luxury gradient - very soft transition
    backgroundColor: brandColors.background,
    ...(Platform.OS === 'web' && {
      background: `linear-gradient(180deg, rgba(251, 248, 242, 0.4) 0%, rgba(243, 239, 234, 0.2) 50%, transparent 100%)`,
    }),
  },
  tagline: {
    fontSize: 28,
    fontWeight: typography.weights.bold,
    color: brandColors.text,
    marginTop: 30,
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 18,
    color: brandColors.textSecondary,
    marginBottom: isMobile ? 10 : 20, // Responsive margin
    textAlign: 'center',
  },
  offerBanner: {
    backgroundColor: brandColors.accent,  // Apple blue
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 14, // Apple style radius
    marginBottom: 15,
    ...(Platform.OS === 'web' && {
      transition: 'all 0.2s ease',
      cursor: 'pointer',
    }),
  },
  offerBannerHover: {
    backgroundColor: '#0051D5', // Darker blue
    transform: [{ scale: 1.01 }],
  },
  offerText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: typography.weights.semiBold,
  },
  platformSection: {
    backgroundColor: '#F9FAFB',  // Very light gray
    padding: 30,
    borderRadius: 12,
    marginTop: 40, // Space from login section
    marginBottom: 40,
    width: isMobile ? '100%' : '90%', // Responsive width
    maxWidth: 900, // Generous limit
  },
  platformTitle: {
    fontSize: 20,
    fontWeight: typography.weights.semiBold,
    color: brandColors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  platformGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  platformColumn: {
    flex: 1,
    alignItems: 'center',
  },
  platformCategory: {
    fontSize: 16,
    fontWeight: typography.weights.semiBold,
    color: brandColors.text,
    marginBottom: 10,
  },
  platformList: {
    fontSize: 14,
    color: brandColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  heroSection: {
    flexDirection: isMobile ? 'column' : 'row', // Responsive flex direction
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    marginBottom: 40,
    gap: 30,
  },
  heroImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: {
    width: '100%',
    maxWidth: 350,
    height: 350,
    borderRadius: 20,
  },
  testimonial: {
    fontSize: 16,
    fontStyle: 'italic',
    color: brandColors.textSecondary,
    marginTop: 15,
    textAlign: 'center',
  },
  valueProps: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 12,
  },
  valueProp: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',  // Very light gray
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
    width: 240,
  },
  valueIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  valueTitle: {
    fontSize: 15,
    fontWeight: typography.weights.semiBold,
    color: brandColors.text,
    marginBottom: 2,
  },
  valueDesc: {
    fontSize: 12,
    color: brandColors.textSecondary,
  },
  valueTextContainer: {
    flex: 1,
  },
  platformLogoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 15,
    marginTop: 20,
  },
  platformLogo: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: brandColors.softTaupeBeige,
    minWidth: 120,
    alignItems: 'center',
  },
  logoText: {
    fontSize: 14,
    fontWeight: typography.weights.medium,
    color: brandColors.textSecondary,
  },
  enterSection: {
    alignItems: 'center',
    width: '100%',
  },
  googleButton: {
    backgroundColor: brandColors.primary, // Black
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    minWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    ...(Platform.OS === 'web' && {
      transition: 'all 0.2s ease',
      cursor: 'pointer',
    }),
  },
  googleButtonHover: {
    backgroundColor: '#1A1A1A', // Slightly lighter black
    transform: [{ scale: 1.01 }],
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleLogo: {
    width: 24,
    height: 24,
    marginRight: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleG: {
    color: '#4285F4', // Google blue
    fontSize: 16,
    fontWeight: 'bold',
  },
  googleButtonText: {
    color: '#FFFFFF', // White text on deep teal
    fontSize: isMobile ? 14 : 16, // Responsive font size
    fontWeight: typography.weights.semiBold,
    whiteSpace: 'nowrap', // Prevent text wrapping
  },
  securityNote: {
    fontSize: 12,
    color: brandColors.textSecondary,
    marginTop: 8,
    marginBottom: 20,
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: brandColors.textSecondary,
    textAlign: 'center',
  },
  link: {
    color: brandColors.primary,
    textDecorationLine: 'underline',
  },
});

export default EnterScreen;