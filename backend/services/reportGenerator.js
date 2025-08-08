const { getDatabase } = require('../database');

/**
 * Generate weekly summary report
 */
async function generateWeeklyReport() {
  const db = getDatabase();
  
  try {
    // Get feedback from last 7 days
    const weeklyFeedback = db.prepare(`
      SELECT 
        f.*,
        fa.sentiment,
        fa.category,
        fa.suggestion_type,
        json_extract(f.scan_data, '$.item_name') as item_name,
        json_extract(f.scan_data, '$.price_range') as price_range
      FROM feedback f
      LEFT JOIN feedback_analysis fa ON f.id = fa.feedback_id
      WHERE datetime(f.created_at) >= datetime('now', '-7 days')
    `).all();
    
    // Calculate basic stats
    const stats = {
      total_feedback: weeklyFeedback.length,
      positive_count: weeklyFeedback.filter(f => f.sentiment === 'positive').length,
      negative_count: weeklyFeedback.filter(f => f.sentiment === 'negative').length,
      neutral_count: weeklyFeedback.filter(f => f.sentiment === 'neutral').length,
      analyzed_count: weeklyFeedback.filter(f => f.sentiment).length,
      unanalyzed_count: weeklyFeedback.filter(f => !f.sentiment).length
    };
    
    // Find most common issue
    const issueCounts = {};
    weeklyFeedback.forEach(f => {
      if (f.category) {
        issueCounts[f.category] = (issueCounts[f.category] || 0) + 1;
      }
    });
    
    const mostCommonIssue = Object.entries(issueCounts)
      .sort((a, b) => b[1] - a[1])[0];
    
    // Find most affected brand
    const brandCounts = {};
    weeklyFeedback.forEach(f => {
      if (f.item_name) {
        const brand = extractBrand(f.item_name);
        if (brand) {
          brandCounts[brand] = (brandCounts[brand] || 0) + 1;
        }
      }
    });
    
    const mostAffectedBrand = Object.entries(brandCounts)
      .sort((a, b) => b[1] - a[1])[0];
    
    // Get flagged patterns
    const flaggedPatterns = db.prepare(`
      SELECT * FROM pattern_detection
      WHERE flagged = 1 AND resolved = 0
    `).all();
    
    // Get active overrides
    const activeOverrides = db.prepare(`
      SELECT * FROM manual_overrides
      WHERE active = 1
    `).all();
    
    // Build report data
    const reportData = {
      week_start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      week_end: new Date().toISOString().split('T')[0],
      stats,
      most_common_issue: mostCommonIssue ? {
        category: mostCommonIssue[0],
        count: mostCommonIssue[1]
      } : null,
      most_affected_brand: mostAffectedBrand ? {
        brand: mostAffectedBrand[0],
        count: mostAffectedBrand[1]
      } : null,
      flagged_patterns: flaggedPatterns.length,
      active_overrides: activeOverrides.length,
      top_negative_feedback: weeklyFeedback
        .filter(f => f.sentiment === 'negative' && f.feedback_text)
        .slice(0, 5)
        .map(f => ({
          item: f.item_name,
          feedback: f.feedback_text,
          category: f.category
        }))
    };
    
    // Store report
    const reportDate = new Date().toISOString().split('T')[0];
    
    db.prepare(`
      INSERT OR REPLACE INTO weekly_reports (
        report_date,
        total_feedback,
        positive_count,
        negative_count,
        neutral_count,
        most_common_issue,
        most_affected_brand,
        report_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      reportDate,
      stats.total_feedback,
      stats.positive_count,
      stats.negative_count,
      stats.neutral_count,
      mostCommonIssue ? mostCommonIssue[0] : null,
      mostAffectedBrand ? mostAffectedBrand[0] : null,
      JSON.stringify(reportData)
    );
    
    // Generate summary text
    const summary = generateReportSummary(reportData);
    
    return {
      success: true,
      report_date: reportDate,
      summary,
      data: reportData
    };
    
  } catch (error) {
    console.error('Error generating weekly report:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Generate human-readable summary
 */
function generateReportSummary(data) {
  const { stats, most_common_issue, most_affected_brand } = data;
  
  let summary = `📊 Weekly Feedback Report (${data.week_start} to ${data.week_end})\n\n`;
  
  summary += `Total Feedback: ${stats.total_feedback}\n`;
  summary += `Positive: ${stats.positive_count} (${Math.round(stats.positive_count / stats.total_feedback * 100)}%)\n`;
  summary += `Negative: ${stats.negative_count} (${Math.round(stats.negative_count / stats.total_feedback * 100)}%)\n`;
  summary += `Neutral: ${stats.neutral_count}\n\n`;
  
  if (most_common_issue) {
    summary += `Most Common Issue: ${most_common_issue.category} (${most_common_issue.count} reports)\n`;
  }
  
  if (most_affected_brand) {
    summary += `Most Affected Brand: ${most_affected_brand.brand} (${most_affected_brand.count} mentions)\n`;
  }
  
  if (data.flagged_patterns > 0) {
    summary += `\n⚠️ ${data.flagged_patterns} patterns need attention!\n`;
  }
  
  if (data.active_overrides > 0) {
    summary += `\n🔧 ${data.active_overrides} manual overrides are active\n`;
  }
  
  if (data.top_negative_feedback.length > 0) {
    summary += `\n📝 Top Negative Feedback:\n`;
    data.top_negative_feedback.forEach((f, i) => {
      summary += `${i + 1}. ${f.item}: "${f.feedback}" (${f.category})\n`;
    });
  }
  
  return summary;
}

/**
 * Extract brand from item name (reused from patternDetector)
 */
function extractBrand(itemName) {
  const brands = [
    'Louis Vuitton', 'Chanel', 'Gucci', 'Hermès', 'Prada', 
    'Fendi', 'Dior', 'Balenciaga', 'Burberry', 'Coach',
    'Nike', 'Adidas', 'Lululemon', 'Zara', 'H&M',
    'Michael Kors', 'Kate Spade', 'Tory Burch'
  ];

  const nameLower = itemName.toLowerCase();
  for (const brand of brands) {
    if (nameLower.includes(brand.toLowerCase())) {
      return brand;
    }
  }

  return null;
}

/**
 * Get latest weekly report
 */
async function getLatestReport() {
  const db = getDatabase();
  
  try {
    const report = db.prepare(`
      SELECT * FROM weekly_reports
      ORDER BY report_date DESC
      LIMIT 1
    `).get();
    
    if (report) {
      report.report_data = JSON.parse(report.report_data);
    }
    
    return report;
    
  } catch (error) {
    console.error('Error fetching latest report:', error);
    return null;
  }
}

module.exports = {
  generateWeeklyReport,
  getLatestReport
};