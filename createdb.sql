DROP DATABASE IF EXISTS `Final`;
CREATE DATABASE `Final`;
USE `Final`;


CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash CHAR(60) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    birthday DATE NOT NULL,
    registration_date DATE NOT NULL
);

CREATE TABLE Vehicles (
    vin VARCHAR(17) PRIMARY KEY,
    make VARCHAR(50) NOT NULL, 
    model VARCHAR(50) NOT NULL, 
    year INT NOT NULL 
);

CREATE TABLE Owns (
    user_id INT,
    vin VARCHAR(17),
    start_date DATE NOT NULL,
    end_date DATE,
    PRIMARY KEY (user_id, vin),
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (vin) REFERENCES Vehicles(vin)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE CarShops (
    car_shop_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    street VARCHAR(100),
    city VARCHAR(50),
    state VARCHAR(50),
    zip_code VARCHAR(15),
    phone_number VARCHAR(20)
);

CREATE TABLE Mechanics (
    mechanic_id INT AUTO_INCREMENT PRIMARY KEY,
    car_shop_id INT,
    name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    email VARCHAR(100),
    FOREIGN KEY (car_shop_id) REFERENCES CarShops(car_shop_id) 
        ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE ServiceRecords (
    service_id INT AUTO_INCREMENT PRIMARY KEY,
    vin VARCHAR(17) NOT NULL,
    service_date DATE NOT NULL,
    current_mileage INT NOT NULL,
    cost DECIMAL(10, 2) NOT NULL,
    description TEXT,
    FOREIGN KEY (vin) REFERENCES vehicles(vin) 
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE WorkedOn (
    mechanic_id INT,
    service_id INT,
    PRIMARY KEY (mechanic_id, service_id),
    FOREIGN KEY (mechanic_id) REFERENCES Mechanics(mechanic_id) 
        ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES ServiceRecords(service_id) 
    ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE ServiceTypes (
    service_type VARCHAR(50) PRIMARY KEY
);

CREATE TABLE ServiceRecords_ServiceTypes (
    service_id INT,
    service_type VARCHAR(50),
    PRIMARY KEY (service_id, service_type),
    FOREIGN KEY (service_id) REFERENCES ServiceRecords(service_id) 
        ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (service_type) REFERENCES ServiceTypes(service_type) 
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE Parts (
    part_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    manufacturer VARCHAR(255),
    part_number VARCHAR(100),
    unit_price DECIMAL(10, 2) NOT NULL
);

CREATE TABLE ServiceRecords_Parts (
    service_id INT,
    part_id INT,
    PRIMARY KEY (service_id, part_id),
    FOREIGN KEY (service_id) REFERENCES ServiceRecords(service_id) 
        ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (part_id) REFERENCES Parts(part_id) 
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE Expenses (
    expense_id INT AUTO_INCREMENT PRIMARY KEY,
    vin VARCHAR(17) NOT NULL, 
    date DATE NOT NULL,
    category VARCHAR(100) NOT NULL, 
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    FOREIGN KEY (vin) REFERENCES Vehicles(vin)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE FuelLog (
    fuel_log_id INT AUTO_INCREMENT PRIMARY KEY,
    vin VARCHAR(17) NOT NULL,
    date_filled DATE NOT NULL,
    current_mileage INT NOT NULL,
    gallons DECIMAL(10, 2) NOT NULL,
    total_cost DECIMAL(10, 2) NOT NULL,
    fuel_type VARCHAR(50),
    FOREIGN KEY (vin) REFERENCES Vehicles(vin)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE MaintenanceEvents (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    vin VARCHAR(17) NOT NULL,
    rec_date DATE NOT NULL,
    rec_mileage INT NOT NULL,
    status VARCHAR(20) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (vin) REFERENCES Vehicles(vin)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE MaintenanceEvents_ServiceTypes (
    event_id INT,
    service_type VARCHAR(50),
    PRIMARY KEY (event_id, service_type),
    FOREIGN KEY (event_id) REFERENCES MaintenanceEvents(event_id) 
        ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (service_type) REFERENCES ServiceTypes(service_type) 
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE Reminder (
    reminder_id INT AUTO_INCREMENT,
    event_id INT,
    message TEXT,
    send_date DATE NOT NULL,
    is_sent BOOLEAN NOT NULL,
    PRIMARY KEY (reminder_id, event_id),
    FOREIGN KEY (event_id) REFERENCES MaintenanceEvents(event_id) 
        ON UPDATE CASCADE ON DELETE CASCADE
)
