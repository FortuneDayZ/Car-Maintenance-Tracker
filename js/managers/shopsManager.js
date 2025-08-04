// Car Shops Manager
const shopsManager = {
    container: null,

    init: () => {
        shopsManager.container = document.getElementById('shops-table-container');
        shopsManager.render();
    },

    render: async () => {
        // Check if user is authenticated
        if (!AuthManager.isAuthenticated) {
            shopsManager.container.innerHTML = '<div class="alert alert-warning">Please log in to view car shops.</div>';
            return;
        }

        try {
            let shops = [];
            
            if (AuthManager.isAdmin()) {
                // Admin can see all shops
                shops = await Database.select('SELECT * FROM CarShops');
            } else {
                // Regular users can only see shops that have mechanics who worked on their vehicles
                const userId = AuthManager.currentUser.user_id;
                shops = await Database.select(`SELECT * FROM CarShops WHERE user_id = ${userId}`);
            }
            
            // Create table rows asynchronously
            const tableRows = [];
            for (const shop of shops) {
                const row = await shopsManager.createShopRow(shop);
                tableRows.push(row);
            }
            
            const table = `
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Address</th>
                                <th>Phone</th>
                                ${AuthManager.isAdmin() ? '<th>User ID</th>' : ''}
                                <th>Mechanics</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows.join('')}
                        </tbody>
                    </table>
                </div>
            `;
            
            shopsManager.container.innerHTML = table;
        } catch (error) {
            console.error('Error loading shops:', error);
            shopsManager.container.innerHTML = `
                <div class="alert alert-danger">
                    <h4><i class="fas fa-exclamation-triangle"></i> Error Loading Shops</h4>
                    <p>${error.message}</p>
                    <button class="btn btn-primary" onclick="shopsManager.render()">
                        <i class="fas fa-sync"></i> Retry
                    </button>
                </div>
            `;
        }
    },

    createShopRow: async (shop) => {
        // Fetch mechanics for this shop
        let mechanics = [];
        let mechanicsCount = 0;
        try {
            if (AuthManager.isAdmin()) {
                // Admin can see all mechanics for this shop
                const mechanicsResult = await Database.select(`
                    SELECT mechanic_id, name, email, phone_number
                    FROM Mechanics
                    WHERE car_shop_id = ${shop.car_shop_id}
                `);
                mechanics = mechanicsResult;
                mechanicsCount = mechanics.length;
            } else {
                // Regular users can only see mechanics who worked on their vehicles
                const userId = AuthManager.currentUser.user_id;
                const mechanicsResult = await Database.select(`
                    SELECT DISTINCT m.mechanic_id, m.name, m.email, m.phone_number
                    FROM Mechanics m
                    JOIN WorkedOn wo ON m.mechanic_id = wo.mechanic_id
                    JOIN ServiceRecords sr ON wo.service_id = sr.service_id
                    JOIN Owns o ON sr.vin = o.vin
                    WHERE m.car_shop_id = ${shop.car_shop_id}
                    AND o.user_id = ${userId}
                `);
                mechanics = mechanicsResult;
                mechanicsCount = mechanics.length;
            }
        } catch (error) {
            console.error('Error fetching mechanics for shop:', shop.car_shop_id, error);
        }
        
        // Format address from separate fields
        const address = [shop.street, shop.city, shop.state, shop.zip_code]
            .filter(part => part && part.trim())
            .join(', ');
        
        return `
            <tr>
                <td>${shop.car_shop_id}</td>
                <td>${shop.name}</td>
                <td>${address || 'N/A'}</td>
                <td>${shop.phone_number || 'N/A'}</td>
                ${AuthManager.isAdmin() ? `<td>${shop.user_id}</td>` : ''}
                <td>
                    <span class="badge bg-info">${mechanicsCount} Mechanic(s)</span>
                    <button class="btn btn-sm btn-outline-info" onclick="shopsManager.showDetails(${shop.car_shop_id})">
                        <i class="fas fa-info-circle"></i> Details
                    </button>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="shopsManager.showEditForm(${shop.car_shop_id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="shopsManager.deleteShop(${shop.car_shop_id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
            <tr id="shop-details-${shop.car_shop_id}" class="detail-row" style="display: none;">
                <td colspan="6">
                    <div class="card">
                        <div class="card-header">
                            <h6>Shop Details - ${shop.name}</h6>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-6">
                                    
                                    <ul class="list-group list-group-flush">
                                        <li class="list-group-item">
                                            <strong>Street:</strong> ${shop.street || 'N/A'}
                                        </li>
                                        <li class="list-group-item">
                                            <strong>City:</strong> ${shop.city || 'N/A'}
                                        </li>
                                        <li class="list-group-item">
                                            <strong>State:</strong> ${shop.state || 'N/A'}
                                        </li>
                                        <li class="list-group-item">
                                            <strong>Zip Code:</strong> ${shop.zip_code || 'N/A'}
                                        </li>
                                        <li class="list-group-item">
                                            <strong>Phone:</strong> ${shop.phone_number}
                                        </li>
                                        ${AuthManager.isAdmin() ? `
                                            <li class="list-group-item">
                                                <strong>User ID:</strong> ${shop.user_id}
                                            </li>
                                        ` : ''}
                                    </ul>
                                </div>
                                <div class="col-md-6">
                                    <h6>Mechanics (${mechanicsCount})</h6>
                                    ${mechanicsCount > 0 ? `
                                        <ul class="list-group list-group-flush">
                                            ${mechanics.map(mechanic => `
                                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                                    ${mechanic.name}
                                                    <span class="badge bg-secondary">${mechanic.email}</span>
                                                </li>
                                            `).join('')}
                                        </ul>
                                    ` : '<p class="text-muted">No mechanics assigned to this shop</p>'}
                                </div>
                            </div>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    },

    showDetails: (shopId) => {
        const detailRow = document.getElementById(`shop-details-${shopId}`);
        const button = event.target.closest('button');
        Utils.toggleDetailRow(button, detailRow);
    },

    showAddForm: () => {
        const formContent = `
            <form id="shopForm">
                ${Utils.createFormField('Name', 'name', 'text', true).outerHTML}
                ${Utils.createFormField('Street', 'street', 'text', true).outerHTML}
                ${Utils.createFormField('City', 'city', 'text', true).outerHTML}
                ${Utils.createFormField('State', 'state', 'text', true).outerHTML}
                ${Utils.createFormField('Zip Code', 'zip_code', 'text', true).outerHTML}
                ${Utils.createFormField('Phone Number', 'phone_number', 'tel', true).outerHTML}
                ${AuthManager.isAdmin() ? Utils.createFormField('User ID', 'user_id', 'number', true).outerHTML : ''}
            </form>
        `;

        Utils.ModalManager.show('Add New Car Shop', formContent, () => shopsManager.saveShop());
    },

    showEditForm: async (shopId) => {
        try {
            const shops = await Database.select(`SELECT * FROM CarShops WHERE car_shop_id = ${shopId}`);
            const shop = shops[0];
            if (!shop) {
                Utils.showAlert('Shop not found!', 'danger');
                return;
            }

            const formContent = `
                <form id="shopForm">
                    ${Utils.createFormField('Name', 'name', 'text', true).outerHTML}
                    ${Utils.createFormField('Street', 'street', 'text', true).outerHTML}
                    ${Utils.createFormField('City', 'city', 'text', true).outerHTML}
                    ${Utils.createFormField('State', 'state', 'text', true).outerHTML}
                    ${Utils.createFormField('Zip Code', 'zip_code', 'text', true).outerHTML}
                    ${Utils.createFormField('Phone Number', 'phone_number', 'tel', true).outerHTML}
                    ${AuthManager.isAdmin() ? Utils.createFormField('User ID', 'user_id', 'number', true).outerHTML : ''}
                </form>
            `;

            // Populate form with existing data
            setTimeout(() => {
                document.getElementById('name').value = shop.name;
                document.getElementById('street').value = shop.street || '';
                document.getElementById('city').value = shop.city || '';
                document.getElementById('state').value = shop.state || '';
                document.getElementById('zip_code').value = shop.zip_code || '';
                document.getElementById('phone_number').value = shop.phone_number;
                if (AuthManager.isAdmin()) {
                    document.getElementById('user_id').value = shop.user_id;
                }
            }, 100);

            Utils.ModalManager.show('Edit Car Shop', formContent, () => shopsManager.saveShop(shopId));
        } catch (error) {
            Utils.showAlert(`Error loading shop: ${error.message}`, 'danger');
        }
    },

    saveShop: async (shopId = null) => {
        const form = document.getElementById('shopForm');
        const formData = new FormData(form);
        
        const shopData = {
            name: formData.get('name'),
            street: formData.get('street'),
            city: formData.get('city'),
            state: formData.get('state'),
            zip_code: formData.get('zip_code'),
            phone_number: formData.get('phone_number')
        };

        if (AuthManager.isAdmin()) {
            shopData.user_id = parseInt(formData.get('user_id'));
        }

        // Validation
        if (!shopData.name || !shopData.street || !shopData.city || !shopData.state || !shopData.zip_code || !shopData.phone_number || (AuthManager.isAdmin() && !shopData.user_id)) {
            Utils.showAlert('All fields are required', 'danger');
            return;
        }

        try {
            if (shopId) {
                // Update existing shop in database
                let updateSql = `UPDATE CarShops SET 
                    name = '${shopData.name}', 
                    street = '${shopData.street}', 
                    city = '${shopData.city}', 
                    state = '${shopData.state}', 
                    zip_code = '${shopData.zip_code}', 
                    phone_number = '${shopData.phone_number}'`;

                if (AuthManager.isAdmin()) {
                    updateSql += `, user_id = ${shopData.user_id}`;
                }

                updateSql += ` WHERE car_shop_id = ${shopId}`;
                
                await Database.update(updateSql);
                Utils.showAlert('Car shop updated successfully', 'success');
            } else {
                // Add new shop to database
                const userId = AuthManager.isAdmin()
                    ? shopData.user_id
                    : AuthManager.currentUser.user_id;

                const sql = `INSERT INTO CarShops (name, street, city, state, zip_code, phone_number, user_id) 
                            VALUES ('${shopData.name}', '${shopData.street}', '${shopData.city}', '${shopData.state}', '${shopData.zip_code}', '${shopData.phone_number}', ${userId})`;

                await Database.insert(sql);
                Utils.showAlert('Car shop added successfully', 'success');
            }

            Utils.ModalManager.hide();
            shopsManager.render();
        } catch (error) {
            Utils.showAlert(`Error saving shop: ${error.message}`, 'danger');
        }
    },

    deleteShop: async (shopId) => {
        if (!confirm('Are you sure you want to delete this car shop? This will also remove all associated mechanics.')) {
            return;
        }

        try {
            // Delete shop from database (cascade will handle related records)
            const sql = `DELETE FROM CarShops WHERE car_shop_id = ${shopId}`;
            await Database.delete(sql);
            
            Utils.showAlert('Car shop deleted successfully', 'success');
            shopsManager.render();
        } catch (error) {
            Utils.showAlert(`Error deleting shop: ${error.message}`, 'danger');
        }
    }
};

// Make shopsManager available globally
window.shopsManager = shopsManager; 