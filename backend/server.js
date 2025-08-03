const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { OpenAI } = require('openai');
const session = require('express-session');
const passport = require('passport');
const { initializeDatabase } = require('./database');

// Load environment variables
require('dotenv').config();

// Initialize database
try {
  console.log('\n=== INITIALIZING DATABASE ===');
  initializeDatabase();
  console.log('Database initialization complete\n');
} catch (error) {
  console.error('\n=== DATABASE INITIALIZATION FAILED ===');
  console.error('Error:', error.message);
  console.error('Continuing without database - auth and feedback will not work\n');
}

const app = express();

// Environment validation
if (!process.env.OPENAI_API_KEY) {
  console.error('ERROR: OPENAI_API_KEY is not set in .env file');
  process.exit(1);
}

// Basic middleware
app.use(cors({
  origin: true, // Allow all origins
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

// Request timing middleware
app.use((req, res, next) => {
  req.processingStart = Date.now();
  next();
});

// Multer configuration
const upload = multer({ 
  memory: true,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB limit
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
    version: '2.0-minimal',
    features: {
      imageAnalysis: true,
      cameraSupport: true,
      pasteSupport: true,
      dragDropSupport: true,
      enhancedAI: true
    }
  });
});

// Main scan endpoint
app.post('/api/scan', upload.single('image'), async (req, res) => {
  console.log('=== SCAN REQUEST RECEIVED ===');
  console.log(`Time: ${new Date().toISOString()}`);
  
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No image provided',
        hint: 'Please upload an image file'
      });
    }

    console.log(`File received: ${req.file.originalname}, Size: ${req.file.size} bytes`);
    
    const base64Image = req.file.buffer.toString('base64');
    const userDescription = req.body.description || req.body.userPrompt || '';
    
    console.log(`User description: "${userDescription}"`);
    console.log('Sending to OpenAI Vision API...');

    // Simplified prompt
    const prompt = `Analyze this thrift store item image and provide a JSON response with these fields:
    - item_name: Name of the item
    - price_range: Suggested resale price range (e.g., "$45-65")
    - condition: Describe the condition
    - authenticity_score: Percentage (e.g., "85%")
    - market_insights: Brief market analysis
    ${userDescription ? `User description: ${userDescription}` : ''}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { 
              type: "image_url", 
              image_url: { 
                url: `data:image/jpeg;base64,${base64Image}` 
              } 
            }
          ]
        }
      ],
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    const analysis = JSON.parse(response.choices[0].message.content);
    console.log('OpenAI analysis completed successfully');

    res.json({
      success: true,
      data: analysis,
      processing: {
        fileSize: req.file.size,
        processingTime: Date.now() - req.processingStart,
        version: '2.0-minimal'
      }
    });

  } catch (error) {
    console.error('ERROR in /api/scan:', error);
    
    const statusCode = error.status || 500;
    const errorMessage = error.message || 'Failed to analyze image';
    
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      hint: statusCode === 401 ? 'Check your OpenAI API key' : 'Please try again'
    });
  }
});

// Auth routes
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

// Feedback routes
const feedbackRoutes = require('./routes/feedback');
app.use('/api/feedback', feedbackRoutes);

// Basic error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n=== Flippi.ai Backend (Minimal) ===`);
  console.log(`Version: 2.0-minimal`);
  console.log(`Port: ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Ready for connections!\n`);
});