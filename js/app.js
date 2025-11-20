// Main Application JavaScript
// Global app initialization and common functionality

class SogoloApp {
    constructor() {
        this.isInitialized = false;
        this.currentUser = null;
        this.init();
    }

    async init() {
        try {
            console.log('Initializing Sogolo App...');
            
            // Initialize Supabase if not already done
            if (!window.supabaseClient && typeof initializeSupabase === 'function') {
                initializeSupabase();
            }

            // Wait for services to be ready
            await this.waitForServices();

            // Set up global event listeners
            this.setupGlobalEventListeners();

            // Initialize page-specific functionality
            this.initPageSpecific();

            this.isInitialized = true;
            console.log('Sogolo App initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Sogolo App:', error);
        }
    }

    async waitForServices() {
        let retries = 0;
        const maxRetries = 20;
        
        while (retries < maxRetries) {
            if (window.authService && 
                window.databaseService && 
                window.supabaseClient &&
                window.Helpers &&
                window.Storage &&
                window.Validation) {
                
                // Optional services (may not be loaded on all pages)
                if (typeof window.transactionService !== 'undefined') {
                    console.log('Transaction service loaded');
                }
                if (typeof window.notificationService !== 'undefined') {
                    console.log('Notification service loaded');
                }
                
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            retries++;
        }
        
        if (retries >= maxRetries) {
            throw new Error('Core services not available after waiting');
        }
    }

    setupGlobalEventListeners() {
        // Handle authentication state changes globally
        if (window.authService) {
            window.authService.onAuthStateChange((event, session) => {
                console.log('Auth state changed:', event, session);
                this.handleAuthStateChange(event, session);
            });
        }

        // Global error handler
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            if (window.Helpers) {
                Helpers.showToast('An unexpected error occurred', 'error');
            }
        });

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            event.preventDefault();
        });
    }

    handleAuthStateChange(event, session) {
        const currentPath = window.location.pathname;
        
        switch (event) {
            case 'SIGNED_IN':
                this.currentUser = session?.user || null;
                console.log('User signed in:', this.currentUser?.email);
                
                // Redirect to dashboard if on signin page
                if (currentPath.includes('signin.html')) {
                    window.location.href = 'dashboard.html';
                }
                break;
                
            case 'SIGNED_OUT':
                this.currentUser = null;
                console.log('User signed out');
                
                // Redirect to home if on protected pages
                if (currentPath.includes('dashboard.html')) {
                    window.location.href = 'index.html';
                }
                break;
                
            case 'TOKEN_REFRESHED':
                console.log('Token refreshed');
                break;
        }
    }

    initPageSpecific() {
        const currentPage = this.getCurrentPage();
        
        switch (currentPage) {
            case 'index':
                this.initHomePage();
                break;
            case 'signin':
                this.initSigninPage();
                break;
            case 'dashboard':
                this.initDashboardPage();
                break;
            case 'support':
                this.initSupportPage();
                break;
        }
    }

    getCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('signin.html')) return 'signin';
        if (path.includes('dashboard.html')) return 'dashboard';
        if (path.includes('support.html')) return 'support';
        if (path.includes('kyc.html')) return 'kyc';
        return 'index';
    }

    initHomePage() {
        console.log('Initializing home page...');
        
        // Check if user is already authenticated
        if (window.authService) {
            window.authService.getCurrentUser().then(result => {
                if (result.success && result.user) {
                    // Could update header to show user info
                    console.log('User already authenticated on home page');
                }
            });
        }
    }

    initSigninPage() {
        console.log('Initializing signin page...');
        
        // Check if user is already authenticated
        if (window.authService) {
            window.authService.getCurrentUser().then(result => {
                if (result.success && result.user) {
                    console.log('User already authenticated, redirecting to dashboard');
                    window.location.href = 'dashboard.html';
                }
            });
        }
    }

    initDashboardPage() {
        console.log('Initializing dashboard page...');
        // Dashboard initialization is handled in dashboard.html
    }

    initSupportPage() {
        console.log('Initializing support page...');
        this.initContactForm();
    }

    initContactForm() {
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleContactFormSubmit(e);
            });
        }
    }

    async handleContactFormSubmit(event) {
        const formData = new FormData(event.target);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            subject: formData.get('subject'),
            message: formData.get('message'),
            created_at: new Date().toISOString()
        };

        try {
            // Here you could save to a support_tickets table
            console.log('Contact form submitted:', data);
            
            if (window.Helpers) {
                Helpers.showToast('Message sent successfully! We\'ll get back to you soon.', 'success');
            }
            
            event.target.reset();
        } catch (error) {
            console.error('Error submitting contact form:', error);
            if (window.Helpers) {
                Helpers.showToast('Failed to send message. Please try again.', 'error');
            }
        }
    }

    // Utility methods
    async getCurrentUser() {
        if (!window.authService) return null;
        
        const result = await window.authService.getCurrentUser();
        return result.success ? result.user : null;
    }

    async requireAuth(redirectTo = 'signin.html') {
        const user = await this.getCurrentUser();
        if (!user) {
            window.location.href = redirectTo;
            return false;
        }
        return true;
    }

    formatCurrency(amount, currency = 'MWK') {
        return new Intl.NumberFormat('en-MW', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0
        }).format(amount);
    }

    formatDate(date) {
        return new Date(date).toLocaleDateString('en-MW', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.sogoloApp = new SogoloApp();
});

// Make app available globally
window.SogoloApp = SogoloApp;