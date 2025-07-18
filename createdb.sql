DROP DATABASE IF EXISTS car_maintenance_tracker;
CREATE DATABASE car_maintenance_tracker;
USE car_maintenance_tracker;

DROP TABLE IF EXISTS Vehicles;
DROP TABLE IF EXISTS Users;

CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    `role` ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

INSERT INTO Users (username, password_hash, `role`) VALUES
('tiger_y', 'hash123', 'admin'),
('chris_o', 'hash456', 'user'),
('marsel_a', 'hash789', 'user');

INSERT INTO Vehicles (user_id, make, model, `year`, vin) VALUES
(1, 'Toyota', 'Camry', 2021, '1A2B3C4D5E6F7G8H9'),
(2, 'Honda', 'Civic', 2020, '9H8G7F6E5D4C3B2A1');

SELECT
    v.vehicle_id,
    v.make,
    v.model,
    v.year,
    u.username AS owner
FROM
    Vehicles v
JOIN
    Users u ON v.user_id = u.user_id;