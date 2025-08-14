const API_BASE_URL = 'http://localhost:3232';
let currentUser = null;

// Initialize profile page
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
        window.location.href = '/';
        return;
    }
    
    currentUser = JSON.parse(userData);
    
    // Load profile data
    loadProfile();
    
    // Setup form handler
    setupFormHandler();
    
    // Show welcome message
    showAlert(`Welcome to your profile, ${currentUser.fullname}!`, 'success');
});

function setupFormHandler() {
    document.getElementById('updateProfileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const updateData = {
            fullname: formData.get('fullname'),
            phone: formData.get('phone'),
            nationality: formData.get('nationality'),
            dob: formData.get('dob'),
            department: formData.get('department'),
            position: formData.get('position')
        };
        
        // Remove empty fields
        Object.keys(updateData).forEach(key => {
            if (!updateData[key]) {
                delete updateData[key];
            }
        });
        
        if (Object.keys(updateData).length === 0) {
            showAlert('Please fill at least one field to update');
            return;
        }
        
        await updateProfile(updateData);
    });
}

function showAlert(message, type = 'error') {
    const alertContainer = document.getElementById('alert-container');
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    alertContainer.innerHTML = '';
    alertContainer.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

async function loadProfile() {
    const token = localStorage.getItem('token');
    
    console.log('Token for load profile:', token);
    
    if (!token) {
        showAlert('No authentication token found. Please login again.');
        logout();
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/user/profile`, {
            method: 'GET',
            headers: {
                'accesstoken': token
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            const user = result.user;
            
            // Update profile title
            document.getElementById('profile-title').textContent = `${user.fullname}'s Profile`;
            
            // Update display info
            document.getElementById('display-fullname').textContent = user.fullname;
            document.getElementById('display-email').textContent = user.email;
            document.getElementById('display-role').textContent = user.role;
            document.getElementById('display-phone').textContent = user.phone || 'Not provided';
            document.getElementById('display-nationality').textContent = user.nationality || 'Not provided';
            document.getElementById('display-dob').textContent = user.dob ? new Date(user.dob).toLocaleDateString() : 'Not provided';
            document.getElementById('display-department').textContent = user.department || 'Not provided';
            document.getElementById('display-position').textContent = user.position || 'Not provided';
            
            // Pre-fill form fields
            document.getElementById('updateFullname').value = user.fullname || '';
            document.getElementById('updatePhone').value = user.phone || '';
            document.getElementById('updateNationality').value = user.nationality || '';
            document.getElementById('updateDepartment').value = user.department || '';
            document.getElementById('updatePosition').value = user.position || '';
            if (user.dob) {
                const date = new Date(user.dob);
                document.getElementById('updateDob').value = date.toISOString().split('T')[0];
            }
            
            // Update localStorage
            localStorage.setItem('user', JSON.stringify(user));
            currentUser = user;
        } else if (response.status === 401) {
            logout();
        } else {
            showAlert('Failed to load profile');
        }
    } catch (error) {
        showAlert('Network error. Please try again.');
        console.error('Profile load error:', error);
    }
}

async function updateProfile(updateData) {
    const token = localStorage.getItem('token');
    
    console.log('Token for update:', token);
    console.log('Update data:', updateData);
    
    if (!token) {
        showAlert('No authentication token found. Please login again.');
        logout();
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/user/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'accesstoken': token
            },
            body: JSON.stringify(updateData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showAlert('Profile updated successfully!', 'success');
            
            // Reload profile data
            setTimeout(() => {
                loadProfile();
            }, 1000);
        } else {
            showAlert(result.message || 'Failed to update profile');
        }
    } catch (error) {
        showAlert('Network error. Please try again.');
        console.error('Profile update error:', error);
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
}

// Make functions available globally
window.logout = logout;
window.loadProfile = loadProfile;