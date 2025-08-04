// Mechanics Manager
const mechanicsManager = {
    container: null,

    init: () => {
        mechanicsManager.container = document.getElementById('mechanics-table-container');
        mechanicsManager.render();
    },

    render: async () => {
        // Check if user is authenticated
        if (!AuthManager.isAuthenticated) {
            mechanicsManager.container.innerHTML = '<div class="alert alert-warning">Please log in to view mechanics.</div>';
            return;
        }

        try {
            let mechanics = [];
            
            if (AuthManager.isAdmin()) {
                // Admin can see all mechanics
                mechanics = await Database.select(`
                    SELECT m.*, cs.name as shop_name 
                    FROM Mechanics m 
                    LEFT JOIN CarShops cs ON m.car_shop_id = cs.car_shop_id
                `);
            } else {
                // Regular users can only see mechanics they added
                const userId = AuthManager.currentUser.user_id;
                
                mechanics = await Database.select(`SELECT m.*, cs.name as shop_name 
                    FROM Mechanics m 
                    LEFT JOIN CarShops cs ON m.car_shop_id = cs.car_shop_id
                    WHERE m.user_id = ${userId}
                    `);
            }
            
            const table = `
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Car Shop</th>
                                ${AuthManager.isAdmin() ? '<th>User ID</th>' : ''}
                                <th>Services</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(await Promise.all(mechanics.map(mechanic => mechanicsManager.createMechanicRow(mechanic)))).join('')}
                        </tbody>
                    </table>
                </div>
            `;
            
            mechanicsManager.container.innerHTML = table;
        } catch (error) {
            console.error('Error loading mechanics:', error);
            mechanicsManager.container.innerHTML = `
                <div class="alert alert-danger">
                    <h4><i class="fas fa-exclamation-triangle"></i> Error Loading Mechanics</h4>
                    <p>${error.message}</p>
                    <button class="btn btn-primary" onclick="mechanicsManager.render()">
                        <i class="fas fa-sync"></i> Retry
                    </button>
                </div>
            `;
        }
    },

    createMechanicRow: async (mechanic) => {
        const shop = mechanic.shop_name || 'Unassigned';
        
        // Fetch services for this mechanic with vehicle info
        let services = [];
        try {
            if (AuthManager.isAdmin()) {
                // Admin can see all services for this mechanic
                services = await Database.select(`
                    SELECT sr.*, v.make, v.model, v.year,
                           CONCAT(v.year, ' ', v.make, ' ', v.model) as vehicle_info
                    FROM ServiceRecords sr
                    LEFT JOIN Vehicles v ON sr.vin = v.vin
                    LEFT JOIN WorkedOn wo ON sr.service_id = wo.service_id
                    WHERE wo.mechanic_id = ${mechanic.mechanic_id}
                    ORDER BY sr.service_date DESC
                `);
            } else {
                // Regular users can only see services for their own vehicles
                const userId = AuthManager.currentUser.user_id;
                services = await Database.select(`
                    SELECT sr.*, v.make, v.model, v.year,
                           CONCAT(v.year, ' ', v.make, ' ', v.model) as vehicle_info
                    FROM ServiceRecords sr
                    LEFT JOIN Vehicles v ON sr.vin = v.vin
                    LEFT JOIN WorkedOn wo ON sr.service_id = wo.service_id
                    JOIN Owns o ON sr.vin = o.vin
                    WHERE wo.mechanic_id = ${mechanic.mechanic_id}
                    AND o.user_id = ${userId}
                    ORDER BY sr.service_date DESC
                `);
            }
        } catch (error) {
            console.error(`Error fetching services for mechanic ${mechanic.mechanic_id}:`, error);
        }
        
        return `
            <tr>
                <td>${mechanic.mechanic_id}</td>
                <td>${mechanic.name}</td>
                <td>${mechanic.email || 'N/A'}</td>
                <td>${mechanic.phone_number || 'N/A'}</td>
                <td>${shop}</td>
                ${AuthManager.isAdmin() ? `<td>${mechanic.user_id}</td>` : ''}
                <td>
                    <span class="badge bg-primary">${services.length} Service(s)</span>
                    <button class="btn btn-sm btn-outline-info" onclick="mechanicsManager.showDetails(${mechanic.mechanic_id})">
                        <i class="fas fa-info-circle"></i> Details
                    </button>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="mechanicsManager.showEditForm(${mechanic.mechanic_id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="mechanicsManager.deleteMechanic(${mechanic.mechanic_id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
            <tr id="mechanic-details-${mechanic.mechanic_id}" class="detail-row" style="display: none;">
                <td colspan="7">
                    <div class="card">
                        <div class="card-header">
                            <h6>Mechanic Details - ${mechanic.name}</h6>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6>Contact Information</h6>
                                    <ul class="list-group list-group-flush">
                                        <li class="list-group-item">
                                            <strong>Email:</strong> ${mechanic.email || 'N/A'}
                                        </li>
                                        <li class="list-group-item">
                                            <strong>Phone:</strong> ${mechanic.phone_number || 'N/A'}
                                        </li>
                                        <li class="list-group-item">
                                            <strong>Shop:</strong> ${mechanic.shop_name || 'Unassigned'}
                                        </li>
                                        ${AuthManager.isAdmin() ? `
                                            <li class="list-group-item">
                                                <strong>User ID:</strong> ${mechanic.user_id}
                                            </li>
                                        ` : ''}
                                    </ul>
                                </div>
                                <div class="col-md-6">
                                    <h6>Service History (${services.length})</h6>
                                    ${services.length > 0 ? `
                                        <ul class="list-group list-group-flush">
                                            ${services.map(service => `
                                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                                    ${Utils.formatDate(service.service_date)} - ${service.description}
                                                    <span class="badge bg-secondary">${service.vehicle_info || 'Unknown Vehicle'}</span>
                                                </li>
                                            `).join('')}
                                        </ul>
                                    ` : '<p class="text-muted">No services performed</p>'}
                                </div>
                            </div>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    },

    showDetails: (mechanicId) => {
        const detailRow = document.getElementById(`mechanic-details-${mechanicId}`);
        const button = event.target.closest('button');
        Utils.toggleDetailRow(button, detailRow);
    },

    showAddForm: async () => {
        try {
            const userId = AuthManager.currentUser.user_id;

            const shops = AuthManager.isAdmin()
                ? await Database.select('SELECT car_shop_id, name FROM CarShops')
                : await Database.select(`
                    SELECT car_shop_id, name 
                    FROM CarShops 
                    WHERE user_id = ${userId}
                `);

            const shopOptions = shops.map(shop => ({
                value: shop.car_shop_id,
                text: shop.name
            }));

        const formContent = `
            <form id="mechanicForm">
                ${Utils.createFormField('Name', 'name', 'text', true).outerHTML}
                ${Utils.createFormField('Email', 'email', 'email', false).outerHTML}
                ${Utils.createFormField('Phone Number', 'phone_number', 'tel', false).outerHTML}
                ${Utils.createFormField('Car Shop', 'car_shop_id', 'select', false, shopOptions).outerHTML}
                ${AuthManager.isAdmin() ? Utils.createFormField('User ID', 'user_id', 'number', true).outerHTML : ''}
            </form>
        `;

        Utils.ModalManager.show('Add New Mechanic', formContent, () => mechanicsManager.saveMechanic());
        } catch (error) {
            console.error('Error loading shops for mechanic form:', error);
            Utils.showAlert(`Error loading shops: ${error.message}`, 'danger');
        }
    },

    showEditForm: async (mechanicId) => {
        try {
            const mechanics = await Database.select(`SELECT * FROM Mechanics WHERE mechanic_id = ${mechanicId}`);
            const mechanic = mechanics[0];
            if (!mechanic) {
                Utils.showAlert('Mechanic not found!', 'danger');
                return;
            }

            const userId = AuthManager.currentUser.user_id;

            const shops = AuthManager.isAdmin()
                ? await Database.select('SELECT car_shop_id, name FROM CarShops')
                : await Database.select(`
                    SELECT car_shop_id, name 
                    FROM CarShops 
                    WHERE user_id = ${userId}
                `);

            const shopOptions = shops.map(shop => ({
                value: shop.car_shop_id,
                text: shop.name
            }));

                    const formContent = `
                <form id="mechanicForm">
                    ${Utils.createFormField('Name', 'name', 'text', true).outerHTML}
                    ${Utils.createFormField('Email', 'email', 'email', false).outerHTML}
                    ${Utils.createFormField('Phone Number', 'phone_number', 'tel', false).outerHTML}
                    ${Utils.createFormField('Car Shop', 'car_shop_id', 'select', false, shopOptions).outerHTML}
                    ${AuthManager.isAdmin() ? Utils.createFormField('User ID', 'user_id', 'number', true).outerHTML : ''}
                </form>
            `;

            // Populate form with existing data
            setTimeout(() => {
                document.getElementById('name').value = mechanic.name;
                document.getElementById('email').value = mechanic.email;
                document.getElementById('phone_number').value = mechanic.phone_number;
                document.getElementById('car_shop_id').value = mechanic.car_shop_id || '';
                if (AuthManager.isAdmin()) {
                    document.getElementById('user_id').value = mechanic.user_id;
                }
            }, 100);

            Utils.ModalManager.show('Edit Mechanic', formContent, () => mechanicsManager.saveMechanic(mechanicId));
        } catch (error) {
            Utils.showAlert(`Error loading mechanic: ${error.message}`, 'danger');
        }
    },

    saveMechanic: async (mechanicId = null) => {
        const form = document.getElementById('mechanicForm');
        const formData = new FormData(form);
        
        const mechanicData = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone_number: formData.get('phone_number'),
            car_shop_id: formData.get('car_shop_id') ? parseInt(formData.get('car_shop_id')) : null
        };
        if (AuthManager.isAdmin()) {
            mechanicData.user_id = parseInt(formData.get('user_id'));
        }

        // Validation
        if (!mechanicData.name) {
            Utils.showAlert('Name is required', 'danger');
            return;
        }
        if ((AuthManager.isAdmin() && !mechanicData.user_id)) {
            Utils.showAlert('User_ID is required', 'danger');
            return;
        }

        if (!mechanicData.car_shop_id || isNaN(mechanicData.car_shop_id)) {
            Utils.showAlert('Car Shop is required', 'danger');
            return;
        }

        // Validate email only if provided
        if (mechanicData.email && !Utils.validateEmail(mechanicData.email)) {
            Utils.showAlert('Please enter a valid email address', 'danger');
            return;
        }

        try {
            if (mechanicId) {
                // Update existing mechanic in database
                const carShopIdClause = mechanicData.car_shop_id ? `car_shop_id = ${mechanicData.car_shop_id}` : 'car_shop_id = NULL';
                const emailClause = mechanicData.email ? `email = '${mechanicData.email}'` : 'email = NULL';
                const phoneClause = mechanicData.phone_number ? `phone_number = '${mechanicData.phone_number}'` : 'phone_number = NULL';

                let updateSql = `UPDATE Mechanics SET 
                    name = '${mechanicData.name}', 
                    ${emailClause}, 
                    ${phoneClause}, 
                    ${carShopIdClause}`;

                if (AuthManager.isAdmin()) {
                    updateSql += `, user_id = ${mechanicData.user_id}`;
                }

                updateSql += ` WHERE mechanic_id = ${mechanicId}`;
                
                await Database.update(updateSql);
                Utils.showAlert('Mechanic updated successfully', 'success');
            } else {
                // Add new mechanic to database
                const carShopIdClause = mechanicData.car_shop_id ? `${mechanicData.car_shop_id}` : 'NULL';
                const emailValue = mechanicData.email ? `'${mechanicData.email}'` : 'NULL';
                const phoneValue = mechanicData.phone_number ? `'${mechanicData.phone_number}'` : 'NULL';
                
                const userId = AuthManager.isAdmin()
                    ? mechanicData.user_id
                    : AuthManager.currentUser.user_id;

                const sql = `INSERT INTO Mechanics (name, email, phone_number, car_shop_id, user_id) VALUES ('${mechanicData.name}', ${emailValue}, ${phoneValue}, ${carShopIdClause}, ${userId})`;
                
                await Database.insert(sql);
                Utils.showAlert('Mechanic added successfully', 'success');
            }

            Utils.ModalManager.hide();
            
            // Refresh all sections that depend on mechanic data
            await mechanicsManager.refreshAllRelatedSections();
        } catch (error) {
            Utils.showAlert(`Error saving mechanic: ${error.message}`, 'danger');
        }
    },

    // Refresh all sections that depend on mechanic data
    refreshAllRelatedSections: async () => {
        try {
            // Show loading indicator
            Utils.showAlert('Updating all related sections...', 'info');
            
            // Refresh mechanics section
            await mechanicsManager.render();
            
            // Refresh service records section (since mechanics work on services)
            if (window.servicesManager) {
                await servicesManager.render();
            }
            
            // Refresh upcoming services section (if mechanics are involved)
            if (window.maintenanceManager) {
                await maintenanceManager.render();
            }
            
            console.log('All mechanic-related sections refreshed successfully');
            
            // Show success message
            setTimeout(() => {
                Utils.showAlert('All sections updated successfully!', 'success');
            }, 500);
        } catch (error) {
            console.error('Error refreshing mechanic-related sections:', error);
            Utils.showAlert('Error updating sections. Please refresh the page.', 'danger');
        }
    },

    deleteMechanic: async (mechanicId) => {
        if (!confirm('Are you sure you want to delete this mechanic? This will also remove all associated service records.')) {
            return;
        }

        try {
            // Delete mechanic from database (cascade will handle related records)
            const sql = `DELETE FROM Mechanics WHERE mechanic_id = ${mechanicId}`;
            await Database.delete(sql);
            
            Utils.showAlert('Mechanic deleted successfully', 'success');
            
            // Refresh all sections that depend on mechanic data
            await mechanicsManager.refreshAllRelatedSections();
        } catch (error) {
            Utils.showAlert(`Error deleting mechanic: ${error.message}`, 'danger');
        }
    }
};

// Make mechanicsManager available globally
window.mechanicsManager = mechanicsManager; 