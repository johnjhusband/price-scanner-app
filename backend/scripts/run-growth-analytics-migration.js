#!/usr/bin/env node
/**
 * Run growth analytics database migration
 * This script creates the necessary tables for comprehensive analytics tracking
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Database path
const dbPath = path.join(__dirname, '..', 'flippi.db');
const migrationPath = path.join(__dirname, '..', 'migrations', 'add-growth-analytics-tables.sql');

console.log('Running growth analytics migration...');
console.log('Database:', dbPath);
console.log('Migration:', migrationPath);

// Read migration SQL
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

// Connect to database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
        process.exit(1);
    }
    console.log('Connected to database');
});

// Run migration
db.exec(migrationSQL, (err) => {
    if (err) {
        console.error('Migration failed:', err);
        db.close();
        process.exit(1);
    }
    
    console.log('Migration completed successfully!');
    
    // Verify tables were created
    db.all("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'growth_%'", (err, tables) => {
        if (err) {
            console.error('Error verifying tables:', err);
        } else {
            console.log('\nCreated tables:');
            tables.forEach(table => console.log(' -', table.name));
        }
        
        // Add missing columns to content_generated if needed
        db.all("PRAGMA table_info(content_generated)", (err, columns) => {
            if (err) {
                console.error('Error checking content_generated columns:', err);
                db.close();
                return;
            }
            
            const columnNames = columns.map(col => col.name);
            const updates = [];
            
            // Check for tracking-related columns
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
                    db.run(update, (err) => {
                        if (err) {
                            console.error('Error adding column:', err);
                        } else {
                            console.log(' -', update);
                        }
                    });
                });
            }
            
            setTimeout(() => {
                db.close(() => {
                    console.log('\nMigration complete!');
                });
            }, 1000);
        });
    });
});

// Handle errors
db.on('error', (err) => {
    console.error('Database error:', err);
});