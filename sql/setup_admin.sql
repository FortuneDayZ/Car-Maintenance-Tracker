-- Admin User Setup Script
-- Run this script to ensure admin user exists in the database

USE Final;

-- Delete existing admin user to ensure clean setup
DELETE FROM Users WHERE username = 'admin';

-- Create admin user with correct password hash
-- Password: admin
-- Hash: btoa('admin').substring(0, 8).padEnd(60, '=') = 'YWRtaW4=' + 52 '=' characters
INSERT INTO Users (username, password_hash, email, birthday, registration_date) 
VALUES ('admin', 'YWRtaW4=====================================================', 'admin@example.com', '1990-01-01', '2024-01-01');

SELECT 'Admin user setup completed' as status; 