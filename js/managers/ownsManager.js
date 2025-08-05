// Ownership Manager
const ownsManager = {
    container: null,

    filterUI: `
        <div class="mb-3 d-flex align-items-center gap-2">
            <label for="owns-filter-column">Filter by:</label>
            <select id="owns-filter-column" class="form-select form-select-sm" style="width: auto;">
                <option value="">-- Select Column --</option>
                <option value="username">User</option>
                <option value="vehicle">Vehicle</option>
                <option value="vin">VIN</option>
            </select>
            <input type="text" id="owns-filter-value" class="form-control form-control-sm" placeholder="Enter filter value" style="width: 200px;">
            <button class="btn btn-sm btn-outline-primary" onclick="ownsManager.applyFilter()">Apply</button>
            <button class="btn btn-sm btn-outline-secondary" onclick="ownsManager.clearFilter()">Clear</button>
        </div>
    `,

    init: () => {
        ownsManager.container = document.getElementById('owns-table-container');
        ownsManager.render();
    },

    render: async () => {
        // Check if user is authenticated
        if (!AuthManager.isAuthenticated) {
            ownsManager.container.innerHTML = '<div class="alert alert-warning">Please log in to view ownership records.</div>';
            return;
        }

        try {
            // Get ownership data from database with user and vehicle information
            let ownershipData = [];
            
            if (AuthManager.isAdmin()) {
                // Admin can see all ownership records
                ownershipData = await Database.select(`
                    SELECT o.*, u.username, u.email, v.make, v.model, v.year 
                    FROM Owns o
                    LEFT JOIN Users u ON o.user_id = u.user_id
                    LEFT JOIN Vehicles v ON o.vin = v.vin
                    ORDER BY o.start_date DESC
                `);
            } else {
                // Regular users can only see ownership records for their vehicles
                const userId = AuthManager.currentUser.user_id;
                ownershipData = await Database.select(`
                    SELECT o.*, u.username, u.email, v.make, v.model, v.year 
                    FROM Owns o
                    LEFT JOIN Users u ON o.user_id = u.user_id
                    LEFT JOIN Vehicles v ON o.vin = v.vin
                    WHERE o.user_id = ${userId}
                    ORDER BY o.start_date DESC
                `);
            }

            const table = `
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h4>Vehicle Ownership Management</h4>
                    ${AuthManager.isAdmin() ? `
                        <button class="btn btn-success" onclick="ownsManager.showAddForm()">
                            <i class="fas fa-plus"></i> Add Ownership
                        </button>
                    ` : ''}
                </div>
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead class="table-dark">
                            <tr>
                                <th><i class="fas fa-user"></i> User</th>
                                <th><i class="fas fa-car"></i> Vehicle</th>
                                <th><i class="fas fa-id-card"></i> VIN</th>
                                <th><i class="fas fa-calendar-plus"></i> Start Date</th>
                                <th><i class="fas fa-calendar-minus"></i> End Date</th>
                                <th><i class="fas fa-info-circle"></i> Status</th>
                                <th><i class="fas fa-cogs"></i> Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${ownershipData.length > 0 ? 
                                ownershipData.map(own => ownsManager.createOwnRow(own)).join('') : 
                                '<tr><td colspan="6" class="text-center text-muted">No ownership records found</td></tr>'
                            }
                        </tbody>
                    </table>
                </div>
            `;
            
            ownsManager.container.innerHTML = ownsManager.filterUI + table;
        } catch (error) {
            console.error('Error loading ownership data:', error);
            ownsManager.container.innerHTML = `
                <div class="alert alert-danger">
                    <h4><i class="fas fa-exclamation-triangle"></i> Error Loading Ownership Data</h4>
                    <p>${error.message}</p>
                    <button class="btn btn-primary" onclick="ownsManager.render()">
                        <i class="fas fa-sync"></i> Retry
                    </button>
                </div>
            `;
        }
    },

    createOwnRow: (own) => {
        const user = own.username || 'Unknown User';
        const vehicle = own.make && own.model && own.year ? 
            `${own.year} ${own.make} ${own.model}` : 'Unknown Vehicle';
        const isActive = !own.end_date;
        
        return `
            <tr>
                <td>${user}</td>
                <td>${vehicle}</td>
                <td>${own.vin}</td>
                <td>${Utils.formatDate(own.start_date)}</td>
                <td>${own.end_date ? Utils.formatDate(own.end_date) : 'Active'}</td>
                <td>
                    <span class="badge bg-${isActive ? 'success' : 'secondary'}">
                        ${isActive ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>
                    ${isActive ? `
                        <button class="btn btn-sm btn-warning" onclick="ownsManager.endOwnership(${own.user_id}, '${own.vin}')" title="End Ownership">
                            <i class="fas fa-stop"></i> End
                        </button>
                    ` : `
                        <button class="btn btn-sm btn-success" onclick="ownsManager.resumeOwnership(${own.user_id}, '${own.vin}')" title="Resume Ownership">
                            <i class="fas fa-play"></i> Resume
                        </button>
                    `}
                    <button class="btn btn-sm btn-danger" onclick="ownsManager.deleteOwnership(${own.user_id}, '${own.vin}')" title="Delete Ownership Record">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    },

    showAddForm: async () => {
        try {
            const users = await Database.select('SELECT user_id, username, email FROM Users ORDER BY username');
            const vehicles = await Database.select('SELECT vin, make, model, year FROM Vehicles ORDER BY make, model');
            
            // Get existing ownership relationships to filter out already owned vehicles
            const existingOwnership = await Database.select(`
                SELECT DISTINCT vin FROM Owns 
                WHERE end_date IS NULL OR end_date > CURDATE()
            `);
            const ownedVins = existingOwnership.map(own => own.vin);
            
            const userOptions = users.map(user => ({
                value: user.user_id,
                text: `${user.username} (${user.email})`
            }));

            // Filter out vehicles that are already owned
            const availableVehicles = vehicles.filter(vehicle => !ownedVins.includes(vehicle.vin));
            const vehicleOptions = availableVehicles.map(vehicle => ({
                value: vehicle.vin,
                text: `${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.vin})`
            }));

            if (availableVehicles.length === 0) {
                Utils.showAlert('All vehicles are currently owned. No available vehicles to assign ownership.', 'warning');
                return;
            }

        const formContent = `
            <form id="ownForm">
                ${Utils.createFormField('User', 'user_id', 'select', true, userOptions).outerHTML}
                ${Utils.createFormField('Vehicle', 'vin', 'select', true, vehicleOptions).outerHTML}
                ${Utils.createFormField('Start Date', 'start_date', 'date', true).outerHTML}
                ${Utils.createFormField('End Date (Optional)', 'end_date', 'date', false).outerHTML}
            </form>
        `;

        Utils.ModalManager.show('Add Ownership Record', formContent, ownsManager.saveOwnership);
        } catch (error) {
            console.error('Error loading form data:', error);
            Utils.showAlert(`Error loading form data: ${error.message}`, 'danger');
        }
    },

    saveOwnership: async () => {
        const form = document.getElementById('ownForm');
        const formData = new FormData(form);
        
        const ownershipData = {
            user_id: parseInt(formData.get('user_id')),
            vin: formData.get('vin'),
            start_date: formData.get('start_date').split('T')[0], // Extract just the date part
            end_date: formData.get('end_date') ? formData.get('end_date').split('T')[0] : null // Extract just the date part
        };

        // Validation
        if (!ownershipData.user_id || !ownershipData.vin || !ownershipData.start_date) {
            Utils.showAlert('User, Vehicle, and Start Date are required', 'danger');
            return;
        }

        try {
            // Check if this ownership already exists
            const existingOwnership = await Database.select(`
                SELECT * FROM Owns 
                WHERE user_id = ${ownershipData.user_id} AND vin = '${ownershipData.vin}'
            `);

            if (existingOwnership.length > 0) {
                Utils.showAlert('This ownership relationship already exists', 'danger');
                return;
            }

            // Add new ownership to database
            await Database.insertRecord('Owns', ownershipData);
            Utils.showAlert('Ownership record added successfully', 'success');

            Utils.ModalManager.hide();
            
            // Refresh all sections that depend on ownership data
            await ownsManager.refreshAllRelatedSections();
        } catch (error) {
            console.error('Error saving ownership:', error);
            Utils.showAlert(`Error saving ownership: ${error.message}`, 'danger');
        }
    },

    // Refresh all sections that depend on ownership data
    refreshAllRelatedSections: async () => {
        try {
            // Show loading indicator
            Utils.showAlert('Updating all related sections...', 'info');
            
            // Refresh ownership section
            await ownsManager.render();
            
            // Refresh vehicles section (since ownership affects what vehicles users can see)
            if (window.vehiclesManager) {
                await vehiclesManager.render();
            }
            
            // Refresh expenses section
            if (window.expensesManager) {
                await expensesManager.render();
            }
            
            // Refresh fuel logs section

            
            // Refresh service records section
            if (window.servicesManager) {
                await servicesManager.render();
            }
            
            // Refresh upcoming services section
            if (window.maintenanceManager) {
                await maintenanceManager.render();
            }
            
            console.log('All ownership-related sections refreshed successfully');
            
            // Show success message
            setTimeout(() => {
                Utils.showAlert('All sections updated successfully!', 'success');
            }, 500);
        } catch (error) {
            console.error('Error refreshing ownership-related sections:', error);
            Utils.showAlert('Error updating sections. Please refresh the page.', 'danger');
        }
    },

    endOwnership: async (userId, vin) => {
        if (!confirm('Are you sure you want to end this ownership? This will mark the ownership as inactive.')) {
            return;
        }

        try {
            const endDate = new Date().toISOString().split('T')[0];
            await Database.updateRecord('Owns', { end_date: endDate }, `user_id = ${userId} AND vin = '${vin}'`);
            Utils.showAlert('Ownership ended successfully', 'success');
            
            // Refresh all sections that depend on ownership data
            await ownsManager.refreshAllRelatedSections();
        } catch (error) {
            console.error('Error ending ownership:', error);
            Utils.showAlert(`Error ending ownership: ${error.message}`, 'danger');
        }
    },

    resumeOwnership: async (userId, vin) => {
        if (!confirm('Are you sure you want to resume this ownership? This will reactivate the ownership relationship.')) {
            return;
        }

        try {
            await Database.updateRecord('Owns', { end_date: null }, `user_id = ${userId} AND vin = '${vin}'`);
            Utils.showAlert('Ownership resumed successfully', 'success');
            
            // Refresh all sections that depend on ownership data
            await ownsManager.refreshAllRelatedSections();
        } catch (error) {
            console.error('Error resuming ownership:', error);
            Utils.showAlert(`Error resuming ownership: ${error.message}`, 'danger');
        }
    },

    deleteOwnership: async (userId, vin) => {
        if (!confirm('Are you sure you want to delete this ownership record?')) {
            return;
        }

        try {
            await Database.deleteRecords('Owns', `user_id = ${userId} AND vin = '${vin}'`);
            Utils.showAlert('Ownership record deleted successfully', 'success');
            
            // Refresh all sections that depend on ownership data
            await ownsManager.refreshAllRelatedSections();
        } catch (error) {
            console.error('Error deleting ownership:', error);
            Utils.showAlert(`Error deleting ownership: ${error.message}`, 'danger');
        }
    },

    applyFilter: async () => {
        const column = document.getElementById('owns-filter-column').value;
        const value = document.getElementById('owns-filter-value').value.trim();
    
        if (!column || !value) {
            Utils.showAlert('Please select a column and enter a value.', 'warning');
            return;
        }
    
        try {
            let whereClause = '';
            if (column.includes('date')) {
                whereClause = `DATE(o.${column}) = '${value}'`;
            } else if (['username', 'email'].includes(column)) {
                whereClause = `u.${column} LIKE '%${value}%'`;
            } else if (column === 'vehicle') {
                whereClause = `(v.make LIKE '%${value}%' OR v.model LIKE '%${value}%' OR v.year LIKE '%${value}%')`;
            } else {
                whereClause = `o.${column} LIKE '%${value}%'`;
            }
    
            if (!AuthManager.isAdmin()) {
                whereClause = `o.user_id = ${AuthManager.currentUser.user_id} AND ${whereClause}`;
            }
    
            const query = `
                SELECT o.*, u.username, u.email, v.make, v.model, v.year 
                FROM Owns o
                LEFT JOIN Users u ON o.user_id = u.user_id
                LEFT JOIN Vehicles v ON o.vin = v.vin
                WHERE ${whereClause}
                ORDER BY o.start_date DESC
            `;
    
            const filteredData = await Database.select(query);
    
            const table = `
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead class="table-dark">
                            <tr>
                                <th>User</th>
                                <th>Vehicle</th>
                                <th>VIN</th>
                                <th>Start Date</th>
                                <th>End Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredData.length > 0 ? 
                                filteredData.map(own => ownsManager.createOwnRow(own)).join('') : 
                                '<tr><td colspan="7" class="text-center text-muted">No matching records</td></tr>'
                            }
                        </tbody>
                    </table>
                </div>
            `;
    
            ownsManager.container.innerHTML = ownsManager.filterUI + table;
        } catch (error) {
            Utils.showAlert(`Error applying filter: ${error.message}`, 'danger');
        }
    },

    clearFilter: async () => {
        document.getElementById('owns-filter-column').value = '';
        document.getElementById('owns-filter-value').value = '';
        await ownsManager.render();
    }    
    
};

// Make ownsManager available globally
window.ownsManager = ownsManager;