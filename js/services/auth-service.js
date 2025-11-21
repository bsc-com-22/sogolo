// Authentication Service using Supabase
class AuthService {
    constructor() {
        this.supabase = window.supabaseClient;
    }

    // Sign up with email and password
    async signUp(email, password, userData = {}) {
        try {
            console.log('Attempting sign up for:', email);
            const { data, error } = await this.supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: userData, // Additional user metadata
                    emailRedirectTo: `${window.location.origin}/signin.html`
                }
            });

            if (error) {
                console.error('Supabase sign up error:', error);
                throw error;
            }
            
            console.log('Sign up successful:', data);
            return { success: true, data };
        } catch (error) {
            console.error('Sign up error:', error);
            return { success: false, error: error.message };
        }
    }

    // Sign in with email and password
    async signIn(email, password) {
        try {
            console.log('Attempting sign in for:', email);
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                console.error('Supabase sign in error:', error);
                throw error;
            }
            
            console.log('Sign in successful:', data);
            return { success: true, data };
        } catch (error) {
            console.error('Sign in error:', error);
            return { success: false, error: error.message };
        }
    }

    // Sign out
    async signOut() {
        try {
            const { error } = await this.supabase.auth.signOut();
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get current user
    async getCurrentUser() {
        try {
            const { data: { user }, error } = await this.supabase.auth.getUser();
            if (error) throw error;
            return { success: true, user };
        } catch (error) {
            console.error('Get user error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get current session
    async getSession() {
        try {
            const { data: { session }, error } = await this.supabase.auth.getSession();
            if (error) throw error;
            return { success: true, session };
        } catch (error) {
            console.error('Get session error:', error);
            return { success: false, error: error.message };
        }
    }

    // Reset password
    async resetPassword(email) {
        try {
            const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password.html`
            });
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Reset password error:', error);
            return { success: false, error: error.message };
        }
    }

    // Update user metadata (e.g., full_name, phone, avatar_url)
    async updateUserMetadata(updates) {
        try {
            const { data, error } = await this.supabase.auth.updateUser({
                data: updates
            });
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Update user metadata error:', error);
            return { success: false, error: error.message };
        }
    }

    // Listen to auth state changes
    onAuthStateChange(callback) {
        return this.supabase.auth.onAuthStateChange((event, session) => {
            callback(event, session);
        });
    }

    // OAuth sign in (Google, GitHub, etc.)
    async signInWithOAuth(provider) {
        try {
            const { data, error } = await this.supabase.auth.signInWithOAuth({
                provider: provider,
                options: {
                    redirectTo: `${window.location.origin}/dashboard.html`
                }
            });
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('OAuth sign in error:', error);
            return { success: false, error: error.message };
        }
    }
}

// Create global instance
window.authService = new AuthService();
