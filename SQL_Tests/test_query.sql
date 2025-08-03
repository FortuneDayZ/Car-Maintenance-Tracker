-- Users Table Queries

SELECT * FROM Users;
SELECT * FROM Users WHERE username = 'john_doe';
UPDATE Users SET email = 'john.d.new@example.com' WHERE username = 'john_doe';
-- DELETE FROM Users WHERE username = 'test_user';

-- Vehicles Table Queries
SELECT * FROM Vehicles;
SELECT * FROM Vehicles WHERE make = 'Honda';
UPDATE Vehicles SET `year` = 2019 WHERE vin = '2G1FY2EEX01234568';
-- DELETE FROM Vehicles WHERE vin = '2G1FY2EEX01234568';

-- Owns Table Queries
SELECT * FROM Owns;
SELECT v.* FROM Vehicles v JOIN Owns o ON v.vin = o.vin WHERE o.user_id = 1;
UPDATE Owns SET end_date = '2023-07-31' WHERE user_id = 1 AND vin = '1HGCM82638A123456';
-- DELETE FROM Owns WHERE user_id = 1 AND vin = '2G1FY2EEX01234568';

-- CarShops Table Queries
SELECT * FROM CarShops;
UPDATE CarShops SET phone_number = '555-1235' WHERE car_shop_id = 1;
-- DELETE FROM CarShops WHERE name = 'Reliable Motors';

-- Mechanics Table Queries
SELECT * FROM Mechanics;
SELECT m.* FROM Mechanics m JOIN CarShops cs ON m.car_shop_id = cs.car_shop_id WHERE cs.name = 'AutoCare Center';
-- DELETE FROM Mechanics WHERE email = 'david.chen@example.com';

-- ServiceRecords Table Queries
SELECT * FROM ServiceRecords;
SELECT * FROM ServiceRecords WHERE vin = '1HGCM82638A123456';
UPDATE ServiceRecords SET cost = 160.00 WHERE service_id = 1;
-- DELETE FROM ServiceRecords WHERE service_id = 4;

-- WorkedOn Table Queries
SELECT * FROM WorkedOn;
-- DELETE FROM WorkedOn WHERE mechanic_id = 1 AND service_id = 4;

-- ServiceTypes Table Queries
SELECT * FROM ServiceTypes;
-- DELETE FROM ServiceTypes WHERE service_type = 'Battery Replacement';

-- ServiceRecords_ServiceTypes Table Queries
SELECT * FROM ServiceRecords_ServiceTypes;
-- DELETE FROM ServiceRecords_ServiceTypes WHERE service_id = 4;

-- Parts Table Queries
SELECT * FROM Parts;
UPDATE Parts SET unit_price = 12.99 WHERE part_id = 1;
-- DELETE FROM Parts WHERE part_id = 5;

-- ServiceRecords_Parts Table Queries
SELECT * FROM ServiceRecords_Parts;
-- DELETE FROM ServiceRecords_Parts WHERE service_id = 4;

-- Expenses Table Queries
SELECT * FROM Expenses;
SELECT * FROM Expenses WHERE vin = '1HGCM82638A123456';
UPDATE Expenses SET amount = 28.00 WHERE expense_id = 3;
-- DELETE FROM Expenses WHERE expense_id = 4;

-- FuelExpenses Table Queries
SELECT e.*, fe.gallons, fe.current_mileage, fe.fuel_type FROM Expenses e JOIN FuelExpenses fe ON e.expense_id = fe.expense_id WHERE e.category = 'Fuel';
SELECT e.*, fe.gallons, fe.current_mileage, fe.fuel_type FROM Expenses e JOIN FuelExpenses fe ON e.expense_id = fe.expense_id WHERE e.category = 'Fuel' AND e.vin = 'JTDKN31U890123456';
UPDATE Expenses SET amount = 43.50 WHERE expense_id = 1;


-- UpcomingServices Table Queries
SELECT * FROM UpcomingServices;
SELECT * FROM UpcomingServices WHERE `status` = 'Upcoming';
UPDATE UpcomingServices SET `status` = 'Completed' WHERE event_id = 1;
-- DELETE FROM UpcomingServices WHERE event_id = 3;

-- UpcomingServices_ServiceTypes Table Queries
SELECT * FROM UpcomingServices_ServiceTypes;
-- DELETE FROM UpcomingServices_ServiceTypes WHERE event_id = 3;

-- ReminderNotifications Table Queries
SELECT * FROM Reminder;
SELECT * FROM Reminder WHERE was_sent = FALSE;
UPDATE Reminder SET was_sent = TRUE WHERE reminder_id = 1;
-- DELETE FROM ReminderNotifications WHERE reminder_id = 3;