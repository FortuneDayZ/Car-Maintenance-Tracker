// Users Manager
const usersManager = {
    container: null,

    init: () => {
        usersManager.container = document.getElementById('users-table-container');
        usersManager.render();
    },

    render: () => {
        // Check if user is authenticated and has permission to view users
        if (!AuthManager.isAuthenticated) {
            usersManager.container.innerHTML = '<div class="alert alert-warning">Please log in to view users.</div>';
            return;
        }

        // Only admins can view all users, regular users can only see their own profile
        let usersToShow = [];
        if (AuthManager.isAdmin()) {
            usersToShow = dataStore.users;
        } else {
            // Regular users can only see their own profile
            usersToShow = dataStore.users.filter(user => user.user_id === AuthManager.currentUser.user_id);
        }

        const table = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Birthday</th>
                            <th>Registration Date</th>
                            <th>Relationships</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${usersToShow.map(user => usersManager.createUserRow(user)).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        usersManager.container.innerHTML = table;
    },

    createUserRow: (user) => {
        const vehicles = Utils.getRelatedData.getUserVehicles(user.user_id);
        const maintenanceEvents = Utils.getRelatedData.getUserMaintenanceEvents(user.user_id);
        
        return `
            <tr>
                <td>${user.user_id}</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${Utils.formatDate(user.birthday)}</td>
                <td>${Utils.formatDate(user.registration_date)}</td>
                <td>
                    ${Utils.createRelationshipBadges(user, 'user')}
                    <button class="btn btn-sm btn-outline-info" onclick="usersManager.showDetails(${user.user_id})">
                        <i class="fas fa-info-circle"></i> Details
                    </button>
                </td>
                <td>
                    ${AuthManager.canEditRecord(user.user_id) ? `
                        <button class="btn btn-sm btn-primary" onclick="usersManager.showEditForm(${user.user_id})">
                            <i class="fas fa-edit"></i>
                        </button>
                    ` : ''}
                    ${AuthManager.isAdmin() ? `
                        <button class="btn btn-sm btn-danger" onclick="usersManager.deleteUser(${user.user_id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </td>
            </tr>
            <tr id="user-details-${user.user_id}" class="detail-row" style="display: none;">
                <td colspan="7">
                    <div class="card">
                        <div class="card-header">
                            <h6>User Details - ${user.username}</h6>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6>Owned Vehicles (${vehicles.length})</h6>
                                    ${vehicles.length > 0 ? `
                                        <ul class="list-group list-group-flush">
                                            ${vehicles.map(vehicle => `
                                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                                    ${vehicle.year} ${vehicle.make} ${vehicle.model}
                                                    <span class="badge bg-secondary">Since ${Utils.formatDate(vehicle.ownership_start)}</span>
                                                </li>
                                            `).join('')}
                                        </ul>
                                    ` : '<p class="text-muted">No vehicles owned</p>'}
                                </div>
                                <div class="col-md-6">
                                    <h6>Maintenance Events (${maintenanceEvents.length})</h6>
                                    ${maintenanceEvents.length > 0 ? `
                                        <ul class="list-group list-group-flush">
                                            ${maintenanceEvents.map(event => {
                                                const vehicle = dataStore.vehicles.find(v => v.vin === event.vin);
                                                return `
                                                    <li class="list-group-item d-flex justify-content-between align-items-center">
                                                        ${vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Unknown Vehicle'}
                                                        <span class="badge bg-${event.status === 'completed' ? 'success' : event.status === 'overdue' ? 'danger' : 'warning'}">${event.status}</span>
                                                    </li>
                                                `;
                                            }).join('')}
                                        </ul>
                                    ` : '<p class="text-muted">No maintenance events</p>'}
                                </div>
                            </div>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    },

    showDetails: (userId) => {
        const detailRow = document.getElementById(`user-details-${userId}`);
        const button = event.target.closest('button');
        Utils.toggleDetailRow(button, detailRow);
    },

    showAddForm: () => {
        // Only admins can add new users
        if (!AuthManager.isAdmin()) {
            Utils.showAlert('Only administrators can add new users', 'warning');
            return;
        }

        const formContent = `
            <form id="userForm">
                ${Utils.createFormField('Username', 'username', 'text', true).outerHTML}
                ${Utils.createFormField('Email', 'email', 'email', true).outerHTML}
                ${Utils.createFormField('Password Hash', 'password_hash', 'text', true).outerHTML}
                ${Utils.createFormField('Birthday', 'birthday', 'date', true).outerHTML}
                ${Utils.createFormField('Registration Date', 'registration_date', 'date', true).outerHTML}
            </form>
        `;

        Utils.ModalManager.show('Add New User', formContent, usersManager.saveUser);
    },

    showEditForm: (userId) => {
        const user = dataStore.users.find(u => u.user_id === userId);
        if (!user) return;

        const formContent = `
            <form id="userForm">
                ${Utils.createFormField('Username', 'username', 'text', true).outerHTML}
                ${Utils.createFormField('Email', 'email', 'email', true).outerHTML}
                ${Utils.createFormField('Password Hash', 'password_hash', 'text', true).outerHTML}
                ${Utils.createFormField('Birthday', 'birthday', 'date', true).outerHTML}
                ${Utils.createFormField('Registration Date', 'registration_date', 'date', true).outerHTML}
            </form>
        `;

        // Populate form with existing data
        setTimeout(() => {
            document.getElementById('username').value = user.username;
            document.getElementById('email').value = user.email;
            document.getElementById('password_hash').value = user.password_hash;
            document.getElementById('birthday').value = user.birthday;
            document.getElementById('registration_date').value = user.registration_date;
        }, 100);

        Utils.ModalManager.show('Edit User', formContent, () => usersManager.saveUser(userId));
    },

    saveUser: (userId = null) => {
        const form = document.getElementById('userForm');
        const formData = new FormData(form);
        
        const userData = {
            username: formData.get('username'),
            email: formData.get('email'),
            password_hash: formData.get('password_hash'),
            birthday: formData.get('birthday'),
            registration_date: formData.get('registration_date')
        };

        // Validation
        if (!userData.username || !userData.email || !userData.password_hash || !userData.birthday || !userData.registration_date) {
            Utils.showAlert('All fields are required', 'danger');
            return;
        }

        if (!Utils.validateEmail(userData.email)) {
            Utils.showAlert('Please enter a valid email address', 'danger');
            return;
        }

        // Check for duplicate email/username
        const existingUser = dataStore.users.find(u => 
            u.email === userData.email || u.username === userData.username
        );
        
        if (existingUser && (!userId || existingUser.user_id !== userId)) {
            Utils.showAlert('Username or email already exists', 'danger');
            return;
        }

        if (userId) {
            // Update existing user
            const userIndex = dataStore.users.findIndex(u => u.user_id === userId);
            if (userIndex !== -1) {
                dataStore.users[userIndex] = { ...dataStore.users[userIndex], ...userData };
                Utils.showAlert('User updated successfully', 'success');
            }
        } else {
            // Add new user
            const newUser = {
                user_id: Utils.getNextId(dataStore.users, 'user_id'),
                ...userData
            };
            dataStore.users.push(newUser);
            Utils.showAlert('User added successfully', 'success');
        }

        Utils.ModalManager.hide();
        usersManager.render();
    },

    deleteUser: (userId) => {
        // Only admins can delete users
        if (!AuthManager.isAdmin()) {
            Utils.showAlert('Only administrators can delete users', 'warning');
            return;
        }

        if (!confirm('Are you sure you want to delete this user? This will also remove all associated ownership records.')) {
            return;
        }

        // Remove user from data store
        dataStore.users = dataStore.users.filter(u => u.user_id !== userId);
        
        // Remove associated ownership records
        dataStore.owns = dataStore.owns.filter(own => own.user_id !== userId);
        
        // Remove associated maintenance events
        dataStore.maintenanceEvents = dataStore.maintenanceEvents.filter(event => event.user_id !== userId);

        Utils.showAlert('User deleted successfully', 'success');
        usersManager.render();
    }
}; 