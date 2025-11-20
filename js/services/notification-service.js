// Notification Service for Sogolo Platform
class NotificationService {
    constructor() {
        this.supabase = window.supabaseClient;
        this.notifications = [];
        this.unreadCount = 0;
    }

    // Create a new notification
    async createNotification(notificationData) {
        try {
            const { data, error } = await this.supabase
                .from('notifications')
                .insert([{
                    ...notificationData,
                    is_read: false,
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Create notification error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get notifications for a user
    async getUserNotifications(userId, limit = 50) {
        try {
            const { data, error } = await this.supabase
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            
            this.notifications = data;
            this.unreadCount = data.filter(n => !n.is_read).length;
            
            return { success: true, data };
        } catch (error) {
            console.error('Get user notifications error:', error);
            return { success: false, error: error.message };
        }
    }

    // Mark notification as read
    async markAsRead(notificationId) {
        try {
            const { data, error } = await this.supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notificationId)
                .select()
                .single();

            if (error) throw error;
            
            // Update local state
            const notification = this.notifications.find(n => n.id === notificationId);
            if (notification && !notification.is_read) {
                notification.is_read = true;
                this.unreadCount = Math.max(0, this.unreadCount - 1);
            }
            
            return { success: true, data };
        } catch (error) {
            console.error('Mark notification as read error:', error);
            return { success: false, error: error.message };
        }
    }

    // Mark all notifications as read
    async markAllAsRead(userId) {
        try {
            const { data, error } = await this.supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', userId)
                .eq('is_read', false);

            if (error) throw error;
            
            // Update local state
            this.notifications.forEach(n => n.is_read = true);
            this.unreadCount = 0;
            
            return { success: true, data };
        } catch (error) {
            console.error('Mark all notifications as read error:', error);
            return { success: false, error: error.message };
        }
    }

    // Delete notification
    async deleteNotification(notificationId) {
        try {
            const { error } = await this.supabase
                .from('notifications')
                .delete()
                .eq('id', notificationId);

            if (error) throw error;
            
            // Update local state
            const index = this.notifications.findIndex(n => n.id === notificationId);
            if (index > -1) {
                const notification = this.notifications[index];
                if (!notification.is_read) {
                    this.unreadCount = Math.max(0, this.unreadCount - 1);
                }
                this.notifications.splice(index, 1);
            }
            
            return { success: true };
        } catch (error) {
            console.error('Delete notification error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get unread count
    async getUnreadCount(userId) {
        try {
            const { count, error } = await this.supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('is_read', false);

            if (error) throw error;
            
            this.unreadCount = count;
            return { success: true, count };
        } catch (error) {
            console.error('Get unread count error:', error);
            return { success: false, error: error.message };
        }
    }

    // Subscribe to real-time notifications
    subscribeToNotifications(userId, callback) {
        return this.supabase
            .channel('notifications')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${userId}`
            }, (payload) => {
                console.log('New notification received:', payload.new);
                this.notifications.unshift(payload.new);
                if (!payload.new.is_read) {
                    this.unreadCount++;
                }
                callback(payload.new);
            })
            .subscribe();
    }

    // Notification types and templates
    static TYPES = {
        TRANSACTION_CREATED: 'transaction_created',
        TRANSACTION_UPDATED: 'transaction_updated',
        PAYMENT_RECEIVED: 'payment_received',
        KYC_APPROVED: 'kyc_approved',
        KYC_REJECTED: 'kyc_rejected',
        SYSTEM_ANNOUNCEMENT: 'system_announcement'
    };

    // Create specific notification types
    async notifyTransactionCreated(userId, transactionId, productName) {
        return this.createNotification({
            user_id: userId,
            type: NotificationService.TYPES.TRANSACTION_CREATED,
            title: 'New Transaction Created',
            message: `Your transaction for "${productName}" has been created and is pending verification.`,
            data: { transaction_id: transactionId }
        });
    }

    async notifyTransactionUpdated(userId, transactionId, status, productName) {
        const statusMessages = {
            'approved': 'has been approved',
            'completed': 'has been completed',
            'cancelled': 'has been cancelled',
            'disputed': 'is under dispute'
        };

        return this.createNotification({
            user_id: userId,
            type: NotificationService.TYPES.TRANSACTION_UPDATED,
            title: 'Transaction Updated',
            message: `Your transaction for "${productName}" ${statusMessages[status] || 'has been updated'}.`,
            data: { transaction_id: transactionId, status }
        });
    }

    async notifyPaymentReceived(userId, amount, transactionId) {
        return this.createNotification({
            user_id: userId,
            type: NotificationService.TYPES.PAYMENT_RECEIVED,
            title: 'Payment Received',
            message: `You have received a payment of MWK ${amount.toLocaleString()}.`,
            data: { transaction_id: transactionId, amount }
        });
    }

    async notifyKYCStatus(userId, status) {
        const isApproved = status === 'approved';
        return this.createNotification({
            user_id: userId,
            type: isApproved ? NotificationService.TYPES.KYC_APPROVED : NotificationService.TYPES.KYC_REJECTED,
            title: `KYC ${isApproved ? 'Approved' : 'Rejected'}`,
            message: isApproved 
                ? 'Your KYC verification has been approved. You can now access all platform features.'
                : 'Your KYC verification was rejected. Please resubmit with correct documents.',
            data: { kyc_status: status }
        });
    }

    // Browser notification (if permission granted)
    async showBrowserNotification(title, message, options = {}) {
        if ('Notification' in window && Notification.permission === 'granted') {
            return new Notification(title, {
                body: message,
                icon: '/logo.png',
                badge: '/logo.png',
                ...options
            });
        }
    }

    // Request browser notification permission
    async requestNotificationPermission() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        return false;
    }
}

// Create global instance
window.notificationService = new NotificationService();
