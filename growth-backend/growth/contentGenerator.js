const { getDatabase } = require('../../backend/database');
const logger = require('../../backend/utils/logger');

class ContentGenerator {
  constructor() {
    this.openai = null;
    this.initializeOpenAI();
  }

  initializeOpenAI() {
    try {
      const OpenAI = require('openai');
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      logger.info('[Content Generator] OpenAI initialized');
    } catch (error) {
      logger.error('[Content Generator] Failed to initialize OpenAI:', error);
    }
  }

  async generateFromRedditQuestion(question) {
    if (!this.openai) {
      throw new Error('OpenAI not initialized');
    }

    try {
      const prompt = this.createPrompt(question);
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      const content = response.choices[0].message.content.trim();
      
      return {
        title: this.generateTitle(question.title),
        content: content,
        source: 'reddit',
        source_id: question.post_id,
        tags: this.extractTags(question),
        created_at: new Date().toISOString()
      };
    } catch (error) {
      logger.error('[Content Generator] Error generating content:', error);
      throw error;
    }
  }

  createPrompt(question) {
    return `Write a helpful blog post about valuing and flipping items found at thrift stores, based on this Reddit question:

Title: "${question.title}"
Content: "${question.selftext || 'No additional content'}"

The blog post should:
1. Address the specific question asked
2. Provide general advice about thrift store flipping
3. Include tips for identifying valuable items
4. Mention common mistakes to avoid
5. Be educational and helpful for beginners

Write in a friendly, informative tone. Keep it practical and actionable.`;
  }

  generateTitle(originalTitle) {
    // Clean up the Reddit title and make it more blog-friendly
    let title = originalTitle
      .replace(/^\[.*?\]\s*/, '') // Remove [subreddit] prefix
      .replace(/\?$/, '') // Remove question mark
      .replace(/^How much would you pay for/, 'Valuing')
      .replace(/^What is this worth/, 'Identifying and Valuing')
      .replace(/^Found this/, 'Thrift Store Find:')
      .trim();
    
    // Add a prefix if it doesn't have one
    if (!title.match(/^(Thrift|Valuing|Identifying|How to|Tips for)/i)) {
      title = `Thrift Store Find: ${title}`;
    }
    
    return title;
  }

  extractTags(question) {
    const tags = ['thrift-store', 'flipping', 'valuation'];
    
    const title = question.title.toLowerCase();
    const content = (question.selftext || '').toLowerCase();
    const text = `${title} ${content}`;
    
    if (text.includes('vintage')) tags.push('vintage');
    if (text.includes('antique')) tags.push('antique');
    if (text.includes('clothing') || text.includes('shirt') || text.includes('dress')) tags.push('clothing');
    if (text.includes('furniture') || text.includes('chair') || text.includes('table')) tags.push('furniture');
    if (text.includes('jewelry') || text.includes('ring') || text.includes('necklace')) tags.push('jewelry');
    if (text.includes('art') || text.includes('painting') || text.includes('print')) tags.push('art');
    if (text.includes('book') || text.includes('magazine')) tags.push('books');
    if (text.includes('toy') || text.includes('game')) tags.push('toys');
    
    return tags;
  }

  async saveContent(content) {
    const db = getDatabase();
    
    try {
      const stmt = db.prepare(`
        INSERT INTO content_generated (
          title, content, source_type, source_id, seo_keywords, 
          created_at, published, page_views, conversions
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      // Debug: Log the values being inserted
      console.log('Content to save:', {
        title: content.title,
        content: content.content,
        source: content.source,
        source_id: content.source_id,
        tags: content.tags,
        created_at: content.created_at
      });
      
      const result = stmt.run(
        content.title,
        content.content,
        content.source, // This maps to source_type
        content.source_id,
        content.tags ? content.tags.join(', ') : '', // This maps to seo_keywords
        content.created_at.toISOString(),
        false, // published
        0, // page_views
        0  // conversions
      );
      
      logger.info(`[Content Generator] Content saved with ID: ${result.lastInsertRowid}`);
      return result.lastInsertRowid;
    } catch (error) {
      logger.error('[Content Generator] Error saving content:', error);
      throw error;
    }
  }

  async getContent(limit = 10, offset = 0) {
    const db = getDatabase();
    
    try {
      const stmt = db.prepare(`
        SELECT id, source_type, source_id, title, content, seo_keywords, 
               published, published_at, page_views, conversions, created_at
        FROM content_generated 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `);
      
      return stmt.all(limit, offset);
    } catch (error) {
      logger.error('[Content Generator] Error fetching content:', error);
      return [];
    }
  }

  async getContentStats() {
    const db = getDatabase();
    
    try {
      const stats = db.prepare(`
        SELECT 
          COUNT(*) as total_content,
          SUM(CASE WHEN published = TRUE THEN 1 ELSE 0 END) as published,
          SUM(page_views) as total_views,
          SUM(conversions) as total_conversions
        FROM content_generated
      `).get();
      
      return stats;
    } catch (error) {
      logger.error('[Content Generator] Error fetching stats:', error);
      return { total_content: 0, published: 0, total_views: 0, total_conversions: 0 };
    }
  }
}

module.exports = new ContentGenerator();