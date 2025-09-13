# SSL & Nginx Issues

## 🚨 Critical: Legal Pages SSL Issue (Frequent Problem)

### Symptom
- `/terms`, `/privacy`, `/mission`, `/contact` show "Loading flippi.ai..." or React app
- Legal HTML pages don't load correctly
- Static pages return React app instead

### Root Cause
Missing SSL files prevent nginx from loading site configuration:
- `/etc/letsencrypt/options-ssl-nginx.conf`
- `/etc/letsencrypt/ssl-dhparams.pem`

Without these files, nginx silently falls back to default behavior, serving the React app for all routes.

## 🔍 How to Diagnose

### 1. Test Nginx Configuration
```bash
sudo nginx -t
```

Look for errors like:
```
nginx: [emerg] cannot load certificate "/etc/letsencrypt/options-ssl-nginx.conf": 
BIO_new_file() failed (SSL: error:02001002:system library:fopen:No such file or directory)
```

### 2. Check Legal Routes
```bash
nginx -T | grep "location = /terms"
```

If empty, the config isn't loaded properly.

### 3. Test Legal Pages
```bash
curl https://blue.flippi.ai/terms
```

If you see React app HTML instead of legal content, the issue is confirmed.

## 🔧 Quick Fix

### Automatic Fix Script
```bash
cd /var/www/blue.flippi.ai && bash scripts/fix-nginx-ssl-comprehensive.sh
```

This script is included in all deployment workflows and:
1. Creates missing SSL files
2. Validates nginx config
3. Reloads nginx
4. Tests legal pages

### Manual Fix Steps

#### 1. Create Missing SSL Files
```bash
# Create options-ssl-nginx.conf
sudo tee /etc/letsencrypt/options-ssl-nginx.conf > /dev/null <<'EOF'
ssl_session_cache shared:le_nginx_SSL:10m;
ssl_session_timeout 1440m;
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers off;
ssl_ciphers "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256";
EOF

# Create ssl-dhparams.pem
sudo openssl dhparam -out /etc/letsencrypt/ssl-dhparams.pem 2048
```

#### 2. Test and Reload
```bash
sudo nginx -t
sudo systemctl reload nginx
```

#### 3. Verify Fix
```bash
curl https://blue.flippi.ai/terms | grep -i "terms of service"
```

## 🔄 Why This Keeps Happening

1. **Let's Encrypt Issue**: Creates SSL certs but not always the options/dhparams files
2. **Silent Failure**: Nginx doesn't error loudly, just uses default config
3. **Looks Normal**: Site appears to work (React loads) but specific routes fail

## 🛡️ Prevention

### 1. Add to Deployment
The fix script already runs automatically in deployment:
```yaml
- name: Fix nginx SSL and legal pages
  run: |
    cd /var/www/${{ env.DOMAIN }}
    bash scripts/fix-nginx-ssl-comprehensive.sh
```

### 2. Post-Deploy Check
Always verify legal pages after deployment:
```bash
for page in terms privacy mission contact; do
  echo "Testing /$page..."
  curl -s https://blue.flippi.ai/$page | grep -q "flippi.ai" || echo "FAILED: $page"
done
```

## 📋 Related Issues

### Other Nginx Problems

#### 502 Bad Gateway
- **Cause**: Backend not running
- **Fix**: Check PM2: `pm2 status`

#### 404 on API Routes
- **Cause**: Nginx not proxying to backend
- **Fix**: Check proxy_pass configuration

#### Slow Response Times
- **Cause**: No gzip compression
- **Fix**: Enable gzip in nginx config

### SSL Certificate Issues

#### Certificate Expired
```bash
sudo certbot renew --dry-run  # Test
sudo certbot renew            # Actually renew
```

#### Wrong Domain
Check certificate details:
```bash
echo | openssl s_client -servername blue.flippi.ai -connect blue.flippi.ai:443 2>/dev/null | openssl x509 -noout -subject
```

## 🚀 Complete Nginx Fix Checklist

When legal pages don't work:

1. [ ] Run the comprehensive fix script
2. [ ] Test nginx configuration
3. [ ] Reload nginx service
4. [ ] Test each legal page
5. [ ] Check other routes still work
6. [ ] Monitor error logs

## 📝 Fix Scripts

### Comprehensive Fix
Located at: `scripts/fix-nginx-ssl-comprehensive.sh`

### Quick Test
```bash
# Test all legal pages
for env in blue green app; do
  echo "=== Testing $env.flippi.ai ==="
  for page in terms privacy mission contact; do
    curl -s https://$env.flippi.ai/$page | grep -q "</html>" && echo "✓ $page" || echo "✗ $page"
  done
done
```

## 🆘 If Nothing Works

1. Check full nginx error log:
   ```bash
   sudo tail -50 /var/log/nginx/error.log
   ```

2. Verify SSL certificate is valid:
   ```bash
   sudo certbot certificates
   ```

3. Check if legal HTML files exist:
   ```bash
   ls -la /var/www/blue.flippi.ai/mobile-app/dist/*.html
   ```

4. Contact admin with error details

## 📧 Support

For nginx/SSL issues: teamflippi@gmail.com

[[Home]] | [[Troubleshooting]] | [[Common-Issues]]