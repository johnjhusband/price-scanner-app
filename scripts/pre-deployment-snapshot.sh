#!/bin/bash
# Pre-deployment Snapshot Script
# Creates a backup of current state before deploying FotoFlip

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
SNAPSHOT_DIR="snapshots/fotoflip_deployment_$TIMESTAMP"

echo "📸 Creating pre-deployment snapshot..."
echo "===================================="

# Create snapshot directory
mkdir -p $SNAPSHOT_DIR

# 1. Capture current git state
echo "Capturing git state..."
git log --oneline -10 > $SNAPSHOT_DIR/git_log.txt
git status > $SNAPSHOT_DIR/git_status.txt
git diff > $SNAPSHOT_DIR/uncommitted_changes.diff
CURRENT_COMMIT=$(git rev-parse HEAD)
echo $CURRENT_COMMIT > $SNAPSHOT_DIR/current_commit.txt
echo "Current commit: $CURRENT_COMMIT"

# 2. List modified files
echo -e "\nCapturing modified files..."
cat > $SNAPSHOT_DIR/modified_files.txt << EOF
Modified files for FotoFlip feature:
=====================================
backend/services/fotoflip/index.js
backend/services/fotoflip/processor.js
backend/services/fotoflip/imgbb-uploader.js
backend/routes/fotoflip.js
backend/server.js (added route)
backend/package.json (added dependencies)
backend/.env.example (documented vars)
mobile-app/App.js (added Luxe Photo button)
EOF

# 3. Create rollback instructions
cat > $SNAPSHOT_DIR/ROLLBACK_INSTRUCTIONS.txt << EOF
ROLLBACK INSTRUCTIONS
====================
Created: $(date)
Commit before FotoFlip: $CURRENT_COMMIT

Quick Rollback Options:
----------------------

1. FASTEST - Disable Feature (30 seconds):
   ssh blue.flippi.ai
   pm2 set ENABLE_LUXE_PHOTO false
   pm2 restart dev-backend

2. CLEAN - Git Revert (2-3 minutes):
   git revert $(git rev-parse HEAD)
   git push origin develop

3. EMERGENCY - Use rollback script:
   ssh blue.flippi.ai
   bash /var/www/blue.flippi.ai/scripts/emergency-fotoflip-rollback.sh

Files to Remove (if manual rollback needed):
-------------------------------------------
- backend/services/fotoflip/ (entire directory)
- backend/routes/fotoflip.js
- Remove fotoflip route from backend/server.js
- Remove handleLuxePhoto from mobile-app/App.js

Dependencies Added:
------------------
- sharp: ^0.33.2
- form-data: ^4.0.0

Environment Variables Added:
---------------------------
- ENABLE_LUXE_PHOTO
- FOTOFLIP_BG_COLOR
- FOTOFLIP_MODE
- IMGBB_API_KEY
EOF

# 4. Backup critical files
echo -e "\nBacking up critical files..."
mkdir -p $SNAPSHOT_DIR/backups
cp backend/server.js $SNAPSHOT_DIR/backups/
cp backend/package.json $SNAPSHOT_DIR/backups/
cp mobile-app/App.js $SNAPSHOT_DIR/backups/App.js.backup

# 5. Create quick test script
cat > $SNAPSHOT_DIR/test_after_deploy.sh << 'EOF'
#!/bin/bash
# Quick test after deployment

echo "Testing FotoFlip deployment..."

# 1. Check health
echo -n "Backend health: "
curl -s https://blue.flippi.ai/health | grep -q "OK" && echo "✅ OK" || echo "❌ FAILED"

echo -n "FotoFlip health: "
curl -s https://blue.flippi.ai/api/fotoflip/health | grep -q "healthy" && echo "✅ OK" || echo "❌ FAILED"

# 2. Check feature flag
echo -n "Feature enabled: "
curl -s https://blue.flippi.ai/api/fotoflip/health | grep -q '"luxePhotoEnabled":true' && echo "✅ YES" || echo "❌ NO"

# 3. Basic functionality test
echo -e "\nManual tests needed:"
echo "1. Open https://blue.flippi.ai"
echo "2. Upload test image"
echo "3. Click 'Go' to analyze"
echo "4. Verify 'Luxe Photo' button appears"
echo "5. Test button functionality"
EOF

chmod +x $SNAPSHOT_DIR/test_after_deploy.sh

# 6. Summary
echo -e "\n✅ Snapshot created: $SNAPSHOT_DIR"
echo -e "\nSnapshot contains:"
echo "  - Current git state"
echo "  - Rollback instructions"
echo "  - File backups"
echo "  - Test script"
echo -e "\n📌 Snapshot saved for emergency use"
echo "Ready to deploy! If issues arise, check: $SNAPSHOT_DIR/ROLLBACK_INSTRUCTIONS.txt"