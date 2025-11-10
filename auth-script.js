// Supabase Initialization (CDN exposes createClient globally)
const supabase = createClient('https://nwmhyhbgrfexugpggupm.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53bWh5aGJncmZleHVncGdndXBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MjU5ODEsImV4cCI6MjA3ODMwMTk4MX0.YmtdcLLBvQS_gs7KRi3Y2JxCTj-sgNLPy5CiwsQZV-Q');

// Auth State Listener & Initial Load
supabase.auth.onAuthStateChange(async (event, session) => {
    // ... rest unchanged
});

// ... continue with checkSession() and the rest
// Supabase Initialization
const supabase = Supabase.createClient('https://nwmhyhbgrfexugpggupm.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53bWh5aGJncmZleHVncGdndXBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MjU5ODEsImV4cCI6MjA3ODMwMTk4MX0.YmtdcLLBvQS_gs7KRi3Y2JxCTj-sgNLPy5CiwsQZV-Q');

// Auth State Listener & Initial Load
supabase.auth.onAuthStateChange(async (event, session) => {
    const loginPage = document.getElementById('loginPage');
    const signupPage = document.getElementById('signupPage');
    
    if (event === 'SIGNED_IN' && session) {
        // Redirect to dashboard on sign-in
        window.location.href = 'dashboard.html';
    } else if (event === 'SIGNED_OUT') {
        // Show login by default
        loginPage.style.display = 'flex';
        signupPage.style.display = 'none';
    }
});

// Check session on page load
async function checkSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) console.error('Session check error:', error);
    if (session) {
        window.location.href = 'dashboard.html'; // Already signed in
    } else {
        document.getElementById('loginPage').style.display = 'flex';
        document.getElementById('signupPage').style.display = 'none';
    }
}
checkSession();

// Switch between Login and Signup pages
document.getElementById('signupLink').addEventListener('click', (e) => {
    e.preventDefault();
    switchToSignup();
});

document.getElementById('loginLink').addEventListener('click', (e) => {
    e.preventDefault();
    switchToLogin();
});

function switchToSignup() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('signupPage').style.display = 'flex';
}

function switchToLogin() {
    document.getElementById('signupPage').style.display = 'none';
    document.getElementById('loginPage').style.display = 'flex';
}

// Password toggle functionality (unchanged)
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

// Password strength indicator (unchanged)
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

// Updated Login Form Submission with Supabase
const loginForm = document.getElementById('loginForm');

if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;
        
        // Remove any existing messages
        const existingMessage = loginForm.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Basic validation (unchanged)
        if (!email || !password) {
            showMessage(loginForm, 'Please fill in all fields', 'error');
            return;
        }
        
        // Email validation
        if (!isValidEmail(email)) {
            showMessage(loginForm, 'Please enter a valid email address', 'error');
            return;
        }
        
        // Supabase Sign In
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
            options: {
                data: { rememberMe } // Optional: Store in session
            }
        });
        
        if (error) {
            showMessage(loginForm, error.message, 'error');
            console.error('Login error:', error);
        } else if (data.user) {
            showMessage(loginForm, 'Login successful! Redirecting...', 'success');
            // Listener handles redirect
        }
    });
}

// Updated Signup Form Submission with Supabase
const signupForm = document.getElementById('signupForm');

if (signupForm) {
    signupForm.addEventListener('submit', async function(e) {
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
        
        // Validation (unchanged)
        if (!firstName || !lastName || !email || !phone || !password || !confirmPassword) {
            showMessage(signupForm, 'Please fill in all fields', 'error');
            return;
        }
        
        if (!isValidEmail(email)) {
            showMessage(signupForm, 'Please enter a valid email address', 'error');
            return;
        }
        
        if (!isValidPhone(phone)) {
            showMessage(signupForm, 'Please enter a valid phone number', 'error');
            return;
        }
        
        if (password.length < 8) {
            showMessage(signupForm, 'Password must be at least 8 characters long', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            showMessage(signupForm, 'Passwords do not match', 'error');
            return;
        }
        
        if (!agreeTerms) {
            showMessage(signupForm, 'You must agree to the Terms of Service and Privacy Policy', 'error');
            return;
        }
        
        // Supabase Sign Up
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    first_name: firstName,
                    last_name: lastName,
                    phone: phone
                },
                emailRedirectTo: window.location.origin // Redirect after confirmation
            }
        });
        
        if (authError) {
            showMessage(signupForm, authError.message, 'error');
            console.error('Signup error:', authError);
        } else if (authData.user) {
            // Insert profile (if email confirmation is disabled, or handle post-confirmation)
            const { error: profileError } = await supabase.from('profiles').insert({
                id: authData.user.id,
                first_name: firstName,
                last_name: lastName,
                phone: phone
            });
            
            if (profileError) {
                console.error('Profile insert error:', profileError);
                // Still show success, but log error
            }
            
            showMessage(signupForm, 'Account created! Check your email to verify and login.', 'success');
            setTimeout(() => {
                switchToLogin();
                signupForm.reset();
            }, 2000);
        }
    });
}

// Helper functions (unchanged)
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

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 9;
}

// Social login button handlers (Supabase OAuth)
const socialButtons = document.querySelectorAll('.btn-social');

socialButtons.forEach(button => {
    button.addEventListener('click', async function() {
        const platform = this.textContent.includes('Facebook') ? 'facebook' : 'google';
        const { error } = await supabase.auth.signInWithOAuth({
            provider: platform,
            options: {
                redirectTo: window.location.origin + '/dashboard.html'
            }
        });
        if (error) {
            showMessage(this.closest('form'), error.message, 'error');
        }
    });
});

// Forgot password handler (Supabase)
const forgotPasswordLink = document.querySelector('.link-text[href="#"]');

if (forgotPasswordLink && forgotPasswordLink.textContent === 'Forgot Password?') {
    forgotPasswordLink.addEventListener('click', async function(e) {
        e.preventDefault();
        const email = prompt('Please enter your email address to reset your password:');
        
        if (email && isValidEmail(email)) {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/reset-password.html' // Create this page if needed
            });
            if (error) {
                alert('Error: ' + error.message);
            } else {
                alert(`A password reset link has been sent to ${email}`);
            }
        } else if (email) {
            alert('Please enter a valid email address');
        }
    });
}

// Terms and privacy policy links (unchanged)
const termsLinks = document.querySelectorAll('.checkbox-label .link-text');

termsLinks.forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const page = this.textContent;
        alert(`${page} would be displayed here. This should link to your actual policy pages.`);
    });
});

// Prevent form submission on Enter key (unchanged)
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.target.tagName !== 'BUTTON' && e.target.type !== 'submit') {
        if (e.target.tagName === 'TEXTAREA') return;
        
        const form = e.target.closest('form');
        if (form) {
            e.preventDefault();
            form.dispatchEvent(new Event('submit'));
        }
    }
});

// Add smooth transitions to messages (unchanged)
const style = document.createElement('style');
style.textContent = `
    .message {
        transition: opacity 0.3s ease, transform 0.3s ease;
    }
`;
document.head.appendChild(style);