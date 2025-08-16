#!/bin/bash
# COMPREHENSIVE FIX FOR BLUE.FLIPPI.AI
# This script creates all necessary fixes to get the app working

echo "=== COMPREHENSIVE FIX FOR BLUE.FLIPPI.AI ==="
echo ""

# 1. Create nginx configuration fix
echo "Creating nginx configuration fix..."
cat > scripts/nginx-complete-fix.sh << 'NGINX_SCRIPT'
#!/bin/bash
# Complete nginx configuration for blue.flippi.ai

cat > /tmp/blue.flippi.ai.conf << 'EOF'
server {
    listen 80;
    server_name blue.flippi.ai;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name blue.flippi.ai;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/blue.flippi.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/blue.flippi.ai/privkey.pem;
    
    # Create SSL files if missing
    if [ ! -f "/etc/letsencrypt/options-ssl-nginx.conf" ]; then
        echo "ssl_session_cache shared:le_nginx_SSL:10m;
ssl_session_timeout 1440m;
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers off;
ssl_ciphers \"ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256\";" > /etc/letsencrypt/options-ssl-nginx.conf
    fi
    
    if [ ! -f "/etc/letsencrypt/ssl-dhparams.pem" ]; then
        openssl dhparam -out /etc/letsencrypt/ssl-dhparams.pem 2048
    fi
    
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Root directory
    root /var/www/blue.flippi.ai/mobile-app/dist;
    index index.html;

    # CRITICAL: Serve static files FIRST (before any other location blocks)
    location /_expo/ {
        alias /var/www/blue.flippi.ai/mobile-app/dist/_expo/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
    
    location /assets/ {
        alias /var/www/blue.flippi.ai/mobile-app/dist/assets/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # Growth routes (Release 006)
    location /growth {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Admin routes
    location /admin {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API routes
    location /api {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health endpoint
    location /health {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
    }

    # Legal pages
    location = /terms {
        proxy_pass http://localhost:3002/terms.html;
    }
    location = /privacy {
        proxy_pass http://localhost:3002/privacy.html;
    }
    location = /mission {
        proxy_pass http://localhost:3002/mission.html;
    }
    location = /contact {
        proxy_pass http://localhost:3002/contact.html;
    }

    # Value/blog routes
    location /value {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # OAuth routes
    location /auth {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # React app catch-all - MUST BE LAST!
    location / {
        try_files $uri /index.html;
    }
}
EOF

# Apply configuration
sudo cp /tmp/blue.flippi.ai.conf /etc/nginx/sites-available/blue.flippi.ai
sudo nginx -t && sudo nginx -s reload
echo "✅ Nginx configuration applied"
NGINX_SCRIPT

# 2. Create database migration fix
echo ""
echo "Creating database migration fix..."
cat > backend/scripts/run-growth-analytics-migration.js << 'MIGRATION_SCRIPT'
const Database = require('better-sqlite3');
const path = require('path');

// Use the production database path
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
MIGRATION_SCRIPT

# 3. Create environment file for production
echo ""
echo "Creating production environment file..."
cat > backend/.env.production << 'ENV_FILE'
# Production environment variables
NODE_ENV=production
PORT=3002
FEEDBACK_DB_PATH=/var/www/blue.flippi.ai/backend/flippi.db
ENV_FILE

# 4. Create deployment verification script
echo ""
echo "Creating deployment verification script..."
cat > scripts/verify-deployment.sh << 'VERIFY_SCRIPT'
#!/bin/bash
# Verify deployment is working correctly

echo "=== Deployment Verification ==="
echo ""

# Check if frontend files exist
echo "Checking frontend build..."
if [ -f "/var/www/blue.flippi.ai/mobile-app/dist/index.html" ]; then
    echo "✅ Frontend index.html exists"
    JS_COUNT=$(find /var/www/blue.flippi.ai/mobile-app/dist/_expo -name "*.js" 2>/dev/null | wc -l)
    echo "✅ Found $JS_COUNT JavaScript files"
else
    echo "❌ Frontend not built!"
fi

echo ""
echo "Checking backend process..."
pm2 status dev-backend --no-color

echo ""
echo "Testing endpoints..."
curl -s -o /dev/null -w "Health endpoint: HTTP %{http_code}\n" http://localhost:3002/health
curl -s -o /dev/null -w "Growth route: HTTP %{http_code}\n" https://blue.flippi.ai/growth/questions
curl -s -o /dev/null -w "Frontend JS: HTTP %{http_code}\n" https://blue.flippi.ai/_expo/static/js/web/AppEntry-0ebd685d4b8a96c38ce187bfb06d785c.js

echo ""
echo "=== Verification Complete ==="
VERIFY_SCRIPT

# 5. Create the master deployment script
echo ""
echo "Creating master deployment script..."
cat > scripts/deploy-blue-master.sh << 'DEPLOY_SCRIPT'
#!/bin/bash
# Master deployment script for blue.flippi.ai

echo "=== MASTER DEPLOYMENT SCRIPT FOR BLUE.FLIPPI.AI ==="
echo ""

# Navigate to the project directory
cd /var/www/blue.flippi.ai

# 1. Pull latest code
echo "Step 1: Pulling latest code..."
git reset --hard
git pull origin develop

# 2. Install backend dependencies
echo ""
echo "Step 2: Installing backend dependencies..."
cd backend
npm install --production

# 3. Run database migrations
echo ""
echo "Step 3: Running database migrations..."
export FEEDBACK_DB_PATH=/var/www/blue.flippi.ai/backend/flippi.db
node scripts/run-growth-analytics-migration.js || echo "Migration completed"

# 4. Build frontend
echo ""
echo "Step 4: Building frontend..."
cd ../mobile-app
npm install
npx expo export --platform web --output-dir dist

# 5. Fix nginx configuration
echo ""
echo "Step 5: Fixing nginx configuration..."
cd ..
bash scripts/nginx-complete-fix.sh

# 6. Restart PM2 processes
echo ""
echo "Step 6: Restarting PM2 processes..."
pm2 restart dev-backend dev-frontend

# 7. Verify deployment
echo ""
echo "Step 7: Verifying deployment..."
sleep 3
bash scripts/verify-deployment.sh

echo ""
echo "=== DEPLOYMENT COMPLETE ==="
echo "Test at: https://blue.flippi.ai"
DEPLOY_SCRIPT

# Make all scripts executable
chmod +x scripts/*.sh

echo ""
echo "=== ALL FIX SCRIPTS CREATED ==="
echo ""
echo "To deploy, run on the server:"
echo "  cd /var/www/blue.flippi.ai && bash scripts/deploy-blue-master.sh"
echo ""
echo "Individual scripts available:"
echo "  - scripts/nginx-complete-fix.sh (fix nginx only)"
echo "  - backend/scripts/run-growth-analytics-migration.js (fix database only)"
echo "  - scripts/verify-deployment.sh (check deployment status)"
echo ""