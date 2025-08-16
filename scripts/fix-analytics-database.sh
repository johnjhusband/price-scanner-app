#!/bin/bash

# Fix analytics database issues by ensuring all tables exist
echo "=== Fixing Analytics Database ==="

# Function to run SQL commands
run_sql() {
    local db_path=$1
    local sql=$2
    sqlite3 "$db_path" "$sql" 2>&1
}

# Find database path
DB_PATH=""
if [ -f "backend/flippi.db" ]; then
    DB_PATH="backend/flippi.db"
elif [ -f "flippi.db" ]; then
    DB_PATH="flippi.db"
elif [ -f "../backend/flippi.db" ]; then
    DB_PATH="../backend/flippi.db"
else
    echo "Error: Could not find flippi.db"
    exit 1
fi

echo "Using database: $DB_PATH"

# Create content_generated table if it doesn't exist
echo "Creating content_generated table..."
run_sql "$DB_PATH" "
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
);"

# Create indexes
echo "Creating indexes..."
run_sql "$DB_PATH" "CREATE INDEX IF NOT EXISTS idx_content_slug ON content_generated(slug);"
run_sql "$DB_PATH" "CREATE INDEX IF NOT EXISTS idx_content_published ON content_generated(published);"
run_sql "$DB_PATH" "CREATE INDEX IF NOT EXISTS idx_content_source ON content_generated(source_id);"

# Now run the analytics migration
echo "Running analytics migration..."
if [ -f "backend/scripts/run-growth-analytics-migration.js" ]; then
    cd backend && node scripts/run-growth-analytics-migration.js
elif [ -f "scripts/run-growth-analytics-migration.js" ]; then
    node scripts/run-growth-analytics-migration.js
else
    echo "Warning: Could not find migration script"
fi

# Verify tables were created
echo ""
echo "Verifying tables..."
TABLES=$(run_sql "$DB_PATH" ".tables" | grep -E "(content_generated|growth_)")

if [[ $TABLES == *"content_generated"* ]] && [[ $TABLES == *"growth_analytics_events"* ]]; then
    echo "✅ All tables created successfully:"
    echo "$TABLES" | tr ' ' '\n' | grep -E "(content_generated|growth_)" | sed 's/^/  - /'
else
    echo "❌ Some tables are missing"
    echo "Found tables: $TABLES"
    exit 1
fi

echo ""
echo "=== Database fix complete ==="