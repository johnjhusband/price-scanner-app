#!/bin/bash

echo "=== Setting Up Test Automation ==="

# Make test runner executable
chmod +x scripts/run-tests-and-report.sh

# Create a simple cron job that runs every 30 minutes
CRON_CMD="cd $(pwd) && ./scripts/run-tests-and-report.sh green >> tests.log 2>&1"

# Check if cron job already exists
if ! crontab -l 2>/dev/null | grep -q "run-tests-and-report.sh"; then
    # Add to crontab
    (crontab -l 2>/dev/null; echo "*/30 * * * * $CRON_CMD") | crontab -
    echo "✅ Cron job added - tests will run every 30 minutes"
else
    echo "⚠️  Cron job already exists"
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "What happens now:"
echo "1. Every 30 minutes, tests run automatically"
echo "2. If tests fail → GitHub issue created"
echo "3. If tests pass with 'Implements #X' → Issue closed"
echo ""
echo "To test it manually right now:"
echo "./scripts/run-tests-and-report.sh green"
echo ""
echo "To watch the logs:"
echo "tail -f tests.log"
echo ""
echo "To stop automation:"
echo "crontab -e  # Remove the line with run-tests-and-report.sh"