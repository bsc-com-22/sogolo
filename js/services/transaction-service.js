// Transaction Service for Sogolo Platform
class TransactionService {
    constructor() {
        this.supabase = window.supabaseClient;
    }

    // Create a new transaction
    async createTransaction(transactionData) {
        try {
            const { data, error } = await this.supabase
                .from('transactions')
                .insert([{
                    ...transactionData,
                    status: 'pending',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Create transaction error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get transactions for a user
    async getUserTransactions(userId, filters = {}) {
        try {
            let query = this.supabase
                .from('transactions')
                .select(`
                    *,
                    buyer:buyer_id(id, full_name, email),
                    seller:seller_id(id, full_name, email)
                `)
                .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
                .order('created_at', { ascending: false });

            // Apply filters
            if (filters.status) {
                query = query.eq('status', filters.status);
            }
            if (filters.limit) {
                query = query.limit(filters.limit);
            }

            const { data, error } = await query;
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Get user transactions error:', error);
            return { success: false, error: error.message };
        }
    }

    // Update transaction status
    async updateTransactionStatus(transactionId, status, userId) {
        try {
            // First check if user is authorized to update this transaction
            const { data: transaction, error: fetchError } = await this.supabase
                .from('transactions')
                .select('buyer_id, seller_id, status')
                .eq('id', transactionId)
                .single();

            if (fetchError) throw fetchError;

            if (transaction.buyer_id !== userId && transaction.seller_id !== userId) {
                throw new Error('Unauthorized to update this transaction');
            }

            const { data, error } = await this.supabase
                .from('transactions')
                .update({
                    status: status,
                    updated_at: new Date().toISOString()
                })
                .eq('id', transactionId)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Update transaction status error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get transaction by ID
    async getTransaction(transactionId, userId) {
        try {
            const { data, error } = await this.supabase
                .from('transactions')
                .select(`
                    *,
                    buyer:buyer_id(id, full_name, email, phone),
                    seller:seller_id(id, full_name, email, phone)
                `)
                .eq('id', transactionId)
                .single();

            if (error) throw error;

            // Check if user is authorized to view this transaction
            if (data.buyer_id !== userId && data.seller_id !== userId) {
                throw new Error('Unauthorized to view this transaction');
            }

            return { success: true, data };
        } catch (error) {
            console.error('Get transaction error:', error);
            return { success: false, error: error.message };
        }
    }

    // Add transaction message/note
    async addTransactionMessage(transactionId, userId, message) {
        try {
            const { data, error } = await this.supabase
                .from('transaction_messages')
                .insert([{
                    transaction_id: transactionId,
                    user_id: userId,
                    message: message,
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Add transaction message error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get transaction messages
    async getTransactionMessages(transactionId, userId) {
        try {
            // First verify user has access to this transaction
            const transactionResult = await this.getTransaction(transactionId, userId);
            if (!transactionResult.success) {
                throw new Error('Unauthorized access to transaction');
            }

            const { data, error } = await this.supabase
                .from('transaction_messages')
                .select(`
                    *,
                    user:user_id(id, full_name, email)
                `)
                .eq('transaction_id', transactionId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Get transaction messages error:', error);
            return { success: false, error: error.message };
        }
    }

    // Calculate transaction statistics
    async getTransactionStats(userId) {
        try {
            const { data, error } = await this.supabase
                .from('transactions')
                .select('status, amount, created_at')
                .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);

            if (error) throw error;

            const stats = {
                total: data.length,
                pending: data.filter(t => t.status === 'pending').length,
                completed: data.filter(t => t.status === 'completed').length,
                cancelled: data.filter(t => t.status === 'cancelled').length,
                totalAmount: data.reduce((sum, t) => sum + (t.amount || 0), 0),
                thisMonth: data.filter(t => {
                    const transactionDate = new Date(t.created_at);
                    const now = new Date();
                    return transactionDate.getMonth() === now.getMonth() && 
                           transactionDate.getFullYear() === now.getFullYear();
                }).length
            };

            return { success: true, data: stats };
        } catch (error) {
            console.error('Get transaction stats error:', error);
            return { success: false, error: error.message };
        }
    }

    // Search transactions
    async searchTransactions(userId, searchTerm, filters = {}) {
        try {
            let query = this.supabase
                .from('transactions')
                .select(`
                    *,
                    buyer:buyer_id(id, full_name, email),
                    seller:seller_id(id, full_name, email)
                `)
                .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
                .ilike('product_name', `%${searchTerm}%`)
                .order('created_at', { ascending: false });

            if (filters.status) {
                query = query.eq('status', filters.status);
            }

            const { data, error } = await query;
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Search transactions error:', error);
            return { success: false, error: error.message };
        }
    }
}

// Create global instance
window.transactionService = new TransactionService();
