# Deployment Nginx Update Instructions

## Issue
The OAuth nginx fix script requires root permissions to modify `/etc/nginx/sites-available/` but the deployment workflow isn't running it with sudo.

## Solution
The deployment workflow must explicitly run the nginx update script with sudo.

## Current Deployment Workflow
The staging deployment currently runs:
```bash
bash scripts/fix-staging-oauth-verbose.sh
```

## Required Change
Update the deployment workflow to run with sudo:
```bash
sudo bash scripts/fix-staging-oauth-verbose.sh
```

## Full Deployment Script Update

In `.github/workflows/deploy-staging.yml`, the OAuth fix section should be:

```yaml
# Apply OAuth nginx fix IMMEDIATELY after pull
echo "=== Applying OAuth fix ==="
if [ -f scripts/fix-staging-oauth-verbose.sh ]; then
  echo "Running VERBOSE nginx OAuth fix with sudo..."
  sudo bash scripts/fix-staging-oauth-verbose.sh
elif [ -f scripts/fix-staging-nginx-oauth.sh ]; then
  echo "Running nginx OAuth fix for staging with sudo..."
  sudo bash scripts/fix-staging-nginx-oauth.sh
else
  echo "ERROR: OAuth fix script not found!"
  ls -la scripts/
fi
```

## Why This Works
- The GitHub Actions SSH connection runs as root
- The script needs explicit sudo to modify nginx configs
- The script assumes it has proper permissions

## Verification
After deployment, OAuth should return 302:
```bash
curl -I https://green.flippi.ai/auth/google
# Should return: HTTP/2 302
```

## Manual Fix (If Needed)
If automated deployment continues to fail:
```bash
ssh root@157.245.142.145
cd /var/www/green.flippi.ai
sudo bash scripts/fix-staging-oauth-verbose.sh
```