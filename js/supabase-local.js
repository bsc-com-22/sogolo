// Supabase Client Library - Local Copy
// This is a minimal implementation to avoid CDN blocking issues

// Simple Supabase client implementation
class SupabaseClient {
    constructor(url, key) {
        this.url = url;
        this.supabaseUrl = url; // Add this property for compatibility
        this.key = key;
        this.restUrl = `${url}/rest/v1`;
        this.storageUrl = `${url}/storage/v1`;
        this.authUrl = `${url}/auth/v1`;
    }

    // Auth methods
    get auth() {
        return {
            getUser: async () => {
                const token = localStorage.getItem('sb-access-token');
                if (!token) return { data: { user: null }, error: null };
                
                try {
                    const response = await fetch(`${this.authUrl}/user`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'apikey': this.key
                        }
                    });
                    
                    if (!response.ok) {
                        throw new Error('Failed to get user');
                    }
                    
                    const data = await response.json();
                    return { data: { user: data }, error: null };
                } catch (error) {
                    return { data: { user: null }, error: { message: error.message } };
                }
            },
            
            getSession: async () => {
                const token = localStorage.getItem('sb-access-token');
                if (!token) return { data: { session: null }, error: null };
                
                try {
                    const userResponse = await this.getUser();
                    if (userResponse.data.user) {
                        return { 
                            data: { 
                                session: {
                                    user: userResponse.data.user,
                                    access_token: token,
                                    refresh_token: localStorage.getItem('sb-refresh-token'),
                                    expires_at: localStorage.getItem('sb-expires-at')
                                }
                            }, 
                            error: null 
                        };
                    }
                    return { data: { session: null }, error: null };
                } catch (error) {
                    return { data: { session: null }, error: { message: error.message } };
                }
            },
            
            updateUser: async (attributes) => {
                const token = localStorage.getItem('sb-access-token');
                if (!token) return { data: null, error: { message: 'Not authenticated' } };
                
                try {
                    const response = await fetch(`${this.authUrl}/user`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'apikey': this.key,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(attributes)
                    });
                    
                    if (!response.ok) {
                        throw new Error('Failed to update user');
                    }
                    
                    const data = await response.json();
                    return { data: { user: data }, error: null };
                } catch (error) {
                    return { data: null, error: { message: error.message } };
                }
            },
            
            signInWithPassword: async (credentials) => {
                try {
                    const response = await fetch(`${this.authUrl}/token?grant_type=password`, {
                        method: 'POST',
                        headers: {
                            'apikey': this.key,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            email: credentials.email,
                            password: credentials.password
                        })
                    });
                    
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.error_description || errorData.message || 'Invalid login credentials');
                    }
                    
                    const data = await response.json();
                    
                    // Store tokens
                    localStorage.setItem('sb-access-token', data.access_token);
                    localStorage.setItem('sb-refresh-token', data.refresh_token);
                    
                    // Get user data
                    const userResponse = await this.getUser();
                    
                    return { 
                        data: { 
                            user: userResponse.data.user,
                            session: data
                        }, 
                        error: null 
                    };
                } catch (error) {
                    return { data: { user: null, session: null }, error: { message: error.message } };
                }
            },
            
            signInWithOAuth: async (options) => {
                // For OAuth, we'll redirect to the provider
                const { provider } = options;
                const redirectUrl = window.location.origin + '/signin.html';
                
                const authUrl = `${this.authUrl}/authorize?provider=${provider}&redirect_to=${encodeURIComponent(redirectUrl)}&scopes=email`;
                
                // Store redirect info for after OAuth callback
                sessionStorage.setItem('oauth-provider', provider);
                
                // Redirect to OAuth provider
                window.location.href = authUrl;
                
                // Return a promise that will never resolve (since we redirect)
                return new Promise(() => {});
            },
            
            signUp: async (credentials) => {
                try {
                    const response = await fetch(`${this.authUrl}/signup`, {
                        method: 'POST',
                        headers: {
                            'apikey': this.key,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            email: credentials.email,
                            password: credentials.password,
                            options: credentials.options
                        })
                    });
                    
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.error_description || errorData.message || 'Registration failed');
                    }
                    
                    const data = await response.json();
                    
                    // Auto-signin after signup if email confirmation is not required
                    if (data.user && !data.user.email_confirmed_at) {
                        return { 
                            data: { 
                                user: data.user,
                                session: null
                            }, 
                            error: null 
                        };
                    }
                    
                    // Try to get session
                    const sessionResponse = await this.signInWithPassword({
                        email: credentials.email,
                        password: credentials.password
                    });
                    
                    return sessionResponse;
                } catch (error) {
                    return { data: { user: null, session: null }, error: { message: error.message } };
                }
            },
            
            signOut: async () => {
                try {
                    const token = localStorage.getItem('sb-access-token');
                    if (token) {
                        await fetch(`${this.authUrl}/logout`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'apikey': this.key
                            }
                        });
                    }
                } catch (error) {
                    // Ignore logout errors
                } finally {
                    localStorage.removeItem('sb-access-token');
                    localStorage.removeItem('sb-refresh-token');
                    localStorage.removeItem('sb-expires-at');
                }
                return { error: null };
            },
            
            onAuthStateChange: (callback) => {
                // Simple implementation - just call the callback once
                setTimeout(() => {
                    this.getSession().then(({ data, error }) => {
                        callback('SIGNED_IN', data.session);
                    });
                }, 100);
                
                // Return unsubscribe function
                return () => {};
            }
        };
    }

    // Database methods
    from(table) {
        return new SupabaseQuery(this.restUrl, table, this.key);
    }

    // Storage methods
    get storage() {
        return new SupabaseStorage(this.storageUrl, this.key);
    }
}

class SupabaseQuery {
    constructor(restUrl, table, key) {
        this.restUrl = restUrl;
        this.table = table;
        this.key = key;
        this.query = {
            select: '*',
            filter: [],
            order: null,
            limit: null,
            offset: null
        };
    }

    select(columns) {
        this.query.select = columns;
        return this;
    }

    eq(column, value) {
        this.query.filter.push(`${column}=eq.${value}`);
        return this;
    }

    or(condition) {
        this.query.filter.push(`or=(${condition})`);
        return this;
    }

    order(column, options = {}) {
        const direction = options.ascending ? 'asc' : 'desc';
        this.query.order = `${column}.${direction}`;
        return this;
    }

    limit(count) {
        this.query.limit = count;
        return this;
    }

    async single() {
        this.query.limit = 1;
        const result = await this.execute();
        if (result.data && result.data.length > 0) {
            result.data = result.data[0];
        } else {
            result.data = null;
        }
        return result;
    }

    async execute() {
        const token = localStorage.getItem('sb-access-token');
        let url = `${this.restUrl}/${this.table}?select=${this.query.select}`;
        
        // Add filters
        if (this.query.filter.length > 0) {
            url += '&' + this.query.filter.join('&');
        }
        
        // Add order
        if (this.query.order) {
            url += `&order=${this.query.order}`;
        }
        
        // Add limit
        if (this.query.limit) {
            url += `&limit=${this.query.limit}`;
        }

        try {
            const response = await fetch(url, {
                headers: {
                    'apikey': this.key,
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}`);
            }

            const data = await response.json();
            return { data, error: null };
        } catch (error) {
            return { data: null, error: { message: error.message } };
        }
    }

    // For CRUD operations
    async insert(data) {
        const token = localStorage.getItem('sb-access-token');
        const url = `${this.restUrl}/${this.table}?select=${this.query.select}`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'apikey': this.key,
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify(Array.isArray(data) ? data : [data])
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}`);
            }

            const result = await response.json();
            return { data: result, error: null };
        } catch (error) {
            return { data: null, error: { message: error.message } };
        }
    }

    async update(data) {
        const token = localStorage.getItem('sb-access-token');
        let url = `${this.restUrl}/${this.table}?select=${this.query.select}`;
        
        // Add filters for WHERE clause
        if (this.query.filter.length > 0) {
            url += '&' + this.query.filter.join('&');
        }

        try {
            const response = await fetch(url, {
                method: 'PATCH',
                headers: {
                    'apikey': this.key,
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}`);
            }

            const result = await response.json();
            return { data: result, error: null };
        } catch (error) {
            return { data: null, error: { message: error.message } };
        }
    }
}

class SupabaseStorage {
    constructor(storageUrl, key) {
        this.storageUrl = storageUrl;
        this.key = key;
    }

    from(bucket) {
        return new SupabaseBucket(this.storageUrl, bucket, this.key);
    }
}

class SupabaseBucket {
    constructor(storageUrl, bucket, key) {
        this.storageUrl = storageUrl;
        this.bucket = bucket;
        this.key = key;
    }

    upload(path, file) {
        return new Promise((resolve, reject) => {
            const token = localStorage.getItem('sb-access-token');
            const formData = new FormData();
            formData.append('file', file);

            fetch(`${this.storageUrl}/object/${this.bucket}/${path}`, {
                method: 'POST',
                headers: {
                    'apikey': this.key,
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: formData
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Upload failed: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                resolve({ data: { path }, error: null });
            })
            .catch(error => {
                resolve({ data: null, error: { message: error.message } });
            });
        });
    }

    getPublicUrl(path) {
        return {
            data: {
                publicUrl: `${this.storageUrl}/object/public/${this.bucket}/${path}`
            }
        };
    }
}

// Create Supabase client
function createClient(url, key) {
    return new SupabaseClient(url, key);
}

// Export for global use
window.Supabase = { createClient };
