#\!/bin/bash
# Emergency deployment script for production

echo "=== Emergency Production Deployment ==="
echo "Starting at: $(date)"

# SSH into production and fix
ssh -o StrictHostKeyChecking=no root@157.245.142.145 << 'ENDSSH'
cd /var/www/app.flippi.ai

echo "=== Current status ==="
pm2 status

echo "=== Git pull latest ==="
git pull origin master

echo "=== Backend setup ==="
cd backend
# Skip npm install to avoid postinstall
echo "Skipping npm install due to postinstall issue"

echo "=== Frontend build ==="
cd ../mobile-app
npm install
npx expo export --platform web --output-dir dist

echo "=== Starting PM2 services ==="
pm2 delete prod-backend prod-frontend || true
cd /var/www/app.flippi.ai/backend
pm2 start server.js --name prod-backend
cd /var/www/app.flippi.ai/mobile-app
pm2 start --name prod-frontend --interpreter none -- serve -s dist -l 3000

echo "=== Saving PM2 ==="
pm2 save
pm2 startup

echo "=== Fixing growth routes ==="
if [ -f /var/www/app.flippi.ai/scripts/fix-growth-routes.sh ]; then
  sudo bash /var/www/app.flippi.ai/scripts/fix-growth-routes.sh
fi

echo "=== Testing services ==="
sleep 5
curl -s http://localhost:3000/health || echo "Backend not responding"
pm2 logs --lines 10

echo "=== Emergency deployment complete ==="
ENDSSH
