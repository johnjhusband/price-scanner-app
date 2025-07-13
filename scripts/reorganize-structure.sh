#!/bin/bash

echo "=== Reorganizing to prod/blue/green structure ==="

# Create new directory structure
echo "1. Creating directories..."
mkdir -p prod/backend prod/mobile-app prod/deployment
mkdir -p blue/backend blue/mobile-app blue/deployment  
mkdir -p green/backend green/mobile-app green/deployment
mkdir -p scripts
mkdir -p shared
mkdir -p docs

# Move production files
echo "2. Moving production files..."
cp backend/server.js prod/backend/
cp backend/package*.json prod/backend/
cp backend/.env.example prod/backend/
cp backend/Dockerfile.backend prod/backend/Dockerfile

cp mobile-app/App.js prod/mobile-app/
cp mobile-app/package*.json prod/mobile-app/
cp mobile-app/app.json prod/mobile-app/
cp mobile-app/babel.config.js prod/mobile-app/
cp mobile-app/.gitignore prod/mobile-app/
cp mobile-app/Dockerfile.frontend-node prod/mobile-app/Dockerfile

cp deployment/docker-compose-nginx.yml prod/deployment/docker-compose.yml
cp deployment/nginx/nginx.conf prod/deployment/nginx.conf

# Move blue files
echo "3. Moving blue files..."
cp backend/server-enhanced.js blue/backend/server.js
cp backend/package*.json blue/backend/
cp backend/.env.example blue/backend/
cp backend/Dockerfile.backend-blue blue/backend/Dockerfile

cp mobile-app/App-enhanced.js blue/mobile-app/App.js
cp mobile-app/package*.json blue/mobile-app/
cp mobile-app/app.json blue/mobile-app/
cp mobile-app/babel.config.js blue/mobile-app/
cp mobile-app/.gitignore blue/mobile-app/
cp mobile-app/Dockerfile.frontend-blue blue/mobile-app/Dockerfile

cp deployment/docker-compose-nginx-blue.yml blue/deployment/docker-compose.yml
cp deployment/nginx/nginx-blue.conf blue/deployment/nginx.conf

# Copy prod to green as starting point
echo "4. Creating green from prod..."
cp -r prod/* green/

# Move scripts
echo "5. Moving scripts..."
cp deployment/deploy-backend.sh scripts/deploy-prod-backend.sh
cp deployment/deploy-frontend.sh scripts/deploy-prod-frontend.sh
cp deployment/deploy-blue.sh scripts/deploy-blue.sh
cp deployment/verify-deployment.sh scripts/
cp deployment/force-restart.sh scripts/
cp deployment/init-letsencrypt.sh scripts/init-ssl.sh

# Move docs
echo "6. Moving documentation..."
cp README.md docs/ARCHITECTURE.md
cp PRODUCT_ROADMAP.md docs/
cp price-scanner-tech-spec.md docs/ORIGINAL_SPEC.md

# Create basic README files
echo "7. Creating README files..."
echo "# Production Backend v0.1.0" > prod/backend/README.md
echo "# Production Frontend v0.1.0" > prod/mobile-app/README.md
echo "# Production Deployment" > prod/deployment/DEPLOYMENT.md

echo "# Blue Backend - Enhanced Features" > blue/backend/README.md
echo "# Blue Frontend - Enhanced UI" > blue/mobile-app/README.md
echo "# Blue Deployment" > blue/deployment/DEPLOYMENT.md

echo "# Green Backend v0.1.0" > green/backend/README.md
echo "# Green Frontend v0.1.0" > green/mobile-app/README.md
echo "# Green Deployment" > green/deployment/DEPLOYMENT.md

echo "# Deployment Scripts" > scripts/README.md

# Create .gitignore
echo "8. Creating .gitignore..."
cat > .gitignore << 'EOF'
# Environment files
.env
*.env
shared/.env

# Temporary files
*.tar.gz
*.bak
*.tmp

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Dependencies
node_modules/
EOF

# Clean up old files
echo "9. Cleaning up old files..."
rm -f get-docker.sh
rm -f thrifting-images-v0.1.1.tar.gz
rm -f backend/server-blue.js
rm -f backend/server-enhanced.js
rm -f mobile-app/App-blue.js
rm -f mobile-app/App-enhanced.js
rm -f mobile-app/AppWithCamera.js
rm -f deployment/docker-compose.yml
rm -f deployment/docker-compose.yml.bak
rm -f deployment/docker-compose-https.yml
rm -f deployment/docker-compose-letsencrypt.yml
rm -f deployment/deploy-blue-safe.sh
rm -f deployment/deploy-letsencrypt.sh
rm -f deployment/init-blue.sh
rm -f deployment/init-green.sh
rm -f deployment/fix-*.sh
rm -f deployment/unfuck-production.sh
rm -f deployment/*.tar.gz
rm -f deployment/nginx/nginx-*init.conf
rm -f deployment/generate-self-signed-cert.sh
rm -f check-server-deps.sh
rm -f commit-current-state.sh
rm -f deploy-*.sh
rm -f verify-deployment.sh
rm -f force-restart.sh

# Move scripts that were in root
mv reorganize-structure.sh scripts/

echo "=== Reorganization complete ==="
echo "New structure:"
echo "- prod/ - Current production code"
echo "- blue/ - Enhanced development code"
echo "- green/ - Copy of prod for next cycle"
echo "- scripts/ - All deployment scripts"
echo "- docs/ - Architecture and standards only"
echo "- shared/ - For .env file (not in git)"