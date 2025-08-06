-- Populate ServiceTypes table with predefined service types
-- This script can be run manually if the automatic initialization doesn't work

USE Final;

-- Clear existing service types (optional - uncomment if you want to reset)
-- DELETE FROM ServiceTypes;

-- Insert predefined service types
INSERT INTO ServiceTypes (service_type) VALUES 
('Oil Change'),
('Tire Rotation'),
('Brake Service'),
('Air Filter Replacement'),
('Battery Replacement'),
('Transmission Service'),
('Engine Tune-up'),
('Coolant Flush')
ON DUPLICATE KEY UPDATE service_type = service_type;

-- Verify the insertion
SELECT * FROM ServiceTypes ORDER BY service_type; 