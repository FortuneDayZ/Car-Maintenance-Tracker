from flask import Flask, request, jsonify
import mysql.connector
from datetime import datetime
import bcrypt
import re

app = Flask(__name__)

# MySQL connection
db = mysql.connector.connect(
    host="localhost",
    user="",
    password="",
    database="Final"
)

# Password hasher
def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

# checks that date is in YYYY-MM-DD format
def date_format(date):
    return bool(re.fullmatch(r'^\d{4}-\d{2}-\d{2}$', date_str))

# checks if a value already exists
def value_exists(table, column, value):
    query = f"SELECT 1 FROM {table} WHERE {column} = %s LIMIT 1"
    cursor = db.cursor()
    cursor.execute(query, [value])
    exists = cursor.fetchone()
    cursor.close()
    return bool(exists)

# Add user endpoint
@app.route('/add_user', methods=['POST'])
def add_user():
    data = request.json
    username = data.get('username').strip()
    password = data.get('password').strip()
    email = data.get('email').strip()
    birthday = data.get('birthday').strip()  # format: YYYY-MM-DD

    # no values are empty
    if not all([username, password, email, birthday]):
        return jsonify({"error": "Missing fields"}), 400

    # check username length
    if len(username) > 50:
        return jsonify({"error": "Username must be 50 characters or fewer"}), 400

    # check username only has letters, numbers, and ._-
    if not re.fullmatch(r'^[a-zA-Z0-9._-]{3,50}$', username):
        return jsonify({"error": "Username must contain only letters, numbers, periods, underscores, and dashes"}), 400

    # check username isn't already taken
    if value_exists("Users", "username", username):
        return jsonify({"error": "Username already taken"}), 400

    # check email is correct format
    if not re.fullmatch(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b', email):
        return jsonify({"error": "Invalid email"}), 400

    # check email length
    if len(email) > 100:
        return jsonify({"error": "Email must be 100 characters or fewer"}), 400

    # check email isn't taken
    if value_exists("Users", "email", email):
        return jsonify({"error": "Email already taken"}), 400

    # check birthday format is correct
    if not date_format(birthday):
        return jsonify({"error": "Invalid date format, must be YYYY-MM-DD"}), 400
    birthday = datetime.strptime(birthday, "%Y-%m-%d").date()

    password_hash = hash_password(password)

    try:
        cursor = db.cursor()
        cursor.execute("""
            INSERT INTO Users (username, password_hash, email, birthday, registration_date)
            VALUES (%s, %s, %s, %s, %s)
            """, (username, password_hash, email, birthday, datetime.now().date()))
        db.commit()
        cursor.close()
        return jsonify({"message": "User added successfully!"})
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

# Add vehicle endpoint
@app.route('/add_vehicle', methods=['POST'])
def add_vehicle():
    data = request.json
    vin = data.get('vin').strip().upper()
    make = data.get('make').strip()
    model = data.get('model').strip()
    year = data.get('year').strip()

    if not all([vin, make, model, year]):
        return jsonify({"error": "Missing fields"}), 400

    if len(vin) > 17:
        return jsonify({"error": "VIN must be 17 characters or fewer"}), 400

    if not vin.isalnum():
        return jsonify({"error": "VIN must be alphanumeric"}), 400

    if len(make) > 50:
        return jsonify({"error": "Make must be 50 characters or fewer"}), 400

    if value_exists("Vehicles", "vin", vin):
        return jsonify({"error": "VIN already exists"}), 400

    if len(model) > 50:
        return jsonify({"error": "Model must be 50 characters or fewer"}), 400

    try:
        year = int(year)
    except ValueError:
        return jsonify({"error": "Year must be an integer"}), 400

    try:
        cursor = db.cursor()
        cursor.execute("""
            INSERT INTO Vehicles (vin, make, model, year)
            VALUES (%s, %s, %s, %s)
            """, (vin, make, model, year))
        db.commit()
        cursor.close()
        return jsonify({"message": "Vehicle added successfully!"})
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

@app.route('/add_ownership', methods=['POST'])
def add_ownership():
    data = request.json
    owner = data.get('owner').strip()
    vin = data.get('vin').strip()
    start_date = data.get('start_date').strip()
    end_date = data.get('end_date').strip()

    if not all([owner, vin, start_date]):
        return jsonify({"error": "Missing fields"}), 400

    try:
        owner = int(owner)
    except ValueError:
        return jsonify({"error": "Owner must be an integer"}), 400

    if not value_exists("Users", "user", owner):
        return jsonify({"error": "User does not exist in database"}), 400

    if not value_exists("Vehicles", "vin", vin):
        return jsonify({"error": "Vehicle does not exist in database"}), 400

    if not date_format(start_date):
        return jsonify({"error": "Invalid date format, must be YYYY-MM-DD"}), 400
    start_date = datetime.strptime(start_date, "%Y-%m-%d").date()

    if end_date != '' and not date_format(end_date):
        return jsonify({"error": "Invalid date format, must be YYYY-MM-DD"}), 400
    else:
        end_date = datetime.strptime(end_date, "%Y-%m-%d").date()

    try:
        cursor = db.cursor()
        cursor.execute("""
            INSERT INTO Owns (owner, vin, start_date, end_date)
            VALUES (%s, %s, %s, %s)
            """, (owner, vin, start_date, end_date))
        db.commit()
        cursor.close()
        return jsonify({"message": "Owner added successfully!"})
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500


@app.route('/add_carshop', methods=['POST'])
def add_carshop():
    data = request.json
    name = data.get('name').strip()
    street = data.get('street').strip()
    city = data.get('city').strip()
    state = data.get('state').strip()
    zipcode = data.get('zipcode').strip()
    phone_number = data.get('phone_number').strip()
    phone_number = re.sub(r'\D', '', phone_number)

    if not name:
        return jsonify({"error": "Missing name"}), 400

    if len(name) > 100:
        return jsonify({"error": "Name must be 100 characters or fewer"}), 400

    if len(street) > 100:
        return jsonify({"error": "Street must be 100 characters or fewer"}), 400

    if len(city) > 50:
        return jsonify({"error": "City must be 50 characters or fewer"}), 400

    if len(state) > 50:
        return jsonify({"error": "State must be 50 characters or fewer"}), 400

    if not re.match(r'^[0-9]$', zipcode):
        return jsonify({"error": "Zipcode must only contain numeric digits"}), 400

    if len(zipcode) > 15:
        return jsonify({"error": "Zipcode must be 15 characters or fewer"}), 400

    if len(phone_number) > 20:
        return jsonify({"error": "Phone number must be 20 characters or fewer"}), 400

    try:
        cursor = db.cursor()
        cursor.execute("""
            INSERT INTO CarShops (name, street, city, state, zipcode, phone_number)
            VALUES (%s, %s, %s, %s, %s, %s)
            """, (name, street, city, state, zipcode, phone_number))
        db.commit()
        cursor.close()
        return jsonify({"message": "CarShop added successfully!"})
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500


@app.route('/add_mechanic', methods=['POST'])
def add_mechanic():
    data = request.json
    car_shop_id = data.get('car_shop_id').strip()
    name = data.get('name').strip()
    phone_number = data.get('phone_number').strip()
    phone_number = re.sub(r'\D', '', phone_number)
    email = data.get('email').strip()

    if not all([car_shop_id, name]):
        return jsonify({"error": "Missing Car shop ID and/or name"}), 400

    try:
        car_shop_id = int(car_shop_id)
    except ValueError:
        return jsonify({"error": "CarShop ID must be an integer"}), 400

    if not value_exists("CarShops", "car_shop_id", car_shop_id):
        return jsonify({"error": "CarShop ID does not exist"}), 400

    if len(name) > 100:
        return jsonify({"error": "Name must be 100 characters or fewer"}), 400

    if len(phone_number) > 20:
        return jsonify({"error": "Phone number must be 20 characters or fewer"}), 400

    if not re.fullmatch(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b', email):
        return jsonify({"error": "Invalid email"}), 400

    if len(email) > 100:
        return jsonify({"error": "Email must be 100 characters or fewer"}), 400

    try:
        cursor = db.cursor()
        cursor.execute("""
            INSERT INTO Mechanics (car_shop_id, name, phone_number, email)
            VALUES (%s, %s, %s, %s)
            """, (car_shop_id, name, phone_number, email))
        db.commit()
        cursor.close()
        return jsonify({"message": "Mechanic added successfully!"})
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500


@app.route('/add_servicerecords', methods=['POST'])
def add_servicerecords():
    data = request.json
    vin = data.get('vin').strip()
    service_date = data.get('service_date').strip()
    current_mileage = data.get('current_mileage').strip()
    cost = data.get('cost').strip()
    description = data.get('description').strip()

    if not all([vin, service_date, current_mileage, cost]):
        return jsonify({"error": "Missing fields"}), 400

    if not value_exists("Vehicles", "vin", vin):
        return jsonify({"error": "Vehicle does not exist in database"}), 400

    if not date_format(service_date):
        return jsonify({"error": "Invalid date format, must be YYYY-MM-DD"}), 400

    try:
        current_mileage = int(current_mileage)
    except ValueError:
        return jsonify({"error": "Current mileage must be an integer"}), 400

    try:
        cost = float(cost)
        if cost < 0:
            return jsonify({"error": "Cost cannot be negative"}), 400
    except ValueError:
        return jsonify({"error": "Cost must be a number"}), 400

    try:
        cursor = db.cursor()
        cursor.execute("""
            INSERT INTO ServiceRecords (vin, service_date, current_mileage, cost, description)
            VALUES (%s, %s, %s, %s, %s
            """, (vin, service_date, current_mileage, cost, description))
        db.commit()
        cursor.close()
        return jsonify({"message": "Service record added successfully!"})
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500


@app.route('/add_workedon', methods=['POST'])
def add_workedon():
    data = request.json
    mechanic_id = data.get('mechanic_id').strip()
    service_id = data.get('service_id').strip()

    if not all([mechanic_id, service_id]):
        return jsonify({"error": "Missing fields"}), 400

    if not value_exists("Mechanics", "mechanic_id", mechanic_id):
        return jsonify({"error": "Mechanic does not exist"}), 400

    if not value_exists("ServiceRecords", "service_id", service_id):
        return jsonify({"error": "Service record does not exist"}), 400

    try:
        cursor = db.cursor()
        cursor.execute("""
            INSERT INTO WorkedOn (mechanic_id, service_id)
            VALUES (%s, %s)
            """, (mechanic_id, service_id))
        db.commit()
        cursor.close()
        return jsonify({"message": "Workedon added successfully!"})
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500


@app.route('/add_servicetypes', methods=['POST'])
def add_servicetypes():
    data = request.json
    service_type = data.get('service_type').strip()
    if not all([service_type]):
        return jsonify({"error": "Missing fields"}), 400

    if len(service_type) > 50:
        return jsonify({"error": "Service type must be 50 characters or fewer"}), 400

    try:
        cursor = db.cursor()
        cursor.execute("""
            INSERT INTO ServiceTypes (service_type)
            VALUES (%s)
            """, (service_type))
        db.commit()
        cursor.close()
        return jsonify({"message": "ServiceType added successfully!"})
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

@app.route('/add_servicerecords_servicetypes', methods=['POST'])
def add_servicerecords_servicetypes():
    data = request.json
    service_id = data.get('service_id').strip()
    service_type = data.get('service_type').strip()

    try:
        service_id = int(service_id)
    except ValueError:
        return jsonify({"error": "Service ID must be an integer"}), 400

    if not value_exists("ServiceRecords", "service_id", service_id):
        return jsonify({"error": "Service record does not exist"}), 400

    if not value_exists("ServiceTypes", "service_type", service_type):
        return jsonify({"error": "ServiceType does not exist"}), 400

    try:
        cursor = db.cursor()
        cursor.execute("""
            INSERT INTO ServiceRecords_ServiceTypes (service_id, service_type)
            VALUES (%s, %s)
            """, (service_id, service_type))
        db.commit()
        cursor.close()
        return jsonify({"message": "ServiceRecords_ServiceTypes added successfully!"})
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500


@app.route('/add_parts', methods=['POST'])
def add_parts():
    data = request.json
    name = data.get('name').strip()
    manufacturer = data.get('manufacturer').strip()
    part_number = data.get('part_number').strip()
    unit_price = data.get('unit_price').strip()

    if not all([name, unit_price]):
        return jsonify({"error": "Missing fields"}), 400

    if len(name) > 255:
        return jsonify({"error": "Name must be 255 characters or fewer"}), 400

    if len(manufacturer) > 255:
        return jsonify({"error": "Manufacturer must be 255 characters or fewer"}), 400

    if len(part_number) > 100:
        return jsonify({"error": "Part number must be 100 characters or fewer"}), 400

    try:
        unit_price = float(unit_price)
        if unit_price <= 0:
            return jsonify({"error": "Unit price must be greater than 0"}), 400
    except ValueError:
        return jsonify({"error": "Unit price must be a number"}), 400

    try:
        cursor = db.cursor()
        cursor.execute("""
            INSERT INTO Parts (name, manufacturer, part_number, unit_price)
            VALUES (%s, %s, %s, %s)
            """, (name, manufacturer, part_number, unit_price))
        db.commit()
        cursor.close()
        return jsonify({"message": "Parts added successfully!"})
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500


@app.route('add_servicerecords_parts', methods=['POST'])
def add_servicerecords_parts():
    data = request.json
    service_id = data.get('service_id').strip()
    part_id = data.get('part_id').strip()

    if not all([service_id, part_id]):
        return jsonify({"error": "Missing fields"}), 400

    try:
        service_id = int(service_id)
    except ValueError:
        return jsonify({"error": "Service ID must be an integer"}), 400

    try:
        part_id = int(part_id)
    except ValueError:
        return jsonify({"error": "Part ID must be an integer"}), 400

    if not value_exists("ServiceRecords", "service_id", service_id):
        return jsonify({"error": "Service record not found"}), 400

    if not value_exists("Parts", "part_id", part_id):
        return jsonify({"error": "Part ID not found"}), 400

    try:
        cursor = db.cursor()
        cursor.execute("""
            INSERT INTO ServiceRecords_Parts (service_id, part_id)
            VALUES (%s, %s)
            """, (service_id, part_id))
        db.commit()
        cursor.close()
        return jsonify({"message": "Parts added successfully!"})
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500


@app.route('/add_expenses', methods=['POST'])
def add_expenses():
    data = request.json
    vin = data.get('vin').strip()
    date = data.get('date').strip()
    category = data.get('category').strip()
    amount = data.get('amount').strip()
    description = data.get('description').strip()
    if not all([vin, date, category, amount]):
        return jsonify({"error": "Missing fields"}), 400

    if not value_exists("Vehicles", "vin", vin):
        return jsonify({"error": "Vin not found"}), 400

    if not date_format(date):
        return jsonify({"error": "Date must be in the format YYYY-MM-DD"}), 400

    if len(category) > 100:
        return jsonify({"error": "Category must be 100 characters or fewer"}), 400

    try:
        amount = float(amount)
    except ValueError:
        return jsonify({"error": "Amount must be a number"}), 400

    try:
        cursor = db.cursor()
        cursor.execute("""
            INSERT INTO Expenses (vin, date, category, amount, description)
            VALUES (%s, %s, %s, %s, %s)
            """, (vin, date, category, amount, description))
        db.commit()
        cursor.close()
        return jsonify({"message": "Expenses added successfully!"})
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500


@app.route('/add_fuellog', methods=['POST'])
def add_fuellog():
    data = request.json
    vin = data.get('vin').strip()
    date_filled = data.get('date_filled').strip()
    current_mileage = data.get('current_mileage').strip()
    gallons = data.get('gallons').strip()
    total_cost = data.get('total_cost').strip()
    fuel_type = data.get('fuel_type').strip()

    if not all([vin, date_filled, current_mileage, gallons, total_cost]):
        return jsonify({"error": "Missing fields"}), 400

    if not value_exists("Vehicles", "vin", vin):
        return jsonify({"error": "Vin not found"}), 400

    if not date_format(date_filled):
        return jsonify({"error": "Date must be in the format YYYY-MM-DD"}), 400

    try:
        current_mileage = int(current_mileage)
    except ValueError:
        return jsonify({"error": "Current mileage must be a number"}), 400

    try:
        gallons = float(gallons)
    except ValueError:
        return jsonify({"error": "Gallons must be a number"}), 400

    try:
        total_cost = float(total_cost)
    except ValueError:
        return jsonify({"error": "Total cost must be a number"}), 400

    if len(fuel_type) > 50:
        return jsonify({"error": "Fuel type must be 50 characters or fewer"}), 400

    try:
        cursor = db.cursor()
        cursor.execute("""
            INSERT INTO FuelLog (vin, date_filled, current_mileage, gallons, total_cost, fuel_type)
            VALUES (%s, %s, %s, %s, %s, %s)
            """, (vin, date_filled, current_mileage, gallons, total_cost, fuel_type))
        db.commit()
        cursor.close()
        return jsonify({"message": "Fuel log added successfully!"})
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500


@app.route('/add_maintenanceevent', methods=['POST'])
def add_maintenanceevent():
    data = request.json
    user_id = data.get('user_id').strip()
    vin = data.get('vin').strip()
    rec_date = data.get('rec_date').strip()
    rec_mileage = data.get('rec_mileage').strip()
    status = data.get('status').strip()

    if not all([user_id, vin, rec_date, rec_mileage, status]):
        return jsonify({"error": "Missing fields"}), 400

    try:
        user_id = int(user_id)
    except ValueError:
        return jsonify({"error": "User ID must be an integer"}), 400

    if not value_exists("Users", "user_id", user_id):
        return jsonify({"error": "User ID not found"}), 400

    if not value_exists("Vehicles", "vin", vin):
        return jsonify({"error": "Vin not found"}), 400

    if not date_format(rec_date):
        return jsonify({"error": "Date must be in the format YYYY-MM-DD"}), 400

    try:
        rec_mileage = int(rec_mileage)
    except ValueError:
        return jsonify({"error": "Mileage must be a number"}), 400

    if len(status) > 20:
        return jsonify({"error": "Status must be 20 characters or fewer"}), 400

    try:
        cursor = db.cursor()
        cursor.execute("""
            INSERT INTO MaintenanceEvents (user_id, vin, rec_date, rec_mileage, status)
            VALUES (%s, %s, %s, %s, %s)
            """, (user_id, vin, rec_date, rec_mileage, status))
        db.commit()
        cursor.close()
        return jsonify({"message": "Maintenance event added successfully!"})
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

@app.route('/add_maintenanceevents_servicetypes', methods=['POST'])
def add_maintenanceevents_servicetypes():
    data = request.json
    event_id = data.get('event_id').strip()
    service_type = data.get('service_type').strip()

    if not all([event_id, service_type]):
        return jsonify({"error": "Missing fields"}), 400

    try:
        event_id = int(event_id)
    except ValueError:
        return jsonify({"error": "Event ID must be an integer"}), 400

    if not value_exists("MaintenanceEvents", "event_id", event_id):
        return jsonify({"error": "Event ID not found"}), 400

    if not value_exists("ServiceTypes", "service_type", service_type):
        return jsonify({"error": "Service type must be an integer"}), 400

    try:
        cursor = db.cursor()
        cursor.execute("""
            INSERT INTO MaintenanceEvents_ServiceTypes (event_id, service_type)
            VALUES (%s, %s)
            """, (event_id, service_type))
        db.commit()
        cursor.close()
        return jsonify({"message": "Maintenance event added successfully!"})
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500


@app.route('add_reminder', methods=['POST'])
def add_reminder():
    data = request.json
    event_id = data.get('event_id').strip()
    message = data.get('message').strip()
    send_date = data.get('send_date').strip()
    is_sent = data.get('is_sent').strip()

    if not all([event_id, send_date, is_sent]):
        return jsonify({"error": "Missing fields"}), 400

    try:
        event_id = int(event_id)
    except ValueError:
        return jsonify({"error": "Event ID must be an integer"}), 400

    if not value_exists("MaintenanceEvents", "event_id", event_id):
        return jsonify({"error": "Event ID not found"}), 400

    if not date_format(send_date):
        return jsonify({"error": "Date must be in the format YYYY-MM-DD"}), 400

    try:
        is_sent = bool(is_sent)
    except ValueError:
        return jsonify({"error": "is_sent must be boolean value"}), 400

    try:
        cursor = db.cursor()
        cursor.execute("""
            INSERT INTO MaintenanceEvents_Reminder (event_id, message, send_date, is_sent)
            VALUES (%s, %s, %s, %s)
            """, (event_id, message, send_date, is_sent))
        db.commit()
        cursor.close()
        return jsonify({"message": "Maintenance event reminder added successfully!"})
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500


# Run server
if __name__ == '__main__':
    app.run(debug=True)
