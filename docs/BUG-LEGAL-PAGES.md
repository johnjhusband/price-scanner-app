# BUG: Legal Pages (Terms & Privacy) Not Accessible

**Date**: July 26, 2025  
**Environment**: blue.flippi.ai  
**Severity**: Medium  
**Status**: Open

## Issue Description

The Terms and Privacy links in the footer of the landing page are not working properly. When clicked, they either:
- Show the main application instead of the legal content
- Fail to navigate to the correct location
- Return 404 errors

## Expected Behavior

Clicking the Terms or Privacy links should:
- Open the respective legal page (terms.html or privacy.html)
- Display the legal content in a new tab
- Work consistently across all environments

## Current Implementation

1. **HTML Files**: Located at `/mobile-app/terms.html` and `/mobile-app/privacy.html`
2. **Frontend Links**: Currently using `window.open('/terms', '_blank')` and `window.open('/privacy', '_blank')`
3. **Backend Routes**: Added Express routes to serve the HTML files
4. **Nginx Config**: Templates updated but not properly deployed

## Root Cause

The issue stems from conflicting routing approaches:
- Nginx catch-all route (`location /`) intercepts the /terms and /privacy URLs
- The React app's routing takes precedence over static file serving
- Nginx configuration updates require manual deployment which hasn't been completed

## Attempted Solutions

1. ✅ Updated nginx templates with exact match locations (`location = /terms`)
2. ✅ Added Express backend routes to serve the HTML files
3. ❌ Nginx configuration not properly deployed to server
4. ❌ Considered pointing to production URLs but reverted per requirements

## Recommended Fix

### Option 1: Nginx Configuration (Preferred)
- Deploy the updated nginx templates that include exact match locations
- Ensure legal page locations are defined BEFORE the catch-all route
- Test thoroughly after deployment

### Option 2: Backend Proxy (Current Workaround)
- Keep the Express routes that serve the HTML files
- Ensure the backend properly handles these routes
- May have performance implications

### Option 3: Static Hosting
- Host legal pages on a separate subdomain (e.g., legal.flippi.ai)
- Update links to point to the static hosted versions
- Removes complexity from main application

## Steps to Reproduce

1. Navigate to https://blue.flippi.ai
2. Scroll to footer
3. Click on "Terms" or "Privacy" links
4. Observe that legal pages don't display correctly

## Notes

- Legal pages should typically only exist on production, but for testing purposes we're implementing on blue
- The issue affects user trust as legal compliance links are non-functional
- This needs to be resolved before the Tuesday launch