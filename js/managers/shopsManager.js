// Car Shops Manager
const shopsManager = {
    container: null,

    init: () => {
        shopsManager.container = document.getElementById('shops-table-container');
        shopsManager.render();
    },

    render: () => {
        const table = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Address</th>
                            <th>Phone</th>
                            <th>Mechanics</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${dataStore.carShops.map(shop => shopsManager.createShopRow(shop)).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        shopsManager.container.innerHTML = table;
    },

    createShopRow: (shop) => {
        const mechanics = Utils.getRelatedData.getShopMechanics(shop.car_shop_id);
        
        return `
            <tr>
                <td>${shop.car_shop_id}</td>
                <td>${shop.name}</td>
                <td>${shop.address}</td>
                <td>${shop.phone_number}</td>
                <td>
                    <span class="badge bg-info">${mechanics.length} Mechanic(s)</span>
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
                                    <h6>Contact Information</h6>
                                    <ul class="list-group list-group-flush">
                                        <li class="list-group-item">
                                            <strong>Address:</strong> ${shop.address}
                                        </li>
                                        <li class="list-group-item">
                                            <strong>Phone:</strong> ${shop.phone_number}
                                        </li>
                                    </ul>
                                </div>
                                <div class="col-md-6">
                                    <h6>Mechanics (${mechanics.length})</h6>
                                    ${mechanics.length > 0 ? `
                                        <ul class="list-group list-group-flush">
                                            ${mechanics.map(mechanic => `
                                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                                    ${mechanic.name}
                                                    <span class="badge bg-secondary">${mechanic.email}</span>
                                                </li>
                                            `).join('')}
                                        </ul>
                                    ` : '<p class="text-muted">No mechanics assigned</p>'}
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
                ${Utils.createFormField('Address', 'address', 'text', true).outerHTML}
                ${Utils.createFormField('Phone Number', 'phone_number', 'tel', true).outerHTML}
            </form>
        `;

        Utils.ModalManager.show('Add New Car Shop', formContent, shopsManager.saveShop);
    },

    showEditForm: (shopId) => {
        const shop = dataStore.carShops.find(s => s.car_shop_id === shopId);
        if (!shop) return;

        const formContent = `
            <form id="shopForm">
                ${Utils.createFormField('Name', 'name', 'text', true).outerHTML}
                ${Utils.createFormField('Address', 'address', 'text', true).outerHTML}
                ${Utils.createFormField('Phone Number', 'phone_number', 'tel', true).outerHTML}
            </form>
        `;

        // Populate form with existing data
        setTimeout(() => {
            document.getElementById('name').value = shop.name;
            document.getElementById('address').value = shop.address;
            document.getElementById('phone_number').value = shop.phone_number;
        }, 100);

        Utils.ModalManager.show('Edit Car Shop', formContent, () => shopsManager.saveShop(shopId));
    },

    saveShop: (shopId = null) => {
        const form = document.getElementById('shopForm');
        const formData = new FormData(form);
        
        const shopData = {
            name: formData.get('name'),
            address: formData.get('address'),
            phone_number: formData.get('phone_number')
        };

        // Validation
        if (!shopData.name || !shopData.address || !shopData.phone_number) {
            Utils.showAlert('All fields are required', 'danger');
            return;
        }

        if (shopId) {
            // Update existing shop
            const shopIndex = dataStore.carShops.findIndex(s => s.car_shop_id === shopId);
            if (shopIndex !== -1) {
                dataStore.carShops[shopIndex] = { ...dataStore.carShops[shopIndex], ...shopData };
                Utils.showAlert('Car shop updated successfully', 'success');
            }
        } else {
            // Add new shop
            const newShop = {
                car_shop_id: Utils.getNextId(dataStore.carShops, 'car_shop_id'),
                ...shopData
            };
            dataStore.carShops.push(newShop);
            Utils.showAlert('Car shop added successfully', 'success');
        }

        Utils.ModalManager.hide();
        shopsManager.render();
    },

    deleteShop: (shopId) => {
        if (!confirm('Are you sure you want to delete this car shop? This will also remove all associated mechanics.')) {
            return;
        }

        // Remove shop from data store
        dataStore.carShops = dataStore.carShops.filter(s => s.car_shop_id !== shopId);
        
        // Remove associated mechanics
        dataStore.mechanics = dataStore.mechanics.filter(m => m.car_shop_id !== shopId);

        Utils.showAlert('Car shop deleted successfully', 'success');
        shopsManager.render();
    }
}; 