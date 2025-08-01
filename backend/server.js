const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

// Database connection
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'Final',
    port: process.env.DB_PORT || 3306
});

// Test database connection
db.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to MySQL database successfully!');
});

// Raw SQL query endpoint
app.post('/api/query', (req, res) => {
    const { sql } = req.body;
    
    if (!sql) {
        return res.status(400).json({ error: 'SQL query is required' });
    }
    
    console.log('Executing SQL:', sql);
    
    db.query(sql, (err, results, fields) => {
        if (err) {
            console.error('SQL Error:', err);
            res.status(500).json({ 
                error: err.message,
                sqlState: err.sqlState,
                errno: err.errno
            });
        } else {
            console.log('Query executed successfully, rows returned:', results.length);
            
            // Check if this is an INSERT operation and include insertId
            const response = { 
                results: results,
                rowCount: results.length,
                success: true
            };
            
            // If it's an INSERT operation, include the insertId
            if (sql.trim().toUpperCase().startsWith('INSERT')) {
                response.insertId = results.insertId;
            }
            
            res.json(response);
        }
    });
});

// GET endpoint for simple queries (useful for testing)
app.get('/api/query', (req, res) => {
    const { sql } = req.query;
    
    if (!sql) {
        return res.status(400).json({ error: 'SQL query parameter is required' });
    }
    
    console.log('Executing GET SQL:', sql);
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error('SQL Error:', err);
            res.status(500).json({ 
                error: err.message,
                sqlState: err.sqlState,
                errno: err.errno
            });
        } else {
            console.log('Query executed successfully, rows returned:', results.length);
            res.json({ 
                results: results,
                rowCount: results.length,
                success: true
            });
        }
    });
});

// Insert sample data endpoint
app.post("/api/insert-sample-data", (req, res) => {
    const fs = require("fs");
    const path = require("path");
    
    try {
        // Read the test_insert.sql file
        const sqlFilePath = path.join(__dirname, "test_insert.sql");
        const sqlContent = fs.readFileSync(sqlFilePath, "utf8");
        
        // Split into individual statements
        const statements = sqlContent.split(";").filter(stmt => stmt.trim());
        
        let successCount = 0;
        let errorCount = 0;
        const errors = [];
        
        // Execute each statement
        statements.forEach((statement, index) => {
            const trimmedStatement = statement.trim();
            if (trimmedStatement && !trimmedStatement.startsWith("--")) {
                db.query(trimmedStatement, (err, results) => {
                    if (err) {
                        errorCount++;
                        errors.push(`Statement ${index + 1}: ${err.message}`);
                        console.error(`Error executing statement ${index + 1}:`, err);
                    } else {
                        successCount++;
                        console.log(`Successfully executed statement ${index + 1}`);
                    }
                    
                    // If this is the last statement, send the response
                    if (successCount + errorCount === statements.filter(stmt => stmt.trim() && !stmt.trim().startsWith("--")).length) {
                        if (errorCount === 0) {
                            res.json({
                                success: true,
                                message: `Successfully inserted sample data. ${successCount} statements executed.`,
                                statementsExecuted: successCount
                            });
                        } else {
                            res.status(500).json({
                                success: false,
                                message: `Some statements failed. ${successCount} succeeded, ${errorCount} failed.`,
                                statementsExecuted: successCount,
                                errors: errors
                            });
                        }
                    }
                });
            } else {
                // Skip comments and empty statements
                if (successCount + errorCount === statements.filter(stmt => stmt.trim() && !stmt.trim().startsWith("--")).length) {
                    res.json({
                        success: true,
                        message: `Successfully inserted sample data. ${successCount} statements executed.`,
                        statementsExecuted: successCount
                    });
                }
            }
        });
        
    } catch (error) {
        console.error("Error reading or processing SQL file:", error);
        res.status(500).json({
            success: false,
            message: "Failed to read or process SQL file",
            error: error.message
        });
    }
});// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Vehicle Management Backend is running',
        timestamp: new Date().toISOString()
    });
});

// Database connection test endpoint
app.get('/api/db-test', (req, res) => {
    db.query('SELECT 1 as test', (err, results) => {
        if (err) {
            res.status(500).json({ 
                status: 'ERROR', 
                message: 'Database connection failed',
                error: err.message 
            });
        } else {
            res.json({ 
                status: 'OK', 
                message: 'Database connection successful',
                results: results
            });
        }
    });
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: err.message 
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
    console.log(`🚀 Vehicle Management Backend running on http://localhost:${PORT}`);
    console.log(`📊 API endpoints:`);
    console.log(`   POST /api/query - Execute raw SQL queries`);
    console.log(`   GET  /api/query - Execute raw SQL queries (for testing)`);
    console.log(`   GET  /api/health - Health check`);
    console.log(`   GET  /api/db-test - Database connection test`);
    console.log(`🌐 Frontend available at http://localhost:${PORT}`);
}); 