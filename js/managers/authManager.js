// Authentication Manager
const AuthManager = {
    currentUser: null,
    isAuthenticated: false,

    // Initialize authentication
    init: () => {
        AuthManager.checkSession();
        AuthManager.setupEventListeners();
    },

    // Check if user is logged in from session storage
    checkSession: () => {
        const savedUser = sessionStorage.getItem('currentUser');
        if (savedUser) {
            AuthManager.currentUser = JSON.parse(savedUser);
            AuthManager.isAuthenticated = true;
            AuthManager.updateUI();
        }
    },

    // Setup event listeners
    setupEventListeners: () => {
        // Login form submission
        document.getElementById('loginForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            AuthManager.login();
        });

        // Logout button
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            AuthManager.logout();
        });
    },

    // Login function
    login: () => {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (!username || !password) {
            Utils.showAlert('Please enter both username and password', 'warning');
            return;
        }

        // Find user in mock data
        const user = dataStore.users.find(u => u.username === username);
        
        if (!user) {
            Utils.showAlert('Invalid username or password', 'danger');
            return;
        }

        // For demo purposes, accept any password (in real app, verify password hash)
        if (password === 'password' || password === 'admin') {
            AuthManager.currentUser = {
                user_id: user.user_id,
                username: user.username,
                email: user.email,
                role: user.username === 'admin' ? 'admin' : 'user'
            };
            
            AuthManager.isAuthenticated = true;
            sessionStorage.setItem('currentUser', JSON.stringify(AuthManager.currentUser));
            
            AuthManager.updateUI();
            AuthManager.hideLoginModal();
            
            Utils.showAlert(`Welcome back, ${user.username}!`, 'success');
            
            // Refresh all tables to show user-specific data
            App.refreshAllTables();
        } else {
            Utils.showAlert('Invalid username or password', 'danger');
        }
    },

    // Logout function
    logout: () => {
        AuthManager.currentUser = null;
        AuthManager.isAuthenticated = false;
        sessionStorage.removeItem('currentUser');
        
        AuthManager.updateUI();
        Utils.showAlert('You have been logged out', 'info');
        
        // Refresh all tables
        App.refreshAllTables();
        
        // Show login modal after a short delay
        setTimeout(() => {
            AuthManager.showLoginModal();
        }, 500);
    },

    // Update UI based on authentication state
    updateUI: () => {
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const userInfo = document.getElementById('userInfo');
        const mainContent = document.querySelector('.container');
        const navItems = document.querySelectorAll('.nav-link');

        if (AuthManager.isAuthenticated) {
            // Show logout button and user info
            if (loginBtn) loginBtn.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'block';
            if (userInfo) {
                userInfo.style.display = 'block';
                userInfo.innerHTML = `
                    <span class="text-light">
                        <i class="fas fa-user"></i> 
                        ${AuthManager.currentUser.username} 
                        <span class="badge bg-${AuthManager.currentUser.role === 'admin' ? 'danger' : 'success'}">${AuthManager.currentUser.role}</span>
                    </span>
                `;
            }
            
            // Show main content
            if (mainContent) mainContent.style.display = 'block';
            
            // Enable navigation
            navItems.forEach(item => item.classList.remove('disabled'));
            
        } else {
            // Show login button
            if (loginBtn) loginBtn.style.display = 'block';
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (userInfo) userInfo.style.display = 'none';
            
            // Hide main content
            if (mainContent) mainContent.style.display = 'none';
            
            // Disable navigation
            navItems.forEach(item => item.classList.add('disabled'));
            
            // Auto-show login modal if not authenticated and not already showing
            const loginModal = document.getElementById('loginModal');
            if (loginModal && !loginModal.classList.contains('show')) {
                setTimeout(() => {
                    AuthManager.showLoginModal();
                }, 300);
            }
        }
    },

    // Show login modal
    showLoginModal: () => {
        const loginModalElement = document.getElementById('loginModal');
        const existingModal = bootstrap.Modal.getInstance(loginModalElement);
        
        // If modal is already showing, don't show another one
        if (existingModal && loginModalElement.classList.contains('show')) {
            return;
        }
        
        const loginModal = new bootstrap.Modal(loginModalElement);
        loginModal.show();
    },

    // Hide login modal
    hideLoginModal: () => {
        const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
        if (loginModal) {
            loginModal.hide();
        }
    },

    // Check if user is admin
    isAdmin: () => {
        return AuthManager.isAuthenticated && AuthManager.currentUser?.role === 'admin';
    },

    // Check if user can edit/delete a record
    canEditRecord: (recordUserId) => {
        if (!AuthManager.isAuthenticated) return false;
        if (AuthManager.isAdmin()) return true;
        return AuthManager.currentUser.user_id === recordUserId;
    },

    // Check if user can view a vehicle (based on ownership)
    canViewVehicle: (vin) => {
        if (!AuthManager.isAuthenticated) return false;
        if (AuthManager.isAdmin()) return true;
        
        // Check if user owns this vehicle
        const ownership = dataStore.owns.find(own => 
            own.vin === vin && 
            own.user_id === AuthManager.currentUser.user_id &&
            !own.end_date
        );
        
        return !!ownership;
    },

    // Get user's vehicles
    getUserVehicles: () => {
        if (!AuthManager.isAuthenticated) return [];
        if (AuthManager.isAdmin()) return dataStore.vehicles;
        
        return dataStore.owns
            .filter(own => own.user_id === AuthManager.currentUser.user_id && !own.end_date)
            .map(own => dataStore.vehicles.find(v => v.vin === own.vin))
            .filter(v => v); // Remove undefined entries
    },

    // Get user's expenses
    getUserExpenses: () => {
        if (!AuthManager.isAuthenticated) return [];
        if (AuthManager.isAdmin()) return dataStore.expenses;
        
        const userVehicles = AuthManager.getUserVehicles().map(v => v.vin);
        return dataStore.expenses.filter(expense => userVehicles.includes(expense.vin));
    },

    // Get user's fuel logs
    getUserFuelLogs: () => {
        if (!AuthManager.isAuthenticated) return [];
        if (AuthManager.isAdmin()) return dataStore.fuelLog;
        
        const userVehicles = AuthManager.getUserVehicles().map(v => v.vin);
        return dataStore.fuelLog.filter(log => userVehicles.includes(log.vin));
    },

    // Get user's service records
    getUserServiceRecords: () => {
        if (!AuthManager.isAuthenticated) return [];
        if (AuthManager.isAdmin()) return dataStore.serviceRecords;
        
        const userVehicles = AuthManager.getUserVehicles().map(v => v.vin);
        return dataStore.serviceRecords.filter(record => userVehicles.includes(record.vin));
    },

    // Get user's maintenance events
    getUserMaintenanceEvents: () => {
        if (!AuthManager.isAuthenticated) return [];
        if (AuthManager.isAdmin()) return dataStore.maintenanceEvents;
        
        return dataStore.maintenanceEvents.filter(event => event.user_id === AuthManager.currentUser.user_id);
    }
};

// Export for global access
window.AuthManager = AuthManager; 