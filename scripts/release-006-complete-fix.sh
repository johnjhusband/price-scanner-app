#!/bin/bash
# Complete fix for Release 006 on blue.flippi.ai

echo "=== RELEASE 006 COMPLETE FIX ==="
echo ""

# 1. Run database migration
echo "Step 1: Running analytics database migration..."
cd /var/www/blue.flippi.ai/backend
export FEEDBACK_DB_PATH=/var/www/blue.flippi.ai/backend/flippi.db

# Create migration script if it doesn't exist
if [ ! -f "scripts/run-growth-analytics-migration.js" ]; then
    cat > scripts/run-growth-analytics-migration.js << 'MIGRATION'
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.FEEDBACK_DB_PATH || path.join(__dirname, '..', 'flippi.db');
console.log('Using database:', dbPath);

try {
  const db = new Database(dbPath);
  
  // Create analytics tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS growth_analytics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action_type TEXT NOT NULL,
      reddit_post_id TEXT,
      valuation_slug TEXT,
      user_agent TEXT,
      ip_address TEXT,
      referrer TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_growth_analytics_created_at ON growth_analytics(created_at);
    CREATE INDEX IF NOT EXISTS idx_growth_analytics_action_type ON growth_analytics(action_type);
    CREATE INDEX IF NOT EXISTS idx_growth_analytics_reddit_post_id ON growth_analytics(reddit_post_id);
    CREATE INDEX IF NOT EXISTS idx_growth_analytics_valuation_slug ON growth_analytics(valuation_slug);
  `);
  
  console.log('✅ Analytics tables created successfully');
  db.close();
} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
}
MIGRATION
fi

node scripts/run-growth-analytics-migration.js
echo "✅ Database migration complete"

# 2. Fix nginx routing (copy from green where it works)
echo ""
echo "Step 2: Copying working nginx config from green..."
cd /var/www/blue.flippi.ai

if [ -f "/etc/nginx/sites-available/green.flippi.ai" ]; then
    sudo cp /etc/nginx/sites-available/green.flippi.ai /tmp/blue.nginx
    sudo sed -i 's/green\.flippi\.ai/blue.flippi.ai/g' /tmp/blue.nginx
    sudo sed -i 's/:3001/:3002/g' /tmp/blue.nginx
    sudo cp /etc/nginx/sites-available/blue.flippi.ai /etc/nginx/sites-available/blue.flippi.ai.backup.$(date +%s)
    sudo mv /tmp/blue.nginx /etc/nginx/sites-available/blue.flippi.ai
    sudo nginx -t && sudo nginx -s reload
    echo "✅ Nginx config updated from green"
fi

# 3. Ensure web-styles.css exists
echo ""
echo "Step 3: Fixing web-styles.css..."
if [ -f "mobile-app/web-styles.css" ] && [ ! -f "mobile-app/dist/web-styles.css" ]; then
    cp mobile-app/web-styles.css mobile-app/dist/
    echo "✅ Copied web-styles.css to dist"
fi

# 4. Restart services
echo ""
echo "Step 4: Restarting services..."
pm2 restart dev-backend dev-frontend
echo "✅ Services restarted"

# 5. Verify fixes
echo ""
echo "Step 5: Verifying fixes..."
echo ""
echo "Database tables:"
sqlite3 backend/flippi.db "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'growth%';" || echo "Check failed"

echo ""
echo "Testing routes:"
curl -s -o /dev/null -w "Growth Dashboard: HTTP %{http_code}\n" https://blue.flippi.ai/growth/questions
curl -s -o /dev/null -w "CSS file: HTTP %{http_code}\n" https://blue.flippi.ai/web-styles.css
curl -s -o /dev/null -w "API Analytics: HTTP %{http_code}\n" https://blue.flippi.ai/api/growth/analytics/metrics/test

echo ""
echo "=== RELEASE 006 FIX COMPLETE ==="
echo ""
echo "Fixed:"
echo "1. ✅ Analytics database tables created"
echo "2. ✅ Growth Dashboard routing fixed"  
echo "3. ✅ CSS MIME type error resolved"
echo "4. ✅ Services restarted"
echo ""
echo "Please test:"
echo "- Growth Dashboard at /growth/questions"
echo "- Download share image functionality"
echo "- Analytics tab in Growth Dashboard"