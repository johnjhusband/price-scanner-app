const { OpenAI } = require('openai');
const { getDatabase } = require('../database');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Run valuation on normalized data
const runValuation = async (normalizedData) => {
  const { title, description, brand, model, category, buy_price } = normalizedData;
  
  // Build context for AI
  const context = buildContext(normalizedData);
  
  try {
    // Call OpenAI for valuation
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `You are a resale value expert. Analyze this thrift store find and provide valuation.

Item: ${title}
${brand ? `Brand: ${brand}` : ''}
${model ? `Model: ${model}` : ''}
${category ? `Category: ${category}` : ''}
${buy_price ? `Purchased for: $${buy_price}` : ''}
${description ? `Details: ${description}` : ''}

Provide a JSON response with:
{
  "value_low": lowest realistic resale price in USD,
  "value_high": highest realistic resale price in USD,
  "confidence": confidence score 0-1 (based on information available),
  "recommended_platform": best platform to sell (eBay, Poshmark, Facebook Marketplace, etc),
  "recommended_live_platform": best live platform (TikTok Shop, Whatnot, etc),
  "condition_guess": likely condition (Excellent, Good, Fair, Poor),
  "market_insights": brief market insight (50 words max),
  "selling_tips": one key selling tip
}`
        }
      ],
      max_tokens: 400,
      temperature: 0.7
    });
    
    // Parse response
    const content = response.choices[0].message.content;
    let valuation;
    
    try {
      const jsonMatch = content.match(/\{.*\}/s);
      if (jsonMatch) {
        valuation = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (error) {
      console.error('Failed to parse valuation response:', content);
      // Fallback valuation
      valuation = {
        value_low: 10,
        value_high: 50,
        confidence: 0.3,
        recommended_platform: "eBay",
        recommended_live_platform: "Facebook Live",
        condition_guess: "Unknown",
        market_insights: "Unable to determine specific value",
        selling_tips: "Research similar items for pricing"
      };
    }
    
    // Ensure confidence is between 0 and 1
    valuation.confidence = Math.max(0, Math.min(1, valuation.confidence || 0.5));
    
    // Adjust confidence based on available data
    if (!brand) valuation.confidence *= 0.8;
    if (!normalizedData.image_url) valuation.confidence *= 0.7;
    if (category === 'other') valuation.confidence *= 0.9;
    
    return valuation;
    
  } catch (error) {
    console.error('Valuation API error:', error);
    
    // Return basic valuation based on category
    return getFallbackValuation(category, brand);
  }
};

// Build context for better valuations
const buildContext = (data) => {
  const contexts = [];
  
  if (data.brand) {
    contexts.push(`This is a ${data.brand} item`);
  }
  
  if (data.buy_price) {
    contexts.push(`Purchased for $${data.buy_price}`);
  }
  
  if (data.source_subreddit) {
    const subContext = {
      'thriftstorehauls': 'found at a thrift store',
      'flipping': 'intended for resale',
      'whatsthisworth': 'value inquiry',
      'vintage': 'vintage or antique item'
    };
    contexts.push(subContext[data.source_subreddit] || 'secondhand item');
  }
  
  return contexts.join('. ');
};

// Fallback valuation by category
const getFallbackValuation = (category, brand) => {
  const categoryValues = {
    'handbag': { low: 20, high: 150 },
    'footwear': { low: 15, high: 80 },
    'outerwear': { low: 25, high: 120 },
    'clothing': { low: 10, high: 60 },
    'accessories': { low: 10, high: 50 },
    'jewelry': { low: 15, high: 100 },
    'home': { low: 10, high: 75 },
    'electronics': { low: 20, high: 200 },
    'collectibles': { low: 15, high: 150 },
    'other': { low: 10, high: 50 }
  };
  
  const values = categoryValues[category] || categoryValues.other;
  
  // Adjust for brand
  if (brand && ['Louis Vuitton', 'Chanel', 'Gucci', 'Hermès'].includes(brand)) {
    values.low *= 5;
    values.high *= 5;
  } else if (brand && ['Coach', 'Kate Spade', 'Michael Kors'].includes(brand)) {
    values.low *= 2;
    values.high *= 2;
  }
  
  return {
    value_low: values.low,
    value_high: values.high,
    confidence: 0.4,
    recommended_platform: "eBay",
    recommended_live_platform: "Facebook Live",
    condition_guess: "Good",
    market_insights: `Typical ${category} resale values`,
    selling_tips: "Clean item and take clear photos"
  };
};

// Update valuation in database
const updateValuation = async (valuationId, valuationData) => {
  const db = getDatabase();
  
  const stmt = db.prepare(`
    UPDATE valuations SET
      value_low = ?,
      value_high = ?,
      confidence = ?,
      recommended_platform = ?,
      recommended_live_platform = ?,
      platform_tips = ?,
      noindex = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  
  // Set noindex for low confidence
  const noindex = valuationData.confidence < 0.55;
  
  stmt.run(
    valuationData.value_low,
    valuationData.value_high,
    valuationData.confidence,
    valuationData.recommended_platform,
    valuationData.recommended_live_platform,
    valuationData.selling_tips,
    noindex ? 1 : 0,
    valuationId
  );
  
  return valuationData;
};

// Process Reddit post end-to-end
const processRedditPost = async (post) => {
  const { normalizeRedditPost, saveValuation } = require('./valuationNormalizer');
  
  // Normalize the post
  const normalizedData = await normalizeRedditPost(post);
  
  // Save to database
  const valuationId = await saveValuation(normalizedData);
  
  // Run valuation
  const valuationData = await runValuation(normalizedData);
  
  // Update with valuation results
  await updateValuation(valuationId, valuationData);
  
  // Return complete data
  return {
    id: valuationId,
    slug: normalizedData.slug,
    ...normalizedData,
    ...valuationData
  };
};

module.exports = {
  runValuation,
  updateValuation,
  processRedditPost
};