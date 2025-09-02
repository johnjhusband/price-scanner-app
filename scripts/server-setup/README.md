# Server Setup Scripts

## ⚠️ IMPORTANT: These scripts are for NEW SERVER SETUP ONLY

These scripts are designed to set up a fresh Ubuntu server for Flippi.ai environments. They should **NEVER** be run on the existing production server (157.245.142.145).

## Scripts in this directory:

### 1. `setup-new-server-blue.sh`
- Sets up a new server for the blue (development) environment
- Installs all prerequisites (Node.js, PM2, Nginx, Python dependencies)
- Configures firewall and creates helper scripts
- **DO NOT RUN** on existing servers

### 2. `setup-new-server-green.sh`
- Sets up a new server for the green (staging) environment
- Similar to blue but with staging-specific configurations
- **DO NOT RUN** on existing servers

### 3. `setup-new-server-prod.sh`
- Sets up a new server for production environment
- Production-specific security hardening
- **DO NOT RUN** on existing servers

## Safe Usage:

1. These scripts are for **fresh Ubuntu servers only**
2. They are executed via GitHub Actions workflow
3. The workflow handles all authentication and setup
4. No manual SSH access needed

## When to use these scripts:

- Setting up a new development/staging/production server
- Migrating to a new server
- Disaster recovery on fresh infrastructure
- Testing infrastructure changes

## When NOT to use these scripts:

- On the existing production server
- As part of regular deployments
- To "fix" issues on running servers
- Manually via SSH (use GitHub Actions instead)

## Important Note on Directory Creation:

The application directory `/var/www/blue.flippi.ai` is NOT created by the setup script. It will be created by the git clone operation in the workflow. This prevents ownership mismatch issues between the setup user and the git clone operation.

## Key Changes Made (2025-09-02):

1. **Directory Creation**: The setup script no longer creates `/var/www/blue.flippi.ai` - git clone creates it with proper permissions
2. **Permissions**: Set AFTER build completes to avoid npm permission conflicts
3. **Legal Pages**: Nginx config updated to serve from `/var/www/blue.flippi.ai/mobile-app/*.html` (not `/legal/`)
4. **PM2 Config**: Removed unnecessary frontend process - nginx serves static files directly
5. **Shell Scripts**: Made executable after clone with `chmod +x`

## GitHub Secrets Requirements

Before running the setup workflow, ensure these secrets exist in the repository:

### Required Secrets:
- `OPENAI_API_KEY` - Your OpenAI API key for image analysis
- `SESSION_SECRET` - A secure random string for session encryption
- `GH_PAT` - GitHub Personal Access Token with repo permissions (for saving SSH keys)

### Optional Secrets:
- `GOOGLE_CLIENT_ID` - Only if using Google OAuth
- `GOOGLE_CLIENT_SECRET` - Only if using Google OAuth

### Setting Secrets via CLI:
```bash
gh secret set OPENAI_API_KEY --body "your-api-key-here"
gh secret set SESSION_SECRET --body "$(openssl rand -base64 32)"
```

### Local Secret Storage:
Keep a copy in `shared/.env` (gitignored) for backup:
```
OPENAI_API_KEY=your-key
SESSION_SECRET=your-secret
FEEDBACK_DB_PATH=/var/lib/flippi-dev/feedback.db
```

## How to Use:

### Via GitHub Actions (Recommended):

1. **Using GitHub UI:**
   - Go to Actions → "Setup New Server"
   - Click "Run workflow"
   - Enter:
     - Server IP address
     - Environment (blue/green/production)
     - Root password
   - Click "Run workflow"

2. **Using gh CLI:**
   ```bash
   gh workflow run setup-new-server.yml \
     -f target_server_ip="YOUR_SERVER_IP" \
     -f environment="blue" \
     -f root_password="YOUR_ROOT_PASSWORD"
   
   # Watch the progress
   gh run watch
   ```

## What the Workflow Does:

1. **Generates SSH keypair** - Creates a new SSH key for secure access
2. **Installs key on server** - Uses the password to install the SSH public key
3. **Saves to GitHub Secrets** - Automatically stores:
   - SSH private key (e.g., `BLUE_SERVER_SSH_KEY`)
   - Server IP (e.g., `BLUE_SERVER_HOST`)
4. **Runs setup script** - Installs all dependencies and configures the server
5. **Deploys application** - Clones repo, installs packages, builds, and starts services
6. **Keeps password auth** - Password authentication remains enabled

## SSL Certificate Setup:

After updating DNS on GoDaddy:

1. **Wait for DNS propagation** (5-10 minutes)
2. **Run SSL workflow**:
   ```bash
   gh workflow run setup-ssl-certificate.yml \
     -f environment="blue" \
     -f email="admin@flippi.ai"
   ```
3. **The SSL workflow will**:
   - Verify DNS is pointing to the correct server
   - Install Let's Encrypt certificate
   - Configure HTTPS with auto-redirect
   - Setup automatic renewal
   - Test that HTTPS is working

## Manual Usage (Not Recommended):

If you must run manually, ensure it's a FRESH server:
```bash
wget https://raw.githubusercontent.com/[your-repo]/FlippiGitHub2/server-setup/setup-new-server-blue.sh
chmod +x setup-new-server-blue.sh
sudo ./setup-new-server-blue.sh
```