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
    // Get Avatar URL
    let avatarUrl = null;
    if (user.profile && user.profile.selfie_url) {
        const { data } = supabase.storage
            .from('kyc-documents')
            .getPublicUrl(user.profile.selfie_url);
        avatarUrl = data.publicUrl;
    }

    const initials = getInitials(user.profile?.full_name || user.email);
    const isAdmin = user.profile?.role === 'admin';

    // 1. Hide Desktop Auth Buttons, Show Desktop Avatar
    const desktopAuthButtons = document.getElementById('desktopAuthButtons');
    const userAvatarContainer = document.getElementById('userAvatarContainer');

    if (desktopAuthButtons) desktopAuthButtons.style.display = 'none';
    if (userAvatarContainer) {
        userAvatarContainer.classList.remove('hidden');
        const desktopUserInitials = document.getElementById('desktopUserInitials');
        const desktopUserAvatarBtn = document.getElementById('desktopUserAvatarBtn');

        if (desktopUserInitials && !avatarUrl) {
            desktopUserInitials.textContent = initials;
        }
        if (desktopUserAvatarBtn && avatarUrl) {
            desktopUserAvatarBtn.innerHTML = `<img src="${avatarUrl}" alt="Profile" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        }
    }

    // 2. Show Mobile Avatar Button
    const mobileUserAvatarBtn = document.getElementById('userAvatarBtn');
    if (mobileUserAvatarBtn) {
        mobileUserAvatarBtn.classList.remove('hidden');
        const userInitials = document.getElementById('userInitials');

        if (userInitials && !avatarUrl) {
            userInitials.textContent = initials;
        }
        if (avatarUrl) {
            mobileUserAvatarBtn.innerHTML = `<img src="${avatarUrl}" alt="Profile" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
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

    // Update Dropdown Menu Items
    const dropdownMenu = document.querySelector('.avatar-dropdown-menu');
    if (dropdownMenu) {
        dropdownMenu.innerHTML = `
            <a href="dashboard.html" class="avatar-dropdown-item">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                Dashboard
            </a>
            ${isAdmin ? `
            <a href="admin-dashboard.html" class="avatar-dropdown-item">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                Admin Dashboard
            </a>
            ` : ''}
            <div class="avatar-dropdown-divider"></div>
            <button class="avatar-dropdown-item" id="dropdownLogoutBtn">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                Logout
            </button>
        `;

        const logoutBtn = document.getElementById('dropdownLogoutBtn');
        if (logoutBtn) logoutBtn.addEventListener('click', logout);
    }

    // 4. Update Mobile Menu Auth Container
    const mobileAuthContainer = document.querySelector('.mobile-auth-container');
    if (mobileAuthContainer) {
        mobileAuthContainer.innerHTML = `
            <div style="padding: 1.25rem 1.5rem; background: #f9fafb; border-bottom: 1px solid #f3f4f6; display: flex; align-items: center; gap: 0.875rem;">
                <div style="width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 18px; overflow: hidden; flex-shrink: 0;">
                    ${avatarUrl ? `<img src="${avatarUrl}" alt="Profile" style="width: 100%; height: 100%; object-fit: cover;">` : initials}
                </div>
                <div>
                    <h3 style="font-size: 1rem; font-weight: 600; color: #1f2937; margin: 0 0 0.25rem 0;">${user.profile?.full_name || 'User'}</h3>
                    <p style="font-size: 0.875rem; color: #6b7280; margin: 0;">${user.email}</p>
                </div>
            </div>
            <div class="mobile-nav-links">
                <a href="dashboard.html" class="mobile-nav-link">
                    <svg class="mobile-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                    </svg>
                    Dashboard
                </a>
                ${isAdmin ? `
                <a href="admin-dashboard.html" class="mobile-nav-link">
                    <svg class="mobile-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                    </svg>
                    Admin Dashboard
                </a>
                ` : ''}
                <div class="mobile-nav-divider"></div>
                <button id="mobileMenuLogoutBtn" class="mobile-nav-link" style="width: 100%; text-align: left; background: none; border: none; cursor: pointer; color: #ef4444;">
                    <svg class="mobile-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: #ef4444;">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                    </svg>
                    Logout
                </button>
            </div>
        `;

        const mobileMenuLogoutBtn = document.getElementById('mobileMenuLogoutBtn');
        if (mobileMenuLogoutBtn) {
            mobileMenuLogoutBtn.addEventListener('click', () => logout());
        }
    }
}

function updateHeaderForGuest() {
    // 1. Show Desktop Auth Buttons, Hide Desktop Avatar
    const desktopAuthButtons = document.getElementById('desktopAuthButtons');
    const userAvatarContainer = document.getElementById('userAvatarContainer');

    if (desktopAuthButtons) desktopAuthButtons.style.display = 'flex';
    if (userAvatarContainer) userAvatarContainer.classList.add('hidden');

    // 2. Hide Mobile Avatar Button
    const mobileUserAvatarBtn = document.getElementById('userAvatarBtn');
    if (mobileUserAvatarBtn) mobileUserAvatarBtn.classList.add('hidden');

    // 3. Reset Mobile Menu Auth Container to default
    const mobileAuthContainer = document.querySelector('.mobile-auth-container');
    if (mobileAuthContainer) {
        mobileAuthContainer.innerHTML = `
            <div class="mobile-auth-title">Get started with Sogolo</div>
            <div class="mobile-auth-buttons">
                <a href="signin.html#signupForm" class="mobile-auth-btn primary">Sign Up</a>
                <a href="signin.html#loginForm" class="mobile-auth-btn secondary">Login</a>
            </div>
        `;
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
