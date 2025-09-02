# SSL Certificate Setup for flippi.ai Root Domain

## Overview
This document describes how to set up SSL certificates for the flippi.ai root domain, addressing Issue #83.

## Current State
- SSL certificates are already configured for:
  - `app.flippi.ai` (production)
  - `blue.flippi.ai` (blue environment)
  - `green.flippi.ai` (green environment)
- The root domain `flippi.ai` needs SSL configuration

## Purpose
Adding SSL to the root domain provides:
1. Secure HTTPS access to flippi.ai
2. Proper redirect from root domain to app.flippi.ai
3. SEO benefits from having HTTPS on all domains
4. Consistent security across all subdomains

## Prerequisites
1. Root/sudo access to the server
2. DNS A records pointing to the server:
   - `flippi.ai` → server IP
   - `www.flippi.ai` → server IP
3. Nginx installed and running
4. Certbot installed (`apt-get install certbot python3-certbot-nginx`)

## Installation Steps

### 1. Upload Configuration Files
```bash
# Upload the nginx configuration
scp nginx/flippi.ai.conf user@server:/tmp/

# Upload the setup script
scp scripts/setup-root-domain-ssl.sh user@server:/tmp/
```

### 2. Run the Setup Script
```bash
# SSH to the server
ssh user@server

# Navigate to the app directory
cd /path/to/price-scanner-app

# Copy the files
sudo cp /tmp/flippi.ai.conf nginx/
sudo cp /tmp/setup-root-domain-ssl.sh scripts/
sudo chmod +x scripts/setup-root-domain-ssl.sh

# Run the setup
sudo ./scripts/setup-root-domain-ssl.sh
```

### 3. Manual Setup (Alternative)
If you prefer manual setup:

```bash
# Copy nginx configuration
sudo cp nginx/flippi.ai.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/flippi.ai.conf /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Obtain SSL certificate
sudo certbot --nginx -d flippi.ai -d www.flippi.ai \
  --non-interactive --agree-tos --email admin@flippi.ai --redirect

# Verify installation
sudo certbot certificates
```

## Configuration Details

### Nginx Configuration
The configuration includes:
- HTTP to HTTPS redirect
- SSL certificate paths (managed by Certbot)
- Redirect from root domain to app.flippi.ai
- Security headers
- Gzip compression
- Health check endpoint

### Certificate Details
- Provider: Let's Encrypt (free)
- Domains covered: flippi.ai, www.flippi.ai
- Auto-renewal: Enabled via certbot.timer
- Certificate location: `/etc/letsencrypt/live/flippi.ai/`

## Testing

### 1. Test HTTPS Access
```bash
# Test root domain
curl -I https://flippi.ai

# Test www subdomain
curl -I https://www.flippi.ai

# Test health endpoint
curl https://flippi.ai/health
```

### 2. Test Redirects
```bash
# Test HTTP to HTTPS redirect
curl -I http://flippi.ai

# Test root to app redirect
curl -I https://flippi.ai
# Should redirect to https://app.flippi.ai
```

### 3. SSL Certificate Check
```bash
# Check certificate details
echo | openssl s_client -servername flippi.ai -connect flippi.ai:443 2>/dev/null | openssl x509 -noout -text

# Check expiration
sudo certbot certificates
```

## Maintenance

### Certificate Renewal
Certificates auto-renew via systemd timer. To check:
```bash
# Check timer status
sudo systemctl status certbot.timer

# Test renewal (dry run)
sudo certbot renew --dry-run

# Force renewal (if needed)
sudo certbot renew --force-renewal
```

### Monitoring
1. Check certificate expiration monthly
2. Monitor nginx error logs: `/var/log/nginx/flippi.ai.error.log`
3. Verify auto-renewal is working

## Troubleshooting

### DNS Issues
If setup fails with DNS errors:
1. Verify DNS records: `dig flippi.ai`
2. Wait for DNS propagation (up to 48 hours)
3. Use `--staging` flag for testing

### Certificate Issues
```bash
# View detailed logs
sudo journalctl -u certbot

# Remove and retry
sudo certbot delete --cert-name flippi.ai
sudo certbot --nginx -d flippi.ai -d www.flippi.ai
```

### Nginx Issues
```bash
# Check configuration
sudo nginx -t

# View error logs
sudo tail -f /var/log/nginx/error.log
```

## Security Considerations
1. Keep Certbot updated: `sudo apt update && sudo apt upgrade certbot`
2. Monitor for security advisories
3. Use strong SSL configuration (handled by Certbot)
4. Regular security audits

## References
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Certbot Nginx Plugin](https://certbot.eff.org/docs/using.html#nginx)
- [Nginx SSL Configuration](https://nginx.org/en/docs/http/configuring_https_servers.html)