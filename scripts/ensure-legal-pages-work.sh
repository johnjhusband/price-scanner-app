#!/bin/bash
set -euo pipefail

echo "✨ Ensuring legal pages work..."

# Check if backend is serving legal pages
for page in terms privacy contact mission; do
    if curl -s -o /dev/null -w "%{http_code}" "http://localhost:3002/$page" | grep -q "200"; then
        echo "✅ /$page is served by backend"
    else
        echo "❌ /$page not accessible on backend"
    fi
done

echo "💫 Done"