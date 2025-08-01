// Authentication Manager - Improved Version
const AuthManager = {
    currentUser: null,
    isAuthenticated: false,

    // Initialize authentication
    init: () => {
        AuthManager.checkSession();
        AuthManager.setupEventListeners();
        AuthManager.initializeModal();
    },

    // Initialize modal with proper Bootstrap setup
    initializeModal: () => {
        const loginModal = document.getElementById('loginModal');
        if (loginModal) {
            // Ensure modal is properly initialized
            if (!bootstrap.Modal.getInstance(loginModal)) {
                new bootstrap.Modal(loginModal, {
                    backdrop: true,
                    keyboard: true
                });
            }
        }
    },

    // Check if user is logged in from session storage
    checkSession: () => {
        const savedUser = sessionStorage.getItem('currentUser');
        
        if (savedUser) {
            try {
                const userData = JSON.parse(savedUser);
                AuthManager.currentUser = {
                    user_id: userData.user_id,
                    username: userData.username,
                    email: userData.email,
                    role: userData.role || (userData.username === 'admin' ? 'admin' : 'user')
                };
                
                // Ensure admin role is set correctly for admin user
                if (AuthManager.currentUser.username === 'admin') {
                    AuthManager.currentUser.role = 'admin';
                }
                AuthManager.isAuthenticated = true;
                AuthManager.updateUI();
                
                console.log('Session restored for user:', AuthManager.currentUser.username);
                
                // Validate session with database after a short delay
                setTimeout(() => {
                    AuthManager.validateSessionWithDatabase();
                }, 500);
                
            } catch (error) {
                console.error('Error restoring session:', error);
                AuthManager.clearSession();
            }
        } else {
            // No session found, ensure UI is in logged out state
            AuthManager.updateUI();
        }
    },

    // Clear session data
    clearSession: () => {
        sessionStorage.removeItem('currentUser');
        AuthManager.currentUser = null;
        AuthManager.isAuthenticated = false;
        AuthManager.updateUI();
    },

    // Validate session with database
    validateSessionWithDatabase: async () => {
        if (!AuthManager.currentUser) return;
        
        try {
            const users = await Database.select(`SELECT * FROM Users WHERE user_id = ${AuthManager.currentUser.user_id} AND username = '${AuthManager.currentUser.username}'`);
            
            if (users.length === 0) {
                console.log('User no longer exists in database, clearing session');
                AuthManager.clearSession();
                return;
            }
            
            // Session is valid, refresh all tables
            if (window.App && App.refreshAllTables) {
                App.refreshAllTables();
            }
            
        } catch (error) {
            console.error('Error validating session with database:', error);
            // Don't logout on database errors, just log the error
        }
    },

    // Setup event listeners
    setupEventListeners: () => {
        // Login form submission
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            console.log('Login form found, adding event listener'); // Debug log
            loginForm.addEventListener('submit', (e) => {
                console.log('Login form submitted!'); // Debug log
                e.preventDefault();
                AuthManager.login();
            });
        } else {
            console.error('Login form not found!'); // Debug log
        }

        // Signup form submission
        const signupForm = document.getElementById('signupForm');
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => {
                e.preventDefault();
                AuthManager.signup();
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                AuthManager.logout();
            });
        }

        // Tab switching with proper Bootstrap handling
        const authTabs = document.querySelectorAll('#authTabs .nav-link');
        authTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                AuthManager.switchAuthTab(tab);
            });
            
            // Also prevent Bootstrap's default tab behavior
            tab.addEventListener('shown.bs.tab', (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        // Modal events
        const loginModal = document.getElementById('loginModal');
        if (loginModal) {
            loginModal.addEventListener('hidden.bs.modal', () => {
                AuthManager.resetAuthForms();
            });
        }
    },

    // Switch between login and signup tabs
    switchAuthTab: (clickedTab) => {
        // Prevent default Bootstrap behavior
        // Note: event is not available in this context, so we don't call preventDefault here
        
        // Remove active class from all tabs and ensure they're not active
        document.querySelectorAll('#authTabs .nav-link').forEach(tab => {
            tab.classList.remove('active');
            tab.setAttribute('aria-selected', 'false');
        });
        
        // Remove active class from all tab panes
        document.querySelectorAll('#authTabContent .tab-pane').forEach(pane => {
            pane.classList.remove('show', 'active');
        });
        
        // Add active class to clicked tab and set aria-selected
        clickedTab.classList.add('active');
        clickedTab.setAttribute('aria-selected', 'true');
        
        // Show corresponding tab pane
        const targetId = clickedTab.getAttribute('data-bs-target');
        const targetPane = document.querySelector(targetId);
        if (targetPane) {
            targetPane.classList.add('show', 'active');
        }
        
        // Update modal button visibility and ensure they're accessible
        const isLoginTab = clickedTab.id === 'login-tab';
        const modalLoginBtn = document.getElementById('modalLoginBtn');
        const modalSignupBtn = document.getElementById('modalSignupBtn');
        
        if (modalLoginBtn) {
            modalLoginBtn.style.display = isLoginTab ? 'inline-block' : 'none';
            modalLoginBtn.style.pointerEvents = 'auto';
            modalLoginBtn.style.opacity = '1';
        }
        if (modalSignupBtn) {
            modalSignupBtn.style.display = isLoginTab ? 'none' : 'inline-block';
            modalSignupBtn.style.pointerEvents = 'auto';
            modalSignupBtn.style.opacity = '1';
        }
        
        // Force a small delay to ensure DOM updates are complete
        setTimeout(() => {
            // Double-check that only the clicked tab is active
            document.querySelectorAll('#authTabs .nav-link').forEach(tab => {
                if (tab !== clickedTab) {
                    tab.classList.remove('active');
                    tab.setAttribute('aria-selected', 'false');
                }
            });
        }, 10);
    },

    // Ensure proper tab state (only one tab active at a time)
    ensureProperTabState: () => {
        const authTabs = document.querySelectorAll('#authTabs .nav-link');
        let activeTabFound = false;
        
        authTabs.forEach(tab => {
            if (tab.classList.contains('active')) {
                if (activeTabFound) {
                    // Multiple active tabs found, remove all except the first one
                    tab.classList.remove('active');
                    tab.setAttribute('aria-selected', 'false');
                } else {
                    activeTabFound = true;
                    tab.setAttribute('aria-selected', 'true');
                }
            }
        });
        
        // If no active tab found, make the first one active
        if (!activeTabFound && authTabs.length > 0) {
            const firstTab = authTabs[0];
            firstTab.classList.add('active');
            firstTab.setAttribute('aria-selected', 'true');
            
            // Also activate the corresponding tab pane
            const targetId = firstTab.getAttribute('data-bs-target');
            const targetPane = document.querySelector(targetId);
            if (targetPane) {
                targetPane.classList.add('show', 'active');
            }
        }
    },

    // Reset authentication forms
    resetAuthForms: () => {
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');
        
        if (loginForm) loginForm.reset();
        if (signupForm) signupForm.reset();
        
        // Switch back to login tab
        const loginTab = document.getElementById('login-tab');
        if (loginTab) {
            AuthManager.switchAuthTab(loginTab);
        }
        
        // Ensure proper tab state after reset
        setTimeout(() => {
            AuthManager.ensureProperTabState();
        }, 50);
    },

    // Login function
    login: async () => {
        console.log('Login function called!'); // Debug log
        
        const username = document.getElementById('loginUsername')?.value?.trim();
        const password = document.getElementById('loginPassword')?.value;

        console.log('Username:', username); // Debug log
        console.log('Password length:', password ? password.length : 0); // Debug log

        if (!username || !password) {
            Utils.showAlert('Please enter both username and password', 'warning');
            return;
        }

        try {
            // Find user in database by username
            const users = await Database.select(`SELECT * FROM Users WHERE username = '${username}'`);
            const user = users[0];
            
            if (!user) {
                Utils.showAlert('Invalid username or password', 'danger');
                return;
            }

            // Verify password
            const expectedHash = btoa(password).substring(0, 8).padEnd(60, '=');
            
            if (user.username === username && user.password_hash === expectedHash) {
                AuthManager.currentUser = {
                    user_id: user.user_id,
                    username: user.username,
                    email: user.email,
                    role: user.username === 'admin' ? 'admin' : 'user'
                };
                
                // Ensure admin role is set correctly for admin user
                if (AuthManager.currentUser.username === 'admin') {
                    AuthManager.currentUser.role = 'admin';
                }
                
                AuthManager.isAuthenticated = true;
                sessionStorage.setItem('currentUser', JSON.stringify(AuthManager.currentUser));
                
                AuthManager.updateUI();
                AuthManager.hideLoginModal();
                
                // Force refresh UI state after a short delay to ensure all elements are updated
                setTimeout(() => {
                    AuthManager.updateUI();
                }, 100);
                
                Utils.showAlert(`Welcome back, ${user.username}!`, 'success');
                
                // Navigate to users section after successful login
                if (window.App && App.showSection) {
                    App.showSection('users');
                    // Update localStorage and URL hash
                    localStorage.setItem('activeSection', 'users');
                    window.location.hash = '#users-section';
                }
                
                // Refresh all tables to show user-specific data
                if (window.App && App.refreshAllTables) {
                    App.refreshAllTables();
                }
            } else {
                Utils.showAlert('Invalid username or password', 'danger');
            }
        } catch (error) {
            console.error('Login error:', error);
            Utils.showAlert(`Login error: ${error.message}`, 'danger');
        }
    },

    // Signup function
    signup: async () => {
        const username = document.getElementById('signupUsername')?.value?.trim();
        const email = document.getElementById('signupEmail')?.value?.trim();
        const password = document.getElementById('signupPassword')?.value;
        const confirmPassword = document.getElementById('signupConfirmPassword')?.value;
        const birthday = document.getElementById('signupBirthday')?.value;

        // Validation
        if (!username || !email || !password || !confirmPassword || !birthday) {
            Utils.showAlert('All fields are required', 'warning');
            return;
        }

        if (password !== confirmPassword) {
            Utils.showAlert('Passwords do not match', 'danger');
            return;
        }

        if (password.length < 6) {
            Utils.showAlert('Password must be at least 6 characters long', 'danger');
            return;
        }

        if (!Utils.validateEmail(email)) {
            Utils.showAlert('Please enter a valid email address', 'danger');
            return;
        }

        try {
            // Check if username already exists
            const existingUsers = await Database.select(`SELECT * FROM Users WHERE username = '${username}'`);
            if (existingUsers.length > 0) {
                Utils.showAlert('Username already exists. Please choose a different username.', 'danger');
                return;
            }

            // Check if email already exists
            const existingEmails = await Database.select(`SELECT * FROM Users WHERE email = '${email}'`);
            if (existingEmails.length > 0) {
                Utils.showAlert('Email already exists. Please use a different email address.', 'danger');
                return;
            }

            // Create new user
            const registrationDate = new Date().toISOString().split('T')[0];
            const userData = {
                username: username,
                email: email,
                password_hash: Utils.hashPassword(password),
                birthday: birthday,
                registration_date: registrationDate
            };

            await Database.insertRecord('Users', userData);
            
            Utils.showAlert('Account created successfully! You can now login.', 'success');
            
            // Switch to login tab
            const loginTab = document.getElementById('login-tab');
            if (loginTab) {
                AuthManager.switchAuthTab(loginTab);
            }
            
        } catch (error) {
            console.error('Error creating account:', error);
            Utils.showAlert(`Error creating account: ${error.message}`, 'danger');
        }
    },

    // Logout function
    logout: () => {
        AuthManager.clearSession();
        Utils.showAlert('You have been logged out', 'info');
        
        // Refresh all tables to clear data
        if (window.App && App.refreshAllTables) {
            App.refreshAllTables();
        }
        
        // Show login modal immediately
        AuthManager.showLoginModal();
    },

    // Update UI based on authentication state
    updateUI: () => {
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const userInfo = document.getElementById('userInfo');
        const mainContent = document.querySelector('.container');
        const navItems = document.querySelectorAll('.nav-link');



        if (AuthManager.isAuthenticated && AuthManager.currentUser) {
            // Show logout button and user info
            if (loginBtn) {
                loginBtn.style.display = 'none';
            }
            if (logoutBtn) {
                logoutBtn.style.display = 'inline-block';
            }
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
            navItems.forEach(item => {
                item.classList.remove('disabled');
                item.style.pointerEvents = 'auto';
            });
            
            // Show/hide test navigation based on admin status
            const testNavItem = document.getElementById('test-nav-item');
            if (testNavItem) {
                if (AuthManager.currentUser.role === 'admin') {
                    testNavItem.style.display = 'block';
                } else {
                    testNavItem.style.display = 'none';
                }
            }
            
            // Hide login modal if it's showing
            AuthManager.hideLoginModal();
            
        } else {
            // Show login button
            if (loginBtn) {
                loginBtn.style.display = 'inline-block';
            }
            if (logoutBtn) {
                logoutBtn.style.display = 'none';
            }
            if (userInfo) {
                userInfo.style.display = 'none';
            }
            
            // Show main content
            if (mainContent) mainContent.style.display = 'block';
            
            // Disable main navigation but keep login-related elements accessible
            navItems.forEach(item => {
                // Don't disable the login button in navbar or Add buttons
                if (!item.closest('.navbar-nav.align-items-center') && 
                    !item.closest('.btn[onclick*="showAddForm"]')) {
                    item.classList.add('disabled');
                    item.style.pointerEvents = 'none';
                }
            });
            
            // Hide test navigation when not authenticated
            const testNavItem = document.getElementById('test-nav-item');
            if (testNavItem) {
                testNavItem.style.display = 'none';
            }
            
            // Auto-show login modal if not authenticated
            if (!AuthManager.isAuthenticated) {
                AuthManager.showLoginModal();
            }
        }
    },

    // Show login modal
    showLoginModal: () => {
        const loginModalElement = document.getElementById('loginModal');
        if (!loginModalElement) return;
        
        const existingModal = bootstrap.Modal.getInstance(loginModalElement);
        
        // If modal is already showing, don't show another one
        if (existingModal && loginModalElement.classList.contains('show')) {
            return;
        }
        
        // Reset forms and switch to login tab
        AuthManager.resetAuthForms();
        
        const loginModal = existingModal || new bootstrap.Modal(loginModalElement);
        loginModal.show();
        
        // Ensure all modal elements are accessible and proper tab state
        setTimeout(() => {
            const modalElements = loginModalElement.querySelectorAll('*');
            modalElements.forEach(element => {
                element.style.pointerEvents = 'auto';
                element.style.opacity = '1';
            });
            AuthManager.ensureProperTabState();
        }, 100);
    },

    // Hide login modal
    hideLoginModal: () => {
        const loginModalElement = document.getElementById('loginModal');
        if (!loginModalElement) return;
        
        const loginModal = bootstrap.Modal.getInstance(loginModalElement);
        if (loginModal) {
            loginModal.hide();
        }
        
        // Force remove backdrop if it's stuck
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.remove();
        }
        
        // Remove modal-open class from body
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
    },

    // Force close modal (emergency function)
    forceCloseModal: () => {
        const loginModalElement = document.getElementById('loginModal');
        if (loginModalElement) {
            loginModalElement.classList.remove('show');
            loginModalElement.style.display = 'none';
            loginModalElement.setAttribute('aria-hidden', 'true');
        }
        
        // Remove all modal backdrops
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(backdrop => backdrop.remove());
        
        // Reset body
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
    },

    // Check if user is admin
    isAdmin: () => {
        const isAdmin = AuthManager.isAuthenticated && 
                       AuthManager.currentUser && 
                       (AuthManager.currentUser.role === 'admin' || AuthManager.currentUser.username === 'admin');
        
        // Debug logging
        console.log('isAdmin check:', {
            isAuthenticated: AuthManager.isAuthenticated,
            currentUser: AuthManager.currentUser,
            role: AuthManager.currentUser?.role,
            username: AuthManager.currentUser?.username,
            result: isAdmin
        });
        
        return isAdmin;
    },

    // Force refresh admin status (useful for debugging)
    refreshAdminStatus: () => {
        if (AuthManager.currentUser && AuthManager.currentUser.username === 'admin') {
            AuthManager.currentUser.role = 'admin';
            sessionStorage.setItem('currentUser', JSON.stringify(AuthManager.currentUser));
            console.log('Admin status refreshed');
        }
    },

    // Check if user can edit/delete a record
    canEditRecord: (recordUserId) => {
        if (!AuthManager.isAuthenticated) return false;
        if (AuthManager.isAdmin()) return true;
        return AuthManager.currentUser.user_id === recordUserId;
    },

    // Check if user can perform actions (redirects to login if not authenticated)
    requireAuth: (actionName = 'this action') => {
        if (!AuthManager.isAuthenticated) {
            Utils.showAlert(`Please log in to ${actionName}`, 'warning');
            AuthManager.showLoginModal();
            return false;
        }
        return true;
    },

    // Get user's vehicles
    getUserVehicles: async () => {
        if (!AuthManager.isAuthenticated) return [];
        if (AuthManager.isAdmin()) {
            try {
                return await Database.select('SELECT * FROM Vehicles');
            } catch (error) {
                console.error('Error getting all vehicles:', error);
                return [];
            }
        }
        
        try {
            return await Database.select(`
                SELECT v.* FROM Vehicles v
                JOIN Owns o ON v.vin = o.vin
                WHERE o.user_id = ${AuthManager.currentUser.user_id}
                AND (o.end_date IS NULL OR o.end_date > CURDATE())
            `);
        } catch (error) {
            console.error('Error getting user vehicles:', error);
            return [];
        }
    },

    // Get user's expenses
    getUserExpenses: async () => {
        if (!AuthManager.isAuthenticated) return [];
        if (AuthManager.isAdmin()) {
            try {
                return await Database.select('SELECT * FROM Expenses ORDER BY date DESC');
            } catch (error) {
                console.error('Error getting all expenses:', error);
                return [];
            }
        }
        
        try {
            const userVehicles = await AuthManager.getUserVehicles();
            const vehicleVins = userVehicles.map(v => v.vin);
            if (vehicleVins.length === 0) return [];
            
            const vinList = vehicleVins.map(vin => `'${vin}'`).join(',');
            return await Database.select(`
                SELECT * FROM Expenses 
                WHERE vin IN (${vinList})
                ORDER BY date DESC
            `);
        } catch (error) {
            console.error('Error getting user expenses:', error);
            return [];
        }
    },

    // Get user's fuel logs
    getUserFuelLogs: async () => {
        if (!AuthManager.isAuthenticated) return [];
        if (AuthManager.isAdmin()) {
            try {
                return await Database.select('SELECT * FROM FuelLog ORDER BY date_filled DESC');
            } catch (error) {
                console.error('Error getting all fuel logs:', error);
                return [];
            }
        }
        
        try {
            const userVehicles = await AuthManager.getUserVehicles();
            const vehicleVins = userVehicles.map(v => v.vin);
            if (vehicleVins.length === 0) return [];
            
            const vinList = vehicleVins.map(vin => `'${vin}'`).join(',');
            return await Database.select(`
                SELECT * FROM FuelLog 
                WHERE vin IN (${vinList})
                ORDER BY date_filled DESC
            `);
        } catch (error) {
            console.error('Error getting user fuel logs:', error);
            return [];
        }
    },

    // Get user's service records
    getUserServiceRecords: async () => {
        if (!AuthManager.isAuthenticated) return [];
        if (AuthManager.isAdmin()) {
            try {
                return await Database.select('SELECT * FROM ServiceRecords ORDER BY service_date DESC');
            } catch (error) {
                console.error('Error getting all service records:', error);
                return [];
            }
        }
        
        try {
            const userVehicles = await AuthManager.getUserVehicles();
            const vehicleVins = userVehicles.map(v => v.vin);
            if (vehicleVins.length === 0) return [];
            
            const vinList = vehicleVins.map(vin => `'${vin}'`).join(',');
            return await Database.select(`
                SELECT * FROM ServiceRecords 
                WHERE vin IN (${vinList})
                ORDER BY service_date DESC
            `);
        } catch (error) {
            console.error('Error getting user service records:', error);
            return [];
        }
    },

    // Get user's maintenance events
    getUserMaintenanceEvents: async () => {
        if (!AuthManager.isAuthenticated) return [];
        if (AuthManager.isAdmin()) {
            try {
                return await Database.select('SELECT * FROM MaintenanceEvents ORDER BY rec_date DESC');
            } catch (error) {
                console.error('Error getting all maintenance events:', error);
                return [];
            }
        }
        
        try {
            return await Database.select(`
                SELECT * FROM MaintenanceEvents 
                WHERE user_id = ${AuthManager.currentUser.user_id}
                ORDER BY rec_date DESC
            `);
        } catch (error) {
            console.error('Error getting user maintenance events:', error);
            return [];
        }
    }
};

// Export for global access
window.AuthManager = AuthManager;

// Emergency escape function - call this in browser console if modal gets stuck
window.escapeModal = () => {
    AuthManager.forceCloseModal();
    console.log('Modal force closed. You should now be able to interact with the page.');
}; 