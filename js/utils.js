// Utility functions for Vehicle Management System

// Global data storage
let dataStore = {
    users: [...mockUsers],
    vehicles: [...mockVehicles],
    owns: [...mockOwns],
    carShops: [...mockCarShops],
    mechanics: [...mockMechanics],
    serviceRecords: [...mockServiceRecords],
    workedOn: [...mockWorkedOn],
    serviceTypes: [...mockServiceTypes],
    serviceRecords_ServiceTypes: [...mockServiceRecords_ServiceTypes],
    parts: [...mockParts],
    serviceRecords_Parts: [...mockServiceRecords_Parts],
    expenses: [...mockExpenses],
    fuelLog: [...mockFuelLog],
    maintenanceEvents: [...mockMaintenanceEvents],
    maintenanceEvents_ServiceTypes: [...mockMaintenanceEvents_ServiceTypes],
    reminderNotifications: [...mockReminderNotifications]
};

// Utility functions
const Utils = {
    // Generate next ID for a given data type
    getNextId: (dataArray, idField) => {
        if (dataArray.length === 0) return 1;
        const maxId = Math.max(...dataArray.map(item => item[idField]));
        return maxId + 1;
    },

    // Format currency
    formatCurrency: (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    },

    // Format date
    formatDate: (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    },

    // Validate email
    validateEmail: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // Validate VIN
    validateVIN: (vin) => {
        return vin && vin.length === 17;
    },

    // Show alert
    showAlert: (message, type = 'info') => {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        const container = document.querySelector('.container');
        container.insertBefore(alertDiv, container.firstChild);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    },

    // Create form field
    createFormField: (label, name, type = 'text', required = true, options = null) => {
        const formGroup = document.createElement('div');
        formGroup.className = 'mb-3';
        
        const labelElement = document.createElement('label');
        labelElement.className = 'form-label';
        labelElement.htmlFor = name;
        labelElement.textContent = label;
        
        let inputElement;
        
        if (type === 'select') {
            inputElement = document.createElement('select');
            inputElement.className = 'form-select';
            inputElement.name = name;
            inputElement.id = name;
            if (required) inputElement.required = true;
            
            // Add default option
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = `Select ${label}`;
            inputElement.appendChild(defaultOption);
            
            // Add options
            if (options) {
                options.forEach(option => {
                    const optionElement = document.createElement('option');
                    optionElement.value = option.value;
                    optionElement.textContent = option.text;
                    inputElement.appendChild(optionElement);
                });
            }
        } else if (type === 'textarea') {
            inputElement = document.createElement('textarea');
            inputElement.className = 'form-control';
            inputElement.rows = 3;
        } else {
            inputElement = document.createElement('input');
            inputElement.type = type;
            inputElement.className = 'form-control';
        }
        
        inputElement.name = name;
        inputElement.id = name;
        if (required) inputElement.required = true;
        
        formGroup.appendChild(labelElement);
        formGroup.appendChild(inputElement);
        
        return formGroup;
    },

    // Get related data
    getRelatedData: {
        // Get vehicles owned by a user
        getUserVehicles: (userId) => {
            return dataStore.owns
                .filter(own => own.user_id === userId && !own.end_date)
                .map(own => {
                    const vehicle = dataStore.vehicles.find(v => v.vin === own.vin);
                    return { ...vehicle, ownership_start: own.start_date };
                });
        },

        // Get users who own a vehicle
        getVehicleOwners: (vin) => {
            return dataStore.owns
                .filter(own => own.vin === vin && !own.end_date)
                .map(own => {
                    const user = dataStore.users.find(u => u.user_id === own.user_id);
                    return { ...user, ownership_start: own.start_date };
                });
        },

        // Get mechanics who worked on a service
        getServiceMechanics: (serviceId) => {
            return dataStore.workedOn
                .filter(work => work.service_id === serviceId)
                .map(work => {
                    return dataStore.mechanics.find(m => m.mechanic_id === work.mechanic_id);
                });
        },

        // Get services performed by a mechanic
        getMechanicServices: (mechanicId) => {
            return dataStore.workedOn
                .filter(work => work.mechanic_id === mechanicId)
                .map(work => {
                    return dataStore.serviceRecords.find(s => s.service_id === work.service_id);
                });
        },

        // Get parts used in a service
        getServiceParts: (serviceId) => {
            return dataStore.serviceRecords_Parts
                .filter(sp => sp.service_id === serviceId)
                .map(sp => {
                    return dataStore.parts.find(p => p.part_id === sp.part_id);
                });
        },

        // Get services that used a part
        getPartServices: (partId) => {
            return dataStore.serviceRecords_Parts
                .filter(sp => sp.part_id === partId)
                .map(sp => {
                    return dataStore.serviceRecords.find(s => s.service_id === sp.service_id);
                });
        },

        // Get service types for a service record
        getServiceTypes: (serviceId) => {
            return dataStore.serviceRecords_ServiceTypes
                .filter(st => st.service_id === serviceId)
                .map(st => st.service_type);
        },

        // Get expenses for a vehicle
        getVehicleExpenses: (vin) => {
            return dataStore.expenses.filter(expense => expense.vin === vin);
        },

        // Get fuel logs for a vehicle
        getVehicleFuelLogs: (vin) => {
            return dataStore.fuelLog.filter(log => log.vin === vin);
        },

        // Get maintenance events for a user
        getUserMaintenanceEvents: (userId) => {
            return dataStore.maintenanceEvents.filter(event => event.user_id === userId);
        },

        // Get car shop mechanics
        getShopMechanics: (shopId) => {
            return dataStore.mechanics.filter(mechanic => mechanic.car_shop_id === shopId);
        }
    },

    // Create relationship badges
    createRelationshipBadges: (data, type) => {
        const badges = [];
        
        switch (type) {
            case 'user':
                const vehicles = Utils.getRelatedData.getUserVehicles(data.user_id);
                if (vehicles.length > 0) {
                    badges.push(`<span class="badge bg-primary">${vehicles.length} Vehicle(s)</span>`);
                }
                break;
            case 'vehicle':
                const owners = Utils.getRelatedData.getVehicleOwners(data.vin);
                if (owners.length > 0) {
                    badges.push(`<span class="badge bg-success">${owners.length} Owner(s)</span>`);
                }
                const expenses = Utils.getRelatedData.getVehicleExpenses(data.vin);
                if (expenses.length > 0) {
                    badges.push(`<span class="badge bg-warning">${expenses.length} Expense(s)</span>`);
                }
                break;
            case 'service':
                const mechanics = Utils.getRelatedData.getServiceMechanics(data.service_id);
                if (mechanics.length > 0) {
                    badges.push(`<span class="badge bg-info">${mechanics.length} Mechanic(s)</span>`);
                }
                const parts = Utils.getRelatedData.getServiceParts(data.service_id);
                if (parts.length > 0) {
                    badges.push(`<span class="badge bg-secondary">${parts.length} Part(s)</span>`);
                }
                break;
        }
        
        return badges.join(' ');
    },

    // Create detail row for expandable content
    createDetailRow: (content) => {
        const detailRow = document.createElement('tr');
        detailRow.className = 'detail-row';
        const detailCell = document.createElement('td');
        detailCell.colSpan = 10;
        detailCell.innerHTML = content;
        detailRow.appendChild(detailCell);
        return detailRow;
    },

    // Toggle detail row visibility
    toggleDetailRow: (button, detailRow) => {
        const isVisible = detailRow.style.display !== 'none';
        detailRow.style.display = isVisible ? 'none' : 'table-row';
        button.innerHTML = isVisible ? 
            '<i class="fas fa-chevron-down"></i>' : 
            '<i class="fas fa-chevron-up"></i>';
    },

    // Modal management
    ModalManager: {
        modal: null,
        modalTitle: null,
        modalBody: null,
        saveButton: null,

        init: () => {
            Utils.ModalManager.modal = new bootstrap.Modal(document.getElementById('formModal'));
            Utils.ModalManager.modalTitle = document.getElementById('modalTitle');
            Utils.ModalManager.modalBody = document.getElementById('modalBody');
            Utils.ModalManager.saveButton = document.getElementById('saveButton');
        },

        show: (title, content, onSave) => {
            Utils.ModalManager.modalTitle.textContent = title;
            Utils.ModalManager.modalBody.innerHTML = content;
            
            // Clear previous event listeners
            const newSaveButton = Utils.ModalManager.saveButton.cloneNode(true);
            Utils.ModalManager.saveButton.parentNode.replaceChild(newSaveButton, Utils.ModalManager.saveButton);
            Utils.ModalManager.saveButton = newSaveButton;
            
            if (onSave) {
                Utils.ModalManager.saveButton.addEventListener('click', onSave);
            }
            
            Utils.ModalManager.modal.show();
        },

        hide: () => {
            Utils.ModalManager.modal.hide();
        }
    }
};

// Initialize modal manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    Utils.ModalManager.init();
}); 