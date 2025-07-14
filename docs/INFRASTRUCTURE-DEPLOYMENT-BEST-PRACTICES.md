# Infrastructure & Deployment Best Practices - v2.0

This document outlines best practices for infrastructure and deployment using PM2, Nginx, and Git-based deployments.

## Table of Contents
1. [Pre-Deployment Validation](#pre-deployment-validation)
2. [Automated Bug Logging](#automated-bug-logging)
3. [Environment Management](#environment-management)
4. [Process Management](#process-management)
5. [Monitoring & Health Checks](#monitoring--health-checks)
6. [Troubleshooting Workflow](#troubleshooting-workflow)
7. [Post-Deployment Verification](#post-deployment-verification)
8. [Rollback Procedures](#rollback-procedures)

## Pre-Deployment Validation

### Always Run Pre-Flight Checks
Before ANY deployment, validate the environment is ready:

```bash
#!/bin/bash
# Pre-deployment validation script

echo "=== Pre-Deployment Validation ==="

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not installed"
    exit 1
fi

# Check PM2
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 not installed"
    exit 1
fi

# Check Nginx
if ! systemctl is-active --quiet nginx; then
    echo "❌ Nginx is not running"
    exit 1
fi

# Check disk space
AVAILABLE_SPACE=$(df -BG /var/www | awk 'NR==2 {print $4}' | sed 's/G//')
if [ "$AVAILABLE_SPACE" -lt 2 ]; then
    echo "❌ Insufficient disk space: ${AVAILABLE_SPACE}GB (need 2GB)"
    exit 1
fi

# Check required files
REQUIRED_FILES=(
    "backend/.env"
    "backend/server.js"
    "backend/package.json"
    "mobile-app/App.js"
    "mobile-app/package.json"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Missing required file: $file"
        exit 1
    fi
done

# Validate environment files
if ! grep -q "OPENAI_API_KEY=" backend/.env; then
    echo "⚠️  Warning: OPENAI_API_KEY not set in backend/.env"
fi

# Check SSL certificates
certbot certificates --quiet || echo "⚠️  Warning: SSL certificate issues detected"

echo "✅ Pre-deployment validation passed"
```

### Port Availability Check
```bash
# Check if required ports are available
check_ports() {
    local ENV=$1
    case $ENV in
        prod)
            BACKEND_PORT=3000
            FRONTEND_PORT=8080
            ;;
        staging)
            BACKEND_PORT=3001
            FRONTEND_PORT=8081
            ;;
        dev)
            BACKEND_PORT=3002
            FRONTEND_PORT=8082
            ;;
    esac
    
    for port in $BACKEND_PORT $FRONTEND_PORT; do
        if ! pm2 list | grep -q ":$port"; then
            if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null; then
                echo "❌ Port $port is already in use by another process"
                exit 1
            fi
        fi
    done
    echo "✅ Ports available for $ENV environment"
}
```

## Automated Bug Logging

### Implement Structured Error Logging

#### 1. Create Error Log Entry Function
```bash
log_error() {
    local ERROR_TYPE=$1
    local ERROR_MSG=$2
    local RESOLUTION=$3
    
    cat >> /var/log/deployment-errors.log << EOF

$(date '+%Y-%m-%d %H:%M:%S') - ${ERROR_TYPE}
=====================================
Error: ${ERROR_MSG}
PM2 Status:
$(pm2 list)

Recent Logs:
$(pm2 logs --nostream --lines 20)

Nginx Status:
$(systemctl status nginx --no-pager)

Suggested Resolution: ${RESOLUTION}

Status: NEW - Awaiting resolution
Priority: $(determine_priority "$ERROR_TYPE")
=====================================
EOF
}

determine_priority() {
    case $1 in
        *CRITICAL*|*DOWN*) echo "CRITICAL" ;;
        *ERROR*|*FAIL*) echo "HIGH" ;;
        *WARNING*) echo "MEDIUM" ;;
        *) echo "LOW" ;;
    esac
}
```

#### 2. Automated Error Detection
```bash
# Monitor PM2 processes
monitor_pm2() {
    pm2 list --json | jq -r '.[] | select(.pm2_env.status != "online") | 
        "Process \(.name) is \(.pm2_env.status)"' | while read -r line; do
        log_error "PM2_PROCESS_DOWN" "$line" "Run: pm2 restart <process-name>"
    done
}

# Monitor Nginx
monitor_nginx() {
    if ! systemctl is-active --quiet nginx; then
        log_error "NGINX_DOWN" "Nginx service is not running" "Run: systemctl start nginx"
    fi
}
```

## Environment Management

### Three-Environment Strategy
```bash
# Environment configuration
ENVIRONMENTS=(
    "prod|app.flippi.ai|master|3000|8080"
    "staging|green.flippi.ai|staging|3001|8081"
    "dev|blue.flippi.ai|develop|3002|8082"
)

deploy_environment() {
    local ENV_NAME=$1
    local DOMAIN=$2
    local BRANCH=$3
    local BACKEND_PORT=$4
    local FRONTEND_PORT=$5
    
    echo "Deploying $ENV_NAME environment..."
    
    # Navigate to environment directory
    cd "/var/www/$DOMAIN" || exit 1
    
    # Git pull latest code
    git checkout "$BRANCH"
    git pull origin "$BRANCH"
    
    # Update backend
    cd backend
    npm install --production
    pm2 restart "$ENV_NAME-backend"
    
    # Update frontend
    cd ../mobile-app
    npm install
    npx expo export:web
    pm2 restart "$ENV_NAME-frontend"
    
    # Verify deployment
    sleep 5
    curl -f "https://$DOMAIN/health" || log_error "DEPLOYMENT_FAILED" \
        "$ENV_NAME deployment health check failed" \
        "Check PM2 logs: pm2 logs $ENV_NAME-backend"
}
```

## Process Management

### PM2 Best Practices

#### 1. Ecosystem Configuration
```javascript
// /var/www/ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'prod-backend',
      script: '/var/www/app.flippi.ai/backend/server.js',
      cwd: '/var/www/app.flippi.ai/backend',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '500M',
      error_file: '/var/log/pm2/prod-backend-error.log',
      out_file: '/var/log/pm2/prod-backend-out.log',
      merge_logs: true,
      time: true,
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
    // ... other apps
  ]
};
```

#### 2. Zero-Downtime Deployments
```bash
# Graceful reload with PM2
zero_downtime_deploy() {
    local APP_NAME=$1
    
    # Save current state
    pm2 save
    
    # Perform graceful reload
    pm2 reload "$APP_NAME" --update-env
    
    # Verify process is running
    sleep 3
    if ! pm2 list | grep -q "$APP_NAME.*online"; then
        echo "❌ Reload failed, attempting rollback"
        pm2 resurrect
        return 1
    fi
    
    echo "✅ Zero-downtime deployment successful"
}
```

## Monitoring & Health Checks

### Comprehensive Health Monitoring
```bash
#!/bin/bash
# health-monitor.sh

check_all_services() {
    local ERRORS=0
    
    # Check each environment
    for env in app green blue; do
        echo "Checking $env.flippi.ai..."
        
        # Check HTTPS endpoint
        if ! curl -sf "https://$env.flippi.ai/health" > /dev/null; then
            log_error "HEALTH_CHECK_FAILED" \
                "$env.flippi.ai health check failed" \
                "Check logs: pm2 logs $env-backend"
            ((ERRORS++))
        fi
        
        # Check PM2 processes
        for service in backend frontend; do
            if ! pm2 list | grep -q "$env-$service.*online"; then
                log_error "PM2_PROCESS_DOWN" \
                    "$env-$service is not online" \
                    "Run: pm2 restart $env-$service"
                ((ERRORS++))
            fi
        done
    done
    
    # Check Nginx
    if ! nginx -t 2>/dev/null; then
        log_error "NGINX_CONFIG_ERROR" \
            "Nginx configuration test failed" \
            "Check config: nginx -t"
        ((ERRORS++))
    fi
    
    return $ERRORS
}

# Run health checks every 5 minutes via cron
# */5 * * * * /root/health-monitor.sh
```

### Real-time Monitoring Dashboard
```bash
# Create monitoring script
cat > /usr/local/bin/monitor-services << 'EOF'
#!/bin/bash
while true; do
    clear
    echo "=== Service Monitor - $(date) ==="
    echo
    echo "PM2 Processes:"
    pm2 list
    echo
    echo "Nginx Status:"
    systemctl status nginx --no-pager | head -5
    echo
    echo "Recent Errors:"
    tail -5 /var/log/deployment-errors.log 2>/dev/null || echo "No recent errors"
    echo
    echo "Health Checks:"
    for env in app green blue; do
        printf "%-20s" "$env.flippi.ai:"
        curl -sf "https://$env.flippi.ai/health" > /dev/null && echo "✅ OK" || echo "❌ FAILED"
    done
    sleep 30
done
EOF
chmod +x /usr/local/bin/monitor-services
```

## Troubleshooting Workflow

### Systematic Debugging Process
```bash
troubleshoot_deployment() {
    local ENV=$1
    
    echo "=== Troubleshooting $ENV deployment ==="
    
    # 1. Check process status
    echo "1. PM2 Process Status:"
    pm2 describe "$ENV-backend" | grep -E "(status|uptime|restarts)"
    pm2 describe "$ENV-frontend" | grep -E "(status|uptime|restarts)"
    
    # 2. Check recent logs
    echo -e "\n2. Recent Backend Logs:"
    pm2 logs "$ENV-backend" --lines 20 --nostream
    
    echo -e "\n3. Recent Frontend Logs:"
    pm2 logs "$ENV-frontend" --lines 20 --nostream
    
    # 4. Check port bindings
    echo -e "\n4. Port Bindings:"
    netstat -tlnp | grep -E "(300[0-2]|808[0-2])"
    
    # 5. Check Nginx routing
    echo -e "\n5. Nginx Configuration:"
    nginx -t
    grep -A5 "proxy_pass" /etc/nginx/sites-enabled/*
    
    # 6. Test endpoints
    echo -e "\n6. Endpoint Tests:"
    curl -I "http://localhost:300${ENV: -1}/health"
    curl -I "https://${ENV}.flippi.ai/health"
    
    # 7. Check disk space
    echo -e "\n7. Disk Space:"
    df -h /var/www
}
```

## Post-Deployment Verification

### Automated Verification Script
```bash
#!/bin/bash
# post-deploy-verify.sh

verify_deployment() {
    local ENV=$1
    local DOMAIN=$2
    local BACKEND_PORT=$3
    local FRONTEND_PORT=$4
    
    echo "=== Post-Deployment Verification for $ENV ==="
    
    # Test backend health
    echo -n "Backend health check: "
    if curl -sf "http://localhost:$BACKEND_PORT/health" | jq -e '.status == "OK"' > /dev/null; then
        echo "✅ PASSED"
    else
        echo "❌ FAILED"
        return 1
    fi
    
    # Test frontend
    echo -n "Frontend accessibility: "
    if curl -sf "http://localhost:$FRONTEND_PORT" > /dev/null; then
        echo "✅ PASSED"
    else
        echo "❌ FAILED"
        return 1
    fi
    
    # Test public endpoint
    echo -n "Public HTTPS endpoint: "
    if curl -sf "https://$DOMAIN/health" > /dev/null; then
        echo "✅ PASSED"
    else
        echo "❌ FAILED"
        return 1
    fi
    
    # Test API functionality
    echo -n "API scan endpoint: "
    if curl -sf -X POST "https://$DOMAIN/api/scan" | grep -q "No image"; then
        echo "✅ PASSED (returns expected error)"
    else
        echo "❌ FAILED"
        return 1
    fi
    
    # Check SSL certificate
    echo -n "SSL certificate validity: "
    if echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null | \
        openssl x509 -noout -checkend 86400 > /dev/null; then
        echo "✅ PASSED"
    else
        echo "⚠️  WARNING: Certificate expires soon"
    fi
    
    echo "=== Verification Complete ==="
}
```

## Rollback Procedures

### Quick Rollback Strategy
```bash
# Create rollback script
create_rollback_snapshot() {
    local ENV=$1
    local TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    
    # Save current PM2 state
    pm2 save
    cp ~/.pm2/dump.pm2 ~/.pm2/dump.pm2.$TIMESTAMP
    
    # Backup current code
    tar -czf "/backups/$ENV-$TIMESTAMP.tar.gz" \
        "/var/www/$ENV.flippi.ai/backend" \
        "/var/www/$ENV.flippi.ai/mobile-app"
    
    echo "Rollback snapshot created: $ENV-$TIMESTAMP"
}

perform_rollback() {
    local ENV=$1
    local SNAPSHOT=$2
    
    echo "⚠️  Performing rollback to $SNAPSHOT"
    
    # Stop current processes
    pm2 stop "$ENV-backend" "$ENV-frontend"
    
    # Restore code
    tar -xzf "/backups/$SNAPSHOT.tar.gz" -C /
    
    # Restore PM2 state
    cp ~/.pm2/dump.pm2.$SNAPSHOT ~/.pm2/dump.pm2
    pm2 resurrect
    
    # Verify rollback
    sleep 5
    if verify_deployment "$ENV"; then
        echo "✅ Rollback successful"
    else
        echo "❌ Rollback failed - manual intervention required"
        exit 1
    fi
}
```

### Git-Based Rollback
```bash
git_rollback() {
    local ENV=$1
    local COMMIT=$2
    local DIR="/var/www/$ENV.flippi.ai"
    
    cd "$DIR" || exit 1
    
    # Stash any local changes
    git stash
    
    # Rollback to specific commit
    git checkout "$COMMIT"
    
    # Rebuild and restart
    cd backend && npm install --production
    cd ../mobile-app && npm install && npx expo export:web
    
    pm2 restart "$ENV-backend" "$ENV-frontend"
    
    echo "Rolled back to commit: $COMMIT"
}
```

## Best Practices Summary

1. **Always validate before deployment**
2. **Monitor continuously with automated health checks**
3. **Log all errors with context and resolution steps**
4. **Use zero-downtime deployment strategies**
5. **Maintain rollback capabilities**
6. **Test deployments in dev → staging → production order**
7. **Keep documentation updated with deployment changes**
8. **Regular backups of code and configurations**
9. **Monitor resource usage and set limits**
10. **Review logs regularly for potential issues**

Remember: Automation reduces errors, but always verify deployments manually for critical systems.