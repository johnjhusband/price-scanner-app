// Flippi.ai Brand Color System - The Resale Revolution
// Sustainable, Empowering, Community-Driven

export const brandColors = {
  // Primary Palette - Earth & Prosperity
  soil: '#1F2937',              // Rich earth black for grounding
  forest: '#065F46',            // Deep forest green - sustainability
  leaf: '#10B981',              // Fresh leaf green - growth & money
  honey: '#F59E0B',             // Warm honey - valuable finds
  sunset: '#DC2626',            // Sunset red - urgent action
  ocean: '#0891B2',             // Ocean blue - trust & clarity
  cream: '#FFFBEB',             // Warm cream background
  sand: '#FEF3C7',              // Light sand for sections
  stone: '#6B7280',             // Natural stone for secondary
  
  // Legacy mappings for compatibility
  slateTeal: '#6B7280',         // Maps to stone
  deepTeal: '#065F46',          // Maps to forest
  softCream: '#FEF3C7',         // Maps to sand
  offWhite: '#FFFBEB',          // Maps to cream
  matteGold: '#F59E0B',         // Maps to honey
  mutedGraphite: '#1F2937',     // Maps to soil
  softTaupeBeige: '#E5E7EB',    // Light border
  
  // Semantic colors
  success: '#10B981',           // Leaf - planet & profit win!
  warning: '#F59E0B',           // Honey - opportunity alert
  error: '#DC2626',             // Sunset - take action
  info: '#0891B2',              // Ocean - knowledge is power
  
  // Legacy color mappings (for compatibility)
  charcoalGray: '#0A0A0A',      // Maps to trueBlack
  lightGray: '#D6C6B5',         // Maps to softTaupeBeige
  slateBlueGray: '#0A3D5C',     // Maps to deepOceanBlue
  actionPurple: '#FF6B6B',      // Maps to livingCoral for CTA buttons
  actionPurpleHover: '#FF5252', // Darker coral for hover state
  successGreen: '#87A96B',      // Maps to sageGreen for success
  
  // Additional 2025 colors
  error: '#E53E3E',             // Error states
  warning: '#DD6B20',           // Warning states
  info: '#3182CE',              // Info states
  
  // Text Colors
  primaryText: '#1F2937',       // Main text (soil)
  secondaryText: '#6B7280',     // Notes, smaller UI (stone)
  disabledText: '#D1D5DB',      // Inactive states
  
  // Favicon Background
  faviconBg: '#065F46',         // Favicon background color (forest)
  
  // App Background
  background: '#FBF8F2',        // Off-white background for luxury feel
  surface: '#F3EFEA',           // Soft cream for cards and results
  
  // UI Elements
  border: '#F3E8D5',            // Natural border
  borderFocus: '#10B981',       // Leaf focus
  
  // Additional colors for specific uses
  text: '#1F2937',              // Alias for primaryText
  textSecondary: '#6B7280',     // Alias for secondaryText
  primary: '#065F46',           // Primary action color (forest)
  accent: '#10B981',            // Accent color (leaf)
  
  // Shadows
  shadowLight: 'rgba(0, 0, 0, 0.05)',
  shadowMedium: 'rgba(0, 0, 0, 0.1)',
  shadowDark: 'rgba(0, 0, 0, 0.2)',
};

export const typography = {
  // Single font family for consistency
  fontFamily: 'Poppins, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  
  // Keep same fonts for backward compatibility
  headingFont: 'Poppins, -apple-system, sans-serif',
  bodyFont: 'Poppins, -apple-system, sans-serif',
  monoFont: '"SF Mono", Monaco, Consolas, monospace',
  
  weights: {
    light: '300',
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
    extraBold: '800'
  },
  sizes: {
    logo: 'custom',
    h1: '36px',
    h2: '28px',
    h3: '24px',
    body: '16px',
    small: '14px',
    notes: '12px'
  },
  lineHeight: {
    tight: '1.2',
    normal: '1.5',
    relaxed: '1.6',
    loose: '1.8'
  }
};

// Button styling constants - Movement Design
export const buttonStyles = {
  primary: {
    backgroundColor: brandColors.leaf,
    color: '#FFFFFF',
    hoverBackground: brandColors.forest,
  },
  secondary: {
    backgroundColor: brandColors.sand,
    color: brandColors.forest,
    hoverBackground: brandColors.cream,
  },
  accent: {
    backgroundColor: brandColors.leaf,
    color: '#FFFFFF', 
    hoverBackground: brandColors.forest,
  },
  borderRadius: '8px',
  padding: {
    horizontal: '24px',
    vertical: '12px',
  },
  minHeight: '48px',
  minWidth: '120px',
  fontWeight: '600',
};

// Component-specific colors - 2025 update
export const componentColors = {
  uploadArea: {
    border: brandColors.border,
    background: brandColors.sand,
    hoverBorder: brandColors.leaf,
    hoverBackground: brandColors.cream,
  },
  results: {
    background: brandColors.softCream,
    border: brandColors.border,
  },
  scores: {
    high: brandColors.leaf,             // Earth & wallet win!
    medium: brandColors.honey,          // Worth considering
    low: brandColors.stone,             // Pass for now
  },
  trending: {
    hot: brandColors.livingCoral,       // Hot items
    warm: brandColors.warmMocha,        // Trending items
    cool: brandColors.digitalLavender,  // Niche items
  },
  authentication: {
    verified: brandColors.leaf,         // Authentic & sustainable
    uncertain: brandColors.honey,       // Research more
    low: brandColors.sunset,            // Red flag
  },
  movement: {
    impact: brandColors.leaf,           // Environmental impact
    community: brandColors.ocean,       // Community power
    value: brandColors.honey,           // True value found
  },
}; 