const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database');

// Get valuation by slug
router.get('/api/valuations/:slug', (req, res) => {
  try {
    const { slug } = req.params;
    const db = getDatabase();
    
    const valuation = db.prepare(`
      SELECT 
        v.*,
        GROUP_CONCAT(p.platform_name) as platforms
      FROM valuations v
      LEFT JOIN valuation_platforms p ON v.id = p.valuation_id
      WHERE v.slug = ?
      GROUP BY v.id
    `).get(slug);
    
    if (!valuation) {
      return res.status(404).json({ error: 'Valuation not found' });
    }
    
    // Parse platforms
    if (valuation.platforms) {
      valuation.platforms = valuation.platforms.split(',');
    }
    
    res.json(valuation);
  } catch (error) {
    console.error('Error fetching valuation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get public valuations feed
router.get('/api/public/valuations', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const db = getDatabase();
    
    const valuations = db.prepare(`
      SELECT 
        id, slug, title, min_value, max_value, 
        category, created_at, image_url
      FROM valuations
      WHERE confidence >= 0.55
      ORDER BY created_at DESC
      LIMIT ?
    `).all(limit);
    
    res.json({
      valuations,
      count: valuations.length,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching public valuations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// RSS feed for valuations
router.get('/rss/valuations.xml', (req, res) => {
  try {
    const db = getDatabase();
    const valuations = db.prepare(`
      SELECT * FROM valuations
      WHERE confidence >= 0.55
      ORDER BY created_at DESC
      LIMIT 100
    `).all();
    
    const baseUrl = `https://${req.get('host')}`;
    
    let rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Flippi.ai Valuations</title>
    <link>${baseUrl}</link>
    <description>Latest thrift store finds and valuations</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/rss/valuations.xml" rel="self" type="application/rss+xml" />`;
    
    valuations.forEach(item => {
      rss += `
    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${baseUrl}/value/${item.slug}</link>
      <guid isPermaLink="true">${baseUrl}/value/${item.slug}</guid>
      <description>${escapeXml(item.description || `Estimated value: $${item.min_value} - $${item.max_value}`)}</description>
      <pubDate>${new Date(item.created_at).toUTCString()}</pubDate>
      ${item.image_url ? `<enclosure url="${item.image_url}" type="image/jpeg" />` : ''}
    </item>`;
    });
    
    rss += `
  </channel>
</rss>`;
    
    res.set('Content-Type', 'application/rss+xml');
    res.send(rss);
  } catch (error) {
    console.error('Error generating RSS:', error);
    res.status(500).send('Error generating RSS feed');
  }
});

// Helper function to escape XML
function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

module.exports = router;