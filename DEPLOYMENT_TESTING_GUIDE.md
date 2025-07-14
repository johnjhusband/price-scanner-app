# Deployment and Testing Guide

## VPS Requirements and Recommendations

### Minimum VPS Specifications
- **RAM**: 4GB minimum (8GB recommended)
- **CPU**: 2 vCPUs minimum
- **Storage**: 40GB SSD
- **OS**: Ubuntu 22.04 LTS
- **Network**: Dedicated IPv4

### Recommended VPS Providers
1. **DigitalOcean** ($24/mo for 4GB)
   - Simple interface
   - Good documentation
   - Easy scaling
   
2. **Linode** ($24/mo for 4GB)
   - Reliable performance
   - Good support
   - Multiple data centers

3. **Vultr** ($24/mo for 4GB)
   - High performance
   - Hourly billing option
   - Good for testing

4. **AWS EC2** (t3.medium ~$30/mo)
   - Enterprise features
   - Free tier available
   - Complex but powerful

## Server Setup Architecture

```
VPS Server
├── Nginx (Reverse Proxy)
│   ├── Backend API (port 3000)
│   ├── Mobile App Web Preview (port 19006)
│   └── Future Website (port 80/443)
├── Node.js Apps
│   ├── Backend API (PM2)
│   └── Expo Web Server
├── PostgreSQL Database
├── Redis Cache
└── Docker (optional)
```

## Mobile App Testing Solutions

### 1. Expo Web (Immediate Testing)
- Run mobile app in browser
- Good for basic functionality
- No native features (camera limited)
- Works on your VPS immediately

### 2. Expo Go + Tunneling
- Use ngrok or Cloudflare Tunnel
- Test on real devices remotely
- Access VPS backend from anywhere
- Best for development testing

### 3. Cloud-Based Testing Services
- **BrowserStack** ($29/mo)
  - Real device testing
  - iOS and Android
  - Automated testing support
  
- **AWS Device Farm**
  - Pay per minute
  - Real devices
  - CI/CD integration

- **Appetize.io** (Free tier available)
  - Browser-based emulators
  - Good for demos
  - Limited free minutes

### 4. Local Development + VPS Backend
- Run simulators locally
- Point to VPS backend
- Best performance
- Requires local setup

## Initial VPS Setup Script

```bash
#!/bin/bash
# Save as setup-vps.sh and run on fresh Ubuntu 22.04

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install essential packages
sudo apt install -y nginx postgresql postgresql-contrib redis-server git build-essential

# Install PM2 globally
sudo npm install -g pm2

# Install Docker (optional)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Create app directory
sudo mkdir -p /var/www/thrifting-buddy
sudo chown $USER:$USER /var/www/thrifting-buddy

# Setup PostgreSQL
sudo -u postgres psql << EOF
CREATE USER thriftingbuddy WITH PASSWORD 'your_secure_password';
CREATE DATABASE thrifting_buddy OWNER thriftingbuddy;
GRANT ALL PRIVILEGES ON DATABASE thrifting_buddy TO thriftingbuddy;
EOF

# Configure firewall
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3000
sudo ufw allow 19006
sudo ufw enable

# Create nginx sites
sudo tee /etc/nginx/sites-available/thrifting-buddy-api << EOF
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/thrifting-buddy-api /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

echo "VPS setup complete!"
```

## Deployment Process

### 1. Backend Deployment

```bash
# Clone repository
cd /var/www/thrifting-buddy
git clone https://github.com/yourusername/thrifting-buddy.git .

# Setup backend
cd backend
npm install --production
cp env.example .env
# Edit .env with production values

# Run migrations
npm run migrate

# Start with PM2
pm2 start server.js --name thrifting-buddy-api
pm2 save
pm2 startup
```

### 2. Mobile App Testing Setup

```bash
# For Expo web testing
cd /var/www/thrifting-buddy/mobile-app
npm install
npm install -g expo-cli

# Create PM2 config for Expo web
pm2 start npm --name thrifting-buddy-mobile -- run web
```

### 3. Environment Configuration

Create separate environment files:

```bash
# /var/www/thrifting-buddy/backend/.env.production
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://thriftingbuddy:password@localhost:5432/thrifting_buddy
JWT_ACCESS_SECRET=production_secret_min_32_chars
JWT_REFRESH_SECRET=production_refresh_secret_min_32_chars
# ... other production configs

# /var/www/thrifting-buddy/backend/.env.staging
NODE_ENV=staging
PORT=3001
DATABASE_URL=postgresql://thriftingbuddy:password@localhost:5432/thrifting_buddy_staging
# ... staging configs
```

## Testing Workflow

### 1. Local Development
```bash
# Your machine
- Develop features
- Run iOS/Android simulators
- Point to VPS backend API
```

### 2. Staging Testing
```bash
# VPS staging environment
- Deploy to staging branch
- Test with Expo web
- Use tunneling for device testing
- Run automated tests
```

### 3. Production Deployment
```bash
# VPS production
- Deploy tested code
- Monitor with PM2
- Check logs
- Verify health endpoints
```

## Monitoring and Maintenance

### PM2 Commands
```bash
pm2 status              # Check app status
pm2 logs               # View logs
pm2 monit              # Real-time monitoring
pm2 restart all        # Restart apps
```

### Database Backup
```bash
# Create backup script
#!/bin/bash
BACKUP_DIR="/var/backups/postgresql"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
pg_dump thrifting_buddy > $BACKUP_DIR/backup_$TIMESTAMP.sql
# Keep only last 7 days
find $BACKUP_DIR -type f -mtime +7 -delete
```

### SSL Certificate (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

## Cost Estimation

### Monthly Costs
- VPS (4GB): $24-30
- Domain: $1-2
- SSL: Free (Let's Encrypt)
- Backups: Included
- **Total**: ~$25-35/month

### Optional Services
- BrowserStack: $29/mo
- Sentry: $26/mo
- CloudFlare: Free tier
- AWS S3: ~$5/mo

## Testing Strategy

### 1. Immediate (Free)
- Deploy to VPS
- Use Expo Web for basic testing
- Test API with Postman/Insomnia
- Use free Appetize.io credits

### 2. Professional ($29/mo)
- Add BrowserStack
- Test on real devices
- Automated testing
- Cross-platform verification

### 3. Enterprise ($100+/mo)
- Multiple staging environments
- CI/CD pipeline
- Automated device testing
- Load testing services

## Next Steps

1. **Choose VPS Provider**
   - Start with DigitalOcean or Linode
   - 4GB droplet/instance
   - Ubuntu 22.04

2. **Initial Setup**
   - Run setup script
   - Deploy backend
   - Configure domains

3. **Testing Phase**
   - Start with Expo Web
   - Add device testing gradually
   - Monitor performance

4. **Production Ready**
   - SSL certificates
   - Backup automation
   - Monitoring alerts
   - CI/CD pipeline

This approach gives you a cost-effective way to test and deploy your app while maintaining flexibility for future growth.