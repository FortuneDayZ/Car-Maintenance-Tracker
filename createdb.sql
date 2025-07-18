DROP DATABASE IF EXISTS car_maintenance_tracker;
CREATE DATABASE car_maintenance_tracker;
USE car_maintenance_tracker;

DROP TABLE IF EXISTS ServiceRecords;
DROP TABLE IF EXISTS Mechanics;
DROP TABLE IF EXISTS CarShops;
DROP TABLE IF EXISTS Vehicles;
DROP TABLE IF EXISTS Users;

CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    `role` ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE CarShops (
    shop_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255),
    phone_number VARCHAR(20)
);

CREATE TABLE Mechanics (
    mechanic_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    shop_id INT,
    FOREIGN KEY (shop_id) REFERENCES CarShops(shop_id) ON DELETE SET NULL
);

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

INSERT INTO Users (username, password_hash, `role`) VALUES
('tiger_y', 'hash123', 'admin'),
('chris_o', 'hash456', 'user'),
('marsel_a', 'hash789', 'user');

INSERT INTO CarShops (name, address, phone_number) VALUES
('Downtown Auto Repair', '123 Main St, San Jose, CA', '408-555-0101'),
('Speedy Oil Change', '456 Oak Ave, San Jose, CA', '408-555-0102');

INSERT INTO Mechanics (name, shop_id) VALUES
('John Doe', 1),
('Jane Smith', 2);

INSERT INTO Vehicles (user_id, make, model, `year`, vin) VALUES
(1, 'Toyota', 'Camry', 2021, '1A2B3C4D5E6F7G8H9'),
(2, 'Honda', 'Civic', 2020, '9H8G7F6E5D4C3B2A1');

INSERT INTO ServiceRecords (vehicle_id, mechanic_id, service_type, service_date, mileage, notes) VALUES
(1, 1, 'Oil Change', '2025-06-15', 35000, 'Synthetic oil used.'),
(2, 2, 'Brake Pad Replacement', '2025-07-01', 45000, 'Replaced front brake pads.');

SELECT
    sr.record_id,
    sr.service_type,
    sr.service_date,
    v.make,
    v.model,
    m.name AS mechanic_name,
    cs.name AS car_shop
FROM
    ServiceRecords sr
JOIN
    Vehicles v ON sr.vehicle_id = v.vehicle_id
LEFT JOIN
    Mechanics m ON sr.mechanic_id = m.mechanic_id
LEFT JOIN
    CarShops cs ON m.shop_id = cs.shop_id;