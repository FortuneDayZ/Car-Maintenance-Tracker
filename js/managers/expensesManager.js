// Expenses Manager
const expensesManager = {
    container: null,

    init: () => {
        expensesManager.container = document.getElementById('expenses-table-container');
        expensesManager.render();
    },

    render: async () => {
        // Check if user is authenticated
        if (!AuthManager.isAuthenticated) {
            expensesManager.container.innerHTML = '<div class="alert alert-warning">Please log in to view expenses.</div>';
            return;
        }

        try {
            // Get user info for permissions
            const userId = AuthManager.currentUser?.user_id;
            const isAdmin = AuthManager.isAdmin();
            
            // Get expenses from database based on user permissions with detailed information
            let expensesToShow = [];
            if (isAdmin) {
                expensesToShow = await Database.select(`
                    SELECT 
                        e.*, 
                        v.make, v.model, v.year,
                        me.service_id,
                        re.renewal_date, re.renewal_period, re.state,
                        ie.policy_number, ie.start_date, ie.end_date, ie.provider_name,
                        fe.gallons, fe.current_mileage, fe.fuel_type
                    FROM Expenses e
                    LEFT JOIN Vehicles v ON e.vin = v.vin
                    LEFT JOIN MaintenanceExpenses me ON e.expense_id = me.expense_id
                    LEFT JOIN RegistrationExpenses re ON e.expense_id = re.expense_id
                    LEFT JOIN InsuranceExpenses ie ON e.expense_id = ie.expense_id
                    LEFT JOIN FuelExpenses fe ON e.expense_id = fe.expense_id
                    ORDER BY e.date DESC
                `);
            } else {
                // Regular users can only see their own expenses
                expensesToShow = await Database.select(`
                    SELECT 
                        e.*, 
                        v.make, v.model, v.year,
                        me.service_id,
                        re.renewal_date, re.renewal_period, re.state,
                        ie.policy_number, ie.start_date, ie.end_date, ie.provider_name,
                        fe.gallons, fe.current_mileage, fe.fuel_type
                    FROM Expenses e
                    LEFT JOIN Vehicles v ON e.vin = v.vin
                    LEFT JOIN MaintenanceExpenses me ON e.expense_id = me.expense_id
                    LEFT JOIN RegistrationExpenses re ON e.expense_id = re.expense_id
                    LEFT JOIN InsuranceExpenses ie ON e.expense_id = ie.expense_id
                    LEFT JOIN FuelExpenses fe ON e.expense_id = fe.expense_id
                    JOIN Owns o ON e.vin = o.vin
                    WHERE o.user_id = ${userId}
                    ORDER BY e.date DESC
                `);
            }

            // Get aggregate data for summary
            const summaryData = await expensesManager.getExpenseSummary(userId, isAdmin);
            
            const table = `
                <!-- Expense Summary Cards -->
                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="card bg-primary text-white">
                            <div class="card-body text-center">
                                <h5 class="card-title">Total Expenses</h5>
                                <h3>${Utils.formatCurrency(summaryData.totalAmount)}</h3>
                                <small>All time</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-success text-white">
                            <div class="card-body text-center">
                                <h5 class="card-title">Average Expense</h5>
                                <h3>${Utils.formatCurrency(summaryData.averageAmount)}</h3>
                                <small>Per expense</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-info text-white">
                            <div class="card-body text-center">
                                <h5 class="card-title">Total Count</h5>
                                <h3>${summaryData.totalCount}</h3>
                                <small>Expenses</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-warning text-white">
                            <div class="card-body text-center">
                                <h5 class="card-title">This Month</h5>
                                <h3>${Utils.formatCurrency(summaryData.thisMonthAmount)}</h3>
                                <small>${summaryData.thisMonthCount} expenses</small>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Export Button -->
                <div class="row mb-3">
                    <div class="col-12">
                        <button class="btn btn-success" onclick="expensesManager.exportToCSV()">
                            <i class="fas fa-download"></i> Export Expenses to CSV
                        </button>
                    </div>
                </div>

                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Vehicle</th>
                                <th>Date</th>
                                <th>Category</th>
                                <th>Amount</th>
                                <th>Description</th>
                                <th>Details</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${expensesToShow.map(expense => expensesManager.createExpenseRow(expense)).join('')}
                        </tbody>
                    </table>
                </div>
            `;
            
            expensesManager.container.innerHTML = table;
        } catch (error) {
            console.error('Error loading expenses:', error);
            expensesManager.container.innerHTML = `
                <div class="alert alert-danger">
                    <h4><i class="fas fa-exclamation-triangle"></i> Error Loading Expenses</h4>
                    <p>${error.message}</p>
                    <button class="btn btn-primary" onclick="expensesManager.render()">
                        <i class="fas fa-sync"></i> Retry
                    </button>
                </div>
            `;
        }
    },

    createExpenseRow: (expense) => {
        const vehicle = expense.make && expense.model && expense.year ? 
            `${expense.year} ${expense.make} ${expense.model}` : 'Unknown Vehicle';
        
        // Create detailed information for dropdown
        const detailedInfo = expensesManager.createDetailedInfo(expense);
        
        return `
            <tr>
                <td>${expense.expense_id}</td>
                <td>${vehicle}</td>
                <td>${Utils.formatDate(expense.date)}</td>
                <td><span class="badge bg-secondary">${expense.category}</span></td>
                <td>${Utils.formatCurrency(expense.amount)}</td>
                <td>${expense.description}</td>
                <td>
                    <button class="btn btn-sm btn-outline-info" onclick="expensesManager.toggleDetails(${expense.expense_id})" title="Show Details">
                        Details
                    </button>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="expensesManager.showEditForm(${expense.expense_id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="expensesManager.deleteExpense(${expense.expense_id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
            <tr id="details-row-${expense.expense_id}" class="details-row" style="display: none;">
                <td colspan="8">
                    <div class="card">
                        <div class="card-body">
                            <h6 class="card-title">Detailed Information</h6>
                            ${detailedInfo}
                        </div>
                    </div>
                </td>
            </tr>
        `;
    },

    showAddForm: async () => {
        // Check if user is authenticated
        if (!AuthManager.requireAuth('add expenses')) {
            return;
        }
        try {
            let vehicles;
            if (AuthManager.isAdmin()) {
                vehicles = await Database.select('SELECT vin, make, model, year FROM Vehicles');
            } else {
                // Regular users can only add expenses for vehicles they own
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

            // Remove Maintenance from dropdown since it's auto-created
            const categoryOptions = [
                { value: 'Fuel', text: 'Fuel' },
                { value: 'Registration', text: 'Registration' },
                { value: 'Insurance', text: 'Insurance' },
                { value: 'Misc', text: 'Miscellaneous' }
            ];

            const formContent = `
                <form id="expenseForm">
                    ${Utils.createFormField('Vehicle', 'vin', 'select', true, vehicleOptions).outerHTML}
                    ${Utils.createFormField('Date', 'date', 'date', true).outerHTML}
                    ${Utils.createFormField('Category', 'category', 'select', true, categoryOptions).outerHTML}
                    ${Utils.createFormField('Amount', 'amount', 'number', true).outerHTML}
                    ${Utils.createFormField('Description', 'description', 'textarea', false).outerHTML}
                    
                    <!-- Dynamic fields container -->
                    <div id="dynamicFields"></div>
                </form>
            `;

            Utils.ModalManager.show('Add New Expense', formContent, () => expensesManager.saveExpense());
            
            // Add event listeners
            const categorySelect = document.getElementById('category');
            const vehicleSelect = document.getElementById('vin');
            
            categorySelect.addEventListener('change', () => expensesManager.updateDynamicFields(null));
            vehicleSelect.addEventListener('change', () => expensesManager.updateDynamicFields(null));
            
            // Initialize dynamic fields
            expensesManager.updateDynamicFields(null);
        } catch (error) {
            console.error('Error loading vehicles for expense form:', error);
            Utils.showAlert(`Error loading vehicles: ${error.message}`, 'danger');
        }
    },

    loadServiceOptions: async (vin, container, existingData = null) => {
        try {
            const services = await Database.select(`
                SELECT service_id, service_date, description, cost 
                FROM ServiceRecords 
                WHERE vin = '${vin}' 
                ORDER BY service_date DESC
            `);
            
            const serviceOptions = services.map(service => ({
                value: service.service_id,
                text: `${service.service_date} - ${service.description} (${Utils.formatCurrency(service.cost)})`
            }));
            
            container.innerHTML = `
                ${Utils.createFormField('Service Record', 'service_id', 'select', true, serviceOptions).outerHTML}
            `;
            
            // Populate with existing data if available
            if (existingData && existingData.service_id) {
                setTimeout(() => {
                    const serviceIdField = document.getElementById('service_id');
                    if (serviceIdField) serviceIdField.value = existingData.service_id;
                }, 50);
            }
        } catch (error) {
            console.error('Error loading service options:', error);
            container.innerHTML = `
                ${Utils.createFormField('Service ID', 'service_id', 'number', true).outerHTML}
            `;
            
            // Populate with existing data if available
            if (existingData && existingData.service_id) {
                setTimeout(() => {
                    const serviceIdField = document.getElementById('service_id');
                    if (serviceIdField) serviceIdField.value = existingData.service_id;
                }, 50);
            }
        }
    },

    updateDynamicFields: (existingData = null) => {
        const categoryElement = document.getElementById('category');
        const dynamicFieldsContainer = document.getElementById('dynamicFields');
        
        // Check if elements exist
        if (!categoryElement || !dynamicFieldsContainer) {
            console.error('Required elements not found:', { 
                categoryElement: !!categoryElement, 
                dynamicFieldsContainer: !!dynamicFieldsContainer 
            });
            return;
        }
        
        const category = categoryElement.value;
        
        // Clear existing dynamic fields
        dynamicFieldsContainer.innerHTML = '';
        
        switch (category) {
            case 'Maintenance':
                // Get service records for the selected vehicle
                const vin = document.getElementById('vin').value;
                if (vin) {
                    expensesManager.loadServiceOptions(vin, dynamicFieldsContainer, existingData);
                } else {
                    dynamicFieldsContainer.innerHTML = `
                        ${Utils.createFormField('Service ID', 'service_id', 'number', true).outerHTML}
                    `;
                    // Populate with existing data if available
                    if (existingData && existingData.service_id) {
                        setTimeout(() => {
                            const serviceIdField = document.getElementById('service_id');
                            if (serviceIdField) serviceIdField.value = existingData.service_id;
                        }, 50);
                    }
                }
                break;
            case 'Registration':
                dynamicFieldsContainer.innerHTML = `
                    ${Utils.createFormField('Renewal Date', 'renewal_date', 'date', true).outerHTML}
                    ${Utils.createFormField('Renewal Period', 'renewal_period', 'text', false).outerHTML}
                    ${Utils.createFormField('State', 'state', 'text', false).outerHTML}
                `;
                // Populate with existing data if available
                if (existingData) {
                    setTimeout(() => {
                        if (existingData.renewal_date) {
                            const renewalDateField = document.getElementById('renewal_date');
                            if (renewalDateField) renewalDateField.value = existingData.renewal_date;
                        }
                        if (existingData.renewal_period) {
                            const renewalPeriodField = document.getElementById('renewal_period');
                            if (renewalPeriodField) renewalPeriodField.value = existingData.renewal_period;
                        }
                        if (existingData.state) {
                            const stateField = document.getElementById('state');
                            if (stateField) stateField.value = existingData.state;
                        }
                    }, 50);
                }
                break;
            case 'Insurance':
                dynamicFieldsContainer.innerHTML = `
                    ${Utils.createFormField('Policy Number', 'policy_number', 'text', true).outerHTML}
                    ${Utils.createFormField('Start Date', 'start_date', 'date', true).outerHTML}
                    ${Utils.createFormField('End Date', 'end_date', 'date', true).outerHTML}
                    ${Utils.createFormField('Provider Name', 'provider_name', 'text', false).outerHTML}
                `;
                // Populate with existing data if available
                if (existingData) {
                    setTimeout(() => {
                        if (existingData.policy_number) {
                            const policyNumberField = document.getElementById('policy_number');
                            if (policyNumberField) policyNumberField.value = existingData.policy_number;
                        }
                        if (existingData.start_date) {
                            const startDateField = document.getElementById('start_date');
                            if (startDateField) startDateField.value = existingData.start_date;
                        }
                        if (existingData.end_date) {
                            const endDateField = document.getElementById('end_date');
                            if (endDateField) endDateField.value = existingData.end_date;
                        }
                        if (existingData.provider_name) {
                            const providerNameField = document.getElementById('provider_name');
                            if (providerNameField) providerNameField.value = existingData.provider_name;
                        }
                    }, 50);
                }
                break;
            case 'Fuel':
                dynamicFieldsContainer.innerHTML = `
                    ${Utils.createFormField('Gallons', 'gallons', 'number', true).outerHTML}
                    ${Utils.createFormField('Current Mileage', 'current_mileage', 'number', true).outerHTML}
                    ${Utils.createFormField('Fuel Type', 'fuel_type', 'text', false).outerHTML}
                `;
                // Populate with existing data if available
                if (existingData) {
                    setTimeout(() => {
                        if (existingData.gallons) {
                            const gallonsField = document.getElementById('gallons');
                            if (gallonsField) gallonsField.value = existingData.gallons;
                        }
                        if (existingData.current_mileage) {
                            const currentMileageField = document.getElementById('current_mileage');
                            if (currentMileageField) currentMileageField.value = existingData.current_mileage;
                        }
                        if (existingData.fuel_type) {
                            const fuelTypeField = document.getElementById('fuel_type');
                            if (fuelTypeField) fuelTypeField.value = existingData.fuel_type;
                        }
                    }, 50);
                }
                break;
            case 'Misc':
                // No additional fields for miscellaneous expenses
                break;
            default:
                console.log('Unknown category:', category);
                break;
        }
    },

    showEditForm: async (expenseId) => {
        try {
            // Get expense with all related data
            const expenses = await Database.select(`
                SELECT 
                    e.*,
                    me.service_id,
                    re.renewal_date, re.renewal_period, re.state,
                    ie.policy_number, ie.start_date, ie.end_date, ie.provider_name,
                    fe.gallons, fe.current_mileage, fe.fuel_type
                FROM Expenses e
                LEFT JOIN MaintenanceExpenses me ON e.expense_id = me.expense_id
                LEFT JOIN RegistrationExpenses re ON e.expense_id = re.expense_id
                LEFT JOIN InsuranceExpenses ie ON e.expense_id = ie.expense_id
                LEFT JOIN FuelExpenses fe ON e.expense_id = fe.expense_id
                WHERE e.expense_id = ${expenseId}
            `);
            const expense = expenses[0];
            if (!expense) return;

            const vehicles = await Database.select('SELECT vin, make, model, year FROM Vehicles');
            const vehicleOptions = vehicles.map(vehicle => ({
                value: vehicle.vin,
                text: `${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.vin})`
            }));

            // Include Maintenance in edit form since it might be edited
            const categoryOptions = [
                { value: 'Maintenance', text: 'Maintenance' },
                { value: 'Fuel', text: 'Fuel' },
                { value: 'Registration', text: 'Registration' },
                { value: 'Insurance', text: 'Insurance' },
                { value: 'Misc', text: 'Miscellaneous' }
            ];

            const formContent = `
                <form id="expenseForm">
                    ${Utils.createFormField('Vehicle', 'vin', 'select', true, vehicleOptions).outerHTML}
                    ${Utils.createFormField('Date', 'date', 'date', true).outerHTML}
                    ${Utils.createFormField('Category', 'category', 'select', true, categoryOptions).outerHTML}
                    ${Utils.createFormField('Amount', 'amount', 'number', true).outerHTML}
                    ${Utils.createFormField('Description', 'description', 'textarea', false).outerHTML}
                    
                    <!-- Dynamic fields container -->
                    <div id="dynamicFields"></div>
                </form>
            `;

            Utils.ModalManager.show('Edit Expense', formContent, () => expensesManager.saveExpense(expenseId));
            
            // Add event listeners
            const categorySelect = document.getElementById('category');
            const vehicleSelect = document.getElementById('vin');
            
            // Create a function to get current form data for dynamic fields
            const getCurrentFormData = () => {
                const currentCategory = document.getElementById('category').value;
                const currentVin = document.getElementById('vin').value;
                
                // Return the original expense data if category/vehicle hasn't changed
                if (currentCategory === expense.category && currentVin === expense.vin) {
                    return expense;
                }
                
                // Return null if category/vehicle has changed (user wants to start fresh)
                return null;
            };
            
            categorySelect.addEventListener('change', () => expensesManager.updateDynamicFields(getCurrentFormData()));
            vehicleSelect.addEventListener('change', () => expensesManager.updateDynamicFields(getCurrentFormData()));
            
            // Populate form with existing data after modal is shown
            Utils.populateForm({
                vin: expense.vin,
                date: expense.date,
                category: expense.category,
                amount: expense.amount,
                description: expense.description
            });
            
            // Initialize dynamic fields and populate them with existing data
            // Use polling to ensure DOM is fully rendered
            const initializeDynamicFields = () => {
                const categoryElement = document.getElementById('category');
                const dynamicFieldsContainer = document.getElementById('dynamicFields');
                
                if (categoryElement && dynamicFieldsContainer) {
                    console.log('Elements found, initializing dynamic fields for expense:', expense);
                    expensesManager.updateDynamicFields(expense);
                } else {
                    console.log('Elements not ready yet, retrying...');
                    setTimeout(initializeDynamicFields, 50);
                }
            };
            
            setTimeout(initializeDynamicFields, 100);
        } catch (error) {
            console.error('Error loading expense for edit:', error);
            Utils.showAlert(`Error loading expense: ${error.message}`, 'danger');
        }
    },

    saveExpense: async (expenseId = null) => {
        const form = document.getElementById('expenseForm');
        const formData = new FormData(form);
        
        const expenseData = {
            vin: formData.get('vin'),
            date: formData.get('date').split('T')[0], // Extract just the date part (YYYY-MM-DD)
            category: formData.get('category'),
            amount: parseFloat(formData.get('amount')),
            description: formData.get('description')
        };

        // Validation - check for empty strings and NaN values
        if (!expenseData.vin || expenseData.vin.trim() === '') {
            Utils.showAlert('Vehicle is required', 'danger');
            return;
        }
        
        if (!expenseData.date || expenseData.date.trim() === '') {
            Utils.showAlert('Date is required', 'danger');
            return;
        }
        
        if (!expenseData.category || expenseData.category.trim() === '') {
            Utils.showAlert('Category is required', 'danger');
            return;
        }
        
        if (isNaN(expenseData.amount)) {
            Utils.showAlert('Amount must be a valid number', 'danger');
            return;
        }

        if (expenseData.amount < 0) {
            Utils.showAlert('Amount must be a positive number', 'danger');
            return;
        }

        // Category-specific validation based on database schema
        switch (expenseData.category) {
            case 'Maintenance':
                const serviceId = formData.get('service_id');
                if (!serviceId || serviceId.trim() === '') {
                    Utils.showAlert('Service ID is required for maintenance expenses', 'danger');
                    return;
                }
                break;
            case 'Registration':
                const renewalDate = formData.get('renewal_date');
                if (!renewalDate || renewalDate.trim() === '') {
                    Utils.showAlert('Renewal Date is required for registration expenses', 'danger');
                    return;
                }
                break;
            case 'Insurance':
                const policyNumber = formData.get('policy_number');
                const startDate = formData.get('start_date');
                const endDate = formData.get('end_date');
                
                if (!policyNumber || policyNumber.trim() === '') {
                    Utils.showAlert('Policy Number is required for insurance expenses', 'danger');
                    return;
                }
                if (!startDate || startDate.trim() === '') {
                    Utils.showAlert('Start Date is required for insurance expenses', 'danger');
                    return;
                }
                if (!endDate || endDate.trim() === '') {
                    Utils.showAlert('End Date is required for insurance expenses', 'danger');
                    return;
                }
                break;
            case 'Fuel':
                const gallons = formData.get('gallons');
                const currentMileage = formData.get('current_mileage');
                
                if (!gallons || isNaN(parseFloat(gallons))) {
                    Utils.showAlert('Gallons is required and must be a valid number for fuel expenses', 'danger');
                    return;
                }
                if (!currentMileage || isNaN(parseInt(currentMileage))) {
                    Utils.showAlert('Current Mileage is required and must be a valid number for fuel expenses', 'danger');
                    return;
                }
                break;
            case 'Misc':
                // No additional validation required for miscellaneous expenses
                break;
        }

        try {
            let newExpenseId;
            
            if (expenseId) {
                // Update existing expense
                await Database.updateRecord('Expenses', expenseData, `expense_id = ${expenseId}`);
                newExpenseId = expenseId;
                Utils.showAlert('Expense updated successfully', 'success');
            } else {
                // Add new expense
                const result = await Database.insertRecord('Expenses', expenseData);
                newExpenseId = result.insertId;
                Utils.showAlert('Expense added successfully', 'success');
            }

            // Handle category-specific data
            await expensesManager.saveCategorySpecificData(newExpenseId, expenseData.category, formData);

            Utils.ModalManager.hide();
            
            // Refresh all sections that depend on expense data
            await expensesManager.refreshAllRelatedSections();
        } catch (error) {
            console.error('Error saving expense:', error);
            Utils.showAlert(`Error saving expense: ${error.message}`, 'danger');
        }
    },

    saveCategorySpecificData: async (expenseId, category, formData) => {
        try {
            // First, delete any existing category-specific records
            await Database.deleteRecords('MaintenanceExpenses', `expense_id = ${expenseId}`);
            await Database.deleteRecords('RegistrationExpenses', `expense_id = ${expenseId}`);
            await Database.deleteRecords('InsuranceExpenses', `expense_id = ${expenseId}`);
            await Database.deleteRecords('FuelExpenses', `expense_id = ${expenseId}`);

            // Insert new category-specific data
            switch (category) {
                case 'Maintenance':
                    const serviceId = formData.get('service_id');
                    if (serviceId) {
                        await Database.insertRecord('MaintenanceExpenses', {
                            expense_id: expenseId,
                            service_id: parseInt(serviceId)
                        });
                    }
                    break;
                case 'Registration':
                    const renewalDate = formData.get('renewal_date');
                    const renewalPeriod = formData.get('renewal_period');
                    const state = formData.get('state');
                    
                    await Database.insertRecord('RegistrationExpenses', {
                        expense_id: expenseId,
                        renewal_date: renewalDate.split('T')[0], // Extract just the date part
                        renewal_period: renewalPeriod || null,
                        state: state || null
                    });
                    break;
                case 'Insurance':
                    const policyNumber = formData.get('policy_number');
                    const startDate = formData.get('start_date');
                    const endDate = formData.get('end_date');
                    const providerName = formData.get('provider_name');
                    
                    await Database.insertRecord('InsuranceExpenses', {
                        expense_id: expenseId,
                        policy_number: policyNumber,
                        start_date: startDate.split('T')[0], // Extract just the date part
                        end_date: endDate.split('T')[0], // Extract just the date part
                        provider_name: providerName || null
                    });
                    break;
                case 'Fuel':
                    const gallons = formData.get('gallons');
                    const currentMileage = formData.get('current_mileage');
                    const fuelType = formData.get('fuel_type');
                    
                    await Database.insertRecord('FuelExpenses', {
                        expense_id: expenseId,
                        gallons: parseFloat(gallons),
                        current_mileage: parseInt(currentMileage),
                        fuel_type: fuelType || null
                    });
                    break;
                case 'Misc':
                    // No additional data for miscellaneous expenses
                    break;
            }
        } catch (error) {
            console.error('Error saving category-specific data:', error);
            throw error;
        }
    },

    // Create maintenance expense from service record
    createMaintenanceExpenseFromService: async (serviceId) => {
        try {
            // Get service record
            const services = await Database.select(`SELECT * FROM ServiceRecords WHERE service_id = ${serviceId}`);
            const service = services[0];
            if (!service) {
                throw new Error('Service record not found');
            }

            // Check if maintenance expense already exists for this service
            const existingExpenses = await Database.select(`
                SELECT e.expense_id FROM Expenses e
                JOIN MaintenanceExpenses me ON e.expense_id = me.expense_id
                WHERE me.service_id = ${serviceId}
            `);

            if (existingExpenses.length > 0) {
                console.log('Maintenance expense already exists for service ID:', serviceId);
                return;
            }

            // Create expense record
            const expenseData = {
                vin: service.vin,
                date: service.service_date,
                category: 'Maintenance',
                amount: service.cost,
                description: service.description || 'Maintenance service'
            };

            const result = await Database.insertRecord('Expenses', expenseData);
            const expenseId = result.insertId;

            // Create maintenance expense record
            await Database.insertRecord('MaintenanceExpenses', {
                expense_id: expenseId,
                service_id: serviceId
            });

            console.log('Maintenance expense created for service ID:', serviceId);
        } catch (error) {
            console.error('Error creating maintenance expense from service:', error);
            throw error;
        }
    },

    // Refresh all sections that depend on expense data
    refreshAllRelatedSections: async () => {
        try {
            // Show loading indicator
            Utils.showAlert('Updating all related sections...', 'info');
            
            // Refresh expenses section
            await expensesManager.render();
            
            // Refresh vehicles section (since expenses are linked to vehicles)
            if (window.vehiclesManager) {
                await vehiclesManager.render();
            }
            
            // Refresh ownership section (since expenses affect vehicle ownership costs)
            if (window.ownsManager) {
                await ownsManager.render();
            }
            
            console.log('All expense-related sections refreshed successfully');
            
            // Show success message
            setTimeout(() => {
                Utils.showAlert('All sections updated successfully!', 'success');
            }, 500);
        } catch (error) {
            console.error('Error refreshing expense-related sections:', error);
            Utils.showAlert('Error updating sections. Please refresh the page.', 'danger');
        }
    },

    deleteExpense: async (expenseId) => {
        if (!confirm('Are you sure you want to delete this expense?')) {
            return;
        }

        try {
            // Delete category-specific records first
            await Database.deleteRecords('MaintenanceExpenses', `expense_id = ${expenseId}`);
            await Database.deleteRecords('RegistrationExpenses', `expense_id = ${expenseId}`);
            await Database.deleteRecords('InsuranceExpenses', `expense_id = ${expenseId}`);
            await Database.deleteRecords('FuelExpenses', `expense_id = ${expenseId}`);
            
            // Delete the main expense record
            await Database.deleteRecords('Expenses', `expense_id = ${expenseId}`);
            Utils.showAlert('Expense deleted successfully', 'success');
            
            // Refresh all sections that depend on expense data
            await expensesManager.refreshAllRelatedSections();
        } catch (error) {
            console.error('Error deleting expense:', error);
            Utils.showAlert(`Error deleting expense: ${error.message}`, 'danger');
        }
    },

    // Get expense summary with aggregate functions
    getExpenseSummary: async (userId, isAdmin) => {
        try {
            let summaryResult, thisMonthResult;
            
            if (isAdmin) {
                // Get total and average expenses
                summaryResult = await Database.select(`
                    SELECT 
                        SUM(amount) as total_amount,
                        AVG(amount) as average_amount,
                        COUNT(*) as total_count
                    FROM Expenses e
                `);
                
                // Get this month's expenses
                thisMonthResult = await Database.select(`
                    SELECT 
                        SUM(amount) as this_month_amount,
                        COUNT(*) as this_month_count
                    FROM Expenses e
                    WHERE DATE_FORMAT(date, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')
                `);
            } else {
                // Get total and average expenses
                summaryResult = await Database.select(`
                    SELECT 
                        SUM(amount) as total_amount,
                        AVG(amount) as average_amount,
                        COUNT(*) as total_count
                    FROM Expenses e
                    JOIN Owns o ON e.vin = o.vin
                    WHERE o.user_id = ${userId}
                `);
                
                // Get this month's expenses
                thisMonthResult = await Database.select(`
                    SELECT 
                        SUM(amount) as this_month_amount,
                        COUNT(*) as this_month_count
                    FROM Expenses e
                    JOIN Owns o ON e.vin = o.vin
                    WHERE o.user_id = ${userId} AND DATE_FORMAT(date, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')
                `);
            }
            
            return {
                totalAmount: summaryResult[0]?.total_amount || 0,
                averageAmount: summaryResult[0]?.average_amount || 0,
                totalCount: summaryResult[0]?.total_count || 0,
                thisMonthAmount: thisMonthResult[0]?.this_month_amount || 0,
                thisMonthCount: thisMonthResult[0]?.this_month_count || 0
            };
        } catch (error) {
            console.error('Error getting expense summary:', error);
            return {
                totalAmount: 0,
                averageAmount: 0,
                totalCount: 0,
                thisMonthAmount: 0,
                thisMonthCount: 0
            };
        }
    },

    // Export expenses to CSV
    exportToCSV: async () => {
        try {
            const userId = AuthManager.currentUser.user_id;
            const isAdmin = AuthManager.isAdmin();
            
            // Get expenses data with all related information
            let expensesToShow = [];
            if (isAdmin) {
                expensesToShow = await Database.select(`
                    SELECT 
                        e.*, 
                        v.make, v.model, v.year,
                        me.service_id,
                        re.renewal_date, re.renewal_period, re.state,
                        ie.policy_number, ie.start_date, ie.end_date, ie.provider_name,
                        fe.gallons, fe.current_mileage, fe.fuel_type
                    FROM Expenses e
                    LEFT JOIN Vehicles v ON e.vin = v.vin
                    LEFT JOIN MaintenanceExpenses me ON e.expense_id = me.expense_id
                    LEFT JOIN RegistrationExpenses re ON e.expense_id = re.expense_id
                    LEFT JOIN InsuranceExpenses ie ON e.expense_id = ie.expense_id
                    LEFT JOIN FuelExpenses fe ON e.expense_id = fe.expense_id
                    ORDER BY e.date DESC
                `);
            } else {
                expensesToShow = await Database.select(`
                    SELECT 
                        e.*, 
                        v.make, v.model, v.year,
                        me.service_id,
                        re.renewal_date, re.renewal_period, re.state,
                        ie.policy_number, ie.start_date, ie.end_date, ie.provider_name,
                        fe.gallons, fe.current_mileage, fe.fuel_type
                    FROM Expenses e
                    LEFT JOIN Vehicles v ON e.vin = v.vin
                    LEFT JOIN MaintenanceExpenses me ON e.expense_id = me.expense_id
                    LEFT JOIN RegistrationExpenses re ON e.expense_id = re.expense_id
                    LEFT JOIN InsuranceExpenses ie ON e.expense_id = ie.expense_id
                    LEFT JOIN FuelExpenses fe ON e.expense_id = fe.expense_id
                    JOIN Owns o ON e.vin = o.vin
                    WHERE o.user_id = ${userId}
                    ORDER BY e.date DESC
                `);
            }

            // Get summary data
            const summaryData = await expensesManager.getExpenseSummary(userId, isAdmin);

            // Create CSV content
            let csvContent = 'Vehicle Expenses Report\n';
            csvContent += `Generated: ${new Date().toLocaleString()}\n`;
            csvContent += `User: ${AuthManager.currentUser.username}\n`;
            csvContent += `View: ${isAdmin ? 'Admin (All Data)' : 'User (Own Vehicles Only)'}\n\n`;

            // Summary Section
            csvContent += 'SUMMARY\n';
            csvContent += 'Metric,Value\n';
            csvContent += `Total Expenses,${Utils.formatCurrency(summaryData.totalAmount)}\n`;
            csvContent += `Average Expense,${Utils.formatCurrency(summaryData.averageAmount)}\n`;
            csvContent += `Total Count,${summaryData.totalCount}\n`;
            csvContent += `This Month Amount,${Utils.formatCurrency(summaryData.thisMonthAmount)}\n`;
            csvContent += `This Month Count,${summaryData.thisMonthCount}\n\n`;

            // Detailed Expenses
            csvContent += 'DETAILED EXPENSES\n';
            csvContent += 'ID,Vehicle,Date,Category,Amount,Description,Service ID,Renewal Date,Policy Number,Gallons\n';
            expensesToShow.forEach(expense => {
                const vehicle = expense.make && expense.model && expense.year ? 
                    `${expense.year} ${expense.make} ${expense.model}` : 'Unknown Vehicle';
                csvContent += `${expense.expense_id},"${vehicle}",${expense.date},${expense.category},${Utils.formatCurrency(expense.amount)},"${expense.description}",${expense.service_id || ''},${expense.renewal_date || ''},${expense.policy_number || ''},${expense.gallons || ''}\n`;
            });

            // Download the CSV file
            expensesManager.downloadCSV(csvContent, `expenses_${AuthManager.currentUser.username}_${new Date().toISOString().split('T')[0]}.csv`);
            
            Utils.showAlert('Expenses data exported to CSV successfully!', 'success');
        } catch (error) {
            console.error('Error exporting expenses to CSV:', error);
            Utils.showAlert('Error exporting expenses: ' + error.message, 'danger');
        }
    },

    // Create detailed information for expense dropdown
    createDetailedInfo: (expense) => {
        let detailedInfo = `
            <div class="row">
                <div class="col-md-6">
                    <h6>Basic Information</h6>
                    <table class="table table-sm">
                        <tr><td><strong>Expense ID:</strong></td><td>${expense.expense_id}</td></tr>
                        <tr><td><strong>Vehicle:</strong></td><td>${expense.year} ${expense.make} ${expense.model} (${expense.vin})</td></tr>
                        <tr><td><strong>Date:</strong></td><td>${Utils.formatDate(expense.date)}</td></tr>
                        <tr><td><strong>Category:</strong></td><td><span class="badge bg-secondary">${expense.category}</span></td></tr>
                        <tr><td><strong>Amount:</strong></td><td>${Utils.formatCurrency(expense.amount)}</td></tr>
                        <tr><td><strong>Description:</strong></td><td>${expense.description || 'N/A'}</td></tr>
                    </table>
                </div>
        `;

        // Add category-specific details only if they exist for this category
        let categoryDetails = '';
        switch (expense.category) {
            case 'Maintenance':
                if (expense.service_id) {
                    categoryDetails = `
                        <div class="col-md-6">
                            <h6>Maintenance Details</h6>
                            <table class="table table-sm">
                                <tr><td><strong>Service ID:</strong></td><td>${expense.service_id}</td></tr>
                                <tr><td><strong>Service Record:</strong></td><td>Linked to service record</td></tr>
                            </table>
                        </div>
                    `;
                }
                break;
            case 'Registration':
                if (expense.renewal_date || expense.renewal_period || expense.state) {
                    categoryDetails = `
                        <div class="col-md-6">
                            <h6>Registration Details</h6>
                            <table class="table table-sm">
                                ${expense.renewal_date ? `<tr><td><strong>Renewal Date:</strong></td><td>${Utils.formatDate(expense.renewal_date)}</td></tr>` : ''}
                                ${expense.renewal_period ? `<tr><td><strong>Renewal Period:</strong></td><td>${expense.renewal_period}</td></tr>` : ''}
                                ${expense.state ? `<tr><td><strong>State:</strong></td><td>${expense.state}</td></tr>` : ''}
                            </table>
                        </div>
                    `;
                }
                break;
            case 'Insurance':
                if (expense.policy_number || expense.start_date || expense.end_date || expense.provider_name) {
                    categoryDetails = `
                        <div class="col-md-6">
                            <h6>Insurance Details</h6>
                            <table class="table table-sm">
                                ${expense.policy_number ? `<tr><td><strong>Policy Number:</strong></td><td>${expense.policy_number}</td></tr>` : ''}
                                ${expense.start_date ? `<tr><td><strong>Start Date:</strong></td><td>${Utils.formatDate(expense.start_date)}</td></tr>` : ''}
                                ${expense.end_date ? `<tr><td><strong>End Date:</strong></td><td>${Utils.formatDate(expense.end_date)}</td></tr>` : ''}
                                ${expense.provider_name ? `<tr><td><strong>Provider Name:</strong></td><td>${expense.provider_name}</td></tr>` : ''}
                            </table>
                        </div>
                    `;
                }
                break;
            case 'Fuel':
                if (expense.gallons || expense.current_mileage || expense.fuel_type) {
                    categoryDetails = `
                        <div class="col-md-6">
                            <h6>Fuel Details</h6>
                            <table class="table table-sm">
                                ${expense.gallons ? `<tr><td><strong>Gallons:</strong></td><td>${expense.gallons}</td></tr>` : ''}
                                ${expense.current_mileage ? `<tr><td><strong>Current Mileage:</strong></td><td>${expense.current_mileage.toLocaleString()}</td></tr>` : ''}
                                ${expense.fuel_type ? `<tr><td><strong>Fuel Type:</strong></td><td>${expense.fuel_type}</td></tr>` : ''}
                                ${expense.gallons && expense.amount ? `<tr><td><strong>Cost per Gallon:</strong></td><td>${Utils.formatCurrency(expense.amount / expense.gallons)}</td></tr>` : ''}
                            </table>
                        </div>
                    `;
                }
                break;
            case 'Misc':
                categoryDetails = `
                    <div class="col-md-6">
                        <h6>Miscellaneous Details</h6>
                        <table class="table table-sm">
                            <tr><td><strong>Type:</strong></td><td>Miscellaneous expense</td></tr>
                            <tr><td><strong>Additional Info:</strong></td><td>No additional category-specific data</td></tr>
                        </table>
                    </div>
                `;
                break;
        }

        // Only add category details section if there are category-specific details to show
        if (categoryDetails) {
            detailedInfo += categoryDetails;
        }

        detailedInfo += `
            </div>
        `;

        return detailedInfo;
    },

    // Toggle details dropdown for expense row
    toggleDetails: (expenseId) => {
        const detailsRow = document.getElementById(`details-row-${expenseId}`);
        const infoButton = document.querySelector(`button[onclick="expensesManager.toggleDetails(${expenseId})"]`);
        
        if (detailsRow.style.display === 'none') {
            detailsRow.style.display = 'table-row';
            if (infoButton) {
                infoButton.innerHTML = 'Hide';
                infoButton.title = 'Hide Details';
                infoButton.classList.remove('btn-outline-info');
                infoButton.classList.add('btn-outline-secondary');
            }
        } else {
            detailsRow.style.display = 'none';
            if (infoButton) {
                infoButton.innerHTML = 'Details';
                infoButton.title = 'Show Details';
                infoButton.classList.remove('btn-outline-secondary');
                infoButton.classList.add('btn-outline-info');
            }
        }
    },

    // Helper function to download CSV
    downloadCSV: (csvContent, filename) => {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
};

// Make expensesManager available globally
window.expensesManager = expensesManager; 