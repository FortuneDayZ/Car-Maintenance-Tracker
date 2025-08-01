-- Clear all data from tables while preserving the schema
-- This will remove all data but keep the table structure intact

USE `Final`;

-- Temporarily disable safe update mode
SET SQL_SAFE_UPDATES = 0;

-- Clear junction tables first (they reference other tables)
DELETE FROM `Reminder`;
DELETE FROM `MaintenanceEvents_ServiceTypes`;
DELETE FROM `ServiceRecords_Parts`;
DELETE FROM `ServiceRecords_ServiceTypes`;
DELETE FROM `WorkedOn`;

-- Clear dependent tables (tables that reference other tables)
DELETE FROM `MaintenanceEvents`;
DELETE FROM `FuelLog`;
DELETE FROM `Expenses`;
DELETE FROM `Parts`;
DELETE FROM `ServiceRecords`;
DELETE FROM `Mechanics`;
DELETE FROM `Owns`;

-- Clear independent tables (tables that don't reference other tables)
DELETE FROM `ServiceTypes`;
DELETE FROM `CarShops`;
DELETE FROM `Vehicles`;
DELETE FROM `Users`;

-- Re-enable safe update mode
SET SQL_SAFE_UPDATES = 1;

-- Reset auto-increment counters
ALTER TABLE `Users` AUTO_INCREMENT = 1;
ALTER TABLE `CarShops` AUTO_INCREMENT = 1;
ALTER TABLE `Mechanics` AUTO_INCREMENT = 1;
ALTER TABLE `ServiceRecords` AUTO_INCREMENT = 1;
ALTER TABLE `Parts` AUTO_INCREMENT = 1;
ALTER TABLE `Expenses` AUTO_INCREMENT = 1;
ALTER TABLE `FuelLog` AUTO_INCREMENT = 1;
ALTER TABLE `MaintenanceEvents` AUTO_INCREMENT = 1;
ALTER TABLE `Reminder` AUTO_INCREMENT = 1;

-- Verify tables are empty
SELECT 'Users' as table_name, COUNT(*) as record_count FROM Users
UNION ALL
SELECT 'Vehicles', COUNT(*) FROM Vehicles
UNION ALL
SELECT 'CarShops', COUNT(*) FROM CarShops
UNION ALL
SELECT 'Mechanics', COUNT(*) FROM Mechanics
UNION ALL
SELECT 'ServiceRecords', COUNT(*) FROM ServiceRecords
UNION ALL
SELECT 'ServiceTypes', COUNT(*) FROM ServiceTypes
UNION ALL
SELECT 'Parts', COUNT(*) FROM Parts
UNION ALL
SELECT 'Expenses', COUNT(*) FROM Expenses
UNION ALL
SELECT 'FuelLog', COUNT(*) FROM FuelLog
UNION ALL
SELECT 'MaintenanceEvents', COUNT(*) FROM MaintenanceEvents
UNION ALL
SELECT 'Reminder', COUNT(*) FROM Reminder; 