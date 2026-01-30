document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const budgetSpentEl = document.getElementById('budget-spent');
    const budgetTotalEl = document.getElementById('budget-total');
    const budgetProgressBar = document.getElementById('budget-progress');
    const budgetPercentEl = document.getElementById('budget-percent');

    const transactionsListEl = document.getElementById('transactions-list');
    const accountsGridEl = document.getElementById('accounts-grid');

    // Modal Elements (Mockup functionality for now)
    const addTransBtn = document.getElementById('add-trans-btn');
    const editBudgetBtn = document.getElementById('edit-budget-btn');

    // Budget Edit Handler
    // Budget Edit Handler - OPEN MODAL
    editBudgetBtn.onclick = () => {
        const activeAccount = appData.accounts.find(a => a.active);
        if (!activeAccount) return alert("Select an account first");

        const budgetModal = document.getElementById("edit-budget-modal");
        const budgetInput = document.getElementById("new-budget-amount");

        // Pre-fill active budget
        budgetInput.value = activeAccount.budget_limit || 10000;

        budgetModal.classList.add("show");
    };

    // Budget Modal Logic
    const budgetModal = document.getElementById("edit-budget-modal");
    const closeBudgetBtn = document.getElementById("close-budget-modal");
    const editBudgetForm = document.getElementById("edit-budget-form");

    if (closeBudgetBtn) {
        closeBudgetBtn.onclick = () => {
            budgetModal.classList.remove("show");
        }
    }

    if (editBudgetForm) {
        editBudgetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const activeAccount = appData.accounts.find(a => a.active);
            const formData = new FormData(editBudgetForm);
            const newBudget = parseFloat(formData.get('new_limit'));

            try {
                const response = await fetch('/api/update_budget', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        account_id: activeAccount.id,
                        new_limit: newBudget
                    })
                });

                if (response.ok) {
                    budgetModal.classList.remove("show");
                    fetchData();
                } else {
                    alert("Failed to update budget");
                }
            } catch (e) {
                console.error(e);
                alert("Error updating budget");
            }
        });
    }


    // Add Transaction Modal Logic
    const transModal = document.getElementById("add-transaction-modal");
    const closeTransBtn = document.getElementById("close-trans-modal");
    const addTransForm = document.getElementById("add-transaction-form");

    // Open Modal
    addTransBtn.onclick = () => {
        const activeAccount = appData.accounts.find(a => a.active);
        if (!activeAccount) {
            alert("Please select/activate an account first!");
            return;
        }
        transModal.classList.add("show");
    };

    // Close Modal
    if (closeTransBtn) {
        closeTransBtn.onclick = () => {
            transModal.classList.remove("show");
        };
    }

    // Handle Transaction Submit
    if (addTransForm) {
        addTransForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const activeAccount = appData.accounts.find(a => a.active);
            if (!activeAccount) {
                alert("No active account selected!");
                return;
            }

            const formData = new FormData(addTransForm);

            const transactionData = {
                title: formData.get('title'),
                category: formData.get('category'),
                amount: parseFloat(formData.get('amount')),
                type: formData.get('type'),
                date: new Date().toISOString(), // Auto-fetched system date
                account_id: activeAccount.id
            };

            try {
                const response = await fetch('/api/add_transaction', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(transactionData)
                });

                if (response.ok) {
                    transModal.classList.remove("show");
                    addTransForm.reset();
                    fetchData(); // Refresh to show new transaction
                } else {
                    alert("Failed to add transaction");
                }
            } catch (error) {
                console.error("Error adding transaction:", error);
                alert("Error adding transaction");
            }
        });
    }
    let appData = {
        budget: { limit: 0, spent: 0 },
        accounts: [],
        transactions: []
    };

    // Initialize
    fetchData();

    // Fetch Data from Backend
    async function fetchData() {
        try {
            const response = await fetch('/api/data');
            const data = await response.json();
            appData = data;
            renderApp();
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }

    // Render Functions
    function renderApp() {
        renderBudget();
        renderTransactions();
        renderAccounts();
        renderChart();
    }

    function renderBudget() {
        const activeAccount = appData.accounts.find(a => a.active);

        if (!activeAccount) {
            budgetSpentEl.textContent = formatCurrency(0);
            budgetTotalEl.textContent = `of ${formatCurrency(0)} spent`;
            budgetProgressBar.style.width = `0%`;
            budgetPercentEl.textContent = `0% used`;
            return;
        }

        const limit = activeAccount.budget_limit || 10000;

        // Calculate spent for active account
        const transactions = appData.transactions.filter(t => t.account_id === activeAccount.id);
        const expenses = transactions.filter(t => t.type === 'expense');
        const spent = expenses.reduce((sum, t) => sum + t.amount, 0);

        const percent = Math.min((spent / limit) * 100, 100).toFixed(1);

        budgetSpentEl.textContent = formatCurrency(spent);
        budgetTotalEl.textContent = `of ${formatCurrency(limit)} spent`;
        budgetProgressBar.style.width = `${percent}%`;
        budgetPercentEl.textContent = `${percent}% used`;

        // Update Card Title to show account name
        document.querySelector('.budget-card .card-header h3').textContent = `Monthly Budget (${activeAccount.name})`;
    }

    function renderTransactions() {
        transactionsListEl.innerHTML = '';

        const activeAccount = appData.accounts.find(a => a.active);
        let transactions = appData.transactions;

        if (activeAccount) {
            transactions = transactions.filter(t => t.account_id === activeAccount.id);
        }

        // Filter transactions? For now show all, limited to recent 5
        const recentTrans = transactions.slice(0, 5);

        recentTrans.forEach(t => {
            const isExpense = t.type === 'expense';
            const amountClass = isExpense ? 'expense' : 'income';
            const arrow = isExpense ? '↘' : '↗';

            const html = `
                <div class="transaction-item">
                    <div class="transaction-details">
                        <span class="trans-title">${t.title}</span>
                        <span class="trans-date">${formatDate(t.date)}</span>
                    </div>
                    <span class="trans-amount ${amountClass}">${arrow} ${formatCurrency(t.amount)}</span>
                </div>
            `;
            transactionsListEl.innerHTML += html;
        });
    }

    function renderAccounts() {
        accountsGridEl.innerHTML = '';

        // Add "Add Account" card first
        accountsGridEl.innerHTML += `
            <div class="account-card add-account-card" onclick="alert('Feature to add account coming soon!')">
                <div class="add-icon">+</div>
                <span>Add New Account</span>
            </div>
        `;

        appData.accounts.forEach(acc => {
            const activeClass = acc.active ? 'active' : '';

            const html = `
                <div class="account-card">
                    <div class="account-header">
                        <span class="account-name">${acc.name}</span>
                        <div class="toggle-switch ${activeClass}" onclick="toggleAccount('${acc.id}')"></div>
                    </div>
                    <div>
                        <div class="account-balance">${formatCurrency(acc.balance)}</div>
                        <div class="account-type">${acc.type}</div>
                    </div>
                    <div class="account-footer">
                        <span class="account-action income"><i class="fa-solid fa-arrow-up"></i> Income</span>
                        <span class="account-action expense"><i class="fa-solid fa-arrow-down"></i> Expense</span>
                    </div>
                </div>
            `;
            accountsGridEl.innerHTML += html;
        });
    }

    function renderChart() {
        // Simple logic to aggregate expenses by category for the pie chart
        // In a real app we would use Chart.js, but here we update the CSS conic-gradient
        const activeAccount = appData.accounts.find(a => a.active);
        let transactions = appData.transactions;
        if (activeAccount) {
            transactions = transactions.filter(t => t.account_id === activeAccount.id);
        }

        const expenses = transactions.filter(t => t.type === 'expense');
        const categories = {};
        let totalExpense = 0;

        expenses.forEach(t => {
            categories[t.category] = (categories[t.category] || 0) + t.amount;
            totalExpense += t.amount;
        });

        // Calculate percentages
        // For simplicity, let's map a few fixed colors to categories
        const colors = ['#ff6b6b', '#55efc4', '#74b9ff', '#a29bfe', '#fab1a0'];
        let gradientStr = '';
        let currentDeg = 0;
        let i = 0;

        for (const [cat, amount] of Object.entries(categories)) {
            const percent = amount / totalExpense;
            const deg = percent * 360;
            const color = colors[i % colors.length];

            gradientStr += `${color} ${currentDeg}deg ${currentDeg + deg}deg,`;
            currentDeg += deg;
            i++;
        }

        // Remove trailing comma
        gradientStr = gradientStr.slice(0, -1);

        // Update Chart Element
        const pieChart = document.querySelector('.pie-chart');
        if (pieChart && gradientStr) {
            pieChart.style.background = `conic-gradient(${gradientStr})`;
        }

        // Also update Legend (basic implementation)
        const legendContainer = document.querySelector('.chart-legend');
        legendContainer.innerHTML = '';
        let j = 0;
        for (const [cat, amount] of Object.entries(categories)) {
            const color = colors[j % colors.length];
            legendContainer.innerHTML += `
                <span class="legend-item"><span class="dot" style="background-color: ${color}"></span> ${cat}</span>
             `;
            j++;
        }
    }

    // Helper Functions
    function formatCurrency(amount) {
        return '₹' + parseFloat(amount).toFixed(2);
    }

    function formatDate(dateString) {
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    // Modal & Add Account Logic
    const modal = document.getElementById("add-account-modal");
    const closeBtn = document.querySelector(".close-modal");
    const addAccountForm = document.getElementById("add-account-form");

    // Close Modal Event
    if (closeBtn) {
        closeBtn.onclick = function () {
            modal.classList.remove("show");
        }
    }

    // Close on outside click
    window.onclick = function (event) {
        if (event.target == modal) {
            modal.classList.remove("show");
        }
        if (event.target == budgetModal) {
            budgetModal.classList.remove("show");
        }
    }

    // Open Modal Function (Updated from inline onclick)
    window.openAddAccountModal = function () {
        modal.classList.add("show");
        // Clear form
        addAccountForm.reset();
    }

    // Handle Form Submit
    if (addAccountForm) {
        addAccountForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(addAccountForm);
            const accountData = {
                name: formData.get('name'),
                balance: parseFloat(formData.get('balance')),
                type: formData.get('type')
            };

            try {
                const response = await fetch('/api/add_account', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(accountData)
                });

                if (response.ok) {
                    modal.classList.remove("show");
                    fetchData(); // Refresh data
                } else {
                    alert("Failed to add account");
                }
            } catch (error) {
                console.error("Error adding account:", error);
                alert("Error adding account");
            }
        });
    }

    // Update the Add Account Card HTML to use the new function
    // This overrides the renderAccounts 'onclick' in the loop
    // But we need to make sure the HTML string in renderAccounts uses openAddAccountModal()
    // Let's patch the render function slightly by redefining it or ensuring the previous html string triggers this.
    // The previous implementation had: onclick="alert(...)"
    // We will update renderAccounts to use openAddAccountModal()

    // REDEFINING renderAccounts to use correct handler
    function renderAccounts() {
        accountsGridEl.innerHTML = '';

        // Add "Add Account" card first
        accountsGridEl.innerHTML += `
            <div class="account-card add-account-card" onclick="openAddAccountModal()">
                <div class="add-icon">+</div>
                <span>Add New Account</span>
            </div>
        `;

        appData.accounts.forEach(acc => {
            const activeClass = acc.active ? 'active' : '';

            const html = `
                <div class="account-card" onclick="window.location.href='/transactions?account_id=${acc.id}'" style="cursor: pointer;">
                    <div class="account-header">
                        <span class="account-name">${acc.name}</span>
                        <div class="header-actions">
                            <div class="toggle-switch ${activeClass}" onclick="toggleAccount('${acc.id}', event)"></div>
                            <div class="delete-icon" onclick="confirmDeleteAccount('${acc.id}', event)"><i class="fa-solid fa-xmark"></i></div>
                        </div>
                    </div>
                    <div>
                        <div class="account-balance">${formatCurrency(acc.balance)}</div>
                        <div class="account-type">${acc.type}</div>
                    </div>
                    <div class="account-footer">
                        <span class="account-action income"><i class="fa-solid fa-arrow-up"></i> Income</span>
                        <span class="account-action expense"><i class="fa-solid fa-arrow-down"></i> Expense</span>
                    </div>
                </div>
            `;
            accountsGridEl.innerHTML += html;
        });
    }

    // Global Exposure for onClick handlers
    window.toggleAccount = async (id, event) => {
        if (event) event.stopPropagation();

        // Optimistic UI Update
        const targetAccount = appData.accounts.find(a => a.id === id);
        if (!targetAccount || targetAccount.active) return; // Already active or invalid

        // Update local state
        appData.accounts.forEach(acc => {
            acc.active = (acc.id === id);
        });

        // Re-render immediately
        renderApp();

        try {
            // Background Sync
            await fetch('/api/toggle_account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            // No need to fetchData() again if successful, local state is already correct.
        } catch (err) {
            console.error("Failed to sync account toggle:", err);
            alert("Failed to switch account. Please reload.");
        }
    };

    // Delete Account Logic
    let accountToDeleteId = null;
    const deleteModal = document.getElementById("delete-account-modal");
    const closeDeleteBtn = document.getElementById("close-delete-modal");
    const cancelDeleteBtn = document.getElementById("cancel-delete-btn");
    const confirmDeleteBtn = document.getElementById("confirm-delete-btn");

    window.confirmDeleteAccount = (id, event) => {
        event.stopPropagation(); // Prevent card click or other bubbling
        accountToDeleteId = id;
        deleteModal.classList.add("show");
    };

    if (closeDeleteBtn) closeDeleteBtn.onclick = () => deleteModal.classList.remove("show");
    if (cancelDeleteBtn) cancelDeleteBtn.onclick = () => deleteModal.classList.remove("show");

    if (confirmDeleteBtn) {
        confirmDeleteBtn.onclick = async () => {
            if (!accountToDeleteId) return;

            try {
                const response = await fetch('/api/delete_account', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: accountToDeleteId })
                });

                if (response.ok) {
                    deleteModal.classList.remove("show");
                    fetchData(); // Refresh data to remove account and transactions
                } else {
                    alert("Failed to delete account");
                }
            } catch (error) {
                console.error("Error deleting account:", error);
                alert("Error deleting account");
            }
        };
    }
});
