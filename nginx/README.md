# Nginx Configuration for Flippi.ai

This directory contains nginx configuration templates and documentation for all Flippi.ai environments.

## Important: OAuth Configuration Required

All environments MUST include the `/auth` location block to enable Google OAuth authentication.

## Environment Configurations

### Development (blue.flippi.ai)
- Backend Port: 3002
- Frontend Port: 8082
- Config File: `/etc/nginx/sites-available/blue.flippi.ai`

### Staging (green.flippi.ai)
- Backend Port: 3001
- Frontend Port: 8081
- Config File: `/etc/nginx/sites-available/green.flippi.ai`

### Production (app.flippi.ai)
- Backend Port: 3000
- Frontend Port: 8080
- Config File: `/etc/nginx/sites-available/app.flippi.ai`

## Required Location Blocks

Every environment configuration MUST include these location blocks in this order:

1. `/api` - Backend API routes
2. `/auth` - OAuth routes (CRITICAL - without this, login won't work)
3. `/health` - Health check endpoint
4. `/terms` and `/privacy` - Legal pages
5. `/` - Frontend catch-all (must be last)

## OAuth Configuration

The `/auth` location block is REQUIRED for Google OAuth to work:

```nginx
# OAuth routes (REQUIRED FOR GOOGLE LOGIN)
location /auth {
    proxy_pass http://localhost:BACKEND_PORT;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Replace `BACKEND_PORT` with the appropriate port for each environment.

## Testing OAuth Configuration

After updating nginx configuration:

1. Test the configuration:
   ```bash
   sudo nginx -t
   ```

2. Reload nginx:
   ```bash
   sudo systemctl reload nginx
   ```

3. Verify OAuth endpoint:
   ```bash
   curl -I https://[domain]/auth/google
   ```
   Should return 302 (redirect), not 200 (HTML)

## Common Issues

### OAuth Not Working (Returns 200 instead of 302)
- **Cause**: Missing `/auth` location block in nginx config
- **Fix**: Add the OAuth location block and reload nginx

### 502 Bad Gateway on OAuth
- **Cause**: Backend not running or wrong port in proxy_pass
- **Fix**: Check PM2 status and verify correct backend port

## Deployment Best Practices

1. Always backup nginx config before changes
2. Test configuration before reloading
3. Verify OAuth works after deployment
4. Document any environment-specific changes