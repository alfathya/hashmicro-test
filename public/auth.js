const API_BASE_URL = process.env.API_BASE_URL;


function toggleForms() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    loginForm.classList.toggle('hidden');
    registerForm.classList.toggle('hidden');
    
    clearAlerts();
}

function showCharacterChecker() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const checkerForm = document.getElementById('character-checker-form');
    
    loginForm.classList.add('hidden');
    registerForm.classList.add('hidden');
    checkerForm.classList.remove('hidden');
    
    clearAlerts();
}

function showLogin() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const checkerForm = document.getElementById('character-checker-form');
    
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    checkerForm.classList.add('hidden');
    
    clearAlerts();
}

function showRegister() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const checkerForm = document.getElementById('character-checker-form');
    
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    checkerForm.classList.add('hidden');
    
    clearAlerts();
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

function clearAlerts() {
    document.getElementById('alert-container').innerHTML = '';
}

// Login Form Handler
document.addEventListener('DOMContentLoaded', function() {
    if (localStorage.getItem('token')) {
        window.location.href = '/dashboard';
        return;
    }
    
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const loginData = {
            email: formData.get('email'),
            password: formData.get('password')
        };
        
        try {
            const response = await fetch(`${API_BASE_URL}/user/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                localStorage.setItem('token', result.token);
                localStorage.setItem('user', JSON.stringify(result.user));
                showAlert('Login successful! Redirecting...', 'success');
                
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1500);
            } else {
                showAlert(result.message || 'Login failed');
            }
        } catch (error) {
            showAlert('Network error. Please try again.');
            console.error('Login error:', error);
        }
    });
    
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const registerData = {
            fullname: formData.get('fullname'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            nationality: formData.get('nationality'),
            dob: formData.get('dob'),
            department: formData.get('department'),
            position: formData.get('position'),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword')
        };
        
        if (registerData.password !== registerData.confirmPassword) {
            showAlert('Passwords do not match');
            return;
        }
        
        if (registerData.password.length < 8) {
            showAlert('Password must be at least 8 characters long');
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/user/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(registerData)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                showAlert('Registration successful! Please login.', 'success');
                setTimeout(() => {
                    toggleForms();
                    document.getElementById('registerForm').reset();
                }, 2000);
            } else {
                showAlert(result.message || 'Registration failed');
            }
        } catch (error) {
            showAlert('Network error. Please try again.');
            console.error('Registration error:', error);
        }
    });
    
    // Character Checker Form Handler - attach after DOM is loaded
    document.addEventListener('DOMContentLoaded', () => {
        const checkerForm = document.getElementById('characterCheckerForm');
        if (checkerForm) {
            checkerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData(e.target);
                const checkerData = {
                    input1: formData.get('input1'),
                    input2: formData.get('input2')
                };
                
                try {
                    const response = await fetch(`${API_BASE_URL}/api/character-check`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(checkerData)
                    });
                    
                    const result = await response.json();
                    
                    if (response.ok && result.success) {
                        displayCheckerResult(result.data);
                    } else {
                        showAlert(result.message || 'Character check failed');
                    }
                } catch (error) {
                    showAlert('Network error. Please try again.');
                    console.error('Character checker error:', error);
                }
            });
        }
    });
    
    // Fallback event delegation for dynamic forms
    document.addEventListener('submit', async (e) => {
        if (e.target.id === 'characterCheckerForm') {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const checkerData = {
                input1: formData.get('input1'),
                input2: formData.get('input2')
            };
            
            try {
                const response = await fetch(`${API_BASE_URL}/api/character-check`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(checkerData)
                });
                
                const result = await response.json();
                
                if (response.ok && result.success) {
                    displayCheckerResult(result.data);
                } else {
                    showAlert(result.message || 'Character check failed');
                }
            } catch (error) {
                showAlert('Network error. Please try again.');
                console.error('Character checker error:', error);
            }
        }
    });
});

function displayCheckerResult(data) {
    const resultDiv = document.getElementById('checker-result');
    const contentDiv = document.getElementById('result-content');
    
    contentDiv.innerHTML = `
        <div style="margin-bottom: 15px;">
            <strong>Input 1:</strong> "${data.input1}"<br>
            <strong>Input 2:</strong> "${data.input2}"
        </div>
        <div style="margin-bottom: 15px;">
            <strong>Unique Characters in Input 1:</strong> ${data.uniqueCharactersInput1} (${data.uniqueCharactersList.join(', ')})
        </div>
        <div style="margin-bottom: 15px;">
            <strong>Matching Characters:</strong> ${data.matchingCharacters} (${data.matchedCharactersList.join(', ')})
        </div>
        <div style="padding: 15px; background: #e8f5e8; border-radius: 8px; border-left: 4px solid #28a745;">
            <strong style="color: #28a745; font-size: 1.2em;">Similarity: ${data.percentage}%</strong><br>
            <small style="color: #666;">Calculation: ${data.calculation}</small>
        </div>
    `;
    
    resultDiv.classList.remove('hidden');
}

window.toggleForms = toggleForms;
window.showCharacterChecker = showCharacterChecker;
window.showLogin = showLogin;
window.showRegister = showRegister;