import random
import string
import mysql.connector
from faker import Faker
from datetime import timedelta

fake = Faker()
conn = mysql.connector.connect(
    host='localhost', user='root', password='tigyan2005', database='Final'
)
cursor = conn.cursor()

def random_vin():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=17))

def insert_users(n=5000):
    usernames = set()
    emails = set()

    while len(usernames) < n:
        username = fake.user_name()
        email = fake.unique.email()
        if username in usernames:
            continue
        usernames.add(username)

        password_hash = fake.sha256()[:60]
        birthday = fake.date_of_birth(minimum_age=18, maximum_age=80)
        reg_date = fake.date_between(start_date='-5y', end_date='today')
        is_admin = random.choice([0, 1])
        cursor.execute('''
            INSERT INTO Users (username, password_hash, email, birthday, registration_date, is_admin)
            VALUES (%s, %s, %s, %s, %s, %s)
        ''', (username, password_hash, email, birthday, reg_date, is_admin))
    conn.commit()

def insert_vehicles(n=5000):
    makes = ['Toyota', 'Ford', 'Chevy', 'BMW', 'Honda']
    models = ['Corolla', 'F-150', 'Civic', 'Accord', 'Mustang']
    vins = set()

    while len(vins) < n:
        vin = random_vin()
        if vin in vins:
            continue
        vins.add(vin)

        make = random.choice(makes)
        model = random.choice(models)
        year = random.randint(1995, 2023)
        cursor.execute('''
            INSERT INTO Vehicles (vin, make, model, year)
            VALUES (%s, %s, %s, %s)
        ''', (vin, make, model, year))

    conn.commit()

def insert_owns():
    cursor.execute('SELECT user_id FROM Users')
    users = [row[0] for row in cursor.fetchall()]
    cursor.execute('SELECT vin FROM Vehicles')
    vins = [row[0] for row in cursor.fetchall()]
    used = set()
    for _ in range(1000):
        user_id = random.choice(users)
        vin = random.choice(vins)
        if (user_id, vin) in used:
            continue
        start = fake.date_between(start_date='-5y', end_date='-1y')
        end = fake.date_between(start_date=start, end_date='today')
        cursor.execute('''
            INSERT INTO Owns (user_id, vin, start_date, end_date)
            VALUES (%s, %s, %s, %s)
        ''', (user_id, vin, start, end))
        used.add((user_id, vin))
    conn.commit()

def insert_car_shops(n=5000):
    cursor.execute('SELECT user_id FROM Users')
    users = [row[0] for row in cursor.fetchall()]
    for _ in range(n):
        uid = random.choice(users)
        name = fake.company()
        street = fake.street_address()
        city = fake.city()
        state = fake.state()
        zip_code = fake.zipcode()
        phone = fake.phone_number()[:20]
        cursor.execute('''
            INSERT INTO CarShops (user_id, name, street, city, state, zip_code, phone_number)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        ''', (uid, name, street, city, state, zip_code, phone))
    conn.commit()

def insert_mechanics(n=5000):
    cursor.execute('SELECT user_id FROM Users')
    users = [row[0] for row in cursor.fetchall()]
    cursor.execute('SELECT car_shop_id FROM CarShops')
    shops = [row[0] for row in cursor.fetchall()]
    for _ in range(n):
        uid = random.choice(users)
        sid = random.choice(shops)
        name = fake.name()
        phone = fake.phone_number()[:20]
        email = fake.email()
        cursor.execute('''
            INSERT INTO Mechanics (user_id, car_shop_id, name, phone_number, email)
            VALUES (%s, %s, %s, %s, %s)
        ''', (uid, sid, name, phone, email))
    conn.commit()

def insert_service_records(n=5000):
    cursor.execute('SELECT vin FROM Vehicles')
    vins = [row[0] for row in cursor.fetchall()]
    for _ in range(n):
        vin = random.choice(vins)
        date = fake.date_between(start_date='-3y', end_date='today')
        mileage = random.randint(10000, 150000)
        cost = round(random.uniform(50, 1000), 2)
        desc = fake.sentence()
        cursor.execute('''
            INSERT INTO ServiceRecords (vin, service_date, current_mileage, cost, description)
            VALUES (%s, %s, %s, %s, %s)
        ''', (vin, date, mileage, cost, desc))
    conn.commit()

def insert_worked_on():
    cursor.execute('SELECT mechanic_id FROM Mechanics')
    mids = [row[0] for row in cursor.fetchall()]
    cursor.execute('SELECT service_id FROM ServiceRecords')
    sids = [row[0] for row in cursor.fetchall()]
    used = set()
    for _ in range(1000):
        mid = random.choice(mids)
        sid = random.choice(sids)
        if (mid, sid) in used:
            continue
        cursor.execute('''
            INSERT INTO WorkedOn (mechanic_id, service_id)
            VALUES (%s, %s)
        ''', (mid, sid))
        used.add((mid, sid))
    conn.commit()

def insert_service_records_service_types():
    cursor.execute('SELECT service_id FROM ServiceRecords')
    sids = [row[0] for row in cursor.fetchall()]
    cursor.execute('SELECT service_type FROM ServiceTypes')
    types = [row[0] for row in cursor.fetchall()]
    for sid in random.sample(sids, 1000):
        st = random.choice(types)
        cursor.execute('''
            INSERT INTO ServiceRecords_ServiceTypes (service_id, service_type)
            VALUES (%s, %s)
        ''', (sid, st))
    conn.commit()

def insert_parts(n=5000):
    cursor.execute('SELECT user_id FROM Users')
    uids = [row[0] for row in cursor.fetchall()]
    for _ in range(n):
        uid = random.choice(uids)
        name = fake.word()
        mfr = fake.company()
        part_num = fake.bothify(text='??####')
        price = round(random.uniform(5.00, 500.00), 2)
        cursor.execute('''
            INSERT INTO Parts (user_id, name, manufacturer, part_number, unit_price)
            VALUES (%s, %s, %s, %s, %s)
        ''', (uid, name, mfr, part_num, price))
    conn.commit()

def insert_service_records_parts():
    cursor.execute('SELECT service_id FROM ServiceRecords')
    sids = [row[0] for row in cursor.fetchall()]
    cursor.execute('SELECT part_id FROM Parts')
    pids = [row[0] for row in cursor.fetchall()]
    for _ in range(1000):
        sid = random.choice(sids)
        pid = random.choice(pids)
        cursor.execute('''
            INSERT INTO ServiceRecords_Parts (service_id, part_id)
            VALUES (%s, %s)
        ''', (sid, pid))
    conn.commit()

def insert_expenses(n=5000):
    cursor.execute('SELECT vin FROM Vehicles')
    vins = [row[0] for row in cursor.fetchall()]
    cats = ['Maintenance', 'Fuel', 'Registration', 'Insurance', 'Misc']
    for _ in range(n):
        vin = random.choice(vins)
        date = fake.date_between(start_date='-3y', end_date='today')
        cat = random.choice(cats)
        amt = round(random.uniform(10, 1000), 2)
        desc = fake.text(max_nb_chars=50)
        cursor.execute('''
            INSERT INTO Expenses (vin, date, category, amount, description)
            VALUES (%s, %s, %s, %s, %s)
        ''', (vin, date, cat, amt, desc))
    conn.commit()

def insert_sub_expenses():
    cursor.execute('SELECT expense_id, category FROM Expenses')
    rows = cursor.fetchall()
    cursor.execute('SELECT service_id FROM ServiceRecords')
    sids = [row[0] for row in cursor.fetchall()]
    for eid, cat in rows:
        if cat == 'Maintenance':
            sid = random.choice(sids)
            cursor.execute('INSERT INTO MaintenanceExpenses (expense_id, service_id) VALUES (%s, %s)', (eid, sid))
        elif cat == 'Registration':
            cursor.execute('''
                INSERT INTO RegistrationExpenses (expense_id, renewal_date, renewal_period, state)
                VALUES (%s, %s, %s, %s)
            ''', (eid, fake.date_between('-1y', '+1y'), random.choice(['1 year', '2 years']), fake.state()))
        elif cat == 'Insurance':
            cursor.execute('''
                INSERT INTO InsuranceExpenses (expense_id, policy_number, start_date, end_date, provider_name)
                VALUES (%s, %s, %s, %s, %s)
            ''', (eid, fake.uuid4(), fake.date_between('-2y', '-1y'), fake.date_between('today', '+1y'), fake.company()))
        elif cat == 'Fuel':
            cursor.execute('''
                INSERT INTO FuelExpenses (expense_id, gallons, current_mileage, fuel_type)
                VALUES (%s, %s, %s, %s)
            ''', (eid, round(random.uniform(5.0, 15.0), 2), random.randint(10000, 150000), random.choice(['Regular', 'Premium', 'Diesel'])))
    conn.commit()

def insert_upcoming_services(n=5000):
    cursor.execute('SELECT user_id FROM Users')
    uids = [row[0] for row in cursor.fetchall()]
    cursor.execute('SELECT vin FROM Vehicles')
    vins = [row[0] for row in cursor.fetchall()]
    for _ in range(n):
        uid = random.choice(uids)
        vin = random.choice(vins)
        rec_date = fake.date_between('today', '+1y')
        mileage = random.randint(20000, 200000)
        status = random.choice(['Pending', 'Completed', 'Cancelled'])
        cursor.execute('''
            INSERT INTO UpcomingServices (user_id, vin, rec_date, rec_mileage, status)
            VALUES (%s, %s, %s, %s, %s)
        ''', (uid, vin, rec_date, mileage, status))
    conn.commit()

def insert_upcoming_services_service_types():
    cursor.execute('SELECT event_id FROM UpcomingServices')
    eids = [row[0] for row in cursor.fetchall()]
    cursor.execute('SELECT service_type FROM ServiceTypes')
    types = [row[0] for row in cursor.fetchall()]
    for eid in random.sample(eids, 1000):
        st = random.choice(types)
        cursor.execute('''
            INSERT INTO UpcomingServices_ServiceTypes (event_id, service_type)
            VALUES (%s, %s)
        ''', (eid, st))
    conn.commit()

def insert_reminders(n=5000):
    cursor.execute('SELECT event_id FROM UpcomingServices')
    eids = random.sample([row[0] for row in cursor.fetchall()], n)
    for eid in eids:
        msg = fake.sentence()
        send = fake.date_between('-1y', 'today')
        was_sent = random.choice([0, 1])
        was_read = random.choice([0, 1])
        cursor.execute('''
            INSERT INTO Reminder (event_id, message, send_date, was_sent, was_read)
            VALUES (%s, %s, %s, %s, %s)
        ''', (eid, msg, send, was_sent, was_read))
    conn.commit()

# Execute population
insert_users()
insert_vehicles()
insert_owns()
insert_car_shops()
insert_mechanics()
insert_service_records()
insert_worked_on()
insert_service_records_service_types()
insert_parts()
insert_service_records_parts()
insert_expenses()
insert_sub_expenses()
insert_upcoming_services()
insert_upcoming_services_service_types()
insert_reminders()

print("Database successfully populated!")
