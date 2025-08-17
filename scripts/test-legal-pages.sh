#!/bin/bash
# Test legal pages on all environments

echo "=== Testing Legal Pages ==="
echo ""

# Test blue.flippi.ai
echo "Testing blue.flippi.ai:"
echo -n "  /terms: "
curl -s -o /dev/null -w "%{http_code}" https://blue.flippi.ai/terms
echo ""
echo -n "  /privacy: "
curl -s -o /dev/null -w "%{http_code}" https://blue.flippi.ai/privacy
echo ""
echo -n "  /mission: "
curl -s -o /dev/null -w "%{http_code}" https://blue.flippi.ai/mission
echo ""
echo -n "  /contact: "
curl -s -o /dev/null -w "%{http_code}" https://blue.flippi.ai/contact
echo ""
echo ""

# Quick content check
echo "Checking if terms page contains HTML:"
curl -s https://blue.flippi.ai/terms | head -5 | grep -q "<" && echo "✓ HTML content found" || echo "✗ No HTML found"
echo ""

echo "To manually test in browser:"
echo "- https://blue.flippi.ai/terms"
echo "- https://blue.flippi.ai/privacy"