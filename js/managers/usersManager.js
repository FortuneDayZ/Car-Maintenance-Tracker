// Users Manager
const usersManager = {
    container: null,

    init: () => {
        usersManager.container = document.getElementById('users-table-container');
        usersManager.render();
    },

    render: async () => {
        // Check if user is authenticated and has permission to view users
        if (!AuthManager.isAuthenticated) {
            usersManager.container.innerHTML = `
                <div class="alert alert-warning">
                    <h4><i class="fas fa-lock"></i> Authentication Required</h4>
                    <p>Please log in to view and manage users.</p>
                    <button class="btn btn-primary" onclick="AuthManager.showLoginModal()">
                        <i class="fas fa-sign-in-alt"></i> Login
                    </button>
                </div>
            `;
            return;
        }

        // Control the Add User button visibility based on user role
        const addUserBtn = document.getElementById('addUserBtn');
        if (addUserBtn) {
            if (AuthManager.isAuthenticated && AuthManager.isAdmin()) {
                addUserBtn.style.display = 'inline-block';
                addUserBtn.innerHTML = '<i class="fas fa-plus"></i> Add New User';
            } else {
                // Hide the button for regular users
                addUserBtn.style.display = 'none';
            }
        }

        try {
            // Get users from database instead of mock data
            let usersToShow = [];
            if (AuthManager.isAdmin()) {
                usersToShow = await Database.select('SELECT * FROM Users');
            } else {
                // Regular users can only see their own profile
                usersToShow = await Database.select(`SELECT * FROM Users WHERE user_id = ${AuthManager.currentUser.user_id}`);
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
                            ${(await Promise.all(usersToShow.map(user => usersManager.createUserRow(user)))).join('')}
                        </tbody>
                    </table>
                </div>
            `;
            
            usersManager.container.innerHTML = table;
        } catch (error) {
            console.error('Error loading users:', error);
            usersManager.container.innerHTML = `
                <div class="alert alert-danger">
                    <h4><i class="fas fa-exclamation-triangle"></i> Error Loading Users</h4>
                    <p>${error.message}</p>
                    <button class="btn btn-primary" onclick="usersManager.render()">
                        <i class="fas fa-sync"></i> Retry
                    </button>
                </div>
            `;
        }
    },

    createUserRow: async (user) => {
        // Fetch user's vehicles with ownership info
        let vehicles = [];
        try {
            vehicles = await Database.select(`
                SELECT v.*, o.start_date as ownership_start
                FROM Vehicles v
                JOIN Owns o ON v.vin = o.vin
                WHERE o.user_id = ${user.user_id}
                AND (o.end_date IS NULL OR o.end_date > CURDATE())
                ORDER BY o.start_date DESC
            `);
        } catch (error) {
            console.error(`Error fetching vehicles for user ${user.user_id}:`, error);
        }

        // Fetch user's upcoming services with vehicle info
        let maintenanceEvents = [];
        try {
            maintenanceEvents = await Database.select(`
                SELECT me.*, CONCAT(v.year, ' ', v.make, ' ', v.model) as vehicle_info
                FROM UpcomingServices me
                LEFT JOIN Vehicles v ON me.vin = v.vin
                WHERE me.user_id = ${user.user_id}
                ORDER BY me.rec_date DESC
            `);
        } catch (error) {
            console.error(`Error fetching upcoming services for user ${user.user_id}:`, error);
        }
        
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
                                    <h6>Upcoming Services (${maintenanceEvents.length})</h6>
                                    ${maintenanceEvents.length > 0 ? `
                                        <ul class="list-group list-group-flush">
                                            ${maintenanceEvents.map(event => `
                                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                                    ${event.vehicle_info || 'Unknown Vehicle'}
                                                    <span class="badge bg-${event.status === 'completed' ? 'success' : event.status === 'overdue' ? 'danger' : 'warning'}">${event.status}</span>
                                                </li>
                                            `).join('')}
                                        </ul>
                                    ` : '<p class="text-muted">No upcoming services</p>'}
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
        // Check if user is authenticated
        if (!AuthManager.requireAuth('add users')) {
            return;
        }

        // Check if user is admin
        if (!AuthManager.isAdmin()) {
            Utils.showAlert('Only administrators can add new users', 'warning');
            return;
        }

        const modalTitle = 'Add New User';
        
        const formContent = `
            <form id="userForm">
                ${Utils.createFormField('Username', 'username', 'text', true).outerHTML}
                ${Utils.createFormField('Email', 'email', 'email', true).outerHTML}
                ${Utils.createFormField('Password', 'password', 'password', true).outerHTML}
                ${Utils.createFormField('Confirm Password', 'confirm_password', 'password', true).outerHTML}
                ${Utils.createFormField('Birthday', 'birthday', 'date', true).outerHTML}
                <div class="form-group">
                    <label>User Type</label>
                    <select class="form-control" name="user_type" id="user_type">
                        <option value="regular">Regular User</option>
                        <option value="admin">Administrator</option>
                    </select>
                    <small class="form-text text-muted">Note: Only one admin user can exist in the system.</small>
                </div>
            </form>
        `;

        Utils.ModalManager.show(modalTitle, formContent, usersManager.saveUser);
    },

    showEditForm: async (userId) => {
        try {
            const users = await Database.select(`SELECT * FROM Users WHERE user_id = ${userId}`);
            const user = users[0];
            if (!user) {
                Utils.showAlert('User not found', 'danger');
                return;
            }

            const formContent = `
                <form id="userForm">
                    ${Utils.createFormField('Username', 'username', 'text', true).outerHTML}
                    ${Utils.createFormField('Email', 'email', 'email', true).outerHTML}
                    ${Utils.createFormField('Birthday', 'birthday', 'date', true).outerHTML}
                    <div class="form-group">
                        <label>Change Password (optional)</label>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="changePassword" onchange="togglePasswordFields()">
                            <label class="form-check-label" for="changePassword">
                                Change password
                            </label>
                        </div>
                    </div>
                    <div id="passwordFields" style="display: none;">
                        ${Utils.createFormField('New Password', 'password', 'password', false).outerHTML}
                        ${Utils.createFormField('Confirm New Password', 'confirm_password', 'password', false).outerHTML}
                    </div>
                </form>
            `;

            // Populate form with existing data
            setTimeout(() => {
                document.getElementById('username').value = user.username || '';
                document.getElementById('email').value = user.email || '';
                document.getElementById('birthday').value = user.birthday || '';
            }, 100);

            Utils.ModalManager.show('Edit User', formContent, () => usersManager.saveUser(userId));
            
            // Add the toggle function to global scope
            window.togglePasswordFields = function() {
                const checkbox = document.getElementById('changePassword');
                const passwordFields = document.getElementById('passwordFields');
                const passwordInputs = passwordFields.querySelectorAll('input');
                
                if (checkbox.checked) {
                    passwordFields.style.display = 'block';
                    passwordInputs.forEach(input => input.required = true);
                } else {
                    passwordFields.style.display = 'none';
                    passwordInputs.forEach(input => {
                        input.required = false;
                        input.value = '';
                    });
                }
            };
            
        } catch (error) {
            console.error('Error loading user for edit:', error);
            Utils.showAlert(`Error loading user: ${error.message}`, 'danger');
        }
    },

    saveUser: async (userId = null) => {
        const form = document.getElementById('userForm');
        const formData = new FormData(form);
        
        const username = formData.get('username')?.trim();
        const email = formData.get('email')?.trim();
        const password = formData.get('password');
        const confirmPassword = formData.get('confirm_password');
        const birthday = formData.get('birthday');
        const userType = formData.get('user_type') || 'regular'; // Default to regular user

        // Validation with proper trimming
        if (!username || !email || !birthday) {
            Utils.showAlert('Username, email, and birthday are required', 'danger');
            return;
        }

        if (!Utils.validateEmail(email)) {
            Utils.showAlert('Please enter a valid email address', 'danger');
            return;
        }

        // For new users, password is required
        if (!userId && (!password || !confirmPassword)) {
            Utils.showAlert('Password and confirm password are required for new users', 'danger');
            return;
        }

        // For existing users, password is optional but must match if provided
        if (userId && password && confirmPassword && password !== confirmPassword) {
            Utils.showAlert('Passwords do not match', 'danger');
            return;
        }

        if ((!userId && password) || (userId && password)) {
            if (password.length < 6) {
                Utils.showAlert('Password must be at least 6 characters long', 'danger');
                return;
            }
        }

        // Validate admin user creation permissions
        if (!userId && userType === 'admin' && !AuthManager.isAdmin()) {
            Utils.showAlert('Only administrators can create admin users', 'warning');
            return;
        }

        try {
            if (userId) {
                // Update existing user in database
                const updateData = {
                    username: username,
                    email: email,
                    birthday: birthday
                };
                
                // Only update password if provided and confirmed
                if (password && confirmPassword && password === confirmPassword) {
                    updateData.password_hash = btoa(password).substring(0, 8).padEnd(60, '=');
                } else if (password || confirmPassword) {
                    Utils.showAlert('Both password fields must be filled and match', 'danger');
                    return;
                }
                
                await Database.updateRecord('Users', updateData, `user_id = ${userId}`);
                Utils.showAlert('User updated successfully', 'success');
            } else {
                // Add new user to database
                const registrationDate = new Date().toISOString().split('T')[0];
                
                // Handle admin user creation
                let finalUsername = username;
                if (userType === 'admin') {
                    // Check if admin user already exists
                    const existingAdmin = await Database.select('SELECT user_id FROM Users WHERE is_admin = 1');
                    if (existingAdmin.length > 0) {
                        Utils.showAlert('Admin user already exists. Only one admin user is allowed.', 'warning');
                        return;
                    }
                }
                
                const userData = {
                    username: finalUsername,
                    email: email,
                    password_hash: btoa(password).substring(0, 8).padEnd(60, '='),
                    birthday: birthday,
                    registration_date: registrationDate,
                    is_admin: userType === 'admin' ? 1 : 0
                };
                
                await Database.insertRecord('Users', userData);
                Utils.showAlert(`User added successfully${userType === 'admin' ? ' as administrator' : ''}`, 'success');
            }

            Utils.ModalManager.hide();
            usersManager.render();
        } catch (error) {
            console.error('Error saving user:', error);
            Utils.showAlert(`Error saving user: ${error.message}`, 'danger');
        }
    },

    deleteUser: async (userId) => {
        // Only admins can delete users
        if (!AuthManager.isAdmin()) {
            Utils.showAlert('Only administrators can delete users', 'warning');
            return;
        }

        if (!confirm('Are you sure you want to delete this user? This will also remove all associated ownership records.')) {
            return;
        }

        try {
            // Delete user from database
            const sql = `DELETE FROM Users WHERE user_id = ${userId}`;
            await Database.delete(sql);
            
            Utils.showAlert('User deleted successfully', 'success');
            usersManager.render();
        } catch (error) {
            Utils.showAlert(`Error deleting user: ${error.message}`, 'danger');
        }
    }
};

// Make usersManager available globally
window.usersManager = usersManager;