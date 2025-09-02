# Small-Chunk & Checkpoint Workflow

## Overview
This document outlines the Small-Chunk & Checkpoint workflow designed to prevent session timeouts, reduce interruptions, and avoid losing progress during QA and development sessions.

## Core Principles

### 1. Break Down Large Tasks
Transform complex tasks into smaller, manageable chunks that can be completed independently.

**❌ Bad Example:**
```
"Implement complete user authentication system with OAuth, JWT, and user management"
```

**✅ Good Example:**
```
1. "Create user database schema"
2. "Add JWT token generation endpoint"
3. "Implement OAuth provider integration"
4. "Add user profile management API"
5. "Create authentication middleware"
```

### 2. One Feature, One File, One Commit
Each development chunk should focus on a single feature or fix, affecting minimal files.

**Benefits:**
- Easier code review
- Simpler rollback if needed
- Clear commit history
- Reduced merge conflicts

## Workflow Steps

### Step 1: Task Decomposition
Before starting any work, break down the task:

```markdown
## Task: Add FotoFlip Photo Feature

### Chunks:
1. [ ] Create database schema for photo metadata
2. [ ] Implement image upload API endpoint
3. [ ] Add background removal service
4. [ ] Create frontend upload component
5. [ ] Add image processing queue
6. [ ] Implement result display
```

### Step 2: Checkpoint Planning
Define checkpoints for each chunk:

```markdown
## Checkpoint 1: Database Ready
- Schema created and migrated
- Test data inserted
- Commit: `feat: Add photo metadata schema`
- Tag: `checkpoint-fotoclip-db-v1`

## Checkpoint 2: API Functional
- Upload endpoint working
- File validation complete
- Commit: `feat: Add photo upload API`
- Tag: `checkpoint-fotoclip-api-v1`
```

### Step 3: Implementation Pattern

#### 3.1 Start Small
```bash
# Begin with the smallest possible working implementation
echo "Starting chunk: Database schema creation"
```

#### 3.2 Test Immediately
```bash
# Test each chunk before moving forward
npm test -- --testPathPattern=schema
```

#### 3.3 Commit Early
```bash
# Commit as soon as chunk is functional
git add -A
git commit -m "feat: Add photo metadata schema for FotoFlip

- Added photos table with metadata fields
- Created indexes for performance
- Added foreign keys to users table

Part of #175"
```

#### 3.4 Tag Checkpoints
```bash
# Tag significant milestones
git tag -a "checkpoint-fotoclip-db-v1" -m "Database schema complete and tested"
```

#### 3.5 Push Frequently
```bash
# Push to remote after each checkpoint
git push origin develop --tags
```

## QA Checkpoint Template

Use this template after each chunk completion:

```markdown
## QA Checkpoint: [Chunk Name]

**Completed at:** [Timestamp]
**Chunk:** [Description]
**Files Changed:** [List files]
**Tests Passed:** [Yes/No]
**Commit Hash:** [Hash]
**Tag:** [checkpoint-name]

### Work Summary:
- [What was implemented]
- [Key decisions made]
- [Any issues encountered]

### Next Steps:
- [What comes next]
- [Any blockers]

**Ready to proceed?** [ ] QA Approved
```

## Git Tag Naming Convention

### Format
`checkpoint-[feature]-[component]-v[number]`

### Examples
- `checkpoint-auth-schema-v1`
- `checkpoint-auth-api-v2`
- `checkpoint-fotoclip-frontend-v1`
- `checkpoint-bugfix-replica-v1`

### Rules
1. Use lowercase only
2. Separate words with hyphens
3. Include feature name
4. Include component/layer
5. Version incrementally

## Progress Tracking with TodoWrite

### Setup Todos with Granular Tasks
```javascript
todos: [
  {
    id: "1",
    content: "Create user schema (15 min)",
    status: "pending",
    priority: "high"
  },
  {
    id: "2", 
    content: "Add email validation (10 min)",
    status: "pending",
    priority: "medium"
  }
]
```

### Update Immediately
- Mark as `in_progress` when starting
- Mark as `completed` immediately after finishing
- Add new todos if scope changes

## Avoiding Timeouts

### 1. Limit Tool Usage
```javascript
// ❌ Bad: Multiple heavy operations
await Promise.all([
  generateCompleteAPI(),
  runAllTests(),
  deployToProduction()
]);

// ✅ Good: Sequential small operations
await createEndpoint();
await testEndpoint();
await commitChanges();
```

### 2. Batch File Operations
```javascript
// ❌ Bad: Many individual edits
Edit file1.js
Edit file2.js
Edit file3.js

// ✅ Good: Use MultiEdit for related changes
MultiEdit with coordinated changes
```

### 3. Summarize Frequently
After each chunk:
- Provide brief summary
- List what was completed
- State what's next
- Wait for acknowledgment

## Emergency Recovery

### If Session Times Out
1. Check last commit: `git log -1`
2. Review last tag: `git describe --tags`
3. Check todo status in `.ralph-state.json`
4. Resume from last checkpoint

### Recovery Commands
```bash
# Check current state
git status
git log --oneline -5

# Find last checkpoint
git tag -l "checkpoint-*" | tail -5

# Review changes since checkpoint
git diff checkpoint-feature-api-v2

# If needed, create recovery commit
git add -A
git commit -m "chore: Recovery checkpoint after timeout"
```

## Best Practices

### Do's
- ✅ Commit after every working feature
- ✅ Write descriptive commit messages
- ✅ Test before committing
- ✅ Use meaningful checkpoint tags
- ✅ Keep changes focused
- ✅ Document decisions in commits

### Don'ts
- ❌ Bundle unrelated changes
- ❌ Make massive commits
- ❌ Skip testing to save time
- ❌ Work for hours without committing
- ❌ Ignore failing tests
- ❌ Assume state persists between sessions

## Example Workflow

### Task: Fix Growth Route Redirect Issue (#156)

#### 1. Decomposition
```
Chunk 1: Diagnose current routing
Chunk 2: Fix nginx configuration
Chunk 3: Update backend route handler
Chunk 4: Add tests
Chunk 5: Verify on staging
```

#### 2. Implementation
```bash
# Chunk 1
echo "Analyzing routing issue..."
# Investigation work
git commit -m "docs: Document growth route redirect issue"
git tag checkpoint-growth-diagnosis-v1

# Chunk 2
# Edit nginx config
git commit -m "fix: Update nginx routing for growth pages"
git tag checkpoint-growth-nginx-v1

# Continue for each chunk...
```

#### 3. QA Checkpoint
```markdown
## QA Checkpoint: Growth Route Fix

**Completed at:** 2025-01-02 14:30
**Chunk:** Nginx configuration update
**Files Changed:** nginx/blue.flippi.ai.conf
**Tests Passed:** Yes
**Commit Hash:** abc123
**Tag:** checkpoint-growth-nginx-v1

### Work Summary:
- Updated location blocks for /growth routes
- Removed incorrect proxy_pass
- Added proper backend routing

### Next Steps:
- Update backend route handler
- Test on staging environment

**Ready to proceed?** [X] QA Approved
```

## Metrics for Success

Track these metrics to measure workflow effectiveness:

1. **Average chunk completion time**: Target < 30 minutes
2. **Commits per session**: Target 3-5
3. **Timeout incidents**: Target 0
4. **Recovery time after timeout**: Target < 5 minutes
5. **Code review time**: Should decrease with smaller commits

## Integration with CI/CD

### Automated Checkpoint Validation
```yaml
# .github/workflows/checkpoint-validation.yml
on:
  push:
    tags:
      - 'checkpoint-*'
    
jobs:
  validate:
    steps:
      - name: Run tests
      - name: Check code quality
      - name: Deploy to staging
```

## Conclusion

The Small-Chunk & Checkpoint workflow ensures:
- **Reliability**: Progress is never lost
- **Visibility**: Clear tracking of work
- **Quality**: Each chunk is tested
- **Efficiency**: Quick recovery from interruptions
- **Collaboration**: Easy QA and review process

By following this workflow, development sessions become more predictable, manageable, and successful.