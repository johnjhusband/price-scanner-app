# 🧾 User Story: Fix Google OAuth Login on Staging

**Title**: Enable Google OAuth Login on Staging Environment (matching dev & blue.flippi.ai)

**As a** user,  
**I want** to be able to log in with Google on the staging environment  
**So that** the login flow works the same way as in development and on blue.flippi.ai

## ✅ Acceptance Criteria

### Nginx Configuration:
- [ ] The staging server's Nginx must forward `/auth/*` routes to the backend
- [ ] Add the following block to the Nginx config:
  ```nginx
  location /auth {
      proxy_pass http://localhost:3001;
      proxy_http_version 1.1;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
  }
  ```
- [ ] Reload or restart Nginx after updating the config

### Google OAuth Redirect URI:
- [ ] Confirm that the Google Cloud Console OAuth credentials include:
  - `https://green.flippi.ai/auth/google/callback`
- [ ] Update the .env or runtime config in staging to match:
  - `GOOGLE_CALLBACK_URL=https://green.flippi.ai/auth/google/callback`
  - `FRONTEND_URL=https://green.flippi.ai`

### Testing:
- [ ] Verify the full login flow works on staging: login → Google prompt → redirect → authenticated session
- [ ] Confirm JWT cookie is set properly
- [ ] Verify user can access protected routes after login

## 🛠 Notes
- Dev (blue.flippi.ai) works because the nginx config was manually updated
- No backend code changes are needed; this is an environment setup issue
- Make sure HTTPS is enforced on staging (it already is via Let's Encrypt)
- The backend port for staging is 3001

## Implementation Status
- ✅ Scripts created to automate the fix
- ⏳ Waiting for server access to apply the nginx configuration