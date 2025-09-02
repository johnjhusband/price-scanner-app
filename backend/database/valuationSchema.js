const Database = require('better-sqlite3');
const path = require('path');

// Valuation items schema
const createValuationTables = (db) => {
  // Main valuations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS valuations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      
      -- Source information
      source_type TEXT DEFAULT 'reddit',
      source_id TEXT NOT NULL,
      source_url TEXT,
      source_subreddit TEXT,
      source_author TEXT,
      source_date DATETIME,
      
      -- Item details
      title TEXT NOT NULL,
      description TEXT,
      brand TEXT,
      model TEXT,
      category TEXT,
      condition TEXT,
      
      -- Images
      image_url TEXT,
      image_thumbnail TEXT,
      image_source TEXT, -- 'reddit', 'generated', 'placeholder'
      
      -- Valuation data
      value_low INTEGER,
      value_high INTEGER,
      buy_price INTEGER,
      confidence REAL DEFAULT 0.5,
      currency TEXT DEFAULT 'USD',
      
      -- Platform recommendations
      recommended_platform TEXT,
      recommended_live_platform TEXT,
      platform_tips TEXT,
      
      -- SEO and content
      meta_description TEXT,
      meta_keywords TEXT,
      content_html TEXT,
      
      -- Tracking
      view_count INTEGER DEFAULT 0,
      click_count INTEGER DEFAULT 0,
      scan_count INTEGER DEFAULT 0,
      
      -- Status
      published BOOLEAN DEFAULT 1,
      noindex BOOLEAN DEFAULT 0,
      removed BOOLEAN DEFAULT 0,
      removed_reason TEXT,
      
      -- Timestamps
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_viewed_at DATETIME
    )
  `);
  
  // Create indexes separately
  db.exec(`CREATE INDEX IF NOT EXISTS idx_valuations_slug ON valuations(slug)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_valuations_source ON valuations(source_type, source_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_valuations_brand ON valuations(brand)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_valuations_category ON valuations(category)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_valuations_confidence ON valuations(confidence)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_valuations_published ON valuations(published, removed)`);

  // Duplicate tracking table
  db.exec(`
    CREATE TABLE IF NOT EXISTS valuation_duplicates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      primary_id INTEGER NOT NULL,
      duplicate_id INTEGER NOT NULL,
      similarity_score REAL,
      merge_status TEXT DEFAULT 'pending', -- 'pending', 'merged', 'kept_separate'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (primary_id) REFERENCES valuations(id),
      FOREIGN KEY (duplicate_id) REFERENCES valuations(id),
      UNIQUE(primary_id, duplicate_id)
    )
  `);

  // Analytics events table
  db.exec(`
    CREATE TABLE IF NOT EXISTS valuation_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      valuation_id INTEGER NOT NULL,
      event_type TEXT NOT NULL, -- 'page_view', 'cta_click', 'scan_started', 'widget_view'
      source TEXT, -- 'direct', 'rss', 'qr', 'widget', 'api'
      utm_source TEXT,
      utm_medium TEXT,
      utm_campaign TEXT,
      user_agent TEXT,
      ip_hash TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (valuation_id) REFERENCES valuations(id)
    )
  `);
  
  // Create indexes for events table
  db.exec(`CREATE INDEX IF NOT EXISTS idx_valuation_events ON valuation_events(valuation_id, event_type)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_event_date ON valuation_events(created_at)`);

  // Category learning table
  db.exec(`
    CREATE TABLE IF NOT EXISTS valuation_categories (
      category TEXT PRIMARY KEY,
      avg_ctr REAL DEFAULT 0,
      avg_conversion REAL DEFAULT 0,
      total_views INTEGER DEFAULT 0,
      total_scans INTEGER DEFAULT 0,
      priority_score REAL DEFAULT 0.5,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('Valuation tables created successfully');
};

// Slug generation rules
const generateSlug = (item) => {
  const { brand, model, title, source_id } = item;
  
  // Start with brand and model if available
  let slugParts = [];
  
  if (brand) {
    slugParts.push(brand.toLowerCase().replace(/[^a-z0-9]/g, '-'));
  }
  
  if (model) {
    slugParts.push(model.toLowerCase().replace(/[^a-z0-9]/g, '-'));
  }
  
  // If no brand/model, extract from title
  if (slugParts.length === 0 && title) {
    const titleWords = title.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .slice(0, 5); // First 5 words
    slugParts = titleWords;
  }
  
  // Add unique identifier (last 6 chars of source_id)
  const identifier = source_id.slice(-6);
  slugParts.push(identifier);
  
  // Join and clean
  let slug = slugParts.join('-')
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '');
  
  // Ensure reasonable length
  if (slug.length > 60) {
    slug = slug.substring(0, 60).replace(/-[^-]*$/, '');
  }
  
  return slug;
};

// Extract brand from text
const extractBrand = (text) => {
  const brands = [
    // Luxury
    'Louis Vuitton', 'Chanel', 'Gucci', 'Hermès', 'Prada', 'Fendi', 'Dior', 
    'Balenciaga', 'Burberry', 'Coach', 'Kate Spade', 'Michael Kors',
    'Bottega Veneta', 'Celine', 'Givenchy', 'Saint Laurent', 'YSL',
    'Valentino', 'Versace', 'Dolce & Gabbana', 'Miu Miu',
    
    // Contemporary
    'Marc Jacobs', 'Tory Burch', 'Rebecca Minkoff', 'Longchamp',
    'Furla', 'MCM', 'Mansur Gavriel', 'Proenza Schouler',
    
    // Sportswear
    'Nike', 'Adidas', 'Puma', 'Reebok', 'New Balance', 'Under Armour',
    'Lululemon', 'Athleta', 'Champion', 'Fila', 'Patagonia', 'North Face',
    'Columbia', 'Arc\'teryx', 'Outdoor Voices',
    
    // Fashion
    'Zara', 'H&M', 'Gap', 'Banana Republic', 'J.Crew', 'Madewell',
    'Anthropologie', 'Free People', 'Urban Outfitters', 'ModCloth',
    'ASOS', 'Forever 21', 'Old Navy', 'Target', 'Walmart',
    
    // Vintage/Designer
    'Levi\'s', 'Levis', 'Wrangler', 'Lee', 'Calvin Klein', 'Ralph Lauren',
    'Tommy Hilfiger', 'Polo', 'Lacoste', 'Brooks Brothers',
    
    // Home/Kitchen
    'Pyrex', 'Corning', 'Le Creuset', 'KitchenAid', 'Cuisinart',
    'All-Clad', 'Lodge', 'Fiesta', 'Dansk', 'Wedgwood'
  ];
  
  const textLower = text.toLowerCase();
  
  for (const brand of brands) {
    if (textLower.includes(brand.toLowerCase())) {
      return brand;
    }
  }
  
  return null;
};

// Extract model/style from text
const extractModel = (text, brand) => {
  // Common model patterns
  const patterns = [
    /model\s*#?\s*([A-Z0-9-]+)/i,
    /style\s*#?\s*([A-Z0-9-]+)/i,
    /serial\s*#?\s*([A-Z0-9-]+)/i,
    /item\s*#?\s*([A-Z0-9-]+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  // Brand-specific patterns
  if (brand && brand.toLowerCase().includes('coach')) {
    const coachPattern = /([A-Z]\d{2}-\d{4,5})/;
    const match = text.match(coachPattern);
    if (match) return match[1];
  }
  
  return null;
};

// Detect duplicates
const findDuplicates = (db, item) => {
  const { title, brand, model } = item;
  
  // Exact brand + model match
  if (brand && model) {
    const exact = db.prepare(`
      SELECT id, slug, confidence 
      FROM valuations 
      WHERE brand = ? AND model = ? 
      AND removed = 0
      LIMIT 5
    `).all(brand, model);
    
    if (exact.length > 0) {
      return { type: 'exact', matches: exact };
    }
  }
  
  // Similar title match
  const titleWords = title.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3);
  
  if (titleWords.length >= 3) {
    const searchPattern = titleWords.slice(0, 3).join(' ');
    const similar = db.prepare(`
      SELECT id, slug, title, confidence
      FROM valuations
      WHERE title LIKE ?
      AND removed = 0
      LIMIT 5
    `).all(`%${searchPattern}%`);
    
    if (similar.length > 0) {
      return { type: 'similar', matches: similar };
    }
  }
  
  return null;
};

module.exports = {
  createValuationTables,
  generateSlug,
  extractBrand,
  extractModel,
  findDuplicates
};