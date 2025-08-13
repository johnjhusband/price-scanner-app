# Manual Production Deployment Fix

The production deployment failed due to git conflicts. To fix this, run these commands on the server:

## SSH into production server
```bash
ssh root@157.245.142.145
```

## Fix git conflicts
```bash
cd /var/www/app.flippi.ai
git fetch origin
git reset --hard origin/master
git clean -fd
```

## Verify correct commit (should show d09ed49)
```bash
git log --oneline -1
```

## Rebuild application
```bash
cd backend && npm install --production
cd ../mobile-app && npm install && npx expo export --platform web --output-dir dist
```

## Fix nginx duplicate location issue
```bash
# Remove duplicate /privacy location
sed -i '0,/location = \/privacy/{//!d;}' /etc/nginx/sites-available/app.flippi.ai
nginx -t
```

## Restart services
```bash
pm2 restart prod-backend prod-frontend
nginx -s reload
```

## Verify deployment
```bash
curl http://localhost:3000/health
pm2 status
```

Exit SSH and test from local:
```bash
curl https://app.flippi.ai/health
```

The app should now have:
- Environmental tagging
- Authenticity scoring
- Mission modal
- All release-001 features