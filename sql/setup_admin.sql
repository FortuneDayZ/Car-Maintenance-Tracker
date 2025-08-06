-- Admin User Setup Script

USE Final;

-- Create admin user if it doesn't exist
INSERT IGNORE INTO Users (username, password_hash, email, birthday, registration_date, is_admin) 
VALUES ('admin', 'YWRtaW4=====================================================', 'admin@example.com', '1990-01-01', CURDATE(), 1);

SELECT 'Admin user setup completed' as status; 