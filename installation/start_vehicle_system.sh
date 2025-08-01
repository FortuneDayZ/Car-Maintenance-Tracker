#!/bin/bash

# Vehicle Management System Startup Script
# This script will automatically start your Vehicle Management System

# Auto-fix permissions if script is not executable
if [ ! -x "$0" ]; then
    chmod +x "$0"
    echo "Fixed execute permissions for $(basename "$0")"
    exec "$0" "$@"
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_header() {
    echo -e "${CYAN}================================${NC}"
    echo -e "${CYAN}  Vehicle Management System${NC}"
    echo -e "${CYAN}================================${NC}"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is in use
check_port() {
    lsof -i :$1 >/dev/null 2>&1
}

# Function to kill process on port
kill_port() {
    local port=$1
    local pid=$(lsof -ti :$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        print_warning "Port $port is in use. Killing process $pid..."
        kill -9 $pid 2>/dev/null
        sleep 2
    fi
}

# Function to wait for server to start
wait_for_server() {
    local max_attempts=30
    local attempt=1
    
    print_status "Waiting for server to start..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:3000 >/dev/null 2>&1; then
            print_success "Server is running!"
            return 0
        fi
        
        echo -n "."
        sleep 1
        attempt=$((attempt + 1))
    done
    
    print_error "Server failed to start within $max_attempts seconds"
    return 1
}

# Function to open browser
open_browser() {
    if command_exists open; then
        # macOS
        open http://localhost:3000
    elif command_exists xdg-open; then
        # Linux
        xdg-open http://localhost:3000
    elif command_exists start; then
        # Windows (if running in WSL)
        start http://localhost:3000
    else
        print_warning "Could not automatically open browser. Please manually navigate to: http://localhost:3000"
    fi
}

# Function to load MySQL credentials
load_mysql_credentials() {
    # Try to load from mysql_credentials.conf
    if [ -f "../mysql_credentials.conf" ]; then
        source ../mysql_credentials.conf
        return 0
    elif [ -f "mysql_credentials.conf" ]; then
        source mysql_credentials.conf
        return 0
    else
        # Fallback to default credentials
        MYSQL_HOST="localhost"
        MYSQL_USER="root"
        MYSQL_PASSWORD="Marsel3623!"
        MYSQL_DATABASE="Final"
        MYSQL_PORT="3306"
        return 1
    fi
}

# Main startup function
start_vehicle_system() {
    print_header
    
    # Check if we're in the right directory (from installation subfolder)
    if [ ! -f "../package.json" ] && [ ! -f "package.json" ]; then
        print_error "This script must be run from the Vehicle Management System directory"
        print_error "Please navigate to the project folder and try again"
        exit 1
    fi
    
    if [ ! -f "../backend/server.js" ] && [ ! -f "backend/server.js" ]; then
        print_error "This script must be run from the Vehicle Management System directory"
        print_error "Please navigate to the project folder and try again"
        exit 1
    fi
    
    print_status "Starting Vehicle Management System..."
    
    # Check if Node.js is installed
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js first."
        print_error "Visit: https://nodejs.org/"
        exit 1
    fi
    
    print_success "Node.js found: $(node --version)"
    
    # Check if npm is installed
    if ! command_exists npm; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    print_success "npm found: $(npm --version)"
    
    # Load MySQL credentials
    load_mysql_credentials
    
    # Check if MySQL is running and set up database
    if command_exists mysql; then
        print_status "Checking MySQL database setup..."
        
        # Test MySQL connection
        if mysql -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "SELECT 1;" >/dev/null 2>&1; then
            print_success "MySQL server is accessible"
            
            # Check if database exists
            if mysql -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "USE $MYSQL_DATABASE;" >/dev/null 2>&1; then
                print_success "Database 'Final' exists"
                
                # Check if admin user exists
                admin_exists=$(mysql -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" $MYSQL_DATABASE -e "SELECT COUNT(*) FROM Users WHERE username = 'admin';" -s -N 2>/dev/null)
                if [ "$admin_exists" = "1" ]; then
                    print_success "Admin user exists"
                else
                    print_warning "Admin user not found. Creating admin user..."
                    if [ -f "../sql/setup_admin.sql" ]; then
                        mysql -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" $MYSQL_DATABASE < ../sql/setup_admin.sql >/dev/null 2>&1
                    else
                        mysql -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" $MYSQL_DATABASE < sql/setup_admin.sql >/dev/null 2>&1
                    fi
                    if [ $? -eq 0 ]; then
                        print_success "Admin user created successfully"
                    else
                        print_error "Failed to create admin user"
                    fi
                fi
                
                # Check if service types exist
                service_types_count=$(mysql -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" $MYSQL_DATABASE -e "SELECT COUNT(*) FROM ServiceTypes;" -s -N 2>/dev/null)
                if [ "$service_types_count" -gt 0 ]; then
                    print_success "Service types are configured"
                else
                    print_warning "Service types not found. Creating service types..."
                    if [ -f "../sql/populate_service_types.sql" ]; then
                        mysql -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" $MYSQL_DATABASE < ../sql/populate_service_types.sql >/dev/null 2>&1
                    else
                        mysql -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" $MYSQL_DATABASE < sql/populate_service_types.sql >/dev/null 2>&1
                    fi
                    if [ $? -eq 0 ]; then
                        print_success "Service types created successfully"
                    else
                        print_error "Failed to create service types"
                    fi
                fi
                
            else
                print_warning "Database 'Final' does not exist. Creating database and tables..."
                
                # Create database and tables
                mysql -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" < ../sql/createdb.sql >/dev/null 2>&1
                if [ $? -eq 0 ]; then
                    print_success "Database and tables created successfully"
                    
                    # Insert sample data
                    print_status "Inserting sample data..."
                    if [ -f "../SQL_Tests/test_insert.sql" ]; then
                        mysql -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" $MYSQL_DATABASE < ../SQL_Tests/test_insert.sql >/dev/null 2>&1
                    else
                        mysql -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" $MYSQL_DATABASE < SQL_Tests/test_insert.sql >/dev/null 2>&1
                    fi
                    if [ $? -eq 0 ]; then
                        print_success "Sample data inserted successfully"
                    else
                        print_warning "Failed to insert sample data (this is optional)"
                    fi
                    
                    # Set up admin user
                    print_status "Setting up admin user..."
                    mysql -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" $MYSQL_DATABASE < ../sql/setup_admin.sql >/dev/null 2>&1
                    if [ $? -eq 0 ]; then
                        print_success "Admin user created successfully"
                    else
                        print_error "Failed to create admin user"
                    fi
                    
                    # Set up service types
                    print_status "Setting up service types..."
                    mysql -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" $MYSQL_DATABASE < ../sql/populate_service_types.sql >/dev/null 2>&1
                    if [ $? -eq 0 ]; then
                        print_success "Service types created successfully"
                    else
                        print_error "Failed to create service types"
                    fi
                    
                else
                    print_error "Failed to create database and tables"
                    print_error "Please check your MySQL credentials and permissions"
                    exit 1
                fi
            fi
        else
            print_error "Cannot connect to MySQL server"
            print_error "Please make sure MySQL is running and credentials are correct"
            print_error "Try: brew services start mysql (on macOS) or sudo systemctl start mysql (on Linux)"
            exit 1
        fi
    else
        print_error "MySQL client not found"
        print_error "Please install MySQL first:"
        print_error "  macOS: brew install mysql"
        print_error "  Linux: sudo apt-get install mysql-client"
        print_error "  Windows: Download from https://dev.mysql.com/downloads/mysql/"
        exit 1
    fi
    
    # Check if .env file exists
    if [ ! -f "../.env" ]; then
        print_warning ".env file not found. Creating configuration..."
        cat > ../.env << EOF
DB_HOST=$MYSQL_HOST
DB_USER=$MYSQL_USER
DB_PASSWORD=$MYSQL_PASSWORD
DB_NAME=$MYSQL_DATABASE
DB_PORT=$MYSQL_PORT
PORT=3000
EOF
        print_success ".env file created with MySQL credentials"
    else
        print_success ".env file found"
    fi
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "../node_modules" ] && [ ! -d "node_modules" ]; then
        print_status "Installing dependencies..."
        if [ -f "../package.json" ]; then
            cd ..
            npm install
        else
            npm install
        fi
        if [ $? -ne 0 ]; then
            print_error "Failed to install dependencies"
            exit 1
        fi
        print_success "Dependencies installed successfully"
    else
        print_success "Dependencies already installed"
    fi
    
    # Kill any existing process on port 3000
    kill_port 3000
    
    # Start the server
    print_status "Starting server on http://localhost:3000..."
    print_status "Press Ctrl+C to stop the server"
    echo ""
    
    # Start server in background and capture PID
    if [ -f "../package.json" ]; then
        cd ..
        npm start > server.log 2>&1 &
        SERVER_PID=$!
        cd installation
    else
        npm start > server.log 2>&1 &
        SERVER_PID=$!
    fi
    
    # Wait a moment for server to start
    sleep 3
    
    # Check if server started successfully
    if wait_for_server; then
        print_success "Vehicle Management System is now running!"
        echo ""
        print_status "🌐 Access your application at: http://localhost:3000"
        print_status "🔑 Login credentials:"
        print_status "   Username: admin"
        print_status "   Password: admin"
        echo ""
        print_status "📊 Available features:"
        print_status "   • Vehicle Management"
        print_status "   • User Management"
        print_status "   • Service Records"
        print_status "   • Maintenance Scheduling"
        print_status "   • Expense Tracking"
        print_status "   • Fuel Logging"
        print_status "   • Reminder System"
        echo ""
        
        # Ask if user wants to open browser
        read -p "Would you like to open the application in your browser? (y/n): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            open_browser
        fi
        
        # Wait for user to stop the server
        echo ""
        print_status "Server is running. Press Ctrl+C to stop..."
        
        # Wait for the server process
        wait $SERVER_PID
    else
        print_error "Failed to start server. Check server.log for details."
        exit 1
    fi
}

# Function to stop the server
stop_vehicle_system() {
    print_header
    print_status "Stopping Vehicle Management System..."
    
    local pid=$(lsof -ti :3000 2>/dev/null)
    if [ ! -z "$pid" ]; then
        print_status "Killing server process $pid..."
        kill -9 $pid
        print_success "Server stopped successfully"
    else
        print_warning "No server found running on port 3000"
    fi
}

# Function to show status
show_status() {
    print_header
    local pid=$(lsof -ti :3000 2>/dev/null)
    
    if [ ! -z "$pid" ]; then
        print_success "Vehicle Management System is running"
        print_status "Process ID: $pid"
        print_status "URL: http://localhost:3000"
        
        if curl -s http://localhost:3000 >/dev/null 2>&1; then
            print_success "Server is responding"
        else
            print_warning "Server is not responding"
        fi
    else
        print_warning "Vehicle Management System is not running"
    fi
}

# Function to show help
show_help() {
    print_header
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start   - Start the Vehicle Management System (default)"
    echo "  stop    - Stop the running server"
    echo "  status  - Show current server status"
    echo "  help    - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0          # Start the system"
    echo "  $0 start    # Start the system"
    echo "  $0 stop     # Stop the system"
    echo "  $0 status   # Check if system is running"
    echo ""
    echo "The system will automatically:"
    echo "  • Check for required dependencies (Node.js, npm, MySQL)"
    echo "  • Install npm packages if needed"
    echo "  • Create database and tables if they don't exist"
    echo "  • Set up admin user and service types"
    echo "  • Insert sample data for testing"
    echo "  • Start the server on port 3000"
    echo "  • Open the application in your browser"
}

# Main script logic
case "${1:-start}" in
    "start")
        start_vehicle_system
        ;;
    "stop")
        stop_vehicle_system
        ;;
    "status")
        show_status
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac 