import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Image, ScrollView } from 'react-native';
import FlippiLogo from './FlippiLogo';
import { brandColors, typography } from '../theme/brandColors';

const API_URL = Platform.OS === 'web' 
  ? '' // Same domain - nginx routes /api to backend
  : Platform.OS === 'ios'
    ? 'http://localhost:3000' // iOS simulator
    : 'http://10.0.2.2:3000'; // Android emulator

const EnterScreen = () => {
  const [isHovering, setIsHovering] = useState(false);
  const [isOfferHovering, setIsOfferHovering] = useState(false);
  
  const handleGoogleSignIn = () => {
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
        
        {/* Value Propositions */}
        <View style={styles.valueProps}>
          <View style={styles.valueProp}>
            <Text style={styles.valueIcon}>💰</Text>
            <Text style={styles.valueTitle}>Accurate Pricing</Text>
            <Text style={styles.valueDesc}>Know the real value</Text>
          </View>
          <View style={styles.valueProp}>
            <Text style={styles.valueIcon}>🔍</Text>
            <Text style={styles.valueTitle}>Authenticity Scores</Text>
            <Text style={styles.valueDesc}>Avoid fake items</Text>
          </View>
          <View style={styles.valueProp}>
            <Text style={styles.valueIcon}>📈</Text>
            <Text style={styles.valueTitle}>Platform Match</Text>
            <Text style={styles.valueDesc}>Maximize your profit</Text>
          </View>
        </View>
        
        {/* Hero Image */}
        {Platform.OS === 'web' && (
          <View style={styles.heroImageContainer}>
            <Image 
              source={require('../assets/flippiapp2.png')}
              style={styles.heroImage}
              resizeMode="contain"
              onError={(e) => console.error('Hero image failed to load:', e.nativeEvent.error)}
            />
            <Text style={styles.testimonial}>
              "Sold in 24 hours thanks to Flippi!"
            </Text>
          </View>
        )}
        
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
          
          <View style={styles.trustIndicators}>
            <Text style={styles.trustItem}>✓ 30-second setup</Text>
            <Text style={styles.trustItem}>✓ Unlimited scans</Text>
            <Text style={styles.trustItem}>✓ All features included</Text>
          </View>
          
          <Text style={styles.socialProof}>
            Flippi uses AI to analyze pricing trends from 15+ resale marketplaces.
          </Text>
        </View>
        
        {/* Platform Section - Moved below login */}
        <View style={styles.platformSection}>
          <Text style={styles.platformTitle}>
            Works with 15+ major reselling platforms
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
              <Text style={styles.logoText}>TheRealReal</Text>
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
        </Text>
      </View>
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
    justifyContent: 'flex-start', // Start from top instead of center
    padding: Platform.OS === 'web' ? 40 : 20,
    paddingTop: 0, // Header section handles top padding
    paddingBottom: 100, // Space for footer
  },
  headerSection: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: Platform.OS === 'web' ? 40 : 20,
    paddingTop: Platform.OS === 'web' ? 40 : 10,
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
    color: brandColors.mutedGraphite,
    marginTop: 30,
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 18,
    color: brandColors.slateTeal,
    marginBottom: Platform.OS === 'web' ? 20 : 10,
    textAlign: 'center',
  },
  offerBanner: {
    backgroundColor: brandColors.matteGold,
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 8, // Rounded square instead of pill
    marginBottom: 15, // Reduced from 30
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    ...(Platform.OS === 'web' && {
      transition: 'all 0.2s ease',
      cursor: 'pointer',
    }),
  },
  offerBannerHover: {
    backgroundColor: '#B09756', // Darker gold
    transform: [{ scale: 1.02 }],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  offerText: {
    color: brandColors.offWhite,
    fontSize: 15,
    fontWeight: typography.weights.semiBold,
  },
  platformSection: {
    backgroundColor: brandColors.softCream,
    padding: 30,
    borderRadius: 12,
    marginTop: 40, // Space from login section
    marginBottom: 40,
    width: Platform.OS === 'web' ? '90%' : '100%',
    maxWidth: 900, // Generous limit
  },
  platformTitle: {
    fontSize: 20,
    fontWeight: typography.weights.semiBold,
    color: brandColors.deepTeal,
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
    color: brandColors.mutedGraphite,
    marginBottom: 10,
  },
  platformList: {
    fontSize: 14,
    color: brandColors.slateTeal,
    textAlign: 'center',
    lineHeight: 22,
  },
  heroImageContainer: {
    width: Platform.OS === 'web' ? '80%' : '100%',
    maxWidth: 600,
    marginBottom: 40,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: {
    width: '100%',
    height: 400, // Fixed height for consistent display
    borderRadius: 20, // Just add rounded corners
  },
  testimonial: {
    fontSize: 16,
    fontStyle: 'italic',
    color: brandColors.slateTeal,
    marginTop: 15,
    textAlign: 'center',
  },
  valueProps: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: Platform.OS === 'web' ? '80%' : '100%',
    maxWidth: 700,
    marginTop: 25, // Reduced from 40
    marginBottom: 30, // Reduced from 40
  },
  valueProp: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 10,
  },
  valueIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  valueTitle: {
    fontSize: 16,
    fontWeight: typography.weights.semiBold,
    color: brandColors.deepTeal,
    marginBottom: 5,
    textAlign: 'center',
  },
  valueDesc: {
    fontSize: 13,
    color: brandColors.slateTeal,
    textAlign: 'center',
  },
  trustIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    gap: 20,
  },
  trustItem: {
    fontSize: 14,
    color: brandColors.slateTeal,
  },
  socialProof: {
    fontSize: 14,
    color: brandColors.mutedGraphite,
    marginTop: 15,
    marginBottom: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  platformLogoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 15,
    marginTop: 20,
  },
  platformLogo: {
    backgroundColor: brandColors.offWhite,
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
    color: brandColors.slateTeal,
  },
  enterSection: {
    alignItems: 'center',
    width: Platform.OS === 'web' ? '60%' : '100%',
    maxWidth: 600, // Reasonable limit for readability
  },
  googleButton: {
    backgroundColor: brandColors.deepTeal, // Brand color
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: Platform.OS === 'web' ? 24 : 16,
    width: Platform.OS === 'web' ? '100%' : '90%',
    minWidth: 220, // Ensure button is wide enough for text
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    ...(Platform.OS === 'web' && {
      transition: 'all 0.2s ease',
      cursor: 'pointer',
    }),
  },
  googleButtonHover: {
    backgroundColor: '#174B49', // Darker teal
    transform: [{ scale: 1.02 }],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
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
    color: brandColors.deepTeal,
    fontSize: 16,
    fontWeight: 'bold',
  },
  googleButtonText: {
    color: '#FFFFFF', // White text on deep teal
    fontSize: Platform.OS === 'web' ? 16 : 15,
    fontWeight: typography.weights.semiBold,
  },
  securityNote: {
    fontSize: 12,
    color: brandColors.slateTeal,
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