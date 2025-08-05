-- WHERE Queries
EXPLAIN SELECT * FROM Vehicles
WHERE make = 'Toyota' AND model = 'Camry';

EXPLAIN SELECT * FROM CarShops
WHERE city = 'San Francisco' AND state = 'CA';

EXPLAIN SELECT * FROM Mechanics
WHERE car_shop_id = 42;

EXPLAIN SELECT * FROM Expenses
WHERE vin = '1HGCM82633A004352' AND date >= '2024-01-01';

EXPLAIN SELECT * FROM UpcomingServices
WHERE user_id = 10 AND vin = '1HGCM82633A004352' AND status = 'Scheduled';

-- JOIN Queries
EXPLAIN
SELECT v.vin, v.make, v.model, sr.service_date, sr.description
FROM Vehicles v
JOIN ServiceRecords sr ON v.vin = sr.vin
WHERE sr.service_date >= '2024-01-01';

EXPLAIN
SELECT m.name, c.city, c.state
FROM Mechanics m
JOIN CarShops c ON m.car_shop_id = c.id
WHERE c.state = 'NY';

EXPLAIN
SELECT wo.mechanic_id, sr.service_date
FROM WorkedOn wo
JOIN ServiceRecords sr ON wo.service_id = sr.id
WHERE sr.service_date >= '2023-01-01';

EXPLAIN
SELECT srs.service_id, srs.service_type, sr.service_date
FROM ServiceRecords_ServiceTypes srs
JOIN ServiceRecords sr ON srs.service_id = sr.id
WHERE srs.service_type = 'Oil Change';

EXPLAIN
SELECT srp.service_id, p.name, p.manufacturer
FROM ServiceRecords_Parts srp
JOIN Parts p ON srp.part_id = p.id
WHERE p.name LIKE '%Brake%';

-- Sorting and Grouping
EXPLAIN
SELECT vin, date, amount
FROM Expenses
WHERE vin = '1HGCM82633A004352'
ORDER BY date DESC
LIMIT 50;

EXPLAIN
SELECT user_id, vin, status, COUNT(*) as total_events
FROM UpcomingServices
GROUP BY user_id, vin, status
HAVING total_events > 1;

EXPLAIN
SELECT service_type, COUNT(*) as service_count
FROM UpcomingServices_ServiceTypes
GROUP BY service_type
ORDER BY service_count DESC
LIMIT 10;

EXPLAIN
SELECT send_date, was_sent, COUNT(*) as reminder_count
FROM Reminder
GROUP BY send_date, was_sent
ORDER BY send_date DESC, was_sent ASC
LIMIT 100;
