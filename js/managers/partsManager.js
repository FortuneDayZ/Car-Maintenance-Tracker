// Parts Manager
const partsManager = {
    container: null,

    init: () => {
        partsManager.container = document.getElementById('parts-table-container');
        partsManager.render();
    },

    render: async () => {
        // Check if user is authenticated
        if (!AuthManager.isAuthenticated) {
            partsManager.container.innerHTML = '<div class="alert alert-warning">Please log in to view parts.</div>';
            return;
        }

        try {
            let parts = [];
            
            if (AuthManager.isAdmin()) {
                // Admin can see all parts
                parts = await Database.select('SELECT * FROM Parts ORDER BY name');
            } else {
                /* // Regular users can see all parts, but we'll mark which ones they've used
                const userId = AuthManager.currentUser.user_id;
                
                // Get all parts
                const allParts = await Database.select('SELECT * FROM Parts ORDER BY name');
                
                // Get parts the user has used
                const usedParts = await Database.select(`
                    SELECT DISTINCT p.part_id
                    FROM Parts p
                    JOIN ServiceRecords_Parts srp ON p.part_id = srp.part_id
                    JOIN ServiceRecords sr ON srp.service_id = sr.service_id
                    JOIN Owns o ON sr.vin = o.vin
                    WHERE o.user_id = ${userId}
                `);
                
                // Create a set of used part IDs for quick lookup
                const usedPartIds = new Set(usedParts.map(p => p.part_id));
                
                // Mark parts as used by the current user
                parts = allParts.map(part => ({
                    ...part,
                    used_by_user: usedPartIds.has(part.part_id)
                })); */
                const userId = AuthManager.currentUser.user_id;
                parts = await Database.select(`SELECT * FROM Parts p WHERE p.user_id = ${userId} ORDER BY p.name`);

            }
            
            const table = `
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name <small class="text-muted">(✓ = Used by you)</small></th>
                                <th>Manufacturer</th>
                                <th>Part Number</th>
                                <th>Unit Price</th>
                                ${AuthManager.isAdmin() ? '<th>User ID</th>' : ''}
                                <th>Services Used</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(await Promise.all(parts.map(part => partsManager.createPartRow(part)))).join('')}
                        </tbody>
                    </table>
                </div>
            `;
            
            partsManager.container.innerHTML = table;
        } catch (error) {
            console.error('Error loading parts:', error);
            partsManager.container.innerHTML = `
                <div class="alert alert-danger">
                    <h4><i class="fas fa-exclamation-triangle"></i> Error Loading Parts</h4>
                    <p>${error.message}</p>
                    <button class="btn btn-primary" onclick="partsManager.render()">
                        <i class="fas fa-sync"></i> Retry
                    </button>
                </div>
            `;
        }
    },

    createPartRow: async (part) => {
        // Fetch services that use this part with vehicle info
        let services = [];
        try {
            if (AuthManager.isAdmin()) {
                // Admin can see all services using this part
                services = await Database.select(`
                    SELECT sr.*, CONCAT(v.year, ' ', v.make, ' ', v.model) as vehicle_info
                    FROM ServiceRecords sr
                    LEFT JOIN Vehicles v ON sr.vin = v.vin
                    LEFT JOIN ServiceRecords_Parts srp ON sr.service_id = srp.service_id
                    WHERE srp.part_id = ${part.part_id}
                    ORDER BY sr.service_date DESC
                `);
            } else {
                // Regular users can only see services for their own vehicles
                const userId = AuthManager.currentUser.user_id;
                services = await Database.select(`
                    SELECT sr.*, CONCAT(v.year, ' ', v.make, ' ', v.model) as vehicle_info
                    FROM ServiceRecords sr
                    LEFT JOIN Vehicles v ON sr.vin = v.vin
                    LEFT JOIN ServiceRecords_Parts srp ON sr.service_id = srp.service_id
                    JOIN Owns o ON sr.vin = o.vin
                    WHERE srp.part_id = ${part.part_id}
                    AND o.user_id = ${userId}
                    ORDER BY sr.service_date DESC
                `);
            }
        } catch (error) {
            console.error(`Error fetching services for part ${part.part_id}:`, error);
        }
        
        return `
            <tr ${part.used_by_user ? 'class="table-success"' : ''}>
                <td>${part.part_id}</td>
                <td>
                    ${part.name}
                    ${part.used_by_user ? '<span class="badge bg-success ms-2"><i class="fas fa-check"></i> Used</span>' : ''}
                </td>
                <td>${part.manufacturer}</td>
                <td><code>${part.part_number}</code></td>
                <td>${Utils.formatCurrency(part.unit_price)}</td>
                ${AuthManager.isAdmin() ? `<td>${part.user_id}</td>` : ''}

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
                                        ${AuthManager.isAdmin() ? `
                                            <li class="list-group-item">
                                                <strong>User ID:</strong> ${part.user_id}
                                            </li>
                                        ` : ''}
                                    </ul>
                                </div>
                                <div class="col-md-6">
                                    <h6>Services Using This Part (${services.length})</h6>
                                    ${services.length > 0 ? `
                                        <ul class="list-group list-group-flush">
                                            ${services.map(service => `
                                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                                    ${Utils.formatDate(service.service_date)} - ${service.description}
                                                    <span class="badge bg-secondary">${service.vehicle_info || 'Unknown Vehicle'}</span>
                                                </li>
                                            `).join('')}
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
                ${AuthManager.isAdmin() ? Utils.createFormField('User ID', 'user_id', 'number', true).outerHTML : ''}
            </form>
        `;

        Utils.ModalManager.show('Add New Part', formContent, () => partsManager.savePart());
    },

    showEditForm: async (partId) => {
        try {
            const parts = await Database.select(`SELECT * FROM Parts WHERE part_id = ${partId}`);
            const part = parts[0];
            if (!part) return;

        const formContent = `
            <form id="partForm">
                ${Utils.createFormField('Name', 'name', 'text', true).outerHTML}
                ${Utils.createFormField('Manufacturer', 'manufacturer', 'text', true).outerHTML}
                ${Utils.createFormField('Part Number', 'part_number', 'text', true).outerHTML}
                ${Utils.createFormField('Unit Price', 'unit_price', 'number', true).outerHTML}
                ${AuthManager.isAdmin() ? Utils.createFormField('User ID', 'user_id', 'number', true).outerHTML : ''}
            </form>
        `;

        Utils.ModalManager.show('Edit Part', formContent, () => partsManager.savePart(partId));
        
        // Populate form with existing data after modal is shown
        Utils.populateForm({
            name: part.name,
            manufacturer: part.manufacturer,
            part_number: part.part_number,
            unit_price: part.unit_price
        });
        
        if (AuthManager.isAdmin()) {
            document.getElementById('user_id').value = part.user_id;
        }

        } catch (error) {
            console.error('Error loading part for edit:', error);
            Utils.showAlert(`Error loading part: ${error.message}`, 'danger');
        }
    },

    savePart: async (partId = null) => {
        const form = document.getElementById('partForm');
        const formData = new FormData(form);
        
        const partData = {
            name: formData.get('name'),
            manufacturer: formData.get('manufacturer'),
            part_number: formData.get('part_number'),
            unit_price: parseFloat(formData.get('unit_price'))
        };
        if (AuthManager.isAdmin()) {
            partData.user_id = parseInt(formData.get('user_id'));
        }

        // Validation - check for empty strings and NaN values
        if (!partData.name || partData.name.trim() === '') {
            Utils.showAlert('Name is required', 'danger');
            return;
        }
        
        if (!partData.manufacturer || partData.manufacturer.trim() === '') {
            Utils.showAlert('Manufacturer is required', 'danger');
            return;
        }
        
        if (!partData.part_number || partData.part_number.trim() === '') {
            Utils.showAlert('Part number is required', 'danger');
            return;
        }
        
        if (isNaN(partData.unit_price)) {
            Utils.showAlert('Unit price must be a valid number', 'danger');
            return;
        }

        if (partData.unit_price < 0) {
            Utils.showAlert('Unit price must be a positive number', 'danger');
            return;
        }
        if ((AuthManager.isAdmin() && !partData.user_id)) {
            Utils.showAlert('User_ID is required', 'danger');
            return;
        }

        try {
            if (partId) {
                // Update existing part in database
                const manufacturerClause = partData.manufacturer ? `manufacturer = '${partData.manufacturer}'` : 'manufacturer = NULL';
                const partNumberClause = partData.part_number ? `part_number = '${partData.part_number}'` : 'part_number = NULL';
            
                let updateSql = `UPDATE Parts SET 
                    name = '${partData.name}', 
                    unit_price = ${partData.unit_price}, 
                    ${manufacturerClause}, 
                    ${partNumberClause}`;
            
                if (AuthManager.isAdmin()) {
                    updateSql += `, user_id = ${partData.user_id}`;
                }
            
                updateSql += ` WHERE part_id = ${partId}`;
            
                await Database.update(updateSql);
                Utils.showAlert('Part updated successfully', 'success');
            } else {
                // Add new part to database
                const manufacturerValue = partData.manufacturer ? `'${partData.manufacturer}'` : 'NULL';
                const partNumberValue = partData.part_number ? `'${partData.part_number}'` : 'NULL';
            
                const userId = AuthManager.isAdmin()
                    ? partData.user_id
                    : AuthManager.currentUser.user_id;
            
                const sql = `INSERT INTO Parts (name, manufacturer, part_number, unit_price, user_id) 
                             VALUES ('${partData.name}', ${manufacturerValue}, ${partNumberValue}, ${partData.unit_price}, ${userId})`;
            
                await Database.insert(sql);
                Utils.showAlert('Part added successfully', 'success');
            }            

            Utils.ModalManager.hide();
            
            // Refresh all sections that depend on parts data
            await partsManager.refreshAllRelatedSections();
        } catch (error) {
            console.error('Error saving part:', error);
            Utils.showAlert(`Error saving part: ${error.message}`, 'danger');
        }
    },

    // Refresh all sections that depend on parts data
    refreshAllRelatedSections: async () => {
        try {
            // Show loading indicator
            Utils.showAlert('Updating all related sections...', 'info');
            
            // Refresh parts section
            await partsManager.render();
            
            // Refresh services section (since parts are used in services)
            if (window.servicesManager) {
                await servicesManager.render();
            }
            
            // Refresh mechanics section (since mechanics work with parts)
            if (window.mechanicsManager) {
                await mechanicsManager.render();
            }
            
            console.log('All parts-related sections refreshed successfully');
            
            // Show success message
            setTimeout(() => {
                Utils.showAlert('All sections updated successfully!', 'success');
            }, 500);
        } catch (error) {
            console.error('Error refreshing parts-related sections:', error);
            Utils.showAlert('Error updating sections. Please refresh the page.', 'danger');
        }
    },

    deletePart: async (partId) => {
        if (!confirm('Are you sure you want to delete this part? This will also remove all associated service relationships.')) {
            return;
        }

        try {
            // Remove part from database
            await Database.deleteRecords('Parts', `part_id = ${partId}`);
            
            // Remove associated service relationships (if ServiceRecords_Parts table exists)
            try {
                await Database.deleteRecords('ServiceRecords_Parts', `part_id = ${partId}`);
            } catch (error) {
                console.log('ServiceRecords_Parts table may not exist, skipping relationship cleanup');
            }

            Utils.showAlert('Part deleted successfully', 'success');
            
            // Refresh all sections that depend on parts data
            await partsManager.refreshAllRelatedSections();
        } catch (error) {
            console.error('Error deleting part:', error);
            Utils.showAlert(`Error deleting part: ${error.message}`, 'danger');
        }
    }
};

// Make partsManager available globally
window.partsManager = partsManager; 