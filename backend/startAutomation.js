#!/usr/bin/env node

// Standalone script to start Reddit automation
// Can be run with: node startAutomation.js

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../shared/.env') });

const { initializeDatabase } = require('./database');
const { startAutomation } = require('./growth/redditAutomation');

console.log('\n=== Flippi Marketing Automation Startup ===');
console.log('Time:', new Date().toISOString());

// Initialize database
try {
  initializeDatabase();
  console.log('✓ Database initialized');
} catch (error) {
  console.error('✗ Database initialization failed:', error.message);
  process.exit(1);
}

// Start automation with 30 minute interval
const intervalMinutes = process.env.AUTOMATION_INTERVAL || 30;

console.log(`Starting automation with ${intervalMinutes} minute interval...`);
console.log('Monitoring subreddits:');
console.log('  - r/ThriftStoreHauls');
console.log('  - r/whatsthisworth'); 
console.log('  - r/vintage');
console.log('  - r/Antiques');
console.log('  - r/Flipping');
console.log('\n');

// Start the automation
startAutomation(intervalMinutes);

// Keep the process running
process.on('SIGINT', () => {
  console.log('\n\nShutting down automation...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\nShutting down automation...');
  process.exit(0);
});

console.log('Automation is running. Press Ctrl+C to stop.\n');