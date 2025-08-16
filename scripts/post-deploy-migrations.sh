#!/bin/bash

# Post-deployment migration script
# Runs database migrations after code deployment

echo "Running post-deployment migrations..."

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$SCRIPT_DIR/../backend"

# Check if we're in the backend directory
if [ -d "$BACKEND_DIR" ]; then
    cd "$BACKEND_DIR"
elif [ -d "backend" ]; then
    cd backend
else
    echo "Error: Backend directory not found"
    exit 1
fi

echo "Current directory: $(pwd)"

# First ensure content_generated table exists
echo "Ensuring content_generated table exists..."
sqlite3 flippi.db "
CREATE TABLE IF NOT EXISTS content_generated (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id TEXT NOT NULL,
    source_type TEXT DEFAULT 'reddit',
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    meta_description TEXT,
    slug TEXT UNIQUE,
    template_type TEXT,
    keywords TEXT,
    published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tracking_code TEXT,
    short_url TEXT,
    platform_tags TEXT
);" || echo "Table creation attempted"

# Run growth analytics migration if the script exists
if [ -f "scripts/run-growth-analytics-migration.js" ]; then
    echo "Running growth analytics migration..."
    node scripts/run-growth-analytics-migration.js
    
    if [ $? -eq 0 ]; then
        echo "✅ Growth analytics migration completed successfully"
    else
        echo "❌ Growth analytics migration failed"
        exit 1
    fi
else
    echo "Growth analytics migration script not found, skipping..."
fi

# Add future migrations here
# Example:
# if [ -f "scripts/run-other-migration.js" ]; then
#     node scripts/run-other-migration.js
# fi

echo "✅ All migrations completed successfully"