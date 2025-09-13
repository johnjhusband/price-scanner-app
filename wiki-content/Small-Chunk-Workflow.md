# Small-Chunk & Checkpoint Workflow

## 🎯 Overview

A development methodology designed to prevent session timeouts, reduce interruptions, and avoid losing progress. Essential for working with AI assistants and long development sessions.

## 🔑 Core Principles

### 1. Break Down Large Tasks
Transform complex features into bite-sized chunks that can be completed in 15-30 minutes.

**❌ Bad:**
```
"Implement complete user authentication system"
```

**✅ Good:**
```
1. Create user database schema (15 min)
2. Add JWT token generation (20 min)
3. Implement login endpoint (15 min)
4. Add auth middleware (20 min)
5. Create user profile API (15 min)
```

### 2. One Feature, One File, One Commit
Each chunk should:
- Focus on single functionality
- Modify minimal files
- Be independently testable
- Create clear commit history

## 📋 Workflow Steps

### Step 1: Task Decomposition
```markdown
## Task: Add Photo Upload Feature

### Chunks:
1. [ ] Create database schema (15 min)
2. [ ] Add upload endpoint (20 min)
3. [ ] Implement validation (15 min)
4. [ ] Create UI component (25 min)
5. [ ] Add progress tracking (15 min)
6. [ ] Write tests (20 min)
```

### Step 2: Checkpoint Planning
```markdown
## Checkpoint 1: Database Ready
- Schema created ✓
- Migration run ✓
- Test data added ✓
- Commit: `feat: add photo metadata schema`
- Tag: `checkpoint-photo-db-v1`
```

### Step 3: Implementation Pattern

#### 1. Start Small
```bash
echo "Starting: Database schema creation"
# Implement minimal working version
```

#### 2. Test Immediately
```bash
npm test -- schema.test.js
# Verify it works before proceeding
```

#### 3. Commit Early
```bash
git add -A
git commit -m "feat: add photo metadata schema

- Added photos table
- Created indexes
- Added foreign keys

Part of #175"
```

#### 4. Tag Checkpoints
```bash
git tag -a "checkpoint-photo-db-v1" -m "Database complete"
```

#### 5. Push Frequently
```bash
git push origin develop --tags
```

## 🏷️ Git Tag Convention

### Format
`checkpoint-[feature]-[component]-v[number]`

### Examples
- `checkpoint-auth-schema-v1`
- `checkpoint-upload-api-v2`
- `checkpoint-bugfix-button-v1`

## 📝 QA Checkpoint Template

Use after each chunk:

```markdown
## QA Checkpoint: [Chunk Name]

**Time:** 2025-01-15 14:30
**Chunk:** Database schema
**Files:** schema.sql, migration.js
**Tests:** ✅ Passed (3/3)
**Commit:** abc123
**Tag:** checkpoint-photo-db-v1

### Summary:
- Created photos table
- Added performance indexes
- Set up relationships

### Next:
- Upload endpoint
- No blockers

**QA Status:** ✅ Approved
```

## ⏱️ Avoiding Timeouts

### Do Small Operations
```javascript
// ❌ Bad: Heavy parallel operations
await Promise.all([
  generateCompleteAPI(),
  runAllTests(),
  deployEverything()
]);

// ✅ Good: Sequential small tasks
await createEndpoint();
await testEndpoint();
await commitChanges();
```

### Batch File Edits
```javascript
// ❌ Bad: Many individual edits
Edit file1.js
Edit file2.js
Edit file3.js

// ✅ Good: Use MultiEdit
MultiEdit files with related changes
```

### Regular Check-ins
After each chunk:
1. Summarize what was done
2. State what's next
3. Wait for acknowledgment
4. Continue or pause

## 🚨 Emergency Recovery

### If Session Times Out

1. **Check Last Commit**
   ```bash
   git log -1 --oneline
   ```

2. **Find Last Checkpoint**
   ```bash
   git tag -l "checkpoint-*" | tail -5
   ```

3. **Review Changes**
   ```bash
   git diff checkpoint-feature-api-v2
   ```

4. **Create Recovery Point**
   ```bash
   git add -A
   git commit -m "chore: recovery checkpoint"
   ```

## 📊 Progress Tracking

### With TodoWrite Tool
```javascript
todos: [
  {
    id: "1",
    content: "Create schema (15 min)",
    status: "completed",
    priority: "high"
  },
  {
    id: "2",
    content: "Add API endpoint (20 min)",
    status: "in_progress",
    priority: "high"
  }
]
```

### Update Immediately
- Mark `in_progress` when starting
- Mark `completed` when done
- Add new todos if scope changes

## ✅ Best Practices

### Do's
- ✅ Commit after each working feature
- ✅ Write descriptive messages
- ✅ Test before committing
- ✅ Use meaningful tags
- ✅ Keep changes focused
- ✅ Document decisions

### Don'ts
- ❌ Bundle unrelated changes
- ❌ Make massive commits
- ❌ Skip tests to save time
- ❌ Work hours without commits
- ❌ Ignore failing tests

## 🎯 Real Example

### Task: Fix Button Not Responding (#147)

#### Chunks:
1. **Diagnose Issue** (10 min)
   ```bash
   git commit -m "debug: add button click logging"
   git tag checkpoint-button-debug-v1
   ```

2. **Fix Z-index** (15 min)
   ```bash
   git commit -m "fix: increase button z-index"
   git tag checkpoint-button-fix-v1
   ```

3. **Add Tests** (20 min)
   ```bash
   git commit -m "test: add button interaction tests"
   git tag checkpoint-button-test-v1
   ```

4. **Update Docs** (10 min)
   ```bash
   git commit -m "docs: update button troubleshooting"
   git tag checkpoint-button-docs-v1
   ```

## 📈 Success Metrics

Track effectiveness:
- **Chunk completion**: < 30 minutes
- **Commits per session**: 3-5
- **Timeout incidents**: 0
- **Recovery time**: < 5 minutes
- **Review time**: Decreasing

## 🔄 Integration with CI/CD

### Automated Validation
```yaml
# Runs on checkpoint tags
on:
  push:
    tags:
      - 'checkpoint-*'

jobs:
  validate:
    - run: npm test
    - run: npm run lint
    - deploy: staging
```

## 💡 Why This Works

1. **Progress Never Lost** - Frequent commits
2. **Clear Tracking** - Tags and todos
3. **Quality Assured** - Test each chunk
4. **Quick Recovery** - From any point
5. **Easy Review** - Small, focused changes

## 🔗 Related

- [[Development-Workflow]] - Overall process
- [[Git-Workflow-Rules]] - Git guidelines
- [[Working-with-Claude]] - AI assistant tips

[[Home]] | [[Development-Workflow]] | [[Git-Workflow-Rules]]