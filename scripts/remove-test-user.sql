-- Script to remove test user (tara@edgy.co) from production database
-- Run this with: sqlite3 /tmp/flippi-feedback.db < remove-test-user.sql

-- First, show the user to be removed
SELECT '=== User to be removed ===' as '';
SELECT id, email, name, google_id, created_at, last_login 
FROM users 
WHERE email = 'tara@edgy.co';

-- Show total user count before deletion
SELECT '' as '';
SELECT '=== Total users before deletion: ' || COUNT(*) as '' FROM users;

-- Delete the test user
DELETE FROM users WHERE email = 'tara@edgy.co';

-- Show how many rows were affected
SELECT '' as '';
SELECT '=== Rows deleted: ' || changes() as '';

-- Verify the user is gone
SELECT '' as '';
SELECT '=== Verification - should return 0: ' || COUNT(*) as '' 
FROM users 
WHERE email = 'tara@edgy.co';

-- Show total user count after deletion
SELECT '' as '';
SELECT '=== Total users after deletion: ' || COUNT(*) as '' FROM users;