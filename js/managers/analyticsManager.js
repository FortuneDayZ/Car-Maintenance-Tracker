// Analytics Manager - Demonstrates Aggregate Functions and GROUP BY
const analyticsManager = {
    container: null,

    init: () => {
        analyticsManager.container = document.getElementById('analytics-container');
        analyticsManager.render();
    },

    render: async () => {
        // Check if user is authenticated
        if (!AuthManager.isAuthenticated) {
            analyticsManager.container.innerHTML = '<div class="alert alert-warning">Please log in to view analytics.</div>';
            return;
        }

        try {
            // Get analytics data based on user permissions
            const userId = AuthManager.currentUser.user_id;
            const isAdmin = AuthManager.isAdmin();

            // 1. Total Expenses by Category (SUM with GROUP BY)
            const expensesByCategory = await analyticsManager.getExpensesByCategory(userId, isAdmin);
            
            // 2. Average Service Cost by Vehicle (AVG with GROUP BY)
            const avgServiceCostByVehicle = await analyticsManager.getAvgServiceCostByVehicle(userId, isAdmin);
            
            // 3. Fuel Consumption Statistics (AVG, SUM with GROUP BY)
            const fuelStats = await analyticsManager.getFuelStatistics(userId, isAdmin);
            
            // 4. Service Count by Month (COUNT with GROUP BY)
            const serviceCountByMonth = await analyticsManager.getServiceCountByMonth(userId, isAdmin);
            
            // 5. Total Cost Summary (SUM with multiple joins)
            const totalCostSummary = await analyticsManager.getTotalCostSummary(userId, isAdmin);
            
            // 6. Maintenance Events by Status (COUNT with GROUP BY)
            const maintenanceByStatus = await analyticsManager.getMaintenanceByStatus(userId, isAdmin);

            const analyticsHTML = `
                <div class="row">
                    <div class="col-12">
                        <div class="d-flex justify-content-between align-items-center mb-4">
                            <h3>
                                <i class="fas fa-chart-line"></i> 
                                Fleet Performance Analytics
                                ${isAdmin ? '<span class="badge bg-danger">Admin View</span>' : '<span class="badge bg-success">User View</span>'}
                            </h3>
                            <div>
                                <button class="btn btn-success" onclick="analyticsManager.exportToCSV()">
                                    <i class="fas fa-download"></i> Export to CSV
                                </button>
                                <button class="btn btn-info" onclick="analyticsManager.exportDetailedCSV()">
                                    <i class="fas fa-file-csv"></i> Export Detailed Data
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Total Cost Summary -->
                <div class="row mb-4">
                    <div class="col-md-6 col-lg-3">
                        <div class="card bg-primary text-white">
                            <div class="card-body">
                                <h5 class="card-title">Total Expenses</h5>
                                <h3>${Utils.formatCurrency(totalCostSummary.totalExpenses)}</h3>
                                <small>All time</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6 col-lg-3">
                        <div class="card bg-success text-white">
                            <div class="card-body">
                                <h5 class="card-title">Total Fuel Cost</h5>
                                <h3>${Utils.formatCurrency(totalCostSummary.totalFuelCost)}</h3>
                                <small>All time</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6 col-lg-3">
                        <div class="card bg-info text-white">
                            <div class="card-body">
                                <h5 class="card-title">Total Service Cost</h5>
                                <h3>${Utils.formatCurrency(totalCostSummary.totalServiceCost)}</h3>
                                <small>All time</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6 col-lg-3">
                        <div class="card bg-warning text-white">
                            <div class="card-body">
                                <h5 class="card-title">Average Cost per Service</h5>
                                <h3>${Utils.formatCurrency(totalCostSummary.avgServiceCost)}</h3>
                                <small>Per service</small>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Charts Row -->
                <div class="row">
                    <!-- Expenses by Category -->
                    <div class="col-md-6 mb-4">
                        <div class="card">
                            <div class="card-header">
                                <h5><i class="fas fa-pie-chart"></i> Expenses by Category (SUM with GROUP BY)</h5>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>Category</th>
                                                <th>Total Amount</th>
                                                <th>Count</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${expensesByCategory.map(item => `
                                                <tr>
                                                    <td><span class="badge bg-secondary">${item.category}</span></td>
                                                    <td>${Utils.formatCurrency(item.total_amount)}</td>
                                                    <td>${item.count}</td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Average Service Cost by Vehicle -->
                    <div class="col-md-6 mb-4">
                        <div class="card">
                            <div class="card-header">
                                <h5><i class="fas fa-car"></i> Average Service Cost by Vehicle (AVG with GROUP BY)</h5>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>Vehicle</th>
                                                <th>Avg Cost</th>
                                                <th>Service Count</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${avgServiceCostByVehicle.map(item => `
                                                <tr>
                                                    <td>${item.vehicle_info}</td>
                                                    <td>${Utils.formatCurrency(item.avg_cost)}</td>
                                                    <td>${item.service_count}</td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Fuel Statistics -->
                <div class="row">
                    <div class="col-md-6 mb-4">
                        <div class="card">
                            <div class="card-header">
                                <h5><i class="fas fa-gas-pump"></i> Fuel Statistics (AVG, SUM with GROUP BY)</h5>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>Fuel Type</th>
                                                <th>Total Gallons</th>
                                                <th>Total Cost</th>
                                                <th>Avg Price/Gal</th>
                                                <th>Fill-ups</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${fuelStats.map(item => `
                                                <tr>
                                                    <td><span class="badge bg-info">${item.fuel_type}</span></td>
                                                    <td>${Number(item.total_gallons).toFixed(2)} gal</td>
                                                    <td>${Utils.formatCurrency(item.total_cost)}</td>
                                                    <td>${Utils.formatCurrency(item.avg_price_per_gallon)}</td>
                                                    <td>${item.fill_ups}</td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Service Count by Month -->
                    <div class="col-md-6 mb-4">
                        <div class="card">
                            <div class="card-header">
                                <h5><i class="fas fa-calendar"></i> Service Count by Month (COUNT with GROUP BY)</h5>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>Month</th>
                                                <th>Service Count</th>
                                                <th>Total Cost</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${serviceCountByMonth.map(item => `
                                                <tr>
                                                    <td>${item.month}</td>
                                                    <td><span class="badge bg-primary">${item.service_count}</span></td>
                                                    <td>${Utils.formatCurrency(item.total_cost)}</td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Maintenance Status -->
                <div class="row">
                    <div class="col-md-6 mb-4">
                        <div class="card">
                            <div class="card-header">
                                <h5><i class="fas fa-tools"></i> Maintenance Events by Status (COUNT with GROUP BY)</h5>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>Status</th>
                                                <th>Count</th>
                                                <th>Percentage</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${maintenanceByStatus.map(item => `
                                                <tr>
                                                    <td>
                                                        <span class="badge bg-${item.status === 'completed' ? 'success' : 
                                                                           item.status === 'pending' ? 'warning' : 'danger'}">
                                                            ${item.status}
                                                        </span>
                                                    </td>
                                                    <td>${item.count}</td>
                                                    <td>${item.percentage}%</td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>


                </div>
            `;
            
            analyticsManager.container.innerHTML = analyticsHTML;
        } catch (error) {
            console.error('Error loading analytics:', error);
            analyticsManager.container.innerHTML = `
                <div class="alert alert-danger">
                    <h4><i class="fas fa-exclamation-triangle"></i> Error Loading Analytics</h4>
                    <p>${error.message}</p>
                    <button class="btn btn-primary" onclick="analyticsManager.render()">
                        <i class="fas fa-sync"></i> Retry
                    </button>
                </div>
            `;
        }
    },

    // 1. SUM with GROUP BY - Expenses by Category
    getExpensesByCategory: async (userId, isAdmin) => {
        const userFilter = isAdmin ? '' : `JOIN Owns o ON e.vin = o.vin WHERE o.user_id = ${userId}`;
        
        const sql = `
            SELECT category, SUM(amount) as total_amount, COUNT(*) as count
            FROM Expenses e
            ${userFilter}
            GROUP BY category
            ORDER BY total_amount DESC
        `;
        
        return await Database.select(sql);
    },

    // 2. AVG with GROUP BY - Average Service Cost by Vehicle
    getAvgServiceCostByVehicle: async (userId, isAdmin) => {
        const userFilter = isAdmin ? '' : `JOIN Owns o ON sr.vin = o.vin WHERE o.user_id = ${userId}`;
        
        const sql = `
            SELECT CONCAT(v.year, ' ', v.make, ' ', v.model) as vehicle_info,
                   AVG(sr.cost) as avg_cost, COUNT(*) as service_count
            FROM ServiceRecords sr
            LEFT JOIN Vehicles v ON sr.vin = v.vin
            ${userFilter}
            GROUP BY sr.vin, v.make, v.model, v.year
            ORDER BY avg_cost DESC
        `;
        
        return await Database.select(sql);
    },

    // 3. AVG, SUM with GROUP BY - Fuel Statistics
    getFuelStatistics: async (userId, isAdmin) => {
        const userFilter = isAdmin ? '' : `JOIN Owns o ON fl.vin = o.vin WHERE o.user_id = ${userId}`;
        
        const sql = `
            SELECT fuel_type,
                   SUM(gallons) as total_gallons,
                   SUM(total_cost) as total_cost,
                   AVG(total_cost / gallons) as avg_price_per_gallon,
                   COUNT(*) as fill_ups
            FROM FuelLog fl
            ${userFilter}
            GROUP BY fuel_type
            ORDER BY total_cost DESC
        `;
        
        return await Database.select(sql);
    },

    // 4. COUNT with GROUP BY - Service Count by Month
    getServiceCountByMonth: async (userId, isAdmin) => {
        const userFilter = isAdmin ? '' : `JOIN Owns o ON sr.vin = o.vin WHERE o.user_id = ${userId}`;
        
        const sql = `
            SELECT DATE_FORMAT(service_date, '%Y-%m') as month,
                   COUNT(*) as service_count,
                   SUM(cost) as total_cost
            FROM ServiceRecords sr
            ${userFilter}
            GROUP BY DATE_FORMAT(service_date, '%Y-%m')
            ORDER BY month DESC
            LIMIT 12
        `;
        
        return await Database.select(sql);
    },

    // 5. SUM with multiple joins - Total Cost Summary
    getTotalCostSummary: async (userId, isAdmin) => {
        const userFilter = isAdmin ? '' : `JOIN Owns o ON e.vin = o.vin WHERE o.user_id = ${userId}`;
        const userFilterFuel = isAdmin ? '' : `JOIN Owns o ON fl.vin = o.vin WHERE o.user_id = ${userId}`;
        const userFilterService = isAdmin ? '' : `JOIN Owns o ON sr.vin = o.vin WHERE o.user_id = ${userId}`;
        
        // Total Expenses
        const expensesResult = await Database.select(`
            SELECT SUM(amount) as total_expenses
            FROM Expenses e
            ${userFilter}
        `);
        
        // Total Fuel Cost
        const fuelResult = await Database.select(`
            SELECT SUM(total_cost) as total_fuel_cost
            FROM FuelLog fl
            ${userFilterFuel}
        `);
        
        // Total Service Cost and Average
        const serviceResult = await Database.select(`
            SELECT SUM(cost) as total_service_cost, AVG(cost) as avg_service_cost
            FROM ServiceRecords sr
            ${userFilterService}
        `);
        
        return {
            totalExpenses: expensesResult[0]?.total_expenses || 0,
            totalFuelCost: fuelResult[0]?.total_fuel_cost || 0,
            totalServiceCost: serviceResult[0]?.total_service_cost || 0,
            avgServiceCost: serviceResult[0]?.avg_service_cost || 0
        };
    },

    // 6. COUNT with GROUP BY - Maintenance Events by Status
    getMaintenanceByStatus: async (userId, isAdmin) => {
        const userFilter = isAdmin ? '' : `JOIN Owns o ON me.vin = o.vin WHERE o.user_id = ${userId}`;
        
        try {
            // First get the total count for percentage calculation
            const totalCountResult = await Database.select(`
                SELECT COUNT(*) as total_count
                FROM MaintenanceEvents me
                ${userFilter}
            `);
            
            const totalCount = totalCountResult[0]?.total_count || 1; // Avoid division by zero
            
            // Then get the status breakdown
            const sql = `
                SELECT status,
                       COUNT(*) as count,
                       ROUND(COUNT(*) * 100.0 / ${totalCount}, 1) as percentage
                FROM MaintenanceEvents me
                ${userFilter}
                GROUP BY status
                ORDER BY count DESC
            `;
            
            return await Database.select(sql);
        } catch (error) {
            console.error('Error getting maintenance by status:', error);
            return [];
        }
    },

    // Export analytics summary to CSV
    exportToCSV: async () => {
        try {
            const userId = AuthManager.currentUser.user_id;
            const isAdmin = AuthManager.isAdmin();
            
            // Get all analytics data
            const expensesByCategory = await analyticsManager.getExpensesByCategory(userId, isAdmin);
            const avgServiceCostByVehicle = await analyticsManager.getAvgServiceCostByVehicle(userId, isAdmin);
            const fuelStats = await analyticsManager.getFuelStatistics(userId, isAdmin);
            const serviceCountByMonth = await analyticsManager.getServiceCountByMonth(userId, isAdmin);
            const totalCostSummary = await analyticsManager.getTotalCostSummary(userId, isAdmin);
            const maintenanceByStatus = await analyticsManager.getMaintenanceByStatus(userId, isAdmin);

            // Create CSV content
            let csvContent = 'Vehicle Management Analytics Report\n';
            csvContent += `Generated: ${new Date().toLocaleString()}\n`;
            csvContent += `User: ${AuthManager.currentUser.username}\n`;
            csvContent += `View: ${isAdmin ? 'Admin (All Data)' : 'User (Own Vehicles Only)'}\n\n`;

            // Summary Section
            csvContent += 'SUMMARY\n';
            csvContent += 'Metric,Value\n';
            csvContent += `Total Expenses,${Utils.formatCurrency(totalCostSummary.totalExpenses)}\n`;
            csvContent += `Total Fuel Cost,${Utils.formatCurrency(totalCostSummary.totalFuelCost)}\n`;
            csvContent += `Total Service Cost,${Utils.formatCurrency(totalCostSummary.totalServiceCost)}\n`;
            csvContent += `Average Service Cost,${Utils.formatCurrency(totalCostSummary.avgServiceCost)}\n\n`;

            // Expenses by Category
            csvContent += 'EXPENSES BY CATEGORY\n';
            csvContent += 'Category,Total Amount,Count\n';
            expensesByCategory.forEach(item => {
                csvContent += `${item.category},${Utils.formatCurrency(item.total_amount)},${item.count}\n`;
            });
            csvContent += '\n';

            // Average Service Cost by Vehicle
            csvContent += 'AVERAGE SERVICE COST BY VEHICLE\n';
            csvContent += 'Vehicle,Average Cost,Service Count\n';
            avgServiceCostByVehicle.forEach(item => {
                csvContent += `"${item.vehicle_info}",${Utils.formatCurrency(item.avg_cost)},${item.service_count}\n`;
            });
            csvContent += '\n';

            // Fuel Statistics
            csvContent += 'FUEL STATISTICS BY TYPE\n';
            csvContent += 'Fuel Type,Total Gallons,Total Cost,Avg Price/Gal,Fill-ups\n';
            fuelStats.forEach(item => {
                csvContent += `${item.fuel_type},${Number(item.total_gallons).toFixed(2)},${Utils.formatCurrency(item.total_cost)},${Utils.formatCurrency(item.avg_price_per_gallon)},${item.fill_ups}\n`;
            });
            csvContent += '\n';

            // Service Count by Month
            csvContent += 'SERVICE COUNT BY MONTH\n';
            csvContent += 'Month,Service Count,Total Cost\n';
            serviceCountByMonth.forEach(item => {
                csvContent += `${item.month},${item.service_count},${Utils.formatCurrency(item.total_cost)}\n`;
            });
            csvContent += '\n';

            // Maintenance by Status
            csvContent += 'MAINTENANCE EVENTS BY STATUS\n';
            csvContent += 'Status,Count,Percentage\n';
            maintenanceByStatus.forEach(item => {
                csvContent += `${item.status},${item.count},${item.percentage}%\n`;
            });

            // Download the CSV file
            analyticsManager.downloadCSV(csvContent, `vehicle_analytics_${AuthManager.currentUser.username}_${new Date().toISOString().split('T')[0]}.csv`);
            
            Utils.showAlert('Analytics data exported to CSV successfully!', 'success');
        } catch (error) {
            console.error('Error exporting analytics to CSV:', error);
            Utils.showAlert('Error exporting data: ' + error.message, 'danger');
        }
    },

    // Export detailed data to CSV
    exportDetailedCSV: async () => {
        try {
            const userId = AuthManager.currentUser.user_id;
            const isAdmin = AuthManager.isAdmin();
            
            // Get detailed data for each section
            const detailedData = await analyticsManager.getDetailedDataForExport(userId, isAdmin);
            
            // Create CSV content
            let csvContent = 'Vehicle Management Detailed Data Report\n';
            csvContent += `Generated: ${new Date().toLocaleString()}\n`;
            csvContent += `User: ${AuthManager.currentUser.username}\n`;
            csvContent += `View: ${isAdmin ? 'Admin (All Data)' : 'User (Own Vehicles Only)'}\n\n`;

            // Expenses Data
            csvContent += 'EXPENSES DETAILED DATA\n';
            csvContent += 'ID,Vehicle,Date,Category,Amount,Description\n';
            detailedData.expenses.forEach(expense => {
                const vehicle = expense.make && expense.model && expense.year ? 
                    `${expense.year} ${expense.make} ${expense.model}` : 'Unknown Vehicle';
                csvContent += `${expense.expense_id},"${vehicle}",${expense.date},${expense.category},${Utils.formatCurrency(expense.amount)},"${expense.description}"\n`;
            });
            csvContent += '\n';

            // Fuel Log Data
            csvContent += 'FUEL LOG DETAILED DATA\n';
            csvContent += 'ID,Vehicle,Date,Mileage,Gallons,Cost,Fuel Type\n';
            detailedData.fuelLogs.forEach(log => {
                const vehicle = log.make && log.model && log.year ? 
                    `${log.year} ${log.make} ${log.model}` : 'Unknown Vehicle';
                csvContent += `${log.fuel_log_id},"${vehicle}",${log.date_filled},${log.current_mileage},${log.gallons},${Utils.formatCurrency(log.total_cost)},${log.fuel_type}\n`;
            });
            csvContent += '\n';

            // Service Records Data
            csvContent += 'SERVICE RECORDS DETAILED DATA\n';
            csvContent += 'ID,Vehicle,Date,Mileage,Cost,Description\n';
            detailedData.serviceRecords.forEach(service => {
                const vehicle = service.make && service.model && service.year ? 
                    `${service.year} ${service.make} ${service.model}` : 'Unknown Vehicle';
                csvContent += `${service.service_id},"${vehicle}",${service.service_date},${service.current_mileage},${Utils.formatCurrency(service.cost)},"${service.description}"\n`;
            });
            csvContent += '\n';

            // Maintenance Events Data
            csvContent += 'MAINTENANCE EVENTS DETAILED DATA\n';
            csvContent += 'ID,Vehicle,User,Date,Mileage,Status,Description\n';
            detailedData.maintenanceEvents.forEach(event => {
                const vehicle = event.make && event.model && event.year ? 
                    `${event.year} ${event.make} ${event.model}` : 'Unknown Vehicle';
                csvContent += `${event.event_id},"${vehicle}",${event.username},${event.rec_date},${event.rec_mileage},${event.status},"${event.description}"\n`;
            });

            // Download the CSV file
            analyticsManager.downloadCSV(csvContent, `vehicle_detailed_data_${AuthManager.currentUser.username}_${new Date().toISOString().split('T')[0]}.csv`);
            
            Utils.showAlert('Detailed data exported to CSV successfully!', 'success');
        } catch (error) {
            console.error('Error exporting detailed data to CSV:', error);
            Utils.showAlert('Error exporting detailed data: ' + error.message, 'danger');
        }
    },

    // Get detailed data for export
    getDetailedDataForExport: async (userId, isAdmin) => {
        const userFilter = isAdmin ? '' : `JOIN Owns o ON e.vin = o.vin WHERE o.user_id = ${userId}`;
        const userFilterFuel = isAdmin ? '' : `JOIN Owns o ON fl.vin = o.vin WHERE o.user_id = ${userId}`;
        const userFilterService = isAdmin ? '' : `JOIN Owns o ON sr.vin = o.vin WHERE o.user_id = ${userId}`;
        const userFilterMaintenance = isAdmin ? '' : `WHERE me.user_id = ${userId}`;

        try {
            // Get detailed data for each section
            const expenses = await Database.select(`
                SELECT e.*, v.make, v.model, v.year 
                FROM Expenses e
                LEFT JOIN Vehicles v ON e.vin = v.vin
                ${userFilter}
                ORDER BY e.date DESC
            `);

            const fuelLogs = await Database.select(`
                SELECT fl.*, v.make, v.model, v.year 
                FROM FuelLog fl
                LEFT JOIN Vehicles v ON fl.vin = v.vin
                ${userFilterFuel}
                ORDER BY fl.date_filled DESC
            `);

            const serviceRecords = await Database.select(`
                SELECT sr.*, v.make, v.model, v.year 
                FROM ServiceRecords sr
                LEFT JOIN Vehicles v ON sr.vin = v.vin
                ${userFilterService}
                ORDER BY sr.service_date DESC
            `);

            const maintenanceEvents = await Database.select(`
                SELECT me.*, u.username, v.make, v.model, v.year 
                FROM MaintenanceEvents me
                LEFT JOIN Users u ON me.user_id = u.user_id
                LEFT JOIN Vehicles v ON me.vin = v.vin
                ${userFilterMaintenance}
                ORDER BY me.rec_date DESC
            `);

            return {
                expenses,
                fuelLogs,
                serviceRecords,
                maintenanceEvents
            };
        } catch (error) {
            console.error('Error getting detailed data for export:', error);
            throw error;
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