# GitHub Actions Workflows Certification and Security Guide

## Table of Contents
1. [GitHub Actions Certification](#github-actions-certification)
2. [Workflow Security Best Practices](#workflow-security-best-practices)
3. [Permission Management](#permission-management)
4. [Flippi.ai Workflow Analysis](#flippiai-workflow-analysis)
5. [OAuth App Limitations](#oauth-app-limitations)
6. [Troubleshooting Guide](#troubleshooting-guide)

## GitHub Actions Certification

### Official GitHub Actions Certification

GitHub offers an official **GitHub Actions** certification that validates proficiency in automating workflows, CI/CD pipelines, and development acceleration.

#### Certification Details
- **Provider**: GitHub (Microsoft)
- **Target Audience**: DevOps engineers, software developers, IT professionals
- **Level**: Intermediate
- **Format**: Proctored exam with interactive components
- **Retake Policy**: 24 hours after first attempt

#### Exam Topics
1. **Workflow Creation**
   - YAML syntax and structure
   - Triggers and events
   - Jobs and steps
   - Conditional execution

2. **Automation**
   - Build automation
   - Test automation
   - Deployment automation
   - Release management

3. **CI/CD Pipeline Management**
   - Pipeline design
   - Artifact management
   - Environment management
   - Secret management

#### Preparation Resources
- **Microsoft Learn**: Self-paced browser-based training
- **Study Guide**: Official exam topics and resources
- **Practice Exams**: 240+ questions aligned with 2025 exam
- **GitHub Skills**: 30-60 minute practical exercises
- **Contact**: gh-certification@github.com

## Workflow Security Best Practices

### 1. GITHUB_TOKEN Permissions (Critical)

**Always use least-privilege permissions:**

```yaml
# Workflow-level permissions (recommended)
name: Deploy Development
permissions:
  contents: read    # Read repository content
  actions: read     # Read workflow runs
  
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
```

**Repository settings (recommended):**
- Settings → Actions → Workflow permissions
- Select "Read repository contents permission"

### 2. Secure Workflow Triggers

```yaml
# SAFE: Pull requests from forks have read-only access
on:
  pull_request:
    branches: [main]

# DANGEROUS: Has write access and secrets
on:
  pull_request_target:  # Use with extreme caution
    branches: [main]
```

### 3. Third-Party Actions Security

```yaml
# Pin to specific versions (SHA recommended)
steps:
  - uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11 # v4.1.1
  
  # Or at least use version tags
  - uses: actions/setup-node@v4
    with:
      node-version: '18'
```

### 4. Secret Management

```yaml
# Use environment secrets with protection
jobs:
  deploy:
    environment: production  # Requires approval
    steps:
      - run: echo "Deploying with secret"
        env:
          API_KEY: ${{ secrets.API_KEY }}
```

**Best practices:**
- Never hardcode secrets
- Rotate secrets periodically
- Use environment protection rules
- Implement required reviewers

### 5. OpenID Connect (OIDC)

```yaml
# Credential-less authentication (2025 best practice)
jobs:
  deploy:
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789:role/GitHubActions
          aws-region: us-east-1
```

### 6. CodeQL Security Analysis (2025 Feature)

```yaml
# Automatic workflow security scanning
name: CodeQL Analysis
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  analyze:
    runs-on: ubuntu-latest
    permissions:
      actions: read
      contents: read
      security-events: write
    
    steps:
      - uses: actions/checkout@v4
      - uses: github/codeql-action/init@v3
        with:
          languages: javascript
      - uses: github/codeql-action/analyze@v3
```

## Permission Management

### Understanding Workflow Permissions

```yaml
# Permissions hierarchy
permissions:
  actions: read/write         # Workflow runs and artifacts
  checks: read/write          # Check runs and suites
  contents: read/write        # Repository contents
  deployments: read/write     # Deployment status
  issues: read/write          # Issues and comments
  packages: read/write        # GitHub Packages
  pages: read/write           # GitHub Pages
  pull-requests: read/write   # Pull requests
  security-events: read/write # Code scanning alerts
  statuses: read/write        # Commit statuses
```

### OAuth App Limitations

**Critical: OAuth Apps cannot modify workflow files**

```bash
# This error occurs when pushing workflow changes via OAuth
! [remote rejected] develop -> develop 
(refusing to allow an OAuth App to create or update workflow 
`.github/workflows/deploy-develop.yml` without `workflow` scope)
```

**Solutions:**
1. Use Personal Access Token (PAT) with workflow scope
2. Make workflow changes via GitHub web UI
3. Use GitHub App instead of OAuth App
4. Separate workflow changes from code changes

## Flippi.ai Workflow Analysis

### Current Workflow Structure

```yaml
name: Deploy Development
on:
  push:
    branches: [develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to blue.flippi.ai
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: 157.245.142.145
          username: root
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/blue.flippi.ai
            git reset --hard HEAD
            git clean -fd
            git fetch origin develop
            git reset --hard origin/develop
            cd backend && npm install --production
            cd ../mobile-app && npm install
            npx expo export --platform web --output-dir dist
            pm2 restart dev-backend dev-frontend
            nginx -s reload
```

### Security Improvements Needed

1. **Add explicit permissions:**
```yaml
permissions:
  contents: read
```

2. **Pin action versions:**
```yaml
- uses: appleboy/ssh-action@b5e18e2b8f9e7c2d88e0d9f8c2a7e8d9f0a1b2c3 # v0.1.5
```

3. **Add timeout:**
```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 10
```

4. **Environment protection:**
```yaml
jobs:
  deploy:
    environment: development
    # Add protection rules in repository settings
```

## OAuth App Limitations

### The Workflow Permission Problem

OAuth Apps have a fundamental limitation with GitHub Actions:

1. **Cannot modify `.github/workflows/` files**
2. **Even with "full repo" scope**
3. **Security measure to prevent workflow injection**
4. **No workaround exists**

### Alternative Solutions

#### 1. Personal Access Token (Classic)
```bash
# Create token with workflow scope
git remote set-url origin https://PAT@github.com/owner/repo.git
git push origin main
```

#### 2. GitHub CLI with auth refresh
```bash
# Authenticate with workflow scope
gh auth login --scopes repo,workflow
gh auth refresh --scopes repo,workflow
```

#### 3. Fine-grained Personal Access Token
- Repository permissions → Actions → Read/Write
- Repository permissions → Contents → Read/Write
- Repository permissions → Metadata → Read

#### 4. GitHub App
- Create GitHub App with workflow permissions
- More secure than OAuth App
- Can modify workflow files

## Troubleshooting Guide

### 1. Workflow Not Triggering

```yaml
# Check branch names match exactly
on:
  push:
    branches: [develop]  # Not 'development' or 'dev'
```

### 2. Permission Denied Errors

```yaml
# Add required permissions
permissions:
  contents: write  # For pushing commits
  pull-requests: write  # For PR operations
```

### 3. Timeout Issues

```yaml
# Set appropriate timeouts
jobs:
  deploy:
    timeout-minutes: 10  # Default is 360
    steps:
      - name: Long running step
        timeout-minutes: 5
        run: ./deploy.sh
```

### 4. Secret Not Found

```bash
# Verify secret exists
gh secret list

# Check environment secrets
gh secret list --env production
```

### 5. Debugging Workflows

```yaml
# Enable debug logging
env:
  ACTIONS_RUNNER_DEBUG: true
  ACTIONS_STEP_DEBUG: true

# Or use workflow_dispatch for testing
on:
  workflow_dispatch:
    inputs:
      debug:
        description: 'Enable debug mode'
        type: boolean
        default: false
```

## Best Practices Summary

1. **Always use least-privilege permissions**
2. **Pin action versions to SHA**
3. **Rotate secrets regularly**
4. **Use environments for protection**
5. **Enable CodeQL scanning**
6. **Implement manual approval for production**
7. **Use OIDC when possible**
8. **Separate workflow changes from code**
9. **Monitor workflow runs**
10. **Document security decisions**

## Resources

- [GitHub Actions Documentation](https://docs.github.com/actions)
- [GitHub Certifications](https://examregistration.github.com/)
- [Security Hardening Guide](https://docs.github.com/actions/security-guides)
- [Workflow Syntax Reference](https://docs.github.com/actions/reference/workflow-syntax-for-github-actions)
- [GitHub Skills](https://skills.github.com/)