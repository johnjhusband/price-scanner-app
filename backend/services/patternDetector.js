const { getDatabase } = require('../database');

const PATTERN_THRESHOLD = 10; // Flag after 10 occurrences

// Pattern types we track
const PATTERN_TYPES = {
  VALUE_ACCURACY: 'value_accuracy_issue',
  AUTHENTICITY_CONCERN: 'authenticity_concern',
  PLATFORM_WRONG: 'platform_suggestion',
  BRAND_ISSUE: 'brand_specific_issue',
  CATEGORY_ISSUE: 'category_issue'
};

/**
 * Detect patterns in feedback data
 */
async function detectPatterns(feedbackData) {
  const db = getDatabase();
  const patterns = [];

  try {
    // Extract key information from feedback
    const { 
      feedback_text, 
      category, 
      sentiment,
      scan_data,
      analysis 
    } = feedbackData;

    // Only track negative feedback patterns
    if (sentiment !== 'negative') {
      return patterns;
    }

    // 1. Track value accuracy issues by brand
    if (category === 'value_accuracy' && scan_data.item_name) {
      const brand = extractBrand(scan_data.item_name);
      if (brand) {
        patterns.push({
          type: PATTERN_TYPES.VALUE_ACCURACY,
          key: brand.toLowerCase(),
          details: {
            item: scan_data.item_name,
            price_range: scan_data.price_range,
            feedback: feedback_text
          }
        });
      }
    }

    // 2. Track authenticity concerns by brand
    if (category === 'authenticity_concern' && scan_data.item_name) {
      const brand = extractBrand(scan_data.item_name);
      if (brand) {
        patterns.push({
          type: PATTERN_TYPES.AUTHENTICITY_CONCERN,
          key: brand.toLowerCase(),
          details: {
            item: scan_data.item_name,
            real_score: scan_data.real_score,
            feedback: feedback_text
          }
        });
      }
    }

    // 3. Track platform suggestion issues
    if (category === 'platform_suggestion') {
      const platform = scan_data.recommended_platform || 'unknown';
      patterns.push({
        type: PATTERN_TYPES.PLATFORM_WRONG,
        key: platform.toLowerCase(),
        details: {
          item: scan_data.item_name,
          suggested_platform: platform,
          feedback: feedback_text
        }
      });
    }

    // Update pattern detection records
    for (const pattern of patterns) {
      await updatePatternRecord(db, pattern);
    }

    return patterns;

  } catch (error) {
    console.error('Error detecting patterns:', error);
    return patterns;
  }
}

/**
 * Update or create pattern detection record
 */
async function updatePatternRecord(db, pattern) {
  try {
    // Check if pattern already exists
    const existing = db.prepare(`
      SELECT * FROM pattern_detection 
      WHERE pattern_type = ? AND pattern_key = ?
    `).get(pattern.type, pattern.key);

    if (existing) {
      // Update existing pattern
      const newCount = existing.occurrence_count + 1;
      const shouldFlag = newCount >= PATTERN_THRESHOLD && !existing.flagged;

      db.prepare(`
        UPDATE pattern_detection 
        SET occurrence_count = ?,
            last_detected = CURRENT_TIMESTAMP,
            flagged = ?,
            flagged_at = CASE WHEN ? THEN CURRENT_TIMESTAMP ELSE flagged_at END,
            details = json_patch(details, ?)
        WHERE id = ?
      `).run(
        newCount,
        shouldFlag ? 1 : existing.flagged,
        shouldFlag,
        JSON.stringify({ latest: pattern.details }),
        existing.id
      );

      // If we just flagged it, send notification
      if (shouldFlag) {
        await sendPatternNotification(pattern.type, pattern.key, newCount);
      }

    } else {
      // Create new pattern record
      db.prepare(`
        INSERT INTO pattern_detection (
          pattern_type, pattern_key, occurrence_count, details
        ) VALUES (?, ?, 1, ?)
      `).run(
        pattern.type,
        pattern.key,
        JSON.stringify({ instances: [pattern.details] })
      );
    }

  } catch (error) {
    console.error('Error updating pattern record:', error);
  }
}

/**
 * Extract brand from item name
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

  // Try to extract first word as brand if no match
  const firstWord = itemName.split(' ')[0];
  return firstWord.length > 2 ? firstWord : null;
}

/**
 * Send notification when pattern threshold is reached
 */
async function sendPatternNotification(patternType, patternKey, count) {
  console.log(`
    🚨 PATTERN DETECTED 🚨
    Type: ${patternType}
    Key: ${patternKey}
    Count: ${count}
    
    This issue has been reported ${count} times and needs attention!
  `);

  // In production, this could:
  // - Send email to admins
  // - Post to Slack
  // - Create a GitHub issue
  // - Add to admin dashboard notifications
}

/**
 * Get current flagged patterns
 */
async function getFlaggedPatterns() {
  const db = getDatabase();
  
  try {
    const patterns = db.prepare(`
      SELECT * FROM pattern_detection
      WHERE flagged = 1 AND resolved = 0
      ORDER BY occurrence_count DESC
    `).all();

    return patterns.map(p => ({
      ...p,
      details: JSON.parse(p.details || '{}')
    }));

  } catch (error) {
    console.error('Error fetching flagged patterns:', error);
    return [];
  }
}

/**
 * Mark pattern as resolved
 */
async function resolvePattern(patternId) {
  const db = getDatabase();
  
  try {
    db.prepare(`
      UPDATE pattern_detection
      SET resolved = 1, resolved_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(patternId);

    return { success: true };

  } catch (error) {
    console.error('Error resolving pattern:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  detectPatterns,
  getFlaggedPatterns,
  resolvePattern,
  PATTERN_TYPES
};