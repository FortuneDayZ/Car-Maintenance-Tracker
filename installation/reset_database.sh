#!/bin/bash

# Database Reset Script for Vehicle Management System
# This script will completely reset the database for testing

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
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to load MySQL credentials
load_mysql_credentials() {
    # Try to load from mysql_credentials.conf
    if [ -f "../installation/mysql_credentials.conf" ]; then
        print_status "Loading credentials from ../installation/mysql_credentials.conf"
        source ../installation/mysql_credentials.conf
        return 0
    elif [ -f "installation/mysql_credentials.conf" ]; then
        print_status "Loading credentials from installation/mysql_credentials.conf"
        source installation/mysql_credentials.conf
        return 0
    elif [ -f "../mysql_credentials.conf" ]; then
        print_status "Loading credentials from ../mysql_credentials.conf"
        source ../mysql_credentials.conf
        return 0
    elif [ -f "mysql_credentials.conf" ]; then
        print_status "Loading credentials from mysql_credentials.conf"
        source mysql_credentials.conf
        return 0
    else
        # Fallback to default credentials
        print_warning "No mysql_credentials.conf found, using default credentials"
        print_warning "Please run ./installation/mysql_config.sh to configure your credentials"
        MYSQL_HOST="localhost"
        MYSQL_USER="root"
        MYSQL_PASSWORD=""
        MYSQL_DATABASE="Final"
        MYSQL_PORT="3306"
        return 1
    fi
}

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
    echo -e "${CYAN}  Database Reset Tool${NC}"
    echo -e "${CYAN}================================${NC}"
}

print_header

# Load MySQL credentials
load_mysql_credentials

# Create temporary MySQL config file to avoid password prompts
create_mysql_config() {
    local config_file="/tmp/mysql_config_$$.cnf"
    cat > "$config_file" << EOF
[client]
host=$MYSQL_HOST
user=$MYSQL_USER
password=$MYSQL_PASSWORD
port=$MYSQL_PORT
EOF
    echo "$config_file"
}

# Create MySQL config file
MYSQL_CONFIG_FILE=$(create_mysql_config)

# Check if we're in the right directory (from installation subfolder)
if [ ! -f "../sql/createdb.sql" ] && [ ! -f "sql/createdb.sql" ]; then
    print_error "This script must be run from the Vehicle Management System directory"
    exit 1
fi

print_warning "This will completely reset your database and delete all data!"
print_warning "This action cannot be undone!"
echo ""

read -p "Are you sure you want to reset the database? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    print_status "Database reset cancelled"
    exit 0
fi

print_status "Resetting database..."

# Drop and recreate database
mysql --defaults-file="$MYSQL_CONFIG_FILE" -e "DROP DATABASE IF EXISTS $MYSQL_DATABASE;" 2>/dev/null
if [ $? -eq 0 ]; then
    print_success "Database dropped"
else
    print_error "Failed to drop database"
    exit 1
fi

# Create new database and tables
if [ -f "../sql/createdb.sql" ]; then
    mysql --defaults-file="$MYSQL_CONFIG_FILE" < ../sql/createdb.sql >/dev/null 2>&1
else
    mysql --defaults-file="$MYSQL_CONFIG_FILE" < sql/createdb.sql >/dev/null 2>&1
fi
if [ $? -eq 0 ]; then
    print_success "Database and tables created"
else
    print_error "Failed to create database and tables"
    exit 1
fi

# Insert sample data (ask user)
echo ""
read -p "Do you want to insert sample data? (yes/no): " -r
if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    print_status "Inserting sample data..."
    if [ -f "../SQL_Tests/test_insert.sql" ]; then
        mysql --defaults-file="$MYSQL_CONFIG_FILE" $MYSQL_DATABASE < ../SQL_Tests/test_insert.sql >/dev/null 2>&1
    else
        mysql --defaults-file="$MYSQL_CONFIG_FILE" $MYSQL_DATABASE < SQL_Tests/test_insert.sql >/dev/null 2>&1
    fi
    if [ $? -eq 0 ]; then
        print_success "Sample data inserted"
    else
        print_warning "Failed to insert sample data (this is optional)"
    fi
else
    print_status "Skipping sample data insertion."
fi

# Set up admin user
print_status "Setting up admin user..."
if [ -f "../sql/setup_admin.sql" ]; then
    mysql --defaults-file="$MYSQL_CONFIG_FILE" $MYSQL_DATABASE < ../sql/setup_admin.sql >/dev/null 2>&1
else
    mysql --defaults-file="$MYSQL_CONFIG_FILE" $MYSQL_DATABASE < sql/setup_admin.sql >/dev/null 2>&1
fi
if [ $? -eq 0 ]; then
    print_success "Admin user created"
else
    print_error "Failed to create admin user"
    exit 1
fi

# Set up service types
print_status "Setting up service types..."
if [ -f "../sql/populate_service_types.sql" ]; then
    mysql --defaults-file="$MYSQL_CONFIG_FILE" $MYSQL_DATABASE < ../sql/populate_service_types.sql >/dev/null 2>&1
else
    mysql --defaults-file="$MYSQL_CONFIG_FILE" $MYSQL_DATABASE < sql/populate_service_types.sql >/dev/null 2>&1
fi
if [ $? -eq 0 ]; then
    print_success "Service types created"
else
    print_error "Failed to create service types"
    exit 1
fi

echo ""
print_success "Database reset completed successfully!"
print_status "You can now start your application with: ./installation/start_vehicle_system.sh"
print_status "Login credentials: admin / admin"

# Cleanup temporary files
if [ ! -z "$MYSQL_CONFIG_FILE" ] && [ -f "$MYSQL_CONFIG_FILE" ]; then
    rm -f "$MYSQL_CONFIG_FILE"
fi 