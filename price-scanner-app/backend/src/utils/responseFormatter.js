/**
 * Format the OpenAI analysis response for the mobile app
 * @param {Object} analysis - Raw analysis from OpenAI
 * @returns {Object} Formatted response
 */
function formatResponse(analysis) {
  // Ensure all required fields are present with fallbacks
  const formatted = {
    item: {
      name: analysis.item?.name || 'Unknown Item',
      category: analysis.item?.category || 'Unknown',
      brand: analysis.item?.brand || 'Unknown',
      description: analysis.item?.description || 'No description available',
      notable_features: analysis.item?.notable_features || []
    },
    pricing: {
      ebay: analysis.pricing?.ebay || 'N/A',
      facebook: analysis.pricing?.facebook || 'N/A',
      poshmark: analysis.pricing?.poshmark || 'N/A',
      mercari: analysis.pricing?.mercari || 'N/A',
      whatnot: analysis.pricing?.whatnot || 'N/A'
    },
    condition_tips: analysis.condition_tips || [
      'Check for any visible damage or wear',
      'Verify all parts are present and functional',
      'Clean the item before listing'
    ],
    estimated_value: analysis.estimated_value || 'Unable to determine',
    market_insights: analysis.market_insights || 'No additional insights available',
    
    // Add some computed fields for the mobile app
    confidence_score: calculateConfidenceScore(analysis),
    platforms_with_data: getPlatformsWithData(analysis.pricing || {}),
    timestamp: new Date().toISOString()
  };

  return formatted;
}

/**
 * Calculate a confidence score based on the completeness of the analysis
 * @param {Object} analysis - Raw analysis from OpenAI
 * @returns {number} Confidence score from 0-100
 */
function calculateConfidenceScore(analysis) {
  let score = 0;
  
  // Item identification completeness (40 points max)
  if (analysis.item?.name && analysis.item.name !== 'Unknown Item') score += 15;
  if (analysis.item?.brand && analysis.item.brand !== 'Unknown') score += 10;
  if (analysis.item?.category && analysis.item.category !== 'Unknown') score += 10;
  if (analysis.item?.description && analysis.item.description.length > 20) score += 5;
  
  // Pricing data completeness (40 points max)
  const pricing = analysis.pricing || {};
  const platforms = ['ebay', 'facebook', 'poshmark', 'mercari', 'whatnot'];
  const validPrices = platforms.filter(platform => 
    pricing[platform] && 
    pricing[platform] !== 'N/A' && 
    pricing[platform] !== 'Unable to determine'
  );
  score += (validPrices.length / platforms.length) * 40;
  
  // Additional data (20 points max)
  if (analysis.condition_tips && analysis.condition_tips.length >= 3) score += 10;
  if (analysis.estimated_value && analysis.estimated_value !== 'Unable to determine') score += 10;
  
  return Math.round(Math.min(score, 100));
}

/**
 * Get list of platforms that have pricing data
 * @param {Object} pricing - Pricing object from analysis
 * @returns {Array} Array of platform names with data
 */
function getPlatformsWithData(pricing) {
  const platforms = ['ebay', 'facebook', 'poshmark', 'mercari', 'whatnot'];
  return platforms.filter(platform => 
    pricing[platform] && 
    pricing[platform] !== 'N/A' && 
    pricing[platform] !== 'Unable to determine'
  );
}

module.exports = {
  formatResponse,
  calculateConfidenceScore,
  getPlatformsWithData
}; 