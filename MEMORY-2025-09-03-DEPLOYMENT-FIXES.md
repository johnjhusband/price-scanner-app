# Memory File: Deployment Fixes for blue.flippi.ai
Date: 2025-09-03
Progress: 0%

## Context
- blue.flippi.ai shows React app instead of legal HTML pages (/terms, /privacy, /contact, /mission)
- Root cause: Missing SSL configuration files preventing nginx from loading config
- Deploy Development workflow hasn't triggered since Sept 2 despite new commits
- Cannot modify workflow files via OAuth (GitHub restriction)

## Issues Identified
1. ❌ SSL files missing on blue server (/etc/letsencrypt/options-ssl-nginx.conf, ssl-dhparams.pem)
2. ❌ Deploy Development workflow not triggering on push to develop
3. ❌ Legal pages showing React app instead of HTML content
4. ❌ No deployments running today despite multiple commits

## TODO List

### 1. Fix SSL Configuration on Blue Server (0%)
- [ ] Run fix-blue-ssl-files.sh script on server
- [ ] Verify SSL files are created
- [ ] Test nginx configuration loads correctly
- [ ] Confirm legal pages serve HTML not React app

### 2. Fix GitHub Actions Deployment Pipeline (0%)
- [ ] Add workflow_dispatch trigger to Deploy Development workflow
- [ ] Test manual deployment trigger works
- [ ] Verify automated push triggers resume
- [ ] Ensure SSL fix script runs during deployment

### 3. Deploy Pending Changes (0%)
- [ ] Deploy commit ecd92f0 (SSL fix trigger)
- [ ] Deploy commit 5f48059 (SSL fix script)
- [ ] Deploy commit a65232c (deployment script)
- [ ] Verify all changes reach blue server

### 4. Test & Verify (0%)
- [ ] Run PlayClone tests on legal pages
- [ ] Verify /terms shows terms.html content
- [ ] Verify /privacy shows privacy.html content
- [ ] Verify /contact shows contact.html content
- [ ] Verify /mission shows mission.html content

### 5. Document Solution (0%)
- [ ] Update deployment troubleshooting docs
- [ ] Add SSL fix to post-deployment checklist
- [ ] Document workflow trigger requirements
- [ ] Create runbook for future SSL issues

## Completed Items
- ✅ Created fix-blue-ssl-files.sh script
- ✅ Created deploy-blue.js deployment trigger script
- ✅ Identified root cause of legal pages issue
- ✅ Researched why deployments aren't triggering

## Next Steps
1. Manual intervention needed: Add workflow_dispatch to Deploy Development workflow on GitHub
2. Run deployment using new deploy-blue.js script
3. SSH to blue server to run SSL fix if deployment still fails

## Scripts Created
- `/scripts/fix-blue-ssl-files.sh` - Creates missing SSL config files
- `/scripts/deploy-blue.js` - Triggers deployment via GitHub API
- `/playclone/ralph-test-legal-pages.js` - Tests legal pages with PlayClone

## Key Commands
```bash
# Trigger deployment
node scripts/deploy-blue.js

# Test legal pages
cd ../playclone && node ralph-test-legal-pages.js

# On server (if needed)
cd /var/www/blue.flippi.ai && bash scripts/fix-blue-ssl-files.sh
```