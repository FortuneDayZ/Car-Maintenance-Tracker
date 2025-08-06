-- Test SQL file for upload functionality
-- This file contains sample SQL statements to test the upload feature

-- Insert a test user
INSERT INTO Users (username, password_hash, email, birthday, registration_date) 
VALUES ('testuser', 'testhash', 'test@example.com', '1990-01-01', NOW());

-- Insert a test vehicle
INSERT INTO Vehicles (vin, make, model, year) 
VALUES ('TEST1234567890123', 'Toyota', 'Camry', 2020);

-- Insert ownership relationship
INSERT INTO Owns (user_id, vin, start_date) 
SELECT u.user_id, v.vin, NOW() 
FROM Users u, Vehicles v 
WHERE u.username = 'testuser' AND v.vin = 'TEST1234567890123';

-- Select to verify the data
SELECT 'Test data inserted successfully!' as message; 