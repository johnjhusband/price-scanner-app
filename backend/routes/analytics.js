const express = require('express');
const router = express.Router();
const db = require('../services/database');
const { requireAuth } = require('../middleware/auth');

// Test users to exclude from analytics
const TEST_USERS = ['tara@edgy.co'];

// Admin check middleware
const requireAdmin = (req, res, next) => {
  // Simple admin check - you can make this more sophisticated
  const adminEmails = ['tara@edgy.co', 'john@flippi.ai'];
  if (!req.user || !adminEmails.includes(req.user.email)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// GET /api/analytics/activity
// Returns recent user activity summary
router.get('/activity', requireAuth, requireAdmin, (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24; // Default last 24 hours
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    
    // Get all users except test users
    const activeUsersStmt = db.prepare(`
      SELECT COUNT(DISTINCT u.id) as active_users
      FROM users u
      WHERE u.email NOT IN (${TEST_USERS.map(() => '?').join(',')})
      AND u.last_login > ?
    `);
    const activeUsers = activeUsersStmt.get(...TEST_USERS, since);
    
    // Get recent feedback/scans
    const recentScansStmt = db.prepare(`
      SELECT COUNT(*) as scan_count
      FROM feedback f
      WHERE f.created_at > ?
      AND f.metadata NOT LIKE '%tara@edgy.co%'
    `);
    const recentScans = recentScansStmt.get(since);
    
    // Get last activity time
    const lastActivityStmt = db.prepare(`
      SELECT MAX(created_at) as last_activity
      FROM feedback
      WHERE metadata NOT LIKE '%tara@edgy.co%'
    `);
    const lastActivity = lastActivityStmt.get();
    
    res.json({
      period_hours: hours,
      active_users: activeUsers.active_users || 0,
      total_scans: recentScans.scan_count || 0,
      last_activity: lastActivity.last_activity || null,
      checked_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// GET /api/analytics/deployment-check
// Quick check if safe to deploy
router.get('/deployment-check', requireAuth, requireAdmin, (req, res) => {
  try {
    // Check activity in last 15 minutes
    const recentMinutes = 15;
    const since = new Date(Date.now() - recentMinutes * 60 * 1000).toISOString();
    
    const recentActivityStmt = db.prepare(`
      SELECT COUNT(*) as recent_count
      FROM feedback
      WHERE created_at > ?
      AND metadata NOT LIKE '%tara@edgy.co%'
    `);
    const recentActivity = recentActivityStmt.get(since);
    
    const isActive = recentActivity.recent_count > 0;
    
    res.json({
      safe_to_deploy: !isActive,
      active_users_now: isActive,
      recent_activity_count: recentActivity.recent_count,
      message: isActive 
        ? `${recentActivity.recent_count} scans in last ${recentMinutes} minutes - maybe wait` 
        : 'No recent activity - safe to deploy',
      checked_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Deployment check error:', error);
    res.status(500).json({ error: 'Failed to check deployment status' });
  }
});

// GET /api/analytics/users
// Get user summary
router.get('/users', requireAuth, requireAdmin, (req, res) => {
  try {
    // Total users
    const totalUsersStmt = db.prepare(`
      SELECT COUNT(*) as total
      FROM users
      WHERE email NOT IN (${TEST_USERS.map(() => '?').join(',')})
    `);
    const totalUsers = totalUsersStmt.get(...TEST_USERS);
    
    // Users by day for last 7 days
    const dailyUsersStmt = db.prepare(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as new_users
      FROM users
      WHERE email NOT IN (${TEST_USERS.map(() => '?').join(',')})
      AND created_at > datetime('now', '-7 days')
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);
    const dailyUsers = dailyUsersStmt.all(...TEST_USERS);
    
    res.json({
      total_users: totalUsers.total || 0,
      daily_signups: dailyUsers,
      test_users_excluded: TEST_USERS
    });
  } catch (error) {
    console.error('User analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch user analytics' });
  }
});

module.exports = router;