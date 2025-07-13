# GitHub Automation Guide

## How the Automated Test & Close System Works

### 1. **Implementing a Feature**

When you create a PR or commit, use these keywords:

```
# This links but doesn't auto-close:
git commit -m "Implements #24 - Add price analysis feature"

# Or in PR description:
"This PR implements #24"
```

### 2. **Automatic Testing**

The workflow runs:
- On every push to main
- On every PR
- Every hour (scheduled)
- On manual trigger

### 3. **If Tests Pass**

The system will:
1. Find issues mentioned with "Implements #"
2. Add a success comment with test results
3. Close the issue automatically

### 4. **If Tests Fail**

The system will:
1. Create a new issue describing the failure
2. Include debugging information
3. Keep original issue open

## Example Workflow

```bash
# 1. Create a branch for issue #24
git checkout -b implement-issue-24

# 2. Make changes
# ... edit code ...

# 3. Commit with "Implements #24"
git add .
git commit -m "Implements #24 - Add price analysis feature"

# 4. Push
git push origin implement-issue-24

# 5. Create PR
gh pr create --title "Add price analysis" --body "This PR implements #24"

# 6. Tests run automatically
# If pass → Issue #24 closes with success message
# If fail → New issue created with failure details
```

## Keywords That Work

**To link without closing:**
- `Implements #24`
- `Addresses #24`
- `Relates to #24`

**To close immediately (not recommended):**
- `Fixes #24`
- `Closes #24`
- `Resolves #24`

## Manual Testing

You can trigger tests manually:

```bash
# Using GitHub CLI
gh workflow run test-verify-close.yml -f environment=green

# Or from GitHub UI
# Actions → Test, Verify, and Close Issues → Run workflow
```

## Monitoring

The workflow runs every hour to check both environments. If a deployed feature breaks later, it will:
1. Create a new issue
2. Reference the original feature
3. Alert that something regressed

## Best Practices

1. **Use "Implements #" during development**
2. **Let tests verify before closing**
3. **One issue per PR when possible**
4. **Check Actions tab for test results**

## Configuration

The workflow uses these test commands:
```bash
# Tests run with environment variable
TEST_ENV=green npx playwright test

# Or for blue
TEST_ENV=blue npx playwright test
```

Make sure your tests respect the `TEST_ENV` variable to test the right environment.