# FotoFlip Luxe Photo Deployment Checklist

## ✅ Pre-Deployment Status
- All code tests passing
- No security vulnerabilities found
- Feature properly gated to Blue environment only
- Local FotoFlip/AutoFlip pipeline untouched

## 🚨 Risk Areas & Mitigations

### HIGH RISK: None identified ✅

### MEDIUM RISK:
1. **Python Dependencies Not Installed on Server**
   - Impact: Background removal will fail
   - Mitigation: Install before testing
   - Commands provided below

### LOW RISK:
1. **Environment Variables Not Set**
   - Impact: Feature disabled or using defaults
   - Mitigation: Set all required vars before testing

2. **ImgBB API Key Not Configured**
   - Impact: Falls back to base64 return (still works)
   - Mitigation: Add key for production use

## 📋 Deployment Steps

### 1. Git Operations
```bash
# Check current status
git status

# Add all changes
git add .

# Commit with descriptive message
git commit -m "Add FotoFlip Luxe Photo feature (Blue env only) - Issue #175"

# Push to develop branch (auto-deploys to Blue)
git push origin develop
```

### 2. Server Configuration (SSH to Blue)
```bash
# SSH to blue server
ssh blue.flippi.ai

# Set environment variables
export ENABLE_LUXE_PHOTO=true
export IMGBB_API_KEY="<get-from-autoflip-env>"
export FOTOFLIP_BG_COLOR="#FAF6F1"
export FOTOFLIP_MODE=beautify

# Add to PM2 environment (persistent)
pm2 set ENABLE_LUXE_PHOTO true
pm2 set IMGBB_API_KEY "<get-from-autoflip-env>"
pm2 set FOTOFLIP_BG_COLOR "#FAF6F1"
pm2 set FOTOFLIP_MODE beautify

# Restart backend
pm2 restart dev-backend
```

### 3. Install Python Dependencies
```bash
# Update package manager
sudo apt-get update

# Install Python3 and pip if not present
sudo apt-get install -y python3 python3-pip

# Install rembg for background removal
pip3 install rembg onnxruntime

# Verify installation
python3 -c "import rembg; print('✅ rembg installed')"
```

### 4. Testing Checklist

#### A. Backend Health Check
```bash
curl https://blue.flippi.ai/api/fotoflip/health
```
Expected: Service healthy, features enabled

#### B. Frontend Visibility
1. Open https://blue.flippi.ai in browser
2. Upload or capture a product image
3. Click "Go" to analyze
4. Verify "Luxe Photo" button appears above "Share on X"
5. Button should be cream-colored with star icon

#### C. End-to-End Test
1. Click "Luxe Photo" button
2. Wait for processing (15-30 seconds)
3. Image should auto-download with:
   - Clean white/cream background
   - Enhanced lighting
   - "flippi.ai ♻️" watermark
   - Professional quality

#### D. Verify Local Pipeline Still Works
1. Open desktop FotoFlip app
2. Process a test image
3. Verify output in `/processed` folder
4. Open AutoFlip and generate CSV
5. Confirm no disruption to workflow

## 🔍 Post-Deployment Monitoring

### Check Logs
```bash
# Backend logs
pm2 logs dev-backend --lines 100

# Look for:
# - "[Luxe Photo] Starting processing..."
# - "[Luxe Photo] Processing successful"
# - Any error messages
```

### Performance Metrics
- Processing time: Should be 15-30 seconds
- Success rate: Monitor for failures
- Image quality: Verify outputs meet standards

## 🚧 Rollback Plan

If issues arise:
```bash
# Disable feature immediately
pm2 set ENABLE_LUXE_PHOTO false
pm2 restart dev-backend

# Or revert code
git revert HEAD
git push origin develop
```

## 📝 Known Limitations

1. **Blue Environment Only** - Feature not available on Green/Production
2. **Processing Time** - 15-30 seconds per image
3. **File Size** - Limited to 10MB uploads
4. **Image Formats** - JPEG/PNG only

## ✅ Success Criteria

- [ ] Button visible on Blue environment only
- [ ] Image processing completes without errors
- [ ] Enhanced image downloads automatically
- [ ] Watermark applied correctly
- [ ] Background is clean white/cream
- [ ] Local FotoFlip/AutoFlip still works

## 📞 Support

If issues arise during deployment:
1. Check PM2 logs for errors
2. Verify Python dependencies installed
3. Confirm environment variables set
4. Test with small image first

---

**Ready for deployment!** All tests passing, no high-risk issues identified.