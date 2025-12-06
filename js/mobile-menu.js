// Standardized Mobile Menu and Avatar Functionality
// This file provides consistent mobile menu and avatar dropdown behavior across all pages

class HeaderManager {
    constructor() {
        this.isInitialized = false;
        this.mobileMenuOpen = false;
        this.avatarDropdownOpen = false;
    }

    init() {
        if (this.isInitialized) return;

        this.setupGlobalListeners();
        this.isInitialized = true;
    }

    setupGlobalListeners() {
        document.addEventListener('click', (e) => {
            const target = e.target;

            // 1. Mobile Menu Toggle
            const mobileMenuBtn = target.closest('#mobileMenuBtn');
            if (mobileMenuBtn) {
                this.toggleMobileMenu();
                return;
            }

            // 2. Mobile Menu Close Button
            const mobileMenuClose = target.closest('#mobileMenuClose');
            if (mobileMenuClose) {
                this.closeMobileMenu();
                return;
            }

            // 3. Avatar Dropdown Toggle
            const avatarBtn = target.closest('.user-avatar-btn');
            if (avatarBtn) {
                e.stopPropagation();
                this.toggleAvatarDropdown(avatarBtn);
                return;
            }

            // 4. Close Mobile Menu when clicking a link inside it
            if (this.mobileMenuOpen && target.closest('.mobile-nav-link')) {
                this.closeMobileMenu();
                return;
            }

            // 5. Close Avatar Dropdown when clicking an item inside it
            if (this.avatarDropdownOpen && target.closest('.avatar-dropdown-item')) {
                this.closeAvatarDropdown();
                // Continue propagation so specific actions (like logout) can fire
            }

            // 6. Click Outside Handling
            this.handleClickOutside(e);
        });

        // Close menus on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeMobileMenu();
                this.closeAvatarDropdown();
            }
        });
    }

    handleClickOutside(e) {
        // Close mobile menu when clicking outside
        if (this.mobileMenuOpen) {
            const mobileMenu = document.getElementById('mobileMenu');
            const mobileMenuBtn = document.getElementById('mobileMenuBtn');

            if (mobileMenu && !mobileMenu.contains(e.target) && (!mobileMenuBtn || !mobileMenuBtn.contains(e.target))) {
                this.closeMobileMenu();
            }
        }

        // Close avatar dropdown when clicking outside
        if (this.avatarDropdownOpen) {
            const dropdowns = document.querySelectorAll('.avatar-dropdown');
            const avatarBtns = document.querySelectorAll('.user-avatar-btn');

            let clickedOutside = true;
            dropdowns.forEach(dropdown => {
                if (dropdown.contains(e.target)) clickedOutside = false;
            });
            avatarBtns.forEach(btn => {
                if (btn.contains(e.target)) clickedOutside = false;
            });

            if (clickedOutside) {
                this.closeAvatarDropdown();
            }
        }
    }

    toggleMobileMenu() {
        const mobileMenu = document.getElementById('mobileMenu');
        if (!mobileMenu) return;

        this.mobileMenuOpen = !this.mobileMenuOpen;

        if (this.mobileMenuOpen) {
            mobileMenu.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            mobileMenu.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    closeMobileMenu() {
        const mobileMenu = document.getElementById('mobileMenu');
        if (!mobileMenu || !this.mobileMenuOpen) return;

        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
        this.mobileMenuOpen = false;
    }

    toggleAvatarDropdown(btn) {
        // Find the target dropdown. 
        // If the button has a data-target, use that. Otherwise, try to find a generic one.
        // In the current HTML, desktop and mobile might share or have different dropdowns.
        // Let's assume a single dropdown structure for simplicity or find by ID.

        // Strategy: We will toggle ALL dropdowns found, or specific one if ID provided.
        // The previous code used data-target. Let's stick to that if present, or default to 'avatarDropdown'.

        const targetId = btn.dataset.target || 'avatarDropdown';
        const dropdown = document.getElementById(targetId);

        if (!dropdown) return;

        this.avatarDropdownOpen = !this.avatarDropdownOpen;

        // Close other dropdowns if any (though usually there's just one visible)
        document.querySelectorAll('.avatar-dropdown').forEach(d => {
            if (d !== dropdown) d.classList.remove('active');
        });

        if (this.avatarDropdownOpen) {
            dropdown.classList.add('active');

            // Positioning logic for desktop vs mobile
            // If it's the desktop button, align it nicely
            if (btn.id === 'desktopUserAvatarBtn') {
                const rect = btn.getBoundingClientRect();
                dropdown.style.top = `${rect.bottom + 10}px`;
                // Align right edge of dropdown with right edge of button
                // But dropdown is fixed/absolute? CSS says absolute.
                // If absolute relative to body/container, we might need to adjust.
                // The CSS says: top: calc(100% + 12px); right: 0; which implies it's inside a relative container.
                // Let's check if the button is inside a relative container.
                // The .user-avatar-container has position: relative in CSS.
                // So we don't need manual positioning if the HTML structure is correct.
            }
        } else {
            dropdown.classList.remove('active');
        }
    }

    closeAvatarDropdown() {
        document.querySelectorAll('.avatar-dropdown').forEach(dropdown => {
            dropdown.classList.remove('active');
        });
        this.avatarDropdownOpen = false;
    }
}

// Initialize header manager
const headerManager = new HeaderManager();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => headerManager.init());
} else {
    headerManager.init();
}

// Export for manual initialization if needed
export { headerManager };
export default headerManager;
