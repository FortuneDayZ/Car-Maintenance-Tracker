// Ownership Manager
const ownsManager = {
    container: null,

    init: () => {
        ownsManager.container = document.getElementById('owns-table-container');
        ownsManager.render();
    },

    render: () => {
        const table = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Vehicle</th>
                            <th>Start Date</th>
                            <th>End Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${dataStore.owns.map(own => ownsManager.createOwnRow(own)).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        ownsManager.container.innerHTML = table;
    },

    createOwnRow: (own) => {
        const user = dataStore.users.find(u => u.user_id === own.user_id);
        const vehicle = dataStore.vehicles.find(v => v.vin === own.vin);
        const isActive = !own.end_date;
        
        return `
            <tr>
                <td>${user ? user.username : 'Unknown User'}</td>
                <td>${vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Unknown Vehicle'}</td>
                <td>${Utils.formatDate(own.start_date)}</td>
                <td>${own.end_date ? Utils.formatDate(own.end_date) : 'Active'}</td>
                <td>
                    <span class="badge bg-${isActive ? 'success' : 'secondary'}">
                        ${isActive ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>
                    ${isActive ? `
                        <button class="btn btn-sm btn-warning" onclick="ownsManager.endOwnership(${own.user_id}, '${own.vin}')">
                            <i class="fas fa-stop"></i> End
                        </button>
                    ` : ''}
                    <button class="btn btn-sm btn-danger" onclick="ownsManager.deleteOwnership(${own.user_id}, '${own.vin}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
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

        const formContent = `
            <form id="ownForm">
                ${Utils.createFormField('User', 'user_id', 'select', true, userOptions).outerHTML}
                ${Utils.createFormField('Vehicle', 'vin', 'select', true, vehicleOptions).outerHTML}
                ${Utils.createFormField('Start Date', 'start_date', 'date', true).outerHTML}
                ${Utils.createFormField('End Date (Optional)', 'end_date', 'date', false).outerHTML}
            </form>
        `;

        Utils.ModalManager.show('Add Ownership Record', formContent, ownsManager.saveOwnership);
    },

    saveOwnership: () => {
        const form = document.getElementById('ownForm');
        const formData = new FormData(form);
        
        const ownershipData = {
            user_id: parseInt(formData.get('user_id')),
            vin: formData.get('vin'),
            start_date: formData.get('start_date'),
            end_date: formData.get('end_date') || null
        };

        // Validation
        if (!ownershipData.user_id || !ownershipData.vin || !ownershipData.start_date) {
            Utils.showAlert('User, Vehicle, and Start Date are required', 'danger');
            return;
        }

        // Check if this ownership already exists
        const existingOwnership = dataStore.owns.find(own => 
            own.user_id === ownershipData.user_id && 
            own.vin === ownershipData.vin
        );

        if (existingOwnership) {
            Utils.showAlert('This ownership relationship already exists', 'danger');
            return;
        }

        // Add new ownership
        dataStore.owns.push(ownershipData);
        Utils.showAlert('Ownership record added successfully', 'success');

        Utils.ModalManager.hide();
        ownsManager.render();
    },

    endOwnership: (userId, vin) => {
        if (!confirm('Are you sure you want to end this ownership? This will mark the ownership as inactive.')) {
            return;
        }

        const ownership = dataStore.owns.find(own => 
            own.user_id === userId && own.vin === vin
        );

        if (ownership) {
            ownership.end_date = new Date().toISOString().split('T')[0];
            Utils.showAlert('Ownership ended successfully', 'success');
            ownsManager.render();
        }
    },

    deleteOwnership: (userId, vin) => {
        if (!confirm('Are you sure you want to delete this ownership record?')) {
            return;
        }

        dataStore.owns = dataStore.owns.filter(own => 
            !(own.user_id === userId && own.vin === vin)
        );

        Utils.showAlert('Ownership record deleted successfully', 'success');
        ownsManager.render();
    }
}; 