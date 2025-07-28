#!/bin/bash
# Postinstall script to apply OAuth fixes based on environment

echo "=== Postinstall OAuth Check ==="

# Determine environment based on current directory
if [[ "$PWD" == *"/app.flippi.ai/"* ]]; then
    echo "Production environment detected"
    if [ -f ../scripts/production-oauth-fix.sh ]; then
        echo "Applying production OAuth fix..."
        bash ../scripts/production-oauth-fix.sh || echo "OAuth fix will be applied by root user"
    fi
elif [[ "$PWD" == *"/green.flippi.ai/"* ]]; then
    echo "Staging environment detected"
    if [ -f ../scripts/fix-staging-oauth-verbose.sh ]; then
        echo "Applying staging OAuth fix..."
        bash ../scripts/fix-staging-oauth-verbose.sh || echo "OAuth fix will be applied by root user"
    fi
else
    echo "Development environment - no OAuth fix needed"
fi

echo "=== Postinstall complete ==="