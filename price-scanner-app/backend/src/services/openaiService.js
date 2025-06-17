const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ANALYSIS_PROMPT = `You are an expert in secondhand item valuation and resale markets. Analyze this image and provide detailed information about the item for someone who wants to resell it.

Please provide:
1. Item identification (name, category, brand if visible, description)
2. Current market prices from popular resale platforms (search the web for recent sold listings)
3. Specific tips for assessing "good" condition for this type of item
4. Overall estimated resale value range
5. Any notable features that could affect value (vintage, rare, designer, etc.)

Search the web for current pricing data from:
- eBay (sold listings)
- Facebook Marketplace
- Poshmark
- Mercari
- WhatNot (if applicable)

Format your response as JSON with this exact structure:
{
  "item": {
    "name": "Item name",
    "category": "Category (e.g., Clothing, Electronics, etc.)",
    "brand": "Brand name or Unknown",
    "description": "Detailed description of the item",
    "notable_features": ["feature1", "feature2"]
  },
  "pricing": {
    "ebay": "Price range from eBay",
    "facebook": "Price range from Facebook Marketplace", 
    "poshmark": "Price range from Poshmark",
    "mercari": "Price range from Mercari",
    "whatnot": "Price range from WhatNot (if applicable)"
  },
  "condition_tips": [
    "Tip 1 for assessing condition",
    "Tip 2 for assessing condition",
    "Tip 3 for assessing condition"
  ],
  "estimated_value": "Overall estimated value range",
  "market_insights": "Additional insights about demand, seasonality, or market trends"
}

Be specific with price ranges (e.g., "$15-25" not "low price") and provide actionable condition assessment tips.`;

async function analyzeImage(imageBase64, mimeType = 'image/jpeg') {
  try {
    console.log('🤖 Sending image to OpenAI for analysis...');

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: ANALYSIS_PROMPT
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 1500,
      temperature: 0.3, // Lower temperature for more consistent responses
    });

    const content = response.choices[0].message.content;
    console.log('📝 OpenAI response received');

    // Try to parse JSON from the response
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedResponse = JSON.parse(jsonMatch[0]);
        return parsedResponse;
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('❌ Failed to parse OpenAI response as JSON:', parseError);
      console.log('Raw response:', content);
      
      // Return a fallback response
      return {
        item: {
          name: "Unknown Item",
          category: "Unknown",
          brand: "Unknown",
          description: "Unable to analyze item details",
          notable_features: []
        },
        pricing: {
          ebay: "Unable to determine",
          facebook: "Unable to determine",
          poshmark: "Unable to determine",
          mercari: "Unable to determine",
          whatnot: "Unable to determine"
        },
        condition_tips: [
          "Check for any visible damage or wear",
          "Verify all parts are present and functional",
          "Clean the item before listing"
        ],
        estimated_value: "Unable to determine",
        market_insights: "Analysis failed - please try again with a clearer image"
      };
    }

  } catch (error) {
    console.error('❌ OpenAI API error:', error);
    
    if (error.code === 'insufficient_quota') {
      throw new Error('OpenAI API quota exceeded');
    }
    
    if (error.code === 'rate_limit_exceeded') {
      throw new Error('OpenAI API rate limit exceeded');
    }
    
    if (error.code === 'invalid_api_key') {
      throw new Error('Invalid OpenAI API key');
    }
    
    throw new Error(`OpenAI API error: ${error.message}`);
  }
}

module.exports = {
  analyzeImage
}; 