// Dashboard JavaScript functionality

document.addEventListener('DOMContentLoaded', function() {
    // User menu dropdown
    const userMenuBtn = document.getElementById('user-menu-btn');
    const userMenu = document.getElementById('user-menu');
    
    if (userMenuBtn && userMenu) {
        userMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            userMenu.classList.toggle('hidden');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!userMenuBtn.contains(e.target) && !userMenu.contains(e.target)) {
                userMenu.classList.add('hidden');
            }
        });
    }
    
    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });
    }
    
    // Quick action buttons
    const quickActionButtons = document.querySelectorAll('.grid button');
    quickActionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const actionText = this.querySelector('span').textContent;
            
            // Add click animation
            this.classList.add('scale-95');
            setTimeout(() => {
                this.classList.remove('scale-95');
            }, 150);
            
            // Handle different actions
            switch(actionText) {
                case 'New Listing':
                    showModal('Create New Listing', 'This would open the new listing form.');
                    break;
                case 'Browse Items':
                    showModal('Browse Items', 'This would navigate to the marketplace.');
                    break;
                case 'Messages':
                    showModal('Messages', 'This would open your message center.');
                    break;
                case 'Analytics':
                    showModal('Analytics', 'This would show detailed analytics and reports.');
                    break;
            }
        });
    });
    
    // Transaction items click handlers
    const transactionItems = document.querySelectorAll('.space-y-4 > div');
    transactionItems.forEach(item => {
        item.addEventListener('click', function() {
            const title = this.querySelector('.text-sm.font-medium.text-gray-900').textContent;
            const amount = this.querySelector('.text-sm.font-medium').textContent;
            showModal('Transaction Details', `Transaction: ${title}\nAmount: ${amount}`);
        });
    });
    
    // Message items click handlers
    const messageItems = document.querySelectorAll('.flex.items-start.space-x-4');
    messageItems.forEach(item => {
        item.addEventListener('click', function() {
            const sender = this.querySelector('.text-sm.font-medium.text-gray-900').textContent;
            const message = this.querySelector('.text-sm.text-gray-600').textContent;
            showModal('Message from ' + sender, message);
        });
    });
    
    // Stats animation on load
    animateStats();
    
    // Auto-refresh data every 30 seconds (simulate real-time updates)
    setInterval(updateDashboardData, 30000);
});

// Show modal function
function showModal(title, content) {
    // Create modal if it doesn't exist
    let modal = document.getElementById('dashboard-modal');
    if (!modal) {
        modal = createModal();
        document.body.appendChild(modal);
    }
    
    // Update modal content
    modal.querySelector('#modal-title').textContent = title;
    modal.querySelector('#modal-content').textContent = content;
    
    // Show modal
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    // Add animation
    setTimeout(() => {
        modal.querySelector('.bg-white').classList.add('scale-100');
        modal.querySelector('.bg-white').classList.remove('scale-95');
    }, 10);
}

// Create modal element
function createModal() {
    const modal = document.createElement('div');
    modal.id = 'dashboard-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50 p-4';
    
    modal.innerHTML = `
        <div class="bg-white rounded-xl p-6 max-w-md w-full transform scale-95 transition-transform duration-200">
            <div class="flex items-center justify-between mb-4">
                <h3 id="modal-title" class="text-lg font-semibold text-gray-900"></h3>
                <button id="close-modal" class="text-gray-400 hover:text-gray-600 transition-colors">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            <p id="modal-content" class="text-gray-600 mb-6 whitespace-pre-line"></p>
            <div class="flex justify-end space-x-3">
                <button id="modal-cancel" class="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors">Cancel</button>
                <button id="modal-confirm" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">OK</button>
            </div>
        </div>
    `;
    
    // Add event listeners
    modal.querySelector('#close-modal').addEventListener('click', closeModal);
    modal.querySelector('#modal-cancel').addEventListener('click', closeModal);
    modal.querySelector('#modal-confirm').addEventListener('click', closeModal);
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    return modal;
}

// Close modal function
function closeModal() {
    const modal = document.getElementById('dashboard-modal');
    if (modal) {
        modal.querySelector('.bg-white').classList.add('scale-95');
        modal.querySelector('.bg-white').classList.remove('scale-100');
        
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }, 200);
    }
}

// Animate stats on page load
function animateStats() {
    const statNumbers = document.querySelectorAll('.text-2xl.font-bold.text-gray-900');
    
    statNumbers.forEach((stat, index) => {
        const finalValue = stat.textContent;
        let currentValue = 0;
        let increment;
        
        // Determine increment based on final value
        if (finalValue.includes('MWK')) {
            const numValue = parseInt(finalValue.replace(/[^\d]/g, ''));
            increment = numValue / 50;
        } else if (finalValue.includes('%')) {
            const numValue = parseFloat(finalValue.replace('%', ''));
            increment = numValue / 50;
        } else {
            const numValue = parseInt(finalValue);
            increment = numValue / 50;
        }
        
        // Animate with delay for each stat
        setTimeout(() => {
            const timer = setInterval(() => {
                currentValue += increment;
                
                if (finalValue.includes('MWK')) {
                    if (currentValue >= parseInt(finalValue.replace(/[^\d]/g, ''))) {
                        stat.textContent = finalValue;
                        clearInterval(timer);
                    } else {
                        stat.textContent = `MWK ${Math.floor(currentValue).toLocaleString()}`;
                    }
                } else if (finalValue.includes('%')) {
                    if (currentValue >= parseFloat(finalValue.replace('%', ''))) {
                        stat.textContent = finalValue;
                        clearInterval(timer);
                    } else {
                        stat.textContent = `${currentValue.toFixed(1)}%`;
                    }
                } else {
                    if (currentValue >= parseInt(finalValue)) {
                        stat.textContent = finalValue;
                        clearInterval(timer);
                    } else {
                        stat.textContent = Math.floor(currentValue);
                    }
                }
            }, 20);
        }, index * 200);
    });
}

// Simulate real-time data updates
function updateDashboardData() {
    // Update notification count
    const notificationBadge = document.querySelector('.bg-red-500');
    if (notificationBadge) {
        const currentCount = parseInt(notificationBadge.textContent);
        const newCount = Math.max(0, currentCount + Math.floor(Math.random() * 3) - 1);
        notificationBadge.textContent = newCount;
        
        if (newCount === 0) {
            notificationBadge.classList.add('hidden');
        } else {
            notificationBadge.classList.remove('hidden');
        }
    }
    
    // Add subtle animation to indicate update
    const statsCards = document.querySelectorAll('.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4 > div');
    statsCards.forEach(card => {
        card.classList.add('animate-pulse');
        setTimeout(() => {
            card.classList.remove('animate-pulse');
        }, 1000);
    });
    
    console.log('Dashboard data updated at:', new Date().toLocaleTimeString());
}

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // ESC to close modal
    if (e.key === 'Escape') {
        closeModal();
    }
    
    // Ctrl/Cmd + N for new listing
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        showModal('New Listing', 'Keyboard shortcut: Ctrl/Cmd + N\nThis would open the new listing form.');
    }
    
    // Ctrl/Cmd + M for messages
    if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        showModal('Messages', 'Keyboard shortcut: Ctrl/Cmd + M\nThis would open your message center.');
    }
});

// Add smooth scrolling for any internal links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add loading states for buttons
document.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', function() {
        // Skip if it's a modal or menu button
        if (this.id === 'user-menu-btn' || this.id === 'mobile-menu-btn' || 
            this.id === 'close-modal' || this.id === 'modal-cancel' || this.id === 'modal-confirm') {
            return;
        }
        
        // Add loading state
        const originalContent = this.innerHTML;
        this.disabled = true;
        this.innerHTML = `
            <svg class="animate-spin h-4 w-4 text-current inline-block mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
        `;
        
        // Restore button after 1 second
        setTimeout(() => {
            this.disabled = false;
            this.innerHTML = originalContent;
        }, 1000);
    });
});
