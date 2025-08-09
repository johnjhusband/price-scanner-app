const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database');
const path = require('path');

// Serve valuation page
router.get('/value/:slug', async (req, res) => {
  const { slug } = req.params;
  const source = req.query.src || 'direct';
  
  try {
    const db = getDatabase();
    
    // Get valuation data
    const valuation = db.prepare(`
      SELECT * FROM valuations 
      WHERE slug = ? AND published = 1 AND removed = 0
    `).get(slug);
    
    if (!valuation) {
      return res.status(404).send('Valuation not found');
    }
    
    // Track page view
    try {
      db.prepare(`
        INSERT INTO valuation_events (
          valuation_id, event_type, source, user_agent, ip_hash
        ) VALUES (?, 'page_view', ?, ?, ?)
      `).run(
        valuation.id,
        source,
        req.headers['user-agent'],
        hashIP(req.ip)
      );
      
      // Update view count
      db.prepare('UPDATE valuations SET view_count = view_count + 1 WHERE id = ?')
        .run(valuation.id);
    } catch (trackError) {
      console.error('Tracking error:', trackError);
    }
    
    // Generate meta tags
    const metaTags = {
      title: `${valuation.title} - Value: $${valuation.value_low}-$${valuation.value_high}`,
      description: valuation.meta_description || `Current market value for ${valuation.title}. Get instant valuations for similar items with Flippi.ai`,
      image: valuation.image_thumbnail || valuation.image_url || '/images/default-share.png',
      url: `https://flippi.ai/value/${slug}`
    };
    
    // Render the page
    const html = generateValuationHTML(valuation, metaTags, source);
    res.send(html);
    
  } catch (error) {
    console.error('Error serving valuation page:', error);
    res.status(500).send('Internal server error');
  }
});

// Track CTA clicks
router.post('/value/:slug/click', async (req, res) => {
  const { slug } = req.params;
  const { action, source } = req.body;
  
  try {
    const db = getDatabase();
    
    // Get valuation
    const valuation = db.prepare('SELECT id FROM valuations WHERE slug = ?').get(slug);
    if (!valuation) {
      return res.status(404).json({ error: 'Not found' });
    }
    
    // Track click
    db.prepare(`
      INSERT INTO valuation_events (
        valuation_id, event_type, source, user_agent, ip_hash
      ) VALUES (?, ?, ?, ?, ?)
    `).run(
      valuation.id,
      action || 'cta_click',
      source || 'unknown',
      req.headers['user-agent'],
      hashIP(req.ip)
    );
    
    // Update click count
    db.prepare('UPDATE valuations SET click_count = click_count + 1 WHERE id = ?')
      .run(valuation.id);
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('Error tracking click:', error);
    res.status(500).json({ error: 'Failed to track' });
  }
});

// Simple IP hashing for privacy
function hashIP(ip) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(ip || 'unknown').digest('hex').substring(0, 16);
}

// Generate HTML for valuation page
function generateValuationHTML(valuation, meta, source) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${meta.title}</title>
  <meta name="description" content="${meta.description}">
  
  <!-- Open Graph -->
  <meta property="og:title" content="${meta.title}">
  <meta property="og:description" content="${meta.description}">
  <meta property="og:image" content="${meta.image}">
  <meta property="og:url" content="${meta.url}">
  <meta property="og:type" content="website">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${meta.title}">
  <meta name="twitter:description" content="${meta.description}">
  <meta name="twitter:image" content="${meta.image}">
  
  ${valuation.noindex ? '<meta name="robots" content="noindex">' : ''}
  
  <!-- Schema.org -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "${valuation.title}",
    "description": "${valuation.description || ''}",
    ${valuation.brand ? `"brand": { "@type": "Brand", "name": "${valuation.brand}" },` : ''}
    ${valuation.image_url ? `"image": "${valuation.image_url}",` : ''}
    "offers": {
      "@type": "AggregateOffer",
      "priceCurrency": "USD",
      "lowPrice": "${valuation.value_low}",
      "highPrice": "${valuation.value_high}"
    }
  }
  </script>
  
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: white;
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #10B981;
      text-decoration: none;
    }
    .main {
      background: white;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .item-image {
      width: 100%;
      max-width: 400px;
      height: 300px;
      object-fit: contain;
      background: #f9f9f9;
      border-radius: 8px;
      margin: 0 auto 20px;
      display: block;
    }
    .no-image {
      width: 100%;
      max-width: 400px;
      height: 300px;
      background: #f0f0f0;
      border-radius: 8px;
      margin: 0 auto 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
      font-size: 18px;
    }
    h1 {
      font-size: 28px;
      margin-bottom: 10px;
      color: #1a1a1a;
    }
    .brand {
      color: #666;
      font-size: 18px;
      margin-bottom: 20px;
    }
    .value-range {
      font-size: 36px;
      color: #10B981;
      font-weight: bold;
      margin: 20px 0;
      text-align: center;
    }
    .details {
      background: #f9f9f9;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #eee;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-weight: 600;
      color: #666;
    }
    .cta-section {
      margin: 30px 0;
      text-align: center;
    }
    .cta-button {
      display: inline-block;
      background: #10B981;
      color: white;
      padding: 16px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-size: 18px;
      font-weight: 600;
      transition: background 0.2s;
    }
    .cta-button:hover {
      background: #059669;
    }
    .cta-text {
      margin-top: 10px;
      color: #666;
      font-size: 14px;
    }
    .source-footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      font-size: 14px;
      color: #999;
    }
    .source-footer a {
      color: #10B981;
      text-decoration: none;
    }
    .confidence-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 14px;
      margin-left: 10px;
    }
    .confidence-high {
      background: #D1FAE5;
      color: #065F46;
    }
    .confidence-medium {
      background: #FEF3C7;
      color: #92400E;
    }
    .confidence-low {
      background: #FEE2E2;
      color: #991B1B;
    }
    @media (max-width: 600px) {
      .container { padding: 10px; }
      .main { padding: 20px; }
      h1 { font-size: 24px; }
      .value-range { font-size: 30px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="/" class="logo">flippi.ai</a>
    </div>
    
    <div class="main">
      ${valuation.image_url ? 
        `<img src="${valuation.image_url}" alt="${valuation.title}" class="item-image" onerror="this.style.display='none'">` :
        `<div class="no-image">No image available</div>`
      }
      
      <h1>${valuation.title}</h1>
      ${valuation.brand ? `<div class="brand">${valuation.brand}</div>` : ''}
      
      <div class="value-range">
        $${valuation.value_low} - $${valuation.value_high}
        <span class="confidence-badge ${
          valuation.confidence > 0.7 ? 'confidence-high' : 
          valuation.confidence > 0.5 ? 'confidence-medium' : 
          'confidence-low'
        }">
          ${valuation.confidence > 0.7 ? 'High' : 
            valuation.confidence > 0.5 ? 'Medium' : 
            'Low'} Confidence
        </span>
      </div>
      
      <div class="details">
        ${valuation.buy_price ? `
        <div class="detail-row">
          <span class="detail-label">Original Price Paid:</span>
          <span>$${valuation.buy_price}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Potential Profit:</span>
          <span style="color: #10B981; font-weight: bold;">
            $${Math.round((valuation.value_low + valuation.value_high) / 2 - valuation.buy_price)}
          </span>
        </div>
        ` : ''}
        <div class="detail-row">
          <span class="detail-label">Best Platform:</span>
          <span>${valuation.recommended_platform || 'eBay'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Category:</span>
          <span>${valuation.category || 'General'}</span>
        </div>
        ${valuation.platform_tips ? `
        <div class="detail-row">
          <span class="detail-label">Selling Tip:</span>
          <span>${valuation.platform_tips}</span>
        </div>
        ` : ''}
      </div>
      
      <div class="cta-section">
        <a href="/?ref=valuation&src=${source}" class="cta-button" onclick="trackClick('scan_cta')">
          Scan Your Similar Item
        </a>
        <div class="cta-text">
          Get instant valuations with photo scanning
        </div>
      </div>
      
      ${valuation.source_url ? `
      <div class="source-footer">
        Original question from <a href="${valuation.source_url}" target="_blank" rel="nofollow">
          r/${valuation.source_subreddit}
        </a>
        • Valuation generated by Flippi.ai
      </div>
      ` : ''}
    </div>
  </div>
  
  <script>
    function trackClick(action) {
      fetch('/value/${valuation.slug}/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, source: '${source}' })
      }).catch(() => {});
    }
  </script>
</body>
</html>`;
}

module.exports = router;