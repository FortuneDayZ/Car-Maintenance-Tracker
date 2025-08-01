// Main Application
const App = {
    init: () => {
        // Initialize authentication FIRST
        App.initializeAuthentication();
        
        // Initialize service types
        App.initializeServiceTypes();
        
        // Then initialize managers
        App.initializeManagers();
        
        // Setup navigation
        App.setupNavigation();
        
        // For non-authenticated users, restore active section (will show login modal)
        // For authenticated users, the section is already set in initializeAuthentication
        if (!AuthManager.isAuthenticated) {
            App.restoreActiveSection();
        }
    },

    // Initialize predefined service types in the database
    initializeServiceTypes: async () => {
        try {
            // Check if service types already exist
            const existingTypes = await Database.select('SELECT COUNT(*) as count FROM ServiceTypes');
            
            if (existingTypes[0].count === 0) {
                // Define predefined service types
                const predefinedServiceTypes = [
                    'Oil Change',
                    'Tire Rotation',
                    'Brake Service',
                    'Air Filter Replacement',
                    'Battery Replacement',
                    'Transmission Service',
                    'Engine Tune-up',
                    'Coolant Flush'
                ];

                // Insert each service type
                for (const serviceType of predefinedServiceTypes) {
                    await Database.insertRecord('ServiceTypes', { service_type: serviceType });
                }

                console.log('Service types initialized successfully');
            } else {
                console.log('Service types already exist in database');
            }
        } catch (error) {
            console.error('Error initializing service types:', error);
        }
    },

    initializeManagers: () => {
        // Initialize all managers
        usersManager.init();
        vehiclesManager.init();
        ownsManager.init();
        shopsManager.init();
        mechanicsManager.init();
        servicesManager.init();
        partsManager.init();
        expensesManager.init();
        fuelManager.init();
        maintenanceManager.init();
        analyticsManager.init();
        testManager.init();
    },

    initializeAuthentication: () => {
        // Initialize authentication
        AuthManager.init();
        
        // Handle UI state immediately
        if (!AuthManager.isAuthenticated) {
            // Show login modal if not authenticated
            AuthManager.showLoginModal();
        } else {
            // If authenticated, navigate to users section and refresh all tables
            App.showSection('users');
            localStorage.setItem('activeSection', 'users');
            window.location.hash = '#users-section';
            App.refreshAllTables();
        }
    },

    setupNavigation: () => {
        // Handle navigation clicks
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Remove active class from all nav links
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                
                // Add active class to clicked link
                link.classList.add('active');
                
                // Get section name from data attribute
                const section = link.getAttribute('data-section');
                App.showSection(section);
                
                // Store the active section in localStorage
                localStorage.setItem('activeSection', section);
                
                // Update URL hash
                window.location.hash = `#${section}-section`;
            });
        });
    },

    showSection: (sectionName) => {
        // Hide all content sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show the selected section
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        // Update navigation active state
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-section') === sectionName) {
                link.classList.add('active');
            }
        });
    },

    restoreActiveSection: () => {
        // Try to get section from URL hash first
        const hash = window.location.hash;
        let sectionName = 'users'; // default fallback
        
        if (hash) {
            // Extract section name from hash (e.g., "#vehicles-section" -> "vehicles")
            const match = hash.match(/#([^-]+)-section/);
            if (match && match[1]) {
                sectionName = match[1];
            }
        } else {
            // If no hash, try localStorage
            const savedSection = localStorage.getItem('activeSection');
            if (savedSection) {
                sectionName = savedSection;
            }
        }
        
        // Validate that the section exists
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (!targetSection) {
            sectionName = 'users'; // fallback if section doesn't exist
        }
        
        // Show the section
        App.showSection(sectionName);
        
        // Store in localStorage for future use
        localStorage.setItem('activeSection', sectionName);
    },

    // Utility function to refresh all tables
    refreshAllTables: async () => {
        try {
            await usersManager.render();
            await vehiclesManager.render();
            await ownsManager.render();
            await shopsManager.render();
            await mechanicsManager.render();
            await servicesManager.render();
            await partsManager.render();
            await expensesManager.render();
            await fuelManager.render();
            await maintenanceManager.render();
            await analyticsManager.render();
            
            console.log('All tables refreshed successfully');
        } catch (error) {
            console.error('Error refreshing all tables:', error);
        }
    },

    // Export data function (for debugging/backup)
    exportData: () => {
        const data = {
            users: dataStore.users,
            vehicles: dataStore.vehicles,
            owns: dataStore.owns,
            carShops: dataStore.carShops,
            mechanics: dataStore.mechanics,
            serviceRecords: dataStore.serviceRecords,
            workedOn: dataStore.workedOn,
            serviceTypes: dataStore.serviceTypes,
            serviceRecords_ServiceTypes: dataStore.serviceRecords_ServiceTypes,
            parts: dataStore.parts,
            serviceRecords_Parts: dataStore.serviceRecords_Parts,
            expenses: dataStore.expenses,
            fuelLog: dataStore.fuelLog,
            maintenanceEvents: dataStore.maintenanceEvents,
            maintenanceEvents_ServiceTypes: dataStore.maintenanceEvents_ServiceTypes,
            reminder: dataStore.reminder
        };

        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'vehicle-management-data.json';
        link.click();
        
        URL.revokeObjectURL(url);
        Utils.showAlert('Data exported successfully!', 'success');
    },

    // Import data function (for debugging/backup)
    importData: (jsonData) => {
        try {
            const importedData = JSON.parse(jsonData);
            
            // Update data store with imported data
            Object.keys(importedData).forEach(key => {
                if (dataStore.hasOwnProperty(key)) {
                    dataStore[key] = importedData[key];
                }
            });
            
            App.refreshAllTables();
            Utils.showAlert('Data imported successfully!', 'success');
        } catch (error) {
            Utils.showAlert('Error importing data: ' + error.message, 'danger');
        }
    }
};

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    App.init();
    
    // Add hash change listener for browser back/forward navigation
    window.addEventListener('hashchange', () => {
        App.restoreActiveSection();
    });
    
    // Add some helpful console messages
    console.log('Vehicle Management System loaded successfully!');
    console.log('Available data:', dataStore);
    console.log('Use App.exportData() to export current data');
    console.log('Use App.importData(jsonString) to import data');
});

// Add global functions for easy access
window.App = App;
window.exportData = App.exportData;
window.importData = App.importData; 