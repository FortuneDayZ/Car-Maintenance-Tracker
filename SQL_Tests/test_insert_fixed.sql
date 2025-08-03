-- Fixed version of test_insert.sql that addresses common error issues
-- This version uses INSERT IGNORE to handle duplicates and proper data ordering

-- Remove the USE statement as it can cause issues
-- USE `Final`;

-- First, ensure service types exist (needed for foreign key constraints)
INSERT IGNORE INTO ServiceTypes (service_type) VALUES 
('Oil Change'),
('Tire Rotation'),
('Brake Service'),
('Air Filter Replacement'),
('Battery Replacement'),
('Transmission Service'),
('Engine Tune-up'),
('Coolant Flush');

-- Insert users with correct password hash format (YWRtaW4= = 'admin' in base64)
INSERT IGNORE INTO Users (username, password_hash, email, birthday, registration_date) VALUES
('johndoe', 'YWRtaW4=', 'johndoe@example.com', '1990-01-15', '2022-01-01'),
('janesmith', 'YWRtaW4=', 'janesmith@example.com', '1992-03-22', '2022-01-02'),
('alicejones', 'YWRtaW4=', 'alicejones@example.com', '1985-07-30', '2022-01-03'),
('bobbrown', 'YWRtaW4=', 'bobbrown@example.com', '1995-11-05', '2022-01-04'),
('charliedavis', 'YWRtaW4=', 'charliedavis@example.com', '2000-02-10', '2022-01-05'),
('testuser1', 'YWRtaW4=', 'test1@example.com', '1990-01-01', '2023-01-01'),
('testuser2', 'YWRtaW4=', 'test2@example.com', '1991-02-02', '2023-01-02'),
('testuser3', 'YWRtaW4=', 'test3@example.com', '1992-03-03', '2023-01-03');

-- Insert vehicles first (needed for foreign key relationships)
INSERT IGNORE INTO Vehicles (vin, year, make, model) VALUES
('1ABC123XYZ4567890', 2020, 'Toyota', 'Camry'),
('2DEF456ABC7890123', 2019, 'Honda', 'Civic'),
('3GHI789DEF0123456', 2021, 'Ford', 'Focus'),
('4JKL012GHI3456789', 2018, 'Chevrolet', 'Silverado'),
('5MNO345JKL6789012', 2022, 'Nissan', 'Altima'),
('TEST001', 2020, 'Toyota', 'Camry'),
('TEST002', 2019, 'Honda', 'Civic'),
('TEST003', 2021, 'Ford', 'Focus');

-- Insert ownership relationships (after users and vehicles exist)
INSERT IGNORE INTO Owns (user_id, vin, start_date) VALUES
(1, '1ABC123XYZ4567890', '2022-01-01'),
(2, '2DEF456ABC7890123', '2022-01-02'),
(3, '3GHI789DEF0123456', '2022-01-03'),
(4, '4JKL012GHI3456789', '2022-01-04'),
(5, '5MNO345JKL6789012', '2022-01-05'),
(6, 'TEST001', '2023-01-01'),
(7, 'TEST002', '2023-01-02'),
(8, 'TEST003', '2023-01-03');

-- Insert service records (after vehicles exist)
INSERT IGNORE INTO ServiceRecords (vin, service_date, current_mileage, cost, description) VALUES
('1ABC123XYZ4567890', '2023-01-15', 15000, 75.00, 'Oil Change and Tire Rotation'),
('2DEF456ABC7890123', '2023-02-20', 25000, 250.00, 'Brake Service'),
('3GHI789DEF0123456', '2023-03-10', 10000, 45.00, 'Air Filter Replacement'),
('4JKL012GHI3456789', '2023-04-05', 45000, 400.00, 'Transmission Service'),
('5MNO345JKL6789012', '2023-05-12', 5000, 300.00, 'Engine Tune-up'),
('TEST001', '2023-06-01', 15000, 50.00, 'Oil Change'),
('TEST002', '2023-06-15', 25000, 200.00, 'Brake Service'),
('TEST003', '2023-07-01', 10000, 30.00, 'Tire Rotation');

-- Insert expenses (after vehicles exist)
INSERT IGNORE INTO Expenses (vin, date, category, amount, description) VALUES
('1ABC123XYZ4567890', '2023-01-20', 'Insurance', 120.00, 'Monthly insurance payment'),
('2DEF456ABC7890123', '2023-02-01', 'Registration', 200.00, 'Annual vehicle registration'),
('3GHI789DEF0123456', '2023-03-15', 'Misc', 25.00, 'Premium car wash'),
('4JKL012GHI3456789', '2023-04-10', 'Misc', 50.00, 'Monthly parking pass'),
('5MNO345JKL6789012', '2023-05-25', 'Misc', 30.00, 'Toll road charges');

-- Insert fuel expenses (after vehicles exist)
INSERT IGNORE INTO Expenses (vin, date, category, amount, description) VALUES
('1ABC123XYZ4567890', '2023-01-05', 'Fuel', 50.00, 'Fuel expense - 12.5 gallons of Regular'),
('1ABC123XYZ4567890', '2023-01-15', 'Fuel', 52.50, 'Fuel expense - 13.0 gallons of Regular'),
('2DEF456ABC7890123', '2023-02-10', 'Fuel', 45.90, 'Fuel expense - 10.2 gallons of Premium'),
('3GHI789DEF0123456', '2023-03-18', 'Fuel', 80.00, 'Fuel expense - 20.0 gallons of Diesel'),
('5MNO345JKL6789012', '2023-05-10', 'Fuel', 62.00, 'Fuel expense - 15.5 gallons of Regular');

-- Insert upcoming services (after users and vehicles exist)
INSERT IGNORE INTO UpcomingServices (user_id, vin, rec_date, rec_mileage, status) VALUES
(1, '1ABC123XYZ4567890', '2023-07-10', 30000, 'Upcoming'),
(2, '2DEF456ABC7890123', '2023-08-15', 40000, 'Scheduled'),
(3, '3GHI789DEF0123456', '2023-09-20', 20000, 'Completed'),
(4, '4JKL012GHI3456789', '2023-10-05', 15000, 'Upcoming'),
(5, '5MNO345JKL6789012', '2023-11-12', 60000, 'Overdue');

-- Insert reminders (after upcoming services exist)
INSERT IGNORE INTO Reminder (event_id, message, send_date, was_sent, was_read) VALUES
(1, 'Your Toyota Camry is due for an oil change and tire rotation soon.', '2023-07-01', 0, 0),
(2, 'Your Honda Civic has a scheduled brake service on 2023-08-15.', '2023-08-01', 0, 0),
(4, 'Reminder: Your Chevrolet Silverado is due for its next oil change.', '2023-09-25', 0, 0),
(5, 'URGENT: Your Nissan Altima is overdue for a transmission service.', '2023-11-01', 0, 0); 