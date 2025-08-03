-- Large Dataset Generator for Vehicle Management System
-- This script creates 5000 rows of realistic data for each table
-- Maintains proper relationships and follows the app's logic

-- Clear existing data (except admin users)
DELETE FROM Reminder;
DELETE FROM UpcomingServices_ServiceTypes;
DELETE FROM ServiceRecords_Parts;
DELETE FROM ServiceRecords_ServiceTypes;
DELETE FROM WorkedOn;
DELETE FROM UpcomingServices;
DELETE FROM Expenses;
DELETE FROM Parts;
DELETE FROM ServiceRecords;
DELETE FROM Mechanics;
DELETE FROM Owns;
DELETE FROM ServiceTypes;
DELETE FROM CarShops;
DELETE FROM Vehicles;
DELETE FROM Users WHERE is_admin = 0;

-- Reset auto-increment counters
ALTER TABLE Users AUTO_INCREMENT = 1;
ALTER TABLE CarShops AUTO_INCREMENT = 1;
ALTER TABLE Mechanics AUTO_INCREMENT = 1;
ALTER TABLE ServiceRecords AUTO_INCREMENT = 1;
ALTER TABLE Parts AUTO_INCREMENT = 1;
ALTER TABLE Expenses AUTO_INCREMENT = 1;
ALTER TABLE UpcomingServices AUTO_INCREMENT = 1;
ALTER TABLE Reminder AUTO_INCREMENT = 1;

-- Insert Service Types (needed for foreign key relationships)
INSERT IGNORE INTO ServiceTypes (service_type) VALUES 
('Oil Change'),
('Tire Rotation'),
('Brake Service'),
('Air Filter Replacement'),
('Battery Replacement'),
('Transmission Service'),
('Engine Tune-up'),
('Coolant Flush'),
('Spark Plug Replacement'),
('Fuel Filter Replacement'),
('Timing Belt Replacement'),
('Clutch Replacement'),
('Suspension Repair'),
('Exhaust System Repair'),
('Electrical System Repair');

-- Generate 5000 Users
INSERT INTO Users (username, password_hash, email, birthday, registration_date) 
SELECT 
    CONCAT('user', LPAD(numbers.n, 4, '0')) as username,
    'YWRtaW4=' as password_hash,
    CONCAT('user', LPAD(numbers.n, 4, '0'), '@example.com') as email,
    DATE_SUB(CURDATE(), INTERVAL FLOOR(RAND() * 365 * 50) DAY) as birthday,
    DATE_SUB(CURDATE(), INTERVAL FLOOR(RAND() * 365 * 5) DAY) as registration_date
FROM (
    SELECT 1 + ones.n + 10 * tens.n + 100 * hundreds.n + 1000 * thousands.n as n
    FROM (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) ones,
         (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) tens,
         (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) hundreds,
         (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) thousands
    WHERE 1 + ones.n + 10 * tens.n + 100 * hundreds.n + 1000 * thousands.n <= 5000
) numbers;

-- Generate 5000 Vehicles
INSERT INTO Vehicles (vin, year, make, model)
SELECT 
    CONCAT(
        CHAR(65 + FLOOR(RAND() * 26)), CHAR(65 + FLOOR(RAND() * 26)), CHAR(65 + FLOOR(RAND() * 26)),
        CHAR(48 + FLOOR(RAND() * 10)), CHAR(48 + FLOOR(RAND() * 10)), CHAR(48 + FLOOR(RAND() * 10)),
        CHAR(65 + FLOOR(RAND() * 26)), CHAR(65 + FLOOR(RAND() * 26)), CHAR(65 + FLOOR(RAND() * 26)),
        CHAR(48 + FLOOR(RAND() * 10)), CHAR(48 + FLOOR(RAND() * 10)), CHAR(48 + FLOOR(RAND() * 10)),
        CHAR(65 + FLOOR(RAND() * 26)), CHAR(65 + FLOOR(RAND() * 26)), CHAR(65 + FLOOR(RAND() * 26)),
        CHAR(48 + FLOOR(RAND() * 10)), CHAR(48 + FLOOR(RAND() * 10))
    ) as vin,
    2010 + FLOOR(RAND() * 14) as year,
    ELT(1 + FLOOR(RAND() * 15), 'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen', 'Hyundai', 'Kia', 'Mazda', 'Subaru', 'Lexus', 'Acura') as make,
    CASE 
        WHEN make = 'Toyota' THEN ELT(1 + FLOOR(RAND() * 5), 'Camry', 'Corolla', 'RAV4', 'Highlander', 'Tacoma')
        WHEN make = 'Honda' THEN ELT(1 + FLOOR(RAND() * 5), 'Civic', 'Accord', 'CR-V', 'Pilot', 'Odyssey')
        WHEN make = 'Ford' THEN ELT(1 + FLOOR(RAND() * 5), 'F-150', 'Escape', 'Explorer', 'Mustang', 'Focus')
        WHEN make = 'Chevrolet' THEN ELT(1 + FLOOR(RAND() * 5), 'Silverado', 'Equinox', 'Tahoe', 'Camaro', 'Malibu')
        WHEN make = 'Nissan' THEN ELT(1 + FLOOR(RAND() * 5), 'Altima', 'Sentra', 'Rogue', 'Pathfinder', 'Maxima')
        WHEN make = 'BMW' THEN ELT(1 + FLOOR(RAND() * 5), '3 Series', '5 Series', 'X3', 'X5', '7 Series')
        WHEN make = 'Mercedes-Benz' THEN ELT(1 + FLOOR(RAND() * 5), 'C-Class', 'E-Class', 'GLC', 'GLE', 'S-Class')
        WHEN make = 'Audi' THEN ELT(1 + FLOOR(RAND() * 5), 'A4', 'A6', 'Q5', 'Q7', 'A8')
        WHEN make = 'Volkswagen' THEN ELT(1 + FLOOR(RAND() * 5), 'Golf', 'Passat', 'Tiguan', 'Atlas', 'Jetta')
        WHEN make = 'Hyundai' THEN ELT(1 + FLOOR(RAND() * 5), 'Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Accent')
        WHEN make = 'Kia' THEN ELT(1 + FLOOR(RAND() * 5), 'Forte', 'Optima', 'Sportage', 'Sorento', 'Rio')
        WHEN make = 'Mazda' THEN ELT(1 + FLOOR(RAND() * 5), '3', '6', 'CX-5', 'CX-9', 'MX-5')
        WHEN make = 'Subaru' THEN ELT(1 + FLOOR(RAND() * 5), 'Impreza', 'Legacy', 'Forester', 'Outback', 'Crosstrek')
        WHEN make = 'Lexus' THEN ELT(1 + FLOOR(RAND() * 5), 'ES', 'IS', 'RX', 'NX', 'LS')
        WHEN make = 'Acura' THEN ELT(1 + FLOOR(RAND() * 5), 'TLX', 'ILX', 'RDX', 'MDX', 'NSX')
        ELSE 'Unknown'
    END as model
FROM (
    SELECT 1 + ones.n + 10 * tens.n + 100 * hundreds.n + 1000 * thousands.n as n
    FROM (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) ones,
         (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) tens,
         (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) hundreds,
         (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) thousands
    WHERE 1 + ones.n + 10 * tens.n + 100 * hundreds.n + 1000 * thousands.n <= 5000
) numbers;

-- Generate 5000 Car Shops
INSERT INTO CarShops (name, street, city, state, zip_code, phone_number)
SELECT 
    CONCAT(
        ELT(1 + FLOOR(RAND() * 10), 'Premium', 'Elite', 'Pro', 'Master', 'Expert', 'Quality', 'Reliable', 'Trusted', 'Professional', 'Advanced'),
        ' ',
        ELT(1 + FLOOR(RAND() * 8), 'Auto', 'Car', 'Vehicle', 'Motor', 'Engine', 'Transmission', 'Brake', 'Tire'),
        ' ',
        ELT(1 + FLOOR(RAND() * 6), 'Service', 'Repair', 'Center', 'Shop', 'Garage', 'Workshop')
    ) as name,
    CONCAT(FLOOR(RAND() * 9999) + 1, ' ', ELT(1 + FLOOR(RAND() * 10), 'Main St', 'Oak Ave', 'Pine Rd', 'Elm St', 'Maple Dr', 'Cedar Ln', 'Birch Way', 'Willow Ct', 'Spruce Blvd', 'Cherry St')) as street,
    ELT(1 + FLOOR(RAND() * 20), 'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte', 'San Francisco', 'Indianapolis', 'Seattle', 'Denver', 'Washington') as city,
    ELT(1 + FLOOR(RAND() * 50), 'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY') as state,
    CONCAT(FLOOR(RAND() * 9) + 1, FLOOR(RAND() * 9) + 1, FLOOR(RAND() * 9) + 1, FLOOR(RAND() * 9) + 1, FLOOR(RAND() * 9) + 1) as zip_code,
    CONCAT('(', FLOOR(RAND() * 9) + 1, FLOOR(RAND() * 9) + 1, FLOOR(RAND() * 9) + 1, ') ', FLOOR(RAND() * 9) + 1, FLOOR(RAND() * 9) + 1, FLOOR(RAND() * 9) + 1, '-', FLOOR(RAND() * 9) + 1, FLOOR(RAND() * 9) + 1, FLOOR(RAND() * 9) + 1, FLOOR(RAND() * 9) + 1) as phone_number
FROM (
    SELECT 1 + ones.n + 10 * tens.n + 100 * hundreds.n + 1000 * thousands.n as n
    FROM (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) ones,
         (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) tens,
         (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) hundreds,
         (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) thousands
    WHERE 1 + ones.n + 10 * tens.n + 100 * hundreds.n + 1000 * thousands.n <= 5000
) numbers;

-- Generate 5000 Mechanics
INSERT INTO Mechanics (car_shop_id, name, phone_number, email)
SELECT 
    1 + FLOOR(RAND() * (SELECT COUNT(*) FROM CarShops)) as car_shop_id,
    CONCAT(
        ELT(1 + FLOOR(RAND() * 20), 'John', 'Mike', 'David', 'Robert', 'James', 'William', 'Richard', 'Joseph', 'Thomas', 'Christopher', 'Charles', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua', 'Kenneth'),
        ' ',
        ELT(1 + FLOOR(RAND() * 20), 'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee')
    ) as name,
    CONCAT('(', FLOOR(RAND() * 9) + 1, FLOOR(RAND() * 9) + 1, FLOOR(RAND() * 9) + 1, ') ', FLOOR(RAND() * 9) + 1, FLOOR(RAND() * 9) + 1, FLOOR(RAND() * 9) + 1, '-', FLOOR(RAND() * 9) + 1, FLOOR(RAND() * 9) + 1, FLOOR(RAND() * 9) + 1, FLOOR(RAND() * 9) + 1) as phone_number,
    CONCAT('mechanic', LPAD(numbers.n, 4, '0'), '@autoshop.com') as email
FROM (
    SELECT 1 + ones.n + 10 * tens.n + 100 * hundreds.n + 1000 * thousands.n as n
    FROM (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) ones,
         (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) tens,
         (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) hundreds,
         (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) thousands
    WHERE 1 + ones.n + 10 * tens.n + 100 * hundreds.n + 1000 * thousands.n <= 5000
) numbers;

-- Generate 5000 Ownership Relationships
INSERT INTO Owns (user_id, vin, start_date, end_date)
SELECT 
    1 + FLOOR(RAND() * (SELECT COUNT(*) FROM Users)) as user_id,
    (SELECT vin FROM Vehicles ORDER BY RAND() LIMIT 1) as vin,
    DATE_SUB(CURDATE(), INTERVAL FLOOR(RAND() * 365 * 10) DAY) as start_date,
    CASE WHEN RAND() > 0.8 THEN DATE_ADD(CURDATE(), INTERVAL FLOOR(RAND() * 365) DAY) ELSE NULL END as end_date
FROM (
    SELECT 1 + ones.n + 10 * tens.n + 100 * hundreds.n + 1000 * thousands.n as n
    FROM (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) ones,
         (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) tens,
         (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) hundreds,
         (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) thousands
    WHERE 1 + ones.n + 10 * tens.n + 100 * hundreds.n + 1000 * thousands.n <= 5000
) numbers;

-- Generate 5000 Service Records
INSERT INTO ServiceRecords (vin, service_date, current_mileage, cost, description)
SELECT 
    (SELECT vin FROM Vehicles ORDER BY RAND() LIMIT 1) as vin,
    DATE_SUB(CURDATE(), INTERVAL FLOOR(RAND() * 365 * 3) DAY) as service_date,
    1000 + FLOOR(RAND() * 150000) as current_mileage,
    25.00 + FLOOR(RAND() * 975.00) as cost,
    CONCAT(
        ELT(1 + FLOOR(RAND() * 8), 'Oil Change', 'Tire Rotation', 'Brake Service', 'Air Filter Replacement', 'Battery Replacement', 'Transmission Service', 'Engine Tune-up', 'Coolant Flush'),
        ' - ',
        ELT(1 + FLOOR(RAND() * 5), 'Regular maintenance', 'Emergency repair', 'Preventive service', 'Warranty work', 'Customer request')
    ) as description
FROM (
    SELECT 1 + ones.n + 10 * tens.n + 100 * hundreds.n + 1000 * thousands.n as n
    FROM (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) ones,
         (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) tens,
         (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) hundreds,
         (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) thousands
    WHERE 1 + ones.n + 10 * tens.n + 100 * hundreds.n + 1000 * thousands.n <= 5000
) numbers;

-- Generate 5000 Parts
INSERT INTO Parts (name, manufacturer, part_number, unit_price)
SELECT 
    CONCAT(
        ELT(1 + FLOOR(RAND() * 10), 'Oil Filter', 'Air Filter', 'Brake Pads', 'Spark Plugs', 'Battery', 'Tires', 'Brake Rotors', 'Timing Belt', 'Water Pump', 'Alternator'),
        ' - ',
        ELT(1 + FLOOR(RAND() * 5), 'Standard', 'Premium', 'OEM', 'Performance', 'Economy')
    ) as name,
    ELT(1 + FLOOR(RAND() * 15), 'Bosch', 'Mobil 1', 'NGK', 'Brembo', 'Continental', 'Michelin', 'Bridgestone', 'Goodyear', 'Denso', 'Mann', 'Mahle', 'Fram', 'K&N', 'ACDelco', 'Motorcraft') as manufacturer,
    CONCAT(
        CHAR(65 + FLOOR(RAND() * 26)), CHAR(65 + FLOOR(RAND() * 26)), CHAR(65 + FLOOR(RAND() * 26)),
        '-',
        FLOOR(RAND() * 9) + 1, FLOOR(RAND() * 9) + 1, FLOOR(RAND() * 9) + 1, FLOOR(RAND() * 9) + 1
    ) as part_number,
    5.00 + FLOOR(RAND() * 495.00) as unit_price
FROM (
    SELECT 1 + ones.n + 10 * tens.n + 100 * hundreds.n + 1000 * thousands.n as n
    FROM (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) ones,
         (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) tens,
         (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) hundreds,
         (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) thousands
    WHERE 1 + ones.n + 10 * tens.n + 100 * hundreds.n + 1000 * thousands.n <= 5000
) numbers;

-- Generate 5000 Expenses
INSERT INTO Expenses (vin, date, category, amount, description)
SELECT 
    (SELECT vin FROM Vehicles ORDER BY RAND() LIMIT 1) as vin,
    DATE_SUB(CURDATE(), INTERVAL FLOOR(RAND() * 365 * 2) DAY) as date,
    ELT(1 + FLOOR(RAND() * 5), 'Maintenance', 'Fuel', 'Registration', 'Insurance', 'Misc') as category,
    10.00 + FLOOR(RAND() * 990.00) as amount,
    CASE 
        WHEN category = 'Fuel' THEN CONCAT('Fuel purchase - ', FLOOR(RAND() * 20) + 5, ' gallons')
        WHEN category = 'Insurance' THEN 'Monthly insurance payment'
        WHEN category = 'Registration' THEN 'Annual vehicle registration'
        WHEN category = 'Maintenance' THEN ELT(1 + FLOOR(RAND() * 5), 'Oil change', 'Tire rotation', 'Brake service', 'Air filter replacement', 'Battery replacement')
        ELSE ELT(1 + FLOOR(RAND() * 5), 'Car wash', 'Parking fee', 'Toll charge', 'Car detailing', 'Window tinting')
    END as description
FROM (
    SELECT 1 + ones.n + 10 * tens.n + 100 * hundreds.n + 1000 * thousands.n as n
    FROM (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) ones,
         (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) tens,
         (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) hundreds,
         (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) thousands
    WHERE 1 + ones.n + 10 * tens.n + 100 * hundreds.n + 1000 * thousands.n <= 5000
) numbers;

-- Generate 5000 Upcoming Services
INSERT INTO UpcomingServices (user_id, vin, rec_date, rec_mileage, status)
SELECT 
    1 + FLOOR(RAND() * (SELECT COUNT(*) FROM Users)) as user_id,
    (SELECT vin FROM Vehicles ORDER BY RAND() LIMIT 1) as vin,
    DATE_ADD(CURDATE(), INTERVAL FLOOR(RAND() * 365) DAY) as rec_date,
    5000 + FLOOR(RAND() * 100000) as rec_mileage,
    ELT(1 + FLOOR(RAND() * 4), 'Upcoming', 'Scheduled', 'Completed', 'Overdue') as status
FROM (
    SELECT 1 + ones.n + 10 * tens.n + 100 * hundreds.n + 1000 * thousands.n as n
    FROM (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) ones,
         (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) tens,
         (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) hundreds,
         (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) thousands
    WHERE 1 + ones.n + 10 * tens.n + 100 * hundreds.n + 1000 * thousands.n <= 5000
) numbers;

-- Generate 5000 Reminders
INSERT INTO Reminder (event_id, message, send_date, was_sent, was_read)
SELECT 
    1 + FLOOR(RAND() * (SELECT COUNT(*) FROM UpcomingServices)) as event_id,
    CONCAT(
        'Reminder: Your vehicle is due for ',
        ELT(1 + FLOOR(RAND() * 8), 'oil change', 'tire rotation', 'brake service', 'air filter replacement', 'battery check', 'transmission service', 'engine tune-up', 'coolant flush'),
        ' on ',
        DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL FLOOR(RAND() * 30) DAY), '%M %d, %Y')
    ) as message,
    DATE_SUB(CURDATE(), INTERVAL FLOOR(RAND() * 30) DAY) as send_date,
    FLOOR(RAND() * 2) as was_sent,
    FLOOR(RAND() * 2) as was_read
FROM (
    SELECT 1 + ones.n + 10 * tens.n + 100 * hundreds.n + 1000 * thousands.n as n
    FROM (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) ones,
         (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) tens,
         (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) hundreds,
         (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) thousands
    WHERE 1 + ones.n + 10 * tens.n + 100 * hundreds.n + 1000 * thousands.n <= 5000
) numbers;

-- Generate Service Records - Service Types relationships
INSERT INTO ServiceRecords_ServiceTypes (service_id, service_type)
SELECT 
    1 + FLOOR(RAND() * (SELECT COUNT(*) FROM ServiceRecords)) as service_id,
    (SELECT service_type FROM ServiceTypes ORDER BY RAND() LIMIT 1) as service_type
FROM (
    SELECT 1 + ones.n + 10 * tens.n + 100 * hundreds.n + 1000 * thousands.n as n
    FROM (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) ones,
         (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) tens,
         (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) tens,
         (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) thousands
    WHERE 1 + ones.n + 10 * tens.n + 100 * hundreds.n + 1000 * thousands.n <= 5000
) numbers;

-- Generate Service Records - Parts relationships
INSERT INTO ServiceRecords_Parts (service_id, part_id)
SELECT 
    1 + FLOOR(RAND() * (SELECT COUNT(*) FROM ServiceRecords)) as service_id,
    1 + FLOOR(RAND() * (SELECT COUNT(*) FROM Parts)) as part_id
FROM (
    SELECT 1 + ones.n + 10 * tens.n + 100 * hundreds.n + 1000 * thousands.n as n
    FROM (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) ones,
         (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) tens,
         (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) hundreds,
         (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) thousands
    WHERE 1 + ones.n + 10 * tens.n + 100 * hundreds.n + 1000 * thousands.n <= 5000
) numbers;

-- Generate WorkedOn relationships
INSERT INTO WorkedOn (mechanic_id, service_id)
SELECT 
    1 + FLOOR(RAND() * (SELECT COUNT(*) FROM Mechanics)) as mechanic_id,
    1 + FLOOR(RAND() * (SELECT COUNT(*) FROM ServiceRecords)) as service_id
FROM (
    SELECT 1 + ones.n + 10 * tens.n + 100 * hundreds.n + 1000 * thousands.n as n
    FROM (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) ones,
         (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) tens,
         (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) hundreds,
         (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) thousands
    WHERE 1 + ones.n + 10 * tens.n + 100 * hundreds.n + 1000 * thousands.n <= 5000
) numbers;

-- Generate Upcoming Services - Service Types relationships
INSERT INTO UpcomingServices_ServiceTypes (event_id, service_type)
SELECT 
    1 + FLOOR(RAND() * (SELECT COUNT(*) FROM UpcomingServices)) as event_id,
    (SELECT service_type FROM ServiceTypes ORDER BY RAND() LIMIT 1) as service_type
FROM (
    SELECT 1 + ones.n + 10 * tens.n + 100 * hundreds.n + 1000 * thousands.n as n
    FROM (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) ones,
         (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) tens,
         (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) hundreds,
         (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) thousands
    WHERE 1 + ones.n + 10 * tens.n + 100 * hundreds.n + 1000 * thousands.n <= 5000
) numbers;

-- Display summary
SELECT 'Data Generation Complete!' as status;
SELECT COUNT(*) as total_users FROM Users;
SELECT COUNT(*) as total_vehicles FROM Vehicles;
SELECT COUNT(*) as total_car_shops FROM CarShops;
SELECT COUNT(*) as total_mechanics FROM Mechanics;
SELECT COUNT(*) as total_ownerships FROM Owns;
SELECT COUNT(*) as total_service_records FROM ServiceRecords;
SELECT COUNT(*) as total_parts FROM Parts;
SELECT COUNT(*) as total_expenses FROM Expenses;
SELECT COUNT(*) as total_upcoming_services FROM UpcomingServices;
SELECT COUNT(*) as total_reminders FROM Reminder; 