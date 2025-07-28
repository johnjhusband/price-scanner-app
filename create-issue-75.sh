#!/bin/bash
# Create Issue #75

echo "Creating Issue #75: OAuth NGINX Configuration Scripts"

gh issue create \
  --repo johnjhusband/price-scanner-app \
  --title "OAuth NGINX Configuration Scripts" \
  --body-file issue-75.md \
  --label deployment \
  --label oauth

echo "Issue created!"