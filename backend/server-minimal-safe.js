const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { OpenAI } = require('openai');

// Load environment variables
require('dotenv').config();

const app = express();

// Environment validation
if (!process.env.OPENAI_API_KEY) {
  console.error('ERROR: OPENAI_API_KEY is not set in .env file');
  process.exit(1);
}

// Basic middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request timing middleware
app.use((req, res, next) => {
  req.processingStart = Date.now();
  next();
});

// Multer configuration
const upload = multer({ 
  memory: true,
  limits: { 
    fileSize: 10 * 1024 * 1024,
    files: 1
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '2.0-minimal-safe',
    features: {
      imageAnalysis: true,
      authentication: false,
      feedback: false
    }
  });
});

// Temporary auth status endpoint
app.get('/auth/status', (req, res) => {
  res.json({
    authenticated: false,
    message: 'Authentication temporarily disabled - database module unavailable'
  });
});

// Main scan endpoint
app.post('/api/scan', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No image file provided',
        hint: 'Please select an image to analyze'
      });
    }

    const imageBase64 = req.file.buffer.toString('base64');
    const userPrompt = req.body.description || req.body.userPrompt || '';
    
    const replicaIndicators = ['replica', 'fake', 'counterfeit', 'knockoff', 'dupe', 'copy', 'imitation'];
    const isLikelyReplica = replicaIndicators.some(word => userPrompt.toLowerCase().includes(word));

    const messages = [
      {
        role: "system",
        content: `You are a secondhand item valuation expert. Analyze the image and provide:
1. Item identification
2. Resale price range (be realistic - thrift finds are usually $10-50)
3. Condition assessment
4. Best selling platform
5. Authenticity score (0-100%) - Be VERY strict with luxury brands. If ANY doubt, score low.
6. Market insights
${isLikelyReplica ? 'NOTE: User indicates this may be a replica. Score authenticity accordingly.' : ''}`
      },
      {
        role: "user",
        content: [
          { type: "text", text: userPrompt || "What is this item and its resale value?" },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
        ]
      }
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      max_tokens: 500,
      temperature: 0.3
    });

    const aiResponse = completion.choices[0].message.content;
    
    // Parse response
    const analysis = {
      item_name: "Unknown Item",
      price_range: "$0-0",
      style_tier: "Unknown",
      recommended_platform: "eBay",
      condition: "Unknown",
      authenticity_score: "0%",
      boca_score: "0",
      buy_price: "$0",
      resale_average: "$0",
      market_insights: aiResponse,
      selling_tips: "Check similar sold listings",
      brand_context: "",
      seasonal_notes: ""
    };

    // Try to extract structured data from response
    const lines = aiResponse.split('\n');
    lines.forEach(line => {
      const lower = line.toLowerCase();
      if (lower.includes('item:') || lower.includes('identification:')) {
        analysis.item_name = line.split(':')[1]?.trim() || analysis.item_name;
      } else if (lower.includes('price') && lower.includes('range')) {
        const match = line.match(/\$[\d,]+-[\d,]+/);
        if (match) analysis.price_range = match[0];
      } else if (lower.includes('authenticity')) {
        const match = line.match(/(\d+)%/);
        if (match) analysis.authenticity_score = match[0];
      }
    });

    // Calculate derived values
    const avgMatch = analysis.price_range.match(/\$(\d+)-(\d+)/);
    if (avgMatch) {
      const avg = (parseInt(avgMatch[1]) + parseInt(avgMatch[2])) / 2;
      analysis.resale_average = `$${Math.round(avg)}`;
      analysis.buy_price = `$${Math.round(avg / 5)}`;
    }

    // Post-process for luxury brands
    const luxuryBrands = ['Louis Vuitton', 'Chanel', 'Gucci', 'Hermès', 'Prada'];
    if (luxuryBrands.some(brand => analysis.item_name.toLowerCase().includes(brand.toLowerCase()))) {
      if (isLikelyReplica) {
        analysis.authenticity_score = "20%";
      }
    }

    const processingTime = Date.now() - req.processingStart;

    res.json({
      success: true,
      data: analysis,
      processing: {
        fileSize: req.file.size,
        processingTime: processingTime,
        version: '2.0'
      }
    });

  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to process image',
      hint: 'Please try again with a different image'
    });
  }
});

// Basic error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ 
    success: false, 
    error: err.message || 'Internal server error',
    hint: 'Please try again'
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
===========================================
Flippi.ai Backend Server (Minimal Safe Mode)
===========================================
Port: ${PORT}
Environment: ${process.env.NODE_ENV || 'development'}
Version: 2.0-minimal-safe
Features:
  - Image Analysis: ✓
  - Authentication: ✗ (database unavailable)
  - Feedback: ✗ (database unavailable)
===========================================
Server is running at http://localhost:${PORT}
Health check: http://localhost:${PORT}/health
===========================================
  `);
});