import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Image } from 'react-native';
import FlippiLogo from './FlippiLogo';
import { brandColors, typography } from '../theme/brandColors';

const API_URL = Platform.OS === 'web' 
  ? '' // Same domain - nginx routes /api to backend
  : Platform.OS === 'ios'
    ? 'http://localhost:3000' // iOS simulator
    : 'http://10.0.2.2:3000'; // Android emulator

const EnterScreen = () => {
  const handleGoogleSignIn = () => {
    // Redirect to Google OAuth
    window.location.href = `${API_URL}/auth/google`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <FlippiLogo size="xlarge" />
        
        <Text style={styles.tagline}>Never Over Pay</Text>
        
        <Text style={styles.subtitle}>
          Know where to sell. Know what to pay.
        </Text>
        
        {/* Platform Section */}
        <View style={styles.platformSection}>
          <Text style={styles.platformTitle}>
            Best place to sell from all platforms
          </Text>
          
          <View style={styles.platformGrid}>
            {/* Regular Platforms */}
            <View style={styles.platformColumn}>
              <Text style={styles.platformCategory}>Marketplaces</Text>
              <Text style={styles.platformList}>
                eBay • Mercari • Poshmark{'\n'}
                Depop • TheRealReal • Vestiaire{'\n'}
                Grailed • StockX • GOAT
              </Text>
            </View>
            
            {/* Live Platforms */}
            <View style={styles.platformColumn}>
              <Text style={styles.platformCategory}>Live Selling</Text>
              <Text style={styles.platformList}>
                Whatnot • Instagram Live{'\n'}
                TikTok Shop • Facebook Live{'\n'}
                YouTube Live • Poshmark Live
              </Text>
            </View>
          </View>
        </View>
        
        {/* Hero Image */}
        {Platform.OS === 'web' && (
          <View style={styles.heroImageContainer}>
            <Image 
              source={require('../assets/HeroScreenshot.jpg')}
              style={styles.heroImage}
              resizeMode="contain"
            />
          </View>
        )}
        
        <View style={styles.enterSection}>
          <Text style={styles.welcomeText}>
            Join thousands of resellers making smarter decisions
          </Text>
          
          <TouchableOpacity 
            style={styles.googleButton}
            onPress={handleGoogleSignIn}
          >
            <View style={styles.googleButtonContent}>
              {/* Google G Logo */}
              <View style={styles.googleLogo}>
                <Text style={styles.googleG}>G</Text>
              </View>
              <Text style={styles.googleButtonText}>Enter with Google</Text>
            </View>
          </TouchableOpacity>
          
          <Text style={styles.securityNote}>
            Free to use • No credit card required
          </Text>
        </View>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          By entering, you agree to our{' '}
          <Text 
            style={styles.link}
            onPress={() => window.open('/terms', '_blank')}
          >
            Terms
          </Text>
          {' '}and{' '}
          <Text 
            style={styles.link}
            onPress={() => window.open('/privacy', '_blank')}
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  tagline: {
    fontSize: 28,
    fontWeight: typography.weights.bold,
    color: brandColors.mutedGraphite,
    marginTop: 20,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: brandColors.slateTeal,
    marginBottom: 40,
    textAlign: 'center',
  },
  platformSection: {
    backgroundColor: brandColors.softCream,
    padding: 30,
    borderRadius: 12,
    marginBottom: 30,
    width: '100%',
    maxWidth: 600,
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
    width: '100%',
    maxWidth: 500,
    height: 400,
    backgroundColor: brandColors.offWhite,
    borderRadius: 12,
    marginBottom: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  enterSection: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  welcomeText: {
    fontSize: 18,
    color: brandColors.textSecondary,
    marginBottom: 30,
    textAlign: 'center',
  },
  googleButton: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#dadce0',
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
    backgroundColor: '#4285f4',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleG: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  googleButtonText: {
    color: '#3c4043',
    fontSize: 16,
    fontWeight: '500',
  },
  securityNote: {
    fontSize: 12,
    color: brandColors.textSecondary,
    marginTop: 20,
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