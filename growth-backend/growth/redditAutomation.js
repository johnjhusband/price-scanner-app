const redditMonitor = require('./redditMonitor');
const contentGenerator = require('./contentGenerator');
const logger = require('../../backend/utils/logger');

let automationInterval = null;
let automationRunning = false;

async function runRedditAutomation() {
  if (automationRunning) {
    logger.warn('[Reddit Automation] Already running, skipping');
    return { status: 'already_running' };
  }

  automationRunning = true;
  logger.info('[Reddit Automation] Starting Reddit automation cycle');

  try {
    // Monitor Reddit for new questions
    const newQuestions = await redditMonitor.monitorAll();
    
    // Get unprocessed questions
    const { getDatabase } = require('../../backend/database');
    const db = getDatabase();
    const unprocessedQuestions = db.prepare(`
      SELECT * FROM reddit_questions 
      WHERE processed = FALSE 
      ORDER BY created_at DESC 
      LIMIT 5
    `).all();

    let contentGenerated = 0;

    // Generate content for unprocessed questions
    for (const question of unprocessedQuestions) {
      try {
        logger.info(`[Reddit Automation] Generating content for: ${question.title}`);
        const content = await contentGenerator.generateFromRedditQuestion(question);
        await contentGenerator.saveContent(content);
        await redditMonitor.markProcessed(question.post_id);
        contentGenerated++;
      } catch (error) {
        logger.error(`[Reddit Automation] Error generating content for ${question.post_id}:`, error);
      }
    }

    const stats = {
      new_questions: newQuestions,
      content_generated: contentGenerated,
      timestamp: new Date().toISOString()
    };

    logger.info(`[Reddit Automation] Cycle complete: ${JSON.stringify(stats)}`);
    return stats;

  } catch (error) {
    logger.error('[Reddit Automation] Error in automation cycle:', error);
    return { error: error.message };
  } finally {
    automationRunning = false;
  }
}

function startAutomation(intervalMinutes = 30) {
  if (automationInterval) {
    logger.warn('[Reddit Automation] Automation already started');
    return;
  }

  logger.info(`[Reddit Automation] Starting automation with ${intervalMinutes} minute interval`);

  // Run immediately
  runRedditAutomation();

  // Schedule future runs
  automationInterval = setInterval(async () => {
    try {
      await runRedditAutomation();
    } catch (error) {
      logger.error('[Reddit Automation] Error in scheduled run:', error);
    }
  }, intervalMinutes * 60 * 1000);
}

function stopAutomation() {
  if (automationInterval) {
    clearInterval(automationInterval);
    automationInterval = null;
    logger.info('[Reddit Automation] Automation stopped');
  }
}

function getAutomationStatus() {
  return {
    running: !!automationInterval,
    automation_running: automationRunning,
    interval_minutes: automationInterval ? 30 : null // Default interval
  };
}

async function fetchRedditPosts(subreddit, limit = 25) {
  try {
    const fetch = require('node-fetch');
    const url = `https://www.reddit.com/r/${subreddit}/new.json?limit=${limit}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'FlippiBot/1.0 (price scanner research)'
      }
    });

    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data.children;
  } catch (error) {
    logger.error(`[Reddit Automation] Error fetching posts from r/${subreddit}:`, error);
    return [];
  }
}

async function processRedditPost(post) {
  try {
    if (redditMonitor.isValuationQuestion(post.data)) {
      const saved = await redditMonitor.saveQuestion(post);
      if (saved) {
        logger.info(`[Reddit Automation] Processed post: ${post.data.title}`);
        return true;
      }
    }
    return false;
  } catch (error) {
    logger.error('[Reddit Automation] Error processing post:', error);
    return false;
  }
}

module.exports = {
  runRedditAutomation,
  startAutomation,
  stopAutomation,
  getAutomationStatus,
  fetchRedditPosts,
  processRedditPost
};
