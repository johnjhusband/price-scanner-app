#!/bin/bash
echo "Quick nginx check for $(basename $(pwd))"
echo "1. Config file:"
sudo cat /etc/nginx/sites-available/$(basename $(pwd)) | grep -E "location|proxy_pass" | head -30
echo ""
echo "2. Test /terms:"
curl -s https://$(basename $(pwd))/terms | head -10