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
    const { title, selftext, subreddit } = question;
    
    // Extract key information from the question
    const itemInfo = this.extractItemInfo(title + ' ' + selftext);
    
    // Choose appropriate template
    const template = this.selectTemplate(title, selftext);
    
    // Generate content structure
    const content = {
      source_id: question.post_id,
      source_type: 'reddit',
      title: this.generateTitle(itemInfo, template),
      content: await this.generateContent(itemInfo, template, question),
      seo_keywords: this.generateKeywords(itemInfo),
      meta_description: this.generateMetaDescription(itemInfo)
    };
    
    return content;
  }

  extractItemInfo(text) {
    // Simple extraction - in production would use NLP
    const brandPatterns = [
      /\b(coach|louis vuitton|gucci|chanel|prada|hermes|rolex|omega)\b/gi,
      /\b(nike|adidas|supreme|north face|patagonia|lululemon)\b/gi,
      /\b(pyrex|fiesta|corningware|le creuset|kitchenaid)\b/gi
    ];
    
    const itemPatterns = [
      /\b(bag|purse|wallet|shoes|watch|jacket|coat|dress)\b/gi,
      /\b(vintage|antique|retro|mcm|designer|authentic)\b/gi
    ];
    
    let brands = [];
    let items = [];
    
    brandPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) brands.push(...matches);
    });
    
    itemPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) items.push(...matches);
    });
    
    return {
      brands: [...new Set(brands)],
      items: [...new Set(items)],
      originalText: text.substring(0, 200)
    };
  }

  selectTemplate(title, selftext) {
    const text = (title + ' ' + selftext).toLowerCase();
    
    if (text.includes('real') || text.includes('fake') || text.includes('authentic')) {
      return this.templates.authentication;
    } else if (text.includes('vs') || text.includes('versus') || text.includes('or')) {
      return this.templates.comparison;
    } else {
      return this.templates.pricing_guide;
    }
  }

  generateTitle(itemInfo, template) {
    const year = new Date().getFullYear();
    let title = template.title;
    
    // Replace placeholders
    const mainItem = itemInfo.brands[0] || itemInfo.items[0] || 'Vintage Item';
    title = title.replace('{item}', this.titleCase(mainItem));
    title = title.replace('{year}', year);
    
    // For comparison template, add alternative
    if (template === this.templates.comparison && itemInfo.items.length > 1) {
      title = title.replace('{alternative}', this.titleCase(itemInfo.items[1]));
    }
    
    return title;
  }

  async generateContent(itemInfo, template, question) {
    const sections = [];
    
    // Introduction
    sections.push({
      type: 'introduction',
      content: this.generateIntroduction(itemInfo, question)
    });
    
    // Main sections based on template
    for (const sectionTitle of template.sections) {
      sections.push({
        type: 'section',
        title: sectionTitle,
        content: await this.generateSection(sectionTitle, itemInfo, question)
      });
    }
    
    // Conclusion with CTA
    sections.push({
      type: 'conclusion',
      content: this.generateConclusion(itemInfo)
    });
    
    // Convert to HTML
    return this.sectionsToHTML(sections);
  }

  generateIntroduction(itemInfo, question) {
    const item = itemInfo.brands[0] || itemInfo.items[0] || 'this item';
    
    return `
      <p>If you're wondering about the value of ${item}, you're not alone. 
      This question comes up frequently in reselling communities, and we're here 
      to provide you with comprehensive, data-driven answers.</p>
      
      <p>Using Flippi's advanced AI analysis and market data, we'll break down 
      everything you need to know about ${item} resale values, authentication, 
      and the best platforms to maximize your profit.</p>
    `;
  }

  async generateSection(sectionTitle, itemInfo, question) {
    // In production, this would call GPT API
    // For now, return template content
    const item = itemInfo.brands[0] || itemInfo.items[0] || 'items';
    
    const sectionContent = {
      "Current Market Value": `
        <p>Based on recent market data, ${item} typically sells for:</p>
        <ul>
          <li>Excellent condition: $XXX - $XXX</li>
          <li>Good condition: $XXX - $XXX</li>
          <li>Fair condition: $XXX - $XXX</li>
        </ul>
        <p>These values can vary based on specific model, age, and market demand.</p>
      `,
      "Authentication Tips": `
        <p>When authenticating ${item}, look for these key features:</p>
        <ul>
          <li>Quality of materials and construction</li>
          <li>Brand markings and serial numbers</li>
          <li>Stitching patterns and hardware quality</li>
          <li>Packaging and documentation</li>
        </ul>
      `,
      "Best Platforms to Sell": `
        <p>For ${item}, we recommend these platforms:</p>
        <ul>
          <li><strong>eBay</strong>: Largest audience, best for rare items</li>
          <li><strong>Poshmark</strong>: Great for fashion and accessories</li>
          <li><strong>Mercari</strong>: User-friendly, growing marketplace</li>
          <li><strong>Facebook Marketplace</strong>: Local sales, no shipping</li>
        </ul>
      `
    };
    
    return sectionContent[sectionTitle] || `<p>Information about ${sectionTitle} for ${item}.</p>`;
  }

  generateConclusion(itemInfo) {
    const item = itemInfo.brands[0] || itemInfo.items[0] || 'your items';
    
    return `
      <div class="cta-section">
        <h3>Get Instant Value Analysis with Flippi</h3>
        <p>Want to know the exact value of ${item}? Flippi's AI-powered scanner 
        can give you instant resale values, authentication confidence scores, and 
        platform recommendations in seconds.</p>
        <a href="https://app.flippi.ai" class="cta-button">Try Flippi Free</a>
        <p class="cta-note">No sign-up required • 20 free scans included</p>
      </div>
    `;
  }

  sectionsToHTML(sections) {
    let html = '';
    
    for (const section of sections) {
      if (section.type === 'introduction') {
        html += `<div class="intro">${section.content}</div>\n`;
      } else if (section.type === 'section') {
        html += `<h2>${section.title}</h2>\n${section.content}\n`;
      } else if (section.type === 'conclusion') {
        html += `<div class="conclusion">${section.content}</div>\n`;
      }
    }
    
    return html;
  }

  generateKeywords(itemInfo) {
    const keywords = [];
    
    // Add brand keywords
    itemInfo.brands.forEach(brand => {
      keywords.push(brand.toLowerCase());
      keywords.push(`${brand.toLowerCase()} resale value`);
      keywords.push(`${brand.toLowerCase()} authentication`);
    });
    
    // Add item keywords
    itemInfo.items.forEach(item => {
      keywords.push(item.toLowerCase());
      keywords.push(`${item.toLowerCase()} worth`);
      keywords.push(`sell ${item.toLowerCase()}`);
    });
    
    // Add general keywords
    keywords.push('resale value', 'thrift finds', 'vintage pricing', 'authentication guide');
    
    return keywords.join(', ');
  }

  generateMetaDescription(itemInfo) {
    const item = itemInfo.brands[0] || itemInfo.items[0] || 'vintage items';
    return `Complete guide to ${item} resale values, authentication tips, and best selling platforms. Get instant AI-powered valuations with Flippi.`;
  }

  titleCase(str) {
    return str.replace(/\b\w/g, l => l.toUpperCase());
  }

  async saveContent(content) {
    const db = getDatabase();
    
    const stmt = db.prepare(`
      INSERT INTO content_generated (
        source_id, source_type, title, content, seo_keywords
      ) VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      content.source_id,
      content.source_type,
      content.title,
      content.content,
      content.seo_keywords
    );
    
    return result.lastInsertRowid;
  }
}

module.exports = new ContentGenerator();