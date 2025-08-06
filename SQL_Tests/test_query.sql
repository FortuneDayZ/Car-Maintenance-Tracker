-- Essential Test Queries for Vehicle Management System
-- These queries help verify if your program is working correctly

-- 1. Basic table queries - view all data in each table
SELECT * FROM Users;
SELECT * FROM Vehicles;
SELECT * FROM Owns;
SELECT * FROM CarShops;
SELECT * FROM Mechanics;
SELECT * FROM ServiceRecords;
SELECT * FROM WorkedOn;
SELECT * FROM ServiceTypes;
SELECT * FROM ServiceRecords_ServiceTypes;
SELECT * FROM Parts;
SELECT * FROM ServiceRecords_Parts;
SELECT * FROM Expenses;
SELECT * FROM FuelExpenses;
SELECT * FROM UpcomingServices;
SELECT * FROM UpcomingServices_ServiceTypes;
SELECT * FROM Reminder;

-- 2. Check if all tables exist and have data
SELECT 'Users' as table_name, COUNT(*) as record_count FROM Users
UNION ALL
SELECT 'Vehicles', COUNT(*) FROM Vehicles
UNION ALL
SELECT 'Owns', COUNT(*) FROM Owns
UNION ALL
SELECT 'CarShops', COUNT(*) FROM CarShops
UNION ALL
SELECT 'Mechanics', COUNT(*) FROM Mechanics
UNION ALL
SELECT 'ServiceRecords', COUNT(*) FROM ServiceRecords
UNION ALL
SELECT 'WorkedOn', COUNT(*) FROM WorkedOn
UNION ALL
SELECT 'ServiceTypes', COUNT(*) FROM ServiceTypes
UNION ALL
SELECT 'ServiceRecords_ServiceTypes', COUNT(*) FROM ServiceRecords_ServiceTypes
UNION ALL
SELECT 'Parts', COUNT(*) FROM Parts
UNION ALL
SELECT 'ServiceRecords_Parts', COUNT(*) FROM ServiceRecords_Parts
UNION ALL
SELECT 'Expenses', COUNT(*) FROM Expenses
UNION ALL
SELECT 'FuelExpenses', COUNT(*) FROM FuelExpenses
UNION ALL
SELECT 'UpcomingServices', COUNT(*) FROM UpcomingServices
UNION ALL
SELECT 'UpcomingServices_ServiceTypes', COUNT(*) FROM UpcomingServices_ServiceTypes
UNION ALL
SELECT 'Reminder', COUNT(*) FROM Reminder;

-- 2. Check basic data integrity - verify relationships work
SELECT 'User-Vehicle Relationships' as test_name, COUNT(*) as count 
FROM Users u JOIN Owns o ON u.user_id = o.user_id JOIN Vehicles v ON o.vin = v.vin;

-- 3. Check service records with mechanics
SELECT 'Service-Mechanic Relationships' as test_name, COUNT(*) as count 
FROM ServiceRecords sr JOIN WorkedOn wo ON sr.service_id = wo.service_id JOIN Mechanics m ON wo.mechanic_id = m.mechanic_id;

-- 4. Check expenses with fuel data
SELECT 'Fuel Expenses' as test_name, COUNT(*) as count 
FROM Expenses e JOIN FuelExpenses fe ON e.expense_id = fe.expense_id;

-- 5. Check upcoming services with reminders
SELECT 'Upcoming Services with Reminders' as test_name, COUNT(*) as count 
FROM UpcomingServices us JOIN Reminder r ON us.event_id = r.event_id;

-- 6. Quick view of recent data (last 5 records from each main table)
SELECT 'Recent Users' as table_name, username, email FROM Users ORDER BY user_id DESC LIMIT 5;

SELECT 'Recent Vehicles' as table_name, make, model, year FROM Vehicles ORDER BY vin LIMIT 5;

SELECT 'Recent Service Records' as table_name, service_date, cost FROM ServiceRecords ORDER BY service_id DESC LIMIT 5;

SELECT 'Recent Expenses' as table_name, date, category, amount FROM Expenses ORDER BY expense_id DESC LIMIT 5;

-- 7. Check for any orphaned records (data integrity test)
SELECT 'Orphaned Service Records' as issue, COUNT(*) as count 
FROM ServiceRecords sr LEFT JOIN Vehicles v ON sr.vin = v.vin WHERE v.vin IS NULL;

SELECT 'Orphaned Owns Records' as issue, COUNT(*) as count 
FROM Owns o LEFT JOIN Users u ON o.user_id = u.user_id WHERE u.user_id IS NULL;

-- 8. Basic functionality test - can we query all main features?
SELECT 'All Users with their Vehicles' as test_query, COUNT(*) as result_count
FROM Users u 
LEFT JOIN Owns o ON u.user_id = o.user_id 
LEFT JOIN Vehicles v ON o.vin = v.vin;

SELECT 'All Service Records with Details' as test_query, COUNT(*) as result_count
FROM ServiceRecords sr
LEFT JOIN Vehicles v ON sr.vin = v.vin
LEFT JOIN WorkedOn wo ON sr.service_id = wo.service_id
LEFT JOIN Mechanics m ON wo.mechanic_id = m.mechanic_id;

-- 9. System health check - verify no empty critical tables
SELECT 'System Health Check' as check_type,
       CASE WHEN (SELECT COUNT(*) FROM Users) > 0 THEN 'OK' ELSE 'WARNING' END as users_status,
       CASE WHEN (SELECT COUNT(*) FROM Vehicles) > 0 THEN 'OK' ELSE 'WARNING' END as vehicles_status,
       CASE WHEN (SELECT COUNT(*) FROM ServiceTypes) > 0 THEN 'OK' ELSE 'WARNING' END as service_types_status;