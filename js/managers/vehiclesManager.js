// Vehicles Manager
const vehiclesManager = {
    container: null,
    filterUI: `
        <div class="mb-3 d-flex align-items-center gap-2">
            <label for="filter-column">Filter by:</label>
            <select id="filter-column" class="form-select form-select-sm" style="width: auto;">
                <option value="">-- Select Column --</option>
                <option value="make">Make</option>
                <option value="model">Model</option>
                <option value="year">Year</option>
            </select>
            <input type="text" id="filter-value" class="form-control form-control-sm" placeholder="Enter filter value" style="width: 200px;">
            <button class="btn btn-sm btn-outline-primary" onclick="vehiclesManager.applyFilter()">Apply</button>
            <button class="btn btn-sm btn-outline-secondary" onclick="vehiclesManager.clearFilter()">Clear</button>
        </div>
    `,

    init: () => {
        vehiclesManager.container = document.getElementById('vehicles-table-container');
        vehiclesManager.render();
    },

    render: async () => {
        // Check if user is authenticated
        if (!AuthManager.isAuthenticated) {
            vehiclesManager.container.innerHTML = `
                <div class="alert alert-warning">
                    <h4><i class="fas fa-lock"></i> Authentication Required</h4>
                    <p>Please log in to view and manage vehicles.</p>
                    <button class="btn btn-primary" onclick="AuthManager.showLoginModal()">
                        <i class="fas fa-sign-in-alt"></i> Login
                    </button>
                </div>
            `;
            return;
        }

        try {
            // Get vehicles from database based on user permissions
            let vehiclesToShow = [];
            if (AuthManager.isAdmin()) {
                vehiclesToShow = await Database.select('SELECT * FROM Vehicles');
            } else {
                // Regular users can only see their own vehicles
                const userId = AuthManager.currentUser.user_id;
                vehiclesToShow = await Database.select(`
                    SELECT DISTINCT v.* 
                    FROM Vehicles v
                    JOIN Owns o ON v.vin = o.vin
                    WHERE o.user_id = ${userId}
                    AND (o.end_date IS NULL OR o.end_date > CURDATE())
                `);
            }

            const table = `
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>VIN</th>
                                <th>Make</th>
                                <th>Model</th>
                                <th>Year</th>
                                <th>Relationships</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(await Promise.all(vehiclesToShow.map(vehicle => vehiclesManager.createVehicleRow(vehicle)))).join('')}
                        </tbody>
                    </table>
                </div>
            `;
            
            vehiclesManager.container.innerHTML = vehiclesManager.filterUI + table;
        } catch (error) {
            console.error('Error loading vehicles:', error);
            vehiclesManager.container.innerHTML = `
                <div class="alert alert-danger">
                    <h4><i class="fas fa-exclamation-triangle"></i> Error Loading Vehicles</h4>
                    <p>${error.message}</p>
                    <button class="btn btn-primary" onclick="vehiclesManager.render()">
                        <i class="fas fa-sync"></i> Retry
                    </button>
                </div>
            `;
        }
    },

    createVehicleRow: async (vehicle) => {
        // Fetch vehicle owners
        let owners = [];
        try {
            owners = await Database.select(`
                SELECT u.username, u.email, o.start_date as ownership_start
                FROM Owns o
                JOIN Users u ON o.user_id = u.user_id
                WHERE o.vin = '${vehicle.vin}'
                AND (o.end_date IS NULL OR o.end_date > CURDATE())
                ORDER BY o.start_date DESC
            `);
        } catch (error) {
            console.error(`Error fetching owners for vehicle ${vehicle.vin}:`, error);
        }

        // Fetch vehicle expenses
        let expenses = [];
        try {
            expenses = await Database.select(`
                SELECT * FROM Expenses 
                WHERE vin = '${vehicle.vin}'
                ORDER BY date DESC
            `);
        } catch (error) {
            console.error(`Error fetching expenses for vehicle ${vehicle.vin}:`, error);
        }

        // Fetch vehicle fuel logs
        let fuelExpenses = [];
        try {
            fuelExpenses = await Database.select(`
                SELECT e.*, fe.gallons, fe.current_mileage, fe.fuel_type 
                FROM Expenses e
                JOIN FuelExpenses fe ON e.expense_id = fe.expense_id
                WHERE e.vin = '${vehicle.vin}' AND e.category = 'Fuel'
                ORDER BY e.date DESC
            `);
        } catch (error) {
            console.error(`Error fetching fuel expenses for vehicle ${vehicle.vin}:`, error);
        }

        // Fetch vehicle service records
        let services = [];
        try {
            services = await Database.select(`
                SELECT * FROM ServiceRecords 
                WHERE vin = '${vehicle.vin}'
                ORDER BY service_date DESC
            `);
        } catch (error) {
            console.error(`Error fetching service records for vehicle ${vehicle.vin}:`, error);
        }
        
        return `
            <tr>
                <td><code>${vehicle.vin}</code></td>
                <td>${vehicle.make}</td>
                <td>${vehicle.model}</td>
                <td>${vehicle.year}</td>
                <td>
                    ${Utils.createRelationshipBadges(vehicle, 'vehicle')}
                    <button class="btn btn-sm btn-outline-info" onclick="vehiclesManager.showDetails('${vehicle.vin}')">
                        <i class="fas fa-info-circle"></i> Details
                    </button>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="vehiclesManager.showEditForm('${vehicle.vin}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="vehiclesManager.deleteVehicle('${vehicle.vin}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
            <tr id="vehicle-details-${vehicle.vin.replace(/[^a-zA-Z0-9]/g, '')}" class="detail-row" style="display: none;">
                <td colspan="6">
                    <div class="card">
                        <div class="card-header">
                            <h6>Vehicle Details - ${vehicle.year} ${vehicle.make} ${vehicle.model}</h6>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6>Current Owners (${owners.length})</h6>
                                    ${owners.length > 0 ? `
                                        <ul class="list-group list-group-flush">
                                            ${owners.map(owner => `
                                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                                    ${owner.username} (${owner.email})
                                                    <span class="badge bg-secondary">Since ${Utils.formatDate(owner.ownership_start)}</span>
                                                </li>
                                            `).join('')}
                                        </ul>
                                    ` : '<p class="text-muted">No current owners</p>'}
                                    
                                    <h6 class="mt-3">Service Records (${services.length})</h6>
                                    ${services.length > 0 ? `
                                        <ul class="list-group list-group-flush">
                                            ${services.map(service => `
                                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                                    ${Utils.formatDate(service.service_date)} - ${service.description}
                                                    <span class="badge bg-primary">${Utils.formatCurrency(service.cost)}</span>
                                                </li>
                                            `).join('')}
                                        </ul>
                                    ` : '<p class="text-muted">No service records</p>'}
                                </div>
                                <div class="col-md-6">
                                    <h6>Expenses (${expenses.length})</h6>
                                    ${expenses.length > 0 ? `
                                        <ul class="list-group list-group-flush">
                                            ${expenses.map(expense => `
                                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                                    ${Utils.formatDate(expense.date)} - ${expense.category}
                                                    <span class="badge bg-warning">${Utils.formatCurrency(expense.amount)}</span>
                                                </li>
                                            `).join('')}
                                        </ul>
                                    ` : '<p class="text-muted">No expenses recorded</p>'}
                                    
                                                        <h6 class="mt-3">Fuel Expenses (${fuelExpenses.length})</h6>
                    ${fuelExpenses.length > 0 ? `
                        <ul class="list-group list-group-flush">
                                                        ${fuelExpenses.map(expense => {
                                // Safely convert numeric values
                                const gallons = Number(expense.gallons) || 0;
                                const amount = Number(expense.amount) || 0;
                                return `
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    ${Utils.formatDate(expense.date)} - ${gallons.toFixed(2)} gal ${expense.fuel_type}
                                    <span class="badge bg-info">${Utils.formatCurrency(amount)}</span>
                                </li>
                            `}).join('')}
                                        </ul>
                                    ` : '<p class="text-muted">No fuel expenses</p>'}
                                </div>
                            </div>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    },

    showDetails: (vin) => {
        const detailRow = document.getElementById(`vehicle-details-${vin.replace(/[^a-zA-Z0-9]/g, '')}`);
        const button = event.target.closest('button');
        Utils.toggleDetailRow(button, detailRow);
    },

    showAddForm: () => {
        // Check if user is authenticated
        if (!AuthManager.requireAuth('add vehicles')) {
            return;
        }

        const formContent = `
            <form id="vehicleForm">
                ${Utils.createFormField('VIN (Cannot be modified later)', 'vin', 'text', true).outerHTML}
                ${Utils.createFormField('Make', 'make', 'text', true).outerHTML}
                ${Utils.createFormField('Model', 'model', 'text', true).outerHTML}
                ${Utils.createFormField('Year', 'year', 'number', true).outerHTML}
            </form>
        `;

        Utils.ModalManager.show('Add New Vehicle', formContent, () => vehiclesManager.saveVehicle());
    },

    showEditForm: async (vin) => {
        try {
            // Fetch vehicle data from database
            const vehicles = await Database.select(`SELECT * FROM Vehicles WHERE vin = '${vin}'`);
            const vehicle = vehicles[0];
            
            if (!vehicle) {
                Utils.showAlert('Vehicle not found', 'danger');
                return;
            }

            const formContent = `
                <form id="vehicleForm">
                    ${Utils.createFormField('VIN (Cannot be modified)', 'vin', 'text', true).outerHTML.replace('type="text"', 'type="text" readonly')}
                    ${Utils.createFormField('Make', 'make', 'text', true).outerHTML}
                    ${Utils.createFormField('Model', 'model', 'text', true).outerHTML}
                    ${Utils.createFormField('Year', 'year', 'number', true).outerHTML}
                </form>
            `;

            // Populate form with existing data
            setTimeout(() => {
                document.getElementById('vin').value = vehicle.vin;
                document.getElementById('make').value = vehicle.make;
                document.getElementById('model').value = vehicle.model;
                document.getElementById('year').value = vehicle.year;
            }, 100);

            Utils.ModalManager.show('Edit Vehicle', formContent, () => vehiclesManager.saveVehicle(vin));
        } catch (error) {
            Utils.showAlert(`Error loading vehicle data: ${error.message}`, 'danger');
        }
    },

    saveVehicle: async (vin = null) => {
        const form = document.getElementById('vehicleForm');
        if (!form) {
            Utils.showAlert('Form not found', 'danger');
            return;
        }
        
        const formData = new FormData(form);
        
        const vehicleData = {
            vin: formData.get('vin'),
            make: formData.get('make'),
            model: formData.get('model'),
            year: parseInt(formData.get('year'))
        };

        // Validation
        if (!vehicleData.vin || !vehicleData.make || !vehicleData.model || !vehicleData.year) {
            Utils.showAlert('All fields are required', 'danger');
            return;
        }

        if (!Utils.validateVIN(vehicleData.vin)) {
            Utils.showAlert('VIN must be exactly 17 characters', 'danger');
            return;
        }

        if (vehicleData.year < 1900 || vehicleData.year > new Date().getFullYear() + 1) {
            Utils.showAlert('Please enter a valid year', 'danger');
            return;
        }

        try {
            if (vin) {
                // Update existing vehicle in database
                const sql = `UPDATE Vehicles SET 
                    make = '${vehicleData.make}', 
                    model = '${vehicleData.model}', 
                    year = ${vehicleData.year} 
                    WHERE vin = '${vin}'`;
                
                await Database.update(sql);
                Utils.showAlert('Vehicle updated successfully', 'success');
            } else {
                // Add new vehicle to database
                const sql = `INSERT INTO Vehicles (vin, make, model, year) 
                           VALUES ('${vehicleData.vin}', '${vehicleData.make}', '${vehicleData.model}', ${vehicleData.year})`;
                
                await Database.insert(sql);
                
                // If user is not admin, create ownership record for the current user
                if (!AuthManager.isAdmin()) {
                    const currentDate = new Date().toISOString().split('T')[0];
                    const ownershipSql = `INSERT INTO Owns (user_id, vin, start_date) 
                                        VALUES (${AuthManager.currentUser.user_id}, '${vehicleData.vin}', '${currentDate}')`;
                    
                    try {
                        await Database.insert(ownershipSql);
                    } catch (error) {
                        console.error('Error creating ownership record:', error);
                        // Don't fail the whole operation if ownership creation fails
                    }
                }
                
                Utils.showAlert('Vehicle added successfully', 'success');
            }

            Utils.ModalManager.hide();
            
            // Refresh all sections that depend on vehicle data
            await vehiclesManager.refreshAllRelatedSections();
        } catch (error) {
            Utils.showAlert(`Error saving vehicle: ${error.message}`, 'danger');
        }
    },

    // Refresh all sections that depend on vehicle data
    refreshAllRelatedSections: async () => {
        try {
            // Show loading indicator
            Utils.showAlert('Updating all related sections...', 'info');
            
            // Refresh vehicles section
            await vehiclesManager.render();
            
            // Refresh ownership section
            if (window.ownsManager) {
                await ownsManager.render();
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
            
            console.log('All related sections refreshed successfully');
            
            // Show success message
            setTimeout(() => {
                Utils.showAlert('All sections updated successfully!', 'success');
            }, 500);
        } catch (error) {
            console.error('Error refreshing related sections:', error);
            Utils.showAlert('Error updating sections. Please refresh the page.', 'danger');
        }
    },

    deleteVehicle: async (vin) => {
        if (!confirm('Are you sure you want to delete this vehicle? This will also remove all associated records (ownership, services, expenses, etc.).')) {
            return;
        }

        try {
            // Delete vehicle from database (cascade will handle related records)
            const sql = `DELETE FROM Vehicles WHERE vin = '${vin}'`;
            await Database.delete(sql);
            
            Utils.showAlert('Vehicle deleted successfully', 'success');
            
            // Refresh all sections that depend on vehicle data
            await vehiclesManager.refreshAllRelatedSections();
        } catch (error) {
            Utils.showAlert(`Error deleting vehicle: ${error.message}`, 'danger');
        }
    },

    applyFilter: async () => {
        const column = document.getElementById('filter-column').value;
        const value = document.getElementById('filter-value').value.trim();
    
        if (!column || !value) {
            Utils.showAlert('Please select a column and enter a value.', 'warning');
            return;
        }
    
        try {
            let query = `SELECT * FROM Vehicles WHERE ${column} LIKE '%${value}%'`;
    
            if (!AuthManager.isAdmin()) {
                const userId = AuthManager.currentUser.user_id;
                query = `
                    SELECT DISTINCT v.* 
                    FROM Vehicles v
                    JOIN Owns o ON v.vin = o.vin
                    WHERE o.user_id = ${userId}
                    AND (o.end_date IS NULL OR o.end_date > CURDATE())
                    AND v.${column} LIKE '%${value}%'
                `;
            }
    
            const filteredVehicles = await Database.select(query);
    
            const table = `
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>VIN</th>
                                <th>Make</th>
                                <th>Model</th>
                                <th>Year</th>
                                <th>Relationships</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(await Promise.all(filteredVehicles.map(vehicle => vehiclesManager.createVehicleRow(vehicle)))).join('')}
                        </tbody>
                    </table>
                </div>
            `;
    
            vehiclesManager.container.innerHTML = vehiclesManager.filterUI + table;
        } catch (error) {
            Utils.showAlert(`Error applying filter: ${error.message}`, 'danger');
        }
    },

    clearFilter: async () => {
        document.getElementById('filter-column').value = '';
        document.getElementById('filter-value').value = '';
        await vehiclesManager.render();
    }
    
};

// Make vehiclesManager available globally
window.vehiclesManager = vehiclesManager;