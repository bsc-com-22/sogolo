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
            
            // First, try to submit with all fields
            let submissionData = {
                user_id: userId,
                ...kycData,
                status: 'pending',
                created_at: new Date().toISOString()
            };
            
            let { data, error } = await this.supabase
                .from('kyc_verifications')
                .insert([submissionData]);

            if (error) {
                console.error('Database error details:', error);
                
                // If it's a column not found error, try with minimal fields
                if (error.message && error.message.includes('column') && error.message.includes('does not exist')) {
                    console.log('Column not found, trying with essential fields only...');
                    
                    // Extract only essential fields that should always exist
                    const essentialData = {
                        user_id: userId,
                        full_name: kycData.full_name,
                        phone: kycData.phone,
                        status: 'pending',
                        created_at: new Date().toISOString()
                    };
                    
                    // Add consent fields if they exist in the data
                    if (kycData.consent_data !== undefined) {
                        essentialData.consent_data = kycData.consent_data;
                    }
                    if (kycData.consent_terms !== undefined) {
                        essentialData.consent_terms = kycData.consent_terms;
                    }
                    if (kycData.consent_accuracy !== undefined) {
                        essentialData.consent_accuracy = kycData.consent_accuracy;
                    }
                    
                    // Add other fields that might exist
                    const optionalFields = [
                        'date_of_birth', 'address', 'city', 'state', 'postal_code', 'country',
                        'district', 'national_id', 'kin_name', 'kin_relationship', 'kin_phone', 'kin_address',
                        'id_document_url', 'address_document_url', 'selfie_url'
                    ];
                    
                    optionalFields.forEach(field => {
                        if (kycData[field] !== undefined) {
                            essentialData[field] = kycData[field];
                        }
                    });
                    
                    console.log('Retrying with essential data:', essentialData);
                    
                    const retryResult = await this.supabase
                        .from('kyc_verifications')
                        .insert([essentialData]);
                    
                    data = retryResult.data;
                    error = retryResult.error;
                }
                
                if (error) {
                    throw error;
                }
            }
            
            console.log('KYC submitted successfully:', data);
            return { success: true, data };
        } catch (error) {
            console.error('Submit KYC error:', error);
            
            // Provide more detailed error information
            let errorMessage = error.message;
            if (error.code === 'PGRST116') {
                errorMessage = 'Table or column not found in database. Please check table schema.';
            } else if (error.code === '23505') {
                errorMessage = 'Duplicate entry. KYC may already be submitted.';
            } else if (error.message && error.message.includes('column') && error.message.includes('does not exist')) {
                errorMessage = 'Some required fields are missing from the database. Please contact support to update the database schema.';
            }
            
            return { success: false, error: errorMessage };
        }
    }

    async getKYCStatus(userId) {
        try {
            const { data, error } = await this.supabase
                .from('kyc_verifications') // Changed from kyc_submissions to kyc_verifications
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
