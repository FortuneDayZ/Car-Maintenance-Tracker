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

## Testing Key Features

### 1. User Authentication
- Login with admin credentials
- Create new user accounts
- Test user permissions

### 2. Vehicle Management
- Add a new vehicle with VIN, make, model, year
- Edit vehicle information
- View vehicle details

### 3. Service Records
- Add service records with costs
- Link services to mechanics and shops
- View service history

### 4. Expense Tracking
- Log fuel expenses with gallons and mileage
- Record insurance and registration costs
- Track maintenance expenses

### 5. Upcoming Services
- Schedule upcoming maintenance
- Set reminders for service dates
- View pending services

### 6. Analytics
- View cost summaries by category
- Analyze fuel consumption
- Review service statistics

### 7. Database Testing (Admin Only)
- Execute raw SQL queries
- Upload SQL files
- Test database performance

## Project Structure

```
sqlProj/
├── backend/              # Node.js server
├── css/                  # Stylesheets
├── js/                   # Frontend JavaScript
│   └── managers/         # Feature managers
├── index/                # Python scripts
├── installation/         # Setup scripts
├── sql/                  # Database schema
├── SQL_Tests/           # Test data and queries
└── Documents/           # ER diagrams and schemas
```

## Division of Work

### Tiger
- **ER Diagram Design**: Created comprehensive entity-relationship diagram
- **SQL Schema**: Designed and implemented complete database schema
- **Authentication Features**: User management and admin system
- **Database Setup**: SQL scripts for table creation and initial data

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

### Admin Access Denied
Use "Restore Admin" button in Database Test section

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

## License

MIT License - see LICENSE file for details




