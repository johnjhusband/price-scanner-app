# Working with Claude - Tips & Tricks

## 🚀 Quick Start

### Always Start Here
```bash
cd ~/Documents/FlippiMaster/price-scanner-app
```

This is your primary working directory. Claude may default to other locations, but FlippiMaster is where all development happens.

## 📋 Essential Files to Read

When starting a new Claude session, have Claude read these files:

1. **CLAUDE.md** - Core directives and rules
   ```
   Read CLAUDE.md
   ```

2. **Current Memory Files** - Recent session context
   ```
   Read MEMORY-2025-09-13-BLUE-BOX-DEPLOYMENT.md
   ```

3. **Wiki TODO** - Pending tasks
   ```
   Read wiki-content/WIKI-UPLOAD-TODO.md
   ```

## 🎯 Best Practices

### 1. Clear Instructions
- **DO**: "Create a blue box on the home page"
- **DON'T**: "Can you maybe add something blue somewhere?"

### 2. Verify Directory
Claude sometimes resets to wrong directories:
```bash
# If you see: "Shell cwd was reset to /Users/flippi/Desktop/fotoflip"
# Always redirect:
cd ~/Documents/FlippiMaster/price-scanner-app
```

### 3. Use Slash Commands
- `/compact` - Compress conversation when it gets long
- Type slash to see available commands

### 4. File Operations
- **ALWAYS** prefer editing existing files over creating new ones
- **NEVER** create documentation unless explicitly asked
- **CHECK** file exists before editing

## 💡 Claude-Specific Commands

### Navigation
```bash
# Always use absolute paths
cd ~/Documents/FlippiMaster/price-scanner-app

# Don't use relative paths that might fail
cd ../../../whatever  # ❌
```

### Reading Files
```
# Good - specific file
Read backend/server.js

# Better - with line numbers
Read backend/server.js lines 100-200

# Best - multiple files at once
Read these files:
- CLAUDE.md
- package.json
- backend/routes/auth.js
```

### Git Operations
```bash
# Check status first
git status

# Work only in develop branch
git checkout develop

# Commit with clear messages
git add .
git commit -m "fix: specific description"
git push origin develop
```

## 🔧 Common Issues & Solutions

### Issue: Wrong Directory
**Symptom**: Commands run in fotoflip instead of FlippiMaster
```bash
# Solution: Use absolute paths in commands
cd ~/Documents/FlippiMaster/price-scanner-app && npm test
```

### Issue: Creating Unwanted Files
**Symptom**: Claude creates README files or docs
```
# Solution: Be explicit
"Update the existing API.md file" ✅
"Document the API" ❌ (might create new files)
```

### Issue: Git Push Failures
**Symptom**: "refusing to allow an OAuth App to create or update workflow"
```bash
# Solution: Never include .github/workflows/ in commits
git reset HEAD .github/workflows/
git commit --amend
```

## 📝 Communication Style

### What Claude Responds Best To

1. **Direct Commands**
   - "Fix bug #123"
   - "Deploy to blue environment"
   - "Run tests and show results"

2. **Contextual Requests**
   - "Using the existing auth system, add a logout button"
   - "Following our coding standards, implement feature X"

3. **Verification Steps**
   - "First, check if the file exists"
   - "After making changes, run the tests"

### What to Avoid

1. **Vague Requests**
   - "Make it better" ❌
   - "Improve performance of API endpoint" ✅

2. **Assumptions**
   - "You probably know where this is" ❌
   - "Check backend/routes/api.js line 50" ✅

## 🏗️ Project-Specific Knowledge

### Key Directories
```
~/Documents/FlippiMaster/
├── price-scanner-app/     # Main application
├── playclone/            # Browser automation tool
└── plugin-storage/       # Temporary storage
```

### Environment Rules
- **Blue**: Deploy to develop branch → blue.flippi.ai
- **Green**: Deploy to staging branch → green.flippi.ai  
- **Production**: Deploy to master → app.flippi.ai

### Critical Rules
1. **NEVER SSH to make changes** - Only use Git
2. **NEVER create PRs between branches** - Direct push only
3. **ALWAYS test locally first** - Before pushing
4. **FOLLOW the coding practices** - Read Coding-Practices.md

## 🛠️ Productivity Hacks

### 1. Batch Operations
```
# Instead of multiple commands:
Read file1.js
Read file2.js
Read file3.js

# Use one command:
Read these files: file1.js, file2.js, file3.js
```

### 2. Use TodoWrite Tool
Claude has a todo tracking tool - use it for complex tasks:
- Automatically tracks progress
- Prevents forgetting steps
- Shows what's been completed

### 3. Context Preservation
Before ending session:
1. Create a memory file
2. Update CLAUDE.md if needed
3. Document any blockers

### 4. Quick Checks
```bash
# Verify you're in right place
pwd

# Check recent changes
git log --oneline -5

# See what's modified
git status
```

## 🚨 Emergency Commands

### If Claude Gets Stuck
```bash
# Reset to known state
cd ~/Documents/FlippiMaster/price-scanner-app
git status
pwd
```

### If Changes Break Something
```bash
# Revert last commit
git revert HEAD

# Or reset to previous state
git reset --hard HEAD~1
```

### If Deployment Fails
```bash
# Check GitHub Actions
# Don't try to fix on server!
# Fix in code and redeploy
```

## 📚 Required Reading

For new features, always read:
1. **Architecture.md** - System design
2. **Development-Workflow.md** - How to develop
3. **Coding-Practices.md** - Team standards
4. **CLAUDE.md** - AI assistant rules

## 🎯 Session Checklist

### Starting a Session
- [ ] Navigate to FlippiMaster
- [ ] Read CLAUDE.md
- [ ] Check git status
- [ ] Read any MEMORY files
- [ ] Check for urgent issues

### During Work
- [ ] Stay in correct directory
- [ ] Test changes locally
- [ ] Follow coding standards
- [ ] Update documentation
- [ ] Commit frequently

### Ending a Session
- [ ] Push all changes
- [ ] Create memory file if needed
- [ ] Update todo lists
- [ ] Document blockers
- [ ] Clean up test files

## 💬 Magic Phrases

These phrases help Claude work better:

- "Research this first, don't guess"
- "Check if the file exists before editing"
- "Follow the existing patterns in the codebase"
- "Test this locally before pushing"
- "Update the existing file, don't create a new one"
- "Use the exact same style as surrounding code"

## 🔗 Related Pages

- [[CLAUDE.md]] - Core rules and directives
- [[Coding-Practices]] - Team coding standards
- [[Development-Workflow]] - Development process
- [[Common-Issues]] - Troubleshooting guide

---

Remember: Claude works best with clear, specific instructions and proper context. Always start in the right directory and be explicit about what you want.

[[Home]] | [[Development-Workflow]] | [[Coding-Practices]]