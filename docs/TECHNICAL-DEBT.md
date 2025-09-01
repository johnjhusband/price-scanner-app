# Technical Debt Prevention Guide

## Principles

1. **No Quick Fixes**
   - Quick fixes create hidden problems that compound over time
   - Always solve the root cause, not the symptom
   - If a workaround is needed, document it clearly with a plan to fix properly

2. **Fix Problems at the Source**
   - Line ending issues should be fixed in the source file, not on the server
   - Configuration should be correct from the start, not patched later
   - Scripts should be tested locally before deployment

3. **Proper Testing Before Deployment**
   - Test scripts on the target OS before copying
   - Verify file formats and encodings match the target system
   - Check all dependencies are available

4. **Clear Separation of Concerns**
   - Server setup files should not conflict with application files
   - Infrastructure code should be separate from application code
   - Each component should have a clear, non-overlapping purpose

5. **Comprehensive Tracking**
   - Every action taken should be tracked
   - Every file created should be documented
   - Uninstall processes should be complete and reliable

## Common Technical Debt Patterns to Avoid

### 1. Line Ending Issues
**Wrong Way**: Run dos2unix on the server after copying
**Right Way**: Ensure files have correct line endings in the repository

### 2. Directory Conflicts
**Wrong Way**: Add logic to handle non-empty directories
**Right Way**: Use separate directories for different purposes

### 3. Missing Tracking
**Wrong Way**: Hope the uninstall script catches everything
**Right Way**: Track every single change during installation

### 4. Hardcoded Fixes
**Wrong Way**: Add workarounds for specific environments
**Right Way**: Make scripts portable and environment-aware from the start

### 5. Incomplete Cleanup
**Wrong Way**: Leave remnants and assume they won't cause issues
**Right Way**: Ensure complete removal of all components

## Current Technical Debt Items

1. **Line Endings in Scripts**
   - Issue: Scripts created on macOS have CRLF line endings
   - Solution: Configure git to handle line endings properly
   - Status: To be fixed

2. **Directory Structure Conflict**
   - Issue: Setup script creates files in /var/www/blue.flippi.ai where the app will be cloned
   - Solution: Separate infrastructure files from application directory
   - Status: To be fixed

## Prevention Strategies

1. **Use .gitattributes**
   - Ensure consistent line endings across all platforms
   - Force LF line endings for shell scripts

2. **Separate Infrastructure Directory**
   - Keep setup files in /opt/flippi or similar
   - Keep application files in /var/www/

3. **Automated Testing**
   - Test scripts in CI/CD before deployment
   - Verify clean install and uninstall

4. **Code Reviews**
   - Review all infrastructure changes
   - Check for potential conflicts and debt

## Commitment

By following these principles, we ensure:
- Clean, maintainable infrastructure
- Predictable deployments
- Easy troubleshooting
- No hidden surprises for future maintainers