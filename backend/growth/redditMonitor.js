const fetch = require('node-fetch');
const { getDatabase } = require('../database');

class RedditMonitor {
  constructor() {
    this.subreddits = [
      'Flipping',
      'ThriftStoreHauls', 
      'whatsthisworth',
      'vintage',
      'ThriftFinds'
    ];
    
    this.searchTerms = [
      'worth',
      'value',
      'real or fake',
      'authentic',
      'how much',
      'price check',
      'what is this',
      'found this'
    ];
  }

  async initDatabase() {
    const db = getDatabase();
    
    // Create tables for growth automation
    db.exec(`
      CREATE TABLE IF NOT EXISTS reddit_questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id TEXT UNIQUE NOT NULL,
        subreddit TEXT NOT NULL,
        title TEXT NOT NULL,
        author TEXT,
        url TEXT NOT NULL,
        selftext TEXT,
        created_utc INTEGER,
        score INTEGER DEFAULT 0,
        num_comments INTEGER DEFAULT 0,
        processed BOOLEAN DEFAULT FALSE,
        processed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    db.exec(`
      CREATE TABLE IF NOT EXISTS content_generated (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_id TEXT NOT NULL,
        source_type TEXT DEFAULT 'reddit',
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        seo_keywords TEXT,
        published BOOLEAN DEFAULT FALSE,
        published_at TIMESTAMP,
        page_views INTEGER DEFAULT 0,
        conversions INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('[Reddit Monitor] Database initialized');
  }

  async fetchSubreddit(subreddit) {
    try {
      const url = `https://www.reddit.com/r/${subreddit}/new.json?limit=25`;
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
      console.error(`[Reddit Monitor] Error fetching r/${subreddit}:`, error.message);
      return [];
    }
  }

  isRelevantPost(post) {
    const title = post.data.title.toLowerCase();
    const selftext = (post.data.selftext || '').toLowerCase();
    const combined = title + ' ' + selftext;
    
    // Check if post contains any of our search terms
    return this.searchTerms.some(term => combined.includes(term));
  }

  async saveQuestion(post) {
    const db = getDatabase();
    
    try {
      const stmt = db.prepare(`
        INSERT OR IGNORE INTO reddit_questions (
          post_id, subreddit, title, author, url, 
          selftext, created_utc, score, num_comments
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        post.data.id,
        post.data.subreddit,
        post.data.title,
        post.data.author,
        `https://reddit.com${post.data.permalink}`,
        post.data.selftext,
        post.data.created_utc,
        post.data.score,
        post.data.num_comments
      );
      
      if (result.changes > 0) {
        console.log(`[Reddit Monitor] New question saved: ${post.data.title}`);
        return true;
      }
    } catch (error) {
      console.error('[Reddit Monitor] Error saving question:', error);
    }
    
    return false;
  }

  async monitorAll() {
    console.log('[Reddit Monitor] Starting scan of subreddits...');
    let totalNew = 0;
    
    for (const subreddit of this.subreddits) {
      console.log(`[Reddit Monitor] Checking r/${subreddit}...`);
      const posts = await this.fetchSubreddit(subreddit);
      
      for (const post of posts) {
        if (this.isRelevantPost(post)) {
          const saved = await this.saveQuestion(post);
          if (saved) totalNew++;
        }
      }
      
      // Be respectful of Reddit's rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log(`[Reddit Monitor] Scan complete. Found ${totalNew} new questions.`);
    return totalNew;
  }

  async getUnprocessedQuestions(limit = 10) {
    const db = getDatabase();
    
    const questions = db.prepare(`
      SELECT * FROM reddit_questions 
      WHERE processed = FALSE 
      ORDER BY score DESC, created_utc DESC
      LIMIT ?
    `).all(limit);
    
    return questions;
  }

  async markProcessed(postId) {
    const db = getDatabase();
    
    db.prepare(`
      UPDATE reddit_questions 
      SET processed = TRUE, processed_at = CURRENT_TIMESTAMP
      WHERE post_id = ?
    `).run(postId);
  }

  async getStats() {
    const db = getDatabase();
    
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_questions,
        SUM(CASE WHEN processed = TRUE THEN 1 ELSE 0 END) as processed,
        COUNT(DISTINCT subreddit) as subreddits_monitored
      FROM reddit_questions
    `).get();
    
    const recentQuestions = db.prepare(`
      SELECT title, subreddit, score, created_utc
      FROM reddit_questions
      ORDER BY created_utc DESC
      LIMIT 5
    `).all();
    
    return {
      ...stats,
      recent_questions: recentQuestions
    };
  }
}

// Create singleton instance
const redditMonitor = new RedditMonitor();

// Initialize database on module load
redditMonitor.initDatabase().catch(console.error);

module.exports = redditMonitor;