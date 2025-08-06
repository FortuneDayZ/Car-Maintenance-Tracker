// The Test Manager is a powerful tool that allows administrators to interact directly with the database
// It provides a safe environment for running SQL queries and testing database connectivity
const testManager = {
    container: null,

    // This function performs a security check by querying the database directly to verify admin status
    // It ensures that only users with actual admin privileges in the database can access sensitive operations
    verifyAdminStatus: async () => {
        // Wait a moment for authentication to be fully established
        if (!AuthManager.isAuthenticated || !AuthManager.currentUser) {
            // If not authenticated, wait a bit and check again (in case session is still loading)
            await new Promise(resolve => setTimeout(resolve, 200));
            if (!AuthManager.isAuthenticated || !AuthManager.currentUser) {
                return { isAdmin: false, error: 'Not authenticated' };
            }
        }

        try {
            const adminCheck = await Database.select(`SELECT is_admin FROM Users WHERE user_id = ${AuthManager.currentUser.user_id} AND username = '${AuthManager.currentUser.username}'`);
            
            if (adminCheck.length === 0) {
                return { isAdmin: false, error: 'User not found in database' };
            }
            
            return { isAdmin: adminCheck[0].is_admin === 1, error: null };
        } catch (error) {
            console.error('Error checking admin status:', error);
            // Log admin status check errors
            await LoggingSystem.logDatabaseTestError(error, 'Admin Status Check', `SELECT is_admin FROM Users WHERE user_id = ${AuthManager.currentUser.user_id}`);
            return { isAdmin: false, error: error.message };
        }
    },

    init: () => {
        testManager.container = document.getElementById('test-table-container');
        // The init function waits for authentication to be fully established before rendering
        // This prevents race conditions where the render function runs before the session is ready
        setTimeout(() => {
            testManager.render();
        }, 100);
    },

    // This function can be called to manually refresh the test section
    // Useful when switching to the test section after login
    refresh: () => {
        if (testManager.container) {
            testManager.render();
        }
    },

    render: async () => {
        // The render function first validates the user's admin privileges before displaying the interface
        // This prevents unauthorized access to sensitive database operations
        const adminStatus = await testManager.verifyAdminStatus();
        
        if (!adminStatus.isAdmin) {
            let errorMessage = 'This section is only available to administrators.';
            
            if (adminStatus.error === 'Not authenticated') {
                errorMessage = 'Please log in to access this section.';
                // If not authenticated, try again after a short delay (in case session is still loading)
                setTimeout(() => {
                    if (AuthManager.isAuthenticated && AuthManager.currentUser) {
                        testManager.render();
                    }
                }, 500);
            } else if (adminStatus.error === 'User not found in database') {
                errorMessage = 'User not found in database. Please log in again.';
            } else if (adminStatus.error) {
                errorMessage = `Database error: ${adminStatus.error}`;
            }
            
            testManager.container.innerHTML = `
                <div class="alert alert-danger">
                    <h4><i class="fas fa-exclamation-triangle"></i> Access Denied</h4>
                    <p>${errorMessage}</p>
                    ${AuthManager.currentUser ? `<p>Current user: ${AuthManager.currentUser.username} (ID: ${AuthManager.currentUser.user_id})</p>` : ''}
                </div>
            `;
            return;
        }

        try {
            // The system attempts to establish a connection with the database to ensure it's operational
            // This step is crucial for all subsequent database operations
            const isConnected = await Database.testConnection();
            
            if (!isConnected) {
                testManager.container.innerHTML = `
                    <div class="alert alert-danger">
                        <h4><i class="fas fa-exclamation-triangle"></i> Database Connection Failed</h4>
                        <p>Unable to connect to the database. Please check:</p>
                        <ul>
                            <li>MySQL server is running</li>
                            <li>Database credentials are correct</li>
                            <li>Database 'Final' exists</li>
                            <li>Backend server is running on port 3000</li>
                        </ul>
                        <button class="btn btn-primary" onclick="testManager.testConnection()">
                            <i class="fas fa-sync"></i> Test Connection
                        </button>
                    </div>
                `;
                return;
            }

            // Get total count of users
            const totalUsers = await Database.select('SELECT COUNT(*) as total FROM Users');
            const totalCount = totalUsers[0].total;
            
            // Get all users from database (limited to 10 for display)
            const users = await Database.select('SELECT * FROM Users LIMIT 10');
            
            const table = `
                <div class="alert alert-success">
                    <h4><i class="fas fa-check-circle"></i> Database Connected Successfully!</h4>
                    <p>Found ${totalCount} users in the database (showing first 10).</p>
                </div>
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Username</th>
                                <th>Email</th>
                                <th>Birthday</th>
                                <th>Registration Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${users.map(user => `
                                <tr>
                                    <td>${user.user_id}</td>
                                    <td>${user.username}</td>
                                    <td>${user.email}</td>
                                    <td>${Utils.formatDate(user.birthday)}</td>
                                    <td>${Utils.formatDate(user.registration_date)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <div class="mt-3">
                    <button class="btn btn-primary" onclick="testManager.runCustomQuery()">
                        <i class="fas fa-database"></i> Run Custom Query
                    </button>
                    <button class="btn btn-danger" onclick="testManager.showClearDataConfirmation()">
                        <i class="fas fa-eraser"></i> Clear All Data
                    </button>
                    <button class="btn btn-success" onclick="testManager.showInsertDataConfirmation()">
                        <i class="fas fa-upload"></i> Upload & Run SQL Test File
                    </button>
                    <button class="btn btn-warning" onclick="testManager.restoreAdmin()">
                        <i class="fas fa-user-shield"></i> Restore Admin
                    </button>
                    <button class="btn btn-info" onclick="testManager.debugAdminStatus()">
                        <i class="fas fa-bug"></i> Debug Admin Status
                    </button>
                    <button class="btn btn-secondary" onclick="testManager.explainSQLErrors()">
                        <i class="fas fa-question-circle"></i> Explain SQL Errors
                    </button>
                    <button class="btn btn-dark" onclick="LoggingSystem.showLogs()">
                        <i class="fas fa-file-alt"></i> View Error Logs
                    </button>
                    <button class="btn btn-outline-secondary" onclick="testManager.testLoggingSystem()">
                        <i class="fas fa-vial"></i> Test Logging
                    </button>
                </div>
            `;
            
            testManager.container.innerHTML = table;
        } catch (error) {
            // Log render errors
            await LoggingSystem.logDatabaseTestError(error, 'Test Manager Render', 'Database connection and data loading');
            testManager.container.innerHTML = `
                <div class="alert alert-danger">
                    <h4><i class="fas fa-exclamation-triangle"></i> Error Loading Data</h4>
                    <p>${error.message}</p>
                </div>
            `;
        }
    },

    testConnection: async () => {
        // Verify admin status from database
        const adminStatus = await testManager.verifyAdminStatus();
        
        if (!adminStatus.isAdmin) {
            Utils.showAlert('Access denied. Admin privileges required.', 'danger');
            return;
        }

        try {
            const isConnected = await Database.testConnection();
            if (isConnected) {
                Utils.showAlert('Database connection successful!', 'success');
                testManager.render();
            } else {
                Utils.showAlert('Database connection failed!', 'danger');
            }
        } catch (error) {
            // Log connection test errors
            await LoggingSystem.logDatabaseTestError(error, 'Connection Test', 'Database connection test');
            Utils.showAlert(`Connection test failed: ${error.message}`, 'danger');
        }
    },

    runCustomQuery: async () => {
        // Verify admin status from database
        const adminStatus = await testManager.verifyAdminStatus();
        
        if (!adminStatus.isAdmin) {
            Utils.showAlert('Access denied. Admin privileges required.', 'danger');
            return;
        }

        const query = prompt('Enter your SQL query:');
        if (!query) return;

        try {
            const results = await Database.executeQuery(query);
            alert(`Query executed successfully!\nRows returned: ${results.length}\n\nResults:\n${JSON.stringify(results, null, 2)}`);
        } catch (error) {
            // Log custom query errors
            await LoggingSystem.logDatabaseTestError(error, 'Custom Query', query);
            alert(`Query failed: ${error.message}`);
        }
    },


    showInsertDataConfirmation: async () => {
        // Verify admin status from database
        const adminStatus = await testManager.verifyAdminStatus();
        
        if (!adminStatus.isAdmin) {
            Utils.showAlert('Access denied. Admin privileges required.', 'danger');
            return;
        }

        const modalBody = `
            <div class="alert alert-info">
                <h5><i class="fas fa-upload"></i> Upload & Run SQL Test File</h5>
                <p><strong>Upload and execute a SQL file from your computer:</strong></p>
                <div class="mb-3">
                    <label for="sqlFileInput" class="form-label">Select SQL File:</label>
                    <input type="file" class="form-control" id="sqlFileInput" accept=".sql" onchange="testManager.handleFileSelect(event)">
                </div>
                <div id="filePreview" class="mb-3" style="display: none;">
                    <label class="form-label">File Preview (first 500 characters):</label>
                    <pre id="sqlPreview" class="bg-light p-2 border rounded" style="max-height: 200px; overflow-y: auto; font-size: 12px;"></pre>
                </div>
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    <strong>Warning:</strong> This will execute all SQL statements in the file. Make sure you trust the source and have backed up your data.
                </div>
                <hr>
                <div class="d-flex gap-2">
                    <button class="btn btn-success" onclick="testManager.executeUploadedSQL()" id="executeBtn" disabled>
                        <i class="fas fa-play"></i> Execute SQL
                    </button>
                    <button class="btn btn-secondary" onclick="testManager.insertSampleData()">
                        <i class="fas fa-plus-circle"></i> Insert Sample Data
                    </button>
                </div>
            </div>
        `;

        Utils.showModal("Upload & Run SQL Test File", modalBody, null, "Close", "Cancel");
    },

    handleFileSelect: (event) => {
        const file = event.target.files[0];
        if (!file) {
            document.getElementById('filePreview').style.display = 'none';
            document.getElementById('executeBtn').disabled = true;
            return;
        }

        // Store the file for later execution
        testManager.selectedFile = file;

        // Show file preview with statement count
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            const statements = testManager.parseSQLStatements(content);
            const preview = content.substring(0, 500);
            
            let previewText = `File: ${file.name}\n`;
            previewText += `Size: ${(file.size / 1024).toFixed(2)} KB\n`;
            previewText += `Statements detected: ${statements.length}\n\n`;
            previewText += `Preview (first 500 characters):\n`;
            previewText += preview + (content.length > 500 ? '...' : '');
            
            document.getElementById('sqlPreview').textContent = previewText;
            document.getElementById('filePreview').style.display = 'block';
            document.getElementById('executeBtn').disabled = false;
        };
        reader.readAsText(file);
    },

    executeUploadedSQL: async () => {
        if (!testManager.selectedFile) {
            Utils.showAlert('No file selected!', 'warning');
            return;
        }

        const confirmMessage = `Are you sure you want to execute the SQL file "${testManager.selectedFile.name}"?\n\nThis will run all SQL statements in the file with error recovery.`;
        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            const content = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = reject;
                reader.readAsText(testManager.selectedFile);
            });

            // Improved SQL statement parsing with error recovery
            const statements = testManager.parseSQLStatements(content);
            console.log(`Parsed ${statements.length} SQL statements:`, statements);
            
            let executedCount = 0;
            let errorCount = 0;
            let skippedCount = 0;
            const errors = [];
            const skipped = [];

            // Show progress modal
            const progressModal = `
                <div class="modal fade" id="progressModal" tabindex="-1">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Executing SQL File...</h5>
                            </div>
                            <div class="modal-body">
                                <div class="progress mb-3">
                                    <div class="progress-bar" role="progressbar" style="width: 0%"></div>
                                </div>
                                <p id="progressText">Processing statements...</p>
                                <div id="progressDetails" class="small text-muted"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Add progress modal to page
            document.body.insertAdjacentHTML('beforeend', progressModal);
            const progressModalElement = document.getElementById('progressModal');
            const progressBar = progressModalElement.querySelector('.progress-bar');
            const progressText = progressModalElement.querySelector('#progressText');
            const progressDetails = progressModalElement.querySelector('#progressDetails');
            
            const progressModalInstance = new bootstrap.Modal(progressModalElement);
            progressModalInstance.show();

            for (let i = 0; i < statements.length; i++) {
                const statement = statements[i];
                const progress = Math.round(((i + 1) / statements.length) * 100);
                
                // Update progress
                progressBar.style.width = `${progress}%`;
                progressBar.textContent = `${progress}%`;
                progressText.textContent = `Processing statement ${i + 1} of ${statements.length}`;
                progressDetails.textContent = `Executed: ${executedCount}, Errors: ${errorCount}, Skipped: ${skippedCount}`;
                
                console.log(`Executing statement ${i + 1}:`, statement);
                
                try {
                    await Database.executeQuery(statement);
                    executedCount++;
                    console.log(`Statement ${i + 1} executed successfully`);
                } catch (error) {
                    const errorMsg = error.message.toLowerCase();
                    
                    // Handle common errors gracefully
                    if (errorMsg.includes('duplicate entry') || errorMsg.includes('duplicate key')) {
                        skippedCount++;
                        skipped.push(`Statement ${i + 1}: Duplicate entry (skipped)`);
                        console.log(`Skipping duplicate entry in statement ${i + 1}`);
                    } else if (errorMsg.includes('foreign key constraint') || errorMsg.includes('cannot add or update')) {
                        skippedCount++;
                        skipped.push(`Statement ${i + 1}: Foreign key constraint (skipped)`);
                        console.log(`Skipping foreign key constraint error in statement ${i + 1}`);
                    } else if (errorMsg.includes('table') && errorMsg.includes('doesn\'t exist')) {
                        skippedCount++;
                        skipped.push(`Statement ${i + 1}: Table doesn't exist (skipped)`);
                        console.log(`Skipping non-existent table in statement ${i + 1}`);
                    } else {
                        errorCount++;
                        const errorMsg = `Statement ${i + 1}: ${error.message}`;
                        errors.push(errorMsg);
                        console.error(errorMsg);
                        
                        // Log error to file using the new logging system
                        await LoggingSystem.logSQLExecutionError(error, statement, i);
                    }
                }
                
                // Small delay to prevent overwhelming the database
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            // Hide progress modal
            progressModalInstance.hide();
            progressModalElement.remove();

            // Show comprehensive results
            let resultMessage = `SQL execution completed!\n\n`;
            resultMessage += `✅ Successfully executed: ${executedCount} statements\n`;
            resultMessage += `⚠️  Skipped (duplicates/constraints): ${skippedCount} statements\n`;
            resultMessage += `❌ Failed: ${errorCount} statements\n\n`;
            
            if (executedCount > 0) {
                resultMessage += `The database has been populated with sample data.`;
            }
            
            if (errorCount > 0) {
                resultMessage += `\n\nSome statements failed due to database constraints or existing data.`;
                resultMessage += `\n\nFirst 5 errors:\n${errors.slice(0, 5).join('\n')}`;
                if (errors.length > 5) {
                    resultMessage += `\n... and ${errors.length - 5} more errors`;
                }
            }

            // Also log detailed errors to console for debugging
            if (errors.length > 0) {
                console.log('=== DETAILED SQL EXECUTION ERRORS ===');
                errors.forEach((error, index) => {
                    console.log(`Error ${index + 1}:`, error);
                });
                console.log('=== END ERRORS ===');
            }

            Utils.showAlert(resultMessage, errorCount === 0 ? 'success' : 'warning');

            // Close the modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('formModal'));
            if (modal) {
                modal.hide();
            }

            // Refresh the entire page after SQL execution
            setTimeout(() => {
                window.location.reload();
            }, 2000);

        } catch (error) {
            // Log the main error to file
            await LoggingSystem.logDatabaseTestError(error, 'SQL File Execution', 'File upload and execution');
            Utils.showAlert(`Error executing SQL file: ${error.message}`, 'danger');
        }
    },

    parseSQLStatements: (content) => {
        // Remove comments (both single-line and multi-line)
        let cleanedContent = content
            .replace(/--.*$/gm, '') // Remove single-line comments
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
            .trim();

        // Remove USE statements as they're not needed and can cause issues
        cleanedContent = cleanedContent.replace(/USE\s+`?[^`;]+`?\s*;?/gi, '');

        // Fix password hash format to match your system
        cleanedContent = cleanedContent.replace(
            /\$2a\$12\$[A-Za-z0-9\/\.]{53}/g, 
            'YWRtaW4=' // This is the hash for 'admin' in your system
        );

        // Split by semicolon and filter out empty statements
        const statements = cleanedContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.toLowerCase().startsWith('use'));

        console.log('Original content length:', content.length);
        console.log('Cleaned content length:', cleanedContent.length);
        console.log('Number of statements found:', statements.length);
        
        return statements;
    },

    insertSampleData: async () => {
        try {
            // Create a simplified, working version of test data
            const sampleData = [
                // Insert some basic users with correct password format
                "INSERT IGNORE INTO Users (username, password_hash, email, birthday, registration_date) VALUES ('testuser1', 'YWRtaW4=', 'test1@example.com', '1990-01-01', '2023-01-01')",
                "INSERT IGNORE INTO Users (username, password_hash, email, birthday, registration_date) VALUES ('testuser2', 'YWRtaW4=', 'test2@example.com', '1991-02-02', '2023-01-02')",
                "INSERT IGNORE INTO Users (username, password_hash, email, birthday, registration_date) VALUES ('testuser3', 'YWRtaW4=', 'test3@example.com', '1992-03-03', '2023-01-03')",
                
                // Insert some vehicles (correct structure: vin, year, make, model)
                "INSERT IGNORE INTO Vehicles (vin, year, make, model) VALUES ('TEST001', 2020, 'Toyota', 'Camry')",
                "INSERT IGNORE INTO Vehicles (vin, year, make, model) VALUES ('TEST002', 2019, 'Honda', 'Civic')",
                "INSERT IGNORE INTO Vehicles (vin, year, make, model) VALUES ('TEST003', 2021, 'Ford', 'Focus')",
                
                // Insert ownership relationships
                "INSERT IGNORE INTO Owns (user_id, vin, start_date) VALUES (1, 'TEST001', '2023-01-01')",
                "INSERT IGNORE INTO Owns (user_id, vin, start_date) VALUES (2, 'TEST002', '2023-01-02')",
                "INSERT IGNORE INTO Owns (user_id, vin, start_date) VALUES (3, 'TEST003', '2023-01-03')",
                
                // Insert some service records (correct structure: vin, service_date, current_mileage, cost, description)
                "INSERT IGNORE INTO ServiceRecords (vin, service_date, current_mileage, cost, description) VALUES ('TEST001', '2023-06-01', 15000, 50.00, 'Oil Change')",
                "INSERT IGNORE INTO ServiceRecords (vin, service_date, current_mileage, cost, description) VALUES ('TEST002', '2023-06-15', 25000, 200.00, 'Brake Service')",
                "INSERT IGNORE INTO ServiceRecords (vin, service_date, current_mileage, cost, description) VALUES ('TEST003', '2023-07-01', 10000, 30.00, 'Tire Rotation')"
            ];
            
            let successCount = 0;
            let errorCount = 0;
            
            for (const statement of sampleData) {
                try {
                    await Database.executeQuery(statement);
                    successCount++;
                } catch (error) {
                    console.log(`Skipping statement due to: ${error.message}`);
                    errorCount++;
                }
            }
            
            console.log(`Sample data inserted: ${successCount} successful, ${errorCount} skipped`);
            Utils.showAlert(`Sample data inserted successfully! ${successCount} records added, ${errorCount} skipped.`, "success");
            testManager.render();
        } catch (error) {
            console.error("Error inserting sample data:", error);
            // Log sample data insertion errors
            await LoggingSystem.logDatabaseTestError(error, 'Sample Data Insertion', 'Bulk sample data insertion');
            Utils.showAlert(`Error inserting sample data: ${error.message}`, "danger");
        }
    },    showClearDataConfirmation: async () => {
        // Verify admin status from database
        const adminStatus = await testManager.verifyAdminStatus();
        
        if (!adminStatus.isAdmin) {
            Utils.showAlert('Access denied. Admin privileges required.', 'danger');
            return;
        }

        const modalBody = `
            <div class="alert alert-warning">
                <h5><i class="fas fa-eraser"></i> Clear All Data</h5>
                <p><strong>You are about to clear all user data from the database.</strong></p>
                <p>This operation will remove all data while preserving important system components:</p>
                <ul>
                    <li>All regular user accounts (admin accounts will be preserved)</li>
                    <li>All vehicle information and ownership records</li>
                    <li>All service records and maintenance history</li>
                    <li>All upcoming services and reminders</li>
                    <li>All expenses and fuel logs</li>
                    <li>All parts and mechanics data</li>
                    <li>All shop information</li>
                </ul>
                <p><strong>✅ Safe: Database table structure will be preserved</strong></p>
                <p><strong>✅ Safe: Admin accounts and login credentials will be preserved</strong></p>
                <p><strong>✅ Safe: Service types will be re-initialized</strong></p>
                <hr>
                <p>To confirm, type <code>CLEAR DATA</code> in the field below:</p>
                <input type="text" class="form-control" id="clearConfirmation" placeholder="Type: CLEAR DATA">
            </div>
        `;

        Utils.showModal('Clear All Data - Confirmation Required', modalBody, async () => {
            const confirmation = document.getElementById('clearConfirmation').value;
            
            if (confirmation !== 'CLEAR DATA') {
                Utils.showAlert('Confirmation text does not match. Action cancelled.', 'warning');
                return;
            }

            try {
                await testManager.clearAllData();
                Utils.showAlert('All user data cleared successfully! Admin accounts have been preserved.', 'success');
                // Refresh the entire page after clearing data
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } catch (error) {
                Utils.showAlert(`Error clearing data: ${error.message}`, 'danger');
            }
        }, 'Clear Data', 'Cancel');
    },

    clearAllData: async () => {
        try {
            // The clearAllData function safely removes all user data while preserving admin accounts
            // This ensures that administrators can always access the system after a data reset
            
            // Disable safe update mode to allow bulk deletions
            await Database.executeQuery('SET SQL_SAFE_UPDATES = 0');

            // First, preserve admin users by backing them up
            const adminUsers = await Database.select('SELECT * FROM Users WHERE is_admin = 1');
            console.log(`Preserving ${adminUsers.length} admin user(s) during data clear`);

            // Clear junction tables first (they reference other tables)
            await Database.executeQuery('DELETE FROM `Reminder`');
            await Database.executeQuery('DELETE FROM `UpcomingServices_ServiceTypes`');
            await Database.executeQuery('DELETE FROM `ServiceRecords_Parts`');
            await Database.executeQuery('DELETE FROM `ServiceRecords_ServiceTypes`');
            await Database.executeQuery('DELETE FROM `WorkedOn`');

            // Clear dependent tables (tables that reference other tables)
            await Database.executeQuery('DELETE FROM `UpcomingServices`');
            await Database.executeQuery('DELETE FROM `Expenses`');
            await Database.executeQuery('DELETE FROM `Parts`');
            await Database.executeQuery('DELETE FROM `ServiceRecords`');
            await Database.executeQuery('DELETE FROM `Mechanics`');
            await Database.executeQuery('DELETE FROM `Owns`');

            // Clear independent tables (tables that don't reference other tables)
            await Database.executeQuery('DELETE FROM `ServiceTypes`');
            await Database.executeQuery('DELETE FROM `CarShops`');
            await Database.executeQuery('DELETE FROM `Vehicles`');
            
            // Clear all non-admin users only
            await Database.executeQuery('DELETE FROM `Users` WHERE is_admin = 0');

            // Re-enable safe update mode
            await Database.executeQuery('SET SQL_SAFE_UPDATES = 1');

            // Reset auto-increment counters for all tables
            await Database.executeQuery('ALTER TABLE `Users` AUTO_INCREMENT = 1');
            await Database.executeQuery('ALTER TABLE `CarShops` AUTO_INCREMENT = 1');
            await Database.executeQuery('ALTER TABLE `Mechanics` AUTO_INCREMENT = 1');
            await Database.executeQuery('ALTER TABLE `ServiceRecords` AUTO_INCREMENT = 1');
            await Database.executeQuery('ALTER TABLE `Parts` AUTO_INCREMENT = 1');
            await Database.executeQuery('ALTER TABLE `Expenses` AUTO_INCREMENT = 1');
            await Database.executeQuery('ALTER TABLE `UpcomingServices` AUTO_INCREMENT = 1');
            await Database.executeQuery('ALTER TABLE `Reminder` AUTO_INCREMENT = 1');
            
            // Re-insert service types (admin users are already preserved)
            await testManager.insertServiceTypes();
            
            console.log('All user data cleared successfully - admin accounts preserved');
            
            // Logout current user and show login modal since data was cleared
            if (window.AuthManager) {
                AuthManager.clearSession();
                AuthManager.showLoginModal();
                Utils.showAlert('All data cleared. You have been logged out.', 'info');
            }
        } catch (error) {
            console.error('Error clearing data:', error);
            // Log data clearing errors
            await LoggingSystem.logDatabaseTestError(error, 'Data Clearing', 'Bulk data deletion operation');
            throw new Error(`Failed to clear data: ${error.message}`);
        }
    },

    insertAdminUser: async () => {
        try {
            // Insert admin user if it doesn't exist
            const adminExists = await Database.select("SELECT COUNT(*) as count FROM Users WHERE is_admin = 1");
            if (adminExists[0].count === 0) {
                await Database.executeQuery(`
                    INSERT INTO Users (username, password_hash, email, birthday, registration_date, is_admin) 
                    VALUES ('admin', '${Utils.hashPassword('admin')}', 'admin@example.com', '1990-01-01', CURDATE(), 1)
                `);
                console.log('Admin user created');
            }
        } catch (error) {
            console.error('Error creating admin user:', error);
        }
    },

    insertServiceTypes: async () => {
        try {
            // Insert predefined service types
            const serviceTypes = [
                'Oil Change', 'Tire Rotation', 'Brake Service', 'Air Filter Replacement',
                'Battery Replacement', 'Transmission Service', 'Engine Tune-up', 'Coolant Flush'
            ];

            for (const serviceType of serviceTypes) {
                await Database.executeQuery(`
                    INSERT IGNORE INTO ServiceTypes (service_type) VALUES ('${serviceType}')
                `);
            }
            console.log('Service types inserted');
        } catch (error) {
            console.error('Error inserting service types:', error);
        }
    },

    restoreAdmin: async () => {
        // Verify admin status from database
        const adminStatus = await testManager.verifyAdminStatus();
        
        if (!adminStatus.isAdmin) {
            Utils.showAlert('Access denied. Admin privileges required.', 'danger');
            return;
        }

        try {
            // Check if admin user exists
            const existingAdmin = await Database.select('SELECT user_id FROM Users WHERE is_admin = 1');
            if (existingAdmin.length > 0) {
                Utils.showAlert('Admin user already exists. No action taken.', 'info');
                return;
            }

            // Insert new admin user
            await Database.executeQuery(`
                INSERT INTO Users (username, password_hash, email, birthday, registration_date, is_admin)
                VALUES ('admin', '${Utils.hashPassword('admin')}', 'admin@example.com', '2000-01-01', NOW(), 1)
            `);
            Utils.showAlert('Admin user restored successfully!', 'success');
            // Refresh the entire page after restoring admin
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (error) {
            // Log admin restoration errors
            await LoggingSystem.logDatabaseTestError(error, 'Admin Restoration', 'Admin user creation/restoration');
            Utils.showAlert(`Error restoring admin user: ${error.message}`, 'danger');
        }
    },

    // Debug function to check current user's admin status
    debugAdminStatus: async () => {
        console.log('=== Admin Status Debug ===');
        console.log('AuthManager.isAuthenticated:', AuthManager.isAuthenticated);
        console.log('AuthManager.currentUser:', AuthManager.currentUser);
        
        if (AuthManager.currentUser) {
            try {
                const adminCheck = await Database.select(`SELECT user_id, username, is_admin FROM Users WHERE user_id = ${AuthManager.currentUser.user_id}`);
                console.log('Database admin check:', adminCheck);
                
                if (adminCheck.length > 0) {
                    const user = adminCheck[0];
                    console.log('User found in database:', user);
                    console.log('is_admin value:', user.is_admin);
                    console.log('is_admin === 1:', user.is_admin === 1);
                    console.log('Current role in session:', AuthManager.currentUser.role);
                } else {
                    console.log('User not found in database');
                }
            } catch (error) {
                console.error('Error checking admin status:', error);
                // Log debug admin status errors
                await LoggingSystem.logDatabaseTestError(error, 'Debug Admin Status', 'Admin status debugging query');
            }
        }
        console.log('=== End Debug ===');
    },

    // Function to explain common SQL errors
    explainSQLErrors: () => {
        const errorExplanations = {
            'duplicate entry': 'This means the data already exists in the database. This is normal and safe to ignore.',
            'foreign key constraint': 'This means the data references something that doesn\'t exist yet. The system will skip this safely.',
            'table doesn\'t exist': 'This means the table structure is different than expected. The system will skip this safely.',
            'syntax error': 'This means there\'s a problem with the SQL syntax. Check the SQL file format.',
            'access denied': 'This means the database user doesn\'t have permission for this operation.',
            'connection': 'This means the database connection failed. Check if MySQL is running.',
            'timeout': 'This means the database operation took too long. Try again.',
            'unknown column': 'This means the table structure is different than expected.',
            'data too long': 'This means the data is too large for the column. Check data sizes.',
            'invalid date': 'This means the date format is incorrect.'
        };

        console.log('=== COMMON SQL ERROR EXPLANATIONS ===');
        Object.entries(errorExplanations).forEach(([keyword, explanation]) => {
            console.log(`${keyword.toUpperCase()}: ${explanation}`);
        });
        console.log('=== END EXPLANATIONS ===');

        let explanationText = 'Common SQL Error Explanations:\n\n';
        Object.entries(errorExplanations).forEach(([keyword, explanation]) => {
            explanationText += `${keyword.toUpperCase()}: ${explanation}\n\n`;
        });

        Utils.showAlert(explanationText, 'info');
    },

    // Test function to verify logging system is working
    testLoggingSystem: async () => {
        try {
            // Test basic error logging
            const testError = new Error('This is a test error for the logging system');
            await LoggingSystem.logError(testError, 'Logging System Test', false);
            
            // Test database test error logging
            const dbTestError = new Error('Test database connection error');
            await LoggingSystem.logDatabaseTestError(dbTestError, 'Test Database Connection', 'SELECT 1');
            
            // Test SQL execution error logging
            const sqlError = new Error('Test SQL execution error');
            await LoggingSystem.logSQLExecutionError(sqlError, 'SELECT * FROM nonexistent_table', 0);
            
            Utils.showAlert('Logging system test completed! Check the error logs to see the test entries.', 'success');
        } catch (error) {
            Utils.showAlert(`Logging system test failed: ${error.message}`, 'danger');
        }
    }
};

// Make testManager available globally
window.testManager = testManager;

// Make debug function available globally for console access
window.debugAdminStatus = testManager.debugAdminStatus; 