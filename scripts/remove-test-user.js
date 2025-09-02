#!/usr/bin/env node

/**
 * Script to remove test user (tara@edgy.co) from production database
 * This script should be run on the production server after SSH access
 * 
 * Usage: node remove-test-user.js
 */

const path = require('path');
const Database = require('better-sqlite3');

// Production database path
const DB_PATH = process.env.FEEDBACK_DB_PATH || '/tmp/flippi-feedback.db';

console.log('=== Flippi.ai Test User Removal Script ===');
console.log(`Database path: ${DB_PATH}`);
console.log('Target user email: tara@edgy.co');
console.log('');

try {
  // Open database
  const db = new Database(DB_PATH);
  
  // First, check if the user exists
  const checkUser = db.prepare('SELECT * FROM users WHERE email = ?');
  const user = checkUser.get('tara@edgy.co');
  
  if (!user) {
    console.log('✓ User tara@edgy.co not found in database. Nothing to remove.');
    db.close();
    process.exit(0);
  }
  
  console.log('Found user:');
  console.log(`  ID: ${user.id}`);
  console.log(`  Email: ${user.email}`);
  console.log(`  Name: ${user.name}`);
  console.log(`  Google ID: ${user.google_id}`);
  console.log(`  Created: ${user.created_at}`);
  console.log(`  Last Login: ${user.last_login}`);
  console.log('');
  
  // Create a backup of the user data before deletion
  console.log('Creating backup of user data...');
  const backupData = JSON.stringify(user, null, 2);
  const fs = require('fs');
  const backupPath = `/tmp/removed-user-${user.id}-${Date.now()}.json`;
  fs.writeFileSync(backupPath, backupData);
  console.log(`✓ Backup saved to: ${backupPath}`);
  console.log('');
  
  // Begin transaction for safe deletion
  console.log('Beginning transaction...');
  const deleteUser = db.prepare('DELETE FROM users WHERE email = ?');
  
  db.transaction(() => {
    const result = deleteUser.run('tara@edgy.co');
    console.log(`✓ Deleted ${result.changes} user record(s)`);
  })();
  
  // Verify deletion
  const verifyUser = checkUser.get('tara@edgy.co');
  if (!verifyUser) {
    console.log('✓ User successfully removed from database');
  } else {
    console.error('✗ ERROR: User still exists in database!');
    process.exit(1);
  }
  
  // Show remaining users count
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  console.log(`\nTotal users remaining: ${userCount.count}`);
  
  // Close database
  db.close();
  console.log('\n✓ Database connection closed');
  console.log('✓ Test user removal completed successfully');
  
} catch (error) {
  console.error('\n✗ ERROR:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}