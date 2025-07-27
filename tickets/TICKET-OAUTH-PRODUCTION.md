# 🎯 Deploy OAuth to Production Environment

## 📋 Objective
Enable Google OAuth authentication on the production environment (app.flippi.ai) by updating the nginx configuration to properly proxy OAuth routes to the backend.

## 🔍 Background
- OAuth is fully implemented and working on blue.flippi.ai (development)
- The staging environment (green.flippi.ai) needs the same nginx fix
- Production will require the identical nginx configuration update

## ✅ Prerequisites
- [ ] OAuth working and tested on staging (green.flippi.ai)
- [ ] Google OAuth credentials configured for production domain
- [ ] All OAuth-related code merged to master branch

## 📝 Implementation Steps

### 1. Update Nginx Configuration
Add the OAuth location block to the production nginx config file:

```nginx
# Add this block to /etc/nginx/sites-available/app.flippi.ai
# Place it after the /api location block

# OAuth routes (REQUIRED FOR GOOGLE LOGIN)
location /auth {
    proxy_pass http://localhost:3000;  # Production backend port
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### 2. Apply Configuration
```bash
# Test nginx configuration
sudo nginx -t

# If test passes, reload nginx
sudo systemctl reload nginx
```

### 3. Verify OAuth is Working
```bash
# Should return 302 redirect (not 200)
curl -I https://app.flippi.ai/auth/google
```

### 4. Test Full OAuth Flow
1. Visit https://app.flippi.ai
2. Click "Sign in with Google"
3. Verify redirect to Google OAuth
4. Complete login
5. Verify redirect back to app with authentication

## ⚠️ Important Notes
- This is a one-time configuration change
- The `/auth` proxy must point to port 3000 (production backend port)
- Ensure SSL certificates are valid for proper OAuth redirects
- No code changes required - only nginx configuration

## 🚀 Rollback Plan
If issues occur:
```bash
# Restore backup configuration
sudo cp /etc/nginx/sites-available/app.flippi.ai.backup /etc/nginx/sites-available/app.flippi.ai
sudo nginx -t && sudo systemctl reload nginx
```

## 📊 Success Criteria
- [ ] OAuth endpoint returns 302 redirect status
- [ ] Users can successfully log in with Google
- [ ] No errors in backend logs related to OAuth
- [ ] Authentication persists across page refreshes

## 🔗 Related Documentation
- [Deployment Guide](../docs/DEPLOYMENT.md)
- [API Documentation](../docs/API_DOCUMENTATION.md)
- OAuth configuration in backend `.env` file

## 👥 Stakeholders
- **Assignee**: DevOps/Backend Team
- **Priority**: High (required for Tuesday launch)
- **Estimated Time**: 15 minutes

---

**Note**: This ticket assumes the OAuth implementation is already tested and working in development and staging environments. Only the nginx configuration needs to be updated for production.