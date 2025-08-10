#!/bin/bash
# Post-deployment script that runs all necessary fixes
# This can be called from the deployment workflow

echo "=== Running post-deployment fixes ==="

# Fix duplicate nginx locations
if [ -f scripts/post-deploy-nginx-fix.sh ]; then
    echo "Running nginx duplicate location fix..."
    bash scripts/post-deploy-nginx-fix.sh || true
fi

# Force nginx reload
if [ -f scripts/force-nginx-reload.sh ]; then
    echo "Running force nginx reload..."
    bash scripts/force-nginx-reload.sh || true
fi

# Run comprehensive legal pages fix
if [ -f scripts/comprehensive-legal-fix.sh ]; then
    echo "Running comprehensive legal pages fix..."
    bash scripts/comprehensive-legal-fix.sh || true
fi

echo "=== Post-deployment fixes complete ==="