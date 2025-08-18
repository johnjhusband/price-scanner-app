# QA Test – Verify Growth Tab Questions Route

**Environment**: Blue

## Steps:
1. Log in to app.
2. Navigate to Growth tab.
3. Click "Questions".

## Expected:
User stays on /growth/questions and sees Reddit post selection screen.

## Actual:
Redirects to Upload Photo page.

**Severity**: High – Feature inaccessible.

## QA Note
Add regression check to confirm /growth/questions consistently loads correct component after deployment.