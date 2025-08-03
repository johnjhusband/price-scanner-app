const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { OpenAI } = require('openai');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const { initializeDatabase } = require('./database');

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

AUTHENTICITY FIRST: Before anything else, carefully examine the image for signs this could be a replica. For ANY luxury brand item (YSL, Louis Vuitton, Chanel, Gucci, etc.), start with the assumption it MIGHT be fake and look for proof of authenticity, not the other way around. Check:
- Stitching quality (replicas often have loose, uneven, or crooked stitches)
- Logo placement and font (even slight deviations = fake)
- Hardware color and weight appearance
- Material quality and texture
- Overall craftsmanship

If you cannot clearly see authentication details or if ANYTHING looks off, score 30% or lower. When in doubt, score LOW. It's better to undervalue a real item than overvalue a fake.

Analyze this item and provide: 1) What the item is, 2) Estimated resale value range based on CURRENT 2025 market conditions, 3) Style tier (Entry, Designer, or Luxury based on brand/quality), 4) Best STANDARD platform to list it on (eBay, Poshmark, Facebook Marketplace, Mercari, The RealReal, Vestiaire Collective, Grailed, Depop, Etsy, Rebag, or Shopify - choose based on current platform trends and item type), 5) Best LIVE selling platform (Whatnot, Poshmark Live, TikTok Shop, Instagram Live, Facebook Live, YouTube Live, Amazon Live, eBay Live, or Shopify Live - consider current platform popularity and audience demographics), 6) Condition assessment, 7) Authenticity likelihood (0-100% score - DEFAULT TO LOW for luxury brands unless you can clearly verify authentic details), 8) TRENDING SCORE: Calculate a score from 0-100 using this formula: (1.0 × Demand[0-25]) + (0.8 × Velocity[0-20]) + (0.6 × Platform[0-15]) + (0.5 × Recency[0-10]) + (0.5 × Scarcity[0-10]) - (1.0 × Penalty[0-20]). Demand=search volume/likes/wishlist adds. Velocity=sell-through rate. Platform=trending on multiple platforms. Recency=seasonal/viral trends. Scarcity=limited runs/rare items. Penalty=high supply/counterfeits/bad condition. BE DECISIVE - use extreme values when justified. Avoid clustering around 40-60. Consider inflation, current fashion trends, and platform algorithm changes. Respond with JSON: {\"item_name\": \"name\", \"price_range\": \"$X-$Y\", \"style_tier\": \"Entry|Designer|Luxury\", \"recommended_platform\": \"platform\", \"recommended_live_platform\": \"live platform\", \"condition\": \"condition\", \"authenticity_score\": \"X%\", \"trending_score_data\": {\"scores\": {\"demand\": X, \"velocity\": X, \"platform\": X, \"recency\": X, \"scarcity\": X, \"penalty\": X}, \"trending_score\": X, \"label\": \"(return ONLY the label text that matches the trending_score: if score 0-10 return 'Unsellable (By Most)', if 11-25 return 'Will Take Up Rent', if 26-40 return 'Niche Vibes Only', if 41-55 return 'Hit-or-Miss', if 56-70 return 'Moves When Ready', if 71-85 return 'Money Maker', if 86-95 return 'Hot Ticket', if 96-100 return 'Win!')\"}, \"market_insights\": \"current 2025 market trends\", \"selling_tips\": \"specific advice for 2025 marketplace\", \"brand_context\": \"brand status and demand in 2025\", \"seasonal_notes\": \"current seasonal considerations\"}`
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
        authenticity_score: "50%",
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

    // Adjust authenticity score if needed
    if (isLuxuryBrand && hasReplicaIndicators) {
      // Cap at 20% for luxury brands with replica keywords
      const currentScore = parseInt(analysis.authenticity_score) || 50;
      if (currentScore > 20) {
        analysis.authenticity_score = "20%";
        analysis.authenticity_note = "Score capped due to replica indicators";
      }
    }

    // Adjust pricing for low authenticity items
    const authenticityScore = parseInt(analysis.authenticity_score) || 50;
    if (authenticityScore <= 30) {
      // Override pricing for likely replicas
      analysis.price_range = "$5-$50";
      analysis.resale_average = "$25";
      
      // Replace market insights for uncertain items
      analysis.market_insights = "⚠️ Unknown market research on this product. Upload a clearer image to retry.";
      
      // Replace selling tips to avoid advice
      analysis.selling_tips = "Unknown";
      
      // Adjust style tier
      analysis.style_tier = "Authenticity Uncertain";
      
      // Don't recommend platforms for uncertain authenticity items
      analysis.recommended_platform = "Unknown";
      analysis.recommended_live_platform = "Unknown";
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

    // Ensure all new fields exist with defaults if missing
    if (!analysis.authenticity_score) analysis.authenticity_score = "50%";
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
