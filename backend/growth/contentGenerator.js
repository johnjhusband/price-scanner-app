const { getDatabase } = require('../database');

class ContentGenerator {
  constructor() {
    this.templates = {
      pricing_guide: {
        title: "Complete Guide: {item} Resale Value in {year}",
        sections: [
          "Current Market Value",
          "Authentication Tips", 
          "Best Platforms to Sell",
          "Pricing Factors",
          "Common Mistakes to Avoid"
        ]
      },
      authentication: {
        title: "Is Your {item} Real? Authentication Guide",
        sections: [
          "Key Authentication Points",
          "Common Fakes to Watch For",
          "Professional Authentication Services",
          "DIY Authentication Tips",
          "When to Get Expert Help"
        ]
      },
      comparison: {
        title: "{item} vs {alternative}: Which Has Better Resale Value?",
        sections: [
          "Price Comparison",
          "Market Demand Analysis",
          "Condition Impact on Value",
          "Best Selling Platforms",
          "Investment Potential"
        ]
      }
    };
  }

  async generateFromRedditQuestion(question) {
    const { title, body, subreddit } = question;
    
    // Extract key information from the question
    const itemInfo = this.extractItemInfo(title + ' ' + body);
    
    // Generate SEO-friendly slug
    const slug = this.generateSlug(title);
    
    // Generate content structure
    const content = {
      title: this.generateTitle(itemInfo, title),
      meta_description: this.generateMetaDescription(itemInfo),
      content: this.generateContent(itemInfo, question),
      keywords: this.generateKeywords(itemInfo),
      slug: slug
    };
    
    // Save to database
    await this.saveGeneratedContent(question.id, content);
    
    return content;
  }

  extractItemInfo(text) {
    // Basic extraction logic - can be enhanced with NLP
    const brands = ['Louis Vuitton', 'Chanel', 'Gucci', 'Hermes', 'Rolex', 'Nike', 'Adidas'];
    const foundBrand = brands.find(brand => text.toLowerCase().includes(brand.toLowerCase()));
    
    return {
      brand: foundBrand || 'Unknown Brand',
      category: this.detectCategory(text),
      condition: this.detectCondition(text),
      year: new Date().getFullYear()
    };
  }

  detectCategory(text) {
    const categories = {
      'bag': 'Handbags',
      'watch': 'Watches',
      'shoe': 'Shoes',
      'jewelry': 'Jewelry',
      'clothing': 'Clothing'
    };
    
    for (const [key, value] of Object.entries(categories)) {
      if (text.toLowerCase().includes(key)) {
        return value;
      }
    }
    
    return 'Collectibles';
  }

  detectCondition(text) {
    const conditions = ['mint', 'excellent', 'good', 'fair', 'poor'];
    
    for (const condition of conditions) {
      if (text.toLowerCase().includes(condition)) {
        return condition;
      }
    }
    
    return 'unknown';
  }

  generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 60);
  }

  generateTitle(itemInfo, originalTitle) {
    // Create SEO-optimized title
    return `${itemInfo.brand} ${itemInfo.category} Value Guide: ${originalTitle}`;
  }

  generateMetaDescription(itemInfo) {
    return `Expert guide on ${itemInfo.brand} ${itemInfo.category} resale value. Learn authentication tips, current market prices, and where to sell for maximum profit.`;
  }

  generateContent(itemInfo, question) {
    // Generate comprehensive content based on template
    let content = `<h1>${itemInfo.brand} ${itemInfo.category} Valuation Guide</h1>\n\n`;
    
    content += `<h2>Quick Answer</h2>\n`;
    content += `<p>Based on current market data, ${itemInfo.brand} ${itemInfo.category} items typically range from $X to $Y depending on condition and authenticity.</p>\n\n`;
    
    content += `<h2>Detailed Analysis</h2>\n`;
    content += `<p>Original Question: "${question.title}"</p>\n`;
    content += `<p>${question.body}</p>\n\n`;
    
    // Add template sections
    const template = this.templates.pricing_guide;
    for (const section of template.sections) {
      content += `<h3>${section}</h3>\n`;
      content += `<p>Detailed information about ${section.toLowerCase()} for ${itemInfo.brand} ${itemInfo.category}...</p>\n\n`;
    }
    
    return content;
  }

  generateKeywords(itemInfo) {
    return [
      itemInfo.brand,
      itemInfo.category,
      'resale value',
      'authentication',
      'price guide',
      'worth',
      'genuine'
    ].join(', ');
  }

  async saveGeneratedContent(questionId, content) {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO generated_content 
        (question_id, title, content, meta_description, keywords, slug)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        questionId,
        content.title,
        content.content,
        content.meta_description,
        content.keywords,
        content.slug
      ], (err) => {
        if (err) reject(err);
        else resolve(true);
      });
    });
  }

  async getGeneratedContent(limit = 10) {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT * FROM generated_content 
        ORDER BY created_at DESC 
        LIMIT ?
      `, [limit], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async getContentBySlug(slug) {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT * FROM generated_content 
        WHERE slug = ?
      `, [slug], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }
}

module.exports = new ContentGenerator();