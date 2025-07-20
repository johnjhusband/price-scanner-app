const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { OpenAI } = require('openai');
const path = require('path');
const { initializeDatabase } = require('./database');

// Load .env from shared location outside git directories
const envPath = path.join(__dirname, '../../shared/.env');
console.log('Loading .env from:', envPath);
require('dotenv').config({ path: envPath });

// Log important environment variables (without exposing secrets)
console.log('Environment check:');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('- PORT:', process.env.PORT || 'not set');
console.log('- FEEDBACK_DB_PATH:', process.env.FEEDBACK_DB_PATH || 'not set (will use ./feedback.db)');

// Initialize database
try {
  console.log('\n=== INITIALIZING DATABASE ===');
  initializeDatabase();
  console.log('Database initialization complete\n');
} catch (error) {
  console.error('\n=== DATABASE INITIALIZATION FAILED ===');
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
  console.error('Continuing without database - feedback will not work\n');
  // Continue running - database is only needed for feedback
}

const app = express();

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
app.use(express.json({ limit: '50mb' }));

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

    // Log file info for debugging
    console.log('Processing image:', {
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      bufferLength: req.file.buffer.length,
      userPrompt: userPrompt
    });

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
              text: `${userPrompt ? `User says: ${userPrompt}\n\n` : ''}Analyze this item and provide: 1) What the item is, 2) Estimated resale value range, 3) Style tier (Entry, Designer, or Luxury based on brand/quality), 4) Best platform to sell it on (eBay, Poshmark, Facebook, Mercari, The RealReal, Vestiaire, etc - choose based on tier), 5) Condition assessment, 6) Authenticity likelihood (0-100% score based on visible indicators like stitching, materials, logos, tags), 7) Boca Score (0-100 score indicating how quickly this item will sell - higher score = faster sale based on current trends, demand, and market saturation). Respond with JSON that includes both structured data and contextual information: {\"item_name\": \"name\", \"price_range\": \"$X-$Y\", \"style_tier\": \"Entry|Designer|Luxury\", \"recommended_platform\": \"platform\", \"condition\": \"condition\", \"authenticity_score\": \"X%\", \"boca_score\": \"X\", \"market_insights\": \"free text about current market trends\", \"selling_tips\": \"specific advice for this item\", \"brand_context\": \"information about the brand if relevant\", \"seasonal_notes\": \"seasonal considerations if applicable\"}`
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
        condition: "Good",
        authenticity_score: "50%",
        boca_score: "30",
        market_insights: "Unable to analyze market trends",
        selling_tips: "Ensure good lighting and clear photos",
        brand_context: "Brand information unavailable",
        seasonal_notes: "No seasonal considerations available",
        raw_response: content
      };
    }

    // Calculate buy price (resale price / 5)
    let buy_price = null;
    if (analysis.price_range) {
      // Extract numbers from price range (e.g., "$50-$150" -> 50 and 150)
      const priceMatch = analysis.price_range.match(/\$?(\d+)-\$?(\d+)/);
      if (priceMatch) {
        const lowPrice = parseInt(priceMatch[1]);
        const highPrice = parseInt(priceMatch[2]);
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
    if (!analysis.boca_score) analysis.boca_score = "30";
    if (!analysis.market_insights) analysis.market_insights = "Market insights unavailable";
    if (!analysis.selling_tips) analysis.selling_tips = "Ensure good lighting and clear photos";
    if (!analysis.brand_context) analysis.brand_context = "Brand information unavailable";
    if (!analysis.seasonal_notes) analysis.seasonal_notes = "No seasonal considerations available";

    const processingTime = Date.now() - req.startTime;
    console.log(`Analysis completed in ${processingTime}ms`);

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

// Feedback route
const feedbackRoutes = require('./routes/feedback');
app.use('/api/feedback', feedbackRoutes);

// Error handling middleware from v2.0
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        hint: 'Please use an image smaller than 10MB'
      });
    }
  }
  
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    hint: 'Please try again later'
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Enhanced server v2.0 running on port ${PORT}`);
  console.log(`🔑 OpenAI API Key: ${process.env.OPENAI_API_KEY ? 'Set' : 'Not set'}`);
  console.log('✨ Features: Image upload, Camera capture, Paste support, Drag & drop');
  console.log('📊 Enhanced AI analysis with authenticity and trend scoring');
});
