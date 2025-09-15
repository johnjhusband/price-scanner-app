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
      CREATE TABLE IF NOT EXISTS valuation_questions (
        id TEXT PRIMARY KEY,
        subreddit TEXT,
        title TEXT,
        body TEXT,
        author TEXT,
        url TEXT,
        created_at INTEGER,
        processed BOOLEAN DEFAULT 0,
        created_date DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS generated_content (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question_id TEXT,
        title TEXT,
        content TEXT,
        meta_description TEXT,
        keywords TEXT,
        slug TEXT UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (question_id) REFERENCES valuation_questions(id)
      );
    `);

    console.log('Valuation tables created successfully');
  }

  async fetchSubredditPosts(subreddit) {
    try {
      const response = await fetch(`https://www.reddit.com/r/${subreddit}/new.json?limit=50`);
      const data = await response.json();
      return data.data.children;
    } catch (error) {
      console.error(`Error fetching from r/${subreddit}:`, error.message);
      return [];
    }
  }

  isRelevantPost(post) {
    const title = post.data.title.toLowerCase();
    const selftext = post.data.selftext.toLowerCase();
    const combined = title + ' ' + selftext;
    
    return this.searchTerms.some(term => combined.includes(term));
  }

  async savePost(post) {
    const db = getDatabase();
    
    try {
      db.run(`
        INSERT OR IGNORE INTO valuation_questions 
        (id, subreddit, title, body, author, url, created_at, processed)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        post.data.id,
        post.data.subreddit,
        post.data.title,
        post.data.selftext,
        post.data.author,
        `https://reddit.com${post.data.permalink}`,
        post.data.created_utc,
        0
      ]);
    } catch (error) {
      console.error('Error saving post:', error);
    }
  }

  async monitorSubreddits() {
    console.log('Starting Reddit monitoring...');
    await this.initDatabase();
    
    let totalFound = 0;
    
    for (const subreddit of this.subreddits) {
      const posts = await this.fetchSubredditPosts(subreddit);
      const relevantPosts = posts.filter(post => this.isRelevantPost(post));
      
      for (const post of relevantPosts) {
        await this.savePost(post);
        totalFound++;
      }
      
      console.log(`Found ${relevantPosts.length} relevant posts in r/${subreddit}`);
    }
    
    return {
      success: true,
      message: `Monitoring complete. Found ${totalFound} relevant posts.`,
      count: totalFound
    };
  }

  async getUnprocessedQuestions(limit = 10) {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT * FROM valuation_questions 
        WHERE processed = 0 
        ORDER BY created_at DESC 
        LIMIT ?
      `, [limit], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async markAsProcessed(questionId) {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      db.run(`
        UPDATE valuation_questions 
        SET processed = 1 
        WHERE id = ?
      `, [questionId], (err) => {
        if (err) reject(err);
        else resolve(true);
      });
    });
  }

  async getStats() {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          COUNT(*) as total_questions,
          SUM(CASE WHEN processed = 1 THEN 1 ELSE 0 END) as processed_questions,
          SUM(CASE WHEN processed = 0 THEN 1 ELSE 0 END) as unprocessed_questions
        FROM valuation_questions
      `, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }
}

module.exports = new RedditMonitor();