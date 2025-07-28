// Vehicles Manager
const vehiclesManager = {
    container: null,

    init: () => {
        vehiclesManager.container = document.getElementById('vehicles-table-container');
        vehiclesManager.render();
    },

    render: () => {
        // Check if user is authenticated
        if (!AuthManager.isAuthenticated) {
            vehiclesManager.container.innerHTML = '<div class="alert alert-warning">Please log in to view vehicles.</div>';
            return;
        }

        // Get vehicles based on user permissions
        let vehiclesToShow = [];
        if (AuthManager.isAdmin()) {
            vehiclesToShow = dataStore.vehicles;
        } else {
            // Regular users can only see their own vehicles
            vehiclesToShow = AuthManager.getUserVehicles();
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
                        ${vehiclesToShow.map(vehicle => vehiclesManager.createVehicleRow(vehicle)).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        vehiclesManager.container.innerHTML = table;
    },

    createVehicleRow: (vehicle) => {
        const owners = Utils.getRelatedData.getVehicleOwners(vehicle.vin);
        const expenses = Utils.getRelatedData.getVehicleExpenses(vehicle.vin);
        const fuelLogs = Utils.getRelatedData.getVehicleFuelLogs(vehicle.vin);
        const services = dataStore.serviceRecords.filter(s => s.vin === vehicle.vin);
        
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
                                    
                                    <h6 class="mt-3">Fuel Logs (${fuelLogs.length})</h6>
                                    ${fuelLogs.length > 0 ? `
                                        <ul class="list-group list-group-flush">
                                            ${fuelLogs.map(log => `
                                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                                    ${Utils.formatDate(log.date_filled)} - ${log.gallons} gal ${log.fuel_type}
                                                    <span class="badge bg-info">${Utils.formatCurrency(log.total_cost)}</span>
                                                </li>
                                            `).join('')}
                                        </ul>
                                    ` : '<p class="text-muted">No fuel logs</p>'}
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
        const formContent = `
            <form id="vehicleForm">
                ${Utils.createFormField('VIN', 'vin', 'text', true).outerHTML}
                ${Utils.createFormField('Make', 'make', 'text', true).outerHTML}
                ${Utils.createFormField('Model', 'model', 'text', true).outerHTML}
                ${Utils.createFormField('Year', 'year', 'number', true).outerHTML}
            </form>
        `;

        Utils.ModalManager.show('Add New Vehicle', formContent, vehiclesManager.saveVehicle);
    },

    showEditForm: (vin) => {
        const vehicle = dataStore.vehicles.find(v => v.vin === vin);
        if (!vehicle) return;

        const formContent = `
            <form id="vehicleForm">
                ${Utils.createFormField('VIN', 'vin', 'text', true).outerHTML}
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
    },

    saveVehicle: (vin = null) => {
        const form = document.getElementById('vehicleForm');
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

        // Check for duplicate VIN
        const existingVehicle = dataStore.vehicles.find(v => v.vin === vehicleData.vin);
        
        if (existingVehicle && (!vin || existingVehicle.vin !== vin)) {
            Utils.showAlert('A vehicle with this VIN already exists', 'danger');
            return;
        }

        if (vin) {
            // Update existing vehicle
            const vehicleIndex = dataStore.vehicles.findIndex(v => v.vin === vin);
            if (vehicleIndex !== -1) {
                dataStore.vehicles[vehicleIndex] = { ...dataStore.vehicles[vehicleIndex], ...vehicleData };
                Utils.showAlert('Vehicle updated successfully', 'success');
            }
        } else {
            // Add new vehicle
            dataStore.vehicles.push(vehicleData);
            Utils.showAlert('Vehicle added successfully', 'success');
        }

        Utils.ModalManager.hide();
        vehiclesManager.render();
    },

    deleteVehicle: (vin) => {
        if (!confirm('Are you sure you want to delete this vehicle? This will also remove all associated records (ownership, services, expenses, etc.).')) {
            return;
        }

        // Remove vehicle from data store
        dataStore.vehicles = dataStore.vehicles.filter(v => v.vin !== vin);
        
        // Remove associated ownership records
        dataStore.owns = dataStore.owns.filter(own => own.vin !== vin);
        
        // Remove associated service records
        const serviceIds = dataStore.serviceRecords.filter(s => s.vin === vin).map(s => s.service_id);
        dataStore.serviceRecords = dataStore.serviceRecords.filter(s => s.vin !== vin);
        
        // Remove associated workedOn records
        dataStore.workedOn = dataStore.workedOn.filter(work => !serviceIds.includes(work.service_id));
        
        // Remove associated service types
        dataStore.serviceRecords_ServiceTypes = dataStore.serviceRecords_ServiceTypes.filter(st => !serviceIds.includes(st.service_id));
        
        // Remove associated parts
        dataStore.serviceRecords_Parts = dataStore.serviceRecords_Parts.filter(sp => !serviceIds.includes(sp.service_id));
        
        // Remove associated expenses
        dataStore.expenses = dataStore.expenses.filter(expense => expense.vin !== vin);
        
        // Remove associated fuel logs
        dataStore.fuelLog = dataStore.fuelLog.filter(log => log.vin !== vin);
        
        // Remove associated maintenance events
        dataStore.maintenanceEvents = dataStore.maintenanceEvents.filter(event => event.vin !== vin);

        Utils.showAlert('Vehicle deleted successfully', 'success');
        vehiclesManager.render();
    }
}; 