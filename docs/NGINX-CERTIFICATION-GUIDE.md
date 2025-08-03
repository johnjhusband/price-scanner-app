# NGINX Certification and Best Practices Guide

## Table of Contents
1. [Official NGINX Certification](#official-nginx-certification)
2. [NGINX Configuration Best Practices](#nginx-configuration-best-practices)
3. [Location Block Fundamentals](#location-block-fundamentals)
4. [Flippi.ai NGINX Configuration](#flippiai-nginx-configuration)
5. [Troubleshooting Guide](#troubleshooting-guide)

## Official NGINX Certification

### F5 Certified Administrator NGINX

The official NGINX certification is offered by F5 (which acquired NGINX in 2019). The **F5 Certified Administrator NGINX** certification validates understanding of NGINX administration as a web and proxy server.

#### Certification Requirements
To achieve certification, candidates must pass all four exams:

1. **NGINX Management (F5N1)**
   - Day-to-day management of NGINX web server platform
   - Basic administration tasks

2. **NGINX Configuration: Knowledge (F5N2)**
   - Configuration concepts and directives
   - Understanding of nginx.conf structure

3. **NGINX Configuration: Demonstrate (F5N3)**
   - Practical configuration tasks
   - Hands-on implementation

4. **NGINX Troubleshoot (F5N4)**
   - Debugging and problem resolution
   - Log analysis and performance optimization

#### Exam Details
- **Format**: 30 questions, 30 minutes each
- **Cost**: $50 USD per exam
- **Platform**: Online via Certiverse
- **Scope**: NGINX Open Source (not NGINX Plus)
- **Registration**: support@mail.education.f5.com

## NGINX Configuration Best Practices

### 1. Location Block Priority

NGINX processes location blocks in this specific order:

```nginx
# 1. Exact match (highest priority)
location = /api/status {
    return 200 "OK";
}

# 2. Prefix with priority (stops searching)
location ^~ /static/ {
    root /var/www;
}

# 3. Regular expression (case-sensitive)
location ~ \.php$ {
    fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
}

# 4. Regular expression (case-insensitive)
location ~* \.(jpg|jpeg|png|gif)$ {
    expires 30d;
}

# 5. Prefix match (lowest priority)
location / {
    proxy_pass http://backend;
}
```

### 2. Security Best Practices

```nginx
# Restrict admin access
location /admin {
    allow 192.168.1.0/24;
    deny all;
    proxy_pass http://backend;
}

# Hide NGINX version
server_tokens off;

# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
```

### 3. Performance Optimization

```nginx
# Gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript;

# Connection settings
keepalive_timeout 65;
keepalive_requests 100;

# Buffer sizes
client_body_buffer_size 128k;
client_max_body_size 10m;
```

## Location Block Fundamentals

### Selection Algorithm

1. **Test exact matches** (`location = /path`)
2. **Check prefix matches** and remember longest
3. **If longest prefix has `^~`, use it and stop**
4. **Test regex matches** in order of appearance
5. **Use longest prefix match** if no regex matches

### Common Patterns

```nginx
# API routing
location /api/ {
    proxy_pass http://backend:3000/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# Static files with caching
location ~* \.(css|js|jpg|jpeg|png|gif|ico|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# WebSocket support
location /ws {
    proxy_pass http://backend:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

## Flippi.ai NGINX Configuration

### Current Issue
The Flippi.ai nginx configuration is missing specific location blocks for backend routes, causing all requests to be served by the React frontend.

### Required Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name blue.flippi.ai;
    
    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/blue.flippi.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/blue.flippi.ai/privkey.pem;
    
    # Backend routes (MUST come before catch-all)
    
    # OAuth routes
    location /auth {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # API routes
    location /api/ {
        proxy_pass http://localhost:3002/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Legal pages (exact match)
    location = /terms {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location = /privacy {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Health check
    location = /health {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
    
    # Admin routes
    location /admin/ {
        proxy_pass http://localhost:3002/admin/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Frontend (React app) - catch-all MUST be last
    location / {
        root /var/www/blue.flippi.ai/mobile-app/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

### Port Mapping
- **Development (blue.flippi.ai)**: Port 3002
- **Staging (green.flippi.ai)**: Port 3001
- **Production (app.flippi.ai)**: Port 3000

## Troubleshooting Guide

### 1. Test Configuration
```bash
# Syntax check
nginx -t

# Test specific config
nginx -T | grep -A 10 "server_name blue.flippi.ai"
```

### 2. Debug Location Matching
```nginx
# Add debug location
location /debug {
    add_header X-Debug-Location "matched /debug" always;
    return 200 "Location: /debug\n";
}
```

### 3. Common Issues

#### All Routes Show React App
**Cause**: Missing specific location blocks for backend routes
**Fix**: Add location blocks for `/api/`, `/auth`, `/terms`, `/privacy` BEFORE the catch-all `/` location

#### 502 Bad Gateway
**Cause**: Backend not running or wrong port
**Fix**: 
- Check PM2: `pm2 list`
- Verify port in proxy_pass matches environment

#### Changes Not Taking Effect
**Cause**: Nginx not reloaded
**Fix**: 
```bash
nginx -t && nginx -s reload
```

### 4. Logs
```bash
# Access logs
tail -f /var/log/nginx/access.log

# Error logs
tail -f /var/log/nginx/error.log

# Backend logs (PM2)
pm2 logs dev-backend
```

## Key Takeaways

1. **Location block order matters** - Specific routes must come before catch-all
2. **Use exact matches** for specific paths like `/terms`
3. **Test configuration** before reloading nginx
4. **Backend routes need proxy_pass** to the Node.js server
5. **Frontend catch-all must be last** to avoid intercepting API calls

## Resources

- [Official NGINX Documentation](https://nginx.org/en/docs/)
- [F5 NGINX Certification](https://education.f5.com/)
- [NGINX Configuration Generator](https://www.digitalocean.com/community/tools/nginx)
- [NGINX Location Tester](https://nginx.viraptor.info/)