#!/bin/bash

echo "Creating all feature issues..."

# Create each issue and show the URL
echo "1. Creating image upload feature..."
gh issue create --title "Feature: Take photos directly with phone camera" --body "## Feature ID: F-002
## As a reseller at a thrift store, I want to take photos directly so I can quickly check prices

### Product Owner Test Cases:
- [ ] I can tap 'Use Camera' on my iPhone
- [ ] I can tap 'Use Camera' on my Android phone
- [ ] The camera opens showing the rear camera (not selfie)
- [ ] I can take a photo and see it analyzed immediately
- [ ] I can cancel without taking a photo and return to main screen
- [ ] If I deny camera permission, I see instructions on how to enable it
- [ ] The camera works over HTTPS (required for web)

### Acceptance Criteria:
- Works on iOS Safari
- Works on Android Chrome
- Graceful handling of permission denial
- Uses rear camera by default
- Clear capture button

**Status**: ✅ Implemented"

echo "2. Creating desktop camera feature..."
gh issue create --title "Feature: Use webcam on desktop/laptop" --body "## Feature ID: F-003
## As a reseller working from home, I want to use my laptop camera to photograph items

### Product Owner Test Cases:
- [ ] Camera button only appears if my laptop has a camera
- [ ] I can click 'Use Camera' and see my webcam view
- [ ] I can capture a photo with a clear button
- [ ] The photo is analyzed just like uploaded images
- [ ] I can cancel and go back to the main screen
- [ ] If no camera is detected, the button doesn't show

### Acceptance Criteria:
- Auto-detects camera availability
- Works on Chrome, Safari, Firefox, Edge
- Same analysis quality as uploaded images
- Clear visual capture button

**Status**: ✅ Implemented in v2.0"

echo "3. Creating drag & drop feature..."
gh issue create --title "Feature: Drag and drop images to upload" --body "## Feature ID: F-004
## As a desktop user, I want to drag images from my computer for faster workflow

### Product Owner Test Cases:
- [ ] I can drag an image from my desktop to the upload area
- [ ] The upload area highlights when I drag over it
- [ ] When I drop the image, it uploads automatically
- [ ] If I drag a non-image file, I get an error message
- [ ] This works on Windows with Chrome
- [ ] This works on Windows with Edge
- [ ] This works on Mac with Safari
- [ ] This works on Mac with Chrome

### Acceptance Criteria:
- Visual feedback during drag (border color change)
- Clear drop zone
- Same file validations as regular upload
- Works across major browsers and OS

**Status**: ✅ Implemented in v2.0 (Mac fixes applied)"

echo "4. Creating paste feature..."
gh issue create --title "Feature: Paste images from clipboard" --body "## Feature ID: F-005
## As a power user, I want to paste screenshots for quick price checks

### Product Owner Test Cases:
- [ ] I can take a screenshot and paste with Ctrl+V (Windows)
- [ ] I can take a screenshot and paste with Cmd+V (Mac)
- [ ] I can copy an image from a website and paste it
- [ ] The pasted image is analyzed immediately
- [ ] If I paste text, nothing happens (no error)
- [ ] This works in Chrome on Windows
- [ ] This works in Safari on Mac
- [ ] This works in Chrome on Mac

### Acceptance Criteria:
- Supports standard OS paste shortcuts
- Works with screenshots
- Works with copied web images
- No disruption if non-image pasted

**Status**: ✅ Implemented in v2.0 (Mac fixes applied)"

echo "5. Creating basic analysis feature..."
gh issue create --title "Feature: Get resale price estimates" --body "## Feature ID: F-006
## As a reseller, I want accurate pricing so I can make profitable buying decisions

### Product Owner Test Cases:
- [ ] I see the item name/description
- [ ] I see a price range (e.g., \$15-25)
- [ ] I see the recommended platform (eBay, Poshmark, etc.)
- [ ] I see the condition assessment
- [ ] I see the max buy price (using ÷5 rule)
- [ ] I see the style tier (Entry/Designer/Luxury)
- [ ] Results make sense for the item shown
- [ ] Luxury items show higher prices than regular brands

### Acceptance Criteria:
- Accurate item identification
- Realistic price ranges
- Platform recommendation based on item type
- Clear display of all information
- Buy price prominently shown

**Status**: ✅ Implemented"

echo "6. Creating enhanced analysis feature..."
gh issue create --title "Feature: Advanced scoring and insights" --body "## Feature ID: F-007
## As an experienced reseller, I want detailed insights to maximize profit

### Product Owner Test Cases:
- [ ] I see an authenticity score (0-100%) with color coding
- [ ] I see a 'Boca Score' showing how fast it might sell
- [ ] High Boca scores (80+) show fire emoji
- [ ] I can click 'Show More Details' to see insights
- [ ] I see specific market insights for this item
- [ ] I see selling tips tailored to the item
- [ ] I see brand background information
- [ ] I see seasonal selling advice
- [ ] I can hide details to see just basics

### Acceptance Criteria:
- Authenticity score helps identify fakes
- Boca score indicates market demand
- Insights are specific, not generic
- Information is actionable
- UI remains clean with expandable sections

**Status**: ✅ Implemented in v2.0"

echo "7. Creating visual display feature..."
gh issue create --title "Feature: Visual indicators for scores" --body "## Feature ID: F-009
## As a visual learner, I want color-coded results for quick decisions

### Product Owner Test Cases:
- [ ] Authenticity scores are color coded (red=fake, green=real)
- [ ] Boca scores show trend indicators (fire/chart emojis)
- [ ] Style tiers have colored badges
- [ ] Buy price is highlighted in green
- [ ] Important warnings are in red
- [ ] The colors help me make quick decisions
- [ ] Color blind users can still read the numbers

### Acceptance Criteria:
- Consistent color scheme
- Colors enhance, don't replace text
- Mobile-friendly display
- Accessible design

**Status**: ✅ Implemented in v2.0"

echo "8. Creating deployment feature..."
gh issue create --title "Feature: Zero-downtime deployments" --body "## Feature ID: F-015
## As the app owner, I want updates without service interruption

### Product Owner Test Cases:
- [ ] Updates can be tested at blue.flippi.ai
- [ ] Production at app.flippi.ai stays stable during testing
- [ ] I can switch between blue and green environments
- [ ] SSL certificates work for all domains
- [ ] No downtime during deployments
- [ ] Easy rollback if issues found

### Acceptance Criteria:
- Separate blue and green environments
- Both environments fully functional
- Quick switching mechanism
- Monitoring for both environments

**Status**: ✅ Implemented"

echo ""
echo "Done! All feature issues created."