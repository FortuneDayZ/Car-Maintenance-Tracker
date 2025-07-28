// CSS Variables for JavaScript
const CSS_VARS = {
  primary: '#667eea',
  secondary: '#764ba2',
  danger: '#e74c3c',
  success: '#27ae60'
};

// DOM Elements
const elements = {
  hamburger: document.querySelector('.hamburger'),
  navMenu: document.querySelector('.nav-menu'),
  navLinks: document.querySelectorAll('.nav-link'),
  pages: document.querySelectorAll('.page'),
  modalOverlay: document.getElementById('modal-overlay'),
  modalTitle: document.getElementById('modal-title'),
  vehicleForm: document.getElementById('vehicle-form')
};

// API Base URL
const API_BASE = '/api';

// Global data storage
let appData = {
  vehicles: [],
  services: [],
  expenses: [],
  fuelLogs: [],
  maintenanceEvents: [],
  users: []
};

// Current user state
let currentUser = {
  id: 1,
  name: 'User',
  email: 'user@email.com'
};

// Utility Functions
const utils = {
  async fetchData(endpoint) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching data:', error);
      this.showNotification('Error loading data. Please try again.', 'error');
        return [];
    }
  },

  async postData(endpoint, data) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
        headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error posting data:', error);
      this.showNotification('Error saving data. Please try again.', 'error');
        return null;
    }
  },

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    const colors = {
      error: `linear-gradient(135deg, ${CSS_VARS.danger} 0%, #c0392b 100%)`,
      success: `linear-gradient(135deg, ${CSS_VARS.success} 0%, #2ecc71 100%)`,
      info: `linear-gradient(135deg, #3498db 0%, #2980b9 100%)`
    };

    notification.style.cssText = `
      position: fixed; top: 100px; right: 20px;
      background: ${colors[type]}; color: white;
      padding: 1rem 1.5rem; border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2); z-index: 3000;
      animation: slideIn 0.3s ease; max-width: 300px; word-wrap: break-word;
    `;
    notification.textContent = message;
    
    if (!document.querySelector('#notification-styles')) {
      const style = document.createElement('style');
      style.id = 'notification-styles';
      style.textContent = '@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }';
      document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 5000);
  },

  formatCurrency(amount) {
    return `$${parseFloat(amount || 0).toFixed(2)}`;
  },

  formatDate(date) {
    return new Date(date).toLocaleDateString();
  },

  formatMileage(mileage) {
    return mileage ? mileage.toLocaleString() : 'N/A';
  }
};

// Data Management
const dataManager = {
  async loadAllData() {
    try {
      const [vehicles, services, expenses, fuel, maintenance, users] = await Promise.all([
        utils.fetchData('/vehicles'),
        utils.fetchData('/services'),
        utils.fetchData('/expenses'),
        utils.fetchData('/fuel'),
        utils.fetchData('/maintenance'),
        utils.fetchData('/users')
      ]);

      appData = { vehicles, services, expenses, fuelLogs: fuel, maintenanceEvents: maintenance, users };
      
      console.log('Loaded data:', Object.fromEntries(
        Object.entries(appData).map(([key, value]) => [key, value.length])
      ));
      
      this.updateAllDisplays();
      utils.showNotification('Data loaded successfully!', 'success');
    } catch (error) {
        console.error('Error loading data:', error);
      utils.showNotification('Error loading data. Please check your connection.', 'error');
    }
  },

  updateAllDisplays() {
    this.displayVehicles();
    this.displayServices();
    this.displayExpenses();
    this.displayFuelEntries();
    this.displayMaintenance();
    this.updateDashboardStats();
    this.updateDashboardSections();
  },

  displayVehicles() {
    const container = document.querySelector('#vehicles .grid');
    if (!container) return;

    if (appData.vehicles.length === 0) {
      container.innerHTML = '<p>No vehicles found. Add your first vehicle!</p>';
        return;
    }

    container.innerHTML = appData.vehicles.map(vehicle => `
      <div class="vehicle-card card">
            <div class="vehicle-header">
                <h3>${vehicle.make} ${vehicle.model}</h3>
                <span class="vehicle-year">${vehicle.year}</span>
            </div>
            <div class="vehicle-info">
                <p><strong>VIN:</strong> ${vehicle.vin}</p>
                <p><strong>Owner:</strong> ${vehicle.owner_name || 'Unknown'}</p>
            </div>
            <div class="vehicle-actions">
          <button class="btn btn-secondary" onclick="actions.editVehicle('${vehicle.vin}')">Edit</button>
          <button class="btn btn-primary" onclick="actions.viewVehicleDetails('${vehicle.vin}')">View Details</button>
        </div>
        </div>
    `).join('');
  },

  displayServices() {
    const container = document.querySelector('#services .service-records');
    if (!container) return;

    if (appData.services.length === 0) {
      container.innerHTML = '<p>No service records found. Add your first service!</p>';
        return;
    }

    container.innerHTML = appData.services.map(service => `
      <div class="service-record card">
            <div class="service-header">
                <h4>${service.description || 'Service Record'}</h4>
          <span class="service-date">${utils.formatDate(service.service_date)}</span>
            </div>
            <div class="service-details">
                <p><strong>Vehicle:</strong> ${service.make} ${service.model}</p>
          <p><strong>Mileage:</strong> ${utils.formatMileage(service.current_mileage)} miles</p>
          <p><strong>Cost:</strong> ${utils.formatCurrency(service.cost)}</p>
                <p><strong>Mechanics:</strong> ${service.mechanics || 'Not specified'}</p>
                <p><strong>Services:</strong> ${service.service_types || 'Not specified'}</p>
            </div>
            <div class="service-actions">
          <button class="btn btn-secondary" onclick="actions.editService(${service.service_id})">Edit</button>
          <button class="btn btn-danger" onclick="actions.deleteService(${service.service_id})">Delete</button>
        </div>
        </div>
    `).join('');
  },

  displayExpenses() {
    const container = document.querySelector('#expenses .expense-list');
    if (!container) return;

    if (appData.expenses.length === 0) {
      container.innerHTML = '<p>No expenses found. Add your first expense!</p>';
        return;
    }

    container.innerHTML = appData.expenses.map(expense => `
      <div class="expense-item list-item">
        <div class="icon-circle">
                <i class="fas fa-dollar-sign"></i>
            </div>
        <div class="item-details">
                <h4>${expense.category}</h4>
                <p>${expense.make} ${expense.model}</p>
          <span class="item-date">${utils.formatDate(expense.date)}</span>
        </div>
        <div class="expense-amount">${utils.formatCurrency(expense.amount)}</div>
        </div>
    `).join('');
  },

  displayFuelEntries() {
    const container = document.querySelector('#fuel .fuel-entries');
    if (!container) return;

    if (appData.fuelLogs.length === 0) {
      container.innerHTML = '<p>No fuel logs found. Add your first fuel entry!</p>';
        return;
    }

    container.innerHTML = appData.fuelLogs.map(fuel => `
      <div class="fuel-entry card">
            <div class="fuel-header">
                <h4>${fuel.make} ${fuel.model}</h4>
          <span class="fuel-date">${utils.formatDate(fuel.date_filled)}</span>
            </div>
            <div class="fuel-details">
          <p><strong>Mileage:</strong> ${utils.formatMileage(fuel.current_mileage)} miles</p>
                <p><strong>Gallons:</strong> ${fuel.gallons || 0}</p>
          <p><strong>Cost:</strong> ${utils.formatCurrency(fuel.total_cost)}</p>
                <p><strong>Type:</strong> ${fuel.fuel_type || 'Regular'}</p>
            </div>
        </div>
    `).join('');
  },

  displayMaintenance() {
    const container = document.querySelector('#maintenance .maintenance-content');
    if (!container) return;

    if (appData.maintenanceEvents.length === 0) {
      container.innerHTML = '<p>No maintenance events found. Add your first maintenance event!</p>';
        return;
    }

    container.innerHTML = appData.maintenanceEvents.map(event => `
      <div class="maintenance-item list-item ${event.status === 'urgent' ? 'urgent' : ''} card">
        <div class="icon-circle">
                <i class="fas fa-calendar"></i>
            </div>
        <div class="item-details">
                <h4>${event.service_types || 'Maintenance'}</h4>
                <p>${event.make} ${event.model}</p>
          <span class="item-date">Due: ${utils.formatDate(event.rec_date)}</span>
          <span class="item-mileage">${utils.formatMileage(event.rec_mileage)} miles</span>
            </div>
            <div class="maintenance-actions">
          <button class="btn btn-primary" onclick="actions.completeMaintenance(${event.event_id})">Complete</button>
          <button class="btn btn-secondary" onclick="actions.rescheduleMaintenance(${event.event_id})">Reschedule</button>
        </div>
        </div>
    `).join('');
  },

  updateDashboardStats() {
    try {
      const stats = {
        vehicle_count: appData.vehicles.length,
        service_count: appData.services.length,
        total_expenses: appData.expenses.reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0),
        upcoming_maintenance: appData.maintenanceEvents.filter(event => event.status === 'Upcoming').length
      };

      const elements = {
        'vehicle-count': stats.vehicle_count,
        'service-count': stats.service_count,
        'total-expenses': utils.formatCurrency(stats.total_expenses),
        'upcoming-maintenance': stats.upcoming_maintenance
      };

      Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
      });
    } catch (error) {
      console.error('Error updating dashboard stats:', error);
    }
  },

  updateDashboardSections() {
    this.updateRecentServices();
    this.updateUpcomingMaintenance();
  },

  updateRecentServices() {
    const container = document.getElementById('recent-services-list');
    if (!container) return;
    
    const recentServices = appData.services.slice(0, 3);
    
    if (recentServices.length === 0) {
      container.innerHTML = '<p class="no-data">No recent services found.</p>';
      return;
    }
    
    container.innerHTML = recentServices.map(service => {
      const vehicle = appData.vehicles.find(v => v.vin === service.vin);
      const vehicleName = vehicle ? `${vehicle.make} ${vehicle.model}` : 'Unknown Vehicle';
      const serviceDate = new Date(service.service_date);
      const daysAgo = Math.floor((Date.now() - serviceDate.getTime()) / (1000 * 60 * 60 * 24));
      const dateText = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`;
      
      return `
        <div class="list-item">
          <div class="icon-circle">
            <i class="fas fa-tools"></i>
          </div>
          <div class="item-details">
            <h4>${service.description || 'Service'}</h4>
            <p>${vehicleName} - ${service.current_mileage} miles</p>
            <span class="item-date">${dateText}</span>
          </div>
          <div class="item-cost">${utils.formatCurrency(service.cost)}</div>
        </div>
      `;
    }).join('');
  },

  updateUpcomingMaintenance() {
    const container = document.getElementById('upcoming-maintenance-list');
    if (!container) return;
    
    const upcomingEvents = appData.maintenanceEvents.filter(event => event.status === 'Upcoming').slice(0, 3);
    
    if (upcomingEvents.length === 0) {
      container.innerHTML = '<p class="no-data">No upcoming maintenance scheduled.</p>';
      return;
    }
    
    container.innerHTML = upcomingEvents.map(event => {
      const vehicle = appData.vehicles.find(v => v.vin === event.vin);
      const vehicleName = vehicle ? `${vehicle.make} ${vehicle.model}` : 'Unknown Vehicle';
      const eventDate = new Date(event.rec_date);
      const daysUntil = Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      const urgencyClass = daysUntil <= 7 ? 'urgent' : '';
      
      return `
        <div class="list-item ${urgencyClass}">
          <div class="icon-circle">
            <i class="fas fa-calendar"></i>
          </div>
          <div class="item-details">
            <h4>${event.service_types || 'Maintenance'}</h4>
            <p>${vehicleName} - Due in ${daysUntil} days</p>
            <span class="item-mileage">${event.rec_mileage} miles</span>
          </div>
          <button class="btn btn-primary" onclick="actions.rescheduleMaintenance(${event.event_id})">Schedule</button>
        </div>
      `;
    }).join('');
  },

  // Authentication Functions
  checkAuth() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const currentUserName = localStorage.getItem('currentUser');
    
    if (!isLoggedIn || !currentUserName) {
      window.location.href = 'login.html';
      return false;
    }
    
    currentUser.name = currentUserName;
    this.updateUserDisplay();
    return true;
  },

  updateUserDisplay() {
    const profileUserElement = document.getElementById('profile-user-name');
    
    if (profileUserElement) {
      profileUserElement.textContent = currentUser.name;
    }
  },

  logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
  }
};

// Navigation Management
const navigation = {
  init() {
    if (elements.hamburger) {
      elements.hamburger.addEventListener('click', () => {
        elements.hamburger.classList.toggle('active');
        elements.navMenu.classList.toggle('active');
      });
    }

    elements.navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        
        elements.navLinks.forEach(l => l.classList.remove('active'));
        elements.pages.forEach(p => p.classList.remove('active'));
        
        link.classList.add('active');
        
        const targetPage = link.getAttribute('data-page');
        const page = document.getElementById(targetPage);
        if (page) page.classList.add('active');
      });
    });
  }
};

// Modal Management
const modal = {
  show(title) {
    elements.modalTitle.textContent = title;
    elements.modalOverlay.classList.add('active');
  },

  close() {
    elements.modalOverlay.classList.remove('active');
    if (elements.vehicleForm) elements.vehicleForm.reset();
  },

  showAddVehicle() { this.show('Add Vehicle'); },
  showAddService() { this.show('Add Service Record'); },
  showAddExpense() { this.show('Add Expense'); },
  showAddFuel() { this.show('Add Fuel Log'); },
  showAddMaintenance() { this.show('Add Maintenance Event'); },


};

// Action Handlers
const actions = {
  async editVehicle(vin) {
    utils.showNotification('Edit functionality coming soon!', 'info');
  },

  async viewVehicleDetails(vin) {
    const vehicle = appData.vehicles.find(v => v.vin === vin);
    if (vehicle) {
      utils.showNotification(`Viewing details for ${vehicle.make} ${vehicle.model}`, 'info');
    }
  },

  async editService(serviceId) {
    utils.showNotification('Edit functionality coming soon!', 'info');
  },

  async deleteService(serviceId) {
    if (confirm('Are you sure you want to delete this service record?')) {
        try {
        const response = await fetch(`${API_BASE}/services/${serviceId}`, { method: 'DELETE' });
            if (response.ok) {
          utils.showNotification('Service record deleted successfully!', 'success');
          await dataManager.loadAllData();
            } else {
          utils.showNotification('Error deleting service record.', 'error');
            }
        } catch (error) {
        utils.showNotification('Error deleting service record.', 'error');
      }
    }
  },

  async completeMaintenance(eventId) {
    utils.showNotification('Maintenance completed!', 'success');
  },

  async rescheduleMaintenance(eventId) {
    utils.showNotification('Reschedule functionality coming soon!', 'info');
  },


};

// Form Handlers
const formHandlers = {
  init() {
    this.initVehicleForm();
    this.initProfileForm();
    this.initMaintenanceTabs();
    this.initFilterHandlers();
    this.initSettingsHandlers();
  },

  initVehicleForm() {
    if (elements.vehicleForm) {
      elements.vehicleForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
        const formData = new FormData(elements.vehicleForm);
            const vehicleData = {
                make: formData.get('make'),
                model: formData.get('model'),
                year: parseInt(formData.get('year')),
                vin: formData.get('vin')
            };

            try {
          const result = await utils.postData('/vehicles', vehicleData);
                if (result) {
            utils.showNotification('Vehicle added successfully!', 'success');
            modal.close();
            await dataManager.loadAllData();
                }
            } catch (error) {
          utils.showNotification('Error adding vehicle.', 'error');
            }
        });
    }
  },

  initProfileForm() {
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(profileForm);
            const username = formData.get('username');
            const email = formData.get('email');
            const birthday = formData.get('birthday');
        
            const sql = `UPDATE Users SET username='${username}', email='${email}', birthday='${birthday}' WHERE user_id=1`;
            try {
                const response = await fetch('/api/query', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: sql })
                });
                const result = await response.json();
                if (result && !result.error) {
            utils.showNotification('Profile updated successfully!', 'success');
                } else {
            utils.showNotification('Error updating profile: ' + (result.error || 'Unknown error'), 'error');
                }
            } catch (error) {
          utils.showNotification('Error updating profile. Please try again.', 'error');
            }
        });
    }
  },

  initMaintenanceTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            const tabName = button.getAttribute('data-tab');
        utils.showNotification(`Switched to ${tabName} maintenance tab`, 'info');
        });
    });
  },

  initFilterHandlers() {
    const filterSelects = document.querySelectorAll('.filter-select');
    const filterDate = document.querySelector('.filter-date');
    
    filterSelects.forEach(select => {
        select.addEventListener('change', () => {
            const filterValue = select.value;
            if (filterValue) {
          utils.showNotification(`Filtered by: ${filterValue}`, 'info');
            }
        });
    });
    
    if (filterDate) {
        filterDate.addEventListener('change', () => {
            const dateValue = filterDate.value;
            if (dateValue) {
          utils.showNotification(`Filtered by date: ${dateValue}`, 'info');
            }
        });
    }
  },

  initSettingsHandlers() {
    const buttons = document.querySelectorAll('.setting-item .btn, .maintenance-actions .btn, .vehicle-actions .btn, .service-actions .btn');
    buttons.forEach(button => {
      button.addEventListener('click', () => {
        const text = button.textContent.toLowerCase();
        if (text.includes('complete')) {
          utils.showNotification('Maintenance completed successfully!', 'success');
        } else if (text.includes('edit')) {
          utils.showNotification('Edit functionality coming soon!', 'info');
        } else if (text.includes('delete')) {
          if (confirm('Are you sure you want to delete this item?')) {
            utils.showNotification('Item deleted successfully!', 'success');
          }
        } else if (text.includes('reschedule')) {
          utils.showNotification('Reschedule functionality coming soon!', 'info');
        } else if (text.includes('view details')) {
          utils.showNotification('View details functionality coming soon!', 'info');
        } else if (text.includes('change')) {
          utils.showNotification('Change password functionality coming soon!', 'info');
        } else if (text.includes('configure')) {
          utils.showNotification('Notification preferences coming soon!', 'info');
        }
      });
    });
  },


};

// Effects
const effects = {
  addHoverEffects() {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-5px)';
        card.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
        card.style.boxShadow = '';
        });
    });
}
};

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  // Check authentication first
  if (!dataManager.checkAuth()) {
    return; // Will redirect to login
  }
  
  navigation.init();
  formHandlers.init();
  effects.addHoverEffects();
  await dataManager.loadAllData();
});

// Export functions for global access
window.showAddVehicleModal = () => modal.showAddVehicle();
window.showAddServiceModal = () => modal.showAddService();
window.showAddExpenseModal = () => modal.showAddExpense();
window.showAddFuelModal = () => modal.showAddFuel();
window.showAddMaintenanceModal = () => modal.showAddMaintenance();
window.closeModal = () => modal.close();
window.editVehicle = (vin) => actions.editVehicle(vin);
window.viewVehicleDetails = (vin) => actions.viewVehicleDetails(vin);
window.editService = (serviceId) => actions.editService(serviceId);
window.deleteService = (serviceId) => actions.deleteService(serviceId);
window.completeMaintenance = (eventId) => actions.completeMaintenance(eventId);
window.rescheduleMaintenance = (eventId) => actions.rescheduleMaintenance(eventId);

// Authentication Functions
window.logout = () => dataManager.logout(); 