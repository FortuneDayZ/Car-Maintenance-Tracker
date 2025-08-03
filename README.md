
1) ./installation/mysql_config.sh setup
2) ./installation/mysql_config.sh test
3) ./installation/start_vehicle_system.sh
4) ./installation/reset_database.sh


### Prerequisites
- **MySQL Server** (version 5.7 or higher)
- **Node.js** (version 14 or higher)
- **npm** (comes with Node.js)

### Installation & Setup

1. **Clone/Download** the project to your computer

2. **Fix Script Permissions** (if you get permission errors):
   ```bash
   chmod +x installation/*.sh
   ```

3. **Configure MySQL** (one-time setup):
   ```bash
   ./installation/mysql_config.sh
   ```
   - Enter your MySQL host, user, and password
   - Test the connection

   ```bash
    ./installation/mysql_config.sh test
   ```

4. **Start the Application**:
   ```bash
   ./installation/start_vehicle_system.sh
   ```
   - Automatically installs dependencies
   - Creates database and tables
   - Sets up admin user and service types
   - Starts the web server

5. **Access the Application**:
   - Open browser: `http://localhost:3000`
   - Login: `admin` / `admin`

### Database Management

- **Reset Database**: `./installation/reset_database.sh`
- **Clear All Data**: Use the "Clear All Data" button in the Database Test section (admin only)

### Features

- **User Management**: Create accounts, manage vehicles
- **Vehicle Tracking**: Service records, fuel logs, expenses
- **Upcoming Services**: Schedule reminders, track service history
- **Analytics**: Cost summaries, fuel statistics
- **Database Tools**: Raw SQL execution, file uploads (admin only)



### Troubleshooting

- **Permission Denied Error**: Run `chmod +x installation/*.sh` to fix script permissions
- **Database Connection Error**: Run `mysql_config.sh` to reconfigure credentials
- **Port Already in Use**: Kill process on port 3000 or change port in `backend/server.js`
- **Admin Access Denied**: Use "Restore Admin" button in Database Test section




