const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database');

// Test route to create Hello Kitty valuation
router.get('/api/test/create-hello-kitty', (req, res) => {
  try {
    const db = getDatabase();
    
    // Check if tables exist
    const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='valuations'").get();
    
    if (!tableCheck) {
      // Create valuations table if it doesn't exist
      db.exec(`
        CREATE TABLE IF NOT EXISTS valuations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          slug TEXT UNIQUE NOT NULL,
          source_type TEXT,
          source_id TEXT,
          source_url TEXT,
          source_subreddit TEXT,
          source_author TEXT,
          source_date TEXT,
          title TEXT NOT NULL,
          description TEXT,
          brand TEXT,
          model TEXT,
          category TEXT,
          image_url TEXT,
          image_thumbnail TEXT,
          min_value REAL,
          max_value REAL,
          estimated_value REAL,
          confidence REAL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }
    
    // Insert Hello Kitty valuation
    const result = db.prepare(`
      INSERT OR REPLACE INTO valuations (
        slug, source_type, source_id, source_url, source_subreddit,
        source_author, source_date, title, description, brand,
        model, category, image_url, image_thumbnail,
        min_value, max_value, estimated_value, confidence
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'hello-kitty-thrifted-shirt-vintage-find',
      'reddit',
      '1mnkjae',
      'https://www.reddit.com/r/ThriftStoreHauls/comments/1mnkjae/i_thrifted_this_hello_kitty_shirt/',
      'ThriftStoreHauls',
      'xoxoz0mb1e',
      '2025-08-11T18:10:15.000Z',
      'I thrifted this Hello Kitty shirt',
      'A vintage Hello Kitty graphic t-shirt found at a thrift store. This appears to be an authentic Sanrio licensed product featuring the classic Hello Kitty character design. The shirt shows good condition with vibrant colors and intact graphics.',
      'Sanrio',
      'Hello Kitty Graphic Tee',
      'Clothing & Accessories',
      'https://preview.redd.it/786jvdd4lfif1.jpeg?width=640&crop=smart&auto=webp&s=554ec205b5e900ba0390dc48e8b55dba2a86ed62',
      'https://preview.redd.it/786jvdd4lfif1.jpeg?width=320&crop=smart&auto=webp&s=554ec205b5e900ba0390dc48e8b55dba2a86ed62',
      15,
      35,
      25,
      0.75
    );
    
    res.json({
      success: true,
      message: 'Hello Kitty valuation created',
      id: result.lastInsertRowid,
      viewUrl: 'https://blue.flippi.ai/value/hello-kitty-thrifted-shirt-vintage-find'
    });
    
  } catch (error) {
    console.error('Error creating test valuation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Simple HTML page to display valuation
router.get('/value/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const db = getDatabase();
    
    const valuation = db.prepare(`
      SELECT * FROM valuations WHERE slug = ?
    `).get(slug);
    
    if (!valuation) {
      return res.status(404).send('Valuation not found');
    }
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${valuation.title} - Worth $${valuation.min_value}-$${valuation.max_value} | Flippi.ai</title>
    <meta name="description" content="${valuation.description.substring(0, 155)}...">
    
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f8f9fa;
            color: #333;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
        }
        .meta {
            color: #666;
            font-size: 0.9rem;
        }
        .content {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .image img {
            width: 100%;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .value-box {
            background: #10B981;
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 20px;
        }
        .value-range {
            font-size: 2rem;
            font-weight: bold;
        }
        .cta {
            background: #f3f4f6;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin-top: 20px;
        }
        .cta-button {
            display: inline-block;
            background: #10B981;
            color: white;
            padding: 12px 30px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: bold;
        }
        .cta-button:hover {
            background: #059669;
        }
        @media (max-width: 768px) {
            .content {
                grid-template-columns: 1fr;
            }
            h1 {
                font-size: 1.8rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${valuation.title}</h1>
            <div class="meta">
                Found by u/${valuation.source_author} • ${new Date(valuation.source_date).toLocaleDateString()}
            </div>
        </div>
        
        <div class="content">
            <div class="image">
                <img src="${valuation.image_url}" alt="${valuation.title}">
            </div>
            
            <div class="details">
                <div class="value-box">
                    <h2>Estimated Value</h2>
                    <div class="value-range">$${valuation.min_value} - $${valuation.max_value}</div>
                </div>
                
                <p><strong>Brand:</strong> ${valuation.brand}</p>
                <p><strong>Category:</strong> ${valuation.category}</p>
                <p><strong>Confidence:</strong> ${(valuation.confidence * 100).toFixed(0)}%</p>
                
                <h3>Description</h3>
                <p>${valuation.description}</p>
                
                <div class="cta">
                    <h3>Want to value your own finds?</h3>
                    <a href="/scan" class="cta-button">Scan with Flippi</a>
                    <p>Get instant valuations for your thrift store treasures!</p>
                </div>
            </div>
        </div>
        
        <footer style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #666;">
            <p>Original post on <a href="${valuation.source_url}" style="color: #10B981;">Reddit</a></p>
            <p style="font-size: 0.85rem; font-style: italic;">Valuations are estimates based on AI analysis and market data. Actual value may vary.</p>
        </footer>
    </div>
</body>
</html>`;
    
    res.send(html);
    
  } catch (error) {
    console.error('Error displaying valuation:', error);
    res.status(500).send('Error loading valuation');
  }
});

module.exports = router;