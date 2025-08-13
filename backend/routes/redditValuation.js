const express = require('express');
const router = express.Router();
const { processRedditPost } = require('../services/valuationService');
const { getDatabase } = require('../database');

// Process single Reddit post
router.post('/api/reddit/process', async (req, res) => {
  try {
    const { post } = req.body;
    
    if (!post || !post.id) {
      return res.status(400).json({ error: 'Invalid post data' });
    }
    
    // Process the post
    const result = await processRedditPost(post);
    
    res.json({
      success: true,
      valuation: {
        id: result.id,
        slug: result.slug,
        url: `/value/${result.slug}`,
        qr_url: `/qr/value/${result.slug}.svg`,
        value_range: `$${result.value_low}-$${result.value_high}`,
        confidence: result.confidence
      }
    });
    
  } catch (error) {
    console.error('Error processing Reddit post:', error);
    res.status(500).json({ 
      error: 'Failed to process post',
      message: error.message 
    });
  }
});

// Get recent valuations
router.get('/api/valuations/recent', async (req, res) => {
  try {
    const db = getDatabase();
    const limit = parseInt(req.query.limit) || 20;
    
    const valuations = db.prepare(`
      SELECT 
        id, slug, title, brand, value_low, value_high, 
        confidence, view_count, click_count, created_at
      FROM valuations 
      WHERE published = 1 AND removed = 0
      ORDER BY created_at DESC
      LIMIT ?
    `).all(limit);
    
    res.json({
      success: true,
      valuations,
      count: valuations.length
    });
    
  } catch (error) {
    console.error('Error fetching valuations:', error);
    res.status(500).json({ error: 'Failed to fetch valuations' });
  }
});

// Get valuation stats
router.get('/api/valuations/stats', async (req, res) => {
  try {
    const db = getDatabase();
    
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_valuations,
        SUM(view_count) as total_views,
        SUM(click_count) as total_clicks,
        AVG(confidence) as avg_confidence
      FROM valuations 
      WHERE published = 1 AND removed = 0
    `).get();
    
    const topPerformers = db.prepare(`
      SELECT 
        slug, title, view_count, click_count,
        CAST(click_count AS FLOAT) / NULLIF(view_count, 0) as ctr
      FROM valuations 
      WHERE published = 1 AND removed = 0 AND view_count > 10
      ORDER BY ctr DESC
      LIMIT 10
    `).all();
    
    res.json({
      success: true,
      stats,
      top_performers: topPerformers
    });
    
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Test endpoint with sample data
router.get('/api/reddit/test', async (req, res) => {
  // Sample Reddit post for testing
  const samplePost = {
    id: 'test123',
    post_id: 'test123',
    title: 'Found this vintage Coach purse at Goodwill for $15!',
    selftext: 'Brown leather with brass hardware, looks like its from the 90s. Serial number starts with D5C. Is it worth anything?',
    author: 'thriftfinder',
    subreddit: 'thriftstorehauls',
    url: 'https://reddit.com/r/thriftstorehauls/test123',
    created_utc: Date.now() / 1000
  };
  
  try {
    const result = await processRedditPost(samplePost);
    res.json({
      success: true,
      message: 'Test valuation created',
      valuation: {
        url: `/value/${result.slug}`,
        qr_url: `/qr/value/${result.slug}.svg`,
        print_url: `/qr/value/${result.slug}/print`
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;