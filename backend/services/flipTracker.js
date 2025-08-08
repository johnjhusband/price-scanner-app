const { getDatabase } = require('../database');

const FREE_FLIP_LIMIT = 3;

/**
 * Get or create flip tracking record for a user/device
 */
async function getFlipStatus(userId, deviceFingerprint, sessionId) {
  try {
    const db = getDatabase();
    
    // Try to find existing record by user ID first, then device fingerprint
    let record = null;
    
    if (userId) {
      record = db.prepare(`
        SELECT * FROM flip_tracking WHERE user_id = ?
      `).get(userId);
    }
    
    if (!record && deviceFingerprint) {
      record = db.prepare(`
        SELECT * FROM flip_tracking WHERE device_fingerprint = ?
      `).get(deviceFingerprint);
    }
    
    // Create new record if none exists
    if (!record) {
      const insertStmt = db.prepare(`
        INSERT INTO flip_tracking (
          user_id, device_fingerprint, session_id, flip_count
        ) VALUES (?, ?, ?, 0)
        RETURNING *
      `);
      
      record = insertStmt.get(userId, deviceFingerprint, sessionId);
    }
    
    // Check subscription status if user is authenticated
    let subscription = null;
    if (userId) {
      subscription = db.prepare(`
        SELECT * FROM subscriptions 
        WHERE user_id = ? AND status = 'active'
      `).get(userId);
    }
    
    const isProUser = subscription?.plan === 'pro' && 
                      subscription?.status === 'active' &&
                      (!subscription.current_period_end || 
                       new Date(subscription.current_period_end) > new Date());
    
    return {
      flips_used: record.flip_count,
      flips_remaining: isProUser ? 'unlimited' : Math.max(0, FREE_FLIP_LIMIT - record.flip_count),
      is_pro: isProUser,
      can_flip: isProUser || record.flip_count < FREE_FLIP_LIMIT,
      subscription_type: subscription?.plan || 'free',
      tracking_id: record.id
    };
  } catch (error) {
    console.error('Error getting flip status:', error);
    // Return permissive status on error
    return {
      flips_used: 0,
      flips_remaining: FREE_FLIP_LIMIT,
      is_pro: false,
      can_flip: true,
      subscription_type: 'free'
    };
  }
}

/**
 * Track a flip/scan
 */
async function trackFlip(userId, deviceFingerprint, sessionId, analysisData) {
  try {
    const db = getDatabase();
    
    // Get current status
    const status = await getFlipStatus(userId, deviceFingerprint, sessionId);
    
    // Don't track if user can't flip (shouldn't happen with proper frontend checks)
    if (!status.can_flip) {
      throw new Error('Flip limit reached');
    }
    
    // Start transaction
    db.prepare('BEGIN').run();
    
    try {
      // Update flip count
      if (userId) {
        db.prepare(`
          UPDATE flip_tracking 
          SET flip_count = flip_count + 1,
              last_flip_at = CURRENT_TIMESTAMP
          WHERE user_id = ?
        `).run(userId);
      } else if (deviceFingerprint) {
        db.prepare(`
          UPDATE flip_tracking 
          SET flip_count = flip_count + 1,
              last_flip_at = CURRENT_TIMESTAMP
          WHERE device_fingerprint = ?
        `).run(deviceFingerprint);
      }
      
      // Record flip history
      db.prepare(`
        INSERT INTO flip_history (
          user_id, device_fingerprint, analysis_id, 
          item_name, price_range, real_score
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        userId,
        deviceFingerprint,
        analysisData.analysis_id || `analysis_${Date.now()}`,
        analysisData.item_name,
        analysisData.price_range,
        analysisData.real_score
      );
      
      db.prepare('COMMIT').run();
      
      // Return updated status
      return await getFlipStatus(userId, deviceFingerprint, sessionId);
    } catch (error) {
      db.prepare('ROLLBACK').run();
      throw error;
    }
  } catch (error) {
    console.error('Error tracking flip:', error);
    throw error;
  }
}

/**
 * Check if payment is required for next flip
 */
async function requiresPayment(userId, deviceFingerprint, sessionId) {
  const status = await getFlipStatus(userId, deviceFingerprint, sessionId);
  return !status.can_flip;
}

/**
 * Mark user as paid (after successful payment)
 */
async function markAsPaid(userId, planType = 'single') {
  try {
    const db = getDatabase();
    
    db.prepare(`
      UPDATE flip_tracking 
      SET is_paid_user = 1,
          subscription_type = ?
      WHERE user_id = ?
    `).run(planType, userId);
    
    return true;
  } catch (error) {
    console.error('Error marking user as paid:', error);
    return false;
  }
}

/**
 * Get flip history for a user
 */
async function getFlipHistory(userId, deviceFingerprint, limit = 50) {
  try {
    const db = getDatabase();
    
    const history = db.prepare(`
      SELECT * FROM flip_history 
      WHERE user_id = ? OR device_fingerprint = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(userId, deviceFingerprint, limit);
    
    return history;
  } catch (error) {
    console.error('Error getting flip history:', error);
    return [];
  }
}

module.exports = {
  getFlipStatus,
  trackFlip,
  requiresPayment,
  markAsPaid,
  getFlipHistory,
  FREE_FLIP_LIMIT
};