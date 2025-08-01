// Test Manager - Demonstrates database connection with raw SQL
const testManager = {
    container: null,

    init: () => {
        testManager.container = document.getElementById('test-table-container');
        testManager.render();
    },

    render: async () => {
        // Check if user is admin
        if (!AuthManager.isAuthenticated || AuthManager.currentUser?.role !== 'admin') {
            testManager.container.innerHTML = `
                <div class="alert alert-danger">
                    <h4><i class="fas fa-exclamation-triangle"></i> Access Denied</h4>
                    <p>This section is only available to administrators.</p>
                </div>
            `;
            return;
        }

        try {
            // Test database connection
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
                </div>
            `;
            
            testManager.container.innerHTML = table;
        } catch (error) {
            testManager.container.innerHTML = `
                <div class="alert alert-danger">
                    <h4><i class="fas fa-exclamation-triangle"></i> Error Loading Data</h4>
                    <p>${error.message}</p>
                </div>
            `;
        }
    },

    testConnection: async () => {
        // Check if user is admin
        if (!AuthManager.isAuthenticated || AuthManager.currentUser?.role !== 'admin') {
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
            Utils.showAlert(`Connection test failed: ${error.message}`, 'danger');
        }
    },

    runCustomQuery: async () => {
        // Check if user is admin
        if (!AuthManager.isAuthenticated || AuthManager.currentUser?.role !== 'admin') {
            Utils.showAlert('Access denied. Admin privileges required.', 'danger');
            return;
        }

        const query = prompt('Enter your SQL query:');
        if (!query) return;

        try {
            const results = await Database.executeQuery(query);
            alert(`Query executed successfully!\nRows returned: ${results.length}\n\nResults:\n${JSON.stringify(results, null, 2)}`);
        } catch (error) {
            alert(`Query failed: ${error.message}`);
        }
    },


    showInsertDataConfirmation: () => {
        // Check if user is admin
        if (!AuthManager.isAuthenticated || AuthManager.currentUser?.role !== 'admin') {
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

        const confirmMessage = `Are you sure you want to execute the SQL file "${testManager.selectedFile.name}"?\n\nThis will run all SQL statements in the file.`;
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

            // Improved SQL statement parsing
            const statements = testManager.parseSQLStatements(content);
            console.log(`Parsed ${statements.length} SQL statements:`, statements);
            
            let executedCount = 0;
            let errorCount = 0;
            const errors = [];

            for (let i = 0; i < statements.length; i++) {
                const statement = statements[i];
                console.log(`Executing statement ${i + 1}:`, statement);
                
                try {
                    await Database.executeQuery(statement);
                    executedCount++;
                    console.log(`Statement ${i + 1} executed successfully`);
                } catch (error) {
                    errorCount++;
                    const errorMsg = `Statement ${i + 1}: ${error.message}`;
                    errors.push(errorMsg);
                    console.error(errorMsg);
                }
            }

            // Show results
            if (errorCount === 0) {
                Utils.showAlert(`SQL file executed successfully! ${executedCount} statements processed.`, 'success');
            } else {
                Utils.showAlert(`SQL execution completed with errors. ${executedCount} statements succeeded, ${errorCount} failed.`, 'warning');
            }

            // Close the modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('formModal'));
            if (modal) {
                modal.hide();
            }

            // Refresh the entire page after SQL execution
            setTimeout(() => {
                window.location.reload();
            }, 1500);

        } catch (error) {
            Utils.showAlert(`Error executing SQL file: ${error.message}`, 'danger');
        }
    },

    parseSQLStatements: (content) => {
        // Remove comments (both single-line and multi-line)
        let cleanedContent = content
            .replace(/--.*$/gm, '') // Remove single-line comments
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
            .trim();

        // Split by semicolon and filter out empty statements
        const statements = cleanedContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);

        console.log('Original content length:', content.length);
        console.log('Cleaned content length:', cleanedContent.length);
        console.log('Number of statements found:', statements.length);
        
        return statements;
    },

    insertSampleData: async () => {
        try {
            const response = await fetch("test_insert.sql");
            if (!response.ok) {
                throw new Error(`Failed to fetch test_insert.sql: ${response.statusText}`);
            }
            const sqlContent = await response.text();
            
            const statements = sqlContent.split(";").filter(stmt => stmt.trim());
            
            for (const statement of statements) {
                const trimmedStatement = statement.trim();
                if (trimmedStatement && !trimmedStatement.startsWith("--")) {
                    await Database.executeQuery(trimmedStatement);
                }
            }
            
            console.log("Sample data inserted successfully");
            Utils.showAlert("Sample data inserted successfully!", "success");
            testManager.render();
        } catch (error) {
            console.error("Error inserting sample data:", error);
            Utils.showAlert(`Error inserting sample data: ${error.message}`, "danger");
        }
    },    showClearDataConfirmation: () => {
        // Check if user is admin
        if (!AuthManager.isAuthenticated || AuthManager.currentUser?.role !== 'admin') {
            Utils.showAlert('Access denied. Admin privileges required.', 'danger');
            return;
        }

        const modalBody = `
            <div class="alert alert-warning">
                <h5><i class="fas fa-eraser"></i> Clear All Data</h5>
                <p><strong>You are about to clear ALL data from the database.</strong></p>
                <p>This will remove all data but preserve the table structure:</p>
                <ul>
                    <li>All user data (except admin accounts)</li>
                    <li>All vehicle information</li>
                    <li>All service records</li>
                    <li>All maintenance events</li>
                    <li>All expenses and fuel logs</li>
                    <li>All parts and mechanics data</li>
                    <li>All shop information</li>
                </ul>
                <p><strong>✅ Safe: Table structure will be preserved</strong></p>
                <p><strong>✅ Safe: Admin login/password information will be preserved</strong></p>
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
                Utils.showAlert('All data cleared successfully!', 'success');
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
            // Disable safe update mode
            await Database.executeQuery('SET SQL_SAFE_UPDATES = 0');

            // Clear junction tables first (they reference other tables)
            await Database.executeQuery('DELETE FROM `Reminder`');
            await Database.executeQuery('DELETE FROM `MaintenanceEvents_ServiceTypes`');
            await Database.executeQuery('DELETE FROM `ServiceRecords_Parts`');
            await Database.executeQuery('DELETE FROM `ServiceRecords_ServiceTypes`');
            await Database.executeQuery('DELETE FROM `WorkedOn`');

            // Clear dependent tables (tables that reference other tables)
            await Database.executeQuery('DELETE FROM `MaintenanceEvents`');
            await Database.executeQuery('DELETE FROM `FuelLog`');
            await Database.executeQuery('DELETE FROM `Expenses`');
            await Database.executeQuery('DELETE FROM `Parts`');
            await Database.executeQuery('DELETE FROM `ServiceRecords`');
            await Database.executeQuery('DELETE FROM `Mechanics`');
            await Database.executeQuery('DELETE FROM `Owns`');

            // Clear independent tables (tables that don't reference other tables)
            await Database.executeQuery('DELETE FROM `ServiceTypes`');
            await Database.executeQuery('DELETE FROM `CarShops`');
            await Database.executeQuery('DELETE FROM `Vehicles`');
            await Database.executeQuery('DELETE FROM `Users`');

            // Re-enable safe update mode
            await Database.executeQuery('SET SQL_SAFE_UPDATES = 1');

            // Reset auto-increment counters
            await Database.executeQuery('ALTER TABLE `Users` AUTO_INCREMENT = 1');
            await Database.executeQuery('ALTER TABLE `CarShops` AUTO_INCREMENT = 1');
            await Database.executeQuery('ALTER TABLE `Mechanics` AUTO_INCREMENT = 1');
            await Database.executeQuery('ALTER TABLE `ServiceRecords` AUTO_INCREMENT = 1');
            await Database.executeQuery('ALTER TABLE `Parts` AUTO_INCREMENT = 1');
            await Database.executeQuery('ALTER TABLE `Expenses` AUTO_INCREMENT = 1');
            await Database.executeQuery('ALTER TABLE `FuelLog` AUTO_INCREMENT = 1');
            await Database.executeQuery('ALTER TABLE `MaintenanceEvents` AUTO_INCREMENT = 1');
            await Database.executeQuery('ALTER TABLE `Reminder` AUTO_INCREMENT = 1');
            
            // Re-insert admin user and service types
            await testManager.insertAdminUser();
            await testManager.insertServiceTypes();
            
            console.log('All data cleared successfully');
            
            // Logout current user and show login modal since data was cleared
            if (window.AuthManager) {
                AuthManager.clearSession();
                AuthManager.showLoginModal();
                Utils.showAlert('All data cleared. You have been logged out.', 'info');
            }
        } catch (error) {
            console.error('Error clearing data:', error);
            throw new Error(`Failed to clear data: ${error.message}`);
        }
    },

    insertAdminUser: async () => {
        try {
            // Insert admin user if it doesn't exist
            const adminExists = await Database.select("SELECT COUNT(*) as count FROM Users WHERE username = 'admin'");
            if (adminExists[0].count === 0) {
                await Database.executeQuery(`
                    INSERT INTO Users (username, password_hash, email, birthday, registration_date) 
                    VALUES ('admin', '${Utils.hashPassword('admin')}', 'admin@example.com', '1990-01-01', CURDATE())
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
        // Check if user is admin
        if (!AuthManager.isAuthenticated || AuthManager.currentUser?.role !== 'admin') {
            Utils.showAlert('Access denied. Admin privileges required.', 'danger');
            return;
        }

        try {
            // Check if admin user exists
            const existingAdmin = await Database.select('SELECT user_id FROM Users WHERE username = "admin"');
            if (existingAdmin.length > 0) {
                Utils.showAlert('Admin user "admin" already exists. No action taken.', 'info');
                return;
            }

            // Insert new admin user
            await Database.executeQuery(`
                INSERT INTO Users (username, password_hash, email, birthday, registration_date)
                VALUES ('admin', '${Utils.hashPassword('admin')}', 'admin@example.com', '2000-01-01', NOW())
            `);
            Utils.showAlert('Admin user "admin" restored successfully!', 'success');
            // Refresh the entire page after restoring admin
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (error) {
            Utils.showAlert(`Error restoring admin user: ${error.message}`, 'danger');
        }
    }
};

// Make testManager available globally
window.testManager = testManager; 