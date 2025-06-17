const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class OpenAIService {
  async analyzeImage(imageBuffer) {
    try {
      console.log('🤖 Starting OpenAI image analysis...');

      const response = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this image of a secondhand item and provide a comprehensive price analysis. 

Please provide the following information in JSON format:

1. Item Identification:
   - Item name and category
   - Brand (if identifiable)
   - Model/series (if applicable)
   - Condition assessment (Excellent, Good, Fair, Poor)

2. Price Estimates (in USD):
   - eBay: estimated price range
   - Facebook Marketplace: estimated price range
   - WhatNot: estimated price range
   - Poshmark: estimated price range

3. Market Analysis:
   - Current market demand (High, Medium, Low)
   - Seasonal factors affecting price
   - Any unique features that add value

4. Selling Tips:
   - Best platform recommendations
   - Optimal listing timing
   - Key selling points to highlight
   - Photography tips for better listings

5. Condition Assessment:
   - Detailed condition description
   - Any visible damage or wear
   - Authenticity indicators (if applicable)

Please format your response as valid JSON with the following structure:
{
  "itemIdentification": {
    "name": "string",
    "category": "string",
    "brand": "string",
    "model": "string",
    "condition": "string"
  },
  "priceEstimates": {
    "eBay": {"min": number, "max": number, "currency": "USD"},
    "facebookMarketplace": {"min": number, "max": number, "currency": "USD"},
    "whatNot": {"min": number, "max": number, "currency": "USD"},
    "poshmark": {"min": number, "max": number, "currency": "USD"}
  },
  "marketAnalysis": {
    "demand": "string",
    "seasonalFactors": "string",
    "uniqueFeatures": "string"
  },
  "sellingTips": {
    "bestPlatforms": ["string"],
    "optimalTiming": "string",
    "keySellingPoints": ["string"],
    "photographyTips": ["string"]
  },
  "conditionAssessment": {
    "description": "string",
    "damage": "string",
    "authenticity": "string"
  }
}`
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
        max_tokens: 2000,
      });

      console.log('✅ OpenAI analysis completed');
      
      // Parse the response content as JSON
      const content = response.choices[0].message.content;
      const analysis = JSON.parse(content);
      
      return analysis;

    } catch (error) {
      console.error('❌ OpenAI API error:', error);
      throw new Error(`OpenAI analysis failed: ${error.message}`);
    }
  }
}

module.exports = new OpenAIService(); 