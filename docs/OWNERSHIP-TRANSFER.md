# Flippi.ai Ownership Transfer Guide

## Table of Contents
1. [Pre-Transfer Checklist](#pre-transfer-checklist)
2. [Account Transfers](#account-transfers)
3. [Server Access Transfer](#server-access-transfer)
4. [Post-Transfer Verification](#post-transfer-verification)
5. [Knowledge Transfer](#knowledge-transfer)
6. [Support Period](#support-period)

## Pre-Transfer Checklist

### Backup Everything
Before starting the transfer process:

1. **Create server snapshot**:
   - Log into DigitalOcean
   - Navigate to droplet
   - Create snapshot named: `pre-transfer-backup-YYYY-MM-DD`

2. **Export critical data**:
   ```bash
   ssh root@157.245.142.145
   
   # Backup configurations
   mkdir -p ~/transfer-backup
   cp /var/www/shared/.env ~/transfer-backup/
   tar -czf ~/transfer-backup/nginx-configs.tar.gz /etc/nginx/sites-available/
   pm2 save
   cp ~/.pm2/dump.pm2 ~/transfer-backup/
   
   # Export feedback database if needed
   cp /tmp/flippi-feedback.db ~/transfer-backup/ 2>/dev/null || echo "No feedback DB"
   # Alternative: Export as SQL for portability
   sqlite3 /tmp/flippi-feedback.db .dump > ~/transfer-backup/feedback-backup.sql 2>/dev/null || echo "No feedback DB"
   
   # Create archive
   tar -czf transfer-backup-$(date +%Y%m%d).tar.gz ~/transfer-backup/
   ```

3. **Document current state**:
   ```bash
   # Save current metrics
   echo "=== Transfer Date: $(date) ===" > ~/transfer-metrics.txt
   echo "=== PM2 Status ===" >> ~/transfer-metrics.txt
   pm2 list >> ~/transfer-metrics.txt
   echo "=== Disk Usage ===" >> ~/transfer-metrics.txt
   df -h >> ~/transfer-metrics.txt
   echo "=== Memory Usage ===" >> ~/transfer-metrics.txt
   free -m >> ~/transfer-metrics.txt
   ```

### Gather All Credentials

Create a secure document with:
- [ ] DigitalOcean login email and password
- [ ] GitHub account with repository access
- [ ] Domain registrar login credentials
- [ ] OpenAI account login credentials
- [ ] Server root password
- [ ] SSH private key (if using key-based auth)

## Account Transfers

### 1. GitHub Repository Transfer

**Option A: Transfer Repository** (Recommended)
1. Current owner: Go to Settings → Options
2. Scroll to "Danger Zone"
3. Click "Transfer ownership"
4. Enter new owner's GitHub username
5. Confirm transfer

**Option B: Add as Collaborator First**
1. Settings → Manage access → Invite collaborator
2. Add new owner with Admin rights
3. New owner accepts invitation
4. Test push access
5. Then transfer ownership

**Post-transfer**:
- [ ] Update GitHub Actions secrets if needed
- [ ] Verify webhook URLs still work
- [ ] Check deployment workflows trigger

### 2. DigitalOcean Droplet Transfer

**Option A: Transfer Droplet** (Cleanest)
1. Current owner: Create a team
2. Add new owner to team
3. Transfer droplet to team
4. Transfer team ownership
5. Remove old owner from team

**Option B: Account Transfer** (Simpler)
1. Change account email to new owner's email
2. New owner resets password
3. Update payment method
4. Enable 2FA with new owner's device

**Important**: Droplet IP (157.245.142.145) remains the same

### 3. Domain Transfer

**For each domain** (app.flippi.ai, green.flippi.ai, blue.flippi.ai):

1. **At current registrar**:
   - Unlock domain
   - Disable WHOIS privacy
   - Get authorization/EPP code
   - Note expiration date

2. **New owner**:
   - Initiate transfer at their registrar
   - Enter authorization code
   - Approve transfer email

3. **Post-transfer**:
   - Verify DNS still points to 157.245.142.145
   - Re-enable WHOIS privacy
   - Set auto-renewal

**Note**: Transfers can take 5-7 days. Plan accordingly.

### 4. OpenAI API Transfer

Since API keys are tied to accounts:

1. **New owner**:
   - Create OpenAI account
   - Add payment method
   - Generate new API key

2. **Update server**:
   ```bash
   ssh root@157.245.142.145
   nano /var/www/shared/.env
   # Update OPENAI_API_KEY=sk-new-key-here
   
   # Restart all backends
   pm2 restart prod-backend staging-backend dev-backend
   ```

3. **Old owner**:
   - Revoke old API key
   - Close account if desired

## Server Access Transfer

### 1. SSH Access Update

**Add new owner's SSH key**:
```bash
# New owner generates SSH key pair
ssh-keygen -t rsa -b 4096 -C "newowner@email.com"

# Current owner adds to server
ssh root@157.245.142.145
echo "ssh-rsa AAAAB3... newowner@email.com" >> ~/.ssh/authorized_keys

# Test new owner can connect
# From new owner's machine:
ssh root@157.245.142.145
```

### 2. Change Root Password

```bash
# After new owner has SSH access
passwd
# Enter new password twice
# Share securely with new owner
```

### 3. Remove Old Access

**After confirming new access works**:
```bash
# Remove old SSH keys
nano ~/.ssh/authorized_keys
# Delete old owner's key lines

# Verify only new owner's key remains
cat ~/.ssh/authorized_keys
```

## Post-Transfer Verification

### 1. Test All Environments

New owner should verify each environment:

```bash
# Test health endpoints
for env in app green blue; do
  echo "Testing $env.flippi.ai..."
  curl -s https://$env.flippi.ai/health | jq '.'
done

# Test image upload on each
# Use the web interface to upload a test image
```

### 2. Verify Deployments

Test the deployment pipeline:

1. **Make test change**:
   ```bash
   git clone https://github.com/[new-owner]/price-scanner-app-coding.git
   cd price-scanner-app-coding
   git checkout develop
   
   # Make small change (e.g., add comment)
   echo "# Transfer test" >> backend/server.js
   git add .
   git commit -m "test: verify deployment after transfer"
   git push origin develop
   ```

2. **Monitor deployment**:
   - Check GitHub Actions tab
   - Wait 2-3 minutes
   - Verify change appears on blue.flippi.ai

3. **Check logs**:
   ```bash
   ssh root@157.245.142.145
   pm2 logs dev-backend --lines 20
   ```

### 3. Verify All Services

```bash
# SSH to server
ssh root@157.245.142.145

# Check all PM2 processes running
pm2 list

# Check Nginx
systemctl status nginx

# Check disk space
df -h

# Check certificates
certbot certificates

# Test each backend directly
curl http://localhost:3000/health
curl http://localhost:3001/health
curl http://localhost:3002/health
```

## Knowledge Transfer

### 1. Technical Walkthrough

Schedule 1-2 hour session to cover:

**Architecture Overview**:
- Three environments on one server
- PM2 process management (not Docker)
- Nginx reverse proxy setup
- GitHub Actions deployment

**Key Locations**:
```bash
# Application code
/var/www/app.flippi.ai/    # Production
/var/www/green.flippi.ai/  # Staging
/var/www/blue.flippi.ai/   # Development

# Shared configuration
/var/www/shared/.env       # API keys

# Nginx configs
/etc/nginx/sites-available/

# PM2 configs
~/.pm2/
```

### 2. Common Operations Demo

Show new owner how to:

1. **Check system health**:
   ```bash
   pm2 list
   pm2 monit
   ```

2. **View logs**:
   ```bash
   pm2 logs prod-backend --lines 50
   tail -f /var/log/nginx/error.log
   ```

3. **Restart services**:
   ```bash
   pm2 restart prod-backend
   pm2 restart all
   ```

4. **Handle 502 errors**:
   - Check PM2 status
   - Check .env file
   - Restart backend

### 3. Documentation Review

Walk through each document:
- **TECHNICAL-GUIDE.md**: Architecture and API reference
- **DEVELOPMENT-GUIDE.md**: How to make changes
- **OPERATIONS-MANUAL.md**: Daily operations
- **This document**: For future transfers

### 4. Cost Management

Explain monthly costs:
- DigitalOcean: $20-40 (check droplet size)
- Domains: $9/month ($3 each)
- OpenAI: $10-100 (usage based)
- Total: $40-150/month typical

Show where to monitor:
- DigitalOcean billing dashboard
- OpenAI usage page
- Domain renewal dates

## Support Period

### 30-Day Support Agreement

Consider offering:
- [ ] Email/message support for questions
- [ ] One emergency call if system down
- [ ] Review of first major deployment
- [ ] Help with first monthly maintenance

### Handoff Completion Checklist

**Accounts Transferred**:
- [ ] GitHub repository ownership
- [ ] DigitalOcean droplet/account
- [ ] All three domains
- [ ] OpenAI API (new key working)

**Access Verified**:
- [ ] New owner can SSH to server
- [ ] New owner can push to GitHub
- [ ] Old owner's access removed
- [ ] Passwords changed

**Knowledge Transfer**:
- [ ] Technical walkthrough completed
- [ ] Operations demo completed
- [ ] Documentation reviewed
- [ ] Cost structure explained

**System Verified**:
- [ ] All environments working
- [ ] Deployments functioning
- [ ] Health checks passing
- [ ] Test image uploads work

### Final Steps

1. **Delete local copies**: Old owner should remove local code
2. **Update contacts**: If any services have contact info
3. **Close old accounts**: OpenAI, etc. if not needed
4. **Provide support contact**: Email/phone for 30 days

## Important Contacts

For new owner's reference:

- **DigitalOcean Support**: support.digitalocean.com
- **GitHub Support**: support.github.com
- **OpenAI Support**: help.openai.com
- **Domain Support**: Varies by registrar
- **Ubuntu/Linux Help**: askubuntu.com

## Emergency Recovery

If something goes wrong during transfer:

1. **Restore from snapshot**: Create new droplet from backup
2. **Update DNS**: Point domains to new droplet IP
3. **Restore access**: Re-add SSH keys as needed
4. **Contact support**: Each service has recovery options

Remember: The snapshot created at the start is your safety net. Don't delete it until transfer is 100% complete and verified.