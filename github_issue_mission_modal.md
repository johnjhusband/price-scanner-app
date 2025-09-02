✅ GitHub Ticket: Add Mission Modal to Login Page

## Problem
Users needed a way to view the company mission statement. Initially attempted to add as a separate page route (/mission) but nginx configuration prevented proper routing without server access.

## Solution Implemented
Created a Mission modal that opens from the login page footer, keeping the experience within the React app.

## Implementation Details

### 1. Created MissionModal Component
- New component at `/mobile-app/components/MissionModal.js`
- Full-screen modal with mission content
- Styled according to brand guidelines:
  - Deep Teal (#1D5C5A) for headers
  - Soft Cream (#F3EFEA) background sections
  - Poppins font family
  - Proper color contrast for accessibility

### 2. Updated EnterScreen (Login Page)
- Added Mission link to footer next to Contact
- Footer now shows: "By entering, you agree to our Terms and Privacy Contact · Mission"
- Mission link opens modal when clicked
- Imported and integrated MissionModal component

### 3. Removed Links from Photo Upload Page
- Removed Contact and Mission links from App.js footer
- These links belong on the login page, not the authenticated photo upload page
- Kept only the disclaimer and trademark text in the authenticated footer

## Files Modified
1. `/mobile-app/components/MissionModal.js` - New component
2. `/mobile-app/components/EnterScreen.js` - Added Mission link and modal
3. `/mobile-app/App.js` - Removed footer links
4. `/mobile-app/mission.html` - Created but not used (kept for potential future nginx routing)
5. `/backend/setupLegalPages.js` - Added mission route (for future use)

## Testing
- Mission link appears in login page footer
- Clicking Mission opens full-screen modal
- Modal displays all mission content with proper styling
- Close button (X) returns user to login page
- Works on both web and mobile platforms

## Status
✅ Complete - Mission modal is live on blue.flippi.ai login page