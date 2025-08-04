#!/usr/bin/env node

/**
 * Deployment Window Analyzer for Flippi.ai
 * Provides recommendations for safe deployment windows based on typical user patterns
 */

console.log('=== Flippi.ai Deployment Window Analysis ===');
console.log('Analyzing optimal deployment windows...\n');

// Since we can't access the production database directly from local,
// let me provide analysis based on the information we know:
// - The app is in early stages with limited users
// - Test user tara@edgy.co should be excluded from counts
// - We need to check actual production data via SSH to servers

console.log('📋 DEPLOYMENT STRATEGY RECOMMENDATIONS');
console.log('=====================================\n');

console.log('Since we cannot access production data locally, here\'s what you should do:\n');

console.log('1️⃣  CHECK CURRENT USER ACTIVITY (via SSH to servers):');
console.log('   ssh to green.flippi.ai (staging) and run:');
console.log('   curl http://localhost:3001/auth/users/all\n');

console.log('2️⃣  FILTER OUT TEST USERS:');
console.log('   - Exclude tara@edgy.co from user counts');
console.log('   - Look for real user emails only\n');

console.log('3️⃣  ANALYZE ACTIVITY PATTERNS:');
console.log('   - Check "last_login" timestamps');
console.log('   - Identify users active in last 24 hours');
console.log('   - Note peak usage times\n');

console.log('📊 GENERAL DEPLOYMENT WINDOWS (PST/PDT):');
console.log('========================================');
console.log('✅ BEST TIMES:');
console.log('   - Weekdays: 3:00 AM - 6:00 AM PST');
console.log('   - Weekends: 6:00 AM - 9:00 AM PST');
console.log('   - Late nights: 11:00 PM - 2:00 AM PST\n');

console.log('⚠️  AVOID THESE TIMES:');
console.log('   - Business hours: 9:00 AM - 5:00 PM PST');
console.log('   - Lunch peak: 12:00 PM - 2:00 PM PST');
console.log('   - Evening: 6:00 PM - 9:00 PM PST\n');

console.log('🚀 DEPLOYMENT PROCESS (staging → production):');
console.log('============================================');
console.log('1. Test thoroughly on green.flippi.ai (staging)');
console.log('2. Check user activity on app.flippi.ai');
console.log('3. If < 5 active users in last hour: Deploy immediately');
console.log('4. If > 5 active users: Wait for low-activity window');
console.log('5. Deploy by pushing to master branch');
console.log('6. Monitor deployment via GitHub Actions');
console.log('7. Verify on app.flippi.ai\n');

// Current time analysis
const now = new Date();
const hour = now.getHours();
const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday

console.log(`⏰ CURRENT TIME ANALYSIS:`);
console.log(`========================`);
console.log(`Current time: ${now.toLocaleString()}`);
console.log(`Day: ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek]}`);

// Deployment recommendation based on current time
let recommendation = '';
if (dayOfWeek === 0 || dayOfWeek === 6) {
  // Weekend
  if (hour >= 6 && hour <= 9) {
    recommendation = '✅ GOOD - Weekend morning, typically low activity';
  } else if (hour >= 22 || hour <= 2) {
    recommendation = '✅ GOOD - Weekend late night, minimal users';
  } else {
    recommendation = '⚠️  MODERATE - Check actual user activity first';
  }
} else {
  // Weekday
  if (hour >= 3 && hour <= 6) {
    recommendation = '✅ EXCELLENT - Weekday early morning, lowest activity';
  } else if (hour >= 9 && hour <= 17) {
    recommendation = '🔴 POOR - Business hours, highest activity';
  } else if (hour >= 22 || hour <= 2) {
    recommendation = '✅ GOOD - Late night, low activity';
  } else {
    recommendation = '⚠️  MODERATE - Check actual user activity first';
  }
}

console.log(`Deployment recommendation: ${recommendation}\n`);

console.log('📝 QUICK COMMANDS TO CHECK ACTIVITY:');
console.log('===================================');
console.log('# SSH to staging and check users:');
console.log('ssh green.flippi.ai');
console.log('curl -s http://localhost:3001/auth/users/all | jq .\n');

console.log('# Count real users (excluding test):');
console.log('curl -s http://localhost:3001/auth/users/all | jq \'.users | map(select(.email != "tara@edgy.co")) | length\'\n');

console.log('# See recent activity:');
console.log('curl -s http://localhost:3001/auth/users/all | jq \'.users | map(select(.email != "tara@edgy.co")) | sort_by(.last_login) | reverse | .[0:5]\'\n');

console.log('✓ Analysis complete. Check actual production data before deploying!');