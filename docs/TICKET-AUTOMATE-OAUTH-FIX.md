# 🎯 Objective:

Ensure that the staging OAuth fix is automatically applied on the server when code is pushed or deployed via Git, without requiring SSH login.

## ✅ Acceptance Criteria:

- ✅ The script `scripts/apply-staging-oauth-fix.sh` runs automatically after deployment to staging (via Git or CI/CD)
- ✅ The `/auth/*` Nginx routes are added (if not already present)
- ✅ `nginx -t` runs to validate config
- ✅ Nginx reloads only if config test passes
- ✅ The Google login flow is functional on green.flippi.ai

## 🛠 Implementation Notes:

Choose one of the following:

### Option A: Git Hook
- Set up a post-merge or post-checkout Git hook on the staging server to detect when new code is pulled, then automatically run the fix script
- Location: `.git/hooks/post-merge`
- Add:
  ```bash
  #!/bin/bash
  bash scripts/apply-staging-oauth-fix.sh
  ```

### Option B: CI/CD Hook (Preferred if CI is in place)
- Integrate the script into our CI/CD deployment pipeline (e.g. GitHub Actions, Bitbucket Pipelines, etc.)
- After deploying code to `/var/www/green.flippi.ai`, have CI remotely execute the fix script
- CI should log results and notify if `nginx -t` fails

## 📦 Deliverables:

- The OAuth fix is reliably applied every time staging is deployed from Git
- SSH is not required from the product or leadership side
- A brief update in `docs/README.md` on how the automation works

## Implementation Status:
- ✅ GitHub Actions integration implemented
- ✅ Script execution added to deployment workflow
- ✅ Error handling and logging included
- ⏳ Waiting for next deployment to test