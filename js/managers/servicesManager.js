// Service Records Manager
const servicesManager = {
    container: null,

    init: () => {
        servicesManager.container = document.getElementById('services-table-container');
        servicesManager.render();
    },

    render: () => {
        // Check if user is authenticated
        if (!AuthManager.isAuthenticated) {
            servicesManager.container.innerHTML = '<div class="alert alert-warning">Please log in to view service records.</div>';
            return;
        }

        // Get service records based on user permissions
        let recordsToShow = [];
        if (AuthManager.isAdmin()) {
            recordsToShow = dataStore.serviceRecords;
        } else {
            // Regular users can only see their own service records
            recordsToShow = AuthManager.getUserServiceRecords();
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
                        ${recordsToShow.map(service => servicesManager.createServiceRow(service)).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        servicesManager.container.innerHTML = table;
    },

    createServiceRow: (service) => {
        const vehicle = dataStore.vehicles.find(v => v.vin === service.vin);
        const mechanics = Utils.getRelatedData.getServiceMechanics(service.service_id);
        const parts = Utils.getRelatedData.getServiceParts(service.service_id);
        const serviceTypes = Utils.getRelatedData.getServiceTypes(service.service_id);
        
        return `
            <tr>
                <td>${service.service_id}</td>
                <td>${vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Unknown Vehicle'}</td>
                <td>${Utils.formatDate(service.service_date)}</td>
                <td>${service.current_mileage.toLocaleString()}</td>
                <td>${Utils.formatCurrency(service.cost)}</td>
                <td>${service.description}</td>
                <td>
                    ${Utils.createRelationshipBadges(service, 'service')}
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
                                            <strong>Vehicle:</strong> ${vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.vin})` : 'Unknown Vehicle'}
                                        </li>
                                        <li class="list-group-item">
                                            <strong>Date:</strong> ${Utils.formatDate(service.service_date)}
                                        </li>
                                        <li class="list-group-item">
                                            <strong>Mileage:</strong> ${service.current_mileage.toLocaleString()}
                                        </li>
                                        <li class="list-group-item">
                                            <strong>Cost:</strong> ${Utils.formatCurrency(service.cost)}
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

    showAddForm: () => {
        const vehicleOptions = dataStore.vehicles.map(vehicle => ({
            value: vehicle.vin,
            text: `${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.vin})`
        }));

        const mechanicOptions = dataStore.mechanics.map(mechanic => ({
            value: mechanic.mechanic_id,
            text: `${mechanic.name} (${mechanic.email})`
        }));

        const serviceTypeOptions = dataStore.serviceTypes.map(type => ({
            value: type.service_type,
            text: type.service_type
        }));

        const partOptions = dataStore.parts.map(part => ({
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

        Utils.ModalManager.show('Add New Service Record', formContent, servicesManager.saveService);
    },

    showEditForm: (serviceId) => {
        const service = dataStore.serviceRecords.find(s => s.service_id === serviceId);
        if (!service) return;

        const vehicleOptions = dataStore.vehicles.map(vehicle => ({
            value: vehicle.vin,
            text: `${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.vin})`
        }));

        const formContent = `
            <form id="serviceForm">
                ${Utils.createFormField('Vehicle', 'vin', 'select', true, vehicleOptions).outerHTML}
                ${Utils.createFormField('Service Date', 'service_date', 'date', true).outerHTML}
                ${Utils.createFormField('Current Mileage', 'current_mileage', 'number', true).outerHTML}
                ${Utils.createFormField('Cost', 'cost', 'number', true).outerHTML}
                ${Utils.createFormField('Description', 'description', 'textarea', true).outerHTML}
            </form>
        `;

        // Populate form with existing data
        setTimeout(() => {
            document.getElementById('vin').value = service.vin;
            document.getElementById('service_date').value = service.service_date;
            document.getElementById('current_mileage').value = service.current_mileage;
            document.getElementById('cost').value = service.cost;
            document.getElementById('description').value = service.description;
        }, 100);

        Utils.ModalManager.show('Edit Service Record', formContent, () => servicesManager.saveService(serviceId));
    },

    saveService: (serviceId = null) => {
        const form = document.getElementById('serviceForm');
        const formData = new FormData(form);
        
        const serviceData = {
            vin: formData.get('vin'),
            service_date: formData.get('service_date'),
            current_mileage: parseInt(formData.get('current_mileage')),
            cost: parseFloat(formData.get('cost')),
            description: formData.get('description')
        };

        // Validation
        if (!serviceData.vin || !serviceData.service_date || !serviceData.current_mileage || !serviceData.cost || !serviceData.description) {
            Utils.showAlert('All fields are required', 'danger');
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

        if (serviceId) {
            // Update existing service
            const serviceIndex = dataStore.serviceRecords.findIndex(s => s.service_id === serviceId);
            if (serviceIndex !== -1) {
                dataStore.serviceRecords[serviceIndex] = { ...dataStore.serviceRecords[serviceIndex], ...serviceData };
                Utils.showAlert('Service record updated successfully', 'success');
            }
        } else {
            // Add new service
            const newService = {
                service_id: Utils.getNextId(dataStore.serviceRecords, 'service_id'),
                ...serviceData
            };
            dataStore.serviceRecords.push(newService);
            Utils.showAlert('Service record added successfully', 'success');
        }

        Utils.ModalManager.hide();
        servicesManager.render();
    },

    deleteService: (serviceId) => {
        if (!confirm('Are you sure you want to delete this service record? This will also remove all associated mechanic and part relationships.')) {
            return;
        }

        // Remove service from data store
        dataStore.serviceRecords = dataStore.serviceRecords.filter(s => s.service_id !== serviceId);
        
        // Remove associated workedOn records
        dataStore.workedOn = dataStore.workedOn.filter(work => work.service_id !== serviceId);
        
        // Remove associated service types
        dataStore.serviceRecords_ServiceTypes = dataStore.serviceRecords_ServiceTypes.filter(st => st.service_id !== serviceId);
        
        // Remove associated parts
        dataStore.serviceRecords_Parts = dataStore.serviceRecords_Parts.filter(sp => sp.service_id !== serviceId);

        Utils.showAlert('Service record deleted successfully', 'success');
        servicesManager.render();
    }
}; 