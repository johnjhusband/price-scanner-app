const { getDatabase } = require('../database');
const { 
  generateSlug, 
  extractBrand, 
  extractModel, 
  findDuplicates 
} = require('../database/valuationSchema');

// Normalize Reddit post into valuation record
const normalizeRedditPost = async (post) => {
  const db = getDatabase();
  
  // Extract basic info
  const title = post.title || '';
  const text = post.selftext || '';
  const fullText = `${title} ${text}`;
  
  // Extract structured data
  const brand = extractBrand(fullText);
  const model = extractModel(fullText, brand);
  
  // Extract price paid if mentioned
  const pricePaid = extractPricePaid(fullText);
  
  // Generate unique slug
  const slugData = {
    brand,
    model,
    title,
    source_id: post.id || post.post_id
  };
  const slug = generateSlug(slugData);
  
  // Extract image if available
  const imageData = extractImage(post);
  
  // Categorize item
  const category = categorizeItem(fullText, brand);
  
  // Check for duplicates
  const duplicates = findDuplicates(db, { title, brand, model });
  
  // Prepare normalized data
  const normalizedData = {
    slug,
    source_type: 'reddit',
    source_id: post.id || post.post_id,
    source_url: post.url || post.permalink,
    source_subreddit: post.subreddit,
    source_author: post.author,
    source_date: new Date(post.created_utc * 1000).toISOString(),
    
    title: cleanTitle(title),
    description: cleanText(text),
    brand,
    model,
    category,
    
    image_url: imageData.url,
    image_thumbnail: imageData.thumbnail,
    image_source: imageData.source,
    
    buy_price: pricePaid,
    
    // These will be filled by valuation service
    value_low: null,
    value_high: null,
    confidence: null,
    recommended_platform: null,
    recommended_live_platform: null,
    
    published: 1,
    noindex: 0, // Will be set based on confidence
    
    duplicates: duplicates
  };
  
  return normalizedData;
};

// Extract price paid from text
const extractPricePaid = (text) => {
  const patterns = [
    /paid\s*\$(\d+(?:\.\d{2})?)/i,
    /bought\s*(?:it\s*)?(?:for\s*)?\$(\d+(?:\.\d{2})?)/i,
    /cost\s*(?:me\s*)?\$(\d+(?:\.\d{2})?)/i,
    /\$(\d+(?:\.\d{2})?)\s*(?:at|from)\s*(?:goodwill|thrift|garage|estate)/i,
    /got\s*(?:it\s*)?(?:for\s*)?\$(\d+(?:\.\d{2})?)/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return Math.round(parseFloat(match[1]));
    }
  }
  
  return null;
};

// Extract image from Reddit post
const extractImage = (post) => {
  // Check for direct image URL
  if (post.url && isImageUrl(post.url)) {
    return {
      url: post.url,
      thumbnail: post.thumbnail || null,
      source: 'reddit'
    };
  }
  
  // Check preview images
  if (post.preview && post.preview.images && post.preview.images.length > 0) {
    const image = post.preview.images[0];
    return {
      url: decodeHtmlEntities(image.source.url),
      thumbnail: image.resolutions?.[0]?.url ? decodeHtmlEntities(image.resolutions[0].url) : null,
      source: 'reddit'
    };
  }
  
  // Check media metadata
  if (post.media_metadata) {
    const firstKey = Object.keys(post.media_metadata)[0];
    if (firstKey && post.media_metadata[firstKey].s) {
      return {
        url: decodeHtmlEntities(post.media_metadata[firstKey].s.u),
        thumbnail: post.media_metadata[firstKey].p?.[0]?.u || null,
        source: 'reddit'
      };
    }
  }
  
  // No image found
  return {
    url: null,
    thumbnail: null,
    source: 'none'
  };
};

// Check if URL is an image
const isImageUrl = (url) => {
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(url) || 
         url.includes('i.redd.it') || 
         url.includes('imgur.com');
};

// Decode HTML entities in URLs
const decodeHtmlEntities = (text) => {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
};

// Categorize item based on text
const categorizeItem = (text, brand) => {
  const textLower = text.toLowerCase();
  
  const categories = {
    'handbag': ['purse', 'bag', 'handbag', 'clutch', 'tote', 'satchel', 'crossbody'],
    'footwear': ['shoe', 'sneaker', 'boot', 'sandal', 'heel', 'loafer', 'pump'],
    'outerwear': ['jacket', 'coat', 'blazer', 'windbreaker', 'parka', 'vest'],
    'clothing': ['shirt', 'dress', 'skirt', 'pants', 'jeans', 'sweater', 'blouse'],
    'accessories': ['watch', 'belt', 'wallet', 'scarf', 'hat', 'sunglasses'],
    'jewelry': ['necklace', 'ring', 'bracelet', 'earring', 'pendant', 'brooch'],
    'home': ['pyrex', 'dish', 'bowl', 'vase', 'lamp', 'decor', 'furniture'],
    'electronics': ['phone', 'laptop', 'camera', 'headphone', 'speaker', 'tablet'],
    'collectibles': ['vintage', 'antique', 'collectible', 'rare', 'limited edition']
  };
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => textLower.includes(keyword))) {
      return category;
    }
  }
  
  // Default based on brand
  if (brand && ['Coach', 'Louis Vuitton', 'Gucci', 'Kate Spade'].includes(brand)) {
    return 'handbag';
  }
  
  return 'other';
};

// Clean title for display
const cleanTitle = (title) => {
  return title
    .replace(/\[.*?\]/g, '') // Remove [tags]
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 200); // Limit length
};

// Clean text for description
const cleanText = (text) => {
  return text
    .replace(/https?:\/\/[^\s]+/g, '') // Remove URLs
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 500); // Limit length
};

// Save normalized data to database
const saveValuation = async (normalizedData) => {
  const db = getDatabase();
  
  // Check if already exists
  const existing = db.prepare('SELECT id FROM valuations WHERE source_id = ? AND source_type = ?')
    .get(normalizedData.source_id, normalizedData.source_type);
  
  if (existing) {
    console.log(`Valuation already exists for ${normalizedData.source_id}`);
    return existing.id;
  }
  
  // Insert new valuation
  const stmt = db.prepare(`
    INSERT INTO valuations (
      slug, source_type, source_id, source_url, source_subreddit, source_author, source_date,
      title, description, brand, model, category,
      image_url, image_thumbnail, image_source,
      buy_price,
      published, noindex
    ) VALUES (
      @slug, @source_type, @source_id, @source_url, @source_subreddit, @source_author, @source_date,
      @title, @description, @brand, @model, @category,
      @image_url, @image_thumbnail, @image_source,
      @buy_price,
      @published, @noindex
    )
  `);
  
  const result = stmt.run(normalizedData);
  
  // Track duplicates if found
  if (normalizedData.duplicates && normalizedData.duplicates.matches.length > 0) {
    const dupStmt = db.prepare(`
      INSERT INTO valuation_duplicates (primary_id, duplicate_id, similarity_score)
      VALUES (?, ?, ?)
    `);
    
    for (const dup of normalizedData.duplicates.matches) {
      dupStmt.run(result.lastInsertRowid, dup.id, 0.8);
    }
  }
  
  return result.lastInsertRowid;
};

module.exports = {
  normalizeRedditPost,
  saveValuation
};