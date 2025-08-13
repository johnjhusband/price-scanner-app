# Nginx Configuration Management

## 🚨 OPS RULE: Never edit Nginx on server

- **Deploy via `deploy-nginx.sh` only**
- **If drift is detected, run:** `./restore-nginx.sh <domain>`
- **All changes must be in Git under `/opt/flippi/nginx/`**

## Directory Structure

```
infra-nginx/
├── sites/
│   ├── flippi-blue.conf    # blue.flippi.ai config
│   ├── flippi-green.conf   # green.flippi.ai config
│   └── flippi-prod.conf    # app.flippi.ai config
├── snippets/
│   ├── proxy_defaults.conf # Common proxy settings
│   └── spa_fallback.conf   # SPA fallback config
├── deploy-nginx.sh         # Deployment script
├── restore-nginx.sh        # Restore from Git
└── README.md              # This file
```

## Usage

### Deploy Configuration

```bash
# Deploy to blue environment
./deploy-nginx.sh blue

# Deploy to green (staging) environment
./deploy-nginx.sh green

# Deploy to production
./deploy-nginx.sh prod
```

### Restore Configuration

If someone manually edits nginx on the server:

```bash
# Restore blue.flippi.ai
./restore-nginx.sh blue.flippi.ai

# Restore green.flippi.ai
./restore-nginx.sh green.flippi.ai

# Restore app.flippi.ai
./restore-nginx.sh app.flippi.ai
```

## Features

1. **Git as Source of Truth**: All nginx configs stored in repository
2. **Immutable Configs**: Uses `chattr +i` to prevent accidental edits
3. **Automatic Backup**: Creates timestamped backups before deployment
4. **Smoke Tests**: Validates key endpoints after deployment
5. **Rollback**: Automatically rolls back on failed nginx test

## Server Setup

On each server, clone configs to `/opt/flippi/nginx/`:

```bash
sudo mkdir -p /opt/flippi/nginx
sudo cp sites/*.conf /opt/flippi/nginx/
sudo cp -r snippets /etc/nginx/
```

## Important Routes Order

Routes must be in this order (specific → general):

1. Legal pages (`/terms`, `/privacy`, etc.)
2. OAuth routes (`/auth`)
3. API routes (`/api/`)
4. Health check (`/health`)
5. Growth routes (`/growth`)
6. Admin routes (`/admin`)
7. Value/blog routes (`/value`)
8. Static assets (`/assets/`)
9. SPA catch-all (`/`) - **MUST BE LAST**

## Port Mapping

- **blue.flippi.ai**: Port 3002
- **green.flippi.ai**: Port 3001
- **app.flippi.ai**: Port 3000

## Monitoring

Check `/var/log/nginx-restore.log` for restoration history.

## Troubleshooting

If nginx won't reload:
1. Check `nginx -t` for syntax errors
2. Verify SSL certificates exist
3. Ensure ports are correct for environment
4. Check that snippets are in `/etc/nginx/snippets/`