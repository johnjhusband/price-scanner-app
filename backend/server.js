const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { OpenAI } = require('openai');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const { initializeDatabase } = require('./database');
const { getEnvironmentalTagByItemName } = require('./utils/environmentalImpact');

// Load .env from shared location outside git directories
const envPath = path.join(__dirname, '../../shared/.env');
require('dotenv').config({ path: envPath });

// Environment variables are loaded from .env file

// Initialize database
try {
  initializeDatabase();
} catch (error) {
  console.error('\n=== DATABASE INITIALIZATION FAILED ===');
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
  console.error('Continuing without database - feedback will not work\n');
  // Continue running - database is only needed for feedback
}

const app = express();

// Setup legal pages BEFORE other middleware to ensure they're served correctly
const setupLegalPages = require('./setupLegalPages');
setupLegalPages(app);

// Enhanced multer configuration from v2.0
const upload = multer({ 
  memory: true,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Only allow 1 file
  },
  fileFilter: (req, file, cb) => {
    // Validate file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Environment validation
if (!process.env.OPENAI_API_KEY) {
  console.error('ERROR: OPENAI_API_KEY is not set in .env file');
  process.exit(1);
}

// Middleware
app.use(cors({
  origin: true, // Allow all origins - from blue fix
  credentials: true
}));

// Session configuration for OAuth
app.use(session({
  secret: process.env.SESSION_SECRET || 'default-session-secret-change-this',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());



// Configure body parsers with increased limits
// Using explicit body-parser to ensure limits are applied
const { jsonParser, urlencodedParser, bodyParserLogger } = require('./middleware/bodyParser');
app.use(bodyParserLogger);
app.use(jsonParser);
app.use(urlencodedParser);

// Add request timing middleware from v2.0
app.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});

// OpenAI setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Enhanced health check from v2.0
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '2.0',
    features: {
      imageAnalysis: true,
      cameraSupport: true,
      pasteSupport: true,
      dragDropSupport: true,
      enhancedAI: true
    }
  });
});

// Enhanced image analysis endpoint
app.post('/api/scan', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No image provided',
        hint: 'Please select an image file, take a photo, or paste an image'
      });
    }

    // Get the user prompt/description from the form data
    const userPrompt = req.body.userPrompt || req.body.description || '';

    // Process the image file

    // Validate file size
    if (req.file.size > 10 * 1024 * 1024) {
      return res.status(400).json({ 
        error: 'File too large',
        hint: 'Please use an image smaller than 10MB'
      });
    }

    // Get image buffer
    const imageBuffer = req.file.buffer;
    
    // Enhanced OpenAI Vision API prompt from v2.0
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `${userPrompt ? `User says: ${userPrompt}\n\n` : ''}You are an expert authentication specialist and resale value appraiser in 2025. 

REAL SCORE ASSESSMENT: Analyze visual signals to provide a confidence rating. For luxury brands, examine:
- Logo placement and clarity
- Stitching patterns and quality
- Design elements and proportions
- Material appearance
- Overall craftsmanship
- Interior tags and labels

Adjust for real-world conditions:
- Poor lighting: +10-15 points if key features visible
- Cluttered background: +5-10 points if item is distinguishable
- Off-angle photos: +5-10 points if brand markers present

REPLICA PENALTIES (CRITICAL):
- Excessive logo repetition/density: -20 to -30 points
- Non-core brand colorways (bright/unusual): -15 to -25 points
- No visible interior tags: CAP at 50 max
- Perfect logos with poor construction: -30 points
- DHGate/AliExpress style presentation: -40 points

For items scoring below 70:
- Do NOT suggest authentication platforms (The RealReal, Vestiaire)
- Use "Craft Fair" or "Personal Use" only
- Provide "Clean with care" as selling tip

Round final score to nearest 5. This is signal-based guidance, not authentication.

Analyze this item and provide: 1) What the item is, 2) Estimated resale value range based on CURRENT 2025 market conditions, 3) Style tier (Entry, Designer, or Luxury based on brand/quality), 4) Best STANDARD platform to list it on (eBay, Poshmark, Facebook Marketplace, Mercari, The RealReal, Vestiaire Collective, Grailed, Depop, Etsy, Rebag, or Shopify - choose based on current platform trends and item type), 5) Best LIVE selling platform (Whatnot, Poshmark Live, TikTok Shop, Instagram Live, Facebook Live, YouTube Live, Amazon Live, eBay Live, or Shopify Live - consider current platform popularity and audience demographics), 6) Condition assessment, 7) Real Score (0-100 confidence rating rounded to nearest 5), 8) TRENDING SCORE: Calculate a score from 0-100 using this formula: (1.0 × Demand[0-25]) + (0.8 × Velocity[0-20]) + (0.6 × Platform[0-15]) + (0.5 × Recency[0-10]) + (0.5 × Scarcity[0-10]) - (1.0 × Penalty[0-20]). Demand=search volume/likes/wishlist adds. Velocity=sell-through rate. Platform=trending on multiple platforms. Recency=seasonal/viral trends. Scarcity=limited runs/rare items. Penalty=high supply/counterfeits/bad condition. BE DECISIVE - use extreme values when justified. Avoid clustering around 40-60. Consider inflation, current fashion trends, and platform algorithm changes. Respond with JSON: {\"item_name\": \"name\", \"price_range\": \"$X-$Y\", \"style_tier\": \"Entry|Designer|Luxury\", \"recommended_platform\": \"platform\", \"recommended_live_platform\": \"live platform\", \"condition\": \"condition\", \"real_score\": X, \"trending_score_data\": {\"scores\": {\"demand\": X, \"velocity\": X, \"platform\": X, \"recency\": X, \"scarcity\": X, \"penalty\": X}, \"trending_score\": X, \"label\": \"(return ONLY the label text that matches the trending_score: if score 0-10 return 'Unsellable (By Most)', if 11-25 return 'Will Take Up Rent', if 26-40 return 'Niche Vibes Only', if 41-55 return 'Hit-or-Miss', if 56-70 return 'Moves When Ready', if 71-85 return 'Money Maker', if 86-95 return 'Hot Ticket', if 96-100 return 'Win!')\"}, \"market_insights\": \"current 2025 market trends\", \"selling_tips\": \"specific advice for 2025 marketplace\", \"brand_context\": \"brand status and demand in 2025\", \"seasonal_notes\": \"current seasonal considerations\"}`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBuffer.toString('base64')}`
              }
            }
          ]
        }
      ],
      max_tokens: 500
    });

    // Parse the response
    const content = response.choices[0].message.content;
    let analysis;
    
    try {
      // Clean up the response (remove markdown, extra text)
      const jsonMatch = content.match(/\{.*\}/s);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (error) {
      console.error('Failed to parse OpenAI response:', content);
      // If not valid JSON, create a structured response
      analysis = {
        item_name: "Unknown Item",
        price_range: "$10-$50",
        style_tier: "Entry",
        recommended_platform: "eBay",
        recommended_live_platform: "Facebook Live",
        condition: "Good",
        real_score: 50,
        trending_score_data: {
          scores: {
            demand: 12,
            velocity: 10,
            platform: 7,
            recency: 5,
            scarcity: 5,
            penalty: 5
          },
          trending_score: 50,
          label: "Hit-or-Miss"
        },
        market_insights: "Unable to analyze market trends",
        selling_tips: "Ensure good lighting and clear photos",
        brand_context: "Brand information unavailable",
        seasonal_notes: "No seasonal considerations available",
        raw_response: content
      };
    }
    
    // Fix common AI typos
    if (analysis.recommended_platform === 'uknown') {
      analysis.recommended_platform = 'Unknown';
    }
    if (analysis.recommended_live_platform === 'uknown') {
      analysis.recommended_live_platform = 'Unknown';
    }

    // Post-process authenticity score for luxury brands
    const luxuryBrands = [
      'Louis Vuitton', 'Chanel', 'Gucci', 'Hermès', 'Prada', 
      'Fendi', 'Dior', 'Balenciaga', 'Burberry', 'Coach',
      'Bottega Veneta', 'Celine', 'Givenchy', 'Saint Laurent',
      'Valentino', 'Versace', 'Dolce & Gabbana', 'Miu Miu'
    ];

    // Check for replica keywords in description
    const replicaIndicators = [
      'replica', 'inspired', 'style', 'dupe', 'look alike',
      'similar to', 'homage', 'tribute', 'vegan leather'
    ];

    const itemNameLower = (analysis.item_name || '').toLowerCase();
    const descriptionLower = (userPrompt || '').toLowerCase();
    
    // Check if item is a luxury brand
    const isLuxuryBrand = luxuryBrands.some(brand => 
      itemNameLower.includes(brand.toLowerCase()) || 
      descriptionLower.includes(brand.toLowerCase())
    );

    // Check for replica indicators
    const hasReplicaIndicators = replicaIndicators.some(indicator => 
      descriptionLower.includes(indicator)
    );

    // Apply replica penalties and adjustments
    let realScore = parseInt(analysis.real_score) || 50;
    let penalties = [];
    
    if (isLuxuryBrand) {
      // Check for replica indicators in description
      if (hasReplicaIndicators) {
        realScore = Math.min(realScore, 20);
        penalties.push("replica keywords detected");
      }
      
      // Check for excessive logo patterns (common in replicas)
      const logoPatterns = ['gg', 'lv', 'cc', 'ff', 'dg'];
      const hasExcessiveLogos = logoPatterns.some(pattern => {
        const regex = new RegExp(pattern, 'gi');
        const matches = (itemNameLower + ' ' + descriptionLower).match(regex);
        return matches && matches.length > 3;
      });
      
      // Special check for Gucci GG pattern density
      if (itemNameLower.includes('gucci') && (itemNameLower.includes('gg') || descriptionLower.includes('gg'))) {
        if (descriptionLower.includes('all over') || descriptionLower.includes('repeat') || 
            descriptionLower.includes('pattern') || descriptionLower.includes('monogram')) {
          realScore -= 15;
          penalties.push("dense GG pattern");
        }
      }
      
      if (hasExcessiveLogos) {
        realScore -= 25;
        penalties.push("excessive logo repetition");
      }
      
      // Check for unusual colorways
      const unusualColors = ['neon', 'fluorescent', 'electric', 'rainbow', 'multicolor', 'bright orange', 'bright blue'];
      const hasUnusualColors = unusualColors.some(color => 
        itemNameLower.includes(color) || descriptionLower.includes(color)
      );
      
      if (hasUnusualColors) {
        realScore -= 20;
        penalties.push("non-core brand colorway");
      }
      
      // Check for missing interior tags mention
      const tagKeywords = ['tag', 'label', 'interior', 'inside', 'serial', 'date code', 'authenticity card'];
      const mentionsInteriorDetails = tagKeywords.some(keyword => 
        descriptionLower.includes(keyword)
      );
      
      if (!mentionsInteriorDetails && realScore > 50) {
        realScore = Math.min(realScore, 50);
        penalties.push("no interior tag verification");
      }
      
      // Apply DHGate/AliExpress style penalty
      const suspiciousSources = ['dhgate', 'aliexpress', 'wish', 'shein', 'wholesale'];
      const fromSuspiciousSource = suspiciousSources.some(source => 
        descriptionLower.includes(source)
      );
      
      if (fromSuspiciousSource) {
        realScore -= 40;
        penalties.push("suspicious source mentioned");
      }
    }
    
    // Ensure score stays within bounds
    realScore = Math.max(5, Math.min(100, realScore));
    analysis.real_score = realScore;
    
    if (penalties.length > 0) {
      analysis.score_penalties = penalties.join(", ");
    }

    // Adjust for low real scores
    if (realScore <= 30) {
      // Override pricing for low confidence items
      analysis.price_range = "$5-$50";
      analysis.resale_average = "$25";
      
      // Replace market insights for uncertain items
      analysis.market_insights = "Limited market data available.";
      
      // Replace selling tips with platform-safe advice
      analysis.selling_tips = "Clean with care.";
      
      // Adjust style tier
      analysis.style_tier = "Entry";
      
      // Platform-safe fallback suggestions
      analysis.recommended_platform = "Craft Fair";
      analysis.recommended_live_platform = "Personal Use";
    } else if (realScore < 70 && isLuxuryBrand) {
      // For luxury items with medium confidence (31-69), avoid authentication platforms
      const authPlatforms = ['The RealReal', 'Vestiaire Collective', 'Rebag', 'Fashionphile'];
      
      if (authPlatforms.includes(analysis.recommended_platform)) {
        analysis.recommended_platform = "eBay";
      }
      if (authPlatforms.includes(analysis.recommended_live_platform)) {
        analysis.recommended_live_platform = "Facebook Live";
      }
    }

    // Calculate buy price (resale price / 5)
    let buy_price = null;
    if (analysis.price_range) {
      // Extract numbers from price range (e.g., "$50-$150" or "$900-$1,000" -> 50 and 150 or 900 and 1000)
      // Updated regex to handle comma-separated thousands
      const priceMatch = analysis.price_range.match(/\$?([\d,]+)[-\s]+\$?([\d,]+)/);
      if (priceMatch) {
        // Remove commas before parsing
        const lowPrice = parseInt(priceMatch[1].replace(/,/g, ''));
        const highPrice = parseInt(priceMatch[2].replace(/,/g, ''));
        const avgPrice = (lowPrice + highPrice) / 2;
        const buyPrice = Math.round(avgPrice / 5);
        buy_price = `$${buyPrice}`;
        
        // Add to analysis object
        analysis.buy_price = buy_price;
        analysis.resale_average = `$${Math.round(avgPrice)}`;
      }
    }
    
    // HOLD_LIST - Legacy brands that retain value regardless of sellability
    const HOLD_LIST = [
      'Hermès',
      'Chanel',
      'Louis Vuitton',
      'Cartier',
      'Gucci',
      'Fendi',
      'Goyard',
      'Céline (Phoebe Philo era)',
      'Chloe Paddington (niche)',
      'Vintage Coach (Made in USA)'
    ];
    
    // Adjust prices based on sellability score (trending_score), unless it's a HOLD_LIST brand
    if (analysis.trending_score !== undefined && analysis.price_range && authenticityScore > 30) {
      const sellabilityScore = parseInt(analysis.trending_score) || 50;
      const itemName = (analysis.item_name || '').toLowerCase();
      
      // Check if item is from a HOLD_LIST brand
      const isHoldListBrand = HOLD_LIST.some(brand => 
        itemName.includes(brand.toLowerCase())
      );
      
      if (!isHoldListBrand && sellabilityScore < 70) {
        // Apply sellability adjustment for non-HOLD_LIST items
        const adjustmentFactor = sellabilityScore / 100;
        
        // Re-extract and adjust prices
        const priceMatch = analysis.price_range.match(/\$?([\d,]+)[-\s]+\$?([\d,]+)/);
        if (priceMatch) {
          const lowPrice = parseInt(priceMatch[1].replace(/,/g, ''));
          const highPrice = parseInt(priceMatch[2].replace(/,/g, ''));
          
          // Apply adjustment and round up
          const adjustedLowPrice = Math.ceil(lowPrice * adjustmentFactor);
          const adjustedHighPrice = Math.ceil(highPrice * adjustmentFactor);
          const adjustedAvgPrice = (adjustedLowPrice + adjustedHighPrice) / 2;
          const adjustedBuyPrice = Math.ceil(adjustedAvgPrice / 5);
          
          // Update analysis with adjusted values
          analysis.price_range = `$${adjustedLowPrice}-$${adjustedHighPrice}`;
          analysis.buy_price = `$${adjustedBuyPrice}`;
          analysis.resale_average = `$${Math.round(adjustedAvgPrice)}`;
          analysis.price_adjusted = true;
          analysis.adjustment_reason = `Price adjusted ${Math.round((1 - adjustmentFactor) * 100)}% due to sellability score`;
        }
      } else if (isHoldListBrand) {
        // Add legacy brand indicator
        analysis.legacy_brand = true;
        analysis.hold_value = true;
      }
    }

    // Ensure all new fields exist with defaults if missing
    if (!analysis.real_score) analysis.real_score = 50;
    if (!analysis.market_insights) analysis.market_insights = "Market insights unavailable";
    if (!analysis.selling_tips) analysis.selling_tips = "Ensure good lighting and clear photos";
    if (!analysis.brand_context) analysis.brand_context = "Brand information unavailable";
    if (!analysis.seasonal_notes) analysis.seasonal_notes = "No seasonal considerations available";
    
    // Process trending score data - flatten structure for easier frontend access
    if (analysis.trending_score_data) {
      analysis.trending_score = analysis.trending_score_data.trending_score;
      analysis.trending_label = analysis.trending_score_data.label;
      analysis.trending_breakdown = analysis.trending_score_data.scores;
      // Remove the nested structure to keep response clean
      delete analysis.trending_score_data;
    } else {
      // Provide default trending score if AI didn't calculate it
      analysis.trending_score = 50;
      analysis.trending_label = "Hit-or-Miss";
      analysis.trending_breakdown = {
        demand: 12,
        velocity: 10,
        platform: 7,
        recency: 5,
        scarcity: 5,
        penalty: 5
      };
    }

    const processingTime = Date.now() - req.startTime;

    // Add environmental impact tag based on item name
    analysis.environmental_tag = getEnvironmentalTagByItemName(analysis.item_name);
    
    // Reduce text content for mobile (Issue #91)
    if (analysis.market_insights && analysis.market_insights.length > 100) {
      // Truncate to first sentence or 100 chars
      const firstSentence = analysis.market_insights.match(/^[^.!?]+[.!?]/);
      analysis.market_insights = firstSentence ? firstSentence[0] : analysis.market_insights.substring(0, 97) + '...';
    }
    
    // Handle selling tips
    if (analysis.selling_tips === "Unknown") {
      analysis.selling_tips = "Clean with care.";
    } else if (analysis.selling_tips && analysis.selling_tips.length > 150) {
      // Convert to bullet points - split by sentence or comma
      const tips = analysis.selling_tips.split(/[.,;]/).filter(tip => tip.trim());
      if (tips.length > 3) {
        // Take only first 3 tips
        analysis.selling_tips = tips.slice(0, 3).map(tip => '• ' + tip.trim()).join('\n');
      } else {
        analysis.selling_tips = tips.map(tip => '• ' + tip.trim()).join('\n');
      }
    }
    
    // Shorten brand context
    if (analysis.brand_context && analysis.brand_context.length > 80) {
      analysis.brand_context = analysis.brand_context.substring(0, 77) + '...';
    }
    
    // Simplify seasonal notes
    if (analysis.seasonal_notes && analysis.seasonal_notes.length > 60) {
      analysis.seasonal_notes = analysis.seasonal_notes.substring(0, 57) + '...';
    }
    
    // Format real score - no % symbol, just the number
    if (analysis.real_score !== undefined && typeof analysis.real_score === 'number') {
      // Round to nearest 5
      analysis.real_score = Math.round(analysis.real_score / 5) * 5;
    }

    res.json({ 
      success: true, 
      data: analysis,  // Frontend expects 'data' not 'analysis'
      processing: {
        fileSize: req.file.size,
        processingTime: processingTime,
        version: '2.0'
      }
    });

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze image',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      hint: 'Please try again with a different image'
    });
  }
});

// Request/response logging removed for performance

// Auth routes
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

// Admin routes
const adminRoutes = require('./routes/admin');
app.use('/admin', adminRoutes);

// Feedback route - wrap in try-catch
const feedbackRoutes = require('./routes/feedback');
app.use('/api/feedback', (req, res, next) => {
  try {
    feedbackRoutes(req, res, next);
  } catch (error) {
    console.error('ERROR in feedback routes setup:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Error handling middleware from v2.0 - ENHANCED
app.use((error, req, res, next) => {
  console.error('\n=== EXPRESS ERROR HANDLER ===');
  console.error('URL:', req.url);
  console.error('Method:', req.method);
  console.error('Error type:', error.constructor.name);
  console.error('Error message:', error.message);
  console.error('Error stack:', error.stack);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        hint: 'Please use an image smaller than 10MB'
      });
    }
  }
  
  // Check if it's a body parser error
  if (error.type === 'entity.parse.failed') {
    console.error('Body parser error - likely JSON parsing issue');
    return res.status(400).json({
      error: 'Invalid request body',
      hint: 'Please check your request format'
    });
  }
  
  // For all other errors
  res.status(500).json({
    error: 'Internal server error',
    hint: 'Please try again later',
    details: process.env.NODE_ENV === 'development' ? {
      message: error.message,
      type: error.constructor.name,
      stack: error.stack
    } : undefined
  });
});

// Process-level error handlers
process.on('uncaughtException', (error) => {
  console.error('\n=== UNCAUGHT EXCEPTION ===');
  console.error('Time:', new Date().toISOString());
  console.error('Error:', error);
  console.error('Stack:', error.stack);
  // Don't exit in development to see more errors
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n=== UNHANDLED REJECTION ===');
  console.error('Time:', new Date().toISOString());
  console.error('Reason:', reason);
  console.error('Promise:', promise);
});

// Legal pages are now served by setupLegalPages middleware at the top of the file
// This ensures they're served before any other routes or middleware intercept them

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  // Server is running on port ${PORT}
});

// Handle server errors
server.on('error', (error) => {
  console.error('\n=== SERVER ERROR ===');
  console.error('Error:', error);
  console.error('Stack:', error.stack);
});
