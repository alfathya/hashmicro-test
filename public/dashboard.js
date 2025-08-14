// Dashboard JavaScript for Task Reports
let currentPage = 1;
let totalPages = 1;
let currentFilters = {};
let isEditMode = false;
let editingReportId = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    loadReports();
    loadEmployees();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Form submission
    document.getElementById('reportForm').addEventListener('submit', handleFormSubmit);
    
    // Filter changes
    document.getElementById('filter-department').addEventListener('change', loadReports);
    document.getElementById('filter-status').addEventListener('change', loadReports);
    document.getElementById('filter-priority').addEventListener('change', loadReports);
    
    // Modal close on outside click
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('reportModal');
        if (event.target === modal) {
            closeReportModal();
        }
    });
}

// Navigation functions
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('hidden');
        section.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionName + '-section');
    if (targetSection) {
        targetSection.classList.remove('hidden');
        targetSection.classList.add('active');
    }
    
    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    const activeLink = document.querySelector(`[onclick="showSection('${sectionName}')"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
}

function showReports() {
    showSection('reports');
    loadReports();
}

function showAnalytics() {
    showSection('analytics');
}

// Task Reports CRUD Functions
async function loadReports() {
    const loading = document.getElementById('reports-loading');
    const container = document.getElementById('reports-table-container');
    
    loading.classList.remove('hidden');
    
    try {
        // Get filter values
        const department = document.getElementById('filter-department').value;
        const status = document.getElementById('filter-status').value;
        const priority = document.getElementById('filter-priority').value;
        
        // Build query parameters
        const params = new URLSearchParams({
            page: currentPage,
            limit: 10
        });
        
        if (department) params.append('department', department);
        if (status) params.append('status', status);
        if (priority) params.append('priority', priority);
        
        const token = localStorage.getItem('token');
        const response = await fetch(`/task-reports?${params}`, {
            headers: {
                'accesstoken': token
            }
        });
        const data = await response.json();
        
        if (data.success) {
            displayReports(data.data.reports);
            updatePagination(data.data.pagination);
        } else {
            showAlert('Error loading reports: ' + data.message, 'error');
        }
    } catch (error) {
        console.error('Error loading reports:', error);
        showAlert('Error loading reports', 'error');
    } finally {
        loading.classList.add('hidden');
    }
}

function displayReports(reports) {
    const container = document.getElementById('reports-table-container');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = user.role === 'admin';
    
    if (!reports || reports.length === 0) {
        container.innerHTML = '<div class="no-data">No task reports found</div>';
        return;
    }
    
    let tableHTML = `
        <table class="reports-table">
            <thead>
                <tr>
                    <th>Task Title</th>
                    <th>Assigned To</th>
                    <th>Department</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Progress</th>
                    <th>Est. Hours</th>
                    <th>Actual Hours</th>

                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    reports.forEach(report => {
        const priorityClass = getPriorityClass(report.priority);
        const statusClass = getStatusClass(report.status);
        const progressBar = getProgressBar(report.progressPercentage);
        
        // Generate delete button only for admin
        const deleteButton = isAdmin ? `
                    <button class="btn-small btn-danger" onclick="deleteReport(${report.id})" title="Delete">
                        🗑️
                    </button>` : '';
        
        tableHTML += `
            <tr>
                <td><strong>${escapeHtml(report.taskTitle)}</strong></td>
                <td>${escapeHtml(report.employee?.fullname || 'N/A')}</td>
                <td>${escapeHtml(report.employee?.department || 'N/A')}</td>
                <td><span class="priority-badge ${priorityClass}">${report.priority}</span></td>
                <td><span class="status-badge ${statusClass}">${report.status.replace('_', ' ')}</span></td>
                <td>${progressBar}</td>
                <td>${report.estimatedHours}h</td>
                <td>${report.actualHours}h</td>

                <td class="actions">
                    <button class="btn-small btn-primary" onclick="editReport(${report.id})" title="Edit">
                        ✏️
                    </button>${deleteButton}
                </td>
            </tr>
        `;
    });
    
    tableHTML += '</tbody></table>';
    container.innerHTML = tableHTML;
}

function getPriorityClass(priority) {
    switch (priority) {
        case 'urgent': return 'priority-urgent';
        case 'high': return 'priority-high';
        case 'medium': return 'priority-medium';
        case 'low': return 'priority-low';
        default: return '';
    }
}

function getStatusClass(status) {
    switch (status) {
        case 'completed': return 'status-completed';
        case 'in_progress': return 'status-progress';
        case 'pending': return 'status-pending';
        case 'cancelled': return 'status-cancelled';
        default: return '';
    }
}

function getProgressBar(percentage) {
    const color = percentage >= 80 ? '#4CAF50' : percentage >= 50 ? '#FF9800' : '#f44336';
    return `
        <div class="progress-container">
            <div class="progress-bar" style="width: ${percentage}%; background-color: ${color};"></div>
            <span class="progress-text">${percentage}%</span>
        </div>
    `;
}

// Modal functions
function showCreateReportModal() {
    isEditMode = false;
    editingReportId = null;
    document.getElementById('modal-title').textContent = 'Create Task Report';
    document.getElementById('reportForm').reset();
    document.getElementById('report-id').value = '';
    
    // Set default dates
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    document.getElementById('start-date').value = today.toISOString().split('T')[0];
    document.getElementById('due-date').value = nextWeek.toISOString().split('T')[0];
    
    document.getElementById('reportModal').style.display = 'block';
}

function closeReportModal() {
    document.getElementById('reportModal').style.display = 'none';
    document.getElementById('reportForm').reset();
    isEditMode = false;
    editingReportId = null;
}

async function editReport(reportId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/task-reports/${reportId}`, {
          headers: {
            accesstoken: token,
          },
        });
        const data = await response.json();
        
        if (data.success) {
            const report = data.data;
            isEditMode = true;
            editingReportId = reportId;
            
            document.getElementById('modal-title').textContent = 'Edit Task Report';
            document.getElementById('report-id').value = report.id;
            document.getElementById('employee-id').value = report.employeeId;
            document.getElementById('task-title').value = report.taskTitle;
            document.getElementById('task-description').value = report.taskDescription;
            document.getElementById('department').value = report.department;
            document.getElementById('task-priority').value = report.priority;
            document.getElementById('task-status').value = report.status;
            
            // Format dates for input fields (convert from ISO to YYYY-MM-DD)
            if (report.startDate) {
                const startDate = new Date(report.startDate);
                document.getElementById('start-date').value = startDate.toISOString().split('T')[0];
            }
            if (report.dueDate) {
                const dueDate = new Date(report.dueDate);
                document.getElementById('due-date').value = dueDate.toISOString().split('T')[0];
            }
            
            document.getElementById('estimated-hours').value = report.estimatedHours;
            document.getElementById('actual-hours').value = report.actualHours;
            document.getElementById('progress-percentage').value = report.progressPercentage;

            
            document.getElementById('reportModal').style.display = 'block';
        } else {
            showAlert('Error loading report: ' + data.message, 'error');
        }
    } catch (error) {
        console.error('Error loading report:', error);
        showAlert('Error loading report', 'error');
    }
}

async function deleteReport(reportId) {
    if (!confirm('Are you sure you want to delete this task report?')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/task-reports/${reportId}`, {
          method: "DELETE",
          headers: {
            accesstoken: token,
          },
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('Task report deleted successfully', 'success');
            loadReports();
        } else {
            showAlert('Error deleting report: ' + data.message, 'error');
        }
    } catch (error) {
        console.error('Error deleting report:', error);
        showAlert('Error deleting report', 'error');
    }
}

// Form submission
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const formData = {
        employeeId: parseInt(document.getElementById('employee-id').value),
        taskTitle: document.getElementById('task-title').value,
        taskDescription: document.getElementById('task-description').value,
        department: document.getElementById('department').value,
        priority: document.getElementById('task-priority').value,
        status: document.getElementById('task-status').value,
        startDate: document.getElementById('start-date').value,
        dueDate: document.getElementById('due-date').value,
        estimatedHours: parseFloat(document.getElementById('estimated-hours').value),
        actualHours: parseFloat(document.getElementById('actual-hours').value),
        progressPercentage: parseInt(document.getElementById('progress-percentage').value),

    };
    
    try {
        let response;
        if (isEditMode) {
            const token = localStorage.getItem('token');
            response = await fetch(`/task-reports/${editingReportId}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                accesstoken: token,
              },
              body: JSON.stringify(formData),
            });
        } else {
            const token = localStorage.getItem('token');
            response = await fetch("/task-reports", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                accesstoken: token,
              },
              body: JSON.stringify(formData),
            });
        }
        
        const data = await response.json();
        
        if (data.success) {
            showAlert(`Task report ${isEditMode ? 'updated' : 'created'} successfully`, 'success');
            closeReportModal();
            loadReports();
        } else {
            showAlert(`Error ${isEditMode ? 'updating' : 'creating'} report: ` + data.message, 'error');
        }
    } catch (error) {
        console.error('Error submitting form:', error);
        showAlert(`Error ${isEditMode ? 'updating' : 'creating'} report`, 'error');
    }
}

// Analytics functions
async function loadAnalytics() {
    const loading = document.getElementById('analytics-loading');
    const container = document.getElementById('analytics-content');
    
    loading.classList.remove('hidden');
    
    try {
        const startDate = document.getElementById('analytics-start-date').value;
        const endDate = document.getElementById('analytics-end-date').value;
        const department = document.getElementById('analytics-department').value;
        
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (department) params.append('department', department);
        
        const token = localStorage.getItem('token');
        const response = await fetch(`/task-reports/analytics/data?${params}`, {
          headers: {
            accesstoken: token,
          },
        });
        const data = await response.json();
        
        if (data.success) {
            displayAnalytics(data.data);
        } else {
            showAlert('Error loading analytics: ' + data.message, 'error');
        }
    } catch (error) {
        console.error('Error loading analytics:', error);
        showAlert('Error loading analytics', 'error');
    } finally {
        loading.classList.add('hidden');
    }
}

function displayAnalytics(analytics) {
    const container = document.getElementById('analytics-content');
    
    let html = `
        <div class="analytics-grid">
            <div class="analytics-card">
                <h3>📊 Overall Statistics</h3>
                <div class="stat-item">
                    <span class="stat-label">Total Tasks:</span>
                    <span class="stat-value">${analytics.totalTasks}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Completed Tasks:</span>
                    <span class="stat-value">${analytics.completedTasks}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Completion Rate:</span>
                    <span class="stat-value">${analytics.completionRate.toFixed(1)}%</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Avg Efficiency:</span>
                    <span class="stat-value">${analytics.averageEfficiency.toFixed(1)}%</span>
                </div>
            </div>
            
            <div class="analytics-card">
                <h3>⏱️ Time Analysis</h3>
                <div class="stat-item">
                    <span class="stat-label">Total Estimated Hours:</span>
                    <span class="stat-value">${analytics.totalEstimatedHours}h</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Total Actual Hours:</span>
                    <span class="stat-value">${analytics.totalActualHours}h</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Time Variance:</span>
                    <span class="stat-value ${analytics.timeVariance >= 0 ? 'positive' : 'negative'}">
                        ${analytics.timeVariance >= 0 ? '+' : ''}${analytics.timeVariance.toFixed(1)}h
                    </span>
                </div>
            </div>
        </div>
        
        <div class="analytics-grid">
            <div class="analytics-card">
                <h3>🏢 Department Analysis</h3>
                <div class="department-stats">
    `;
    
    Object.entries(analytics.departmentStats).forEach(([dept, stats]) => {
        html += `
            <div class="dept-stat">
                <h4>${dept}</h4>
                <div class="dept-details">
                    <span>Tasks: ${stats.totalTasks}</span>
                    <span>Completed: ${stats.completedTasks}</span>
                    <span>Rate: ${stats.completionRate.toFixed(1)}%</span>

                </div>
            </div>
        `;
    });
    
    html += `
                </div>
            </div>
            
            <div class="analytics-card">
                <h3>📈 Priority Analysis</h3>
                <div class="priority-stats">
    `;
    
    Object.entries(analytics.priorityStats).forEach(([priority, stats]) => {
        html += `
            <div class="priority-stat">
                <span class="priority-badge ${getPriorityClass(priority)}">${priority}</span>
                <div class="priority-details">
                    <span>Count: ${stats.count}</span>
                    <span>Completed: ${stats.completed}</span>
                    <span>Rate: ${stats.completionRate.toFixed(1)}%</span>
                </div>
            </div>
        `;
    });
    
    html += `
                </div>
            </div>
        </div>
        
        <div class="analytics-card full-width">
            <h3>👥 Top Performers</h3>
            <div class="performers-list">
    `;
    
    analytics.topPerformers.forEach((performer, index) => {
        html += `
            <div class="performer-item">
                <span class="rank">#${index + 1}</span>
                <span class="name">${performer.name}</span>
                <span class="department">${performer.department}</span>
                <span class="tasks">${performer.completedTasks} tasks</span>
                <span class="efficiency">${performer.efficiency.toFixed(1)}% efficiency</span>
            </div>
        `;
    });
    
    html += `
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

// Utility functions
async function loadEmployees() {
    try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const select = document.getElementById('employee-id');
        
        if (user.role === 'employee') {
            const response = await fetch('/user/profile', {
                headers: {
                    'accesstoken': token
                }
            });
            const data = await response.json();
            
            if (data) {
                const profile = data.user;
                select.innerHTML = `<option value="${profile.id}" selected>${profile.fullname} (${profile.department || 'N/A'})</option>`;
                select.disabled = true;
            } else {
                // Fallback to localStorage data if API fails
                select.innerHTML = `<option value="${user.id}" selected>${user.fullname} (${user.department || 'N/A'})</option>`;
                select.disabled = true;
            }
        } else {
            // For admin, load all employees
            const response = await fetch('/user/all', {
                headers: {
                    'accesstoken': token
                }
            });
            const data = await response.json();
            
            if (data.success) {
                select.innerHTML = '<option value="">Select Employee</option>';
                select.disabled = false;
                
                data.data.forEach(employee => {
                    const option = document.createElement('option');
                    option.value = employee.id;
                    option.textContent = `${employee.fullname} (${employee.department || 'N/A'})`;
                    select.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error loading employees:', error);
        // Fallback for employee role if API fails
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.role === 'employee') {
            const select = document.getElementById('employee-id');
            select.innerHTML = `<option value="${user.id}" selected>${user.fullname} (${user.department || 'N/A'})</option>`;
            select.disabled = true;
        }
    }
}

function updatePagination(pagination) {
    currentPage = pagination.currentPage;
    totalPages = pagination.totalPages;
    
    const container = document.getElementById('pagination-container');
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = '<div class="pagination">';
    
    // Previous button
    if (currentPage > 1) {
        html += `<button class="btn-page" onclick="changePage(${currentPage - 1})">← Previous</button>`;
    }
    
    // Page numbers
    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
        const activeClass = i === currentPage ? 'active' : '';
        html += `<button class="btn-page ${activeClass}" onclick="changePage(${i})">${i}</button>`;
    }
    
    // Next button
    if (currentPage < totalPages) {
        html += `<button class="btn-page" onclick="changePage(${currentPage + 1})">Next →</button>`;
    }
    
    html += '</div>';
    container.innerHTML = html;
}

function changePage(page) {
    currentPage = page;
    loadReports();
}

function showAlert(message, type = 'info') {
    const container = document.getElementById('alert-container');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    container.appendChild(alert);
    
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Character Checker functions
function showChecker() {
    showSection('checker');
}

async function calculatePercentage() {
    const input1 = document.getElementById('input1').value.trim();
    const input2 = document.getElementById('input2').value.trim();
    const resultDiv = document.getElementById('percentage-result');
    
    if (!input1 || !input2) {
        showAlert('Please fill in both input fields', 'error');
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/character-check', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'accesstoken': token
            },
            body: JSON.stringify({ input1, input2 })
        });
        
        const result = await response.json();
        
        if (result.success) {
            const data = result.data;
            resultDiv.innerHTML = `
                <div style="width: 100%; padding: 16px; background: #f8f9fa; border-radius: 8px; border: 1px solid #e9ecef;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                        <div style="padding: 16px; background: white; border-radius: 8px; border-left: 4px solid #667eea; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                            <div style="font-weight: 600; color: #2c3e50; margin-bottom: 8px; font-size: 14px;">Input 1</div>
                            <div style="font-family: monospace; background: #f8f9fa; padding: 12px; border-radius: 4px; word-break: break-all; font-size: 14px; min-height: 40px; display: flex; align-items: center;">"${escapeHtml(data.input1)}"</div>
                        </div>
                        <div style="padding: 16px; background: white; border-radius: 8px; border-left: 4px solid #667eea; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                            <div style="font-weight: 600; color: #2c3e50; margin-bottom: 8px; font-size: 14px;">Input 2</div>
                            <div style="font-family: monospace; background: #f8f9fa; padding: 12px; border-radius: 4px; word-break: break-all; font-size: 14px; min-height: 40px; display: flex; align-items: center;">"${escapeHtml(data.input2)}"</div>
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                        <div style="padding: 16px; background: white; border-radius: 8px; border-left: 4px solid #ffa502; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                            <div style="font-weight: 600; color: #2c3e50; margin-bottom: 8px; font-size: 14px;">Unique Characters</div>
                            <div style="font-size: 24px; font-weight: 700; color: #ffa502; margin-bottom: 6px;">${data.uniqueCharactersInput1}</div>
                            <div style="font-size: 12px; color: #6c757d; font-family: monospace;">(${data.uniqueCharactersList.join(', ')})</div>
                        </div>
                        <div style="padding: 16px; background: white; border-radius: 8px; border-left: 4px solid #26de81; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                            <div style="font-weight: 600; color: #2c3e50; margin-bottom: 8px; font-size: 14px;">Matching Characters</div>
                            <div style="font-size: 24px; font-weight: 700; color: #26de81; margin-bottom: 6px;">${data.matchingCharacters}</div>
                            <div style="font-size: 12px; color: #6c757d; font-family: monospace;">(${data.matchedCharactersList.join(', ')})</div>
                        </div>
                    </div>
                    
                    <div style="padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; text-align: center; color: white; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);">
                        <div style="font-size: 14px; opacity: 0.9; margin-bottom: 8px;">Similarity Result</div>
                        <div style="font-size: 32px; font-weight: 700; margin-bottom: 8px;">${data.percentage}%</div>
                        <div style="font-size: 12px; opacity: 0.8;">Calculation: ${data.calculation}</div>
                    </div>
                </div>
            `;
            resultDiv.classList.add('result-highlight');
        } else {
            showAlert('Error: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Character checker error:', error);
        showAlert('Network error. Please try again.', 'error');
    }
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
}