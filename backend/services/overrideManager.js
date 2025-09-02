const { getDatabase } = require('../database');

/**
 * Override types
 */
const OVERRIDE_TYPES = {
  PRICE_ADJUSTMENT: 'price_adjustment',
  SCORE_ADJUSTMENT: 'score_adjustment',
  TRENDING_ADJUSTMENT: 'trending_adjustment'
};

/**
 * Get active overrides
 */
async function getActiveOverrides() {
  const db = getDatabase();
  
  try {
    const overrides = db.prepare(`
      SELECT * FROM manual_overrides
      WHERE active = 1 
      AND (expires_at IS NULL OR expires_at > datetime('now'))
    `).all();
    
    return overrides;
  } catch (error) {
    console.error('Error fetching overrides:', error);
    return [];
  }
}

/**
 * Apply overrides to analysis result
 */
async function applyOverrides(analysisResult) {
  const overrides = await getActiveOverrides();
  
  if (overrides.length === 0) {
    return analysisResult;
  }
  
  const db = getDatabase();
  const modifiedResult = { ...analysisResult };
  const appliedOverrides = [];
  
  for (const override of overrides) {
    const applies = checkIfOverrideApplies(override, analysisResult);
    
    if (applies) {
      switch (override.override_type) {
        case OVERRIDE_TYPES.PRICE_ADJUSTMENT:
          modifiedResult.price_range = adjustPrice(
            modifiedResult.price_range,
            override.adjustment_type,
            override.adjustment_value
          );
          appliedOverrides.push(`Price ${override.adjustment_type} ${override.adjustment_value}%`);
          break;
          
        case OVERRIDE_TYPES.SCORE_ADJUSTMENT:
          modifiedResult.real_score = adjustScore(
            modifiedResult.real_score,
            override.adjustment_type,
            override.adjustment_value
          );
          appliedOverrides.push(`Real Score ${override.adjustment_type} ${override.adjustment_value}`);
          break;
          
        case OVERRIDE_TYPES.TRENDING_ADJUSTMENT:
          modifiedResult.trending_score = adjustScore(
            modifiedResult.trending_score,
            override.adjustment_type,
            override.adjustment_value
          );
          appliedOverrides.push(`Trending ${override.adjustment_type} ${override.adjustment_value}`);
          break;
      }
      
      // Increment applied count
      db.prepare(`
        UPDATE manual_overrides 
        SET applied_count = applied_count + 1 
        WHERE id = ?
      `).run(override.id);
    }
  }
  
  // Add override info to result
  if (appliedOverrides.length > 0) {
    modifiedResult.overrides_applied = appliedOverrides;
  }
  
  return modifiedResult;
}

/**
 * Check if override applies to current item
 */
function checkIfOverrideApplies(override, analysisResult) {
  const targetKey = override.target_key.toLowerCase();
  const itemName = (analysisResult.item_name || '').toLowerCase();
  
  // Check if target key matches brand or category
  return itemName.includes(targetKey);
}

/**
 * Adjust price based on override
 */
function adjustPrice(priceRange, adjustmentType, adjustmentValue) {
  if (!priceRange) return priceRange;
  
  // Parse price range (e.g., "$100-$200")
  const match = priceRange.match(/\$(\d+)-\$(\d+)/);
  if (!match) return priceRange;
  
  let low = parseInt(match[1]);
  let high = parseInt(match[2]);
  
  if (adjustmentType === 'percentage') {
    const factor = 1 + (adjustmentValue / 100);
    low = Math.round(low * factor);
    high = Math.round(high * factor);
  } else if (adjustmentType === 'fixed') {
    low += adjustmentValue;
    high += adjustmentValue;
  }
  
  // Ensure prices don't go negative
  low = Math.max(5, low);
  high = Math.max(10, high);
  
  return `$${low}-$${high}`;
}

/**
 * Adjust score based on override
 */
function adjustScore(score, adjustmentType, adjustmentValue) {
  if (!score && score !== 0) return score;
  
  let newScore = score;
  
  if (adjustmentType === 'percentage') {
    const factor = 1 + (adjustmentValue / 100);
    newScore = Math.round(score * factor);
  } else if (adjustmentType === 'fixed') {
    newScore = score + adjustmentValue;
  }
  
  // Keep scores within valid range
  return Math.max(0, Math.min(100, newScore));
}

/**
 * Create a new override
 */
async function createOverride(overrideData) {
  const db = getDatabase();
  
  try {
    const stmt = db.prepare(`
      INSERT INTO manual_overrides (
        override_type,
        target_key,
        adjustment_type,
        adjustment_value,
        reason,
        created_by,
        expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      overrideData.override_type,
      overrideData.target_key,
      overrideData.adjustment_type,
      overrideData.adjustment_value,
      overrideData.reason || null,
      overrideData.created_by || 'admin',
      overrideData.expires_at || null
    );
    
    return {
      success: true,
      id: result.lastInsertRowid
    };
    
  } catch (error) {
    console.error('Error creating override:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Toggle override active status
 */
async function toggleOverride(overrideId) {
  const db = getDatabase();
  
  try {
    db.prepare(`
      UPDATE manual_overrides 
      SET active = NOT active 
      WHERE id = ?
    `).run(overrideId);
    
    return { success: true };
    
  } catch (error) {
    console.error('Error toggling override:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all overrides for admin view
 */
async function getAllOverrides() {
  const db = getDatabase();
  
  try {
    const overrides = db.prepare(`
      SELECT * FROM manual_overrides
      ORDER BY created_at DESC
    `).all();
    
    return overrides;
    
  } catch (error) {
    console.error('Error fetching all overrides:', error);
    return [];
  }
}

module.exports = {
  applyOverrides,
  createOverride,
  toggleOverride,
  getAllOverrides,
  OVERRIDE_TYPES
};