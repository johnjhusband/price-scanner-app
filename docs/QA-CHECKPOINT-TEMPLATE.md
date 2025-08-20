# QA Checkpoint Template

Use this template after completing each development chunk to track progress and maintain clear communication.

## Checkpoint: [Feature/Step Name]

**Date**: [YYYY-MM-DD HH:MM]  
**Issue**: #[Issue Number] - [Issue Title]  
**Status**: ✅ Complete / 🔄 In Progress / ❌ Blocked  

### Changes Made
- [ ] [Specific change 1]
- [ ] [Specific change 2]
- [ ] [Specific change 3]

### Files Modified
- `path/to/file1.js` - [Brief description of changes]
- `path/to/file2.js` - [Brief description of changes]

### Testing Performed
- [ ] Unit tests pass
- [ ] Feature works as expected
- [ ] No regressions in existing functionality
- [ ] Tested on environment: [blue/green/app]

### Evidence
- Screenshot/recording: [If applicable]
- Test command output: [If applicable]

### Next Steps
1. [Next immediate task]
2. [Following task]

### Commit Reference
- Commit: `[commit hash]`
- Tag: `qa-checkpoint-[feature]-[step]`

### Notes/Blockers
[Any additional context, issues encountered, or help needed]

---

## Example Usage

### Checkpoint: Share Image Layout - Title Position Update

**Date**: 2025-08-15 17:30  
**Issue**: #155 - P0 URGENT: Update Share Image Layout for Whatnot Marketing  
**Status**: ✅ Complete  

### Changes Made
- [x] Moved title 0.5 inch (48px) lower
- [x] Adjusted brand text position accordingly
- [x] Verified 75% image height maintained

### Files Modified
- `mobile-app/App.js` - Updated generateShareImage function title positioning

### Testing Performed
- [x] Built web app successfully
- [x] Share image generates with new layout
- [x] Title appears in correct position
- [x] All text remains visible

### Next Steps
1. Condense market info and eco info sections
2. Update CTA styling

### Commit Reference
- Commit: `abc123def`
- Tag: `qa-checkpoint-share-image-title`

### Notes/Blockers
None - ready for next chunk