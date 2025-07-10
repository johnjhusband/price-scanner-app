const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
const upload = multer({ 
  memory: true,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Environment validation
if (!process.env.OPENAI_API_KEY) {
  console.error('ERROR: OPENAI_API_KEY is not set in .env file');
  process.exit(1);
}

// Middleware
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// OpenAI setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Image analysis endpoint
app.post('/api/scan', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // Get image buffer
    const imageBuffer = req.file.buffer;
    
    // Call OpenAI Vision API
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this item and provide: 1) What the item is, 2) Estimated resale value range, 3) Best platform to sell it on (eBay, Poshmark, Facebook, etc), 4) Condition assessment. Respond ONLY with valid JSON in this exact format: {\"item_name\": \"name\", \"price_range\": \"$X-$Y\", \"recommended_platform\": \"platform\", \"condition\": \"condition\"}"
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
      max_tokens: 300
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
        recommended_platform: "eBay",
        condition: "Good",
        raw_response: content
      };
    }

    res.json({ success: true, analysis });

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze image',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`OpenAI API Key: ${process.env.OPENAI_API_KEY ? 'Set' : 'Not set'}`);
});