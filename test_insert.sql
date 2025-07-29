-- Insert sample data

-- USERS
INSERT INTO Users (username, password_hash, email, birthday, registration_date) VALUES
('john_doe', '$2a$12$RIgAFhU1VjH/K2y2b2aH..9', 'john.doe@example.com', '1990-05-15', '2022-01-10'),
('jane_smith', '$2a$12$RIgAFhU1VjH/K2y2b2aH..9', 'jane.smith@example.com', '1988-08-22', '2022-02-20'),
('alice_jones', '$2a$12$RIgAFhU1VjH/K2y2b2aH..9', 'alice.jones@example.com', '1995-01-30', '2022-03-05');

-- VEHICLES
INSERT INTO Vehicles (vin, make, model, year) VALUES
('1HGCM82638A123456', 'Honda', 'Civic', 2018),
('JTDKN31U890123456', 'Toyota', 'Camry', 2019),
('1G1FY1EEX01234567', 'Chevrolet', 'Malibu', 2020);

-- OWNS
INSERT INTO Owns (user_id, vin, start_date, end_date) VALUES
(1, '1HGCM82638A123456', '2022-01-15', NULL),
(2, 'JTDKN31U890123456', '2022-02-25', NULL),
(3, '1G1FY1EEX01234567', '2022-03-10', NULL);

-- CARSHOPS
INSERT INTO CarShops (name, street, city, state, zip_code, phone_number) VALUES
('AutoCare Center', '123 Main St', 'Anytown', 'USA', '12345', '555-1234'),
('ProTech Auto', '456 Oak Ave', 'Anytown', 'USA', '12345', '555-5678'),
('City Auto Repair', '789 Pine Ln', 'Anytown', 'USA', '12345', '555-8765');

-- MECHANICS
INSERT INTO Mechanics (car_shop_id, name, phone_number, email) VALUES
(1, 'Mike Miller', '555-1111', 'mike.miller@example.com'),
(1, 'Gary Smith', '555-2222', 'gary.smith@example.com'),
(2, 'Sarah Connor', '555-3333', 'sarah.connor@example.com');

-- SERVICERECORDS
INSERT INTO ServiceRecords (vin, service_date, current_mileage, cost, description) VALUES
('1HGCM82638A123456', '2023-05-20', 50000, 150.00, 'Oil change and tire rotation'),
('JTDKN31U890123456', '2023-06-15', 45000, 350.75, 'Brake pad replacement'),
('1G1FY1EEX01234567', '2023-07-01', 30000, 75.50, 'Air filter replacement');

-- WORKEDON
INSERT INTO WorkedOn (mechanic_id, service_id) VALUES
(1, 1),
(2, 1),
(3, 2),
(1, 3);

-- SERVICETYPES
INSERT INTO ServiceTypes (service_type) VALUES
('Oil Change'),
('Tire Rotation'),
('Brake Service'),
('Air Filter Replacement'),
('Transmission Fluid Change');

-- SERVICERECORDS_SERVICETYPES
INSERT INTO ServiceRecords_ServiceTypes (service_id, service_type) VALUES
(1, 'Oil Change'),
(1, 'Tire Rotation'),
(2, 'Brake Service'),
(3, 'Air Filter Replacement');

-- PARTS
INSERT INTO Parts (name, manufacturer, part_number, unit_price) VALUES
('Engine Oil 5W-30', 'Castrol', 'CAS-123', 12.50),
('Oil Filter', 'Bosch', 'BOS-456', 8.75),
('Front Brake Pads', 'Brembo', 'BRE-789', 55.00),
('Engine Air Filter', 'Fram', 'FRA-321', 15.25);

-- SERVICERECORDS_PARTS
INSERT INTO ServiceRecords_Parts (service_id, part_id) VALUES
(1, 1),
(1, 2),
(2, 3),
(3, 4);

-- EXPENSES
INSERT INTO Expenses (vin, date, category, amount, description) VALUES
('1HGCM82638A123456', '2023-01-15', 'Insurance', 600.00, '6-month premium'),
('JTDKN31U890123456', '2023-02-01', 'Registration', 150.00, 'Annual registration fee'),
('1G1FY1EEX01234567', '2023-04-10', 'Car Wash', 25.00, 'Full service car wash');

-- FUELLOG
INSERT INTO FuelLog (vin, date_filled, current_mileage, gallons, total_cost, fuel_type) VALUES
('1HGCM82638A123456', '2023-07-10', 52000, 10.5, 42.00, 'Regular'),
('JTDKN31U890123456', '2023-07-12', 46000, 12.2, 51.24, 'Regular'),
('1G1FY1EEX01234567', '2023-07-15', 31000, 14.0, 58.80, 'Regular');

-- MAINTENANCEEVENTS
INSERT INTO MaintenanceEvents (user_id, vin, rec_date, rec_mileage, status) VALUES
(1, '1HGCM82638A123456', '2023-11-20', 60000, 'Upcoming'),
(2, 'JTDKN31U890123456', '2024-01-15', 60000, 'Upcoming');

-- MAINTENANCEEVENTS_SERVICETYPES
INSERT INTO MaintenanceEvents_ServiceTypes (event_id, service_type) VALUES
(1, 'Oil Change'),
(1, 'Tire Rotation'),
(2, 'Transmission Fluid Change');

-- REMINDER
INSERT INTO Reminder (event_id, message, send_date, is_sent) VALUES
(1, 'Your Honda Civic is due for an oil change and tire rotation soon.', '2023-11-13', FALSE),
(2, 'Your Toyota Camry is due for a transmission fluid change.', '2024-01-08', FALSE);
