// Main Application
const App = {
    init: () => {
        App.initializeManagers();
        App.setupNavigation();
        App.initializeAuthentication();
        App.showSection('users'); // Start with users section
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
    },

    initializeAuthentication: () => {
        // Initialize authentication
        AuthManager.init();
        
        // If not authenticated, show login modal after a short delay
        if (!AuthManager.isAuthenticated) {
            setTimeout(() => {
                AuthManager.showLoginModal();
            }, 300);
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
    },

    // Utility function to refresh all tables
    refreshAllTables: () => {
        usersManager.render();
        vehiclesManager.render();
        ownsManager.render();
        shopsManager.render();
        mechanicsManager.render();
        servicesManager.render();
        partsManager.render();
        expensesManager.render();
        fuelManager.render();
        maintenanceManager.render();
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
            reminderNotifications: dataStore.reminderNotifications
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