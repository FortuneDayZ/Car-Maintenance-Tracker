// Expenses Manager
const expensesManager = {
    container: null,

    init: () => {
        expensesManager.container = document.getElementById('expenses-table-container');
        expensesManager.render();
    },

    render: () => {
        // Check if user is authenticated
        if (!AuthManager.isAuthenticated) {
            expensesManager.container.innerHTML = '<div class="alert alert-warning">Please log in to view expenses.</div>';
            return;
        }

        // Get expenses based on user permissions
        let expensesToShow = [];
        if (AuthManager.isAdmin()) {
            expensesToShow = dataStore.expenses;
        } else {
            // Regular users can only see their own expenses
            expensesToShow = AuthManager.getUserExpenses();
        }

        const table = `
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
    },

    createExpenseRow: (expense) => {
        const vehicle = dataStore.vehicles.find(v => v.vin === expense.vin);
        
        return `
            <tr>
                <td>${expense.expense_id}</td>
                <td>${vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Unknown Vehicle'}</td>
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

    showAddForm: () => {
        const vehicleOptions = dataStore.vehicles.map(vehicle => ({
            value: vehicle.vin,
            text: `${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.vin})`
        }));

        const categoryOptions = [
            { value: 'Maintenance', text: 'Maintenance' },
            { value: 'Repair', text: 'Repair' },
            { value: 'Insurance', text: 'Insurance' },
            { value: 'Registration', text: 'Registration' },
            { value: 'Fuel', text: 'Fuel' },
            { value: 'Other', text: 'Other' }
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

        Utils.ModalManager.show('Add New Expense', formContent, expensesManager.saveExpense);
    },

    showEditForm: (expenseId) => {
        const expense = dataStore.expenses.find(e => e.expense_id === expenseId);
        if (!expense) return;

        const vehicleOptions = dataStore.vehicles.map(vehicle => ({
            value: vehicle.vin,
            text: `${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.vin})`
        }));

        const categoryOptions = [
            { value: 'Maintenance', text: 'Maintenance' },
            { value: 'Repair', text: 'Repair' },
            { value: 'Insurance', text: 'Insurance' },
            { value: 'Registration', text: 'Registration' },
            { value: 'Fuel', text: 'Fuel' },
            { value: 'Other', text: 'Other' }
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

        // Populate form with existing data
        setTimeout(() => {
            document.getElementById('vin').value = expense.vin;
            document.getElementById('date').value = expense.date;
            document.getElementById('category').value = expense.category;
            document.getElementById('amount').value = expense.amount;
            document.getElementById('description').value = expense.description;
        }, 100);

        Utils.ModalManager.show('Edit Expense', formContent, () => expensesManager.saveExpense(expenseId));
    },

    saveExpense: (expenseId = null) => {
        const form = document.getElementById('expenseForm');
        const formData = new FormData(form);
        
        const expenseData = {
            vin: formData.get('vin'),
            date: formData.get('date'),
            category: formData.get('category'),
            amount: parseFloat(formData.get('amount')),
            description: formData.get('description')
        };

        // Validation
        if (!expenseData.vin || !expenseData.date || !expenseData.category || !expenseData.amount || !expenseData.description) {
            Utils.showAlert('All fields are required', 'danger');
            return;
        }

        if (expenseData.amount < 0) {
            Utils.showAlert('Amount must be a positive number', 'danger');
            return;
        }

        if (expenseId) {
            // Update existing expense
            const expenseIndex = dataStore.expenses.findIndex(e => e.expense_id === expenseId);
            if (expenseIndex !== -1) {
                dataStore.expenses[expenseIndex] = { ...dataStore.expenses[expenseIndex], ...expenseData };
                Utils.showAlert('Expense updated successfully', 'success');
            }
        } else {
            // Add new expense
            const newExpense = {
                expense_id: Utils.getNextId(dataStore.expenses, 'expense_id'),
                ...expenseData
            };
            dataStore.expenses.push(newExpense);
            Utils.showAlert('Expense added successfully', 'success');
        }

        Utils.ModalManager.hide();
        expensesManager.render();
    },

    deleteExpense: (expenseId) => {
        if (!confirm('Are you sure you want to delete this expense?')) {
            return;
        }

        dataStore.expenses = dataStore.expenses.filter(e => e.expense_id !== expenseId);
        Utils.showAlert('Expense deleted successfully', 'success');
        expensesManager.render();
    }
}; 