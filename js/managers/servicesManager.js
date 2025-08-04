// Service Records Manager
const servicesManager = {
    container: null,

    init: () => {
        servicesManager.container = document.getElementById('services-table-container');
        servicesManager.render();
    },

    render: async () => {
        // Check if user is authenticated
        if (!AuthManager.isAuthenticated) {
            servicesManager.container.innerHTML = '<div class="alert alert-warning">Please log in to view service records.</div>';
            return;
        }

        try {
            // Get service records from database based on user permissions
            let recordsToShow = [];
            if (AuthManager.isAdmin()) {
                recordsToShow = await Database.select(`
                    SELECT sr.*, v.make, v.model, v.year 
                    FROM ServiceRecords sr
                    LEFT JOIN Vehicles v ON sr.vin = v.vin
                    ORDER BY sr.service_date DESC
                `);
            } else {
                // Regular users can only see their own service records
                const userId = AuthManager.currentUser.user_id;
                recordsToShow = await Database.select(`
                    SELECT sr.*, v.make, v.model, v.year 
                    FROM ServiceRecords sr
                    LEFT JOIN Vehicles v ON sr.vin = v.vin
                    JOIN Owns o ON sr.vin = o.vin
                    WHERE o.user_id = ${userId}
                    ORDER BY sr.service_date DESC
                `);
            }

            // Create table rows asynchronously
            const tableRows = [];
            for (const service of recordsToShow) {
                const row = await servicesManager.createServiceRow(service);
                tableRows.push(row);
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
                                <th>Cost</th>
                                <th>Description</th>
                                <th>Relationships</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows.join('')}
                        </tbody>
                    </table>
                </div>
            `;
            
            servicesManager.container.innerHTML = table;
        } catch (error) {
            console.error('Error loading service records:', error);
            servicesManager.container.innerHTML = `
                <div class="alert alert-danger">
                    <h4><i class="fas fa-exclamation-triangle"></i> Error Loading Service Records</h4>
                    <p>${error.message}</p>
                    <button class="btn btn-primary" onclick="servicesManager.render()">
                        <i class="fas fa-sync"></i> Retry
                    </button>
                </div>
            `;
        }
    },

    createServiceRow: async (service) => {
        const vehicle = service.make && service.model && service.year ? 
            `${service.year} ${service.make} ${service.model}` : 'Unknown Vehicle';
        
        // Fetch mechanics for this service record
        let mechanics = [];
        try {
            const mechanicsResult = await Database.select(`
                SELECT m.mechanic_id, m.name, m.email, m.phone_number
                FROM Mechanics m
                JOIN WorkedOn wo ON m.mechanic_id = wo.mechanic_id
                WHERE wo.service_id = ${service.service_id}
            `);
            mechanics = mechanicsResult;
        } catch (error) {
            console.error('Error fetching mechanics for service:', service.service_id, error);
        }
        
        // Fetch parts for this service record
        let parts = [];
        try {
            const partsResult = await Database.select(`
                SELECT p.name, p.manufacturer, p.unit_price
                FROM Parts p
                JOIN ServiceRecords_Parts srp ON p.part_id = srp.part_id
                WHERE srp.service_id = ${service.service_id}
            `);
            parts = partsResult;
        } catch (error) {
            console.error('Error fetching parts for service:', service.service_id, error);
        }
        
        // Fetch service types for this service record
        let serviceTypes = [];
        try {
            const serviceTypesResult = await Database.select(`
                SELECT st.service_type 
                FROM ServiceTypes st
                JOIN ServiceRecords_ServiceTypes srst ON st.service_type = srst.service_type
                WHERE srst.service_id = ${service.service_id}
            `);
            serviceTypes = serviceTypesResult.map(st => st.service_type);
        } catch (error) {
            console.error('Error fetching service types for service:', service.service_id, error);
        }
        
        // Safely convert numeric values
        const currentMileage = Number(service.current_mileage) || 0;
        const cost = Number(service.cost) || 0;
        
        return `
            <tr>
                <td>${service.service_id}</td>
                <td>${vehicle}</td>
                <td>${Utils.formatDate(service.service_date)}</td>
                <td>${currentMileage.toLocaleString()}</td>
                <td>${Utils.formatCurrency(cost)}</td>
                <td>${service.description}</td>
                <td>
                    <span class="badge bg-info" data-service-id="${service.service_id}" data-mechanics-count="${mechanics.length}">${mechanics.length} Mechanic(s)</span>
                    <span class="badge bg-primary">${serviceTypes.length} Service Type(s)</span>
                    <span class="badge bg-warning">${parts.length} Part(s)</span>
                    <button class="btn btn-sm btn-outline-info" onclick="servicesManager.showDetails(${service.service_id})">
                        <i class="fas fa-info-circle"></i> Details
                    </button>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="servicesManager.showEditForm(${service.service_id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="servicesManager.deleteService(${service.service_id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
            <tr id="service-details-${service.service_id}" class="detail-row" style="display: none;">
                <td colspan="8">
                    <div class="card">
                        <div class="card-header">
                            <h6>Service Details - ${service.description}</h6>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6>Service Information</h6>
                                    <ul class="list-group list-group-flush">
                                        <li class="list-group-item">
                                            <strong>Vehicle:</strong> ${vehicle}
                                        </li>
                                        <li class="list-group-item">
                                            <strong>Date:</strong> ${Utils.formatDate(service.service_date)}
                                        </li>
                                        <li class="list-group-item">
                                            <strong>Mileage:</strong> ${currentMileage.toLocaleString()}
                                        </li>
                                        <li class="list-group-item">
                                            <strong>Cost:</strong> ${Utils.formatCurrency(cost)}
                                        </li>
                                        <li class="list-group-item">
                                            <strong>Description:</strong> ${service.description}
                                        </li>
                                    </ul>
                                    
                                    <h6 class="mt-3">Service Types (${serviceTypes.length})</h6>
                                    ${serviceTypes.length > 0 ? `
                                        <div class="d-flex flex-wrap gap-1">
                                            ${serviceTypes.map(type => `
                                                <span class="badge bg-primary">${type}</span>
                                            `).join('')}
                                        </div>
                                    ` : '<p class="text-muted">No service types specified</p>'}
                                </div>
                                <div class="col-md-6">
                                    <h6>Mechanics (${mechanics.length})</h6>
                                    ${mechanics.length > 0 ? `
                                        <ul class="list-group list-group-flush">
                                            ${mechanics.map(mechanic => `
                                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                                    ${mechanic.name}
                                                    <span class="badge bg-secondary">${mechanic.email}</span>
                                                </li>
                                            `).join('')}
                                        </ul>
                                    ` : '<p class="text-muted">No mechanics assigned</p>'}
                                    
                                    <h6 class="mt-3">Parts Used (${parts.length})</h6>
                                    ${parts.length > 0 ? `
                                        <ul class="list-group list-group-flush">
                                            ${parts.map(part => `
                                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                                    ${part.name} (${part.manufacturer})
                                                    <span class="badge bg-warning">${Utils.formatCurrency(part.unit_price)}</span>
                                                </li>
                                            `).join('')}
                                        </ul>
                                    ` : '<p class="text-muted">No parts used</p>'}
                                </div>
                            </div>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    },

    showDetails: (serviceId) => {
        const detailRow = document.getElementById(`service-details-${serviceId}`);
        const button = event.target.closest('button');
        Utils.toggleDetailRow(button, detailRow);
    },

    showAddForm: async () => {
        try {
            let vehicles;
            if (AuthManager.isAdmin()) {
                vehicles = await Database.select('SELECT vin, make, model, year FROM Vehicles');
            } else {
                // Regular users can only add service records for vehicles they own
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

            const mechanics = await Database.select('SELECT mechanic_id, name, email FROM Mechanics');
            const mechanicOptions = mechanics.map(mechanic => ({
                value: mechanic.mechanic_id,
                text: `${mechanic.name} (${mechanic.email})`
            }));

            const serviceTypes = await Database.select('SELECT service_type FROM ServiceTypes');
            const serviceTypeOptions = serviceTypes.map(type => ({
                value: type.service_type,
                text: type.service_type
            }));

            const parts = await Database.select('SELECT part_id, name, manufacturer, unit_price FROM Parts');
            const partOptions = parts.map(part => ({
                value: part.part_id,
                text: `${part.name} - ${part.manufacturer} (${Utils.formatCurrency(part.unit_price)})`
            }));

        const formContent = `
            <form id="serviceForm">
                ${Utils.createFormField('Vehicle', 'vin', 'select', true, vehicleOptions).outerHTML}
                ${Utils.createFormField('Service Date', 'service_date', 'date', true).outerHTML}
                ${Utils.createFormField('Current Mileage', 'current_mileage', 'number', true).outerHTML}
                ${Utils.createFormField('Cost', 'cost', 'number', true).outerHTML}
                ${Utils.createFormField('Description', 'description', 'textarea', true).outerHTML}
                ${Utils.createFormField('Mechanics', 'mechanics', 'select', false, mechanicOptions).outerHTML}
                ${Utils.createFormField('Service Types', 'service_types', 'select', false, serviceTypeOptions).outerHTML}
                ${Utils.createFormField('Parts Used', 'parts', 'select', false, partOptions).outerHTML}
            </form>
        `;

        Utils.ModalManager.show('Add New Service Record', formContent, () => servicesManager.saveService());
        } catch (error) {
            console.error('Error loading data for service form:', error);
            Utils.showAlert(`Error loading form data: ${error.message}`, 'danger');
        }
    },

    showEditForm: async (serviceId) => {
        try {
            const services = await Database.select(`SELECT * FROM ServiceRecords WHERE service_id = ${serviceId}`);
            const service = services[0];
            if (!service) {
                Utils.showAlert('Service record not found!', 'danger');
                return;
            }

            let vehicles;
            if (AuthManager.isAdmin()) {
                vehicles = await Database.select('SELECT vin, make, model, year FROM Vehicles');
            } else {
                // Regular users can only edit service records for vehicles they own
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

            // Get service types for the form
            const serviceTypes = await Database.select('SELECT service_type FROM ServiceTypes');
            const serviceTypeOptions = serviceTypes.map(type => ({
                value: type.service_type,
                text: type.service_type
            }));

            // Get current service types for this service
            let currentServiceType = '';
            try {
                const currentServiceTypes = await Database.select(`
                    SELECT st.service_type 
                    FROM ServiceTypes st
                    JOIN ServiceRecords_ServiceTypes srst ON st.service_type = srst.service_type
                    WHERE srst.service_id = ${serviceId}
                `);
                if (currentServiceTypes.length > 0) {
                    currentServiceType = currentServiceTypes[0].service_type;
                }
            } catch (error) {
                console.error('Error fetching current service types:', error);
            }

            // Get parts for the form
            const parts = await Database.select('SELECT part_id, name, manufacturer, unit_price FROM Parts');
            const partOptions = parts.map(part => ({
                value: part.part_id,
                text: `${part.name} - ${part.manufacturer} (${Utils.formatCurrency(part.unit_price)})`
            }));
            // Get current part for this service
            let currentPart = '';
            try {
                const currentParts = await Database.select(`
                    SELECT p.part_id 
                    FROM Parts p
                    JOIN ServiceRecords_Parts srp ON p.part_id = srp.part_id
                    WHERE srp.service_id = ${serviceId}
                `);
                if (currentParts.length > 0) {
                    currentPart = currentParts[0].part_id;
                }
            } catch (error) {
                console.error('Error fetching current parts:', error);
            }

            // Get mechanics for the form
            const mechanics = await Database.select('SELECT mechanic_id, name, email FROM Mechanics');
            const mechanicOptions = mechanics.map(mechanic => ({
                value: mechanic.mechanic_id,
                text: `${mechanic.name} (${mechanic.email})`
            }));

            // Get current mechanics for this service
            let currentMechanics = '';
            try {
                const currentMechanicsResult = await Database.select(`
                    SELECT m.mechanic_id, m.name, m.email
                    FROM Mechanics m
                    JOIN WorkedOn wo ON m.mechanic_id = wo.mechanic_id
                    WHERE wo.service_id = ${serviceId}
                `);
                if (currentMechanicsResult.length > 0) {
                    currentMechanics = currentMechanicsResult[0].mechanic_id;
                }
            } catch (error) {
                console.error('Error fetching current mechanics:', error);
            }

        const formContent = `
            <form id="serviceForm">
                ${Utils.createFormField('Vehicle', 'vin', 'select', true, vehicleOptions).outerHTML}
                ${Utils.createFormField('Service Date', 'service_date', 'date', true).outerHTML}
                ${Utils.createFormField('Current Mileage', 'current_mileage', 'number', true).outerHTML}
                ${Utils.createFormField('Cost', 'cost', 'number', true).outerHTML}
                ${Utils.createFormField('Description', 'description', 'textarea', true).outerHTML}
                ${Utils.createFormField('Mechanics', 'mechanics', 'select', false, mechanicOptions).outerHTML}
                ${Utils.createFormField('Service Types', 'service_types', 'select', false, serviceTypeOptions).outerHTML}
                ${Utils.createFormField('Parts Used', 'parts', 'select', false, partOptions).outerHTML}
            </form>
        `;

        Utils.ModalManager.show('Edit Service Record', formContent, () => servicesManager.saveService(serviceId));
        
        // Populate form with existing data after modal is shown
                    Utils.populateForm({
                vin: service.vin,
                service_date: service.service_date,
                current_mileage: service.current_mileage,
                cost: service.cost,
                description: service.description,
                service_types: currentServiceType,
                parts: currentPart,
                mechanics: currentMechanics
            });
        } catch (error) {
            console.error('Error loading service record for edit:', error);
            Utils.showAlert(`Error loading service record: ${error.message}`, 'danger');
        }
    },

    saveService: async (serviceId = null) => {
        const form = document.getElementById('serviceForm');
        const formData = new FormData(form);
        
        const serviceData = {
            vin: formData.get('vin'),
            service_date: formData.get('service_date'),
            current_mileage: parseInt(formData.get('current_mileage')),
            cost: parseFloat(formData.get('cost')),
            description: formData.get('description')
        };

        // Get selected service types
        const selectedServiceTypes = formData.get('service_types');
        // Get selected part
        const selectedParts = formData.get('parts');
        // Get selected mechanics
        const selectedMechanics = formData.get('mechanics');

        // Validation - check for empty strings and NaN values
        if (!serviceData.vin || serviceData.vin.trim() === '') {
            Utils.showAlert('Vehicle is required', 'danger');
            return;
        }
        
        if (!serviceData.service_date || serviceData.service_date.trim() === '') {
            Utils.showAlert('Service date is required', 'danger');
            return;
        }
        
        if (isNaN(serviceData.current_mileage)) {
            Utils.showAlert('Current mileage must be a valid number', 'danger');
            return;
        }
        
        if (isNaN(serviceData.cost)) {
            Utils.showAlert('Cost must be a valid number', 'danger');
            return;
        }
        
        if (!serviceData.description || serviceData.description.trim() === '') {
            Utils.showAlert('Description is required', 'danger');
            return;
        }

        if (serviceData.current_mileage < 0) {
            Utils.showAlert('Mileage must be a positive number', 'danger');
            return;
        }

        if (serviceData.cost < 0) {
            Utils.showAlert('Cost must be a positive number', 'danger');
            return;
        }

        try {
            let newServiceId = serviceId;
            
            if (serviceId) {
                // Update existing service
                await Database.updateRecord('ServiceRecords', serviceData, `service_id = ${serviceId}`);
                Utils.showAlert('Service record updated successfully', 'success');
            } else {
                // Add new service
                const result = await Database.insertRecord('ServiceRecords', serviceData);
                newServiceId = result.insertId; // Get the ID of the newly inserted record
                Utils.showAlert('Service record added successfully', 'success');
            }

            // Handle service types and parts
            if (newServiceId) {
                // Remove any existing service types for this service
                await Database.deleteRecords('ServiceRecords_ServiceTypes', `service_id = ${newServiceId}`);
                // Add the selected service type if one was chosen
                if (selectedServiceTypes && selectedServiceTypes.trim() !== '') {
                    await Database.insertRecord('ServiceRecords_ServiceTypes', {
                        service_id: newServiceId,
                        service_type: selectedServiceTypes
                    });
                }
                // Remove any existing parts for this service
                await Database.deleteRecords('ServiceRecords_Parts', `service_id = ${newServiceId}`);
                // Add the selected part if one was chosen
                if (selectedParts && selectedParts.trim() !== '') {
                    await Database.insertRecord('ServiceRecords_Parts', {
                        service_id: newServiceId,
                        part_id: parseInt(selectedParts)
                    });
                }
            }

            // Handle mechanics
            if (newServiceId) {
                // Remove any existing mechanics for this service
                await Database.deleteRecords('WorkedOn', `service_id = ${newServiceId}`);
                // Add the selected mechanic if one was chosen
                if (selectedMechanics && selectedMechanics.trim() !== '') {
                    await Database.insertRecord('WorkedOn', {
                        service_id: newServiceId,
                        mechanic_id: parseInt(selectedMechanics)
                    });
                }
            }

            // Create maintenance expense automatically for new service records
            if (!serviceId && newServiceId) {
                try {
                    await expensesManager.createMaintenanceExpenseFromService(newServiceId);
                    console.log('Maintenance expense created automatically for service ID:', newServiceId);
                } catch (error) {
                    console.error('Error creating maintenance expense:', error);
                    // Don't fail the service creation if expense creation fails
                }
            }

            Utils.ModalManager.hide();
            
            // Refresh all sections that depend on service data
            await servicesManager.refreshAllRelatedSections();
        } catch (error) {
            console.error('Error saving service record:', error);
            Utils.showAlert(`Error saving service record: ${error.message}`, 'danger');
        }
    },

    // Refresh all sections that depend on service data
    refreshAllRelatedSections: async () => {
        try {
            // Show loading indicator
            Utils.showAlert('Updating all related sections...', 'info');
            
            // Refresh services section
            await servicesManager.render();
            
            // Refresh mechanics section (since mechanics work on services)
            if (window.mechanicsManager) {
                await mechanicsManager.render();
            }
            
            // Refresh vehicles section (since services are linked to vehicles)
            if (window.vehiclesManager) {
                await vehiclesManager.render();
            }
            
            // Refresh expenses section (since services are expenses)
            if (window.expensesManager) {
                await expensesManager.render();
            }
            
            console.log('All service-related sections refreshed successfully');
            
            // Show success message
            setTimeout(() => {
                Utils.showAlert('All sections updated successfully!', 'success');
            }, 500);
        } catch (error) {
            console.error('Error refreshing service-related sections:', error);
            Utils.showAlert('Error updating sections. Please refresh the page.', 'danger');
        }
    },

    deleteService: async (serviceId) => {
        if (!confirm('Are you sure you want to delete this service record? This will also remove all associated mechanic and part relationships.')) {
            return;
        }

        try {
            // Remove associated maintenance expenses first
            try {
                const maintenanceExpenses = await Database.select(`
                    SELECT expense_id FROM MaintenanceExpenses 
                    WHERE service_id = ${serviceId}
                `);
                
                for (const me of maintenanceExpenses) {
                    // Delete the main expense record
                    await Database.deleteRecords('Expenses', `expense_id = ${me.expense_id}`);
                }
                
                // Delete maintenance expense records
                await Database.deleteRecords('MaintenanceExpenses', `service_id = ${serviceId}`);
            } catch (error) {
                console.log('No maintenance expenses to delete or table may not exist');
            }
            
            // Remove service from database
            await Database.deleteRecords('ServiceRecords', `service_id = ${serviceId}`);
            
            // Remove associated workedOn records (if table exists)
            try {
                await Database.deleteRecords('WorkedOn', `service_id = ${serviceId}`);
            } catch (error) {
                console.log('WorkedOn table may not exist, skipping relationship cleanup');
            }
            
            // Remove associated service types (if table exists)
            try {
                await Database.deleteRecords('ServiceRecords_ServiceTypes', `service_id = ${serviceId}`);
            } catch (error) {
                console.log('ServiceRecords_ServiceTypes table may not exist, skipping relationship cleanup');
            }
            
            // Remove associated parts (if table exists)
            try {
                await Database.deleteRecords('ServiceRecords_Parts', `service_id = ${serviceId}`);
            } catch (error) {
                console.log('ServiceRecords_Parts table may not exist, skipping relationship cleanup');
            }

            Utils.showAlert('Service record deleted successfully', 'success');
            
            // Refresh all sections that depend on service data
            await servicesManager.refreshAllRelatedSections();
        } catch (error) {
            console.error('Error deleting service record:', error);
            Utils.showAlert(`Error deleting service record: ${error.message}`, 'danger');
        }
    }
};

// Make servicesManager available globally
window.servicesManager = servicesManager; 