import { supabase } from './supabaseClient.js'

// Login with Email and Password
export async function loginWithEmail(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })
        if (error) console.error('Login error:', error)
        return { data, error }
    } catch (e) {
        console.error('Unexpected login exception:', e)
        return { data: null, error: e }
    }
}

// Login with Google
export async function loginWithGoogle() {
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/dashboard.html'
            }
        })
        if (error) console.error('Google login error:', error)
        return { data, error }
    } catch (e) {
        console.error('Unexpected Google login exception:', e)
        return { data: null, error: e }
    }
}

// Send Password Reset Email
export async function sendPasswordReset(email) {
    try {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password.html',
        })
        if (error) console.error('Password reset error:', error)
        return { data, error }
    } catch (e) {
        console.error('Unexpected password reset exception:', e)
        return { data: null, error: e }
    }
}

// Logout
export async function logout() {
    const { error } = await supabase.auth.signOut()
    if (error) {
        console.error('Error logging out:', error)
    } else {
        window.location.href = '/signin.html'
    }
}

// Sign Up
export async function signUp(email, password, fullName) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
            },
        })
        if (error) console.error('Sign up error:', error)
        return { data, error }
    } catch (e) {
        console.error('Unexpected sign up exception:', e)
        return { data: null, error: e }
    }
}

// Get Current User with Profile
export async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Fetch profile data
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

    return { ...user, profile }
}

// Upload KYC Document
export async function uploadKYCDocument(userId, file, type) {
    const fileName = `${userId}/${type}-${Date.now()}`
    const { data, error } = await supabase.storage
        .from('kyc-documents')
        .upload(fileName, file)

    if (error) return { error }

    return { path: data.path }
}

// Submit KYC
export async function submitKYC(userId, formData) {
    const { error } = await supabase
        .from('profiles')
        .update({
            ...formData,
            kyc_status: 'under_review'
        })
        .eq('id', userId)

    return { error }
}

// Get KYC Status
export async function getKYCStatus(userId) {
    const { data, error } = await supabase
        .from('profiles')
        .select('kyc_status')
        .eq('id', userId)
        .single()
    return { status: data?.kyc_status, error }
}

// Auth State Listener
export function initAuthStateListener(callback) {
    supabase.auth.onAuthStateChange((event, session) => {
        if (callback) callback(event, session)

        const path = window.location.pathname
        const isAuthPage = path.includes('signin.html') || path.includes('forgot-password.html') || path.includes('signup.html')
        const isProtectedPage = path.includes('dashboard.html') || path.includes('create-transaction.html')

        if (event === 'SIGNED_IN') {
            if (isAuthPage) {
                const target = `${window.location.origin}/dashboard.html`;
                console.log('Redirecting to', target);
                window.location.href = target;
            }
        } else if (event === 'SIGNED_OUT') {
            if (isProtectedPage) {
                window.location.href = '/signin.html'
            }
        }
    })
}
