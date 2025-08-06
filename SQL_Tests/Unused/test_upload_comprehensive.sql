-- Comprehensive Test SQL File
-- This file contains multiple SQL statements to test the upload functionality

-- Statement 1: Insert a test user
INSERT INTO Users (username, password_hash, email, birthday, registration_date) 
VALUES ('testuser1', 'testhash1', 'test1@example.com', '1990-01-01', NOW());

-- Statement 2: Insert another test user
INSERT INTO Users (username, password_hash, email, birthday, registration_date) 
VALUES ('testuser2', 'testhash2', 'test2@example.com', '1995-05-15', NOW());

-- Statement 3: Insert a test vehicle
INSERT INTO Vehicles (vin, make, model, year) 
VALUES ('TEST1234567890123', 'Toyota', 'Camry', 2020);

-- Statement 4: Insert another test vehicle
INSERT INTO Vehicles (vin, make, model, year) 
VALUES ('TEST2345678901234', 'Honda', 'Civic', 2021);

-- Statement 5: Insert ownership relationship for first user
INSERT INTO Owns (user_id, vin, start_date) 
SELECT u.user_id, v.vin, NOW() 
FROM Users u, Vehicles v 
WHERE u.username = 'testuser1' AND v.vin = 'TEST1234567890123';

-- Statement 6: Insert ownership relationship for second user
INSERT INTO Owns (user_id, vin, start_date) 
SELECT u.user_id, v.vin, NOW() 
FROM Users u, Vehicles v 
WHERE u.username = 'testuser2' AND v.vin = 'TEST2345678901234';

-- Statement 7: Insert a car shop
INSERT INTO CarShops (name, street, city, state, zip_code, phone_number) 
VALUES ('Test Auto Shop', '123 Test St', 'Test City', 'CA', '90210', '555-0123');

-- Statement 8: Insert a mechanic
INSERT INTO Mechanics (car_shop_id, name, phone_number, email) 
SELECT cs.car_shop_id, 'Test Mechanic', '555-0456', 'mechanic@test.com'
FROM CarShops cs 
WHERE cs.name = 'Test Auto Shop';

-- Statement 9: Insert a service type
INSERT INTO ServiceTypes (service_type) 
VALUES ('Test Service');

-- Statement 10: Insert a service record
INSERT INTO ServiceRecords (vin, service_date, current_mileage, cost, description) 
SELECT v.vin, NOW(), 50000, 150.00, 'Test service record'
FROM Vehicles v 
WHERE v.vin = 'TEST1234567890123';

-- Statement 11: Insert service type relationship
INSERT INTO ServiceRecords_ServiceTypes (service_id, service_type) 
SELECT sr.service_id, st.service_type
FROM ServiceRecords sr, ServiceTypes st
WHERE sr.description = 'Test service record' AND st.service_type = 'Test Service';

-- Statement 12: Insert mechanic relationship
INSERT INTO WorkedOn (mechanic_id, service_id) 
SELECT m.mechanic_id, sr.service_id
FROM Mechanics m, ServiceRecords sr
WHERE m.name = 'Test Mechanic' AND sr.description = 'Test service record';

-- Statement 13: Insert an expense
INSERT INTO Expenses (vin, date, category, amount, description) 
SELECT v.vin, NOW(), 'Test Category', 75.00, 'Test expense'
FROM Vehicles v 
WHERE v.vin = 'TEST1234567890123';

-- Statement 14: Insert a fuel expense entry
INSERT INTO Expenses (vin, date, category, amount, description) 
SELECT v.vin, NOW(), 'Fuel', 45.00, 'Fuel expense - 12.5 gallons of Regular'
FROM Vehicles v 
WHERE v.vin = 'TEST1234567890123';

-- Statement 15: Insert a maintenance event
INSERT INTO UpcomingServices (user_id, vin, rec_date, rec_mileage, status) 
SELECT u.user_id, v.vin, NOW(), 50000, 'Scheduled'
FROM Users u, Vehicles v 
WHERE u.username = 'testuser1' AND v.vin = 'TEST1234567890123';

-- Statement 16: Insert maintenance event service type relationship
INSERT INTO UpcomingServices_ServiceTypes (event_id, service_type) 
SELECT me.event_id, st.service_type
FROM UpcomingServices me, ServiceTypes st
WHERE me.status = 'Scheduled' AND st.service_type = 'Test Service';

-- Statement 17: Insert a reminder
INSERT INTO Reminder (event_id, message, send_date, was_sent, was_read) 
SELECT me.event_id, 'Test reminder message', NOW(), FALSE, FALSE
FROM UpcomingServices me
WHERE me.status = 'Scheduled';

-- Statement 18: Insert a part
INSERT INTO Parts (name, manufacturer, part_number, unit_price) 
VALUES ('Test Part', 'Test Manufacturer', 'TP001', 25.00);

-- Statement 19: Insert part relationship
INSERT INTO ServiceRecords_Parts (service_id, part_id) 
SELECT sr.service_id, p.part_id
FROM ServiceRecords sr, Parts p
WHERE sr.description = 'Test service record' AND p.name = 'Test Part';

-- Statement 20: Final verification query
SELECT 'Comprehensive test data inserted successfully!' as message, COUNT(*) as total_statements_executed; 