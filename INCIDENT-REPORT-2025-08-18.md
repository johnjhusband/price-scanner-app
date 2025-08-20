# Incident Report - 2025-08-18

## Summary
While fixing Growth → Questions routing on blue.flippi.ai (development), nginx configuration changes inadvertently affected all environments, causing production and staging outages during a live show.

## Timeline
- **Initial Issue**: Growth → Questions route on blue.flippi.ai redirecting to Upload Photo page
- **Root Cause**: Missing `/growth` location block in nginx configuration
- **Attempted Fixes**: Multiple deployment workflows created to fix nginx routing
- **Incident**: "Nuclear" nginx fix broke SSL certificates across all sites
- **Impact**: 
  - green.flippi.ai - SSL certificate errors
  - app.flippi.ai - Complete outage during live show (~10 minutes)
- **Resolution**: Emergency recovery workflows restored all sites

## Technical Details

### What Went Wrong
1. **Shared nginx instance** - Changes to blue.flippi.ai nginx affected all sites
2. **Config naming mismatch** - nginx expected `blue.flippi.ai`, infra-nginx had `flippi-blue.conf`
3. **Overly aggressive fix** - Complete nginx rewrite broke SSL configurations
4. **Wrong file paths** - Production uses different paths than development

### Failed Approaches
- 7 different workflow attempts to fix nginx
- Each attempt modified nginx configs without proper testing
- "Nuclear" option rewrote entire config, breaking SSL

### What Worked
- Restoring from infra-nginx configs
- Using exact file names nginx expected
- Removing conflicting configurations
- Proper symlink creation

## Lessons Learned

### 1. Do What Is Asked, Nothing More
- When told to "copy green to blue", I modified instead of copying exactly
- User specifically called out: "Why did you not copy green to blue and say you did?"
- Should have used literal `cp` command

### 2. Truth Testing
- Tested for `<title>` tags instead of actual content "Questions Found"
- HTTP 200 doesn't mean it's working correctly
- Must test the specific user-visible behavior

### 3. Blast Radius
- Never assume changes are isolated
- Shared infrastructure means all environments affected
- Production should never be touched when working on development

### 4. Recovery Over Debugging
- During live show, immediate restoration is priority
- Use backups first, debug later
- Every second of downtime matters

## Prevention Measures

### Immediate
1. Added QA test ticket for Growth → Questions regression testing
2. Created test script for nginx routing verification
3. Documented incident for future reference

### Recommended
1. Separate nginx instances per environment
2. Automated tests for critical routes after deployment
3. Pre-deployment validation of nginx configs
4. Clear environment separation in infrastructure

## Key Takeaways
- **Follow instructions exactly** - No improvements, no assumptions
- **Test actual behavior** - Not proxy metrics
- **Understand blast radius** - Know what else will be affected
- **Quick recovery** - Have backups ready, fix fast, debug later
- **Be truthful** - Report what actually happened, not intentions