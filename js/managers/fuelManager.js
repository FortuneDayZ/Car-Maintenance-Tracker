// Fuel Log Manager
const fuelManager = {
    container: null,

    init: () => {
        fuelManager.container = document.getElementById('fuel-table-container');
        fuelManager.render();
    },

    render: async () => {
        // Check if user is authenticated
        if (!AuthManager.isAuthenticated) {
            fuelManager.container.innerHTML = '<div class="alert alert-warning">Please log in to view fuel logs.</div>';
            return;
        }

        try {
            // Get user info for permissions
            const userId = AuthManager.currentUser?.user_id;
            const isAdmin = AuthManager.isAdmin();
            
            // Get fuel logs from database based on user permissions
            let fuelLogsToShow = [];
            if (isAdmin) {
                fuelLogsToShow = await Database.select(`
                    SELECT fl.*, v.make, v.model, v.year 
                    FROM FuelLog fl
                    LEFT JOIN Vehicles v ON fl.vin = v.vin
                    ORDER BY fl.date_filled DESC
                `);
            } else {
                // Regular users can only see their own fuel logs
                fuelLogsToShow = await Database.select(`
                    SELECT fl.*, v.make, v.model, v.year 
                    FROM FuelLog fl
                    LEFT JOIN Vehicles v ON fl.vin = v.vin
                    JOIN Owns o ON fl.vin = o.vin
                    WHERE o.user_id = ${userId}
                    ORDER BY fl.date_filled DESC
                `);
            }

            // Get fuel summary data
            const fuelSummary = await fuelManager.getFuelSummary(userId, isAdmin);
            
            const table = `
                <!-- Fuel Summary Cards -->
                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="card bg-primary text-white">
                            <div class="card-body text-center">
                                <h5 class="card-title">Total Fuel Cost</h5>
                                <h3>${Utils.formatCurrency(fuelSummary.totalCost)}</h3>
                                <small>All time</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-success text-white">
                            <div class="card-body text-center">
                                <h5 class="card-title">Total Gallons</h5>
                                <h3>${Number(fuelSummary.totalGallons).toFixed(2)}</h3>
                                <small>Gallons</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-info text-white">
                            <div class="card-body text-center">
                                <h5 class="card-title">Avg Price/Gal</h5>
                                <h3>${Utils.formatCurrency(fuelSummary.avgPricePerGallon)}</h3>
                                <small>Per gallon</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-warning text-white">
                            <div class="card-body text-center">
                                <h5 class="card-title">Fill-ups</h5>
                                <h3>${fuelSummary.totalFillUps}</h3>
                                <small>Total</small>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Export Button -->
                <div class="row mb-3">
                    <div class="col-12">
                        <button class="btn btn-success" onclick="fuelManager.exportToCSV()">
                            <i class="fas fa-download"></i> Export Fuel Data to CSV
                        </button>
                    </div>
                </div>

                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Vehicle</th>
                                <th>Date</th>
                                <th>Mileage</th>
                                <th>Gallons</th>
                                <th>Cost</th>
                                <th>Fuel Type</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${fuelLogsToShow.map(log => fuelManager.createFuelRow(log)).join('')}
                        </tbody>
                    </table>
                </div>
            `;
            
            fuelManager.container.innerHTML = table;
        } catch (error) {
            console.error('Error loading fuel logs:', error);
            fuelManager.container.innerHTML = `
                <div class="alert alert-danger">
                    <h4><i class="fas fa-exclamation-triangle"></i> Error Loading Fuel Logs</h4>
                    <p>${error.message}</p>
                    <button class="btn btn-primary" onclick="fuelManager.render()">
                        <i class="fas fa-sync"></i> Retry
                    </button>
                </div>
            `;
        }
    },

    createFuelRow: (log) => {
        const vehicle = log.make && log.model && log.year ? 
            `${log.year} ${log.make} ${log.model}` : 'Unknown Vehicle';
        
        // Safely convert numeric values
        const currentMileage = Number(log.current_mileage) || 0;
        const gallons = Number(log.gallons) || 0;
        const totalCost = Number(log.total_cost) || 0;
        
        return `
            <tr>
                <td>${log.fuel_log_id}</td>
                <td>${vehicle}</td>
                <td>${Utils.formatDate(log.date_filled)}</td>
                <td>${currentMileage.toLocaleString()}</td>
                <td>${gallons.toFixed(2)} gal</td>
                <td>${Utils.formatCurrency(totalCost)}</td>
                <td><span class="badge bg-info">${log.fuel_type}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="fuelManager.showEditForm(${log.fuel_log_id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="fuelManager.deleteFuelLog(${log.fuel_log_id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    },

    showAddForm: async () => {
        // Check if user is authenticated
        if (!AuthManager.requireAuth('add fuel entries')) {
            return;
        }
        try {
            let vehicles;
            if (AuthManager.isAdmin()) {
                vehicles = await Database.select('SELECT vin, make, model, year FROM Vehicles');
            } else {
                // Regular users can only add fuel logs for vehicles they own
                const userId = AuthManager.currentUser.user_id;
                vehicles = await Database.select(`
                    SELECT v.vin, v.make, v.model, v.year 
                    FROM Vehicles v
                    JOIN Owns o ON v.vin = o.vin
                    WHERE o.user_id = ${userId}
                    AND (o.end_date IS NULL OR o.end_date > CURDATE())
                `);
            }
            
            const vehicleOptions = vehicles.map(vehicle => ({
                value: vehicle.vin,
                text: `${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.vin})`
            }));

        const fuelTypeOptions = [
            { value: 'Regular', text: 'Regular' },
            { value: 'Premium', text: 'Premium' },
            { value: 'Diesel', text: 'Diesel' },
            { value: 'E85', text: 'E85' }
        ];

        const formContent = `
            <form id="fuelForm">
                ${Utils.createFormField('Vehicle', 'vin', 'select', true, vehicleOptions).outerHTML}
                ${Utils.createFormField('Date Filled', 'date_filled', 'date', true).outerHTML}
                ${Utils.createFormField('Current Mileage', 'current_mileage', 'number', true).outerHTML}
                ${Utils.createFormField('Gallons', 'gallons', 'number', true).outerHTML}
                ${Utils.createFormField('Total Cost', 'total_cost', 'number', true).outerHTML}
                ${Utils.createFormField('Fuel Type', 'fuel_type', 'select', true, fuelTypeOptions).outerHTML}
            </form>
        `;

        Utils.ModalManager.show('Add New Fuel Entry', formContent, () => fuelManager.saveFuelLog());
        } catch (error) {
            console.error('Error loading vehicles for fuel form:', error);
            Utils.showAlert(`Error loading vehicles: ${error.message}`, 'danger');
        }
    },

    showEditForm: async (logId) => {
        try {
            const logs = await Database.select(`SELECT * FROM FuelLog WHERE fuel_log_id = ${logId}`);
            const log = logs[0];
            if (!log) return;

            let vehicles;
            if (AuthManager.isAdmin()) {
                vehicles = await Database.select('SELECT vin, make, model, year FROM Vehicles');
            } else {
                // Regular users can only edit fuel logs for vehicles they own
                const userId = AuthManager.currentUser.user_id;
                vehicles = await Database.select(`
                    SELECT v.vin, v.make, v.model, v.year 
                    FROM Vehicles v
                    JOIN Owns o ON v.vin = o.vin
                    WHERE o.user_id = ${userId}
                    AND (o.end_date IS NULL OR o.end_date > CURDATE())
                `);
            }
            
            const vehicleOptions = vehicles.map(vehicle => ({
                value: vehicle.vin,
                text: `${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.vin})`
            }));

        const fuelTypeOptions = [
            { value: 'Regular', text: 'Regular' },
            { value: 'Premium', text: 'Premium' },
            { value: 'Diesel', text: 'Diesel' },
            { value: 'E85', text: 'E85' }
        ];

        const formContent = `
            <form id="fuelForm">
                ${Utils.createFormField('Vehicle', 'vin', 'select', true, vehicleOptions).outerHTML}
                ${Utils.createFormField('Date Filled', 'date_filled', 'date', true).outerHTML}
                ${Utils.createFormField('Current Mileage', 'current_mileage', 'number', true).outerHTML}
                ${Utils.createFormField('Gallons', 'gallons', 'number', true).outerHTML}
                ${Utils.createFormField('Total Cost', 'total_cost', 'number', true).outerHTML}
                ${Utils.createFormField('Fuel Type', 'fuel_type', 'select', true, fuelTypeOptions).outerHTML}
            </form>
        `;

        Utils.ModalManager.show('Edit Fuel Entry', formContent, () => fuelManager.saveFuelLog(logId));
        
        // Populate form with existing data after modal is shown
        Utils.populateForm({
            vin: log.vin,
            date_filled: log.date_filled,
            current_mileage: log.current_mileage,
            gallons: log.gallons,
            total_cost: log.total_cost,
            fuel_type: log.fuel_type
        });
        } catch (error) {
            console.error('Error loading fuel log for edit:', error);
            Utils.showAlert(`Error loading fuel log: ${error.message}`, 'danger');
        }
    },

    saveFuelLog: async (logId = null) => {
        const form = document.getElementById('fuelForm');
        const formData = new FormData(form);
        
        const logData = {
            vin: formData.get('vin'),
            date_filled: formData.get('date_filled'),
            current_mileage: parseInt(formData.get('current_mileage')),
            gallons: parseFloat(formData.get('gallons')),
            total_cost: parseFloat(formData.get('total_cost')),
            fuel_type: formData.get('fuel_type')
        };

        // Validation - check for empty strings and NaN values
        if (!logData.vin || logData.vin.trim() === '') {
            Utils.showAlert('Vehicle is required', 'danger');
            return;
        }
        
        if (!logData.date_filled || logData.date_filled.trim() === '') {
            Utils.showAlert('Date is required', 'danger');
            return;
        }
        
        if (isNaN(logData.current_mileage)) {
            Utils.showAlert('Current mileage must be a valid number', 'danger');
            return;
        }
        
        if (isNaN(logData.gallons)) {
            Utils.showAlert('Gallons must be a valid number', 'danger');
            return;
        }
        
        if (isNaN(logData.total_cost)) {
            Utils.showAlert('Total cost must be a valid number', 'danger');
            return;
        }
        
        if (!logData.fuel_type || logData.fuel_type.trim() === '') {
            Utils.showAlert('Fuel type is required', 'danger');
            return;
        }

        if (logData.current_mileage < 0) {
            Utils.showAlert('Mileage must be a positive number', 'danger');
            return;
        }

        if (logData.gallons <= 0) {
            Utils.showAlert('Gallons must be a positive number', 'danger');
            return;
        }

        if (logData.total_cost < 0) {
            Utils.showAlert('Total cost must be a positive number', 'danger');
            return;
        }

        try {
            if (logId) {
                // Update existing log
                await Database.updateRecord('FuelLog', logData, `fuel_log_id = ${logId}`);
                Utils.showAlert('Fuel log updated successfully', 'success');
            } else {
                // Add new log
                await Database.insertRecord('FuelLog', logData);
                Utils.showAlert('Fuel log added successfully', 'success');
            }

            Utils.ModalManager.hide();
            
            // Refresh all sections that depend on fuel log data
            await fuelManager.refreshAllRelatedSections();
        } catch (error) {
            console.error('Error saving fuel log:', error);
            Utils.showAlert(`Error saving fuel log: ${error.message}`, 'danger');
        }
    },

    // Refresh all sections that depend on fuel log data
    refreshAllRelatedSections: async () => {
        try {
            // Show loading indicator
            Utils.showAlert('Updating all related sections...', 'info');
            
            // Refresh fuel logs section
            await fuelManager.render();
            
            // Refresh vehicles section (since fuel logs are linked to vehicles)
            if (window.vehiclesManager) {
                await vehiclesManager.render();
            }
            
            // Refresh ownership section (since fuel costs affect vehicle ownership)
            if (window.ownsManager) {
                await ownsManager.render();
            }
            
            // Refresh expenses section (since fuel costs are expenses)
            if (window.expensesManager) {
                await expensesManager.render();
            }
            
            console.log('All fuel log-related sections refreshed successfully');
            
            // Show success message
            setTimeout(() => {
                Utils.showAlert('All sections updated successfully!', 'success');
            }, 500);
        } catch (error) {
            console.error('Error refreshing fuel log-related sections:', error);
            Utils.showAlert('Error updating sections. Please refresh the page.', 'danger');
        }
    },

    deleteFuelLog: async (logId) => {
        if (!confirm('Are you sure you want to delete this fuel log entry?')) {
            return;
        }

        try {
            await Database.deleteRecords('FuelLog', `fuel_log_id = ${logId}`);
            Utils.showAlert('Fuel log deleted successfully', 'success');
            
            // Refresh all sections that depend on fuel log data
            await fuelManager.refreshAllRelatedSections();
        } catch (error) {
            console.error('Error deleting fuel log:', error);
            Utils.showAlert(`Error deleting fuel log: ${error.message}`, 'danger');
        }
    },

    // Get fuel summary with aggregate functions
    getFuelSummary: async (userId, isAdmin) => {
        const userFilter = isAdmin ? '' : `JOIN Owns o ON fl.vin = o.vin WHERE o.user_id = ${userId}`;
        
        try {
            const summaryResult = await Database.select(`
                SELECT 
                    SUM(total_cost) as total_cost,
                    SUM(gallons) as total_gallons,
                    AVG(total_cost / gallons) as avg_price_per_gallon,
                    COUNT(*) as total_fill_ups
                FROM FuelLog fl
                ${userFilter}
            `);
            
            return {
                totalCost: summaryResult[0]?.total_cost || 0,
                totalGallons: summaryResult[0]?.total_gallons || 0,
                avgPricePerGallon: summaryResult[0]?.avg_price_per_gallon || 0,
                totalFillUps: summaryResult[0]?.total_fill_ups || 0
            };
        } catch (error) {
            console.error('Error getting fuel summary:', error);
            return {
                totalCost: 0,
                totalGallons: 0,
                avgPricePerGallon: 0,
                totalFillUps: 0
            };
        }
    },

    // Export fuel data to CSV
    exportToCSV: async () => {
        try {
            const userId = AuthManager.currentUser.user_id;
            const isAdmin = AuthManager.isAdmin();
            
            // Get fuel data
            let fuelLogsToShow = [];
            if (isAdmin) {
                fuelLogsToShow = await Database.select(`
                    SELECT fl.*, v.make, v.model, v.year 
                    FROM FuelLog fl
                    LEFT JOIN Vehicles v ON fl.vin = v.vin
                    ORDER BY fl.date_filled DESC
                `);
            } else {
                fuelLogsToShow = await Database.select(`
                    SELECT fl.*, v.make, v.model, v.year 
                    FROM FuelLog fl
                    LEFT JOIN Vehicles v ON fl.vin = v.vin
                    JOIN Owns o ON fl.vin = o.vin
                    WHERE o.user_id = ${userId}
                    ORDER BY fl.date_filled DESC
                `);
            }

            // Get summary data
            const fuelSummary = await fuelManager.getFuelSummary(userId, isAdmin);

            // Create CSV content
            let csvContent = 'Vehicle Fuel Data Report\n';
            csvContent += `Generated: ${new Date().toLocaleString()}\n`;
            csvContent += `User: ${AuthManager.currentUser.username}\n`;
            csvContent += `View: ${isAdmin ? 'Admin (All Data)' : 'User (Own Vehicles Only)'}\n\n`;

            // Summary Section
            csvContent += 'SUMMARY\n';
            csvContent += 'Metric,Value\n';
            csvContent += `Total Fuel Cost,${Utils.formatCurrency(fuelSummary.totalCost)}\n`;
            csvContent += `Total Gallons,${Number(fuelSummary.totalGallons).toFixed(2)}\n`;
            csvContent += `Average Price per Gallon,${Utils.formatCurrency(fuelSummary.avgPricePerGallon)}\n`;
            csvContent += `Total Fill-ups,${fuelSummary.totalFillUps}\n\n`;

            // Detailed Fuel Logs
            csvContent += 'DETAILED FUEL LOGS\n';
            csvContent += 'ID,Vehicle,Date,Mileage,Gallons,Cost,Fuel Type\n';
            fuelLogsToShow.forEach(log => {
                const vehicle = log.make && log.model && log.year ? 
                    `${log.year} ${log.make} ${log.model}` : 'Unknown Vehicle';
                csvContent += `${log.fuel_log_id},"${vehicle}",${log.date_filled},${log.current_mileage},${log.gallons},${Utils.formatCurrency(log.total_cost)},${log.fuel_type}\n`;
            });

            // Download the CSV file
            fuelManager.downloadCSV(csvContent, `fuel_data_${AuthManager.currentUser.username}_${new Date().toISOString().split('T')[0]}.csv`);
            
            Utils.showAlert('Fuel data exported to CSV successfully!', 'success');
        } catch (error) {
            console.error('Error exporting fuel data to CSV:', error);
            Utils.showAlert('Error exporting fuel data: ' + error.message, 'danger');
        }
    },

    // Helper function to download CSV
    downloadCSV: (csvContent, filename) => {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
};

// Make fuelManager available globally
window.fuelManager = fuelManager; 