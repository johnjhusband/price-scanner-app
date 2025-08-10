#!/bin/bash
# Recover nginx from bad configuration

DOMAIN=$(basename $(pwd))
echo "Recovering nginx for $DOMAIN..."

# Find a working backup
echo "Looking for nginx backups..."
ls -la /etc/nginx/sites-available/$DOMAIN.backup.* 2>/dev/null | tail -5

# Try to restore from a recent backup
BACKUP=$(ls -t /etc/nginx/sites-available/$DOMAIN.backup.* 2>/dev/null | grep -v "legal" | head -1)
if [ -n "$BACKUP" ]; then
    echo "Found backup: $BACKUP"
    echo "Restoring..."
    sudo cp $BACKUP /etc/nginx/sites-available/$DOMAIN
    sudo nginx -t && sudo systemctl reload nginx
    echo "Nginx recovered"
else
    echo "No backup found"
fi