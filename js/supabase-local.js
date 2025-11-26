// Supabase Client Library - Local Copy
// This is a minimal implementation to avoid CDN blocking issues

// Simple Supabase client implementation
class SupabaseClient {
    constructor(url, key) {
        this.url = url;
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
            
            signOut: async () => {
                localStorage.removeItem('sb-access-token');
                localStorage.removeItem('sb-refresh-token');
                return { error: null };
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
