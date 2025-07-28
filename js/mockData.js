// Mock data for Vehicle Management System

// Users data
const mockUsers = [
    {
        user_id: 1,
        username: "admin",
        password_hash: "$2b$10$example_hash_admin",
        email: "admin@cartracker.com",
        birthday: "1980-01-01",
        registration_date: "2023-01-01"
    },
    {
        user_id: 2,
        username: "john_doe",
        password_hash: "$2b$10$example_hash_1",
        email: "john.doe@email.com",
        birthday: "1985-03-15",
        registration_date: "2023-01-10"
    },
    {
        user_id: 3,
        username: "jane_smith",
        password_hash: "$2b$10$example_hash_2",
        email: "jane.smith@email.com",
        birthday: "1990-07-22",
        registration_date: "2023-02-05"
    },
    {
        user_id: 4,
        username: "mike_wilson",
        password_hash: "$2b$10$example_hash_3",
        email: "mike.wilson@email.com",
        birthday: "1988-11-08",
        registration_date: "2023-03-20"
    },
    {
        user_id: 5,
        username: "sarah_jones",
        password_hash: "$2b$10$example_hash_4",
        email: "sarah.jones@email.com",
        birthday: "1992-04-12",
        registration_date: "2023-04-15"
    },
    {
        user_id: 6,
        username: "david_brown",
        password_hash: "$2b$10$example_hash_5",
        email: "david.brown@email.com",
        birthday: "1987-09-30",
        registration_date: "2023-05-01"
    }
];

// Vehicles data
const mockVehicles = [
    {
        vin: "1HGBH41JXMN109186",
        make: "Honda",
        model: "Civic",
        year: 2020
    },
    {
        vin: "2T1BURHE0JC123456",
        make: "Toyota",
        model: "Camry",
        year: 2019
    },
    {
        vin: "3VWDX7AJ5DM123789",
        make: "Volkswagen",
        model: "Jetta",
        year: 2021
    },
    {
        vin: "4T1B11HK5JU123456",
        make: "Toyota",
        model: "Corolla",
        year: 2018
    },
    {
        vin: "5NPE34AF5FH123789",
        make: "Hyundai",
        model: "Sonata",
        year: 2022
    },
    {
        vin: "6G1ZT51806L123456",
        make: "Chevrolet",
        model: "Malibu",
        year: 2020
    },
    {
        vin: "7FARW2H87BE123789",
        make: "Ford",
        model: "Focus",
        year: 2019
    },
    {
        vin: "8XJDF4G23BN123456",
        make: "Audi",
        model: "A4",
        year: 2021
    }
];

// Ownership data
const mockOwns = [
    {
        user_id: 2,
        vin: "1HGBH41JXMN109186",
        start_date: "2020-06-15",
        end_date: null
    },
    {
        user_id: 3,
        vin: "2T1BURHE0JC123456",
        start_date: "2019-08-20",
        end_date: null
    },
    {
        user_id: 4,
        vin: "3VWDX7AJ5DM123789",
        start_date: "2021-03-10",
        end_date: null
    },
    {
        user_id: 5,
        vin: "4T1B11HK5JU123456",
        start_date: "2018-11-05",
        end_date: null
    },
    {
        user_id: 6,
        vin: "5NPE34AF5FH123789",
        start_date: "2022-01-15",
        end_date: null
    },
    {
        user_id: 2,
        vin: "6G1ZT51806L123456",
        start_date: "2020-09-12",
        end_date: null
    },
    {
        user_id: 3,
        vin: "7FARW2H87BE123789",
        start_date: "2019-12-03",
        end_date: null
    },
    {
        user_id: 4,
        vin: "8XJDF4G23BN123456",
        start_date: "2021-07-22",
        end_date: null
    }
];

// Car Shops data
const mockCarShops = [
    {
        car_shop_id: 1,
        name: "Downtown Auto Repair",
        address: "123 Main St, Downtown, CA 90210",
        phone_number: "(555) 123-4567"
    },
    {
        car_shop_id: 2,
        name: "Precision Motors",
        address: "456 Oak Ave, Westside, CA 90211",
        phone_number: "(555) 234-5678"
    },
    {
        car_shop_id: 3,
        name: "Quick Fix Auto",
        address: "789 Pine Rd, Eastside, CA 90212",
        phone_number: "(555) 345-6789"
    },
    {
        car_shop_id: 4,
        name: "Elite Automotive",
        address: "321 Elm St, Northside, CA 90213",
        phone_number: "(555) 456-7890"
    },
    {
        car_shop_id: 5,
        name: "Reliable Auto Service",
        address: "654 Maple Dr, Southside, CA 90214",
        phone_number: "(555) 567-8901"
    }
];

// Mechanics data
const mockMechanics = [
    {
        mechanic_id: 1,
        car_shop_id: 1,
        name: "Bob Johnson",
        phone_number: "(555) 111-2222",
        email: "bob.johnson@downtownauto.com"
    },
    {
        mechanic_id: 2,
        car_shop_id: 1,
        name: "Alice Davis",
        phone_number: "(555) 222-3333",
        email: "alice.davis@downtownauto.com"
    },
    {
        mechanic_id: 3,
        car_shop_id: 2,
        name: "Charlie Wilson",
        phone_number: "(555) 333-4444",
        email: "charlie.wilson@precisionmotors.com"
    },
    {
        mechanic_id: 4,
        car_shop_id: 2,
        name: "Diana Martinez",
        phone_number: "(555) 444-5555",
        email: "diana.martinez@precisionmotors.com"
    },
    {
        mechanic_id: 5,
        car_shop_id: 3,
        name: "Ethan Brown",
        phone_number: "(555) 555-6666",
        email: "ethan.brown@quickfixauto.com"
    },
    {
        mechanic_id: 6,
        car_shop_id: 4,
        name: "Fiona Garcia",
        phone_number: "(555) 666-7777",
        email: "fiona.garcia@eliteautomotive.com"
    },
    {
        mechanic_id: 7,
        car_shop_id: 5,
        name: "George Lee",
        phone_number: "(555) 777-8888",
        email: "george.lee@reliableauto.com"
    }
];

// Service Records data
const mockServiceRecords = [
    {
        service_id: 1,
        vin: "1HGBH41JXMN109186",
        service_date: "2023-06-15",
        current_mileage: 25000,
        cost: 150.00,
        description: "Oil change and tire rotation"
    },
    {
        service_id: 2,
        vin: "2T1BURHE0JC123456",
        service_date: "2023-07-20",
        current_mileage: 35000,
        cost: 300.00,
        description: "Brake pad replacement"
    },
    {
        service_id: 3,
        vin: "3VWDX7AJ5DM123789",
        service_date: "2023-08-10",
        current_mileage: 15000,
        cost: 200.00,
        description: "Air filter replacement and inspection"
    },
    {
        service_id: 4,
        vin: "4T1B11HK5JU123456",
        service_date: "2023-09-05",
        current_mileage: 45000,
        cost: 500.00,
        description: "Timing belt replacement"
    },
    {
        service_id: 5,
        vin: "5NPE34AF5FH123789",
        service_date: "2023-10-15",
        current_mileage: 8000,
        cost: 100.00,
        description: "First service - oil change"
    },
    {
        service_id: 6,
        vin: "6G1ZT51806L123456",
        service_date: "2023-11-12",
        current_mileage: 28000,
        cost: 250.00,
        description: "Transmission fluid change"
    },
    {
        service_id: 7,
        vin: "7FARW2H87BE123789",
        service_date: "2023-12-03",
        current_mileage: 32000,
        cost: 400.00,
        description: "Suspension repair"
    },
    {
        service_id: 8,
        vin: "8XJDF4G23BN123456",
        service_date: "2024-01-22",
        current_mileage: 18000,
        cost: 180.00,
        description: "Regular maintenance service"
    }
];

// WorkedOn data (mechanics who worked on services)
const mockWorkedOn = [
    { mechanic_id: 1, service_id: 1 },
    { mechanic_id: 2, service_id: 2 },
    { mechanic_id: 3, service_id: 3 },
    { mechanic_id: 4, service_id: 4 },
    { mechanic_id: 5, service_id: 5 },
    { mechanic_id: 6, service_id: 6 },
    { mechanic_id: 7, service_id: 7 },
    { mechanic_id: 1, service_id: 8 },
    { mechanic_id: 2, service_id: 1 },
    { mechanic_id: 3, service_id: 2 }
];

// Service Types data
const mockServiceTypes = [
    { service_type: "Oil Change" },
    { service_type: "Tire Rotation" },
    { service_type: "Brake Service" },
    { service_type: "Air Filter Replacement" },
    { service_type: "Timing Belt Replacement" },
    { service_type: "Transmission Service" },
    { service_type: "Suspension Repair" },
    { service_type: "Electrical Repair" },
    { service_type: "Engine Tune-up" },
    { service_type: "Cooling System Service" }
];

// ServiceRecords_ServiceTypes data
const mockServiceRecords_ServiceTypes = [
    { service_id: 1, service_type: "Oil Change" },
    { service_id: 1, service_type: "Tire Rotation" },
    { service_id: 2, service_type: "Brake Service" },
    { service_id: 3, service_type: "Air Filter Replacement" },
    { service_id: 4, service_type: "Timing Belt Replacement" },
    { service_id: 5, service_type: "Oil Change" },
    { service_id: 6, service_type: "Transmission Service" },
    { service_id: 7, service_type: "Suspension Repair" },
    { service_id: 8, service_type: "Oil Change" },
    { service_id: 8, service_type: "Engine Tune-up" }
];

// Parts data
const mockParts = [
    {
        part_id: 1,
        name: "Oil Filter",
        manufacturer: "Fram",
        part_number: "PH2870",
        unit_price: 8.99
    },
    {
        part_id: 2,
        name: "Brake Pads",
        manufacturer: "Wagner",
        part_number: "QC1059",
        unit_price: 45.99
    },
    {
        part_id: 3,
        name: "Air Filter",
        manufacturer: "K&N",
        part_number: "33-2034",
        unit_price: 25.99
    },
    {
        part_id: 4,
        name: "Timing Belt",
        manufacturer: "Gates",
        part_number: "T275",
        unit_price: 89.99
    },
    {
        part_id: 5,
        name: "Transmission Fluid",
        manufacturer: "Valvoline",
        part_number: "ATF-4",
        unit_price: 12.99
    },
    {
        part_id: 6,
        name: "Shock Absorber",
        manufacturer: "Monroe",
        part_number: "555001",
        unit_price: 65.99
    },
    {
        part_id: 7,
        name: "Spark Plugs",
        manufacturer: "NGK",
        part_number: "LFR5A-11",
        unit_price: 15.99
    },
    {
        part_id: 8,
        name: "Battery",
        manufacturer: "Interstate",
        part_number: "MT-47",
        unit_price: 120.99
    }
];

// ServiceRecords_Parts data
const mockServiceRecords_Parts = [
    { service_id: 1, part_id: 1 },
    { service_id: 2, part_id: 2 },
    { service_id: 3, part_id: 3 },
    { service_id: 4, part_id: 4 },
    { service_id: 5, part_id: 1 },
    { service_id: 6, part_id: 5 },
    { service_id: 7, part_id: 6 },
    { service_id: 8, part_id: 1 },
    { service_id: 8, part_id: 7 }
];

// Expenses data
const mockExpenses = [
    {
        expense_id: 1,
        vin: "1HGBH41JXMN109186",
        date: "2023-06-15",
        category: "Maintenance",
        amount: 150.00,
        description: "Oil change and tire rotation"
    },
    {
        expense_id: 2,
        vin: "2T1BURHE0JC123456",
        date: "2023-07-20",
        category: "Repair",
        amount: 300.00,
        description: "Brake pad replacement"
    },
    {
        expense_id: 3,
        vin: "3VWDX7AJ5DM123789",
        date: "2023-08-10",
        category: "Maintenance",
        amount: 200.00,
        description: "Air filter replacement"
    },
    {
        expense_id: 4,
        vin: "4T1B11HK5JU123456",
        date: "2023-09-05",
        category: "Repair",
        amount: 500.00,
        description: "Timing belt replacement"
    },
    {
        expense_id: 5,
        vin: "5NPE34AF5FH123789",
        date: "2023-10-15",
        category: "Maintenance",
        amount: 100.00,
        description: "First service"
    },
    {
        expense_id: 6,
        vin: "1HGBH41JXMN109186",
        date: "2023-12-01",
        category: "Insurance",
        amount: 600.00,
        description: "Annual insurance premium"
    },
    {
        expense_id: 7,
        vin: "2T1BURHE0JC123456",
        date: "2023-12-15",
        category: "Registration",
        amount: 150.00,
        description: "Vehicle registration renewal"
    }
];

// Fuel Log data
const mockFuelLog = [
    {
        fuel_log_id: 1,
        vin: "1HGBH41JXMN109186",
        date_filled: "2023-06-10",
        current_mileage: 24800,
        gallons: 12.5,
        total_cost: 45.00,
        fuel_type: "Regular"
    },
    {
        fuel_log_id: 2,
        vin: "2T1BURHE0JC123456",
        date_filled: "2023-07-15",
        current_mileage: 34800,
        gallons: 14.2,
        total_cost: 51.12,
        fuel_type: "Regular"
    },
    {
        fuel_log_id: 3,
        vin: "3VWDX7AJ5DM123789",
        date_filled: "2023-08-05",
        current_mileage: 14800,
        gallons: 11.8,
        total_cost: 42.48,
        fuel_type: "Premium"
    },
    {
        fuel_log_id: 4,
        vin: "4T1B11HK5JU123456",
        date_filled: "2023-09-01",
        current_mileage: 44800,
        gallons: 13.5,
        total_cost: 48.60,
        fuel_type: "Regular"
    },
    {
        fuel_log_id: 5,
        vin: "5NPE34AF5FH123789",
        date_filled: "2023-10-10",
        current_mileage: 7800,
        gallons: 15.0,
        total_cost: 54.00,
        fuel_type: "Regular"
    },
    {
        fuel_log_id: 6,
        vin: "1HGBH41JXMN109186",
        date_filled: "2023-12-20",
        current_mileage: 25200,
        gallons: 12.0,
        total_cost: 43.20,
        fuel_type: "Regular"
    }
];

// Maintenance Events data
const mockMaintenanceEvents = [
    {
        event_id: 1,
        user_id: 2,
        vin: "1HGBH41JXMN109186",
        rec_date: "2023-12-01",
        rec_mileage: 30000,
        status: "pending"
    },
    {
        event_id: 2,
        user_id: 3,
        vin: "2T1BURHE0JC123456",
        rec_date: "2023-12-15",
        rec_mileage: 40000,
        status: "completed"
    },
    {
        event_id: 3,
        user_id: 4,
        vin: "3VWDX7AJ5DM123789",
        rec_date: "2024-01-10",
        rec_mileage: 20000,
        status: "pending"
    },
    {
        event_id: 4,
        user_id: 5,
        vin: "4T1B11HK5JU123456",
        rec_date: "2023-11-20",
        rec_mileage: 50000,
        status: "overdue"
    },
    {
        event_id: 5,
        user_id: 6,
        vin: "5NPE34AF5FH123789",
        rec_date: "2024-02-01",
        rec_mileage: 15000,
        status: "pending"
    }
];

// MaintenanceEvents_ServiceTypes data
const mockMaintenanceEvents_ServiceTypes = [
    { event_id: 1, service_type: "Oil Change" },
    { event_id: 1, service_type: "Tire Rotation" },
    { event_id: 2, service_type: "Brake Service" },
    { event_id: 3, service_type: "Air Filter Replacement" },
    { event_id: 4, service_type: "Timing Belt Replacement" },
    { event_id: 5, service_type: "Oil Change" }
];

// ReminderNotifications data
const mockReminderNotifications = [
    {
        reminder_id: 1,
        event_id: 1,
        message: "Your Honda Civic is due for maintenance at 30,000 miles",
        send_date: "2023-12-01",
        is_sent: true
    },
    {
        reminder_id: 2,
        event_id: 2,
        message: "Your Toyota Camry brake service is scheduled",
        send_date: "2023-12-15",
        is_sent: true
    },
    {
        reminder_id: 3,
        event_id: 3,
        message: "Your Volkswagen Jetta maintenance reminder",
        send_date: "2024-01-10",
        is_sent: false
    },
    {
        reminder_id: 4,
        event_id: 4,
        message: "URGENT: Your Toyota Corolla timing belt is overdue",
        send_date: "2023-11-20",
        is_sent: true
    },
    {
        reminder_id: 5,
        event_id: 5,
        message: "Your Hyundai Sonata maintenance reminder",
        send_date: "2024-02-01",
        is_sent: false
    }
]; 