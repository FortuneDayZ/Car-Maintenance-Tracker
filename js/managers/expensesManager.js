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
            
            // Get expenses from database based on user permissions
            let expensesToShow = [];
            if (isAdmin) {
                expensesToShow = await Database.select(`
                    SELECT e.*, v.make, v.model, v.year 
                    FROM Expenses e
                    LEFT JOIN Vehicles v ON e.vin = v.vin
                    ORDER BY e.date DESC
                `);
            } else {
                // Regular users can only see their own expenses
                expensesToShow = await Database.select(`
                    SELECT e.*, v.make, v.model, v.year 
                    FROM Expenses e
                    LEFT JOIN Vehicles v ON e.vin = v.vin
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
        
        return `
            <tr>
                <td>${expense.expense_id}</td>
                <td>${vehicle}</td>
                <td>${Utils.formatDate(expense.date)}</td>
                <td><span class="badge bg-secondary">${expense.category}</span></td>
                <td>${Utils.formatCurrency(expense.amount)}</td>
                <td>${expense.description}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="expensesManager.showEditForm(${expense.expense_id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="expensesManager.deleteExpense(${expense.expense_id})">
                        <i class="fas fa-trash"></i>
                    </button>
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
                ${Utils.createFormField('Description', 'description', 'textarea', true).outerHTML}
            </form>
        `;

        Utils.ModalManager.show('Add New Expense', formContent, () => expensesManager.saveExpense());
        } catch (error) {
            console.error('Error loading vehicles for expense form:', error);
            Utils.showAlert(`Error loading vehicles: ${error.message}`, 'danger');
        }
    },

    showEditForm: async (expenseId) => {
        try {
            const expenses = await Database.select(`SELECT * FROM Expenses WHERE expense_id = ${expenseId}`);
            const expense = expenses[0];
            if (!expense) return;

                        const vehicles = await Database.select('SELECT vin, make, model, year FROM Vehicles');
            const vehicleOptions = vehicles.map(vehicle => ({
                value: vehicle.vin,
                text: `${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.vin})`
            }));

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
                    ${Utils.createFormField('Description', 'description', 'textarea', true).outerHTML}
                </form>
            `;

            Utils.ModalManager.show('Edit Expense', formContent, () => expensesManager.saveExpense(expenseId));
            
            // Populate form with existing data after modal is shown
            Utils.populateForm({
                vin: expense.vin,
                date: expense.date,
                category: expense.category,
                amount: expense.amount,
                description: expense.description
            });
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
            date: formData.get('date'),
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
        
        if (!expenseData.description || expenseData.description.trim() === '') {
            Utils.showAlert('Description is required', 'danger');
            return;
        }

        if (expenseData.amount < 0) {
            Utils.showAlert('Amount must be a positive number', 'danger');
            return;
        }

        try {
            if (expenseId) {
                // Update existing expense
                await Database.updateRecord('Expenses', expenseData, `expense_id = ${expenseId}`);
                Utils.showAlert('Expense updated successfully', 'success');
            } else {
                // Add new expense
                await Database.insertRecord('Expenses', expenseData);
                Utils.showAlert('Expense added successfully', 'success');
            }

            Utils.ModalManager.hide();
            
            // Refresh all sections that depend on expense data
            await expensesManager.refreshAllRelatedSections();
        } catch (error) {
            console.error('Error saving expense:', error);
            Utils.showAlert(`Error saving expense: ${error.message}`, 'danger');
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
        const userFilter = isAdmin ? '' : `JOIN Owns o ON e.vin = o.vin WHERE o.user_id = ${userId}`;
        const whereClause = isAdmin ? 'WHERE' : 'AND';
        
        try {
            // Get total and average expenses
            const summaryResult = await Database.select(`
                SELECT 
                    SUM(amount) as total_amount,
                    AVG(amount) as average_amount,
                    COUNT(*) as total_count
                FROM Expenses e
                ${userFilter}
            `);
            
            // Get this month's expenses
            const thisMonthResult = await Database.select(`
                SELECT 
                    SUM(amount) as this_month_amount,
                    COUNT(*) as this_month_count
                FROM Expenses e
                ${userFilter}
                ${whereClause} DATE_FORMAT(date, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')
            `);
            
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
            
            // Get expenses data
            let expensesToShow = [];
            if (isAdmin) {
                expensesToShow = await Database.select(`
                    SELECT e.*, v.make, v.model, v.year 
                    FROM Expenses e
                    LEFT JOIN Vehicles v ON e.vin = v.vin
                    ORDER BY e.date DESC
                `);
            } else {
                expensesToShow = await Database.select(`
                    SELECT e.*, v.make, v.model, v.year 
                    FROM Expenses e
                    LEFT JOIN Vehicles v ON e.vin = v.vin
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
            csvContent += 'ID,Vehicle,Date,Category,Amount,Description\n';
            expensesToShow.forEach(expense => {
                const vehicle = expense.make && expense.model && expense.year ? 
                    `${expense.year} ${expense.make} ${expense.model}` : 'Unknown Vehicle';
                csvContent += `${expense.expense_id},"${vehicle}",${expense.date},${expense.category},${Utils.formatCurrency(expense.amount)},"${expense.description}"\n`;
            });

            // Download the CSV file
            expensesManager.downloadCSV(csvContent, `expenses_${AuthManager.currentUser.username}_${new Date().toISOString().split('T')[0]}.csv`);
            
            Utils.showAlert('Expenses data exported to CSV successfully!', 'success');
        } catch (error) {
            console.error('Error exporting expenses to CSV:', error);
            Utils.showAlert('Error exporting expenses: ' + error.message, 'danger');
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