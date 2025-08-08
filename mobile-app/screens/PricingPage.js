import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Linking
} from 'react-native';
import { Check, X } from 'lucide-react-native';
import { brandColors } from '../theme/brandColors';
import PageContainer from '../components/PageContainer';

const PricingPage = ({ navigation, onSelectPlan }) => {
  const handlePlanSelect = (planType) => {
    if (onSelectPlan) {
      onSelectPlan(planType);
    } else {
      // TODO: Integrate with Stripe checkout
      console.log('Selected plan:', planType);
      alert('Payment integration coming soon!');
    }
  };

  const PricingTier = ({ 
    title, 
    price, 
    period, 
    features, 
    limitations, 
    ctaText, 
    ctaAction, 
    highlighted = false,
    badge = null 
  }) => (
    <View style={[
      styles.pricingCard,
      highlighted && styles.pricingCardHighlighted
    ]}>
      {badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      
      <Text style={styles.tierTitle}>{title}</Text>
      <View style={styles.priceContainer}>
        <Text style={styles.price}>{price}</Text>
        {period && <Text style={styles.period}>{period}</Text>}
      </View>
      
      <View style={styles.featuresContainer}>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <Check size={20} color={brandColors.success} />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
        
        {limitations && limitations.map((limitation, index) => (
          <View key={`limit-${index}`} style={styles.featureRow}>
            <X size={20} color={brandColors.textSecondary} />
            <Text style={[styles.featureText, styles.limitationText]}>
              {limitation}
            </Text>
          </View>
        ))}
      </View>
      
      <TouchableOpacity
        style={[
          styles.ctaButton,
          highlighted && styles.ctaButtonHighlighted
        ]}
        onPress={ctaAction}
      >
        <Text style={[
          styles.ctaText,
          highlighted && styles.ctaTextHighlighted
        ]}>
          {ctaText}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const FAQItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    
    return (
      <TouchableOpacity
        style={styles.faqItem}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text style={styles.faqQuestion}>{question}</Text>
        {isOpen && <Text style={styles.faqAnswer}>{answer}</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <PageContainer>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          {navigation && (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
          )}
          
          <Text style={styles.title}>Flippi Pricing</Text>
          <Text style={styles.subtitle}>
            Know what it's worth — instantly. Start free. Upgrade when you're ready.
          </Text>
        </View>

        <View style={styles.pricingGrid}>
          <PricingTier
            title="🎁 Free Plan"
            price="$0"
            features={[
              "20 flips included",
              "Real Score, resale value, platform recs",
              "No sign-up required"
            ]}
            limitations={["Limited to 20 total scans"]}
            ctaText="Start flipping — free"
            ctaAction={() => handlePlanSelect('free')}
          />

          <PricingTier
            title="💳 Pay As You Go"
            price="$1"
            period="for 5 flips"
            features={[
              "Get 5 additional scans for just $1",
              "Great for occasional flippers or curious shoppers",
              "No subscription, no strings"
            ]}
            ctaText="Get 5 flips for $1"
            ctaAction={() => handlePlanSelect('single')}
          />

          <PricingTier
            title="✨ Flippi Pro"
            price="$9"
            period="/month"
            features={[
              "Unlimited flips",
              "Downloadable resale images",
              "Full Real Score access",
              "Best platform recommendations",
              "Priority access to new features"
            ]}
            ctaText="Subscribe to Pro"
            ctaAction={() => handlePlanSelect('pro')}
            highlighted={true}
            badge="BEST VALUE"
          />
        </View>

        <View style={styles.faqSection}>
          <Text style={styles.faqTitle}>FAQ</Text>
          
          <FAQItem
            question="Can I scan more after 20 flips?"
            answer="Yes — you can pay $1 for 5 more flips or go Pro for unlimited access."
          />
          
          <FAQItem
            question="Will I lose access to my past flips?"
            answer="Nope. Your past scans are saved, even if you don't upgrade."
          />
          
          <FAQItem
            question="What if I cancel?"
            answer="You'll keep access through your billing cycle. No reactivation fee."
          />
          
          <FAQItem
            question="Is my payment information secure?"
            answer="Yes! We use Stripe for secure payment processing. Your card details never touch our servers."
          />
          
          <FAQItem
            question="Can I switch between plans?"
            answer="Absolutely! You can upgrade to Pro anytime, and we'll credit any flip pack purchases from the current month."
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Questions? Email us at support@flippi.ai
          </Text>
        </View>
      </ScrollView>
    </PageContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brandColors.background,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  backText: {
    color: brandColors.primary,
    fontSize: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: brandColors.text,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: brandColors.textSecondary,
    textAlign: 'center',
    maxWidth: 500,
  },
  pricingGrid: {
    padding: 20,
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 20,
  },
  pricingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: brandColors.border,
    flex: Platform.OS === 'web' ? 1 : undefined,
    minWidth: Platform.OS === 'web' ? 300 : undefined,
    maxWidth: Platform.OS === 'web' ? 350 : undefined,
    position: 'relative',
  },
  pricingCardHighlighted: {
    borderColor: brandColors.primary,
    borderWidth: 2,
    transform: Platform.OS === 'web' ? [{ scale: 1.05 }] : [],
  },
  badge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: brandColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tierTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: brandColors.text,
    marginBottom: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 24,
  },
  price: {
    fontSize: 36,
    fontWeight: 'bold',
    color: brandColors.text,
  },
  period: {
    fontSize: 18,
    color: brandColors.textSecondary,
    marginLeft: 4,
  },
  featuresContainer: {
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    marginLeft: 12,
    fontSize: 16,
    color: brandColors.text,
    flex: 1,
  },
  limitationText: {
    color: brandColors.textSecondary,
  },
  ctaButton: {
    backgroundColor: brandColors.background,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: brandColors.border,
  },
  ctaButtonHighlighted: {
    backgroundColor: brandColors.primary,
    borderColor: brandColors.primary,
  },
  ctaText: {
    fontSize: 18,
    fontWeight: '600',
    color: brandColors.text,
  },
  ctaTextHighlighted: {
    color: '#ffffff',
  },
  faqSection: {
    padding: 20,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  faqTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: brandColors.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  faqItem: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: brandColors.border,
  },
  faqQuestion: {
    fontSize: 18,
    fontWeight: '600',
    color: brandColors.text,
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 16,
    color: brandColors.textSecondary,
    lineHeight: 24,
  },
  footer: {
    padding: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    color: brandColors.textSecondary,
  },
});

export default PricingPage;