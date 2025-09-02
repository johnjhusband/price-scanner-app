#!/bin/bash

# Flippi.ai Server Setup Script for Blue/Dev Environment
# This script prepares a fresh Ubuntu server to host the development environment
# Run as root or with sudo

set -e  # Exit on any error

# Create installation tracking file
INSTALL_LOG="/var/log/flippi-blue-install-$(date +%Y%m%d-%H%M%S).log"
INSTALL_MANIFEST="/var/log/flippi-blue-install-manifest.txt"
echo "Installation started at $(date)" > "$INSTALL_LOG"
echo "# Flippi Blue Environment Installation Manifest" > "$INSTALL_MANIFEST"
echo "# Generated: $(date)" >> "$INSTALL_MANIFEST"
echo "" >> "$INSTALL_MANIFEST"

# Function to track installations
track_install() {
    echo "[$(date)] $1" >> "$INSTALL_LOG"
    echo "$1" >> "$INSTALL_MANIFEST"
}

echo "========================================="
echo "Flippi.ai Server Setup - Blue Environment"
echo "========================================="
echo "Tracking installation in: $INSTALL_MANIFEST"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run as root or with sudo"
    exit 1
fi

# Update system packages
print_status "Updating system packages..."
apt update && apt upgrade -y

# Install essential packages
print_status "Installing essential packages..."
track_install "PACKAGES: Starting essential package installation"
apt install -y \
    curl \
    wget \
    git \
    build-essential \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    htop \
    nginx \
    certbot \
    python3-certbot-nginx \
    ufw \
    nano \
    vim \
    dos2unix
track_install "PACKAGES: curl wget git build-essential software-properties-common apt-transport-https ca-certificates gnupg lsb-release htop nginx certbot python3-certbot-nginx ufw nano vim dos2unix"

# Install Node.js 18.x
print_status "Installing Node.js 18.x..."
track_install "REPOSITORY: Adding NodeSource repository"
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
track_install "PACKAGES: nodejs"
apt install -y nodejs

# Verify Node.js installation
node_version=$(node -v)
npm_version=$(npm -v)
print_status "Node.js installed: $node_version"
print_status "npm installed: $npm_version"

# Install PM2 globally
print_status "Installing PM2..."
track_install "NPM_GLOBAL: pm2"
npm install -g pm2

# Install Expo CLI globally
print_status "Installing Expo CLI..."
npm install -g expo-cli

# Install serve for static file serving
print_status "Installing serve..."
npm install -g serve

# Install Python and pip for FotoFlip feature
print_status "Installing Python dependencies..."
track_install "PACKAGES: python3 python3-pip python3-venv"
apt install -y python3 python3-pip python3-venv

# Install Python packages for FotoFlip (with specific numpy version)
print_status "Installing Python packages for FotoFlip..."
# Ubuntu 24.04+ requires --break-system-packages or use of venv
track_install "PIP_PACKAGES: numpy==1.26.4 rembg onnxruntime"
pip3 install --break-system-packages numpy==1.26.4 rembg onnxruntime

# Create directory structure
print_status "Creating directory structure..."
# Infrastructure directories
track_install "DIRECTORY: /opt/flippi/shared/scripts"
mkdir -p /opt/flippi/shared/scripts
track_install "DIRECTORY: /opt/flippi/shared/templates"
mkdir -p /opt/flippi/shared/templates
track_install "DIRECTORY: /opt/flippi/blue/config"
mkdir -p /opt/flippi/blue/config
track_install "DIRECTORY: /opt/flippi/blue/logs"
mkdir -p /opt/flippi/blue/logs

# Application directory will be created by git clone
# DO NOT create it here - causes ownership issues
track_install "DIRECTORY: /var/www/blue.flippi.ai (to be created by git clone)"

# Shared environment directory
track_install "DIRECTORY: /var/www/shared"
mkdir -p /var/www/shared
chown -R www-data:www-data /var/www/shared

# Other system directories
mkdir -p /var/lib/flippi-dev
mkdir -p /backup

# Create shared .env file location
print_status "Creating shared environment file..."
touch /var/www/shared/.env
chmod 600 /var/www/shared/.env

# Set up firewall
print_status "Configuring firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
ufw --force enable

# Configure Nginx
print_status "Configuring Nginx..."
# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Create Nginx configuration for blue.flippi.ai
track_install "CONFIG_FILE: /etc/nginx/sites-available/blue.flippi.ai"
cat > /etc/nginx/sites-available/blue.flippi.ai << 'EOF'
server {
    server_name blue.flippi.ai;
    
    root /var/www/blue.flippi.ai/mobile-app/dist;
    index index.html;
    
    # Client body size for image uploads
    client_max_body_size 10M;
    
    # Backend API routes (MUST BE FIRST)
    location ^~ /api {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    location ^~ /auth {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location ^~ /health {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
    
    location ^~ /growth {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Static assets (SECOND)
    location ~* \.(css|js|mjs|map|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
    
    # Frontend routes (SPA fallback - LAST)
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Legal pages
    location = /terms { alias /var/www/blue.flippi.ai/legal/terms.html; }
    location = /privacy { alias /var/www/blue.flippi.ai/legal/privacy.html; }
    location = /contact { alias /var/www/blue.flippi.ai/legal/contact.html; }
    location = /mission { alias /var/www/blue.flippi.ai/legal/mission.html; }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    listen 80;
}
EOF

# Enable the site
track_install "SYMLINK: /etc/nginx/sites-enabled/blue.flippi.ai"
ln -sf /etc/nginx/sites-available/blue.flippi.ai /etc/nginx/sites-enabled/

# Test Nginx configuration
nginx -t

# Restart Nginx
systemctl restart nginx
systemctl enable nginx

# Set up PM2 startup
print_status "Setting up PM2 startup..."
pm2 startup systemd -u root --hp /root
pm2 save

# Create deployment user (optional - for better security)
print_status "Creating deployment user..."
if ! id -u deploy >/dev/null 2>&1; then
    useradd -m -s /bin/bash deploy
    usermod -aG sudo deploy
    print_warning "Remember to set password for deploy user: passwd deploy"
fi

# Set proper permissions
print_status "Setting permissions..."
chown -R www-data:www-data /var/www/blue.flippi.ai
chown -R www-data:www-data /var/www/shared
chmod -R 755 /var/www/blue.flippi.ai
chmod -R 755 /var/www/shared

# Create PM2 ecosystem config template
print_status "Creating PM2 ecosystem config template..."
track_install "CONFIG_FILE: /opt/flippi/blue/config/ecosystem.config.js"
cat > /opt/flippi/blue/config/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'dev-backend',
      script: './backend/server.js',
      cwd: '/var/www/blue.flippi.ai',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'development',
        PORT: 3002,
        ENABLE_LUXE_PHOTO: 'true',
        FOTOFLIP_BG_COLOR: '#FAF6F1',
        FOTOFLIP_MODE: 'beautify'
      },
      error_file: '/opt/flippi/blue/logs/dev-backend-error.log',
      out_file: '/opt/flippi/blue/logs/dev-backend-out.log',
      log_file: '/opt/flippi/blue/logs/dev-backend-combined.log',
      time: true
    },
    {
      name: 'dev-frontend',
      script: 'serve',
      args: '-s dist -l 8082',
      cwd: '/var/www/blue.flippi.ai/mobile-app',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'development'
      },
      error_file: '/opt/flippi/blue/logs/dev-frontend-error.log',
      out_file: '/opt/flippi/blue/logs/dev-frontend-out.log',
      log_file: '/opt/flippi/blue/logs/dev-frontend-combined.log',
      time: true
    }
  ]
};
EOF

# Ensure log directory has correct permissions
chown -R www-data:www-data /opt/flippi/blue/logs

# Install PM2 log rotation
print_status "Setting up PM2 log rotation..."
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true

# Create shared deployment helper script
print_status "Creating shared deployment helper script..."
track_install "SCRIPT: /opt/flippi/shared/scripts/deploy-helper.sh"
cat > /opt/flippi/shared/scripts/deploy-helper.sh << 'EOF'
#!/bin/bash
# Shared deployment helper script
# Usage: deploy-helper.sh [environment]

ENV=$1
if [ -z "$ENV" ]; then
    echo "Usage: $0 [blue|green|production]"
    exit 1
fi

case "$ENV" in
    blue)
        APP_DIR="/var/www/blue.flippi.ai"
        BRANCH="develop"
        PM2_CONFIG="/opt/flippi/blue/config/ecosystem.config.js"
        ;;
    green)
        APP_DIR="/var/www/green.flippi.ai"
        BRANCH="staging"
        PM2_CONFIG="/opt/flippi/green/config/ecosystem.config.js"
        ;;
    production)
        APP_DIR="/var/www/app.flippi.ai"
        BRANCH="master"
        PM2_CONFIG="/opt/flippi/production/config/ecosystem.config.js"
        ;;
    *)
        echo "Invalid environment: $ENV"
        exit 1
        ;;
esac

cd $APP_DIR

echo "Deploying $ENV environment from $BRANCH branch..."
echo "Pulling latest changes..."
git fetch origin $BRANCH
git reset --hard origin/$BRANCH

echo "Installing backend dependencies..."
cd backend
npm install --production

echo "Installing frontend dependencies..."
cd ../mobile-app
npm install

echo "Building frontend..."
npx expo export --platform web --output-dir dist

echo "Restarting PM2 processes..."
cd ..
pm2 restart $PM2_CONFIG
pm2 save

echo "Deployment complete!"
pm2 status
EOF

chmod +x /opt/flippi/shared/scripts/deploy-helper.sh

# Create deployment script for blue environment
print_status "Creating deployment script for blue environment..."
track_install "SCRIPT: /usr/local/bin/deploy-blue"
cat > /usr/local/bin/deploy-blue << 'EOF'
#!/bin/bash
# Wrapper script for blue environment deployment
/opt/flippi/shared/scripts/deploy-helper.sh blue
EOF

chmod +x /usr/local/bin/deploy-blue

# Create SSL helper scripts
print_status "Creating SSL setup scripts..."
track_install "SCRIPT: /usr/local/bin/setup-ssl-blue"
cat > /usr/local/bin/setup-ssl-blue << 'EOF'
#!/bin/bash
# Setup SSL for blue.flippi.ai

certbot --nginx -d blue.flippi.ai --non-interactive --agree-tos --email admin@flippi.ai --redirect
EOF

chmod +x /usr/local/bin/setup-ssl-blue

# Create fix-nginx-ssl script in shared scripts
track_install "SCRIPT: /opt/flippi/shared/scripts/fix-nginx-ssl.sh"
cat > /opt/flippi/shared/scripts/fix-nginx-ssl.sh << 'EOF'
#!/bin/bash
# Fix missing SSL configuration files

mkdir -p /etc/letsencrypt

# Create options-ssl-nginx.conf if missing
if [ ! -f /etc/letsencrypt/options-ssl-nginx.conf ]; then
    cat > /etc/letsencrypt/options-ssl-nginx.conf << 'SSL_OPTIONS'
ssl_session_cache shared:le_nginx_SSL:10m;
ssl_session_timeout 1440m;
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers off;
ssl_ciphers "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384";
SSL_OPTIONS
fi

# Create ssl-dhparams.pem if missing
if [ ! -f /etc/letsencrypt/ssl-dhparams.pem ]; then
    openssl dhparam -out /etc/letsencrypt/ssl-dhparams.pem 2048
fi

nginx -t && nginx -s reload
echo "SSL configuration files created successfully"
EOF

chmod +x /opt/flippi/shared/scripts/fix-nginx-ssl.sh

# Create system monitoring script
print_status "Creating monitoring script..."
cat > /usr/local/bin/check-flippi << 'EOF'
#!/bin/bash
# Quick health check for Flippi services

echo "=== Flippi Blue Environment Status ==="
echo ""
echo "PM2 Processes:"
pm2 status

echo ""
echo "Port Usage:"
netstat -tlnp | grep -E ':(3002|8082)'

echo ""
echo "Nginx Status:"
systemctl status nginx --no-pager | head -n 5

echo ""
echo "Disk Usage:"
df -h | grep -E '^/|Filesystem'

echo ""
echo "Memory Usage:"
free -h

echo ""
echo "Backend Health:"
curl -s http://localhost:3002/health | jq '.' 2>/dev/null || echo "Backend not responding"

echo ""
echo "Recent Errors:"
pm2 logs dev-backend --err --lines 5 --nostream
EOF

chmod +x /usr/local/bin/check-flippi

# Final tracking and summary
track_install "INSTALLATION: Complete at $(date)"
echo "" >> "$INSTALL_MANIFEST"
echo "# Summary of tracked items:" >> "$INSTALL_MANIFEST"
echo "# - Packages installed via apt" >> "$INSTALL_MANIFEST"
echo "# - NPM global packages" >> "$INSTALL_MANIFEST"
echo "# - Python packages via pip3" >> "$INSTALL_MANIFEST"
echo "# - Directories created" >> "$INSTALL_MANIFEST"
echo "# - Scripts installed" >> "$INSTALL_MANIFEST"
echo "# - Configuration files" >> "$INSTALL_MANIFEST"
echo "" >> "$INSTALL_MANIFEST"
echo "# Use uninstall-server-blue.sh to remove everything" >> "$INSTALL_MANIFEST"

# Final instructions
print_status "Server setup complete!"
print_warning "Installation tracked in: $INSTALL_MANIFEST"
echo ""
echo "========================================="
echo "Next Steps:"
echo "========================================="
echo "1. Add your SSH key to the server for the deploy user"
echo "2. Clone the repository:"
echo "   cd /var/www/blue.flippi.ai"
echo "   git clone https://github.com/johnjhusband/price-scanner-app-coding.git ."
echo "   git checkout develop"
echo ""
echo "3. Configure environment variables:"
echo "   nano /var/www/shared/.env"
echo "   Add: OPENAI_API_KEY=your-key-here"
echo "   Add: SESSION_SECRET=your-secret-here"
echo "   Add: GOOGLE_CLIENT_ID=your-client-id"
echo "   Add: GOOGLE_CLIENT_SECRET=your-client-secret"
echo ""
echo "4. Run initial deployment:"
echo "   deploy-blue"
echo ""
echo "5. Setup SSL certificate:"
echo "   setup-ssl-blue"
echo ""
echo "6. Start PM2 processes:"
echo "   pm2 start /opt/flippi/blue/config/ecosystem.config.js"
echo "   pm2 save"
echo ""
echo "7. Check status:"
echo "   check-flippi"
echo ""
echo "========================================="
print_warning "Remember to update DNS to point blue.flippi.ai to this server's IP!"
echo "========================================="