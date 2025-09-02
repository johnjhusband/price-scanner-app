# Fix for web-styles.css MIME Type Error

## Problem
When accessing blue.flippi.ai (or other environments), you may see this error in the browser console:
```
Refused to apply style from 'https://blue.flippi.ai/web-styles.css' because its MIME type ('text/html') is not a supported stylesheet MIME type, and strict MIME checking is enabled.
```

## Root Cause
The `web-styles.css` file exists in the `mobile-app` directory but is not automatically copied to the `dist` directory during the Expo build process. When the browser requests `/web-styles.css`, it gets a 404 error page (HTML) instead of the CSS file.

## Quick Fix (Manual)
SSH into the server and run:
```bash
# For blue.flippi.ai
cd /var/www/blue.flippi.ai
cp mobile-app/web-styles.css mobile-app/dist/

# Or use the provided script for all environments:
cd /var/www/blue.flippi.ai && bash scripts/manual-fix-web-styles.sh
```

## Permanent Fix
The deployment workflow needs to be updated to copy web-styles.css after the Expo build:

```yaml
cd ../mobile-app && npm install && npx expo export --platform web --output-dir dist
# Add this line:
cp web-styles.css dist/ || echo "Warning: Could not copy web-styles.css"
```

**Note**: Workflow files cannot be modified via OAuth/API due to GitHub security restrictions. This change must be made manually in the GitHub UI.

## Verification
After applying the fix:
1. Check that the file exists: `ls -la /var/www/blue.flippi.ai/mobile-app/dist/web-styles.css`
2. Refresh the browser and verify no MIME type errors in console
3. Check that styles are applied correctly

## Prevention
- Always test web builds locally before deployment
- Include all required static assets in the build process
- Consider using Expo's asset system for CSS files in future updates