const express = require('express');
const router = express.Router();
const { runRedditAutomation, startAutomation } = require('../growth/redditAutomation');
const { getDatabase } = require('../database');

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

module.exports = router;