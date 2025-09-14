const fetch = require('node-fetch');
const { getDatabase } = require('../../backend/database');
const logger = require('../../backend/utils/logger');

class RedditMonitor {
  constructor() {
    this.subreddits = [
      'Flipping',
      'ThriftStoreHauls', 
      'whatsthisworth',
      'vintage',
      'ThriftFinds'
    ];
    this.lastCheck = new Date();
  }

  async monitorAll() {
    logger.info('[Reddit Monitor] Starting scan of subreddits...');
    let totalNew = 0;

    for (const subreddit of this.subreddits) {
      try {
        logger.info(`[Reddit Monitor] Checking r/${subreddit}...`);
        const newCount = await this.monitorSubreddit(subreddit);
        totalNew += newCount;
      } catch (error) {
        logger.error(`[Reddit Monitor] Error monitoring r/${subreddit}:`, error);
      }
    }

    logger.info(`[Reddit Monitor] Scan complete. Found ${totalNew} new questions.`);
    return totalNew;
  }

  async monitorSubreddit(subreddit) {
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
      const posts = data.data.children;
      let newCount = 0;

      for (const post of posts) {
        if (this.isValuationQuestion(post.data)) {
          const saved = await this.saveQuestion(post);
          if (saved) {
            newCount++;
          }
        }
      }

      return newCount;
    } catch (error) {
      logger.error(`[Reddit Monitor] Error fetching r/${subreddit}:`, error);
      return 0;
    }
  }

  isValuationQuestion(post) {
    const title = post.title.toLowerCase();
    const selftext = (post.selftext || '').toLowerCase();
    
    const keywords = [
      'worth', 'value', 'price', 'cost', 'how much', 'valuation',
      'thrift', 'find', 'haul', 'flip', 'resell', 'sell for',
      'antique', 'vintage', 'collectible', 'rare', 'old'
    ];

    return keywords.some(keyword => 
      title.includes(keyword) || selftext.includes(keyword)
    );
  }

  async saveQuestion(post) {
    const db = getDatabase();
    
    try {
      // Extract image URL if available
      const imageUrl = this.extractImageUrl(post.data);
      
      const stmt = db.prepare(`
        INSERT OR IGNORE INTO reddit_questions (
          post_id, subreddit, title, author, url, 
          selftext, created_utc, score, num_comments, 
          thumbnail, permalink
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        post.data.id,
        post.data.subreddit,
        post.data.title,
        post.data.author,
        imageUrl || post.data.url || '',  // Use image URL if available, otherwise original URL
        post.data.selftext,
        post.data.created_utc,
        post.data.score,
        post.data.num_comments,
        post.data.thumbnail || '',
        `https://reddit.com${post.data.permalink}`
      );
      
      if (result.changes > 0) {
        // Check for images and log them
        const hasImage = imageUrl && /\\.(jpg|jpeg|png|gif|webp)$/i.test(imageUrl);
        const hasPreview = post.data.preview && post.data.preview.images && post.data.preview.images.length > 0;
        const hasMedia = post.data.media_metadata && Object.keys(post.data.media_metadata).length > 0;
        
        let imageInfo = '';
        if (hasImage) imageInfo += ' [IMAGE: ' + imageUrl + ']';
        if (hasPreview) imageInfo += ' [PREVIEW]';
        if (hasMedia) imageInfo += ' [MEDIA]';
        
        logger.info(`[Reddit Monitor] New question saved: ${post.data.title}${imageInfo}`);
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('[Reddit Monitor] Error saving question:', error);
      return false;
    }
  }

  extractImageUrl(post) {
    // Check for direct image URL
    if (post.url && this.isImageUrl(post.url)) {
      return post.url;
    }
    
    // Check preview images
    if (post.preview && post.preview.images && post.preview.images.length > 0) {
      const image = post.preview.images[0];
      return this.decodeHtmlEntities(image.source.url);
    }
    
    // Check media metadata
    if (post.media_metadata) {
      const firstKey = Object.keys(post.media_metadata)[0];
      if (firstKey && post.media_metadata[firstKey].s) {
        return this.decodeHtmlEntities(post.media_metadata[firstKey].s.u);
      }
    }
    
    return null;
  }

  isImageUrl(url) {
    return /\\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  }

  decodeHtmlEntities(str) {
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'");
  }

  async getStats() {
    const db = getDatabase();
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_questions,
        COUNT(CASE WHEN processed = TRUE THEN 1 END) as processed,
        COUNT(CASE WHEN url LIKE '%i.redd.it%' OR url LIKE '%imgur%' OR url LIKE '%.jpg%' OR url LIKE '%.png%' OR url LIKE '%.jpeg%' THEN 1 END) as with_images,
        MAX(created_at) as last_question
      FROM reddit_questions
    `).get();
    
    return {
      ...stats,
      last_check: this.lastCheck.toISOString()
    };
  }

  async markProcessed(postId) {
    const db = getDatabase();
    const stmt = db.prepare('UPDATE reddit_questions SET processed = TRUE, processed_at = CURRENT_TIMESTAMP WHERE post_id = ?');
    return stmt.run(postId);
  }
}

module.exports = new RedditMonitor();
