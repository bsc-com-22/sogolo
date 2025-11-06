// Sogolo.com Static Website JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functionality
    initHeader();
    initHeroSlider();
    initScrollAnimations();
    initContactForm();
    initSmoothScrolling();
    initMobileMenu();
    initFAQAccordion();
});

// Header functionality
function initHeader() {
    const header = document.getElementById('header');
    let lastScrollY = window.scrollY;

    function updateHeader() {
        const scrollY = window.scrollY;
        
        if (scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        lastScrollY = scrollY;
    }

    // Throttle scroll events for better performance
    let ticking = false;
    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(updateHeader);
            ticking = true;
        }
    }

    window.addEventListener('scroll', function() {
        ticking = false;
        requestTick();
    });

    // Initial check
    updateHeader();
}

// Hero slider functionality
function initHeroSlider() {
    const slides = document.querySelectorAll('.hero-slide');
    const indicators = document.querySelectorAll('.indicator');
    const prevBtn = document.querySelector('.slider-prev');
    const nextBtn = document.querySelector('.slider-next');
    const heroTitle = document.getElementById('hero-title');
    const heroDescription = document.getElementById('hero-description');
    
    let currentSlide = 0;
    const totalSlides = slides.length;
    
    // Hero messages for each slide
    const heroMessages = [
        {
            title: "Bridging Trust in Malawi's Social Media Market",
            description: "We verify products and services across social media to make online trade safer and more reliable."
        },
        {
            title: "Verified Sellers, Trusted Products",
            description: "Connect with authenticated sellers and discover quality products verified by our team."
        },
        {
            title: "Safe Transactions, Happy Customers",
            description: "Shop with confidence knowing every transaction is protected and every seller is verified."
        },
        {
            title: "Join Malawi's Trusted Marketplace",
            description: "Be part of a growing community of verified sellers and satisfied buyers across Malawi."
        }
    ];
    
    // Auto-slide interval
    let slideInterval = setInterval(nextSlide, 5000);
    
    function showSlide(index) {
        // Remove active class from all slides and indicators
        slides.forEach(slide => slide.classList.remove('active'));
        indicators.forEach(indicator => indicator.classList.remove('active'));
        
        // Add active class to current slide and indicator
        slides[index].classList.add('active');
        indicators[index].classList.add('active');
        
        // Update hero text with fade effect
        updateHeroText(heroMessages[index]);
        
        currentSlide = index;
    }
    
    function updateHeroText(message) {
        // Add fade out effect
        heroTitle.style.opacity = '0';
        heroDescription.style.opacity = '0';
        
        // Update text after fade out
        setTimeout(() => {
            heroTitle.textContent = message.title;
            heroDescription.textContent = message.description;
            
            // Add fade in effect
            heroTitle.style.opacity = '1';
            heroDescription.style.opacity = '1';
        }, 300);
    }
    
    function nextSlide() {
        const nextIndex = (currentSlide + 1) % totalSlides;
        showSlide(nextIndex);
    }
    
    function prevSlide() {
        const prevIndex = (currentSlide - 1 + totalSlides) % totalSlides;
        showSlide(prevIndex);
    }
    
    function goToSlide(index) {
        showSlide(index);
        // Reset auto-slide timer
        clearInterval(slideInterval);
        slideInterval = setInterval(nextSlide, 5000);
    }
    
    // Event listeners
    nextBtn.addEventListener('click', () => {
        nextSlide();
        clearInterval(slideInterval);
        slideInterval = setInterval(nextSlide, 5000);
    });
    
    prevBtn.addEventListener('click', () => {
        prevSlide();
        clearInterval(slideInterval);
        slideInterval = setInterval(nextSlide, 5000);
    });
    
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => goToSlide(index));
    });
    
    // Pause auto-slide on hover
    const heroSection = document.querySelector('.hero-section');
    heroSection.addEventListener('mouseenter', () => {
        clearInterval(slideInterval);
    });
    
    heroSection.addEventListener('mouseleave', () => {
        slideInterval = setInterval(nextSlide, 5000);
    });
}

// Mobile menu functionality - Place this at the end of body or in main.js
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileMenuLinks = document.querySelectorAll('.mobile-nav-link, .mobile-cta-button');
    
    if (mobileMenuBtn && mobileMenu) {
        // Toggle menu on button click
        mobileMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent event bubbling
            mobileMenu.classList.toggle('open');
            
            // Update button icon
            const menuIcon = this.querySelector('.menu-svg');
            if (mobileMenu.classList.contains('open')) {
                // Change to X icon
                menuIcon.innerHTML = `
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                `;
            } else {
                // Change back to menu icon
                menuIcon.innerHTML = `
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                `;
            }
        });
        
        // Close mobile menu when clicking on links
        mobileMenuLinks.forEach(link => {
            link.addEventListener('click', function() {
                mobileMenu.classList.remove('open');
                
                // Reset button icon
                const menuIcon = mobileMenuBtn.querySelector('.menu-svg');
                if (menuIcon) {
                    menuIcon.innerHTML = `
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    `;
                }
            });
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!mobileMenuBtn.contains(e.target) && !mobileMenu.contains(e.target)) {
                mobileMenu.classList.remove('open');
                
                // Reset button icon
                const menuIcon = mobileMenuBtn.querySelector('.menu-svg');
                if (menuIcon) {
                    menuIcon.innerHTML = `
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    `;
                }
            }
        });
    }
});