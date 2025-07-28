// Mechanics Manager
const mechanicsManager = {
    container: null,

    init: () => {
        mechanicsManager.container = document.getElementById('mechanics-table-container');
        mechanicsManager.render();
    },

    render: () => {
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
                            <th>Services</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${dataStore.mechanics.map(mechanic => mechanicsManager.createMechanicRow(mechanic)).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        mechanicsManager.container.innerHTML = table;
    },

    createMechanicRow: (mechanic) => {
        const shop = dataStore.carShops.find(s => s.car_shop_id === mechanic.car_shop_id);
        const services = Utils.getRelatedData.getMechanicServices(mechanic.mechanic_id);
        
        return `
            <tr>
                <td>${mechanic.mechanic_id}</td>
                <td>${mechanic.name}</td>
                <td>${mechanic.email}</td>
                <td>${mechanic.phone_number}</td>
                <td>${shop ? shop.name : 'Unassigned'}</td>
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
                                            <strong>Email:</strong> ${mechanic.email}
                                        </li>
                                        <li class="list-group-item">
                                            <strong>Phone:</strong> ${mechanic.phone_number}
                                        </li>
                                        <li class="list-group-item">
                                            <strong>Shop:</strong> ${shop ? shop.name : 'Unassigned'}
                                        </li>
                                    </ul>
                                </div>
                                <div class="col-md-6">
                                    <h6>Service History (${services.length})</h6>
                                    ${services.length > 0 ? `
                                        <ul class="list-group list-group-flush">
                                            ${services.map(service => {
                                                const vehicle = dataStore.vehicles.find(v => v.vin === service.vin);
                                                return `
                                                    <li class="list-group-item d-flex justify-content-between align-items-center">
                                                        ${Utils.formatDate(service.service_date)} - ${service.description}
                                                        <span class="badge bg-secondary">${vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Unknown Vehicle'}</span>
                                                    </li>
                                                `;
                                            }).join('')}
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

    showAddForm: () => {
        const shopOptions = dataStore.carShops.map(shop => ({
            value: shop.car_shop_id,
            text: shop.name
        }));

        const formContent = `
            <form id="mechanicForm">
                ${Utils.createFormField('Name', 'name', 'text', true).outerHTML}
                ${Utils.createFormField('Email', 'email', 'email', true).outerHTML}
                ${Utils.createFormField('Phone Number', 'phone_number', 'tel', true).outerHTML}
                ${Utils.createFormField('Car Shop', 'car_shop_id', 'select', false, shopOptions).outerHTML}
            </form>
        `;

        Utils.ModalManager.show('Add New Mechanic', formContent, mechanicsManager.saveMechanic);
    },

    showEditForm: (mechanicId) => {
        const mechanic = dataStore.mechanics.find(m => m.mechanic_id === mechanicId);
        if (!mechanic) return;

        const shopOptions = dataStore.carShops.map(shop => ({
            value: shop.car_shop_id,
            text: shop.name
        }));

        const formContent = `
            <form id="mechanicForm">
                ${Utils.createFormField('Name', 'name', 'text', true).outerHTML}
                ${Utils.createFormField('Email', 'email', 'email', true).outerHTML}
                ${Utils.createFormField('Phone Number', 'phone_number', 'tel', true).outerHTML}
                ${Utils.createFormField('Car Shop', 'car_shop_id', 'select', false, shopOptions).outerHTML}
            </form>
        `;

        // Populate form with existing data
        setTimeout(() => {
            document.getElementById('name').value = mechanic.name;
            document.getElementById('email').value = mechanic.email;
            document.getElementById('phone_number').value = mechanic.phone_number;
            document.getElementById('car_shop_id').value = mechanic.car_shop_id || '';
        }, 100);

        Utils.ModalManager.show('Edit Mechanic', formContent, () => mechanicsManager.saveMechanic(mechanicId));
    },

    saveMechanic: (mechanicId = null) => {
        const form = document.getElementById('mechanicForm');
        const formData = new FormData(form);
        
        const mechanicData = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone_number: formData.get('phone_number'),
            car_shop_id: formData.get('car_shop_id') ? parseInt(formData.get('car_shop_id')) : null
        };

        // Validation
        if (!mechanicData.name || !mechanicData.email || !mechanicData.phone_number) {
            Utils.showAlert('Name, Email, and Phone Number are required', 'danger');
            return;
        }

        if (!Utils.validateEmail(mechanicData.email)) {
            Utils.showAlert('Please enter a valid email address', 'danger');
            return;
        }

        // Check for duplicate email
        const existingMechanic = dataStore.mechanics.find(m => m.email === mechanicData.email);
        
        if (existingMechanic && (!mechanicId || existingMechanic.mechanic_id !== mechanicId)) {
            Utils.showAlert('A mechanic with this email already exists', 'danger');
            return;
        }

        if (mechanicId) {
            // Update existing mechanic
            const mechanicIndex = dataStore.mechanics.findIndex(m => m.mechanic_id === mechanicId);
            if (mechanicIndex !== -1) {
                dataStore.mechanics[mechanicIndex] = { ...dataStore.mechanics[mechanicIndex], ...mechanicData };
                Utils.showAlert('Mechanic updated successfully', 'success');
            }
        } else {
            // Add new mechanic
            const newMechanic = {
                mechanic_id: Utils.getNextId(dataStore.mechanics, 'mechanic_id'),
                ...mechanicData
            };
            dataStore.mechanics.push(newMechanic);
            Utils.showAlert('Mechanic added successfully', 'success');
        }

        Utils.ModalManager.hide();
        mechanicsManager.render();
    },

    deleteMechanic: (mechanicId) => {
        if (!confirm('Are you sure you want to delete this mechanic? This will also remove all associated service records.')) {
            return;
        }

        // Remove mechanic from data store
        dataStore.mechanics = dataStore.mechanics.filter(m => m.mechanic_id !== mechanicId);
        
        // Remove associated workedOn records
        dataStore.workedOn = dataStore.workedOn.filter(work => work.mechanic_id !== mechanicId);

        Utils.showAlert('Mechanic deleted successfully', 'success');
        mechanicsManager.render();
    }
}; 