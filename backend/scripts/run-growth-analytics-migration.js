#!/usr/bin/env node
/**
 * Run growth analytics database migration
 * This script creates the necessary tables for comprehensive analytics tracking
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Database path - use the same path as the main app
const dbPath = process.env.FEEDBACK_DB_PATH || path.join(__dirname, '..', 'flippi.db');
const migrationPath = path.join(__dirname, '..', 'migrations', 'add-growth-analytics-tables.sql');

console.log('Running growth analytics migration...');
console.log('Database:', dbPath);
console.log('Migration:', migrationPath);

// Read migration SQL
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

try {
    // Connect to database
    const db = new Database(dbPath);
    console.log('Connected to database');

    // Run migration
    try {
        db.exec(migrationSQL);
        console.log('Migration completed successfully!');
        
        // Verify tables were created
        const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'growth_%'").all();
        console.log('\nCreated tables:');
        tables.forEach(table => console.log(' -', table.name));
        
        // Check content_generated columns
        const columns = db.prepare("PRAGMA table_info(content_generated)").all();
        const columnNames = columns.map(col => col.name);
        
        // Add missing columns to content_generated if needed
        const updates = [];
        if (!columnNames.includes('tracking_code')) {
            updates.push("ALTER TABLE content_generated ADD COLUMN tracking_code TEXT");
        }
        if (!columnNames.includes('short_url')) {
            updates.push("ALTER TABLE content_generated ADD COLUMN short_url TEXT");
        }
        if (!columnNames.includes('platform_tags')) {
            updates.push("ALTER TABLE content_generated ADD COLUMN platform_tags TEXT"); // JSON array
        }
        
        if (updates.length > 0) {
            console.log('\nAdding columns to content_generated:');
            updates.forEach(update => {
                try {
                    db.exec(update);
                    console.log(' -', update);
                } catch (err) {
                    if (!err.message.includes('duplicate column')) {
                        console.error('Error adding column:', err.message);
                    }
                }
            });
        }
        
        // Show summary
        const eventCount = db.prepare("SELECT COUNT(*) as count FROM growth_analytics_events").get();
        const metricsCount = db.prepare("SELECT COUNT(*) as count FROM growth_content_metrics").get();
        
        console.log('\nMigration summary:');
        console.log(' - Analytics events:', eventCount.count);
        console.log(' - Content metrics:', metricsCount.count);
        
        db.close();
        console.log('\nMigration complete!');
        
    } catch (err) {
        console.error('Migration failed:', err);
        db.close();
        process.exit(1);
    }
    
} catch (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
}