# Fix for Terms and Privacy Pages

The terms and privacy pages are showing the main app instead of the legal content because nginx's catch-all route is intercepting them.

## Quick Fix

SSH into the server and run these commands:

```bash
# 1. Edit the nginx config for blue.flippi.ai
sudo nano /etc/nginx/sites-available/blue.flippi.ai

# 2. Add these lines BEFORE the "location /" block:
    # Legal pages
    location = /privacy {
        alias /var/www/blue.flippi.ai/mobile-app/privacy.html;
    }

    location = /terms {
        alias /var/www/blue.flippi.ai/mobile-app/terms.html;
    }

# 3. Save and exit (Ctrl+X, Y, Enter)

# 4. Test the configuration
sudo nginx -t

# 5. Reload nginx
sudo nginx -s reload
```

## What Changed

- Added `=` for exact matching (higher priority than catch-all)
- Removed unnecessary `try_files` directive
- Must be placed BEFORE the catch-all `location /` block

## Test It

Visit these URLs:
- https://blue.flippi.ai/privacy
- https://blue.flippi.ai/terms

They should now show the actual privacy and terms pages instead of the main app.