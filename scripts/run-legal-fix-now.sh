#!/bin/bash
# Run the comprehensive legal fix immediately

echo "This script will SSH to blue.flippi.ai and run the legal pages fix."
echo "You'll need to run this manually with SSH access."
echo ""
echo "Commands to run:"
echo ""
echo "ssh root@157.245.142.145"
echo "cd /var/www/blue.flippi.ai"
echo "bash scripts/comprehensive-legal-fix.sh"
echo ""
echo "Or run the wrapper script that includes all fixes:"
echo "bash scripts/post-deploy-all-fixes.sh"