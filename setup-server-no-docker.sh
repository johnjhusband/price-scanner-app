#!/bin/bash

# Server setup script - Migrates from Docker to simple PM2+Nginx setup
# Run this on your server as root

set -e

echo "🚀 Setting up simple deployment (no Docker)"
echo "This will set up 3 environments on one server"
echo ""

# Check if running as root
if [[ $EUID -ne 0 ]]; then 
   echo "This script must be run as root" 
   exit 1
fi

# Step 1: Install required software
echo "1️⃣ Installing Node.js, PM2, and build tools..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get update
apt-get install -y nodejs git nginx certbot python3-certbot-nginx build-essential

# Install PM2 globally
npm install -g pm2

# Step 2: Create directory structure
echo "2️⃣ Creating directory structure..."
mkdir -p /var/www/{app.flippi.ai,blue.flippi.ai,green.flippi.ai}

# Step 3: Clone repository for each environment
echo "3️⃣ Cloning repository for each environment..."

# Production
if [ ! -d "/var/www/app.flippi.ai/.git" ]; then
    git clone https://github.com/johnjhusband/price-scanner-app.git /var/www/app.flippi.ai
    cd /var/www/app.flippi.ai
    git checkout master
else
    echo "Production already cloned, pulling latest..."
    cd /var/www/app.flippi.ai
    git pull origin master
fi

# Staging (Green)
if [ ! -d "/var/www/green.flippi.ai/.git" ]; then
    git clone https://github.com/johnjhusband/price-scanner-app.git /var/www/green.flippi.ai
    cd /var/www/green.flippi.ai
    git checkout staging
else
    echo "Staging already cloned, pulling latest..."
    cd /var/www/green.flippi.ai
    git pull origin staging
fi

# Development (Blue)
if [ ! -d "/var/www/blue.flippi.ai/.git" ]; then
    git clone https://github.com/johnjhusband/price-scanner-app.git /var/www/blue.flippi.ai
    cd /var/www/blue.flippi.ai
    git checkout develop
else
    echo "Development already cloned, pulling latest..."
    cd /var/www/blue.flippi.ai
    git pull origin develop
fi

# Step 4: Set up environment files
echo "4️⃣ Setting up environment files..."
echo "Please make sure to create .env files in each backend directory with your OPENAI_API_KEY"

# Create .env template if it doesn't exist
for env in app.flippi.ai blue.flippi.ai green.flippi.ai; do
    if [ ! -f "/var/www/$env/backend/.env" ]; then
        cat > /var/www/$env/backend/.env << EOF
# Add your OpenAI API key here
OPENAI_API_KEY=your_key_here
NODE_ENV=production
PORT=3000  # Will be different for each environment
EOF
        echo "Created .env template at /var/www/$env/backend/.env"
    fi
done

# Step 5: Install dependencies
echo "5️⃣ Installing dependencies for each environment..."

# Production
echo "Installing production dependencies..."
cd /var/www/app.flippi.ai/backend && npm install --production
cd /var/www/app.flippi.ai/mobile-app && npm install && npx expo install react-native-web react-dom @expo/metro-runtime

# Staging
echo "Installing staging dependencies..."
cd /var/www/green.flippi.ai/backend && npm install --production
cd /var/www/green.flippi.ai/mobile-app && npm install && npx expo install react-native-web react-dom @expo/metro-runtime

# Development
echo "Installing development dependencies..."
cd /var/www/blue.flippi.ai/backend && npm install --production
cd /var/www/blue.flippi.ai/mobile-app && npm install && npx expo install react-native-web react-dom @expo/metro-runtime

# Step 6: Build frontend for each environment
echo "6️⃣ Building frontend apps..."

# Production
cd /var/www/app.flippi.ai/mobile-app
EXPO_PUBLIC_API_URL="" npx expo build:web

# Staging
cd /var/www/green.flippi.ai/mobile-app
EXPO_PUBLIC_API_URL="" npx expo build:web

# Development
cd /var/www/blue.flippi.ai/mobile-app
EXPO_PUBLIC_API_URL="" npx expo build:web

# Step 7: Create PM2 ecosystem file
echo "7️⃣ Creating PM2 configuration..."
cat > /var/www/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    // Production
    {
      name: 'prod-backend',
      script: '/var/www/app.flippi.ai/backend/server.js',
      cwd: '/var/www/app.flippi.ai/backend',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/pm2/prod-backend-error.log',
      out_file: '/var/log/pm2/prod-backend-out.log'
    },
    {
      name: 'prod-frontend',
      script: 'npx',
      args: 'serve -s web-build -p 8080',
      cwd: '/var/www/app.flippi.ai/mobile-app',
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/var/log/pm2/prod-frontend-error.log',
      out_file: '/var/log/pm2/prod-frontend-out.log'
    },
    
    // Staging (Green)
    {
      name: 'staging-backend',
      script: '/var/www/green.flippi.ai/backend/server.js',
      cwd: '/var/www/green.flippi.ai/backend',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/var/log/pm2/staging-backend-error.log',
      out_file: '/var/log/pm2/staging-backend-out.log'
    },
    {
      name: 'staging-frontend',
      script: 'npx',
      args: 'serve -s web-build -p 8081',
      cwd: '/var/www/green.flippi.ai/mobile-app',
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/var/log/pm2/staging-frontend-error.log',
      out_file: '/var/log/pm2/staging-frontend-out.log'
    },
    
    // Development (Blue)
    {
      name: 'dev-backend',
      script: '/var/www/blue.flippi.ai/backend/server.js',
      cwd: '/var/www/blue.flippi.ai/backend',
      env: {
        NODE_ENV: 'development',
        PORT: 3002
      },
      error_file: '/var/log/pm2/dev-backend-error.log',
      out_file: '/var/log/pm2/dev-backend-out.log'
    },
    {
      name: 'dev-frontend',
      script: 'npx',
      args: 'serve -s web-build -p 8082',
      cwd: '/var/www/blue.flippi.ai/mobile-app',
      env: {
        NODE_ENV: 'development'
      },
      error_file: '/var/log/pm2/dev-frontend-error.log',
      out_file: '/var/log/pm2/dev-frontend-out.log'
    }
  ]
};
EOF

# Step 8: Install serve globally for frontend
echo "8️⃣ Installing serve for frontend hosting..."
npm install -g serve

# Step 9: Stop Docker containers if running
echo "9️⃣ Stopping Docker containers (if any)..."
if command -v docker &> /dev/null; then
    docker-compose down 2>/dev/null || true
    docker stop $(docker ps -q) 2>/dev/null || true
fi

# Step 10: Start all apps with PM2
echo "🔟 Starting all applications with PM2..."
cd /var/www
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Show status
pm2 status

echo ""
echo "✅ Setup complete!"
echo ""
echo "📍 Applications running on:"
echo "  - Production Backend: localhost:3000"
echo "  - Production Frontend: localhost:8080"
echo "  - Staging Backend: localhost:3001"
echo "  - Staging Frontend: localhost:8081"
echo "  - Dev Backend: localhost:3002"
echo "  - Dev Frontend: localhost:8082"
echo ""
echo "⚠️  IMPORTANT NEXT STEPS:"
echo "1. Update .env files with your OPENAI_API_KEY"
echo "2. Run: ./setup-nginx-no-docker.sh to configure nginx"
echo "3. Set up SSL certificates"
echo ""
echo "To view logs: pm2 logs"
echo "To restart an app: pm2 restart app-name"