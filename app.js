// Header scroll effect
window.addEventListener('scroll', function() {
    const header = document.getElementById('header');
    if (window.scrollY > 20) {
        header.classList.add('bg-white/80', 'backdrop-blur-lg', 'shadow-sm');
        header.classList.remove('bg-transparent');
    } else {
        header.classList.remove('bg-white/80', 'backdrop-blur-lg', 'shadow-sm');
        header.classList.add('bg-transparent');
    }
});

// Mobile menu toggle
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
const menuIcon = document.getElementById('menu-icon');
const closeIcon = document.getElementById('close-icon');

mobileMenuBtn.addEventListener('click', function() {
    mobileMenu.classList.toggle('active');
    menuIcon.classList.toggle('hidden');
    closeIcon.classList.toggle('hidden');
});

// Close mobile menu when clicking on a link
document.querySelectorAll('.mobile-link').forEach(link => {
    link.addEventListener('click', function() {
        mobileMenu.classList.remove('active');
        menuIcon.classList.remove('hidden');
        closeIcon.classList.add('hidden');
    });
});

// FAQ Accordion
function initFAQs() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach((item, index) => {
        const button = item.querySelector('.faq-button');
        const answer = item.querySelector('.faq-answer');
        const chevron = item.querySelector('.chevron');
        
        button.addEventListener('click', function() {
            // Close all other FAQs
            faqItems.forEach((otherItem, otherIndex) => {
                if (otherIndex !== index) {
                    const otherAnswer = otherItem.querySelector('.faq-answer');
                    const otherChevron = otherItem.querySelector('.chevron');
                    otherAnswer.classList.remove('active');
                    otherChevron.classList.remove('rotate');
                }
            });
            
            // Toggle current FAQ
            answer.classList.toggle('active');
            chevron.classList.toggle('rotate');
        });
    });
}

// Floating contact button
const floatingBtn = document.getElementById('floating-contact-btn');
const contactOptions = document.getElementById('contact-options');
const floatingContactIcon = document.getElementById('contact-icon');
const floatingCloseIcon = document.getElementById('close-icon');

if (floatingBtn && contactOptions && floatingContactIcon && floatingCloseIcon) {
    let isOpen = false;
    
    floatingBtn.addEventListener('click', function() {
        isOpen = !isOpen;
        
        if (isOpen) {
            // Show contact options
            contactOptions.classList.remove('opacity-0', 'invisible', 'translate-y-2');
            contactOptions.classList.add('opacity-100', 'visible', 'translate-y-0');
            
            // Switch icons
            floatingContactIcon.classList.add('hidden');
            floatingCloseIcon.classList.remove('hidden');
            
            // Rotate button
            floatingBtn.classList.add('rotate-45');
        } else {
            // Hide contact options
            contactOptions.classList.remove('opacity-100', 'visible', 'translate-y-0');
            contactOptions.classList.add('opacity-0', 'invisible', 'translate-y-2');
            
            // Switch icons back
            floatingContactIcon.classList.remove('hidden');
            floatingCloseIcon.classList.add('hidden');
            
            // Remove rotation
            floatingBtn.classList.remove('rotate-45');
        }
    });
    
    // Close when clicking outside
    document.addEventListener('click', function(e) {
        if (isOpen && !floatingBtn.contains(e.target) && !contactOptions.contains(e.target)) {
            isOpen = false;
            
            // Hide contact options
            contactOptions.classList.remove('opacity-100', 'visible', 'translate-y-0');
            contactOptions.classList.add('opacity-0', 'invisible', 'translate-y-2');
            
            // Switch icons back
            floatingContactIcon.classList.remove('hidden');
            floatingCloseIcon.classList.add('hidden');
            
            // Remove rotation
            floatingBtn.classList.remove('rotate-45');
        }
    });
}

// Contact form handling
const contactForm = document.getElementById('contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const formStatus = document.getElementById('form-status');
        const formData = new FormData(contactForm);
        
        // Validate
        const name = formData.get('name').trim();
        const email = formData.get('email').trim();
        const message = formData.get('message').trim();
        
        if (!name) {
            showFormStatus('error', 'Please enter your name');
            return;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            showFormStatus('error', 'Please enter a valid email address');
            return;
        }
        
        if (!message) {
            showFormStatus('error', 'Please enter your message');
            return;
        }
        
        if (message.length < 10) {
            showFormStatus('error', 'Message must be at least 10 characters long');
            return;
        }
        
        // Show loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <svg class="spinner h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span class="ml-2">Sending...</span>
        `;
        
        // Simulate form submission (replace with actual backend call)
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            showFormStatus('success', "Thank you! Your message has been sent successfully. We'll get back to you soon.");
            contactForm.reset();
        } catch (error) {
            showFormStatus('error', 'Something went wrong. Please try again or contact us directly.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `
                <svg class="w-5 h-5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                </svg>
                <span class="ml-2">Send Message</span>
            `;
        }
    });
}

function showFormStatus(type, message) {
    const formStatus = document.getElementById('form-status');
    if (!formStatus) return;
    
    formStatus.classList.remove('hidden', 'bg-green-50', 'text-green-800', 'border-green-200', 'bg-red-50', 'text-red-800', 'border-red-200');
    
    if (type === 'success') {
        formStatus.classList.add('bg-green-50', 'text-green-800', 'border-green-200');
    } else {
        formStatus.classList.add('bg-red-50', 'text-red-800', 'border-red-200');
    }
    
    formStatus.querySelector('p').textContent = message;
    formStatus.classList.remove('hidden');
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initFAQs();
    
    // Get current year for footer
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
});
