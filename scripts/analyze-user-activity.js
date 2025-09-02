#!/usr/bin/env node

/**
 * Script to analyze user activity for deployment planning
 * Filters out test users and provides activity patterns
 */

const Database = require('better-sqlite3');

// Database paths for different environments
const DB_PATHS = {
  production: '/var/lib/flippi/flippi.db',
  staging: '/var/lib/flippi-staging/flippi.db',
  development: '/var/lib/flippi-development/flippi.db',
  local: process.env.FEEDBACK_DB_PATH || '/tmp/flippi-feedback.db'
};

// Test user emails to exclude
const TEST_USERS = ['tara@edgy.co'];

console.log('=== Flippi.ai User Activity Analysis ===');
console.log('Analyzing user activity patterns for deployment planning...\n');

// Try to find a database
let db;
let dbPath;

for (const [env, path] of Object.entries(DB_PATHS)) {
  try {
    const fs = require('fs');
    if (fs.existsSync(path)) {
      dbPath = path;
      db = new Database(path, { readonly: true });
      console.log(`✓ Found database at: ${path} (${env})\n`);
      break;
    }
  } catch (e) {
    // Continue to next path
  }
}

if (!db) {
  console.error('✗ No database found. This script must be run where the database exists.');
  console.log('\nTrying to simulate with sample data for demonstration...\n');
  
  // Provide sample analysis
  console.log('SAMPLE DEPLOYMENT WINDOW ANALYSIS:');
  console.log('=====================================');
  console.log('\nBased on typical SaaS usage patterns:');
  console.log('\n📊 Best deployment windows:');
  console.log('  - Weekday early morning: 3:00 AM - 6:00 AM local time');
  console.log('  - Weekend mornings: Saturday/Sunday 6:00 AM - 9:00 AM');
  console.log('  - Late night weekdays: 11:00 PM - 2:00 AM');
  console.log('\n⚠️  Avoid these times:');
  console.log('  - Weekday business hours: 9:00 AM - 5:00 PM');
  console.log('  - Lunch hours: 12:00 PM - 2:00 PM');
  console.log('  - Evening peak: 6:00 PM - 9:00 PM');
  
  process.exit(0);
}

try {
  // Get all users excluding test users
  const getUsersQuery = `
    SELECT 
      email, 
      name, 
      created_at, 
      last_login,
      datetime(last_login) as last_login_formatted,
      CAST((julianday('now') - julianday(last_login)) * 24 as INTEGER) as hours_since_login,
      CAST(julianday('now') - julianday(created_at) as INTEGER) as days_since_signup
    FROM users 
    WHERE email NOT IN (${TEST_USERS.map(() => '?').join(',')})
    ORDER BY last_login DESC
  `;
  
  const users = db.prepare(getUsersQuery).all(...TEST_USERS);
  
  console.log(`📊 USER ACTIVITY SUMMARY`);
  console.log(`=======================`);
  console.log(`Total real users: ${users.length}`);
  console.log(`Test users excluded: ${TEST_USERS.join(', ')}\n`);
  
  if (users.length === 0) {
    console.log('No real users found in the database.');
    db.close();
    process.exit(0);
  }
  
  // Analyze recent activity
  const now = new Date();
  const activeInLast24h = users.filter(u => u.hours_since_login <= 24);
  const activeInLast7d = users.filter(u => u.hours_since_login <= 168);
  const activeInLast30d = users.filter(u => u.hours_since_login <= 720);
  
  console.log(`📈 ACTIVITY BREAKDOWN`);
  console.log(`====================`);
  console.log(`Active in last 24 hours: ${activeInLast24h.length} users`);
  console.log(`Active in last 7 days: ${activeInLast7d.length} users`);
  console.log(`Active in last 30 days: ${activeInLast30d.length} users\n`);
  
  // Show recent activity
  console.log(`🕐 RECENT USER ACTIVITY`);
  console.log(`======================`);
  const recentUsers = users.slice(0, 10);
  recentUsers.forEach(user => {
    console.log(`${user.email}:`);
    console.log(`  Last active: ${user.last_login_formatted} (${user.hours_since_login}h ago)`);
    console.log(`  User since: ${user.days_since_signup} days ago`);
  });
  
  // Analyze activity patterns by hour
  console.log(`\n🕐 HOURLY ACTIVITY PATTERN`);
  console.log(`==========================`);
  
  const hourlyActivity = {};
  users.forEach(user => {
    if (user.last_login) {
      const hour = new Date(user.last_login).getHours();
      hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;
    }
  });
  
  // Find peak and low activity hours
  let maxActivity = 0;
  let minActivity = users.length;
  let peakHours = [];
  let lowHours = [];
  
  for (let hour = 0; hour < 24; hour++) {
    const activity = hourlyActivity[hour] || 0;
    if (activity > maxActivity) {
      maxActivity = activity;
      peakHours = [hour];
    } else if (activity === maxActivity) {
      peakHours.push(hour);
    }
    
    if (activity < minActivity) {
      minActivity = activity;
      lowHours = [hour];
    } else if (activity === minActivity) {
      lowHours.push(hour);
    }
  }
  
  console.log(`Peak activity hours: ${peakHours.map(h => `${h}:00`).join(', ')}`);
  console.log(`Low activity hours: ${lowHours.map(h => `${h}:00`).join(', ')}`);
  
  // Deployment recommendations
  console.log(`\n🚀 DEPLOYMENT RECOMMENDATIONS`);
  console.log(`=============================`);
  
  if (activeInLast24h.length === 0) {
    console.log(`✅ No users active in last 24 hours - SAFE to deploy anytime`);
  } else if (activeInLast24h.length <= 5) {
    console.log(`⚠️  ${activeInLast24h.length} users active in last 24 hours - LOW RISK deployment`);
    console.log(`Recommended windows: ${lowHours.slice(0, 3).map(h => `${h}:00`).join(', ')}`);
  } else {
    console.log(`🔴 ${activeInLast24h.length} users active in last 24 hours - Schedule deployment carefully`);
    console.log(`Best windows: ${lowHours.slice(0, 3).map(h => `${h}:00`).join(', ')}`);
    console.log(`Avoid: ${peakHours.map(h => `${h}:00`).join(', ')}`);
  }
  
  // Current time analysis
  const currentHour = now.getHours();
  const currentActivity = hourlyActivity[currentHour] || 0;
  console.log(`\nCurrent time: ${now.toLocaleTimeString()}`);
  console.log(`Current hour activity level: ${currentActivity} users`);
  
  if (currentActivity === 0) {
    console.log(`✅ No recent activity at this hour - OPTIMAL deployment window`);
  } else if (currentActivity <= 2) {
    console.log(`✅ Low activity at this hour - GOOD deployment window`);
  } else {
    console.log(`⚠️  Moderate/High activity at this hour - Consider waiting`);
  }
  
  db.close();
  console.log('\n✓ Analysis complete');
  
} catch (error) {
  console.error('\n✗ ERROR:', error.message);
  if (db) db.close();
  process.exit(1);
}