import mysql.connector
import time

# Connect to DB
conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='tigyan2005',
    database='Final'
)
cursor = conn.cursor(dictionary=True)

# Updated queries
queries = {
    "expenses_complex_join": """
        SELECT 
            e.*, 
            v.make, v.model, v.year,
            me.service_id,
            re.renewal_date, re.renewal_period, re.state,
            ie.policy_number, ie.start_date, ie.end_date, ie.provider_name,
            fe.gallons, fe.current_mileage, fe.fuel_type
        FROM Expenses e
        LEFT JOIN Vehicles v ON e.vin = v.vin
        LEFT JOIN MaintenanceExpenses me ON e.expense_id = me.expense_id
        LEFT JOIN RegistrationExpenses re ON e.expense_id = re.expense_id
        LEFT JOIN InsuranceExpenses ie ON e.expense_id = ie.expense_id
        LEFT JOIN FuelExpenses fe ON e.expense_id = fe.expense_id
        JOIN Owns o ON e.vin = o.vin
        ORDER BY e.date DESC
        LIMIT 100
    """,

    "fuel_analytics_groupby": """
        SELECT fe.fuel_type,
               SUM(fe.gallons) as total_gallons,
               SUM(e.amount) as total_amount,
               AVG(e.amount / fe.gallons) as avg_price_per_gallon,
               COUNT(*) as fill_ups
        FROM Expenses e
        JOIN FuelExpenses fe ON e.expense_id = fe.expense_id
        JOIN Owns o ON e.vin = o.vin
        WHERE e.category = 'Fuel'
        GROUP BY fe.fuel_type
        ORDER BY total_amount DESC
    """,

    "service_cost_by_vehicle": """
        SELECT CONCAT(v.year, ' ', v.make, ' ', v.model) as vehicle_info,
               AVG(sr.cost) as avg_cost, COUNT(*) as service_count
        FROM ServiceRecords sr
        LEFT JOIN Vehicles v ON sr.vin = v.vin
        JOIN Owns o ON sr.vin = o.vin
        GROUP BY sr.vin, v.make, v.model, v.year
        ORDER BY avg_cost DESC
        LIMIT 100
    """,

    "service_count_by_month": """
        SELECT DATE_FORMAT(service_date, '%Y-%m') as month,
               COUNT(*) as service_count,
               SUM(cost) as total_amount
        FROM ServiceRecords sr
        JOIN Owns o ON sr.vin = o.vin
        GROUP BY DATE_FORMAT(service_date, '%Y-%m')
        ORDER BY month DESC
        LIMIT 12
    """,

    "ownership_user_vehicle": """
        SELECT o.*, u.username, u.email, v.make, v.model, v.year 
        FROM Owns o
        LEFT JOIN Users u ON o.user_id = u.user_id
        LEFT JOIN Vehicles v ON o.vin = v.vin
        ORDER BY o.start_date DESC
        LIMIT 100
    """,

    "expenses_by_category": """
        SELECT category, SUM(amount) as total_amount, COUNT(*) as count
        FROM Expenses e
        JOIN Owns o ON e.vin = o.vin
        GROUP BY category
        ORDER BY total_amount DESC
    """,

    "service_records_user": """
        SELECT sr.*, v.make, v.model, v.year 
        FROM ServiceRecords sr
        LEFT JOIN Vehicles v ON sr.vin = v.vin
        JOIN Owns o ON sr.vin = o.vin
        ORDER BY sr.service_date DESC
        LIMIT 100
    """,

    "upcoming_services_status": """
        SELECT status,
               COUNT(*) as count
        FROM UpcomingServices me
        JOIN Owns o ON me.vin = o.vin
        GROUP BY status
        ORDER BY count DESC
    """,

    "user_vehicles": """
        SELECT DISTINCT v.* 
        FROM Vehicles v
        JOIN Owns o ON v.vin = o.vin
        WHERE o.end_date IS NULL OR o.end_date > CURDATE()
    """,

    "fuel_expenses_detailed": """
        SELECT e.*, fe.gallons, fe.current_mileage, fe.fuel_type, v.make, v.model, v.year 
        FROM Expenses e
        JOIN FuelExpenses fe ON e.expense_id = fe.expense_id
        LEFT JOIN Vehicles v ON e.vin = v.vin
        JOIN Owns o ON e.vin = o.vin
        WHERE e.category = 'Fuel'
        ORDER BY e.date DESC
        LIMIT 100
    """
}

# Index list
indexes = [
    "CREATE INDEX idx_owns_user_vin ON Owns(user_id, vin);",
    "CREATE INDEX idx_expense_category ON Expenses(category);",
    "CREATE INDEX idx_expense_vin_date ON Expenses(vin, date);",
    "CREATE INDEX idx_service_vin_date ON ServiceRecords(vin, service_date);",
    "CREATE INDEX idx_vehicle_make_model ON Vehicles(make, model);",
    "CREATE INDEX idx_upcoming_user_status ON UpcomingServices(user_id, status);",
    "CREATE INDEX idx_reminder_send_sent ON Reminder(send_date, was_sent);",
    "CREATE INDEX idx_service_types_type ON ServiceRecords_ServiceTypes(service_type);",
    "CREATE INDEX idx_parts_name ON Parts(name);",
    "CREATE INDEX idx_carshop_location ON CarShops(city, state);",
    "CREATE INDEX idx_mechanic_shop ON Mechanics(car_shop_id);",
    "CREATE INDEX idx_workedon_service ON WorkedOn(service_id);",
    "CREATE INDEX idx_service_parts_part ON ServiceRecords_Parts(part_id);",
    "CREATE INDEX idx_upcoming_service_types ON UpcomingServices_ServiceTypes(service_type);"
]

# Helper functions
def benchmark_query(query, runs=5):
    total = 0.0
    for _ in range(runs):
        start = time.perf_counter()
        cursor.execute(query)
        cursor.fetchall()
        total += (time.perf_counter() - start)
    return total / runs

def get_explain_keys(query):
    try:
        cursor.execute("EXPLAIN " + query)
        return ", ".join(sorted(set(row.get("key") or "None" for row in cursor.fetchall())))
    except:
        return "ERROR"

def create_indexes():
    print("Creating indexes...")
    for stmt in indexes:
        cursor.execute(stmt)
    conn.commit()

# Run benchmarks
print("\nBenchmarking BEFORE indexes...")
before_times = {}
before_explains = {}
for name, query in queries.items():
    print(f"Running {name}...")
    before_times[name] = benchmark_query(query)
    before_explains[name] = get_explain_keys(query)

create_indexes()
print("\nBenchmarking AFTER indexes...")
after_times = {}
after_explains = {}
for name, query in queries.items():
    print(f"Running {name}...")
    after_times[name] = benchmark_query(query)
    after_explains[name] = get_explain_keys(query)

# Output table
print("\nResults:\n")
print("{:<30} {:>12} {:>12} {:>20}".format("Query", "Before (s)", "After (s)", "Key(s) Used (after)"))
print("-" * 80)
for name in queries:
    print("{:<30} {:>12.6f} {:>12.6f} {:>20}".format(
        name,
        before_times[name],
        after_times[name],
        after_explains[name]
    ))

cursor.close()
conn.close()