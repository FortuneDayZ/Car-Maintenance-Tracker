# Car Tracker - Vehicle Management System

## Overview

Car Tracker is a comprehensive web-based vehicle management system designed for macOS that allows users to track their vehicles, manage service records, monitor expenses, and schedule upcoming maintenance. The application provides a complete solution for vehicle owners to maintain detailed records of their automotive investments.

### Key Features

- **Vehicle Management**: Add, edit, and track multiple vehicles with detailed information
- **Service Records**: Log and track all service history with costs and mechanics
- **Expense Tracking**: Monitor fuel costs, insurance, registration, and maintenance expenses
- **Upcoming Services**: Schedule and manage upcoming maintenance reminders
- **User Management**: Multi-user system with admin privileges
- **Analytics**: Cost summaries, fuel statistics, and service analytics
- **Database Tools**: Raw SQL execution and data management (admin only)

## Prerequisites

- **macOS** (designed and tested for macOS)
- **MySQL Server** (version 5.7 or higher)
- **Node.js** (version 14 or higher)
- **npm** (comes with Node.js)
- **Python 3** (for data population and testing)

## Installation & Setup

### 1. Clone/Download the Project

```bash
git clone https://github.com/FortuneDayZ/sqlProj
cd sqlProj
```

### 2. Fix Script Permissions

```bash
chmod +x installation/*.sh
```

### 3. Configure MySQL (One-time Setup)

```bash
./installation/mysql_config.sh
```

- Enter your MySQL host, user, and password when prompted
- Test the connection to ensure it works

```bash
./installation/mysql_config.sh test
```

### 4. Start the Application

```bash
./installation/start_vehicle_system.sh
```

This script will automatically:
- Install Node.js dependencies
- Create the database and tables
- Set up admin user and service types
- Insert sample data (optional)
- Start the web server

### 5. Access the Application

- Open your browser and navigate to: `http://localhost:3000`
- Login with default credentials:
  - Username: `admin`
  - Password: `admin`

- Or SignUp as a regular user

## Database Management

### Reset Database
```bash
./installation/reset_database.sh
```


### Test Indexes with Large Dataset

To test database performance and indexes with a large dataset:

```bash
cd index
python3 -m venv venv
source venv/bin/activate
pip3 install mysql-connector-python faker
python3 populate.py
python3 index.py
```

This script will:
- Generate a large dataset for performance testing
- Create and test various database indexes
- Benchmark query performance
- Provide detailed analysis of index effectiveness

## Division of Work

### Tiger
- **Frontend Interface**: Complete web-based user interface
- **Search and Filter Logic**: Vehicle and service search functionality
- **Testing**: Comprehensive testing of all features
- **System Integration**: Connected frontend with backend services
- **Documentation**: User guides and system documentation

### Marsel
- **Frontend Interface**: Complete web-based user interface
- **Search and Filter Logic**: Vehicle and service search functionality
- **Testing**: Comprehensive testing of all features
- **System Integration**: Connected frontend with backend services
- **Documentation**: User guides and system documentation

## Troubleshooting

### Permission Denied Error
```bash
chmod +x installation/*.sh
```

### Database Connection Error
```bash
./installation/mysql_config.sh
```

### Port Already in Use
Kill process on port 3000 or change port in `backend/server.js`

### MySQL Not Running
```bash
brew services start mysql  # macOS
```

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Data Generation**: Python 3, Faker library
- **Platform**: macOS (optimized)




