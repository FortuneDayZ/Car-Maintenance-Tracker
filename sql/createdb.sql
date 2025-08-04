DROP DATABASE IF EXISTS `Final`;
CREATE DATABASE `Final`;
USE `Final`;


CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash CHAR(60) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    birthday DATE NOT NULL,
    registration_date DATE NOT NULL,
    is_admin INT NOT NULL DEFAULT 0
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
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    street VARCHAR(100),
    city VARCHAR(50),
    state VARCHAR(50),
    zip_code VARCHAR(15),
    phone_number VARCHAR(20),
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE Mechanics (
    mechanic_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    car_shop_id INT,
    name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    email VARCHAR(100),
    FOREIGN KEY (car_shop_id) REFERENCES CarShops(car_shop_id) 
        ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
        ON UPDATE CASCADE ON DELETE CASCADE
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
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    manufacturer VARCHAR(100) NOT NULL,
    part_number VARCHAR(100) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
        ON UPDATE CASCADE ON DELETE CASCADE
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
    category ENUM('Maintenance', 'Fuel', 'Registration', 'Insurance', 'Misc') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    FOREIGN KEY (vin) REFERENCES Vehicles(vin)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE MaintenanceExpenses (
    expense_id INT PRIMARY KEY,
    service_id INT NOT NULL,
    FOREIGN KEY (service_id) REFERENCES ServiceRecords(service_id) 
        ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (expense_id) REFERENCES Expenses(expense_id) 
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE RegistrationExpenses (
    expense_id INT PRIMARY KEY,
    renewal_date DATE NOT NULL,
    renewal_period VARCHAR(50), -- e.g., '1 year', '2 years'
    state VARCHAR(50),
    FOREIGN KEY (expense_id) REFERENCES Expenses(expense_id) 
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE InsuranceExpenses (
    expense_id INT PRIMARY KEY,
    policy_number VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    provider_name VARCHAR(100),
    FOREIGN KEY (expense_id) REFERENCES Expenses(expense_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE FuelExpenses (
    expense_id INT PRIMARY KEY,
    gallons FLOAT NOT NULL,
    current_mileage INT NOT NULL,
    fuel_type VARCHAR(50),
    FOREIGN KEY (expense_id) REFERENCES expenses(expense_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE UpcomingServices (
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

CREATE TABLE UpcomingServices_ServiceTypes (
    event_id INT,
    service_type VARCHAR(50),
    PRIMARY KEY (event_id, service_type),
    FOREIGN KEY (event_id) REFERENCES UpcomingServices(event_id) 
        ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (service_type) REFERENCES ServiceTypes(service_type) 
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE Reminder (
    reminder_id INT AUTO_INCREMENT,
    event_id INT,
    message TEXT,
    send_date DATE NOT NULL,
    was_sent BOOLEAN NOT NULL,
    was_read BOOLEAN NOT NULL,
    PRIMARY KEY (reminder_id, event_id),
    FOREIGN KEY (event_id) REFERENCES UpcomingServices(event_id) 
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX idx_make_model ON Vehicles(make, model);
CREATE INDEX idx_city_state ON CarShops(city, state);
CREATE INDEX idx_mechanic_carshop ON Mechanics(car_shop_id);
CREATE INDEX idx_vin_service_date ON ServiceRecords(vin, service_date);
CREATE INDEX idx_service_only ON WorkedOn(service_id);
CREATE INDEX idx_service_type ON ServiceRecords_ServiceTypes(service_type);
CREATE INDEX idx_part_name ON Parts(name);
CREATE INDEX idx_part_id_only ON ServiceRecords_Parts(part_id);
CREATE INDEX idx_vin_date ON Expenses(vin, date);
CREATE INDEX idx_user_vin_status ON UpcomingServices(user_id, vin, status);
CREATE INDEX idx_service_type_only ON UpcomingServices_ServiceTypes(service_type);
CREATE INDEX idx_send_status ON Reminder(send_date, was_sent);
