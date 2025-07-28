// Parts Manager
const partsManager = {
    container: null,

    init: () => {
        partsManager.container = document.getElementById('parts-table-container');
        partsManager.render();
    },

    render: () => {
        const table = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Manufacturer</th>
                            <th>Part Number</th>
                            <th>Unit Price</th>
                            <th>Services Used</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${dataStore.parts.map(part => partsManager.createPartRow(part)).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        partsManager.container.innerHTML = table;
    },

    createPartRow: (part) => {
        const services = Utils.getRelatedData.getPartServices(part.part_id);
        
        return `
            <tr>
                <td>${part.part_id}</td>
                <td>${part.name}</td>
                <td>${part.manufacturer}</td>
                <td><code>${part.part_number}</code></td>
                <td>${Utils.formatCurrency(part.unit_price)}</td>
                <td>
                    <span class="badge bg-info">${services.length} Service(s)</span>
                    <button class="btn btn-sm btn-outline-info" onclick="partsManager.showDetails(${part.part_id})">
                        <i class="fas fa-info-circle"></i> Details
                    </button>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="partsManager.showEditForm(${part.part_id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="partsManager.deletePart(${part.part_id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
            <tr id="part-details-${part.part_id}" class="detail-row" style="display: none;">
                <td colspan="7">
                    <div class="card">
                        <div class="card-header">
                            <h6>Part Details - ${part.name}</h6>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6>Part Information</h6>
                                    <ul class="list-group list-group-flush">
                                        <li class="list-group-item">
                                            <strong>Name:</strong> ${part.name}
                                        </li>
                                        <li class="list-group-item">
                                            <strong>Manufacturer:</strong> ${part.manufacturer}
                                        </li>
                                        <li class="list-group-item">
                                            <strong>Part Number:</strong> ${part.part_number}
                                        </li>
                                        <li class="list-group-item">
                                            <strong>Unit Price:</strong> ${Utils.formatCurrency(part.unit_price)}
                                        </li>
                                    </ul>
                                </div>
                                <div class="col-md-6">
                                    <h6>Services Using This Part (${services.length})</h6>
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
                                    ` : '<p class="text-muted">No services using this part</p>'}
                                </div>
                            </div>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    },

    showDetails: (partId) => {
        const detailRow = document.getElementById(`part-details-${partId}`);
        const button = event.target.closest('button');
        Utils.toggleDetailRow(button, detailRow);
    },

    showAddForm: () => {
        const formContent = `
            <form id="partForm">
                ${Utils.createFormField('Name', 'name', 'text', true).outerHTML}
                ${Utils.createFormField('Manufacturer', 'manufacturer', 'text', true).outerHTML}
                ${Utils.createFormField('Part Number', 'part_number', 'text', true).outerHTML}
                ${Utils.createFormField('Unit Price', 'unit_price', 'number', true).outerHTML}
            </form>
        `;

        Utils.ModalManager.show('Add New Part', formContent, partsManager.savePart);
    },

    showEditForm: (partId) => {
        const part = dataStore.parts.find(p => p.part_id === partId);
        if (!part) return;

        const formContent = `
            <form id="partForm">
                ${Utils.createFormField('Name', 'name', 'text', true).outerHTML}
                ${Utils.createFormField('Manufacturer', 'manufacturer', 'text', true).outerHTML}
                ${Utils.createFormField('Part Number', 'part_number', 'text', true).outerHTML}
                ${Utils.createFormField('Unit Price', 'unit_price', 'number', true).outerHTML}
            </form>
        `;

        // Populate form with existing data
        setTimeout(() => {
            document.getElementById('name').value = part.name;
            document.getElementById('manufacturer').value = part.manufacturer;
            document.getElementById('part_number').value = part.part_number;
            document.getElementById('unit_price').value = part.unit_price;
        }, 100);

        Utils.ModalManager.show('Edit Part', formContent, () => partsManager.savePart(partId));
    },

    savePart: (partId = null) => {
        const form = document.getElementById('partForm');
        const formData = new FormData(form);
        
        const partData = {
            name: formData.get('name'),
            manufacturer: formData.get('manufacturer'),
            part_number: formData.get('part_number'),
            unit_price: parseFloat(formData.get('unit_price'))
        };

        // Validation
        if (!partData.name || !partData.manufacturer || !partData.part_number || !partData.unit_price) {
            Utils.showAlert('All fields are required', 'danger');
            return;
        }

        if (partData.unit_price < 0) {
            Utils.showAlert('Unit price must be a positive number', 'danger');
            return;
        }

        if (partId) {
            // Update existing part
            const partIndex = dataStore.parts.findIndex(p => p.part_id === partId);
            if (partIndex !== -1) {
                dataStore.parts[partIndex] = { ...dataStore.parts[partIndex], ...partData };
                Utils.showAlert('Part updated successfully', 'success');
            }
        } else {
            // Add new part
            const newPart = {
                part_id: Utils.getNextId(dataStore.parts, 'part_id'),
                ...partData
            };
            dataStore.parts.push(newPart);
            Utils.showAlert('Part added successfully', 'success');
        }

        Utils.ModalManager.hide();
        partsManager.render();
    },

    deletePart: (partId) => {
        if (!confirm('Are you sure you want to delete this part? This will also remove all associated service relationships.')) {
            return;
        }

        // Remove part from data store
        dataStore.parts = dataStore.parts.filter(p => p.part_id !== partId);
        
        // Remove associated service relationships
        dataStore.serviceRecords_Parts = dataStore.serviceRecords_Parts.filter(sp => sp.part_id !== partId);

        Utils.showAlert('Part deleted successfully', 'success');
        partsManager.render();
    }
}; 