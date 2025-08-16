# Git Tag Naming Convention for QA Checkpoints

## Overview
This document defines the naming convention for Git tags used during QA checkpoint workflow.

## Tag Format
```
qa-checkpoint-{feature}-{step}[-{sequence}]
```

### Components
- **qa-checkpoint**: Fixed prefix for all QA checkpoint tags
- **{feature}**: Short, descriptive feature name (use hyphens for spaces)
- **{step}**: Current step or milestone within the feature
- **{sequence}**: Optional sequence number if multiple checkpoints for same step

## Examples

### Feature Development
```bash
# Initial database schema created
git tag qa-checkpoint-user-auth-schema

# API endpoints implemented
git tag qa-checkpoint-user-auth-api

# Frontend integration complete
git tag qa-checkpoint-user-auth-frontend

# Bug fix applied
git tag qa-checkpoint-user-auth-bugfix-1
```

### Bug Fixes
```bash
# Initial investigation
git tag qa-checkpoint-bug154-investigation

# Fix implemented
git tag qa-checkpoint-bug154-fix

# Tests added
git tag qa-checkpoint-bug154-tests
```

### Release Preparation
```bash
# Version bump
git tag qa-checkpoint-release006-version

# Changelog updated
git tag qa-checkpoint-release006-changelog

# Final testing
git tag qa-checkpoint-release006-final
```

## Best Practices

1. **Keep names short but descriptive**
   - Good: `qa-checkpoint-share-image-layout`
   - Bad: `qa-checkpoint-update-share-image-layout-for-whatnot-marketing`

2. **Use consistent feature names**
   - If you start with `share-image`, continue using it
   - Don't switch between `share-image` and `image-share`

3. **Tag after successful testing**
   - Only create tags after verifying the checkpoint works
   - Include test results in commit message

4. **Use sequence numbers for iterations**
   - `qa-checkpoint-growth-route-fix-1`
   - `qa-checkpoint-growth-route-fix-2`

## Commands

### Create a tag
```bash
git tag qa-checkpoint-feature-step
git push origin qa-checkpoint-feature-step
```

### List QA checkpoint tags
```bash
git tag -l "qa-checkpoint-*"
```

### Delete a tag (if needed)
```bash
git tag -d qa-checkpoint-feature-step
git push origin :refs/tags/qa-checkpoint-feature-step
```

### Checkout a specific checkpoint
```bash
git checkout qa-checkpoint-feature-step
```

## Integration with QA Process

1. Complete a development chunk
2. Test the changes
3. Commit with descriptive message
4. Create checkpoint tag
5. Push both commit and tag
6. Document in QA checkpoint template
7. Wait for QA confirmation before proceeding

This convention ensures clear tracking of development progress and enables easy rollback to any checkpoint if issues arise.