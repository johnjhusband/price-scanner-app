const express = require('express');
const router = express.Router();
const redditMonitor = require('../growth/redditMonitor');
const contentGenerator = require('../growth/contentGenerator');
const { getDatabase } = require('../../backend/database');

// GET /api/growth/status - Get growth automation status
router.get('/status', async (req, res) => {
  try {
    const stats = await redditMonitor.getStats();
    
    // Get content stats
    const contentStats = await contentGenerator.getContentStats();
    
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
    const newQuestions = await redditMonitor.monitorAll();
    
    res.json({
      success: true,
      new_questions: newQuestions,
      message: `Found ${newQuestions} new questions`
    });
  } catch (error) {
    console.error('[Growth API] Error monitoring Reddit:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to monitor Reddit'
    });
  }
});

// GET /api/growth/questions - Get Reddit questions
router.get('/questions', async (req, res) => {
  try {
    const db = getDatabase();
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    const questions = db.prepare(`
      SELECT * FROM reddit_questions 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `).all(limit, offset);
    
    res.json({
      success: true,
      questions: questions
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
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    
    const content = await contentGenerator.getContent(limit, offset);
    
    res.json({
      success: true,
      content: content
    });
  } catch (error) {
    console.error('[Growth API] Error getting content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get content'
    });
  }
});

// GET /api/growth/analytics/summary - Get analytics summary
router.get('/analytics/summary', async (req, res) => {
  try {
    const db = getDatabase();
    
    // Get question analytics
    const questionStats = db.prepare(`
      SELECT 
        COUNT(*) as total_questions,
        COUNT(CASE WHEN processed = TRUE THEN 1 END) as processed_questions,
        COUNT(CASE WHEN url LIKE '%i.redd.it%' OR url LIKE '%imgur%' OR url LIKE '%.jpg%' OR url LIKE '%.png%' OR url LIKE '%.jpeg%' THEN 1 END) as questions_with_images,
        COUNT(CASE WHEN created_at > datetime('now', '-7 days') THEN 1 END) as questions_last_week
      FROM reddit_questions
    `).get();
    
    // Get content analytics
    const contentStats = await contentGenerator.getContentStats();
    
    res.json({
      success: true,
      questions: questionStats,
      content: contentStats,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Growth API] Error getting analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get analytics'
    });
  }
});

module.exports = router;
