# Update Deploy Staging Workflow

After 36 hours of debugging, the OAuth fix scripts haven't been working because:

1. **Windows line endings** break the scripts
2. **Scripts update wrong location** - they update sites-available but nginx reads from sites-enabled

## Required Workflow Change

In `.github/workflows/deploy-staging.yml`, replace the OAuth fix section with:

```yaml
# Apply OAuth nginx fix IMMEDIATELY after pull
echo "=== Applying OAuth fix ==="
if [ -f scripts/FINAL-fix-staging-oauth.sh ]; then
  echo "Running FINAL nginx OAuth fix..."
  bash scripts/FINAL-fix-staging-oauth.sh
elif [ -f scripts/fix-staging-oauth-verbose.sh ]; then
  echo "Running VERBOSE nginx OAuth fix..."
  dos2unix scripts/fix-staging-oauth-verbose.sh 2>/dev/null || true
  bash scripts/fix-staging-oauth-verbose.sh
else
  echo "ERROR: OAuth fix script not found!"
  ls -la scripts/
fi
```

This ensures we run the FINAL script that properly handles the sites-enabled symlink.