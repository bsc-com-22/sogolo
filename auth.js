// Authentication JavaScript for Login and Signup pages

document.addEventListener('DOMContentLoaded', function() {
    // Password visibility toggle
    const togglePassword = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('password');
    const eyeOpen = document.getElementById('eye-open');
    const eyeClosed = document.getElementById('eye-closed');

    if (togglePassword && passwordInput && eyeOpen && eyeClosed) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            eyeOpen.classList.toggle('hidden');
            eyeClosed.classList.toggle('hidden');
        });
    }

    // Login form handling
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const formData = new FormData(loginForm);
            
            const email = formData.get('email').trim();
            const password = formData.get('password').trim();
            
            // Basic validation
            if (!email || !password) {
                showAuthStatus('login-status', 'error', 'Please fill in all required fields');
                return;
            }
            
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showAuthStatus('login-status', 'error', 'Please enter a valid email address');
                return;
            }
            
            // Show loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = `
                <svg class="animate-spin h-5 w-5 text-white inline-block mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
            `;
            
            // Simulate login (replace with actual authentication)
            try {
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Simulate successful login
                showAuthStatus('login-status', 'success', 'Login successful! Redirecting to dashboard...');
                
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
                
            } catch (error) {
                showAuthStatus('login-status', 'error', 'Invalid email or password. Please try again.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = `
                    <span class="absolute left-0 inset-y-0 flex items-center pl-3">
                        <svg class="h-5 w-5 text-blue-500 group-hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                        </svg>
                    </span>
                    Sign in
                `;
            }
        });
    }

    // Signup form handling
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        const passwordField = signupForm.querySelector('#password');
        const confirmPasswordField = signupForm.querySelector('#confirm-password');
        
        // Password strength validation
        if (passwordField) {
            passwordField.addEventListener('input', function() {
                validatePasswordStrength(this.value);
            });
        }
        
        // Confirm password validation
        if (confirmPasswordField) {
            confirmPasswordField.addEventListener('input', function() {
                validatePasswordMatch();
            });
        }
        
        signupForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = signupForm.querySelector('button[type="submit"]');
            const formData = new FormData(signupForm);
            
            // Get form values
            const firstName = formData.get('first-name').trim();
            const lastName = formData.get('last-name').trim();
            const email = formData.get('email').trim();
            const phone = formData.get('phone').trim();
            const password = formData.get('password').trim();
            const confirmPassword = formData.get('confirm-password').trim();
            const userType = formData.get('user-type');
            const termsAccepted = formData.get('terms');
            
            // Validation
            if (!firstName || !lastName || !email || !phone || !password || !confirmPassword || !userType) {
                showAuthStatus('signup-status', 'error', 'Please fill in all required fields');
                return;
            }
            
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showAuthStatus('signup-status', 'error', 'Please enter a valid email address');
                return;
            }
            
            const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
            if (!phoneRegex.test(phone)) {
                showAuthStatus('signup-status', 'error', 'Please enter a valid phone number');
                return;
            }
            
            if (!isPasswordStrong(password)) {
                showAuthStatus('signup-status', 'error', 'Password does not meet strength requirements');
                return;
            }
            
            if (password !== confirmPassword) {
                showAuthStatus('signup-status', 'error', 'Passwords do not match');
                return;
            }
            
            if (!termsAccepted) {
                showAuthStatus('signup-status', 'error', 'Please accept the Terms of Service and Privacy Policy');
                return;
            }
            
            // Show loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = `
                <svg class="animate-spin h-5 w-5 text-white inline-block mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating account...
            `;
            
            // Simulate signup (replace with actual registration)
            try {
                await new Promise(resolve => setTimeout(resolve, 2500));
                
                showAuthStatus('signup-status', 'success', 'Account created successfully! Please check your email to verify your account.');
                
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
                
            } catch (error) {
                showAuthStatus('signup-status', 'error', 'Registration failed. Please try again or contact support.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = `
                    <span class="absolute left-0 inset-y-0 flex items-center pl-3">
                        <svg class="h-5 w-5 text-blue-500 group-hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
                        </svg>
                    </span>
                    Create account
                `;
            }
        });
    }
});

// Password strength validation
function validatePasswordStrength(password) {
    const lengthCheck = document.getElementById('length-check');
    const uppercaseCheck = document.getElementById('uppercase-check');
    const numberCheck = document.getElementById('number-check');
    
    if (!lengthCheck || !uppercaseCheck || !numberCheck) return;
    
    // Length check
    if (password.length >= 8) {
        lengthCheck.querySelector('svg').classList.remove('text-gray-400');
        lengthCheck.querySelector('svg').classList.add('text-green-500');
    } else {
        lengthCheck.querySelector('svg').classList.remove('text-green-500');
        lengthCheck.querySelector('svg').classList.add('text-gray-400');
    }
    
    // Uppercase check
    if (/[A-Z]/.test(password)) {
        uppercaseCheck.querySelector('svg').classList.remove('text-gray-400');
        uppercaseCheck.querySelector('svg').classList.add('text-green-500');
    } else {
        uppercaseCheck.querySelector('svg').classList.remove('text-green-500');
        uppercaseCheck.querySelector('svg').classList.add('text-gray-400');
    }
    
    // Number check
    if (/\d/.test(password)) {
        numberCheck.querySelector('svg').classList.remove('text-gray-400');
        numberCheck.querySelector('svg').classList.add('text-green-500');
    } else {
        numberCheck.querySelector('svg').classList.remove('text-green-500');
        numberCheck.querySelector('svg').classList.add('text-gray-400');
    }
}

// Check if password meets strength requirements
function isPasswordStrong(password) {
    return password.length >= 8 && /[A-Z]/.test(password) && /\d/.test(password);
}

// Validate password match
function validatePasswordMatch() {
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const confirmField = document.getElementById('confirm-password');
    
    if (confirmPassword && password !== confirmPassword) {
        confirmField.classList.remove('border-gray-300', 'focus:border-transparent');
        confirmField.classList.add('border-red-300', 'focus:border-red-500');
    } else if (confirmPassword) {
        confirmField.classList.remove('border-red-300', 'focus:border-red-500');
        confirmField.classList.add('border-gray-300', 'focus:border-transparent');
    }
}

// Show authentication status messages
function showAuthStatus(elementId, type, message) {
    const statusElement = document.getElementById(elementId);
    if (!statusElement) return;
    
    statusElement.classList.remove('hidden', 'bg-green-50', 'text-green-800', 'border-green-200', 'bg-red-50', 'text-red-800', 'border-red-200');
    
    if (type === 'success') {
        statusElement.classList.add('bg-green-50', 'text-green-800', 'border-green-200');
    } else {
        statusElement.classList.add('bg-red-50', 'text-red-800', 'border-red-200');
    }
    
    statusElement.querySelector('p').textContent = message;
    statusElement.classList.remove('hidden');
    
    // Auto-hide error messages after 5 seconds
    if (type === 'error') {
        setTimeout(() => {
            statusElement.classList.add('hidden');
        }, 5000);
    }
}
