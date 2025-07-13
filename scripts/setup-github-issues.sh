#!/bin/bash

# Script to set up GitHub authentication and create initial issues

echo "=== GitHub Issues Setup ==="
echo ""

# Check if already authenticated
if gh auth status >/dev/null 2>&1; then
    echo "✅ Already authenticated with GitHub"
    gh auth status
else
    echo "❌ Not authenticated with GitHub"
    echo ""
    echo "Option 1: Interactive login"
    echo "  Run: gh auth login"
    echo ""
    echo "Option 2: Use Personal Access Token"
    echo "  1. Go to https://github.com/settings/tokens"
    echo "  2. Generate a token with 'repo' scope"
    echo "  3. Run: export GH_TOKEN='your-token-here'"
    echo ""
    echo "After authenticating, run this script again."
    exit 1
fi

echo ""
echo "=== Creating Initial Issues ==="
echo ""

# Get repository details
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo "Repository: $REPO"
echo ""

# Function to create issue if it doesn't exist
create_issue_if_not_exists() {
    local title="$1"
    local body="$2"
    local labels="$3"
    
    # Check if issue with this title already exists
    existing=$(gh issue list --search "in:title \"$title\"" --json number -q '.[0].number')
    
    if [ -z "$existing" ]; then
        echo "Creating: $title"
        gh issue create --title "$title" --body "$body" --label "$labels"
    else
        echo "Already exists: $title (Issue #$existing)"
    fi
}

# Create labels first (ignore errors if they exist)
echo "Creating standard labels..."
gh label create "bug" --description "Something isn't working" --color "d73a4a" 2>/dev/null || true
gh label create "enhancement" --description "New feature or request" --color "a2eeef" 2>/dev/null || true
gh label create "test-failure" --description "Automated test failure" --color "e99695" 2>/dev/null || true
gh label create "automated" --description "Created by automation" --color "c5def5" 2>/dev/null || true
gh label create "p1-critical" --description "Critical priority" --color "b60205" 2>/dev/null || true
gh label create "p2-high" --description "High priority" --color "ff9900" 2>/dev/null || true
gh label create "p3-medium" --description "Medium priority" --color "fbca04" 2>/dev/null || true
gh label create "mac" --description "Mac-specific issue" --color "8b6914" 2>/dev/null || true
gh label create "windows" --description "Windows-specific issue" --color "0052cc" 2>/dev/null || true
gh label create "ready-to-test" --description "Ready for testing" --color "0e8a16" 2>/dev/null || true

echo ""
echo "Creating feature tracking issues..."

# Feature Issues from our traceability matrix
create_issue_if_not_exists \
    "Feature: Add support for batch image processing" \
    "**Feature ID**: F-017
**Priority**: Medium

**Description**: Allow users to upload and analyze multiple images at once

**Test Cases**:
- [ ] TC-017.1: Upload multiple images via file picker
- [ ] TC-017.2: Process images sequentially
- [ ] TC-017.3: Show progress indicator
- [ ] TC-017.4: Display results in a list format

**Acceptance Criteria**:
- [ ] User can select multiple images in file browser
- [ ] System processes each image and shows progress
- [ ] Results are displayed in an organized list
- [ ] User can export all results as CSV" \
    "enhancement,p3-medium"

create_issue_if_not_exists \
    "Feature: Add image history and favorites" \
    "**Feature ID**: F-018
**Priority**: High

**Description**: Save analysis history and mark favorites

**Test Cases**:
- [ ] TC-018.1: View recent analyses
- [ ] TC-018.2: Mark item as favorite
- [ ] TC-018.3: Search history
- [ ] TC-018.4: Clear history

**Acceptance Criteria**:
- [ ] Recent analyses stored locally
- [ ] Favorite items marked with star
- [ ] Search by item name or date
- [ ] Privacy-respecting local storage" \
    "enhancement,p2-high"

create_issue_if_not_exists \
    "Feature: Export results as PDF report" \
    "**Feature ID**: F-019
**Priority**: Medium

**Description**: Generate professional PDF reports of analysis results

**Test Cases**:
- [ ] TC-019.1: Generate PDF with all results
- [ ] TC-019.2: Include image in PDF
- [ ] TC-019.3: Customizable report header
- [ ] TC-019.4: Download PDF file

**Acceptance Criteria**:
- [ ] PDF includes item image
- [ ] All analysis fields included
- [ ] Professional formatting
- [ ] Downloadable file" \
    "enhancement,p3-medium"

echo ""
echo "Creating bug tracking issues for known issues..."

create_issue_if_not_exists \
    "Bug: Some images fail to process after selection on blue environment" \
    "**Test Case ID**: TC-001.1
**Feature**: F-001 Image Upload
**Environment**: blue
**URL**: https://blue.flippi.ai

**Browser & OS**:
- Browser: Multiple
- OS: Multiple

**Steps to Reproduce**:
1. Go to blue.flippi.ai
2. Click 'Choose Image'
3. Select certain images
4. Nothing happens - no analysis

**Expected Behavior**:
All valid image files should be processed

**Actual Behavior**:
Some images fail silently with no error message

**Additional Context**:
Reported by user during testing. Appears to be intermittent." \
    "bug,p2-high"

create_issue_if_not_exists \
    "Bug: Edge browser not fully tested" \
    "**Test Case ID**: TC-013.4
**Feature**: F-013 Cross-Browser Support
**Environment**: green
**URL**: https://green.flippi.ai

**Description**: 
Microsoft Edge browser hasn't been fully tested with all features, especially:
- Drag and drop functionality
- Paste functionality
- Camera access

**Action Required**:
- [ ] Test all features on Edge
- [ ] Document any issues found
- [ ] Fix Edge-specific problems" \
    "bug,p3-medium,windows"

echo ""
echo "Creating test automation tracking issues..."

create_issue_if_not_exists \
    "Setup Playwright test suite for core functionality" \
    "**Objective**: Implement automated tests for Priority 1 features

**Tasks**:
- [ ] Set up Playwright configuration
- [ ] Create test structure and helpers
- [ ] Implement image upload tests (F-001)
- [ ] Implement camera tests (F-002, F-003)
- [ ] Implement basic analysis tests (F-006)
- [ ] Implement error handling tests (F-011)

**Test Files to Create**:
- tests/upload.spec.js
- tests/camera.spec.js
- tests/analysis.spec.js
- tests/errors.spec.js

**Success Criteria**:
- All Priority 1 test cases automated
- Tests run in CI/CD pipeline
- Failed tests create GitHub issues" \
    "enhancement,test-automation,p1-critical"

echo ""
echo "=== Summary ==="
echo ""
echo "✅ Labels created/verified"
echo "✅ Feature issues created"
echo "✅ Bug issues created"
echo "✅ Test automation issues created"
echo ""
echo "View all issues at: https://github.com/$REPO/issues"
echo ""
echo "Next steps:"
echo "1. Review and prioritize issues"
echo "2. Assign issues to milestones"
echo "3. Set up GitHub Projects for tracking"
echo "4. Configure automation workflows"