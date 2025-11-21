// Database Service using Supabase
class DatabaseService {
    constructor() {
        this.supabase = window.supabaseClient;
    }

    // User Profile Operations
    async createUserProfile(userId, profileData) {
        try {
            const { data, error } = await this.supabase
                .from('user_profiles')
                .insert([{
                    id: userId,
                    ...profileData,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }]);

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Create profile error:', error);
            return { success: false, error: error.message };
        }
    }

    async getUserProfile(userId) {
        try {
            const { data, error } = await this.supabase
                .from('user_profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Get profile error:', error);
            return { success: false, error: error.message };
        }
    }

    async updateUserProfile(userId, updates) {
        try {
            const { data, error } = await this.supabase
                .from('user_profiles')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Update profile error:', error);
            return { success: false, error: error.message };
        }
    }

    // Transaction Operations
    async createTransaction(transactionData) {
        try {
            const { data, error } = await this.supabase
                .from('transactions')
                .insert([{
                    ...transactionData,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }]);

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Create transaction error:', error);
            return { success: false, error: error.message };
        }
    }

    async getUserTransactions(userId) {
        try {
            const { data, error } = await this.supabase
                .from('transactions')
                .select('*')
                .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Get transactions error:', error);
            return { success: false, error: error.message };
        }
    }

    async updateTransaction(transactionId, updates) {
        try {
            const { data, error } = await this.supabase
                .from('transactions')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', transactionId);

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Update transaction error:', error);
            return { success: false, error: error.message };
        }
    }

    // KYC Operations
    async submitKYC(userId, kycData) {
        try {
            console.log('Submitting KYC data:', kycData);
            
            const { data, error } = await this.supabase
                .from('kyc_submissions')
                .insert([{
                    user_id: userId,
                    ...kycData,
                    status: 'pending',
                    created_at: new Date().toISOString()
                }]);

            if (error) {
                console.error('Database error details:', error);
                throw error;
            }
            
            console.log('KYC submitted successfully:', data);
            return { success: true, data };
        } catch (error) {
            console.error('Submit KYC error:', error);
            
            // Provide more detailed error information
            let errorMessage = error.message;
            if (error.code === 'PGRST116') {
                errorMessage = 'Column not found in database. Please check table schema.';
            } else if (error.code === '23505') {
                errorMessage = 'Duplicate entry. KYC may already be submitted.';
            }
            
            return { success: false, error: errorMessage };
        }
    }

    async getKYCStatus(userId) {
        try {
            const { data, error } = await this.supabase
                .from('kyc_submissions')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(1);

            if (error) throw error;
            return { success: true, data: data[0] || null };
        } catch (error) {
            console.error('Get KYC status error:', error);
            return { success: false, error: error.message };
        }
    }

    // File Upload (for documents, images, etc.)
    async uploadFile(bucket, filePath, file) {
        try {
            const { data, error } = await this.supabase.storage
                .from(bucket)
                .upload(filePath, file);

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Upload file error:', error);
            return { success: false, error: error.message };
        }
    }

    async getFileUrl(bucket, filePath) {
        try {
            const { data } = this.supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);

            return { success: true, url: data.publicUrl };
        } catch (error) {
            console.error('Get file URL error:', error);
            return { success: false, error: error.message };
        }
    }
}

// Create global instance
window.databaseService = new DatabaseService();
