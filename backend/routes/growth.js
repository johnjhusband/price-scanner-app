const express = require('express');
const router = express.Router();
const redditMonitor = require('../growth/redditMonitor');
const contentGenerator = require('../growth/contentGenerator');
const { getDatabase } = require('../database');

// GET /api/growth/status - Get growth automation status
router.get('/status', async (req, res) => {
  try {
    const stats = await redditMonitor.getStats();
    
    // Get content stats
    const db = getDatabase();
    const contentStats = db.prepare(`
      SELECT 
        COUNT(*) as total_content,
        SUM(CASE WHEN published = TRUE THEN 1 ELSE 0 END) as published,
        SUM(page_views) as total_views,
        SUM(conversions) as total_conversions
      FROM content_generated
    `).get();
    
    res.json({
      success: true,
      reddit: stats,
      content: contentStats
    });
  } catch (error) {
    console.error('[Growth API] Error getting status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get growth status'
    });
  }
});

// POST /api/growth/monitor/reddit - Trigger Reddit monitoring
router.post('/monitor/reddit', async (req, res) => {
  try {
    // Run monitor in background
    redditMonitor.monitorAll().then(count => {
      console.log(`[Growth API] Reddit monitor completed. Found ${count} new questions.`);
    }).catch(error => {
      console.error('[Growth API] Reddit monitor error:', error);
    });
    
    res.json({
      success: true,
      message: 'Reddit monitoring started in background'
    });
  } catch (error) {
    console.error('[Growth API] Error starting monitor:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start monitoring'
    });
  }
});

// GET /api/growth/questions - Get unprocessed questions
router.get('/questions', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const questions = await redditMonitor.getUnprocessedQuestions(limit);
    
    res.json({
      success: true,
      count: questions.length,
      questions
    });
  } catch (error) {
    console.error('[Growth API] Error getting questions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get questions'
    });
  }
});

// POST /api/growth/generate/:postId - Generate content for a specific question
router.post('/generate/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    
    // Get the question
    const db = getDatabase();
    const question = db.prepare('SELECT * FROM reddit_questions WHERE post_id = ?').get(postId);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        error: 'Question not found'
      });
    }
    
    // Generate content
    const content = await contentGenerator.generateFromRedditQuestion(question);
    
    // Save content
    const contentId = await contentGenerator.saveContent(content);
    
    // Mark question as processed
    await redditMonitor.markProcessed(postId);
    
    res.json({
      success: true,
      contentId,
      title: content.title,
      preview: content.content.substring(0, 200) + '...'
    });
  } catch (error) {
    console.error('[Growth API] Error generating content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate content'
    });
  }
});

// GET /api/growth/content - Get generated content
router.get('/content', async (req, res) => {
  try {
    const db = getDatabase();
    const limit = parseInt(req.query.limit) || 20;
    const published = req.query.published === 'true';
    
    let query = 'SELECT * FROM content_generated';
    const params = [];
    
    if (published !== undefined) {
      query += ' WHERE published = ?';
      params.push(published);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);
    
    const content = db.prepare(query).all(...params);
    
    res.json({
      success: true,
      count: content.length,
      content
    });
  } catch (error) {
    console.error('[Growth API] Error getting content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get content'
    });
  }
});

// POST /api/growth/content/:id/publish - Mark content as published
router.post('/content/:id/publish', async (req, res) => {
  try {
    const { id } = req.params;
    const { url } = req.body;
    
    const db = getDatabase();
    db.prepare(`
      UPDATE content_generated 
      SET published = TRUE, 
          published_at = CURRENT_TIMESTAMP,
          published_url = ?
      WHERE id = ?
    `).run(url || '', id);
    
    res.json({
      success: true,
      message: 'Content marked as published'
    });
  } catch (error) {
    console.error('[Growth API] Error publishing content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to publish content'
    });
  }
});

// POST /api/growth/content/:id/track - Track content performance
router.post('/content/:id/track', async (req, res) => {
  try {
    const { id } = req.params;
    const { pageViews, conversions } = req.body;
    
    const db = getDatabase();
    db.prepare(`
      UPDATE content_generated 
      SET page_views = ?, 
          conversions = ?
      WHERE id = ?
    `).run(pageViews || 0, conversions || 0, id);
    
    res.json({
      success: true,
      message: 'Content metrics updated'
    });
  } catch (error) {
    console.error('[Growth API] Error tracking content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track content'
    });
  }
});

// GET /api/growth/content/:id - Get specific content
router.get('/content/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const db = getDatabase();
    const content = db.prepare('SELECT * FROM content_generated WHERE id = ?').get(id);
    
    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Content not found'
      });
    }
    
    res.json({
      success: true,
      content
    });
  } catch (error) {
    console.error('[Growth API] Error getting content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get content'
    });
  }
});

module.exports = router;