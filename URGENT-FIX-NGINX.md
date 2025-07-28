# URGENT: Fix Nginx OAuth Routes

Since we can't update GitHub workflows without proper permissions, here's what you need to do:

## Option 1: Quick SSH Fix (2 minutes)

SSH into the server and run these commands:

```bash
# 1. SSH to server
ssh root@157.245.142.145

# 2. Add OAuth routes to staging nginx config
cat >> /etc/nginx/sites-available/green.flippi.ai << 'EOF'

    # OAuth routes
    location /auth {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
EOF

# 3. Test and reload
nginx -t && nginx -s reload
```

## Option 2: Fix GitHub Permissions (5 minutes)

1. Go to: https://github.com/settings/tokens/new
2. Create token with `repo` and `workflow` scopes
3. Clone repo with new token:
   ```bash
   git clone https://<TOKEN>@github.com/johnjhusband/price-scanner-app.git flippi-temp
   cd flippi-temp
   ```
4. Copy the workflow files from your current repo
5. Push with the new token

## Option 3: Use GitHub Web Interface

1. Go to: https://github.com/johnjhusband/price-scanner-app/tree/develop/.github/workflows
2. Click on each workflow file
3. Click the pencil icon to edit
4. Add the nginx update section
5. Commit directly to develop branch

The OAuth login is currently broken on staging because nginx isn't routing `/auth/*` to the backend. One of these options will fix it.