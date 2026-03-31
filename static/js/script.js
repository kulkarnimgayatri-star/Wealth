document.addEventListener('DOMContentLoaded', () => {
    // Initialize User Avatar
    renderUserAvatar();

    // DOM Elements
    const budgetSpentEl = document.getElementById('budget-spent');
    const budgetTotalEl = document.getElementById('budget-total');
    const budgetProgressBar = document.getElementById('budget-progress');

    // Stats Elements
    const hSpentEl = document.getElementById('history-spent');
    const hIncomeEl = document.getElementById('history-income');
    const hCountEl = document.getElementById('history-count');
    const hAvgEl = document.getElementById('history-avg');
    const searchBox = document.getElementById('trans-search-box');

    if (searchBox) {
        searchBox.addEventListener('input', () => renderTransactions());
    }

    function renderUserAvatar() {
        const avatars = document.querySelectorAll('.avatar');
        const name = localStorage.getItem('user_name') || "Gayatri K";
        const imgUrl = localStorage.getItem('user_avatar') || "";
        
        avatars.forEach(avatarEl => {
            if (imgUrl && imgUrl.trim() !== '') {
                avatarEl.src = imgUrl;
                avatarEl.style.objectFit = 'cover';
                avatarEl.style.borderRadius = '50%';
            } else {
                const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
                const div = document.createElement('div');
                div.className = 'nav-avatar';
                div.style.width = '42px';
                div.style.height = '42px';
                div.style.borderRadius = '50%';
                div.style.background = 'linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%)';
                div.style.color = 'white';
                div.style.display = 'flex';
                div.style.alignItems = 'center';
                div.style.justifyContent = 'center';
                div.style.fontWeight = '700';
                div.style.fontSize = '1.05rem';
                div.style.boxShadow = '0 4px 10px rgba(108, 92, 231, 0.2)';
                div.style.cursor = 'pointer';
                div.onclick = () => window.location.href = '/settings';
                div.innerHTML = initials;
                avatarEl.parentNode.replaceChild(div, avatarEl);
            }
        });
    }

    renderUserAvatar();
    const budgetPercentEl = document.getElementById('budget-percent');

    const transactionsListEl = document.getElementById('transactions-list');
    const accountsGridEl = document.getElementById('accounts-grid');

    // Modal Elements (Mockup functionality for now)
    const addTransBtn = document.getElementById('add-trans-btn');

    // REMOVED: Budget Edit Handler - No longer using account-level budgets
    // Budget display now shows category budget aggregate instead

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
                alert("❌ Please select an account first (click toggle on any account card)");
                return;
            }

            const formData = new FormData(addTransForm);
            
            const title = formData.get('title')?.trim();
            const category = formData.get('category');
            const amount = parseFloat(formData.get('amount'));
            const type = formData.get('type');
            
            // Validation
            if (!title) {
                alert("❌ Please enter a transaction title");
                return;
            }
            if (!category) {
                alert("❌ Please select a category");
                return;
            }
            if (!amount || amount <= 0) {
                alert("❌ Please enter a valid amount (greater than 0)");
                return;
            }
            if (!type) {
                alert("❌ Please select transaction type (Income/Expense)");
                return;
            }

            const transactionData = {
                title: title,
                category: category,
                amount: amount,
                type: type,
                date: new Date().toISOString(),
                account_id: activeAccount.id
            };

            try {
                const response = await fetch('/api/add_transaction', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(transactionData)
                });

                const responseData = await response.json();
                
                if (response.ok) {
                    transModal.classList.remove("show");
                    addTransForm.reset();
                    showSuccessMessage(`✅ Transaction added! ${type === 'income' ? '➕' : '➖'} ₹${amount.toFixed(2)} ${category}`);
                    fetchData(); // Refresh to show new transaction
                } else {
                    alert("❌ Error: " + (responseData.message || "Failed to add transaction"));
                }
            } catch (error) {
                console.error("Error adding transaction:", error);
                alert("❌ Error adding transaction. Check console for details.");
            }
        });
    }
    // Month navigation for Dashboard
    const now = new Date();
    let viewYear = now.getFullYear();
    let viewMonth = now.getMonth(); // 0-indexed

    function updateMonthLabel() {
        const monthLabelEl = document.getElementById('month-label');
        if (monthLabelEl) {
            monthLabelEl.textContent = new Date(viewYear, viewMonth, 1)
                .toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        }
    }

    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');

    if (prevMonthBtn) {
        prevMonthBtn.onclick = () => {
            viewMonth--;
            if (viewMonth < 0) { viewMonth = 11; viewYear--; }
            updateMonthLabel();
            renderApp();
        };
    }
    if (nextMonthBtn) {
        nextMonthBtn.onclick = () => {
            viewMonth++;
            if (viewMonth > 11) { viewMonth = 0; viewYear++; }
            updateMonthLabel();
            renderApp();
        };
    }

    let isAllTime = false;
    window.toggleAllTimeHistory = () => {
        isAllTime = !isAllTime;
        const btn = document.getElementById('all-time-btn');
        if (btn) {
            btn.classList.toggle('active');
            btn.style.background = isAllTime ? '#6c5ce7' : '';
            btn.style.color = isAllTime ? '#white' : '';
        }
        renderApp();
    };

    // Global Month Nav
    window.changeMonth = (delta) => {
        isAllTime = false; // Navigating months breaks "All Time"
        const btn = document.getElementById('all-time-btn');
        if (btn) { btn.style.background = ''; btn.style.color = ''; }
        
        viewMonth += delta;
        if (viewMonth < 0) { viewMonth = 11; viewYear--; }
        if (viewMonth > 11) { viewMonth = 0; viewYear++; }
        updateMonthLabel();
        renderApp();
    };

    updateMonthLabel();

    updateMonthLabel();

    // Account Switcher Logic
    const accountSwitcherBtn = document.getElementById('account-switcher-btn');
    const accountDropdown = document.getElementById('account-dropdown');
    if (accountSwitcherBtn && accountDropdown) {
        accountSwitcherBtn.onclick = (e) => {
            e.stopPropagation();
            accountDropdown.style.display = accountDropdown.style.display === 'block' ? 'none' : 'block';
        };
        window.addEventListener('click', (e) => {
            if (!accountSwitcherBtn.contains(e.target)) {
                accountDropdown.style.display = 'none';
            }
        });
    }

    function updateAccountSwitcher() {
        const activeAcc = appData.accounts.find(a => a.active);
        const nameEl = document.getElementById('active-account-name');
        if (nameEl) nameEl.textContent = activeAcc ? activeAcc.name : 'Select Account';

        const dropdown = document.getElementById('account-dropdown');
        if (dropdown) {
            dropdown.innerHTML = appData.accounts.map(acc => `
                <div class="account-option ${acc.active ? 'active' : ''}" 
                     onclick="toggleAccount('${acc.id}', event)"
                     style="padding: 10px; cursor: pointer; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; ${acc.active ? 'background-color: var(--bg-light); color: var(--primary-color); font-weight: 700;' : ''}">
                    <span>${acc.name}</span>
                    ${acc.active ? '<i class="fa-solid fa-check"></i>' : ''}
                </div>
            `).join('') || '<p style="font-size: 0.8rem; color: #aaa;">No accounts available</p>';
        }
    }

    let appData = {
        budget: { limit: 0, spent: 0 },
        accounts: [],
        transactions: [],
        category_budgets: {},
        savings_goals: []
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
    let expensePieChartInstance = null;

    function renderApp() {
        const greetingEl = document.getElementById('greeting-text');
        if (greetingEl) {
            const name = localStorage.getItem('user_name') || "Gayatri";
            const hour = new Date().getHours();
            const timeGreeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
            greetingEl.textContent = `${timeGreeting}, ${name.split(' ')[0]}!`;
        }
        renderBudget();
        renderAccounts();
        updateAccountSwitcher();
        renderTransactions();
        renderSavingsGoals();
        renderSummaryCards();
        renderHorizontalGraph(); 
        renderAnalyticsChart();
    }

    function renderFinancialHealth() {}
    function renderPieChart() {}

    function renderAccounts() {
        if (!accountsGridEl) return;
        accountsGridEl.innerHTML = '';

        appData.accounts.forEach(acc => {
            const accCard = document.createElement('div');
            accCard.className = `account-card ${acc.active ? 'active' : ''}`;
            accCard.style.padding = '20px';
            accCard.style.borderRadius = '16px';
            accCard.style.background = acc.active ? 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)' : '#fff';
            accCard.style.color = acc.active ? '#fff' : 'var(--text-dark)';
            accCard.style.boxShadow = '0 4px 15px rgba(0,0,0,0.05)';
            accCard.style.cursor = 'pointer';
            accCard.style.display = 'flex';
            accCard.style.flexDirection = 'column';
            accCard.style.gap = '8px';
            accCard.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            
            accCard.onclick = (e) => toggleAccount(acc.id, e);

            accCard.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <span style="font-size: 0.8rem; font-weight: 700; opacity: 0.8; text-transform: uppercase;">${acc.type}</span>
                    ${acc.active ? '<i class="fa-solid fa-circle-check"></i>' : ''}
                </div>
                <h3 style="font-size: 1.1rem; margin: 4px 0;">${acc.name}</h3>
                <div style="font-size: 1.5rem; font-weight: 800;">${formatCurrency(acc.balance)}</div>
            `;
            accountsGridEl.appendChild(accCard);
        });
    }

    let performanceChartInstance = null;
    let analyticsPieChartInstance = null;

    function renderAnalyticsChart() {
        const ctx = document.getElementById('performanceChart');
        const pieCtx = document.getElementById('analyticsPieChart');
        if (!ctx) return;

        const transactions = appData.transactions || [];
        const labels = ['January', 'February', 'March'];
        const incomeData = [0, 0, 0];
        const expenseData = [0, 0, 0];
        const categoryData = {};

        const activeAccount = appData.accounts.find(a => a.active);

        transactions.forEach(t => {
            if (activeAccount && t.account_id !== activeAccount.id) return;

            const tDate = new Date(t.date);
            const monthIdx = tDate.getMonth();
            if (monthIdx >= 0 && monthIdx <= 2) {
                if (t.type === 'income') {
                    incomeData[monthIdx] += (t.amount || 0);
                } else if (t.type === 'expense') {
                    expenseData[monthIdx] += (t.amount || 0);
                    categoryData[t.category] = (categoryData[t.category] || 0) + (t.amount || 0);
                }
            }
        });

        // --- KPI Update ---
        const totalInc = incomeData.reduce((a, b) => a + b, 0);
        const totalExp = expenseData.reduce((a, b) => a + b, 0);
        
        const kpiSavings = document.getElementById('kpi-savings');
        if (kpiSavings) kpiSavings.textContent = formatCurrency((totalInc - totalExp) / 3);

        const kpiCategory = document.getElementById('kpi-category');
        if (kpiCategory) {
            const sortedCats = Object.entries(categoryData).sort((a, b) => b[1] - a[1]);
            kpiCategory.textContent = sortedCats.length ? sortedCats[0][0] : 'None';
        }

        const kpiGrowth = document.getElementById('kpi-growth');
        if (kpiGrowth) {
            const growth = ((incomeData[2] - incomeData[0]) / (incomeData[0] || 1)) * 100;
            kpiGrowth.textContent = (growth >= 0 ? '+' : '') + growth.toFixed(1) + '%';
        }

        const kpiBurn = document.getElementById('kpi-burn');
        if (kpiBurn) kpiBurn.textContent = formatCurrency(totalExp / 3);

        // --- Line Chart ---
        if (performanceChartInstance) performanceChartInstance.destroy();
        performanceChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Income',
                        data: incomeData,
                        borderColor: '#00b894',
                        backgroundColor: 'rgba(0, 184, 148, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointRadius: 6,
                    },
                    {
                        label: 'Expense',
                        data: expenseData,
                        borderColor: '#6c5ce7',
                        backgroundColor: 'rgba(108, 92, 231, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointRadius: 6,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top', labels: { font: { family: 'Inter', weight: '600' } } }
                }
            }
        });

        // --- Pie Chart ---
        if (pieCtx) {
            if (analyticsPieChartInstance) analyticsPieChartInstance.destroy();
            const pieLabels = Object.keys(categoryData);
            const pieValues = Object.values(categoryData);

            analyticsPieChartInstance = new Chart(pieCtx, {
                type: 'doughnut',
                data: {
                    labels: pieLabels,
                    datasets: [{
                        data: pieValues,
                        backgroundColor: ['#6c5ce7', '#00b894', '#fdcb6e', '#d63031', '#0984e3', '#e84393'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    cutout: '70%'
                }
            });
        }
    }


    function renderBudget() {
        const budgetSpentEl = document.getElementById('budget-spent');
        const budgetTotalEl = document.getElementById('budget-total');
        const budgetProgressBar = document.getElementById('budget-progress');
        const budgetPercentEl = document.getElementById('budget-percent');

        // Safe guard if we are not on a page with budget items (e.g. Dashboard)
        if (!budgetSpentEl || !budgetTotalEl || !budgetProgressBar || !budgetPercentEl) return;

        const categoryBudgets = appData.category_budgets || {};
        const transactions = appData.transactions || [];
        
        const currentMonthDisplay = viewYear + '-' + String(viewMonth + 1).padStart(2, '0');
        
        let totalBudget = 0;
        let totalSpent = 0;

        const activeAccount = appData.accounts.find(a => a.active);
        
        for (const [category, limit] of Object.entries(categoryBudgets)) {
            totalBudget += limit;
            const categoryExpenses = transactions.filter(t => {
                const tCat = t.category ? t.category.toLowerCase() : '';
                const searchCat = category.toLowerCase();
                if (tCat !== searchCat || t.type !== 'expense') return false;
                
                // Filter by active account if one is selected
                if (activeAccount && t.account_id !== activeAccount.id) return false;

                const tDate = new Date(t.date);
                const tMonthStr = tDate.getFullYear() + '-' + String(tDate.getMonth() + 1).padStart(2, '0');
                return tMonthStr === currentMonthDisplay;
            });
            const spent = categoryExpenses.reduce((sum, t) => sum + (t.amount || 0), 0);
            totalSpent += spent;
        }

        const dateForDisplay = new Date(viewYear, viewMonth, 1);
        const monthName = dateForDisplay.toLocaleDateString('en-US', {month:'long'});

        if (totalBudget === 0) {
            budgetSpentEl.textContent = formatCurrency(0);
            budgetTotalEl.textContent = `₹0.00`;
            budgetProgressBar.style.width = `0%`;
            budgetProgressBar.classList.remove('danger', 'warning');
            budgetPercentEl.innerHTML = `<i class="fa-solid fa-info-circle"></i> <span class="highlight-month">No budgets set for ${monthName}</span>`;
            return;
        }

        const percent = (totalSpent / totalBudget) * 100;
        const displayPercent = Math.min(percent, 100).toFixed(1);

        budgetSpentEl.textContent = formatCurrency(totalSpent);
        budgetSpentEl.style.color = percent < 80 ? '#00b894' : percent <= 100 ? '#e67e22' : '#d63031';
        budgetTotalEl.textContent = `${formatCurrency(totalBudget)}`;
        budgetProgressBar.style.width = `${displayPercent}%`;
        
        const percentValEl = document.getElementById('budget-percent-val');
        if (percentValEl) percentValEl.textContent = `${displayPercent}%`;

        const statusTextEl = document.getElementById('budget-status-text');
        if (statusTextEl) {
            statusTextEl.className = 'status-badge'; 
            if (percent < 80) {
                statusTextEl.textContent = 'Under Budget';
                statusTextEl.classList.add('status-good');
            } else if (percent <= 100) {
                statusTextEl.textContent = 'Critical';
                statusTextEl.classList.add('status-warning');
            } else {
                statusTextEl.textContent = 'Over Budget';
                statusTextEl.classList.add('status-danger');
            }
        }

        budgetPercentEl.innerHTML = `<i class="fa-solid fa-calendar-check"></i> <span class="highlight-month">Budget status for ${monthName}</span>`;
    }

    function renderTransactions() {
        if (!transactionsListEl) return;
        transactionsListEl.innerHTML = '';

        const activeAccount = appData.accounts.find(a => a.active);
        let transactions = appData.transactions || [];

        // Update the page sub-title to reflect current view
        const historyTitle = document.querySelector('h3[style*="1.2rem"]');
        const monthName = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        if (historyTitle) historyTitle.textContent = `Full History: ${monthName}`;

        if (activeAccount) {
            transactions = transactions.filter(t => t.account_id === activeAccount.id);
        }
        
        // Filter by month ONLY if we are NOT on the history page (Dashboard view)
        const isHistoryPage = window.location.pathname.includes('transactions');
        if (!isHistoryPage) {
            const currentMonthDisplay = viewYear + '-' + String(viewMonth + 1).padStart(2, '0');
            transactions = transactions.filter(t => t.date && t.date.startsWith(currentMonthDisplay));
        }

        if (isHistoryPage) {
            const currentMonthStr = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            if (historyTitle) historyTitle.textContent = `Full Historical Ledger — All Records`;
        }

        // Stats Calculation (History)
        let totalHSpent = 0;
        let totalHIncome = 0;
        transactions.forEach(t => {
            if (t.type === 'expense') totalHSpent += (t.amount || 0);
            else totalHIncome += (t.amount || 0);
        });

        if (hSpentEl) hSpentEl.textContent = formatCurrency(totalHSpent);
        if (hIncomeEl) hIncomeEl.textContent = formatCurrency(totalHIncome);
        if (hCountEl) hCountEl.textContent = transactions.length;
        if (hAvgEl) hAvgEl.textContent = formatCurrency(transactions.length ? (totalHSpent + totalHIncome) / transactions.length : 0);

        // Search Filter
        const query = searchBox ? searchBox.value.toLowerCase() : '';
        if (query) {
            transactions = transactions.filter(t => 
                t.title.toLowerCase().includes(query) || 
                t.category.toLowerCase().includes(query)
            );
        }

        if (transactions.length === 0) {
            transactionsListEl.innerHTML = '<p style="text-align:center; padding:20px; color:#aaa;">No transactions match your search.</p>';
            return;
        }

        const displayList = isHistoryPage ? transactions : transactions.slice(0, 5); 

        displayList.forEach(t => {
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

    function renderSavingsGoals() {
        const goalsGrid = document.getElementById('goals-grid');
        if (!goalsGrid) return;

        const goals = appData.savings_goals || [];
        if (goals.length === 0) {
            goalsGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-bullseye"></i>
                    <h3>No Savings Goals Yet</h3>
                    <p>Start tracking your financial milestones today.</p>
                </div>`;
            return;
        }

        const colorPalettes = [
            { bg: 'rgba(108, 92, 231, 0.1)', color: '#6c5ce7', gradient: 'linear-gradient(90deg, #6c5ce7, #a29bfe)' },
            { bg: 'rgba(0, 184, 148, 0.1)', color: '#00b894', gradient: 'linear-gradient(90deg, #00b894, #55efc4)' },
            { bg: 'rgba(253, 203, 110, 0.1)', color: '#e17055', gradient: 'linear-gradient(90deg, #e17055, #fdcb6e)' },
            { bg: 'rgba(9, 132, 227, 0.1)', color: '#0984e3', gradient: 'linear-gradient(90deg, #0984e3, #74b9ff)' },
            { bg: 'rgba(232, 67, 147, 0.1)', color: '#e84393', gradient: 'linear-gradient(90deg, #e84393, #fd79a8)' }
        ];

        goalsGrid.innerHTML = goals.map((goal, index) => {
            const percent = Math.min((goal.current / goal.target) * 100, 100);
            const palette = colorPalettes[index % colorPalettes.length];
            
            return `
                <div class="goal-card">
                    <div class="goal-header">
                        <div class="goal-icon" style="background: ${palette.bg}; color: ${palette.color};"><i class="fa-solid ${goal.icon || 'fa-piggy-bank'}"></i></div>
                        <div class="header-actions">
                            <div class="delete-icon" onclick="deleteSavingsGoal(${goal.id})"><i class="fa-solid fa-trash"></i></div>
                        </div>
                    </div>
                    <div class="goal-info">
                        <h3>${goal.name}</h3>
                        <div class="goal-target">Target: ${formatCurrency(goal.target)}</div>
                    </div>
                    <div class="goal-progress-container">
                        <div class="progress-stats">
                            <span>${formatCurrency(goal.current)}</span>
                            <span style="color: ${palette.color}; font-weight: 800;">${percent.toFixed(0)}%</span>
                        </div>
                        <div class="goal-progress-bar">
                            <div class="goal-progress-fill" style="width: ${percent}%; background: ${palette.gradient}; box-shadow: 0 4px 10px ${palette.bg};"></div>
                        </div>
                    </div>
                    <div class="goal-footer">
                        <span class="goal-days">${formatCurrency(goal.target - goal.current)} remaining</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    function renderHorizontalGraph() {
        const graphContainer = document.getElementById('horizontal-spending-graph');
        if (!graphContainer) return;

        const transactions = appData.transactions || [];
        const currentMonthDisplay = viewYear + '-' + String(viewMonth + 1).padStart(2, '0');
        const activeAccount = appData.accounts.find(a => a.active);

        const categoryTotals = {};
        transactions.forEach(t => {
            if (t.type === 'expense' && t.date && t.date.startsWith(currentMonthDisplay)) {
                if (activeAccount && t.account_id !== activeAccount.id) return;
                categoryTotals[t.category] = (categoryTotals[t.category] || 0) + (t.amount || 0);
            }
        });

        graphContainer.innerHTML = '';
        const entries = Object.entries(categoryTotals).sort((a,b) => b[1] - a[1]);

        if (entries.length === 0) {
            graphContainer.innerHTML = '<p style="text-align:center; padding:20px; color:#aaa;">No expenses to show for this period.</p>';
            return;
        }

        const maxVal = Math.max(...entries.map(e => e[1]));

        entries.forEach(([category, amount]) => {
            const percent = (amount / maxVal) * 100;
            const barHtml = `
                <div style="margin-bottom: 2rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-weight: 600; font-size: 0.95rem;">
                        <span>${category}</span>
                        <span style="color: var(--primary-color);">${formatCurrency(amount)}</span>
                    </div>
                    <div style="height: 12px; background: #f1f2f6; border-radius: 6px; overflow: hidden;">
                        <div style="width: ${percent}%; height: 100%; background: linear-gradient(90deg, #a29bfe 0%, #6c5ce7 100%); border-radius: 6px; transition: width 0.8s ease-out;"></div>
                    </div>
                </div>
            `;
            graphContainer.innerHTML += barHtml;
        });
    }

    function renderSummaryCards() {
        const summaryGrid = document.getElementById('summary-cards');
        if (!summaryGrid) return;

        const activeAccount = appData.accounts.find(a => a.active);
        let targetBalance = activeAccount ? activeAccount.balance : appData.accounts.reduce((sum, acc) => sum + acc.balance, 0);
        let balanceLabel = activeAccount ? activeAccount.name + " Balance" : "Total Balance";
        
        let monthlyIncome = 0;
        let monthlyExpense = 0;

        const currentMonth = viewYear + '-' + String(viewMonth + 1).padStart(2, '0');
        appData.transactions.forEach(t => {
            if (t.date && t.date.startsWith(currentMonth)) {
                if (activeAccount && t.account_id !== activeAccount.id) return;
                
                if (t.type === 'income') monthlyIncome += t.amount;
                else monthlyExpense += t.amount;
            }
        });

        summaryGrid.innerHTML = `
            <div class="card summary-card">
                <div class="card-icon blue"><i class="fa-solid fa-wallet"></i></div>
                <div class="card-info">
                    <span class="card-label" style="text-overflow: ellipsis; white-space: nowrap; overflow: hidden; max-width: 150px;" title="${balanceLabel}">${balanceLabel}</span>
                    <h3 class="card-value">${formatCurrency(targetBalance)}</h3>
                </div>
            </div>
            <div class="card summary-card">
                <div class="card-icon green"><i class="fa-solid fa-arrow-trend-up"></i></div>
                <div class="card-info">
                    <span class="card-label">Monthly Income</span>
                    <h3 class="card-value income">${formatCurrency(monthlyIncome)}</h3>
                </div>
            </div>
            <div class="card summary-card">
                <div class="card-icon red"><i class="fa-solid fa-arrow-trend-down"></i></div>
                <div class="card-info">
                    <span class="card-label">Monthly Expense</span>
                    <h3 class="card-value expense">${formatCurrency(monthlyExpense)}</h3>
                </div>
            </div>
        `;
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


    // Helper Functions
    function formatCurrency(amount) {
        return '₹' + parseFloat(amount).toFixed(2);
    }

    function formatDate(dateString) {
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    function showSuccessMessage(message) {
        const existingToast = document.getElementById('success-toast');
        if (existingToast) {
            existingToast.remove();
        }
        
        const toast = document.createElement('div');
        toast.id = 'success-toast';
        toast.style.cssText = `
            position: fixed;
            bottom: 40px;
            right: 40px;
            background: var(--primary-gradient);
            backdrop-filter: blur(10px);
            color: white;
            padding: 18px 32px;
            border-radius: 20px;
            box-shadow: 0 15px 35px rgba(108, 92, 231, 0.3);
            font-weight: 700;
            z-index: 1000;
            animation: slideIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-in-out';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
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
                <div class="account-card ${activeClass}" onclick="toggleAccount('${acc.id}', event)" style="cursor: pointer;">
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
        if (!targetAccount) return; 

        // Always show success even if clicking the active one to confirm "selection"
        showSuccessMessage(`Switched to ${targetAccount.name}`);
        
        if (targetAccount.active) return; 

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

    // Savings Goals Modal & Handlers
    const addGoalBtn = document.getElementById('add-goal-btn');
    const addGoalModal = document.getElementById('add-goal-modal');
    const addGoalForm = document.getElementById('add-goal-form');

    if (addGoalBtn) {
        addGoalBtn.onclick = () => addGoalModal.classList.add('show');
    }

    if (addGoalForm) {
        addGoalForm.onsubmit = async (e) => {
            e.preventDefault();
            const goalData = {
                name: document.getElementById('goal-name').value,
                target: parseFloat(document.getElementById('goal-target').value),
                current: parseFloat(document.getElementById('goal-current').value || 0),
                icon: document.getElementById('goal-icon').value
            };

            try {
                const response = await fetch('/api/savings_goals', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(goalData)
                });

                if (response.ok) {
                    addGoalModal.classList.remove('show');
                    addGoalForm.reset();
                    showSuccessMessage("Goal created successfully!");
                    fetchData();
                }
            } catch (err) {
                console.error(err);
            }
        };
    }

    window.deleteSavingsGoal = async (id) => {
        if (!confirm("Are you sure you want to delete this goal?")) return;
        try {
            const response = await fetch('/api/delete_savings_goal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });

            if (response.ok) {
                showSuccessMessage("Goal deleted");
                fetchData();
            }
        } catch (err) {
            console.error(err);
        }
    };
});
