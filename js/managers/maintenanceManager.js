// Maintenance Events Manager
const maintenanceManager = {
    container: null,
    reminderCheckInterval: null,

    init: () => {
        maintenanceManager.container = document.getElementById('maintenance-table-container');
        maintenanceManager.render();
        maintenanceManager.startReminderCheck();
    },

    // Start checking for due reminders
    startReminderCheck: () => {
        // Check immediately when page loads
        maintenanceManager.checkDueReminders();
        
        // Then check every 5 minutes
        maintenanceManager.reminderCheckInterval = setInterval(() => {
            maintenanceManager.checkDueReminders();
        }, 5 * 60 * 1000); // 5 minutes
    },

    // Check for reminders that are due today
    checkDueReminders: async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const dueReminders = await Database.select(`
                SELECT r.*, me.rec_date, me.rec_mileage, v.make, v.model, v.year
                FROM Reminder r
                JOIN MaintenanceEvents me ON r.event_id = me.event_id
                LEFT JOIN Vehicles v ON me.vin = v.vin
                WHERE r.send_date = '${today}' 
                AND r.is_sent = 0
                ORDER BY r.send_date ASC
            `);

            dueReminders.forEach(reminder => {
                maintenanceManager.showReminderPopup(reminder);
            });
        } catch (error) {
            console.error('Error checking due reminders:', error);
        }
    },

    // Show popup for a due reminder
    showReminderPopup: (reminder) => {
        const vehicle = reminder.make && reminder.model && reminder.year ? 
            `${reminder.year} ${reminder.make} ${reminder.model}` : 'Unknown Vehicle';

        const popupContent = `
            <div class="reminder-popup" style="
                position: fixed;
                top: 20px;
                right: 20px;
                width: 400px;
                background: white;
                border: 2px solid #007bff;
                border-radius: 10px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                z-index: 9999;
                animation: slideInRight 0.3s ease-out;
            ">
                <div class="card-header bg-primary text-white" style="border-radius: 8px 8px 0 0;">
                    <div class="d-flex justify-content-between align-items-center">
                        <h6 class="mb-0">
                            <i class="fas fa-bell"></i> Maintenance Reminder
                        </h6>
                        <button type="button" class="btn-close btn-close-white" onclick="this.closest('.reminder-popup').remove()"></button>
                    </div>
                </div>
                <div class="card-body p-3">
                    <div class="alert alert-info mb-3">
                        <strong>Vehicle:</strong> ${vehicle}<br>
                        <strong>Maintenance Date:</strong> ${Utils.formatDate(reminder.rec_date)}<br>
                        <strong>Mileage:</strong> ${reminder.rec_mileage.toLocaleString()}
                    </div>
                    <div class="mb-3">
                        <strong>Reminder:</strong><br>
                        ${reminder.message}
                    </div>
                    <div class="d-flex gap-2">
                        <button class="btn btn-success btn-sm" onclick="maintenanceManager.markReminderAsSent(${reminder.reminder_id}, this)">
                            <i class="fas fa-check"></i> Mark as Sent
                        </button>
                        <button class="btn btn-primary btn-sm" onclick="maintenanceManager.showEditReminderForm(${reminder.reminder_id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="this.closest('.reminder-popup').remove()">
                            <i class="fas fa-times"></i> Dismiss
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add to body
        document.body.insertAdjacentHTML('beforeend', popupContent);

        // Auto-remove after 30 seconds if not dismissed
        setTimeout(() => {
            const popup = document.querySelector('.reminder-popup');
            if (popup && popup.parentNode) {
                popup.style.animation = 'slideOutRight 0.3s ease-in';
                setTimeout(() => {
                    if (popup && popup.parentNode) {
                        popup.remove();
                    }
                }, 300);
            }
        }, 30000);
    },

    // Mark reminder as sent
    markReminderAsSent: async (reminderId, button) => {
        try {
            await Database.updateRecord('Reminder', { is_sent: 1 }, `reminder_id = ${reminderId}`);
            
            // Update button
            button.innerHTML = '<i class="fas fa-check"></i> Sent';
            button.className = 'btn btn-success btn-sm disabled';
            
            // Remove popup after 2 seconds
            setTimeout(() => {
                const popup = button.closest('.reminder-popup');
                if (popup) {
                    popup.remove();
                }
            }, 2000);
            
            Utils.showAlert('Reminder marked as sent', 'success');
        } catch (error) {
            console.error('Error marking reminder as sent:', error);
            Utils.showAlert('Error updating reminder status', 'danger');
        }
    },

    render: async () => {
        // Check if user is authenticated
        if (!AuthManager.isAuthenticated) {
            maintenanceManager.container.innerHTML = '<div class="alert alert-warning">Please log in to view maintenance events.</div>';
            return;
        }

        try {
            // Get maintenance events from database based on user permissions
            let eventsToShow = [];
            if (AuthManager.isAdmin()) {
                eventsToShow = await Database.select(`
                    SELECT me.*, u.username, v.make, v.model, v.year 
                    FROM MaintenanceEvents me
                    LEFT JOIN Users u ON me.user_id = u.user_id
                    LEFT JOIN Vehicles v ON me.vin = v.vin
                    ORDER BY me.rec_date DESC
                `);
            } else {
                // Regular users can only see their own maintenance events
                const userId = AuthManager.currentUser.user_id;
                eventsToShow = await Database.select(`
                    SELECT me.*, u.username, v.make, v.model, v.year 
                    FROM MaintenanceEvents me
                    LEFT JOIN Users u ON me.user_id = u.user_id
                    LEFT JOIN Vehicles v ON me.vin = v.vin
                    WHERE me.user_id = ${userId}
                    ORDER BY me.rec_date DESC
                `);
            }

            // Create table rows asynchronously
            const tableRows = [];
            for (const event of eventsToShow) {
                const row = await maintenanceManager.createMaintenanceRow(event);
                tableRows.push(row);
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
                            ${tableRows.join('')}
                        </tbody>
                    </table>
                </div>
            `;
            
            maintenanceManager.container.innerHTML = table;
        } catch (error) {
            console.error('Error loading maintenance events:', error);
            maintenanceManager.container.innerHTML = `
                <div class="alert alert-danger">
                    <h4><i class="fas fa-exclamation-triangle"></i> Error Loading Maintenance Events</h4>
                    <p>${error.message}</p>
                    <button class="btn btn-primary" onclick="maintenanceManager.render()">
                        <i class="fas fa-sync"></i> Retry
                    </button>
                </div>
            `;
        }
    },

    createMaintenanceRow: async (event) => {
        const user = event.username || 'Unknown User';
        const vehicle = event.make && event.model && event.year ? 
            `${event.year} ${event.make} ${event.model}` : 'Unknown Vehicle';
        
        // Fetch service types for this maintenance event
        let serviceTypes = [];
        try {
            const serviceTypesResult = await Database.select(`
                SELECT st.service_type 
                FROM ServiceTypes st
                JOIN MaintenanceEvents_ServiceTypes mest ON st.service_type = mest.service_type
                WHERE mest.event_id = ${event.event_id}
            `);
            serviceTypes = serviceTypesResult.map(st => st.service_type);
        } catch (error) {
            console.error('Error fetching service types for event:', event.event_id, error);
        }
        
        // Fetch reminders for this maintenance event
        let reminders = [];
        try {
            const remindersResult = await Database.select(`
                SELECT reminder_id, message, send_date, is_sent
                FROM Reminder
                WHERE event_id = ${event.event_id}
                ORDER BY send_date DESC
            `);
            reminders = remindersResult;
        } catch (error) {
            console.error('Error fetching reminders for event:', event.event_id, error);
        }
        
        const statusClass = event.status === 'completed' ? 'success' : 
                           event.status === 'overdue' ? 'danger' : 'warning';
        
        // Safely convert numeric values
        const recMileage = Number(event.rec_mileage) || 0;
        
        return `
            <tr>
                <td>${event.event_id}</td>
                <td>${user}</td>
                <td>${vehicle}</td>
                <td>${Utils.formatDate(event.rec_date)}</td>
                <td>${recMileage.toLocaleString()}</td>
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
                                            <strong>User:</strong> ${event.username || 'Unknown User'}
                                        </li>
                                        <li class="list-group-item">
                                            <strong>Vehicle:</strong> ${event.make && event.model && event.year ? `${event.year} ${event.make} ${event.model} (${event.vin})` : 'Unknown Vehicle'}
                                        </li>
                                        <li class="list-group-item">
                                            <strong>Date:</strong> ${Utils.formatDate(event.rec_date)}
                                        </li>
                                        <li class="list-group-item">
                                            <strong>Mileage:</strong> ${recMileage.toLocaleString()}
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
                                    <h6>Reminder Notifications (${reminders.length})</h6>
                                    ${reminders.length > 0 ? `
                                        <ul class="list-group list-group-flush">
                                            ${reminders.map(reminder => `
                                                <li class="list-group-item d-flex justify-content-between align-items-start">
                                                    <div class="flex-grow-1">
                                                        <div class="fw-medium">${reminder.message}</div>
                                                        <small class="text-muted">Due: ${Utils.formatDate(reminder.send_date)}</small>
                                                    </div>
                                                    <div class="d-flex align-items-center gap-1">
                                                        <span class="badge ${reminder.is_sent ? 'bg-success' : 'bg-warning'}">
                                                            ${reminder.is_sent ? 'Sent' : 'Pending'}
                                                        </span>
                                                        <button class="btn btn-sm btn-outline-primary" onclick="maintenanceManager.showEditReminderForm(${reminder.reminder_id})" title="Edit Reminder">
                                                            <i class="fas fa-edit"></i>
                                                        </button>
                                                        <button class="btn btn-sm btn-outline-secondary" onclick="maintenanceManager.toggleReminderStatus(${reminder.reminder_id}, ${reminder.is_sent})" title="${reminder.is_sent ? 'Mark as Pending' : 'Mark as Sent'}">
                                                            <i class="fas fa-${reminder.is_sent ? 'undo' : 'check'}"></i>
                                                        </button>
                                                        <button class="btn btn-sm btn-outline-danger" onclick="maintenanceManager.deleteReminder(${reminder.reminder_id})" title="Delete Reminder">
                                                            <i class="fas fa-trash"></i>
                                                        </button>
                                                    </div>
                                                </li>
                                            `).join('')}
                                        </ul>
                                        <button class="btn btn-sm btn-outline-primary mt-2" onclick="maintenanceManager.showAddReminderForm(${event.event_id})">
                                            <i class="fas fa-plus"></i> Add Reminder
                                        </button>
                                    ` : `
                                        <p class="text-muted">No reminders set</p>
                                        <button class="btn btn-sm btn-outline-primary" onclick="maintenanceManager.showAddReminderForm(${event.event_id})">
                                            <i class="fas fa-plus"></i> Add Reminder
                                        </button>
                                    `}
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

    showAddForm: async () => {
        // Check if user is authenticated
        if (!AuthManager.requireAuth('add maintenance events')) {
            return;
        }
        try {
            let userField;
            let vehicles;
            
            if (AuthManager.isAdmin()) {
                // Admins can select any user and see all vehicles
                const users = await Database.select('SELECT user_id, username, email FROM Users');
                const userOptions = users.map(user => ({
                    value: user.user_id,
                    text: `${user.username} (${user.email})`
                }));
                userField = Utils.createFormField('User', 'user_id', 'select', true, userOptions).outerHTML;
                
                vehicles = await Database.select('SELECT vin, make, model, year FROM Vehicles');
            } else {
                // Regular users automatically use their own user ID
                userField = `<input type="hidden" id="user_id" name="user_id" value="${AuthManager.currentUser.user_id}">`;
                
                // Regular users can only add maintenance events for vehicles they own
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

            const statusOptions = [
                { value: 'pending', text: 'Pending' },
                { value: 'completed', text: 'Completed' },
                { value: 'overdue', text: 'Overdue' }
            ];

            const serviceTypes = await Database.select('SELECT service_type FROM ServiceTypes');
            const serviceTypeOptions = serviceTypes.map(type => ({
                value: type.service_type,
                text: type.service_type
            }));

        const formContent = `
            <form id="maintenanceForm">
                ${userField}
                ${Utils.createFormField('Vehicle', 'vin', 'select', true, vehicleOptions).outerHTML}
                ${Utils.createFormField('Date', 'rec_date', 'date', true).outerHTML}
                ${Utils.createFormField('Mileage', 'rec_mileage', 'number', true).outerHTML}
                ${Utils.createFormField('Status', 'status', 'select', true, statusOptions).outerHTML}
                ${Utils.createFormField('Service Types', 'service_types', 'select', false, serviceTypeOptions).outerHTML}
            </form>
        `;

        Utils.ModalManager.show('Add New Maintenance Event', formContent, () => maintenanceManager.saveMaintenance());
        } catch (error) {
            console.error('Error loading data for maintenance form:', error);
            Utils.showAlert(`Error loading form data: ${error.message}`, 'danger');
        }
    },

    showEditForm: async (eventId) => {
        try {
            const events = await Database.select(`SELECT * FROM MaintenanceEvents WHERE event_id = ${eventId}`);
            const event = events[0];
            if (!event) {
                Utils.showAlert('Maintenance event not found!', 'danger');
                return;
            }

            const users = await Database.select('SELECT user_id, username, email FROM Users');
            const userOptions = users.map(user => ({
                value: user.user_id,
                text: `${user.username} (${user.email})`
            }));

            let vehicles;
            if (AuthManager.isAdmin()) {
                vehicles = await Database.select('SELECT vin, make, model, year FROM Vehicles');
            } else {
                // Regular users can only edit maintenance events for vehicles they own
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

        const statusOptions = [
            { value: 'pending', text: 'Pending' },
            { value: 'completed', text: 'Completed' },
            { value: 'overdue', text: 'Overdue' }
        ];

        // Get service types for the form
        const serviceTypes = await Database.select('SELECT service_type FROM ServiceTypes');
        const serviceTypeOptions = serviceTypes.map(type => ({
            value: type.service_type,
            text: type.service_type
        }));

        // Get current service types for this event
        let currentServiceType = '';
        try {
            const currentServiceTypes = await Database.select(`
                SELECT st.service_type 
                FROM ServiceTypes st
                JOIN MaintenanceEvents_ServiceTypes mest ON st.service_type = mest.service_type
                WHERE mest.event_id = ${eventId}
            `);
            if (currentServiceTypes.length > 0) {
                currentServiceType = currentServiceTypes[0].service_type;
            }
        } catch (error) {
            console.error('Error fetching current service types:', error);
        }

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

        Utils.ModalManager.show('Edit Maintenance Event', formContent, () => maintenanceManager.saveMaintenance(eventId));
        
        // Populate form with existing data after modal is shown
        Utils.populateForm({
            user_id: event.user_id,
            vin: event.vin,
            rec_date: event.rec_date,
            rec_mileage: event.rec_mileage,
            status: event.status,
            service_types: currentServiceType
        });
        } catch (error) {
            console.error('Error loading maintenance event for edit:', error);
            Utils.showAlert(`Error loading maintenance event: ${error.message}`, 'danger');
        }
    },

    saveMaintenance: async (eventId = null) => {
        const form = document.getElementById('maintenanceForm');
        const formData = new FormData(form);
        

        
        const maintenanceData = {
            user_id: parseInt(formData.get('user_id')),
            vin: formData.get('vin'),
            rec_date: formData.get('rec_date'),
            rec_mileage: parseInt(formData.get('rec_mileage')),
            status: formData.get('status')
        };

        // Get selected service types
        const selectedServiceTypes = formData.get('service_types');

        // Validation - check for empty strings and NaN values
        if (isNaN(maintenanceData.user_id)) {
            Utils.showAlert('User is required', 'danger');
            return;
        }
        
        if (!maintenanceData.vin || maintenanceData.vin.trim() === '') {
            Utils.showAlert('Vehicle is required', 'danger');
            return;
        }
        
        if (!maintenanceData.rec_date || maintenanceData.rec_date.trim() === '') {
            Utils.showAlert('Date is required', 'danger');
            return;
        }
        
        if (isNaN(maintenanceData.rec_mileage)) {
            Utils.showAlert('Mileage must be a valid number', 'danger');
            return;
        }
        
        if (!maintenanceData.status || maintenanceData.status.trim() === '') {
            Utils.showAlert('Status is required', 'danger');
            return;
        }

        if (maintenanceData.rec_mileage < 0) {
            Utils.showAlert('Mileage must be a positive number', 'danger');
            return;
        }

        try {
            let newEventId = eventId;
            
            if (eventId) {
                // Update existing event
                await Database.updateRecord('MaintenanceEvents', maintenanceData, `event_id = ${eventId}`);
                Utils.showAlert('Maintenance event updated successfully', 'success');
            } else {
                // Add new event
                const result = await Database.insertRecord('MaintenanceEvents', maintenanceData);
                newEventId = result.insertId; // Get the ID of the newly inserted record
                Utils.showAlert('Maintenance event added successfully', 'success');
            }

            // Handle service types
            if (newEventId) {
                // First, remove any existing service types for this event
                await Database.deleteRecords('MaintenanceEvents_ServiceTypes', `event_id = ${newEventId}`);
                
                // Then add the selected service type if one was chosen
                if (selectedServiceTypes && selectedServiceTypes.trim() !== '') {
                    await Database.insertRecord('MaintenanceEvents_ServiceTypes', {
                        event_id: newEventId,
                        service_type: selectedServiceTypes
                    });
                }
            }

            Utils.ModalManager.hide();
            
            // Refresh all sections that depend on maintenance event data
            await maintenanceManager.refreshAllRelatedSections();
        } catch (error) {
            console.error('Error saving maintenance event:', error);
            Utils.showAlert(`Error saving maintenance event: ${error.message}`, 'danger');
        }
    },

    // Refresh all sections that depend on maintenance event data
    refreshAllRelatedSections: async () => {
        try {
            // Show loading indicator
            Utils.showAlert('Updating all related sections...', 'info');
            
            // Refresh maintenance events section
            await maintenanceManager.render();
            
            // Refresh vehicles section (since maintenance events are linked to vehicles)
            if (window.vehiclesManager) {
                await vehiclesManager.render();
            }
            
            // Refresh ownership section (since maintenance affects vehicle ownership)
            if (window.ownsManager) {
                await ownsManager.render();
            }
            
            // Refresh expenses section (since maintenance can be expenses)
            if (window.expensesManager) {
                await expensesManager.render();
            }
            
            // Refresh service records section (since maintenance events can lead to service records)
            if (window.servicesManager) {
                await servicesManager.render();
            }
            
            console.log('All maintenance event-related sections refreshed successfully');
            
            // Show success message
            setTimeout(() => {
                Utils.showAlert('All sections updated successfully!', 'success');
            }, 500);
        } catch (error) {
            console.error('Error refreshing maintenance event-related sections:', error);
            Utils.showAlert('Error updating sections. Please refresh the page.', 'danger');
        }
    },

    deleteMaintenance: async (eventId) => {
        if (!confirm('Are you sure you want to delete this maintenance event? This will also remove all associated reminders.')) {
            return;
        }

        try {
            // Remove event from database
            await Database.deleteRecords('MaintenanceEvents', `event_id = ${eventId}`);
            
            // Remove associated service types (if table exists)
            try {
                await Database.deleteRecords('MaintenanceEvents_ServiceTypes', `event_id = ${eventId}`);
            } catch (error) {
                console.log('MaintenanceEvents_ServiceTypes table may not exist, skipping relationship cleanup');
            }
            
            // Remove associated reminders (if table exists)
            try {
                            await Database.deleteRecords('Reminder', `event_id = ${eventId}`);
        } catch (error) {
            console.log('Reminder table may not exist, skipping reminder cleanup');
            }

            Utils.showAlert('Maintenance event deleted successfully', 'success');
            
            // Refresh all sections that depend on maintenance event data
            await maintenanceManager.refreshAllRelatedSections();
        } catch (error) {
            console.error('Error deleting maintenance event:', error);
            Utils.showAlert(`Error deleting maintenance event: ${error.message}`, 'danger');
        }
    },

    // Reminder Management Functions
    showAddReminderForm: async (eventId) => {
        try {
            // Get maintenance event details for context
            const events = await Database.select(`SELECT me.*, v.make, v.model, v.year FROM MaintenanceEvents me LEFT JOIN Vehicles v ON me.vin = v.vin WHERE me.event_id = ${eventId}`);
            const event = events[0];
            
            if (!event) {
                Utils.showAlert('Maintenance event not found!', 'danger');
                return;
            }

            const vehicle = event.make && event.model && event.year ? 
                `${event.year} ${event.make} ${event.model}` : 'Unknown Vehicle';

            const formContent = `
                <form id="reminderForm">
                    <div class="alert alert-info">
                        <strong>Maintenance Event:</strong> ${vehicle}<br>
                        <strong>Date:</strong> ${Utils.formatDate(event.rec_date)}<br>
                        <strong>Mileage:</strong> ${event.rec_mileage.toLocaleString()}
                    </div>
                    <div class="mb-3">
                        <label for="reminderMessage" class="form-label">Reminder Message</label>
                        <textarea class="form-control" id="reminderMessage" name="message" rows="3" required 
                            placeholder="Enter a reminder message..."></textarea>
                    </div>
                    <div class="mb-3">
                        <label for="reminderDate" class="form-label">Reminder Date</label>
                        <input type="date" class="form-control" id="reminderDate" name="send_date" required>
                    </div>
                    <div class="mb-3">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="reminderSent" name="is_sent">
                            <label class="form-check-label" for="reminderSent">
                                Mark as already sent
                            </label>
                        </div>
                    </div>
                </form>
            `;

            Utils.ModalManager.show('Add Reminder', formContent, () => maintenanceManager.saveReminder(eventId));
            
            // Set default date to today
            setTimeout(() => {
                const today = new Date().toISOString().split('T')[0];
                document.getElementById('reminderDate').value = today;
            }, 100);
        } catch (error) {
            console.error('Error loading reminder form:', error);
            Utils.showAlert(`Error loading reminder form: ${error.message}`, 'danger');
        }
    },

    saveReminder: async (eventId, reminderId = null) => {
        const form = document.getElementById('reminderForm');
        const formData = new FormData(form);
        
        const reminderData = {
            event_id: eventId,
            message: formData.get('message'),
            send_date: formData.get('send_date'),
            is_sent: formData.get('is_sent') === 'on' ? 1 : 0
        };

        // Validation
        if (!reminderData.message || reminderData.message.trim() === '') {
            Utils.showAlert('Reminder message is required', 'danger');
            return;
        }
        
        if (!reminderData.send_date || reminderData.send_date.trim() === '') {
            Utils.showAlert('Reminder date is required', 'danger');
            return;
        }

        try {
            if (reminderId) {
                // Update existing reminder
                await Database.updateRecord('Reminder', reminderData, `reminder_id = ${reminderId}`);
                Utils.showAlert('Reminder updated successfully', 'success');
            } else {
                // Add new reminder
                await Database.insertRecord('Reminder', reminderData);
                Utils.showAlert('Reminder added successfully', 'success');
            }
            
            Utils.ModalManager.hide();
            
            // Refresh maintenance events to show the updated reminder
            await maintenanceManager.render();
        } catch (error) {
            console.error('Error saving reminder:', error);
            Utils.showAlert(`Error saving reminder: ${error.message}`, 'danger');
        }
    },

    deleteReminder: async (reminderId) => {
        if (!confirm('Are you sure you want to delete this reminder?')) {
            return;
        }

        try {
            await Database.deleteRecords('Reminder', `reminder_id = ${reminderId}`);
            Utils.showAlert('Reminder deleted successfully', 'success');
            
            // Refresh maintenance events to update the display
            await maintenanceManager.render();
        } catch (error) {
            console.error('Error deleting reminder:', error);
            Utils.showAlert(`Error deleting reminder: ${error.message}`, 'danger');
        }
    },

    toggleReminderStatus: async (reminderId, currentStatus) => {
        try {
            const newStatus = currentStatus ? 0 : 1;
            await Database.updateRecord('Reminder', { is_sent: newStatus }, `reminder_id = ${reminderId}`);
            
            Utils.showAlert(`Reminder marked as ${newStatus ? 'sent' : 'pending'}`, 'success');
            
            // Refresh maintenance events to update the display
            await maintenanceManager.render();
        } catch (error) {
            console.error('Error updating reminder status:', error);
            Utils.showAlert(`Error updating reminder status: ${error.message}`, 'danger');
        }
    },

    showEditReminderForm: async (reminderId) => {
        try {
            const reminders = await Database.select(`SELECT * FROM Reminder WHERE reminder_id = ${reminderId}`);
            const reminder = reminders[0];
            if (!reminder) {
                Utils.showAlert('Reminder not found!', 'danger');
                return;
            }

            const events = await Database.select(`SELECT me.*, v.make, v.model, v.year FROM MaintenanceEvents me LEFT JOIN Vehicles v ON me.vin = v.vin WHERE me.event_id = ${reminder.event_id}`);
            const event = events[0];
            if (!event) {
                Utils.showAlert('Maintenance event not found!', 'danger');
                return;
            }

            const vehicle = event.make && event.model && event.year ? 
                `${event.year} ${event.make} ${event.model}` : 'Unknown Vehicle';

            const formContent = `
                <form id="reminderForm">
                    <div class="alert alert-info">
                        <strong>Maintenance Event:</strong> ${vehicle}<br>
                        <strong>Date:</strong> ${Utils.formatDate(reminder.send_date)}<br>
                        <strong>Mileage:</strong> ${event.rec_mileage.toLocaleString()}
                    </div>
                    <div class="mb-3">
                        <label for="reminderMessage" class="form-label">Reminder Message</label>
                        <textarea class="form-control" id="reminderMessage" name="message" rows="3" required 
                            placeholder="Enter a reminder message...">${reminder.message}</textarea>
                    </div>
                    <div class="mb-3">
                        <label for="reminderDate" class="form-label">Reminder Date</label>
                        <input type="date" class="form-control" id="reminderDate" name="send_date" required value="${Utils.formatDate(reminder.send_date)}">
                    </div>
                    <div class="mb-3">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="reminderSent" name="is_sent" ${reminder.is_sent ? 'checked' : ''}>
                            <label class="form-check-label" for="reminderSent">
                                Mark as already sent
                            </label>
                        </div>
                    </div>
                </form>
            `;

                         Utils.ModalManager.show('Edit Reminder', formContent, () => maintenanceManager.saveReminder(reminder.event_id, reminder.reminder_id));
        } catch (error) {
            console.error('Error loading reminder form for edit:', error);
            Utils.showAlert(`Error loading reminder form: ${error.message}`, 'danger');
        }
    },

    // Cleanup function to stop reminder checking
    cleanup: () => {
        if (maintenanceManager.reminderCheckInterval) {
            clearInterval(maintenanceManager.reminderCheckInterval);
            maintenanceManager.reminderCheckInterval = null;
        }
    }
};

// Make maintenanceManager available globally
window.maintenanceManager = maintenanceManager;

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    maintenanceManager.cleanup();
}); 