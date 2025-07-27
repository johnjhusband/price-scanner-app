# Manual OAuth Fix for Staging (green.flippi.ai)

Since the GitHub Actions workflow cannot automatically update nginx configuration, here are the manual steps to enable OAuth on staging.

## Quick Fix (Copy & Paste)

1. SSH to the server:
```bash
ssh root@157.245.142.145
```

2. Run this command to add the OAuth configuration:
```bash
# Backup current config
sudo cp /etc/nginx/sites-available/green.flippi.ai /etc/nginx/sites-available/green.flippi.ai.backup-$(date +%Y%m%d-%H%M%S)

# Add OAuth location block
sudo sed -i '/location \/api {/,/}/a\
\
    # OAuth routes (REQUIRED FOR GOOGLE LOGIN)\
    location /auth {\
        proxy_pass http://localhost:3001;\
        proxy_http_version 1.1;\
        proxy_set_header Host $host;\
        proxy_set_header X-Real-IP $remote_addr;\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\
        proxy_set_header X-Forwarded-Proto $scheme;\
    }' /etc/nginx/sites-available/green.flippi.ai

# Test and reload
sudo nginx -t && sudo systemctl reload nginx
```

3. Verify it worked:
```bash
curl -I https://green.flippi.ai/auth/google
```

Should return `HTTP/1.1 302 Found` (not 200 OK).

## Alternative: Use the Fix Script

If the above sed command doesn't work, use the fix script:

```bash
cd /var/www/green.flippi.ai
sudo bash scripts/apply-staging-oauth-fix.sh
```

## Manual Edit Option

Or manually edit the nginx config:

```bash
sudo nano /etc/nginx/sites-available/green.flippi.ai
```

Add this block after the `/api` location block:

```nginx
    # OAuth routes (REQUIRED FOR GOOGLE LOGIN)
    location /auth {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
```

Then test and reload:
```bash
sudo nginx -t && sudo systemctl reload nginx
```

## Success Verification

Once applied, OAuth should work:
1. Visit https://green.flippi.ai
2. Click "Sign in with Google"
3. Should redirect to Google OAuth page

## Note

This is a one-time fix. Once applied, OAuth will continue to work on staging.