// Database Utility - Handles communication with the backend API
const Database = {
    // Base URL for API calls
    baseURL: window.location.origin,

    // Execute a raw SQL query
    async executeQuery(sql) {
        try {
            console.log('Executing SQL query:', sql);
            
            const response = await fetch(`${this.baseURL}/api/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sql })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Query executed successfully, rows returned:', data.rowCount);
            return data;
        } catch (error) {
            console.error('Database query error:', error);
            // Log error to file and display in frontend
            await LoggingSystem.logDatabaseTestError(error, 'Query Execution', sql);
            throw error;
        }
    },

    // Execute a SELECT query and return results
    async select(sql) {
        const data = await this.executeQuery(sql);
        return data.results;
    },

    // Execute an INSERT query and return the insert ID
    async insert(sql) {
        const response = await this.executeQuery(sql);
        return { insertId: response.insertId, results: response };
    },

    // Execute an UPDATE query and return affected rows
    async update(sql) {
        const results = await this.executeQuery(sql);
        return results.affectedRows || results;
    },

    // Execute a DELETE query and return affected rows
    async delete(sql) {
        const results = await this.executeQuery(sql);
        return results.affectedRows || results;
    },

    // Test database connection
    async testConnection() {
        try {
            const response = await fetch(`${this.baseURL}/api/db-test`);
            const data = await response.json();
            return data.status === 'OK';
        } catch (error) {
            console.error('Database connection test failed:', error);
            return false;
        }
    },

    // Health check
    async healthCheck() {
        try {
            const response = await fetch(`${this.baseURL}/api/health`);
            const data = await response.json();
            return data.status === 'OK';
        } catch (error) {
            console.error('Health check failed:', error);
            return false;
        }
    },

    // Get table data with pagination
    async getTableData(tableName, page = 1, limit = 10, whereClause = '') {
        const offset = (page - 1) * limit;
        const whereSQL = whereClause ? `WHERE ${whereClause}` : '';
        const sql = `SELECT * FROM ${tableName} ${whereSQL} LIMIT ${limit} OFFSET ${offset}`;
        return await this.select(sql);
    },

    // Get count of records in a table
    async getTableCount(tableName, whereClause = '') {
        const whereSQL = whereClause ? `WHERE ${whereClause}` : '';
        const sql = `SELECT COUNT(*) as count FROM ${tableName} ${whereSQL}`;
        const results = await this.select(sql);
        return results[0]?.count || 0;
    },

    // Insert a record into a table
    async insertRecord(tableName, data) {
        const columns = Object.keys(data).join(', ');
        const values = Object.values(data).map(value => {
            if (value === null || value === undefined) {
                return 'NULL';
            } else if (typeof value === 'string') {
                return `'${value.replace(/'/g, "''")}'`; // Escape single quotes
            } else {
                return value;
            }
        }).join(', ');
        
        const sql = `INSERT INTO ${tableName} (${columns}) VALUES (${values})`;
        const result = await this.insert(sql);
        return result;
    },

    // Update a record in a table
    async updateRecord(tableName, data, whereClause) {
        const setClause = Object.entries(data).map(([key, value]) => {
            if (value === null || value === undefined) {
                return `${key} = NULL`;
            } else if (typeof value === 'string') {
                return `${key} = '${value.replace(/'/g, "''")}'`; // Escape single quotes
            } else {
                return `${key} = ${value}`;
            }
        }).join(', ');
        
        const sql = `UPDATE ${tableName} SET ${setClause} WHERE ${whereClause}`;
        return await this.update(sql);
    },

    // Delete records from a table
    async deleteRecords(tableName, whereClause) {
        const sql = `DELETE FROM ${tableName} WHERE ${whereClause}`;
        return await this.delete(sql);
    }
};

// Make Database available globally
window.Database = Database; 