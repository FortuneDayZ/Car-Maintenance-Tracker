-- Test Admin Login Setup
-- This script verifies the admin user exists with correct credentials

USE Final;

-- Check if admin user exists
SELECT 
    user_id,
    username,
    email,
    LENGTH(password_hash) as hash_length,
    password_hash,
    birthday,
    registration_date
FROM Users 
WHERE username = 'admin';

-- Test the password hash calculation
-- The hash should be: btoa('admin').substring(0, 8).padEnd(60, '=')
-- Which equals: 'YWRtaW4=' + 52 '=' characters
-- Total length should be 60 characters

SELECT 
    'Expected hash length: 60' as test,
    CASE 
        WHEN LENGTH(password_hash) = 60 THEN 'PASS'
        ELSE 'FAIL - Hash length should be 60'
    END as result
FROM Users 
WHERE username = 'admin'; 