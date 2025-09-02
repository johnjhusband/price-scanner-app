# Conversation Memory - New Server Setup for Flippi.ai

**Date**: 2025-09-01
**Context**: Setting up infrastructure for new Flippi.ai servers

## What Was Accomplished

### 1. Created Complete Server Setup System
- Built comprehensive setup script (`setup-new-server-blue.sh`) that installs:
  - Node.js 18.x, PM2, Nginx, Python 3
  - NumPy 1.26.4, rembg, onnxruntime (for FotoFlip feature)
  - All required system packages
  - Firewall configuration (UFW)
  - Helper scripts for deployment and monitoring

### 2. GitHub Actions Workflow for Automation
- Created `setup-new-server.yml` workflow that:
  - Accepts server IP and root password as inputs
  - Generates SSH keypair automatically
  - Installs SSH key on server using password
  - Saves SSH key and server IP to GitHub Secrets
  - Runs setup script and deploys application
  - Keeps password authentication enabled (per user request)

### 3. Helper Scripts Created on Server
- `deploy-blue` - One-command deployment
- `setup-ssl-blue` - SSL certificate setup
- `check-flippi` - System health monitoring
- `fix-nginx-ssl-comprehensive.sh` - Fixes common SSL issues

### 4. Project Structure
All new server setup files organized in `/FlippiGitHub2/`:
```
FlippiGitHub2/
├── .github/
│   └── workflows/
│       ├── setup-new-server.yml        # Main setup workflow
│       └── deploy-develop-new.yml      # Deployment to new servers
├── server-setup/
│   ├── setup-new-server-blue.sh        # Server setup script
│   ├── README.md                       # Usage instructions
│   └── DEPLOYMENT-STRATEGY.md          # Architecture documentation
└── CONVERSATION-MEMORY-2025-09-01.md   # This file
```

## Key Learnings About Flippi.ai

### Architecture
- **Single DigitalOcean droplet** hosts all 3 environments (blue/dev, green/staging, app/production)
- **PM2 process manager** (NOT Docker) manages all services
- **Port allocation**:
  - Blue: Backend 3002, Frontend 8082
  - Green: Backend 3001, Frontend 8081
  - Production: Backend 3000, Frontend 8080
- **SQLite database** for users and feedback (not stateless as originally designed)

### Important Features
- **Google OAuth 2.0** authentication required for app access
- **FotoFlip Luxe Photo** feature (Issue #175) - background removal service
- **Growth platform** with Reddit RSS integration for valuations
- **Feedback learning system** where AI improves from user feedback

### Critical Operational Rules
- **NEVER modify .github/workflows/** via OAuth/API (GitHub security restriction)
- **NO manual server changes** - everything through Git and automated deployment
- **SSH access is READ-ONLY** for debugging
- **Legal pages SSL issue** is frequent - fix script included

## GitHub Secrets Management

The workflow automatically creates/updates these secrets:
- `BLUE_SERVER_SSH_KEY` - SSH private key for blue environment
- `BLUE_SERVER_HOST` - IP address of blue server
- Similar pairs for green and production environments

Required application secrets (must exist before setup):
- `OPENAI_API_KEY`
- `SESSION_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

## Firewall Configuration
Only these ports are open:
- **22** - SSH access
- **80** - HTTP (redirects to HTTPS)
- **443** - HTTPS

Backend/frontend ports (3000-3002, 8080-8082) are NOT exposed externally - all traffic goes through Nginx reverse proxy.

## Next Steps

### Immediate Actions
1. **Test the workflow** on a fresh Ubuntu server:
   ```bash
   gh workflow run setup-new-server.yml \
     -f target_server_ip="NEW_SERVER_IP" \
     -f environment="blue" \
     -f root_password="ROOT_PASSWORD"
   ```

2. **Create missing setup scripts**:
   - Copy `setup-new-server-blue.sh` to create green and production versions
   - Update ports and environment-specific configurations

3. **Update DNS** after successful setup:
   - Point blue.flippi.ai to new server IP
   - Wait for DNS propagation
   - Run SSL setup

### Future Enhancements
1. **SSL Certificate Automation**:
   - Add workflow to setup SSL after DNS is configured
   - Currently requires manual run of `setup-ssl-blue` script

2. **Database Migration**:
   - Plan for migrating SQLite data from old to new server
   - Consider backup/restore procedures

3. **Monitoring Integration**:
   - Set up alerts for server health
   - Consider PM2+ or similar monitoring service

4. **Multi-Server Architecture**:
   - Current setup puts all environments on one server
   - Consider separate servers for production isolation

### Testing Checklist
- [ ] Provision fresh Ubuntu 22.04+ server
- [ ] Run setup workflow with credentials
- [ ] Verify services start correctly
- [ ] Test application functionality
- [ ] Update DNS records
- [ ] Setup SSL certificates
- [ ] Test regular deployments work
- [ ] Document any issues encountered

## Important Warnings

1. **Never run on existing servers** - Scripts assume fresh Ubuntu installation
2. **GitHub token permissions** - Ensure token has ability to create secrets
3. **Password security** - The root password is only used once during setup
4. **Environment separation** - Each environment needs its own setup run

## Repository Context
The main Flippi.ai repository is separate from this FlippiGitHub2 folder. When ready to integrate:
1. Move workflow files to main repo's `.github/workflows/`
2. Update script paths in workflows
3. Test thoroughly before using on production

This setup provides a complete, automated way to provision new Flippi.ai servers while maintaining security and avoiding any impact on existing infrastructure.