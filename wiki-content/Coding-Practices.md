# Coding Practices

## 🚀 Deployment Fix Script — Absolute Rules

- **Must run only from GitHub Actions**
- **Never SSH into servers for edits**
- **Never make assumptions or guesses** — all actions must be research-verified
- **Always include friendly success logs** (✨💖⭐)
- **Never include auto-generated tags** (e.g. "🤖 Generated with…", unwanted co-author lines)
- **Commit messages must be explicit and clear** (e.g. `fix: deployment script`)
- **Prepare for multiple environments**: update scripts and use GitHub for deployment

## 🧼 Clean Code — Absolutes

- **Scripts must be short, single-purpose, and clearly named**
- **No hard-coded repos, IPs, or secrets** — always use environment variables
- **Fail fast**: `set -euo pipefail` (shell) or proper try/catch (Node)
- **One workflow only**: GitHub Actions is the single source of truth
- **Remove dead code and outdated comments**
- **Logs must explain actions without noise or redundancy**
- **Simplicity is mandatory** — if one workflow works, do not add layers
- **Do not create new files**; edit and update current files

## 🔍 Server Access — Absolutes

- ✅ **You may check servers**
- ❌ **You must not edit servers directly**

## 📄 Claude.md — Update Rules

- **Remove outdated content immediately**
- **Run tests after every push**
- **Always include test logs in the workflow output**
- **Run PlayClone tests when applicable**
- **Do not promote or announce success unless logs confirm zero errors**
- **On verified success, log**: 
  ```
  ✨ This release has been successfully deployed to <environment> and is clear of errors. Enjoy testing. ✨
  ```

## 📝 Commit Message Format

```
feat: add new feature
fix: resolve specific bug
docs: update documentation
style: format code
refactor: improve code structure
test: add test coverage
chore: update dependencies
```

## 🎯 Key Principles

1. **Research First**: Never guess. Always verify before implementing.
2. **GitHub Actions Only**: All deployments through automated workflows.
3. **Clean & Simple**: If it works simply, don't add complexity.
4. **Explicit Communication**: Clear commit messages and logs.
5. **Test Everything**: Verify success before declaring completion.

[[Home]] | [[Development-Workflow]] | [[Deployment-Guide]]