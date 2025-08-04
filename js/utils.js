// Utility functions for Vehicle Management System

// Global data storage - No longer needed as we use database directly
// let dataStore = { ... }; // Removed - all data now comes from database

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
        // Safely convert to number and handle non-numeric values
        const numericAmount = Number(amount) || 0;
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(numericAmount);
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

    // Hash password (simple base64 encoding for demo purposes)
    hashPassword: (password) => {
        // Create a simple hash that matches the admin password format
        // This is the same format used in setup_admin.sql
        const base64 = btoa(password);
        const hash = base64.substring(0, 8) + '='.repeat(52);
        return hash;
    },

    // Show alert
    showAlert: (message, type = 'info') => {
        const notificationContainer = document.getElementById('notification-container');
        if (!notificationContainer) {
            console.error('Notification container not found');
            return;
        }

        const notificationDiv = document.createElement('div');
        notificationDiv.className = `alert alert-${type} alert-dismissible fade show shadow-sm mb-2`;
        notificationDiv.style.cssText = `
            border-left: 4px solid;
            border-left-color: ${type === 'success' ? '#28a745' : type === 'danger' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#17a2b8'};
            background: white;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            animation: slideInRight 0.3s ease-out;
        `;
        
        notificationDiv.innerHTML = `
            <div class="d-flex align-items-start">
                <div class="flex-grow-1">
                    <small class="text-muted mb-1 d-block">${new Date().toLocaleTimeString()}</small>
                    <div class="fw-medium">${message}</div>
                </div>
                <button type="button" class="btn-close ms-2" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        
        // Add to notification container
        notificationContainer.appendChild(notificationDiv);
        
        // Auto-remove after 4 seconds
        setTimeout(() => {
            if (notificationDiv.parentNode) {
                notificationDiv.style.animation = 'slideOutRight 0.3s ease-in';
                setTimeout(() => {
                    if (notificationDiv.parentNode) {
                        notificationDiv.remove();
                    }
                }, 300);
            }
        }, 4000);
    },

    // Show custom modal with flexible button configuration
    showModal: (title, content, onConfirm, confirmText = 'Save', cancelText = 'Cancel') => {
        // Create modal HTML
        const modalHtml = `
            <div class="modal fade" id="customModal" tabindex="-1" aria-labelledby="customModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="customModalLabel">${title}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            ${content}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">${cancelText}</button>
                            <button type="button" class="btn btn-primary" id="customModalConfirm">${confirmText}</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('customModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Get modal element
        const modal = document.getElementById('customModal');
        const modalInstance = new bootstrap.Modal(modal);

        // Add event listener for confirm button
        const confirmBtn = document.getElementById('customModalConfirm');
        if (onConfirm) {
            confirmBtn.addEventListener('click', async () => {
                try {
                    await onConfirm();
                    modalInstance.hide();
                } catch (error) {
                    console.error('Error in modal confirmation:', error);
                }
            });
        } else {
            confirmBtn.addEventListener('click', () => {
                modalInstance.hide();
            });
        }

        // Clean up modal when hidden
        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });

        // Show modal
        modalInstance.show();
    },

    // Create form field
    createFormField: (label, name, type = 'text', required = true, options = null) => {
        const formGroup = document.createElement('div');
        formGroup.className = 'mb-3';
        
        const labelElement = document.createElement('label');
        labelElement.className = 'form-label';
        if (required) {
            labelElement.classList.add('required');
        }
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

    // Get related data - Removed as all data now comes from database directly
    // getRelatedData: { ... } // Removed - all managers now use database queries directly

    // Create relationship badges
    createRelationshipBadges: (data, type) => {
        const badges = [];
        
        switch (type) {
            case 'user':
                // User relationship badges - simplified since data is loaded dynamically
                badges.push(`<span class="badge bg-primary">User</span>`);
                break;
            case 'vehicle':
                // Vehicle relationship badges - simplified since data is loaded dynamically
                badges.push(`<span class="badge bg-success">Vehicle</span>`);
                break;
            case 'service':
                // Service relationship badges - simplified since data is loaded dynamically
                badges.push(`<span class="badge bg-info">Service</span>`);
                break;
            case 'expense':
                // Expense relationship badges - simplified since data is loaded dynamically
                badges.push(`<span class="badge bg-danger">Expense</span>`);
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

    // Global refresh function for vehicle-related sections
    refreshVehicleRelatedSections: async () => {
        try {
            // Refresh all sections that depend on vehicle data
            if (window.vehiclesManager) {
                await vehiclesManager.render();
            }
            if (window.ownsManager) {
                await ownsManager.render();
            }
            if (window.expensesManager) {
                await expensesManager.render();
            }
            if (window.fuelManager) {
                await fuelManager.render();
            }
            if (window.servicesManager) {
                await servicesManager.render();
            }
            if (window.maintenanceManager) {
                await maintenanceManager.render();
            }
            
            console.log('All vehicle-related sections refreshed successfully');
        } catch (error) {
            console.error('Error refreshing vehicle-related sections:', error);
        }
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
    },

    // Populate form fields with data
    populateForm: (data, delay = 100) => {
        setTimeout(() => {
            Object.keys(data).forEach(fieldName => {
                const field = document.getElementById(fieldName);
                if (field) {
                    let value = data[fieldName];
                    
                    // Handle date fields - ensure proper format for HTML date inputs
                    if (field.type === 'date' && value) {
                        // If the date is already in YYYY-MM-DD format, use it as is
                        // Otherwise, try to format it properly
                        if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
                            field.value = value;
                        } else {
                            // Try to parse and format the date
                            try {
                                const date = new Date(value);
                                if (!isNaN(date.getTime())) {
                                    field.value = date.toISOString().split('T')[0];
                                } else {
                                    field.value = value;
                                }
                            } catch (e) {
                                field.value = value;
                            }
                        }
                    } else {
                        field.value = value;
                    }
                }
            });
        }, delay);
    }
};

// Enhanced logging system for database test errors
const LoggingSystem = {
    logFile: 'database_test_errors.log',
    
    // Log error to file and optionally display in frontend
    logError: async (error, context = '', displayInFrontend = true) => {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp: timestamp,
            context: context,
            error: error.message || error,
            stack: error.stack,
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        // Log to console for immediate debugging
        console.error(`[${timestamp}] ${context}:`, error);
        
        // Log to file via backend
        try {
            const response = await fetch('/api/log-error', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(logEntry)
            });
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Failed to log error to backend:', errorText);
            }
        } catch (logError) {
            console.error('Failed to write to log file:', logError);
        }
        
        // Display in frontend if requested
        if (displayInFrontend) {
            Utils.showAlert(`Error: ${error.message || error}`, 'danger');
        }
        
        return logEntry;
    },
    
    // Log database test specific errors
    logDatabaseTestError: async (error, testType = '', sqlQuery = '') => {
        const context = `Database Test - ${testType}`;
        const enhancedError = {
            message: error.message || error,
            stack: error.stack,
            sqlQuery: sqlQuery,
            testType: testType
        };
        
        return await LoggingSystem.logError(enhancedError, context, true);
    },
    
    // Log SQL execution errors
    logSQLExecutionError: async (error, sqlStatement = '', statementIndex = null) => {
        const context = `SQL Execution${statementIndex !== null ? ` - Statement ${statementIndex + 1}` : ''}`;
        const enhancedError = {
            message: error.message || error,
            stack: error.stack,
            sqlStatement: sqlStatement,
            statementIndex: statementIndex
        };
        
        return await LoggingSystem.logError(enhancedError, context, true);
    },
    
    // Get log file contents (for admin viewing)
    getLogContents: async () => {
        try {
            const response = await fetch('/api/get-logs');
            
            if (response.ok) {
                return await response.text();
            } else {
                const errorText = await response.text();
                console.error('Server response error:', errorText);
                throw new Error(`Server error: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.error('Error fetching log contents:', error);
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Network error: Unable to connect to the server. Please check if the backend is running.');
            }
            throw error;
        }
    },
    
    // Clear log file
    clearLogs: async () => {
        try {
            const response = await fetch('/api/clear-logs', { method: 'POST' });
            if (response.ok) {
                Utils.showAlert('Log file cleared successfully', 'success');
            } else {
                throw new Error('Failed to clear log file');
            }
        } catch (error) {
            console.error('Error clearing log file:', error);
            Utils.showAlert(`Error clearing log file: ${error.message}`, 'danger');
        }
    },
    
    // Display log contents in a modal
    showLogs: async () => {
        try {
            const logContents = await LoggingSystem.getLogContents();
            const modal = `
                <div class="modal fade" id="logModal" tabindex="-1">
                    <div class="modal-dialog modal-xl">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">
                                    <i class="fas fa-file-alt"></i> Database Test Error Logs
                                </h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="d-flex justify-content-between mb-3">
                                    <button class="btn btn-secondary" onclick="LoggingSystem.clearLogs()">
                                        <i class="fas fa-trash"></i> Clear Logs
                                    </button>
                                    <button class="btn btn-primary" onclick="LoggingSystem.downloadLogs()">
                                        <i class="fas fa-download"></i> Download Logs
                                    </button>
                                </div>
                                <div class="log-content" style="max-height: 500px; overflow-y: auto; background: #f8f9fa; padding: 15px; border-radius: 5px; font-family: monospace; font-size: 12px; white-space: pre-wrap;">
                                    ${logContents || 'No errors logged yet.'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Remove existing modal if any
            const existingModal = document.getElementById('logModal');
            if (existingModal) {
                existingModal.remove();
            }
            
            // Add modal to body
            document.body.insertAdjacentHTML('beforeend', modal);
            
            // Show modal
            const modalInstance = new bootstrap.Modal(document.getElementById('logModal'));
            modalInstance.show();
            
        } catch (error) {
            console.error('Error in showLogs:', error);
            let errorMessage = `Error displaying logs: ${error.message}`;
            
            if (error.message.includes('Network error')) {
                errorMessage = 'Unable to connect to the server. Please check if the backend is running on port 3000.';
            } else if (error.message.includes('Server error: 404')) {
                errorMessage = 'Logging endpoint not found. Please restart the backend server.';
            } else if (error.message.includes('Server error: 500')) {
                errorMessage = 'Server error occurred while reading logs. Please check the backend console.';
            }
            
            Utils.showAlert(errorMessage, 'danger');
        }
    },
    
    // Download log file
    downloadLogs: async () => {
        try {
            const logContents = await LoggingSystem.getLogContents();
            const blob = new Blob([logContents], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `database_test_errors_${new Date().toISOString().split('T')[0]}.log`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            Utils.showAlert(`Error downloading logs: ${error.message}`, 'danger');
        }
    }
};

// Make LoggingSystem available globally
window.LoggingSystem = LoggingSystem;

// Add a simple test function that can be called from anywhere
window.testLoggingFromAnywhere = async () => {
    try {
        console.log('Running simple logging test...');
        const testError = new Error('Simple logging test from main application');
        await LoggingSystem.logError(testError, 'Simple Test', false);
        Utils.showAlert('Simple logging test completed successfully!', 'success');
    } catch (error) {
        console.error('Simple logging test failed:', error);
        Utils.showAlert(`Simple logging test failed: ${error.message}`, 'danger');
    }
};

// Initialize modal manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    Utils.ModalManager.init();
}); 