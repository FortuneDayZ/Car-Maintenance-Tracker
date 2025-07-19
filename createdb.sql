-- Drop the database if it exists to start fresh, then create it and select it for use.
DROP DATABASE IF EXISTS car_maintenance_tracker;
CREATE DATABASE car_maintenance_tracker;
USE car_maintenance_tracker;

-- --- Drop Existing Tables in Reverse Order of Creation ---
-- This order is important to avoid foreign key constraint errors.
DROP TABLE IF EXISTS Reminders;
DROP TABLE IF EXISTS MaintenanceSchedules;
DROP TABLE IF EXISTS Logbook;
DROP TABLE IF EXISTS Expenses;
DROP TABLE IF EXISTS ServiceParts;
DROP TABLE IF EXISTS Parts;
DROP TABLE IF EXISTS ServiceRecords;
DROP TABLE IF EXISTS Vehicles;
DROP TABLE IF EXISTS Mechanics;
DROP TABLE IF EXISTS CarShops;
DROP TABLE IF EXISTS Users;


-- --- Create Tables ---

-- 1. User Table: Stores user account information with roles
CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    `role` ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. CarShop Table: Stores information about mechanic shops
CREATE TABLE CarShops (
    shop_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255),
    phone_number VARCHAR(20)
);

-- 3. Mechanic Table: Stores information about mechanics
CREATE TABLE Mechanics (
    mechanic_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    shop_id INT,
    FOREIGN KEY (shop_id) REFERENCES CarShops(shop_id) ON DELETE SET NULL
);

-- 4. Vehicle Table: Stores information about user's vehicles
CREATE TABLE Vehicles (
    vehicle_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    make VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    `year` INT NOT NULL,
    vin VARCHAR(17) UNIQUE,
    INDEX (user_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- 5. ServiceRecord Table: Logs each maintenance event
CREATE TABLE ServiceRecords (
    record_id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    mechanic_id INT,
    service_type VARCHAR(100) NOT NULL,
    service_date DATE NOT NULL,
    mileage INT,
    notes TEXT,
    INDEX (vehicle_id),
    INDEX (service_date),
    FOREIGN KEY (vehicle_id) REFERENCES Vehicles(vehicle_id) ON DELETE CASCADE,
    FOREIGN KEY (mechanic_id) REFERENCES Mechanics(mechanic_id) ON DELETE SET NULL
);

-- 6. Part Table: A list of parts that can be used in services
CREATE TABLE Parts (
    part_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT
);

-- 7. ServiceParts Table: Linking table for ServiceRecords and Parts
CREATE TABLE ServiceParts (
    record_id INT NOT NULL,
    part_id INT NOT NULL,
    quantity INT DEFAULT 1,
    PRIMARY KEY (record_id, part_id),
    FOREIGN KEY (record_id) REFERENCES ServiceRecords(record_id) ON DELETE CASCADE,
    FOREIGN KEY (part_id) REFERENCES Parts(part_id) ON DELETE CASCADE
);


-- 8. Expense Table: Tracks costs associated with a service
CREATE TABLE Expenses (
    expense_id INT AUTO_INCREMENT PRIMARY KEY,
    record_id INT NOT NULL,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (record_id) REFERENCES ServiceRecords(record_id) ON DELETE CASCADE
);

-- 9. Logbook Table: For general, user-submitted notes about a vehicle
CREATE TABLE Logbook (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    entry_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES Vehicles(vehicle_id) ON DELETE CASCADE
);

-- 10. MaintenanceSchedule Table: Defines recurring maintenance tasks
CREATE TABLE MaintenanceSchedules (
    schedule_id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    task_name VARCHAR(100) NOT NULL,
    interval_miles INT,
    interval_months INT,
    last_performed_date DATE,
    FOREIGN KEY (vehicle_id) REFERENCES Vehicles(vehicle_id) ON DELETE CASCADE
);

-- 11. Reminder Table: Stores upcoming service reminders
CREATE TABLE Reminders (
    reminder_id INT AUTO_INCREMENT PRIMARY KEY,
    schedule_id INT NOT NULL,
    due_date DATE NOT NULL,
    message VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (schedule_id) REFERENCES MaintenanceSchedules(schedule_id) ON DELETE CASCADE
);

-- --- Sample Data Insertion ---

-- Users
INSERT INTO Users (username, password_hash, `role`) VALUES
('tiger_y', 'hash123', 'admin'),
('chris_o', 'hash456', 'user'),
('marsel_a', 'hash789', 'user');

-- Car Shops
INSERT INTO CarShops (name, address, phone_number) VALUES
('Downtown Auto Repair', '123 Main St, San Jose, CA', '408-555-0101'),
('Speedy Oil Change', '456 Oak Ave, San Jose, CA', '408-555-0102');

-- Mechanics
INSERT INTO Mechanics (name, shop_id) VALUES
('John Doe', 1),
('Jane Smith', 2);

-- Vehicles
INSERT INTO Vehicles (user_id, make, model, `year`, vin) VALUES
(1, 'Toyota', 'Camry', 2021, '1A2B3C4D5E6F7G8H9'),
(2, 'Honda', 'Civic', 2020, '9H8G7F6E5D4C3B2A1');

-- Service Records
INSERT INTO ServiceRecords (vehicle_id, mechanic_id, service_type, service_date, mileage, notes) VALUES
(1, 1, 'Oil Change', '2025-06-15', 35000, 'Synthetic oil used.'),
(2, 2, 'Brake Pad Replacement', '2025-07-01', 45000, 'Replaced front brake pads.');

-- Parts and ServiceParts
INSERT INTO Parts (name, description) VALUES
('Synthetic Oil 5W-30', 'Full synthetic motor oil'),
('Oil Filter', 'Standard engine oil filter'),
('Front Brake Pads', 'Ceramic brake pads');

INSERT INTO ServiceParts (record_id, part_id, quantity) VALUES
(1, 1, 5),
(1, 2, 1),
(2, 3, 1);

-- Expenses
INSERT INTO Expenses (record_id, description, amount) VALUES
(1, 'Labor for Oil Change', 25.00),
(1, 'Parts for Oil Change', 45.50),
(2, 'Labor for Brakes', 120.00),
(2, 'Parts for Brakes', 85.00);


-- Logbook Entries
INSERT INTO Logbook (vehicle_id, entry_text) VALUES
(1, 'Heard a slight rattling noise from the right rear side when driving over bumps.'),
(2, 'Check tire pressure before the upcoming road trip.');

-- Maintenance Schedules
INSERT INTO MaintenanceSchedules (vehicle_id, task_name, interval_miles, last_performed_date, interval_months) VALUES
(1, 'Oil Change', 5000, '2025-06-15', 6),
(2, 'Tire Rotation', 7500, '2024-12-01', 4);

-- Reminders
INSERT INTO Reminders (schedule_id, due_date, message) VALUES
(1, '2025-11-15', 'Your Toyota Camry is due for an oil change soon.'),
(2, '2025-08-01', 'Reminder: Time to rotate the tires on your Honda Civic.');

-- --- Verification Query ---
SELECT * FROM Logbook;