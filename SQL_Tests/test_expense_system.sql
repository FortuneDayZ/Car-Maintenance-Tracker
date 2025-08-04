-- Test Expense System with Different Categories
-- This file tests the enhanced expense system with category-specific attributes

USE Final;

-- Clear existing test data
DELETE FROM FuelExpenses;
DELETE FROM InsuranceExpenses;
DELETE FROM RegistrationExpenses;
DELETE FROM MaintenanceExpenses;
DELETE FROM Expenses;
DELETE FROM ServiceRecords;

-- Test 1: Create a service record and verify maintenance expense is created
INSERT INTO ServiceRecords (vin, service_date, current_mileage, cost, description) 
VALUES ('1HGBH41JXMN109186', '2024-01-15', 50000, 150.00, 'Oil change and filter replacement');

-- Verify the service record was created
SELECT 'Service Record Created' as test, service_id, vin, cost, description FROM ServiceRecords WHERE vin = '1HGBH41JXMN109186';

-- Verify maintenance expense was automatically created
SELECT 'Maintenance Expense Created' as test, e.expense_id, e.category, e.amount, me.service_id 
FROM Expenses e 
JOIN MaintenanceExpenses me ON e.expense_id = me.expense_id 
WHERE e.vin = '1HGBH41JXMN109186';

-- Test 2: Create a fuel expense
INSERT INTO Expenses (vin, date, category, amount, description) 
VALUES ('1HGBH41JXMN109186', '2024-01-20', 'Fuel', 45.50, 'Gas station fill up');

INSERT INTO FuelExpenses (expense_id, gallons, current_mileage, fuel_type) 
VALUES (LAST_INSERT_ID(), 12.5, 50200, 'Regular Unleaded');

-- Verify fuel expense
SELECT 'Fuel Expense Created' as test, e.expense_id, e.category, e.amount, fe.gallons, fe.fuel_type 
FROM Expenses e 
JOIN FuelExpenses fe ON e.expense_id = fe.expense_id 
WHERE e.category = 'Fuel';

-- Test 3: Create an insurance expense
INSERT INTO Expenses (vin, date, category, amount, description) 
VALUES ('1HGBH41JXMN109186', '2024-01-25', 'Insurance', 1200.00, 'Annual car insurance premium');

INSERT INTO InsuranceExpenses (expense_id, policy_number, start_date, end_date, provider_name) 
VALUES (LAST_INSERT_ID(), 'POL-2024-001', '2024-01-01', '2024-12-31', 'State Farm Insurance');

-- Verify insurance expense
SELECT 'Insurance Expense Created' as test, e.expense_id, e.category, e.amount, ie.policy_number, ie.provider_name 
FROM Expenses e 
JOIN InsuranceExpenses ie ON e.expense_id = ie.expense_id 
WHERE e.category = 'Insurance';

-- Test 4: Create a registration expense
INSERT INTO Expenses (vin, date, category, amount, description) 
VALUES ('1HGBH41JXMN109186', '2024-02-01', 'Registration', 85.00, 'Annual vehicle registration renewal');

INSERT INTO RegistrationExpenses (expense_id, renewal_date, renewal_period, state) 
VALUES (LAST_INSERT_ID(), '2024-02-01', '1 year', 'CA');

-- Verify registration expense
SELECT 'Registration Expense Created' as test, e.expense_id, e.category, e.amount, re.renewal_date, re.state 
FROM Expenses e 
JOIN RegistrationExpenses re ON e.expense_id = re.expense_id 
WHERE e.category = 'Registration';

-- Test 5: Create a miscellaneous expense
INSERT INTO Expenses (vin, date, category, amount, description) 
VALUES ('1HGBH41JXMN109186', '2024-02-05', 'Misc', 25.00, 'Car wash and detailing');

-- Verify miscellaneous expense (should not have any category-specific table entries)
SELECT 'Miscellaneous Expense Created' as test, e.expense_id, e.category, e.amount, e.description 
FROM Expenses e 
WHERE e.category = 'Misc';

-- Test 6: Verify all expenses are properly categorized
SELECT 'All Expenses Summary' as test, 
       category, 
       COUNT(*) as count, 
       SUM(amount) as total_amount,
       AVG(amount) as avg_amount
FROM Expenses 
GROUP BY category 
ORDER BY category;

-- Test 7: Verify no orphaned category-specific records
SELECT 'Orphaned Records Check' as test,
       'MaintenanceExpenses without Expenses' as check_type,
       COUNT(*) as count
FROM MaintenanceExpenses me
LEFT JOIN Expenses e ON me.expense_id = e.expense_id
WHERE e.expense_id IS NULL

UNION ALL

SELECT 'Orphaned Records Check' as test,
       'FuelExpenses without Expenses' as check_type,
       COUNT(*) as count
FROM FuelExpenses fe
LEFT JOIN Expenses e ON fe.expense_id = e.expense_id
WHERE e.expense_id IS NULL

UNION ALL

SELECT 'Orphaned Records Check' as test,
       'InsuranceExpenses without Expenses' as check_type,
       COUNT(*) as count
FROM InsuranceExpenses ie
LEFT JOIN Expenses e ON ie.expense_id = e.expense_id
WHERE e.expense_id IS NULL

UNION ALL

SELECT 'Orphaned Records Check' as test,
       'RegistrationExpenses without Expenses' as check_type,
       COUNT(*) as count
FROM RegistrationExpenses re
LEFT JOIN Expenses e ON re.expense_id = e.expense_id
WHERE e.expense_id IS NULL;

-- Test 8: Verify expense details view (similar to what the application shows)
SELECT 'Complete Expense Details' as test,
       e.expense_id,
       e.category,
       e.amount,
       e.description,
       CASE 
           WHEN e.category = 'Maintenance' THEN CONCAT('Service ID: ', me.service_id)
           WHEN e.category = 'Fuel' THEN CONCAT(fe.gallons, ' gal')
           WHEN e.category = 'Insurance' THEN CONCAT('Policy: ', ie.policy_number)
           WHEN e.category = 'Registration' THEN CONCAT('Renewal: ', re.renewal_date)
           ELSE 'Miscellaneous'
       END as details
FROM Expenses e
LEFT JOIN MaintenanceExpenses me ON e.expense_id = me.expense_id
LEFT JOIN FuelExpenses fe ON e.expense_id = fe.expense_id
LEFT JOIN InsuranceExpenses ie ON e.expense_id = ie.expense_id
LEFT JOIN RegistrationExpenses re ON e.expense_id = re.expense_id
ORDER BY e.date DESC; 