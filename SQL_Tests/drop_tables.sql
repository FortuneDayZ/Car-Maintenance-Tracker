-- Drop all tables in the Final database
-- Order matters due to foreign key constraints

USE `Final`;

-- Drop junction tables first (they reference other tables)
DROP TABLE IF EXISTS `Reminder`;
DROP TABLE IF EXISTS `MaintenanceEvents_ServiceTypes`;
DROP TABLE IF EXISTS `ServiceRecords_Parts`;
DROP TABLE IF EXISTS `ServiceRecords_ServiceTypes`;
DROP TABLE IF EXISTS `WorkedOn`;

-- Drop dependent tables (tables that reference other tables)
DROP TABLE IF EXISTS `MaintenanceEvents`;
DROP TABLE IF EXISTS `FuelLog`;
DROP TABLE IF EXISTS `Expenses`;
DROP TABLE IF EXISTS `Parts`;
DROP TABLE IF EXISTS `ServiceRecords`;
DROP TABLE IF EXISTS `Mechanics`;
DROP TABLE IF EXISTS `Owns`;

-- Drop independent tables (tables that don't reference other tables)
DROP TABLE IF EXISTS `ServiceTypes`;
DROP TABLE IF EXISTS `CarShops`;
DROP TABLE IF EXISTS `Vehicles`;
DROP TABLE IF EXISTS `Users`;

-- Drop the database itself (optional - uncomment if you want to completely remove the database)
-- DROP DATABASE IF EXISTS `Final`; 