const express = require('express');
const router = express.Router();
const { runRedditAutomation, startAutomation, fetchRedditPosts, processRedditPost } = require('../growth/redditAutomation');
const { getDatabase } = require('../database');
const { generateSlug } = require('../database/valuationSchema');

// Track automation state
let automationInterval = null;
let automationRunning = false;
let lastRun = null;
let nextRun = null;

// Start automation
router.post('/api/automation/start', async (req, res) => {
  try {
    // Simple auth check
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== process.env.ADMIN_AUTOMATION_KEY && adminKey !== 'flippi-automate-2025') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (automationRunning) {
      return res.json({
        success: false,
        message: 'Automation already running',
        next_run: nextRun
      });
    }
    
    const intervalMinutes = parseInt(req.body.interval) || 30;
    
    console.log(`[Automation] Starting with ${intervalMinutes} minute interval`);
    
    // Run immediately
    runRedditAutomation().then(stats => {
      lastRun = {
        time: new Date().toISOString(),
        stats
      };
    });
    
    // Schedule future runs
    automationInterval = setInterval(async () => {
      nextRun = new Date(Date.now() + intervalMinutes * 60 * 1000).toISOString();
      
      const stats = await runRedditAutomation();
      lastRun = {
        time: new Date().toISOString(),
        stats
      };
    }, intervalMinutes * 60 * 1000);
    
    automationRunning = true;
    nextRun = new Date(Date.now() + intervalMinutes * 60 * 1000).toISOString();
    
    res.json({
      success: true,
      message: 'Automation started',
      interval_minutes: intervalMinutes,
      next_run: nextRun
    });
    
  } catch (error) {
    console.error('[Automation] Start error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stop automation
router.post('/api/automation/stop', async (req, res) => {
  try {
    // Simple auth check
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== process.env.ADMIN_AUTOMATION_KEY && adminKey !== 'flippi-automate-2025') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (!automationRunning) {
      return res.json({
        success: false,
        message: 'Automation not running'
      });
    }
    
    clearInterval(automationInterval);
    automationInterval = null;
    automationRunning = false;
    nextRun = null;
    
    res.json({
      success: true,
      message: 'Automation stopped',
      last_run: lastRun
    });
    
  } catch (error) {
    console.error('[Automation] Stop error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get automation status
router.get('/api/automation/status', async (req, res) => {
  try {
    const db = getDatabase();
    
    // Get recent valuations
    const recentValuations = db.prepare(`
      SELECT COUNT(*) as count, 
             MAX(created_at) as latest,
             MIN(created_at) as earliest
      FROM valuations 
      WHERE source_type = 'reddit' 
      AND created_at > datetime('now', '-24 hours')
    `).get();
    
    // Get stats by subreddit
    const subredditStats = db.prepare(`
      SELECT source_subreddit, COUNT(*) as count
      FROM valuations
      WHERE source_type = 'reddit'
      AND created_at > datetime('now', '-24 hours')
      GROUP BY source_subreddit
      ORDER BY count DESC
    `).all();
    
    res.json({
      running: automationRunning,
      last_run: lastRun,
      next_run: nextRun,
      stats_24h: {
        total: recentValuations.count,
        latest: recentValuations.latest,
        earliest: recentValuations.earliest,
        by_subreddit: subredditStats
      }
    });
    
  } catch (error) {
    console.error('[Automation] Status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Manual trigger
router.post('/api/automation/run', async (req, res) => {
  try {
    // Simple auth check
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== process.env.ADMIN_AUTOMATION_KEY && adminKey !== 'flippi-automate-2025') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const subreddit = req.body.subreddit;
    
    res.json({
      success: true,
      message: 'Automation triggered',
      note: 'Running in background...'
    });
    
    // Run in background
    runRedditAutomation().then(stats => {
      console.log('[Automation] Manual run complete:', stats);
      lastRun = {
        time: new Date().toISOString(),
        stats,
        manual: true
      };
    });
    
  } catch (error) {
    console.error('[Automation] Manual run error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get available posts for manual selection
router.get('/api/automation/posts/available', async (req, res) => {
  try {
    const subreddit = req.query.subreddit || 'ThriftStoreHauls';
    const limit = parseInt(req.query.limit) || 20;
    
    console.log(`[Automation] Fetching posts from r/${subreddit} for manual selection`);
    
    // Fetch posts from Reddit RSS
    const posts = await fetchRedditPosts(subreddit, limit);
    
    // Get already processed posts
    const db = getDatabase();
    const processedIds = db.prepare(`
      SELECT source_id FROM valuations 
      WHERE source_type = 'reddit' 
      AND source_subreddit = ?
    `).all(subreddit).map(row => row.source_id);
    
    // Mark which posts are already processed
    const postsWithStatus = posts.map(post => ({
      ...post,
      isProcessed: processedIds.includes(post.id),
      image_url: post.url, // RSS feed uses url for image
      permalink: post.permalink || `https://reddit.com/r/${subreddit}/comments/${post.id}/`
    }));
    
    // Filter to show only posts with images
    const postsWithImages = postsWithStatus.filter(post => 
      post.image_url && (
        post.image_url.includes('i.redd.it') || 
        post.image_url.includes('imgur') ||
        post.image_url.includes('.jpg') ||
        post.image_url.includes('.jpeg') ||
        post.image_url.includes('.png')
      )
    );
    
    res.json({
      success: true,
      posts: postsWithImages,
      total: postsWithImages.length,
      subreddit
    });
    
  } catch (error) {
    console.error('[Automation] Error fetching available posts:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      posts: [] 
    });
  }
});

// Create blog post from specific Reddit post
router.post('/api/automation/create-blog/:postId', async (req, res) => {
  try {
    // Simple auth check
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== process.env.ADMIN_AUTOMATION_KEY && adminKey !== 'flippi-automate-2025') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { postId } = req.params;
    const db = getDatabase();
    
    // Check if already processed
    const existing = db.prepare(`
      SELECT slug FROM valuations 
      WHERE source_id = ? AND source_type = 'reddit'
    `).get(postId);
    
    if (existing) {
      const port = process.env.PORT || 3000;
      const domain = port === '3002' ? 'blue.flippi.ai' : 
                     port === '3001' ? 'green.flippi.ai' : 'app.flippi.ai';
      
      return res.json({
        success: true,
        message: 'Post already processed',
        slug: existing.slug,
        url: `https://${domain}/value/${existing.slug}`
      });
    }
    
    // Fetch the specific post
    const subreddit = req.body.subreddit || 'ThriftStoreHauls';
    const posts = await fetchRedditPosts(subreddit, 50);
    const post = posts.find(p => p.id === postId);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    // Process the post to create valuation
    console.log(`[Automation] Manually processing post: ${post.title}`);
    const valuation = await processRedditPost(post);
    
    if (valuation && valuation.id) {
      const port = process.env.PORT || 3000;
      const domain = port === '3002' ? 'blue.flippi.ai' : 
                     port === '3001' ? 'green.flippi.ai' : 'app.flippi.ai';
      
      res.json({
        success: true,
        message: 'Blog post created successfully',
        valuationId: valuation.id,
        slug: valuation.slug,
        url: `https://${domain}/value/${valuation.slug}`
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to create valuation'
      });
    }
    
  } catch (error) {
    console.error('[Automation] Error creating blog post:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

module.exports = router;