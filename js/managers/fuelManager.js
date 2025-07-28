// Fuel Log Manager
const fuelManager = {
    container: null,

    init: () => {
        fuelManager.container = document.getElementById('fuel-table-container');
        fuelManager.render();
    },

    render: () => {
        // Check if user is authenticated
        if (!AuthManager.isAuthenticated) {
            fuelManager.container.innerHTML = '<div class="alert alert-warning">Please log in to view fuel logs.</div>';
            return;
        }

        // Get fuel logs based on user permissions
        let fuelLogsToShow = [];
        if (AuthManager.isAdmin()) {
            fuelLogsToShow = dataStore.fuelLog;
        } else {
            // Regular users can only see their own fuel logs
            fuelLogsToShow = AuthManager.getUserFuelLogs();
        }

        const table = `
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
    },

    createFuelRow: (log) => {
        const vehicle = dataStore.vehicles.find(v => v.vin === log.vin);
        
        return `
            <tr>
                <td>${log.fuel_log_id}</td>
                <td>${vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Unknown Vehicle'}</td>
                <td>${Utils.formatDate(log.date_filled)}</td>
                <td>${log.current_mileage.toLocaleString()}</td>
                <td>${log.gallons.toFixed(2)} gal</td>
                <td>${Utils.formatCurrency(log.total_cost)}</td>
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

    showAddForm: () => {
        const vehicleOptions = dataStore.vehicles.map(vehicle => ({
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

        Utils.ModalManager.show('Add New Fuel Entry', formContent, fuelManager.saveFuelLog);
    },

    showEditForm: (logId) => {
        const log = dataStore.fuelLog.find(l => l.fuel_log_id === logId);
        if (!log) return;

        const vehicleOptions = dataStore.vehicles.map(vehicle => ({
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

        // Populate form with existing data
        setTimeout(() => {
            document.getElementById('vin').value = log.vin;
            document.getElementById('date_filled').value = log.date_filled;
            document.getElementById('current_mileage').value = log.current_mileage;
            document.getElementById('gallons').value = log.gallons;
            document.getElementById('total_cost').value = log.total_cost;
            document.getElementById('fuel_type').value = log.fuel_type;
        }, 100);

        Utils.ModalManager.show('Edit Fuel Entry', formContent, () => fuelManager.saveFuelLog(logId));
    },

    saveFuelLog: (logId = null) => {
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

        // Validation
        if (!logData.vin || !logData.date_filled || !logData.current_mileage || !logData.gallons || !logData.total_cost || !logData.fuel_type) {
            Utils.showAlert('All fields are required', 'danger');
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

        if (logId) {
            // Update existing log
            const logIndex = dataStore.fuelLog.findIndex(l => l.fuel_log_id === logId);
            if (logIndex !== -1) {
                dataStore.fuelLog[logIndex] = { ...dataStore.fuelLog[logIndex], ...logData };
                Utils.showAlert('Fuel log updated successfully', 'success');
            }
        } else {
            // Add new log
            const newLog = {
                fuel_log_id: Utils.getNextId(dataStore.fuelLog, 'fuel_log_id'),
                ...logData
            };
            dataStore.fuelLog.push(newLog);
            Utils.showAlert('Fuel log added successfully', 'success');
        }

        Utils.ModalManager.hide();
        fuelManager.render();
    },

    deleteFuelLog: (logId) => {
        if (!confirm('Are you sure you want to delete this fuel log entry?')) {
            return;
        }

        dataStore.fuelLog = dataStore.fuelLog.filter(l => l.fuel_log_id !== logId);
        Utils.showAlert('Fuel log deleted successfully', 'success');
        fuelManager.render();
    }
}; 