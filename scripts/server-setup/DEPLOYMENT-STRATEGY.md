# Server Setup and Deployment Strategy

## Overview

This directory contains scripts for setting up NEW servers for Flippi.ai environments. The deployment strategy uses GitHub Actions to ensure scripts are only run on intended target servers.

## How It Works

### 1. Server Setup Scripts
- `setup-new-server-blue.sh` - Sets up a new development server
- `setup-new-server-green.sh` - Sets up a new staging server (to be created)
- `setup-new-server-production.sh` - Sets up a new production server (to be created)

These scripts:
- Install all prerequisites (Node.js, PM2, Nginx, Python, etc.)
- Configure firewall rules
- Create infrastructure directories (/opt/flippi/)
- Set up Nginx configurations
- Create helper scripts

Note: The application directory (/var/www/blue.flippi.ai) is created by git clone to avoid ownership issues.

### Key Implementation Details

1. **Directory Creation**: The setup script does NOT create `/var/www/[environment].flippi.ai`. This directory is created by git clone with proper permissions.

2. **File Permissions**: Permissions are set AFTER npm install and build complete to avoid conflicts between root-owned npm operations and www-data web serving.

3. **Static File Serving**: Nginx serves the frontend files directly from `/var/www/[environment].flippi.ai/mobile-app/dist`. No separate PM2 frontend process is needed.

4. **Legal Pages**: Located at `/mobile-app/*.html` (not `/legal/*.html`). The nginx configuration has been updated accordingly.

5. **Shell Scripts**: All shell scripts in the repository are made executable after cloning with `chmod +x`.

### 2. GitHub Actions Workflow

The `.github/workflows/setup-new-server.yml` workflow:
- Runs on GitHub's infrastructure (GitHub-hosted runners)
- Takes the target server IP and root password as inputs
- Generates a new SSH keypair for secure access
- Installs the SSH key on the server using the provided password
- Automatically saves the SSH key and server IP to GitHub Secrets
- Uses the generated SSH key for all setup operations
- Keeps password authentication enabled on the server

### 3. Security Through GitHub Secrets

The workflow automatically creates and manages these secrets:
- `BLUE_SERVER_SSH_KEY` / `GREEN_SERVER_SSH_KEY` / `PROD_SERVER_SSH_KEY` - SSH private keys
- `BLUE_SERVER_HOST` / `GREEN_SERVER_HOST` / `PROD_SERVER_HOST` - Server IP addresses

Application secrets used during setup:
- `OPENAI_API_KEY` - OpenAI API key
- `SESSION_SECRET` - Session secret for the app
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret

### 4. Deployment Separation

Regular deployments use:
- `.github/workflows/deploy-develop.yml` → Existing blue server
- `.github/workflows/deploy-staging.yml` → Existing green server
- `.github/workflows/deploy-production.yml` → Existing production server

New server setup uses:
- `.github/workflows/setup-new-server.yml` → NEW servers only

## Usage

### Setting Up a New Server

1. **Provision a new server** (DigitalOcean, AWS, etc.)
   - Ubuntu 22.04 or later
   - At least 2GB RAM
   - Root access with password

2. **Ensure required GitHub Secrets exist**
   - `OPENAI_API_KEY`
   - `SESSION_SECRET` 
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

3. **Run the GitHub Action via GitHub UI**
   - Go to Actions → "Setup New Server"
   - Click "Run workflow"
   - Enter the new server IP
   - Select environment (blue/green/production)
   - Enter the root password
   - Click "Run workflow"

4. **Or run via gh CLI**
   ```bash
   gh workflow run setup-new-server.yml \
     -f target_server_ip="165.232.149.247" \
     -f environment="blue" \
     -f root_password="your-root-password"
   
   # Watch the progress
   gh run watch
   ```

5. **Update DNS** after setup completes
   - Point the appropriate domain to the new server IP on GoDaddy

6. **Setup SSL Certificate**
   - Wait 5-10 minutes for DNS propagation
   - Run the 'Setup SSL Certificate' workflow
   - The workflow will verify DNS and install Let's Encrypt certificate

7. **Note: GitHub Secrets are automatically updated**
   - The workflow automatically saves the SSH key and server IP
   - No manual secret updates needed

### Migrating from Old to New Server

1. Setup new server using the workflow
2. Test the new server thoroughly
3. Update DNS to point to new server
4. Update GitHub secrets
5. Future deployments will go to the new server
6. Keep old server running during transition
7. Decommission old server after verification

## Why This Approach?

1. **No Risk to Existing Servers**: Scripts can't accidentally run on production
2. **Centralized Control**: All deployments managed through GitHub
3. **Audit Trail**: Every server setup is logged in GitHub Actions
4. **Consistent Setup**: Same setup process for all environments
5. **Secret Management**: Sensitive data never in scripts

## Important Notes

- The setup scripts are NOT run during regular deployments
- They are ONLY run via the setup-new-server workflow
- Regular deployment workflows continue to work unchanged
- No impact on the existing production server (157.245.142.145)