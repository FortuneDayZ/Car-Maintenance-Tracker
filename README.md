# Vehicle Management System

A comprehensive static web frontend for managing vehicle-related data, including users, vehicles, service records, mechanics, parts, expenses, and maintenance schedules.

## Features

### 🚗 **Complete CRUD Operations**
- **Users Management**: Add, edit, delete users with vehicle ownership tracking
- **Vehicles Management**: Manage vehicle inventory with VIN validation
- **Ownership Tracking**: Link users to vehicles with start/end dates
- **Service Records**: Track maintenance and repair services
- **Car Shops & Mechanics**: Manage repair shops and their staff
- **Parts Inventory**: Track auto parts with pricing
- **Expenses Tracking**: Monitor vehicle-related costs
- **Fuel Logging**: Record fuel purchases and consumption
- **Maintenance Scheduling**: Schedule and track maintenance events

### 🔗 **Relationship Visualization**
- **User Details**: View owned vehicles and maintenance events
- **Vehicle Details**: See owners, service history, expenses, and fuel logs
- **Service Details**: View mechanics, parts used, and service types
- **Mechanic Details**: See service history and shop assignments
- **Part Details**: Track which services used specific parts

### 🎨 **Modern UI/UX**
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Bootstrap 5**: Modern, clean interface
- **Font Awesome Icons**: Intuitive navigation and actions
- **Collapsible Details**: Expandable relationship information
- **Modal Forms**: Clean add/edit interfaces
- **Real-time Validation**: Form validation with helpful error messages

### 📊 **Data Management**
- **Mock Data**: Comprehensive sample data for all entities
- **In-Memory Storage**: All data stored in browser memory
- **Export/Import**: Backup and restore functionality
- **Relationship Integrity**: Maintains data consistency across entities

## File Structure

```
├── index.html              # Main application page
├── css/
│   └── styles.css          # Custom styling
├── js/
│   ├── mockData.js         # Sample data for all tables
│   ├── utils.js            # Utility functions and data store
│   ├── app.js              # Main application logic
│   └── managers/           # Individual entity managers
│       ├── usersManager.js
│       ├── vehiclesManager.js
│       ├── ownsManager.js
│       ├── shopsManager.js
│       ├── mechanicsManager.js
│       ├── servicesManager.js
│       ├── partsManager.js
│       ├── expensesManager.js
│       ├── fuelManager.js
│       └── maintenanceManager.js
└── README.md              # This file
```

## Database Schema

The system supports the following MySQL database schema:

### Core Tables
- **Users**: User accounts with authentication info
- **Vehicles**: Vehicle inventory with VIN, make, model, year
- **Owns**: Junction table linking users to vehicles
- **CarShops**: Repair shop information
- **Mechanics**: Shop staff with contact details
- **ServiceRecords**: Maintenance and repair records
- **Parts**: Auto parts inventory with pricing
- **Expenses**: Vehicle-related cost tracking
- **FuelLog**: Fuel purchase records
- **MaintenanceEvents**: Scheduled maintenance

### Junction Tables
- **WorkedOn**: Links mechanics to service records
- **ServiceRecords_ServiceTypes**: Links services to service types
- **ServiceRecords_Parts**: Links services to parts used
- **MaintenanceEvents_ServiceTypes**: Links maintenance to service types

### Supporting Tables
- **ServiceTypes**: Available service categories
- **ReminderNotifications**: Maintenance reminders

## Usage

### Getting Started
1. Open `index.html` in a modern web browser
2. Navigate between sections using the top navigation bar
3. Use "Add" buttons to create new records
4. Click "Details" to view relationships
5. Use edit/delete buttons for record management

### Navigation
- **Users**: Manage user accounts and view their vehicles
- **Vehicles**: Manage vehicle inventory and view ownership
- **Ownership**: Track vehicle ownership relationships
- **Car Shops**: Manage repair shops and their mechanics
- **Mechanics**: Manage shop staff and view their services
- **Service Records**: Track maintenance and repair services
- **Parts**: Manage auto parts inventory
- **Expenses**: Track vehicle-related costs
- **Fuel Log**: Record fuel purchases
- **Maintenance**: Schedule and track maintenance events

### Features by Section

#### Users Management
- Add/edit/delete user accounts
- View owned vehicles for each user
- Track maintenance events per user
- Email validation and duplicate checking

#### Vehicles Management
- Add/edit/delete vehicles with VIN validation
- View current owners and ownership history
- Track service records, expenses, and fuel logs
- Comprehensive vehicle details with relationships

#### Service Records
- Record maintenance and repair services
- Link mechanics who performed the work
- Track parts used in each service
- Associate service types (oil change, brake service, etc.)
- Cost tracking and mileage recording

#### Mechanics & Shops
- Manage car repair shops
- Assign mechanics to shops
- Track mechanic service history
- View shop details and staff

#### Parts Management
- Maintain auto parts inventory
- Track parts used in services
- Monitor part pricing
- View service history for each part

#### Financial Tracking
- **Expenses**: Track all vehicle-related costs
- **Fuel Log**: Monitor fuel consumption and costs
- **Service Costs**: Record maintenance and repair expenses

#### Maintenance Scheduling
- Schedule maintenance events
- Set maintenance reminders
- Track maintenance status (pending/completed/overdue)
- Associate service types with maintenance events

## Technical Details

### Technologies Used
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with Bootstrap 5
- **JavaScript (ES6+)**: Modular, object-oriented code
- **Bootstrap 5**: Responsive UI framework
- **Font Awesome**: Icon library

### Data Management
- **In-Memory Storage**: All data stored in browser memory
- **Mock Data**: Comprehensive sample data included
- **Export/Import**: JSON-based data backup/restore
- **Relationship Integrity**: Maintains referential integrity

### Code Architecture
- **Modular Design**: Separate manager for each entity
- **Utility Functions**: Shared functions for common operations
- **Event-Driven**: Responsive to user interactions
- **Validation**: Comprehensive form validation
- **Error Handling**: User-friendly error messages

## Browser Compatibility

- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

## Development

### Adding New Features
1. Create new manager in `js/managers/`
2. Add mock data to `js/mockData.js`
3. Update navigation in `index.html`
4. Add utility functions to `js/utils.js` if needed
5. Initialize in `js/app.js`

### Data Export/Import
```javascript
// Export current data
App.exportData();

// Import data
App.importData(jsonString);
```

### Console Commands
```javascript
// View all data
console.log(dataStore);

// Refresh all tables
App.refreshAllTables();

// Export data
exportData();
```

## Sample Data

The system includes comprehensive mock data:
- **5 Users** with different vehicle ownership patterns
- **8 Vehicles** from various manufacturers
- **5 Car Shops** with mechanics
- **8 Service Records** with mechanics and parts
- **8 Parts** with pricing information
- **7 Expenses** across different categories
- **6 Fuel Logs** with different fuel types
- **5 Maintenance Events** with various statuses

## Future Enhancements

- **Backend Integration**: Connect to actual MySQL database
- **User Authentication**: Login/logout functionality
- **Advanced Filtering**: Search and filter capabilities
- **Reporting**: Generate reports and analytics
- **Notifications**: Real-time maintenance reminders
- **Image Upload**: Vehicle and part photos
- **Mobile App**: Native mobile application

## License

This project is open source and available under the MIT License. 