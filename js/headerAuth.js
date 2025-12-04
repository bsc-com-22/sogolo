import { getCurrentUser, logout } from './auth.js';
import { supabase } from './supabaseClient.js';

export async function initHeaderAuth() {
    try {
        const user = await getCurrentUser();

        if (user) {
            updateHeaderForUser(user);
        } else {
            updateHeaderForGuest();
        }
    } catch (error) {
        console.error('Error initializing header auth:', error);
        updateHeaderForGuest();
    }
}

function updateHeaderForUser(user) {
    const navActions = document.querySelector('.nav-actions');
    const mobileMenuContent = document.querySelector('.mobile-menu-content');
    const userAvatarBtn = document.getElementById('userAvatarBtn');

    // Get Avatar URL
    let avatarUrl = null;
    if (user.profile && user.profile.selfie_url) {
        const { data } = supabase.storage
            .from('kyc-documents')
            .getPublicUrl(user.profile.selfie_url);
        avatarUrl = data.publicUrl;
    }

    const initials = getInitials(user.profile?.full_name || user.email);

    // 1. Update Desktop Header
    if (navActions) {
        navActions.innerHTML = `
            <div class="user-menu-container">
                <a href="dashboard.html" class="user-avatar-link" title="Go to Dashboard">
                    ${avatarUrl
                ? `<img src="${avatarUrl}" alt="Profile" class="user-avatar-img">`
                : `<div class="user-avatar-placeholder">${initials}</div>`
            }
                </a>
                <div class="user-dropdown">
                    <a href="dashboard.html" class="dropdown-item">Dashboard</a>
                    <button id="headerLogoutBtn" class="dropdown-item">Logout</button>
                </div>
            </div>
        `;

        // Add logout listener
        const logoutBtn = document.getElementById('headerLogoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => logout());
        }
    }

    // 2. Update Mobile Avatar Button
    if (userAvatarBtn) {
        userAvatarBtn.classList.remove('hidden');
        if (avatarUrl) {
            userAvatarBtn.innerHTML = `<img src="${avatarUrl}" alt="Profile" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        } else {
            userAvatarBtn.textContent = initials;
        }
    }

    // 3. Update Avatar Dropdown Content
    const dropdownAvatar = document.getElementById('dropdownAvatar');
    const dropdownName = document.getElementById('dropdownUserName');
    const dropdownEmail = document.getElementById('dropdownUserEmail');

    if (dropdownAvatar) {
        if (avatarUrl) {
            dropdownAvatar.innerHTML = `<img src="${avatarUrl}" alt="Profile" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        } else {
            dropdownAvatar.textContent = initials;
        }
    }
    if (dropdownName) dropdownName.textContent = user.profile?.full_name || 'User';
    if (dropdownEmail) dropdownEmail.textContent = user.email;


    // 4. Update Mobile Menu (Hamburger Content)
    if (mobileMenuContent) {
        const mobileAuthContainer = mobileMenuContent.querySelector('.mobile-auth-container');
        if (mobileAuthContainer) {
            // When logged in, maybe we don't need the big auth buttons in the menu anymore?
            // Or we can keep them as "Dashboard" / "Logout"
            mobileAuthContainer.innerHTML = `
                <div class="mobile-user-profile">
                    <div class="mobile-avatar-container">
                        ${avatarUrl
                    ? `<img src="${avatarUrl}" alt="Profile" class="mobile-avatar-img">`
                    : `<div class="mobile-avatar-placeholder">${initials}</div>`
                }
                    </div>
                    <div class="mobile-user-info">
                        <span class="mobile-user-name">${user.profile?.full_name || 'User'}</span>
                        <span class="mobile-user-email">${user.email}</span>
                    </div>
                </div>
                <div class="mobile-auth-buttons">
                    <a href="dashboard.html" class="mobile-auth-btn primary">Dashboard</a>
                    <button id="mobileLogoutBtn" class="mobile-auth-btn secondary">Logout</button>
                </div>
            `;

            const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
            if (mobileLogoutBtn) {
                mobileLogoutBtn.addEventListener('click', () => logout());
            }
        }
    }
}

function updateHeaderForGuest() {
    const navActions = document.querySelector('.nav-actions');
    const mobileMenuContent = document.querySelector('.mobile-menu-content');
    const userAvatarBtn = document.getElementById('userAvatarBtn');

    // 1. Desktop
    if (navActions) {
        navActions.innerHTML = `
            <a href="signin.html" class="btn btn-login">Login</a>
            <a href="signup.html" class="btn btn-primary">Get Started</a>
        `;
    }

    // 2. Mobile Avatar Button - Hide it
    if (userAvatarBtn) {
        userAvatarBtn.classList.add('hidden');
    }

    // 3. Mobile Menu
    if (mobileMenuContent) {
        const mobileAuthContainer = mobileMenuContent.querySelector('.mobile-auth-container');
        if (mobileAuthContainer) {
            mobileAuthContainer.innerHTML = `
                <div class="mobile-auth-title">Get Started</div>
                <div class="mobile-auth-buttons">
                    <a href="signup.html" class="mobile-auth-btn primary">Sign Up</a>
                    <a href="signin.html" class="mobile-auth-btn secondary">Login</a>
                </div>
            `;
        }
    }
}

function getInitials(name) {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initHeaderAuth);
