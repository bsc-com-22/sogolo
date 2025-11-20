// Transaction View Component for Dashboard
class TransactionView {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.transactions = [];
        this.currentFilter = 'all';
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.init();
    }

    init() {
        this.render();
        this.attachEventListeners();
        this.loadTransactions();
    }

    render() {
        this.container.innerHTML = `
            <div class="transaction-view">
                <div class="transaction-header">
                    <h3>Transaction History</h3>
                    <button class="btn btn-primary" onclick="this.openNewTransactionModal()">
                        New Transaction
                    </button>
                </div>

                <div class="transaction-filters">
                    <div class="filter-tabs">
                        <button class="filter-tab active" data-filter="all">All</button>
                        <button class="filter-tab" data-filter="pending">Pending</button>
                        <button class="filter-tab" data-filter="completed">Completed</button>
                        <button class="filter-tab" data-filter="cancelled">Cancelled</button>
                    </div>
                    <div class="filter-search">
                        <input type="text" id="transactionSearch" placeholder="Search transactions..." class="search-input">
                    </div>
                </div>

                <div class="transaction-stats">
                    <div class="stat-card">
                        <div class="stat-value" id="totalTransactions">0</div>
                        <div class="stat-label">Total Transactions</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="pendingTransactions">0</div>
                        <div class="stat-label">Pending</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="completedTransactions">0</div>
                        <div class="stat-label">Completed</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="totalAmount">MWK 0</div>
                        <div class="stat-label">Total Value</div>
                    </div>
                </div>

                <div class="transaction-list" id="transactionList">
                    <div class="loading-state">
                        <div class="spinner"></div>
                        <p>Loading transactions...</p>
                    </div>
                </div>

                <div class="transaction-pagination" id="transactionPagination">
                    <!-- Pagination will be rendered here -->
                </div>
            </div>

            <!-- New Transaction Modal -->
            <div class="modal" id="newTransactionModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Create New Transaction</h3>
                        <button class="modal-close" onclick="this.closeNewTransactionModal()">&times;</button>
                    </div>
                    <form id="newTransactionForm">
                        <div class="form-group">
                            <label for="productName">Product Name</label>
                            <input type="text" id="productName" required class="form-control">
                        </div>
                        <div class="form-group">
                            <label for="productDescription">Description</label>
                            <textarea id="productDescription" required class="form-control" rows="3"></textarea>
                        </div>
                        <div class="form-group">
                            <label for="transactionAmount">Amount (MWK)</label>
                            <input type="number" id="transactionAmount" required class="form-control" min="100">
                        </div>
                        <div class="form-group">
                            <label for="buyerEmail">Buyer Email</label>
                            <input type="email" id="buyerEmail" required class="form-control">
                        </div>
                        <div class="form-group">
                            <label for="productImages">Product Images</label>
                            <input type="file" id="productImages" multiple accept="image/*" class="form-control">
                            <small class="form-text">Upload up to 5 images (max 2MB each)</small>
                        </div>
                        <div class="modal-actions">
                            <button type="button" class="btn btn-secondary" onclick="this.closeNewTransactionModal()">Cancel</button>
                            <button type="submit" class="btn btn-primary">Create Transaction</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Filter tabs
        this.container.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // Search
        const searchInput = this.container.querySelector('#transactionSearch');
        if (searchInput) {
            searchInput.addEventListener('input', Helpers.debounce((e) => {
                this.searchTransactions(e.target.value);
            }, 300));
        }

        // New transaction form
        const form = this.container.querySelector('#newTransactionForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleNewTransaction(e);
            });
        }
    }

    async loadTransactions() {
        try {
            const user = await window.sogoloApp.getCurrentUser();
            if (!user) return;

            const result = await window.transactionService.getUserTransactions(user.id);
            if (result.success) {
                this.transactions = result.data;
                this.updateStats();
                this.renderTransactions();
            } else {
                console.error('Failed to load transactions:', result.error);
                this.showError('Failed to load transactions');
            }
        } catch (error) {
            console.error('Error loading transactions:', error);
            this.showError('Error loading transactions');
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        this.currentPage = 1;

        // Update active tab
        this.container.querySelectorAll('.filter-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.filter === filter);
        });

        this.renderTransactions();
    }

    searchTransactions(searchTerm) {
        // Implement search functionality
        this.currentPage = 1;
        this.renderTransactions(searchTerm);
    }

    renderTransactions(searchTerm = '') {
        const listContainer = this.container.querySelector('#transactionList');
        
        let filteredTransactions = this.transactions;

        // Apply status filter
        if (this.currentFilter !== 'all') {
            filteredTransactions = filteredTransactions.filter(t => t.status === this.currentFilter);
        }

        // Apply search filter
        if (searchTerm) {
            filteredTransactions = filteredTransactions.filter(t => 
                t.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.buyer?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.seller?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Pagination
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

        if (paginatedTransactions.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📋</div>
                    <h4>No transactions found</h4>
                    <p>Start by creating your first transaction</p>
                    <button class="btn btn-primary" onclick="this.openNewTransactionModal()">
                        Create Transaction
                    </button>
                </div>
            `;
            return;
        }

        const transactionHTML = paginatedTransactions.map(transaction => `
            <div class="transaction-item" onclick="this.viewTransaction('${transaction.id}')">
                <div class="transaction-info">
                    <div class="transaction-product">
                        <h4>${transaction.product_name}</h4>
                        <p class="transaction-id">#${transaction.id.substring(0, 8)}</p>
                    </div>
                    <div class="transaction-parties">
                        <div class="party">
                            <span class="party-label">Buyer:</span>
                            <span class="party-name">${transaction.buyer?.full_name || 'Unknown'}</span>
                        </div>
                        <div class="party">
                            <span class="party-label">Seller:</span>
                            <span class="party-name">${transaction.seller?.full_name || 'Unknown'}</span>
                        </div>
                    </div>
                </div>
                <div class="transaction-details">
                    <div class="transaction-amount">MWK ${transaction.amount?.toLocaleString() || '0'}</div>
                    <div class="transaction-status status-${transaction.status}">${this.formatStatus(transaction.status)}</div>
                    <div class="transaction-date">${this.formatDate(transaction.created_at)}</div>
                </div>
                <div class="transaction-actions">
                    <button class="btn-icon" onclick="event.stopPropagation(); this.viewTransaction('${transaction.id}')" title="View Details">
                        👁️
                    </button>
                    ${this.getActionButtons(transaction)}
                </div>
            </div>
        `).join('');

        listContainer.innerHTML = transactionHTML;
        this.renderPagination(filteredTransactions.length);
    }

    getActionButtons(transaction) {
        const user = window.sogoloApp.currentUser;
        if (!user) return '';

        let buttons = '';
        
        if (transaction.status === 'pending' && transaction.seller_id === user.id) {
            buttons += `<button class="btn-icon" onclick="event.stopPropagation(); this.approveTransaction('${transaction.id}')" title="Approve">✅</button>`;
        }
        
        if (transaction.status === 'pending') {
            buttons += `<button class="btn-icon" onclick="event.stopPropagation(); this.cancelTransaction('${transaction.id}')" title="Cancel">❌</button>`;
        }

        return buttons;
    }

    renderPagination(totalItems) {
        const paginationContainer = this.container.querySelector('#transactionPagination');
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);

        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let paginationHTML = '<div class="pagination">';
        
        // Previous button
        if (this.currentPage > 1) {
            paginationHTML += `<button class="page-btn" onclick="this.goToPage(${this.currentPage - 1})">Previous</button>`;
        }

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === this.currentPage) {
                paginationHTML += `<button class="page-btn active">${i}</button>`;
            } else if (i === 1 || i === totalPages || Math.abs(i - this.currentPage) <= 2) {
                paginationHTML += `<button class="page-btn" onclick="this.goToPage(${i})">${i}</button>`;
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                paginationHTML += '<span class="page-ellipsis">...</span>';
            }
        }

        // Next button
        if (this.currentPage < totalPages) {
            paginationHTML += `<button class="page-btn" onclick="this.goToPage(${this.currentPage + 1})">Next</button>`;
        }

        paginationHTML += '</div>';
        paginationContainer.innerHTML = paginationHTML;
    }

    goToPage(page) {
        this.currentPage = page;
        this.renderTransactions();
    }

    updateStats() {
        const stats = {
            total: this.transactions.length,
            pending: this.transactions.filter(t => t.status === 'pending').length,
            completed: this.transactions.filter(t => t.status === 'completed').length,
            totalAmount: this.transactions.reduce((sum, t) => sum + (t.amount || 0), 0)
        };

        this.container.querySelector('#totalTransactions').textContent = stats.total;
        this.container.querySelector('#pendingTransactions').textContent = stats.pending;
        this.container.querySelector('#completedTransactions').textContent = stats.completed;
        this.container.querySelector('#totalAmount').textContent = `MWK ${stats.totalAmount.toLocaleString()}`;
    }

    formatStatus(status) {
        const statusMap = {
            'pending': 'Pending',
            'approved': 'Approved',
            'completed': 'Completed',
            'cancelled': 'Cancelled',
            'disputed': 'Disputed'
        };
        return statusMap[status] || status;
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-MW', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    openNewTransactionModal() {
        const modal = this.container.querySelector('#newTransactionModal');
        modal.style.display = 'block';
    }

    closeNewTransactionModal() {
        const modal = this.container.querySelector('#newTransactionModal');
        modal.style.display = 'none';
        this.container.querySelector('#newTransactionForm').reset();
    }

    async handleNewTransaction(event) {
        const formData = new FormData(event.target);
        const user = await window.sogoloApp.getCurrentUser();
        
        if (!user) {
            Helpers.showToast('Please log in to create a transaction', 'error');
            return;
        }

        const transactionData = {
            product_name: formData.get('productName'),
            description: formData.get('productDescription'),
            amount: parseFloat(formData.get('transactionAmount')),
            buyer_email: formData.get('buyerEmail'),
            seller_id: user.id,
            status: 'pending'
        };

        try {
            const result = await window.transactionService.createTransaction(transactionData);
            
            if (result.success) {
                Helpers.showToast('Transaction created successfully!', 'success');
                this.closeNewTransactionModal();
                this.loadTransactions(); // Reload the list
            } else {
                Helpers.showToast(result.error || 'Failed to create transaction', 'error');
            }
        } catch (error) {
            console.error('Error creating transaction:', error);
            Helpers.showToast('An error occurred while creating the transaction', 'error');
        }
    }

    async viewTransaction(transactionId) {
        // Navigate to transaction detail view or open modal
        console.log('Viewing transaction:', transactionId);
        // Implementation depends on your routing strategy
    }

    async approveTransaction(transactionId) {
        try {
            const user = await window.sogoloApp.getCurrentUser();
            const result = await window.transactionService.updateTransactionStatus(transactionId, 'approved', user.id);
            
            if (result.success) {
                Helpers.showToast('Transaction approved!', 'success');
                this.loadTransactions();
            } else {
                Helpers.showToast(result.error || 'Failed to approve transaction', 'error');
            }
        } catch (error) {
            console.error('Error approving transaction:', error);
            Helpers.showToast('An error occurred', 'error');
        }
    }

    async cancelTransaction(transactionId) {
        if (!confirm('Are you sure you want to cancel this transaction?')) {
            return;
        }

        try {
            const user = await window.sogoloApp.getCurrentUser();
            const result = await window.transactionService.updateTransactionStatus(transactionId, 'cancelled', user.id);
            
            if (result.success) {
                Helpers.showToast('Transaction cancelled', 'success');
                this.loadTransactions();
            } else {
                Helpers.showToast(result.error || 'Failed to cancel transaction', 'error');
            }
        } catch (error) {
            console.error('Error cancelling transaction:', error);
            Helpers.showToast('An error occurred', 'error');
        }
    }

    showError(message) {
        const listContainer = this.container.querySelector('#transactionList');
        listContainer.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <h4>Error Loading Transactions</h4>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="this.loadTransactions()">Try Again</button>
            </div>
        `;
    }

    // Public method to refresh transactions
    refresh() {
        this.loadTransactions();
    }
}

// Make available globally
window.TransactionView = TransactionView;
