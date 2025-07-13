#!/bin/bash

# Simple test runner that creates GitHub issues for failures

ENV=${1:-green}
export TEST_ENV=$ENV

echo "=== Running tests against $ENV environment ==="

# Run tests and capture output
npx playwright test --reporter=json > test-results.json 2>&1
TEST_EXIT_CODE=$?

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ All tests passed!"
    
    # If commit message has "Implements #X", close that issue
    LAST_COMMIT=$(git log -1 --pretty=%B)
    ISSUE_NUM=$(echo "$LAST_COMMIT" | grep -oP 'Implements #\K\d+')
    
    if [ ! -z "$ISSUE_NUM" ]; then
        echo "Closing issue #$ISSUE_NUM"
        gh issue close $ISSUE_NUM --comment "✅ All automated tests passed in $ENV environment"
    fi
else
    echo "❌ Tests failed!"
    
    # Parse failures
    FAILED_TESTS=$(jq -r '.suites[].specs[].tests[] | select(.status=="failed") | .title' test-results.json 2>/dev/null | head -5)
    
    # Create issue for failures
    ISSUE_BODY="## 🚨 Automated Test Failures

**Environment**: $ENV (https://$ENV.flippi.ai)
**Date**: $(date)

### Failed Tests:
\`\`\`
$FAILED_TESTS
\`\`\`

### How to Debug:
1. Run locally: \`TEST_ENV=$ENV npx playwright test --ui\`
2. Check the site: https://$ENV.flippi.ai
3. View full results: \`cat test-results.json\`

### For AI Coder:
Please fix the failing tests above. The tests are checking:
- App loads properly
- Upload button is visible  
- API health endpoint responds"

    # Create the issue
    gh issue create \
        --title "Test Failure: Automated tests failing on $ENV" \
        --body "$ISSUE_BODY" \
        --label "bug,test-failure,automated"
fi

# Clean up
rm -f test-results.json