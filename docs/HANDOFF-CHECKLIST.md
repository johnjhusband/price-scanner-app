# Flippi.ai Ownership Transfer Checklist

## Pre-Transfer Preparation

### 1. Backup Everything
- [ ] Create DigitalOcean droplet snapshot
- [ ] Export feedback database: `sqlite3 /tmp/flippi-feedback.db .dump > feedback-backup.sql`
- [ ] Download `.env` files from server
- [ ] Clone repository locally
- [ ] Document current traffic levels
- [ ] Note current monthly costs

### 2. Gather Credentials
- [ ] DigitalOcean login credentials
- [ ] Domain registrar login credentials  
- [ ] GitHub account with repo access
- [ ] OpenAI API account credentials
- [ ] SSH keys for server access
- [ ] Root password for server

## Account Transfers

### 1. GitHub Repository
- [ ] Add new owner as collaborator with admin rights
- [ ] Transfer repository ownership in Settings → Options → Transfer ownership
- [ ] Update GitHub Actions secrets if needed
- [ ] Verify new owner can push to all branches

### 2. DigitalOcean Droplet
**Option A: Transfer Droplet**
- [ ] Add new owner to team
- [ ] Transfer droplet to new account
- [ ] Update billing information

**Option B: Transfer Account**
- [ ] Change email on account
- [ ] Update billing information
- [ ] Change password

### 3. Domain Names
- [ ] Unlock domains at registrar
- [ ] Get transfer authorization codes
- [ ] Initiate transfer to new registrar account
- [ ] Update DNS settings if needed
- [ ] Verify domains still point to 157.245.142.145

### 4. OpenAI API
- [ ] New owner creates OpenAI account
- [ ] New owner generates API key
- [ ] Update API key on server (see below)

## Server Configuration Updates

### 1. Update SSH Access
```bash
# Add new owner's SSH key
ssh root@157.245.142.145
nano ~/.ssh/authorized_keys
# Add new public key

# Remove old SSH keys
# Delete lines for old owner
```

### 2. Update API Keys
```bash
# Update OpenAI API key
nano /var/www/shared/.env
# Change OPENAI_API_KEY=new_key_here

# Restart all services
pm2 restart all
```

### 3. Change Root Password
```bash
passwd
# Enter new password twice
```

## Post-Transfer Verification

### 1. Test All Environments
- [ ] Visit https://app.flippi.ai - Test image upload
- [ ] Visit https://green.flippi.ai - Test image upload  
- [ ] Visit https://blue.flippi.ai - Test image upload
- [ ] Verify API responses are working
- [ ] Check feedback submission works

### 2. Verify Deployments
- [ ] Make test commit to develop branch
- [ ] Verify auto-deployment to blue.flippi.ai
- [ ] Check GitHub Actions completed successfully

### 3. Monitor Services
```bash
# Check all services running
pm2 list

# Check logs for errors
pm2 logs --lines 100

# Check disk space
df -h

# Check system resources
htop
```

## Knowledge Transfer

### 1. Documentation Review
- [ ] Walk through ARCHITECTURE.md
- [ ] Review DEPLOYMENT.md
- [ ] Explain CLAUDE.md purpose
- [ ] Review TECH-STACK-SUMMARY.md

### 2. Operational Training

#### Daily Operations
```bash
# View status
pm2 list

# View logs
pm2 logs [app-name]

# Restart service
pm2 restart [app-name]

# Monitor resources
pm2 monit
```

#### Common Issues
1. **502 Bad Gateway**
   - Backend crashed
   - Run: `pm2 restart dev-backend`

2. **High CPU Usage**
   - Normal during image analysis
   - If persistent: `pm2 restart all`

3. **Disk Full**
   - Check: `df -h`
   - Clean: `rm /tmp/*.db-journal`

#### Deployment Process
- Push to `develop` → Deploys to blue.flippi.ai
- Push to `staging` → Deploys to green.flippi.ai
- Push to `master` → Deploys to app.flippi.ai

### 3. Important Locations
- **Code**: `/var/www/[domain]/`
- **Env files**: `/var/www/shared/.env`
- **Nginx configs**: `/etc/nginx/sites-available/`
- **PM2 configs**: `ecosystem.config.js` in each app directory
- **SSL certs**: `/etc/letsencrypt/`

## Final Steps

### 1. Remove Old Access
- [ ] Remove old SSH keys from server
- [ ] Remove old collaborator from GitHub
- [ ] Remove old owner from DigitalOcean
- [ ] Cancel old OpenAI API key

### 2. Update Documentation
- [ ] Update contact information in README
- [ ] Update copyright in LICENSE file
- [ ] Update any hardcoded emails

### 3. Handoff Complete
- [ ] All accounts transferred
- [ ] All access verified
- [ ] New owner can deploy code
- [ ] Old owner's access revoked
- [ ] Knowledge transfer complete

## Support Period

Consider offering:
- [ ] 30-day support period for questions
- [ ] Documentation of any issues that arise
- [ ] One-time review after first deployment

## Important Contacts

- **DigitalOcean Support**: support.digitalocean.com
- **Domain Support**: Varies by registrar
- **OpenAI Support**: help.openai.com
- **GitHub Support**: support.github.com

---
*Checklist Version: 1.0*  
*Last Updated: July 2025*