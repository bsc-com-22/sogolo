// Switch between Login and Signup pages
function switchToSignup() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('signupPage').style.display = 'flex';
}

function switchToLogin() {
    document.getElementById('signupPage').style.display = 'none';
    document.getElementById('loginPage').style.display = 'flex';
}

// Password toggle functionality
const togglePasswordButtons = document.querySelectorAll('.toggle-password');

togglePasswordButtons.forEach(button => {
    button.addEventListener('click', function() {
        const targetId = this.getAttribute('data-target');
        const passwordInput = document.getElementById(targetId);
        const eyeIcon = this.querySelector('.eye-icon');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            eyeIcon.innerHTML = `
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
            `;
        } else {
            passwordInput.type = 'password';
            eyeIcon.innerHTML = `
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
            `;
        }
    });
});

// Password strength indicator
const signupPassword = document.getElementById('signupPassword');
const passwordStrength = document.getElementById('passwordStrength');
const strengthBar = passwordStrength ? passwordStrength.querySelector('.strength-bar') : null;

if (signupPassword && passwordStrength && strengthBar) {
    signupPassword.addEventListener('input', function() {
        const password = this.value;
        
        if (password.length === 0) {
            passwordStrength.classList.remove('show');
            strengthBar.className = 'strength-bar';
            return;
        }
        
        passwordStrength.classList.add('show');
        
        let strength = 0;
        
        // Length check
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        
        // Contains lowercase and uppercase
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        
        // Contains numbers
        if (/\d/.test(password)) strength++;
        
        // Contains special characters
        if (/[^a-zA-Z0-9]/.test(password)) strength++;
        
        // Update strength bar
        strengthBar.className = 'strength-bar';
        
        if (strength <= 2) {
            strengthBar.classList.add('weak');
        } else if (strength <= 4) {
            strengthBar.classList.add('medium');
        } else {
            strengthBar.classList.add('strong');
        }
    });
}

// Login Form Submission
const loginForm = document.getElementById('loginForm');

if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;
        
        // Remove any existing messages
        const existingMessage = loginForm.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Basic validation
        if (!email || !password) {
            showMessage(loginForm, 'Please fill in all fields', 'error');
            return;
        }
        
        // Email validation
        if (!isValidEmail(email)) {
            showMessage(loginForm, 'Please enter a valid email address', 'error');
            return;
        }
        
        // Here you would typically send the data to a server
        console.log('Login attempt:', { email, password, rememberMe });
        
        // Show success message
        showMessage(loginForm, 'Login successful! Redirecting...', 'success');
        
        // Simulate redirect after 2 seconds
        setTimeout(() => {
            alert('Login successful! You would be redirected to the dashboard.');
            loginForm.reset();
        }, 2000);
    });
}

// Signup Form Submission
const signupForm = document.getElementById('signupForm');

if (signupForm) {
    signupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const email = document.getElementById('signupEmail').value;
        const phone = document.getElementById('phoneNumber').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const agreeTerms = document.getElementById('agreeTerms').checked;
        
        // Remove any existing messages
        const existingMessage = signupForm.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Validation
        if (!firstName || !lastName || !email || !phone || !password || !confirmPassword) {
            showMessage(signupForm, 'Please fill in all fields', 'error');
            return;
        }
        
        // Email validation
        if (!isValidEmail(email)) {
            showMessage(signupForm, 'Please enter a valid email address', 'error');
            return;
        }
        
        // Phone validation
        if (!isValidPhone(phone)) {
            showMessage(signupForm, 'Please enter a valid phone number', 'error');
            return;
        }
        
        // Password validation
        if (password.length < 8) {
            showMessage(signupForm, 'Password must be at least 8 characters long', 'error');
            return;
        }
        
        // Password match validation
        if (password !== confirmPassword) {
            showMessage(signupForm, 'Passwords do not match', 'error');
            return;
        }
        
        // Terms agreement validation
        if (!agreeTerms) {
            showMessage(signupForm, 'You must agree to the Terms of Service and Privacy Policy', 'error');
            return;
        }
        
        // Here you would typically send the data to a server
        console.log('Signup attempt:', { firstName, lastName, email, phone, password });
        
        // Show success message
        showMessage(signupForm, 'Account created successfully! Redirecting to login...', 'success');
        
        // Simulate redirect after 2 seconds
        setTimeout(() => {
            alert('Account created successfully! Please login with your credentials.');
            switchToLogin();
            signupForm.reset();
        }, 2000);
    });
}

// Helper function to show messages
function showMessage(form, message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    const icon = type === 'success' 
        ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
             <polyline points="22 4 12 14.01 9 11.01"></polyline>
           </svg>`
        : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <circle cx="12" cy="12" r="10"></circle>
             <line x1="12" y1="8" x2="12" y2="12"></line>
             <line x1="12" y1="16" x2="12.01" y2="16"></line>
           </svg>`;
    
    messageDiv.innerHTML = `${icon}<span>${message}</span>`;
    
    form.insertBefore(messageDiv, form.firstChild);
    
    // Remove message after 5 seconds
    setTimeout(() => {
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateY(-10px)';
        setTimeout(() => messageDiv.remove(), 300);
    }, 5000);
}

// Email validation helper
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Phone validation helper (basic)
function isValidPhone(phone) {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    // Check if it has at least 9 digits (adjust based on your requirements)
    return digits.length >= 9;
}

// Social login button handlers
const socialButtons = document.querySelectorAll('.btn-social');

socialButtons.forEach(button => {
    button.addEventListener('click', function() {
        const platform = this.textContent.includes('Facebook') ? 'Facebook' : 'Google';
        alert(`${platform} authentication would be handled here. This requires backend integration.`);
    });
});

// Forgot password handler
const forgotPasswordLink = document.querySelector('.link-text[href="#"]');

if (forgotPasswordLink && forgotPasswordLink.textContent === 'Forgot Password?') {
    forgotPasswordLink.addEventListener('click', function(e) {
        e.preventDefault();
        const email = prompt('Please enter your email address to reset your password:');
        
        if (email && isValidEmail(email)) {
            alert(`A password reset link has been sent to ${email}`);
        } else if (email) {
            alert('Please enter a valid email address');
        }
    });
}

// Terms and privacy policy links
const termsLinks = document.querySelectorAll('.checkbox-label .link-text');

termsLinks.forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const page = this.textContent;
        alert(`${page} would be displayed here. This should link to your actual policy pages.`);
    });
});

// Prevent form submission on Enter key in specific scenarios
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.target.tagName !== 'BUTTON' && e.target.type !== 'submit') {
        // Allow Enter in textareas
        if (e.target.tagName === 'TEXTAREA') return;
        
        // Submit the form if Enter is pressed in an input field
        const form = e.target.closest('form');
        if (form) {
            e.preventDefault();
            form.dispatchEvent(new Event('submit'));
        }
    }
});

// Add smooth transitions to messages
const style = document.createElement('style');
style.textContent = `
    .message {
        transition: opacity 0.3s ease, transform 0.3s ease;
    }
`;
document.head.appendChild(style);