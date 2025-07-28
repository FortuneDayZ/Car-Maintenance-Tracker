// Maintenance Events Manager
const maintenanceManager = {
    container: null,

    init: () => {
        maintenanceManager.container = document.getElementById('maintenance-table-container');
        maintenanceManager.render();
    },

    render: () => {
        // Check if user is authenticated
        if (!AuthManager.isAuthenticated) {
            maintenanceManager.container.innerHTML = '<div class="alert alert-warning">Please log in to view maintenance events.</div>';
            return;
        }

        // Get maintenance events based on user permissions
        let eventsToShow = [];
        if (AuthManager.isAdmin()) {
            eventsToShow = dataStore.maintenanceEvents;
        } else {
            // Regular users can only see their own maintenance events
            eventsToShow = AuthManager.getUserMaintenanceEvents();
        }

        const table = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>User</th>
                            <th>Vehicle</th>
                            <th>Date</th>
                            <th>Mileage</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${eventsToShow.map(event => maintenanceManager.createMaintenanceRow(event)).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        maintenanceManager.container.innerHTML = table;
    },

    createMaintenanceRow: (event) => {
        const user = dataStore.users.find(u => u.user_id === event.user_id);
        const vehicle = dataStore.vehicles.find(v => v.vin === event.vin);
        const serviceTypes = dataStore.maintenanceEvents_ServiceTypes
            .filter(me => me.event_id === event.event_id)
            .map(me => me.service_type);
        
        const statusClass = event.status === 'completed' ? 'success' : 
                           event.status === 'overdue' ? 'danger' : 'warning';
        
        return `
            <tr>
                <td>${event.event_id}</td>
                <td>${user ? user.username : 'Unknown User'}</td>
                <td>${vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Unknown Vehicle'}</td>
                <td>${Utils.formatDate(event.rec_date)}</td>
                <td>${event.rec_mileage.toLocaleString()}</td>
                <td><span class="badge bg-${statusClass}">${event.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-info" onclick="maintenanceManager.showDetails(${event.event_id})">
                        <i class="fas fa-info-circle"></i> Details
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="maintenanceManager.showEditForm(${event.event_id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="maintenanceManager.deleteMaintenance(${event.event_id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
            <tr id="maintenance-details-${event.event_id}" class="detail-row" style="display: none;">
                <td colspan="7">
                    <div class="card">
                        <div class="card-header">
                            <h6>Maintenance Event Details</h6>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6>Event Information</h6>
                                    <ul class="list-group list-group-flush">
                                        <li class="list-group-item">
                                            <strong>User:</strong> ${user ? user.username : 'Unknown User'}
                                        </li>
                                        <li class="list-group-item">
                                            <strong>Vehicle:</strong> ${vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.vin})` : 'Unknown Vehicle'}
                                        </li>
                                        <li class="list-group-item">
                                            <strong>Date:</strong> ${Utils.formatDate(event.rec_date)}
                                        </li>
                                        <li class="list-group-item">
                                            <strong>Mileage:</strong> ${event.rec_mileage.toLocaleString()}
                                        </li>
                                        <li class="list-group-item">
                                            <strong>Status:</strong> <span class="badge bg-${statusClass}">${event.status}</span>
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
                                    <h6>Reminder Notifications</h6>
                                    ${(() => {
                                        const reminders = dataStore.reminderNotifications.filter(r => r.event_id === event.event_id);
                                        return reminders.length > 0 ? `
                                            <ul class="list-group list-group-flush">
                                                ${reminders.map(reminder => `
                                                    <li class="list-group-item d-flex justify-content-between align-items-center">
                                                        ${reminder.message}
                                                        <span class="badge bg-${reminder.is_sent ? 'success' : 'warning'}">
                                                            ${reminder.is_sent ? 'Sent' : 'Pending'}
                                                        </span>
                                                    </li>
                                                `).join('')}
                                            </ul>
                                        ` : '<p class="text-muted">No reminders</p>';
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    },

    showDetails: (eventId) => {
        const detailRow = document.getElementById(`maintenance-details-${eventId}`);
        const button = event.target.closest('button');
        Utils.toggleDetailRow(button, detailRow);
    },

    showAddForm: () => {
        const userOptions = dataStore.users.map(user => ({
            value: user.user_id,
            text: `${user.username} (${user.email})`
        }));

        const vehicleOptions = dataStore.vehicles.map(vehicle => ({
            value: vehicle.vin,
            text: `${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.vin})`
        }));

        const statusOptions = [
            { value: 'pending', text: 'Pending' },
            { value: 'completed', text: 'Completed' },
            { value: 'overdue', text: 'Overdue' }
        ];

        const serviceTypeOptions = dataStore.serviceTypes.map(type => ({
            value: type.service_type,
            text: type.service_type
        }));

        const formContent = `
            <form id="maintenanceForm">
                ${Utils.createFormField('User', 'user_id', 'select', true, userOptions).outerHTML}
                ${Utils.createFormField('Vehicle', 'vin', 'select', true, vehicleOptions).outerHTML}
                ${Utils.createFormField('Date', 'rec_date', 'date', true).outerHTML}
                ${Utils.createFormField('Mileage', 'rec_mileage', 'number', true).outerHTML}
                ${Utils.createFormField('Status', 'status', 'select', true, statusOptions).outerHTML}
                ${Utils.createFormField('Service Types', 'service_types', 'select', false, serviceTypeOptions).outerHTML}
            </form>
        `;

        Utils.ModalManager.show('Add New Maintenance Event', formContent, maintenanceManager.saveMaintenance);
    },

    showEditForm: (eventId) => {
        const event = dataStore.maintenanceEvents.find(e => e.event_id === eventId);
        if (!event) return;

        const userOptions = dataStore.users.map(user => ({
            value: user.user_id,
            text: `${user.username} (${user.email})`
        }));

        const vehicleOptions = dataStore.vehicles.map(vehicle => ({
            value: vehicle.vin,
            text: `${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.vin})`
        }));

        const statusOptions = [
            { value: 'pending', text: 'Pending' },
            { value: 'completed', text: 'Completed' },
            { value: 'overdue', text: 'Overdue' }
        ];

        const formContent = `
            <form id="maintenanceForm">
                ${Utils.createFormField('User', 'user_id', 'select', true, userOptions).outerHTML}
                ${Utils.createFormField('Vehicle', 'vin', 'select', true, vehicleOptions).outerHTML}
                ${Utils.createFormField('Date', 'rec_date', 'date', true).outerHTML}
                ${Utils.createFormField('Mileage', 'rec_mileage', 'number', true).outerHTML}
                ${Utils.createFormField('Status', 'status', 'select', true, statusOptions).outerHTML}
            </form>
        `;

        // Populate form with existing data
        setTimeout(() => {
            document.getElementById('user_id').value = event.user_id;
            document.getElementById('vin').value = event.vin;
            document.getElementById('rec_date').value = event.rec_date;
            document.getElementById('rec_mileage').value = event.rec_mileage;
            document.getElementById('status').value = event.status;
        }, 100);

        Utils.ModalManager.show('Edit Maintenance Event', formContent, () => maintenanceManager.saveMaintenance(eventId));
    },

    saveMaintenance: (eventId = null) => {
        const form = document.getElementById('maintenanceForm');
        const formData = new FormData(form);
        
        const maintenanceData = {
            user_id: parseInt(formData.get('user_id')),
            vin: formData.get('vin'),
            rec_date: formData.get('rec_date'),
            rec_mileage: parseInt(formData.get('rec_mileage')),
            status: formData.get('status')
        };

        // Validation
        if (!maintenanceData.user_id || !maintenanceData.vin || !maintenanceData.rec_date || !maintenanceData.rec_mileage || !maintenanceData.status) {
            Utils.showAlert('All fields are required', 'danger');
            return;
        }

        if (maintenanceData.rec_mileage < 0) {
            Utils.showAlert('Mileage must be a positive number', 'danger');
            return;
        }

        if (eventId) {
            // Update existing event
            const eventIndex = dataStore.maintenanceEvents.findIndex(e => e.event_id === eventId);
            if (eventIndex !== -1) {
                dataStore.maintenanceEvents[eventIndex] = { ...dataStore.maintenanceEvents[eventIndex], ...maintenanceData };
                Utils.showAlert('Maintenance event updated successfully', 'success');
            }
        } else {
            // Add new event
            const newEvent = {
                event_id: Utils.getNextId(dataStore.maintenanceEvents, 'event_id'),
                ...maintenanceData
            };
            dataStore.maintenanceEvents.push(newEvent);
            Utils.showAlert('Maintenance event added successfully', 'success');
        }

        Utils.ModalManager.hide();
        maintenanceManager.render();
    },

    deleteMaintenance: (eventId) => {
        if (!confirm('Are you sure you want to delete this maintenance event? This will also remove all associated reminders.')) {
            return;
        }

        // Remove event from data store
        dataStore.maintenanceEvents = dataStore.maintenanceEvents.filter(e => e.event_id !== eventId);
        
        // Remove associated service types
        dataStore.maintenanceEvents_ServiceTypes = dataStore.maintenanceEvents_ServiceTypes.filter(me => me.event_id !== eventId);
        
        // Remove associated reminders
        dataStore.reminderNotifications = dataStore.reminderNotifications.filter(r => r.event_id !== eventId);

        Utils.showAlert('Maintenance event deleted successfully', 'success');
        maintenanceManager.render();
    }
}; 