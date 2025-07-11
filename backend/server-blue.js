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
  origin: true, // Allow all origins in development
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
    
    // Enhanced OpenAI Vision API prompt
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this item and provide: 1) What the item is, 2) Estimated resale value range, 3) Style tier (Entry, Designer, or Luxury based on brand/quality), 4) Best platform to sell it on (eBay, Poshmark, Facebook, Mercari, The RealReal, Vestiaire, etc - choose based on tier), 5) Condition assessment, 6) Authenticity likelihood (0-100% score based on visible indicators like stitching, materials, logos, tags), 7) Boca Score (0-100 score indicating how quickly this item will sell - higher score = faster sale based on current trends, demand, and market saturation). Respond with JSON that includes both structured data and contextual information: {\"item_name\": \"name\", \"price_range\": \"$X-$Y\", \"style_tier\": \"Entry|Designer|Luxury\", \"recommended_platform\": \"platform\", \"condition\": \"condition\", \"authenticity_score\": \"X%\", \"boca_score\": \"X\", \"market_insights\": \"free text about current market trends\", \"selling_tips\": \"specific advice for this item\", \"brand_context\": \"information about the brand if relevant\", \"seasonal_notes\": \"seasonal considerations if applicable\"}"
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
  console.log(`Enhanced server running on port ${PORT}`);
  console.log(`OpenAI API Key: ${process.env.OPENAI_API_KEY ? 'Set' : 'Not set'}`);
}); 