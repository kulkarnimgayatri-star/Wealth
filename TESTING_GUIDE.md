# Money Pilot - Quick Testing Guide

## 🧪 How to Test the Improvements

### Prerequisites
1. Ensure Flask is running: `python app.py`
2. Open browser: `http://localhost:5000`
3. Login with existing account or create new one

---

## ✅ Test 1: Settings Page (Fixed)

**Location:** Dashboard → Click "Settings" in sidebar

**What to verify:**
```
☑ Account Information Section displays:
  - Email address (should show user's email)
  - Account creation date
  - Total number of accounts

☑ Notification Preferences Section:
  - Budget Alerts toggle (checked by default)
  - High Spending Warning toggle (checked by default)
  - Monthly Summary Report toggle
  - Notification email input field
  - "Save Email" button works

☑ Data & Backup Section:
  - "Export as CSV" button (click to download transactions.csv)
  - "Export as JSON" button (click to download export.json)

☑ Help & Support Section:
  - FAQ items display correctly
  - "Contact Support" button visible

☑ NO broken elements:
  - No "Change Password" placeholder
  - No "Two-Factor Authentication" toggle
  - All buttons are functional or hidden
```

---

## ✅ Test 2: Consolidated Budget System

**Location:** Dashboard

**What to verify:**
```
☑ Budget card header shows: "Budget Status (Current Month)"
☑ Budget card displays category-based totals:
  - Not account-based
  - Shows sum of all category budgets
  - Shows sum of all expenses in those categories

Example: "₹2,505.00 of ₹5,000 budgeted"

☑ No mention of "account budget" or "account-level budget"

☑ Dashboard budget progress bar:
  - Updates based on category budgets, not account limits
  - Shows percentage used correctly

☑ If no budgets are set:
  - Shows: "No budgets set"
  - Provides link to Budgets page
```

**Test Budget System:**
1. Go to Budgets page
2. Set a budget for "Food": ₹2,000
3. Set a budget for "Entertainment": ₹1,000
4. Go back to Dashboard
5. Verify budget card shows ₹3,000 total budgeted
6. Add a ₹500 Food expense
7. Verify dashboard shows ₹500 spent of ₹3,000 (16.67%)

---

## ✅ Test 3: Transaction Search & Filter

**Location:** Dashboard → Click "Transactions"

**What to verify:**
```
☑ Filter Transactions section visible with:
  - Search input (by title or category)
  - Type dropdown (All, Income, Expense)
  - Category dropdown (populated from data)
  - Month dropdown (populated from data)
  - Clear Filters button

☑ Search functionality:
  - Type "lunch" → shows matching transactions
  - Type "food" → shows Food category transactions
  - Case-insensitive search works

☑ Type Filter:
  - Select "Income" → shows only income transactions
  - Select "Expense" → shows only expense transactions
  - Empty = "All Types"

☑ Category Filter:
  - Populated with actual categories from your data
  - Dropdown includes: Food, Clothing, Travel, etc.
  - Selecting a category filters correctly

☑ Month Filter:
  - Shows months with transactions
  - Sorted newest to oldest
  - Example format: "March 2026"
  - Selecting a month filters to that month only

☑ Clear Filters:
  - Clears all filters when clicked
  - Resets to showing all transactions

☑ Multi-filter:
  - Combine search + type + category + month
  - All work together correctly

☑ Transaction Count:
  - Shows "(5 transactions)" or "(1 transaction)"
  - Updates as you filter
```

**Quick Test:**
```
1. Search "zara" → Shows clothing-related transactions
2. Filter by "Clothing" category → Shows Clothing expenses
3. Select "March-2026" month → Shows March transactions
4. Click "Clear Filters" → Shows all transactions
5. Verify count updates each time
```

---

## ✅ Test 4: Spending Insights (New Feature)

**Location:** Dashboard → Click "Analytics"

**What to verify:**
```
☑ Insights strip appears ABOVE KPI cards

☑ Insight cards display (may vary based on your data):
  - Top spending category with amount
  - Month-over-month comparison
  - Budget status (if budgets are set)
  - Average transaction value
  - Income vs Expense analysis

Example insights:
  "Your top spending: ₹5,000 on Clothing"
  "You're spending 20% more than last month"
  "Budget exceeded for Clothing: 150%"
  "Average transaction: ₹2,500"
  "You're saving 25% of your income"

☑ Card colors are correct:
  - Green (success): Positive insights
  - Orange (warning): Approaching limits
  - Red (alert): Exceeded budgets
  - Blue (info): Information

☑ Card icons display correctly:
  - Spending icon for top category
  - Trend icon for comparisons
  - Warning icon for budget alerts
  - Piggy bank icon for savings

☑ Cards are clickable/hoverable (subtle effect)
```

**How to trigger different insights:**
```
To see budget warnings:
1. Set a Food budget: ₹1,000
2. Add a ₹1,200 Food expense
3. Go to Analytics
4. Should see alert: "Budget exceeded for Food: 120%"

To see savings insight:
1. Have ₹10,000 income in current month
2. Have ₹7,000 expenses in current month
3. Go to Analytics
4. Should see: "You're saving 30% of your income"

To see month-over-month comparison:
1. Have transactions in current month
2. Have transactions in previous month (different amounts)
3. Go to Analytics
4. Should see comparison showing % change
```

---

## ✅ Test 5: Data Export (Settings)

**Location:** Settings → Data & Backup section

**What to verify:**
```
☑ Export as CSV button:
  - Click it
  - Browser downloads "money-pilot-transactions.csv"
  - File contains columns: Date, Title, Category, Amount, Type, Account
  - All transactions are included

☑ Export as JSON button:
  - Click it
  - Browser downloads "money-pilot-export.json"
  - Contains your full data structure
  - Can open in text editor to verify

☑ Success toast message:
  - "Data exported as CSV!" appears briefly
  - "Data exported as JSON!" appears briefly
  - Toast disappears after 3 seconds
```

---

## 🐛 Common Issues & Fixes

### Issue: Budget card shows "No budgets set"
**Solution:** Go to Budgets page and add at least one category budget

### Issue: Insights don't show on Analytics
**Solution:** 
- Refresh the page
- Ensure you have transactions in current month
- Check browser console for errors (F12)

### Issue: Transaction filters not working
**Solution:**
- Refresh page
- Ensure you have transactions with data
- Check that amounts/categories are filled in

### Issue: Export downloads empty file
**Solution:**
- Ensure you have transactions
- Check that transactions have all required fields

---

## 📊 Data Requirements for Full Testing

For best experience, your data should have:
```
✓ At least 5 transactions
✓ Mix of income and expense transactions
✓ Multiple categories (Food, Travel, Shopping, etc.)
✓ Transactions from current month
✓ Transactions from previous month (for insights)
✓ At least one category budget set
```

---

## 🎯 Success Criteria

All improvements are working if:

✅ Settings page shows ONLY functional features  
✅ No broken buttons or placeholders on Settings  
✅ Budget card shows category-based totals  
✅ Transaction filters work (search, type, category, month)  
✅ Clear filters button resets all filters  
✅ Analytics page shows 2-6 insight cards  
✅ Insight cards are color-coded correctly  
✅ Export buttons download files  
✅ Success messages appear when exporting  

---

## 🔍 Browser Developer Tools

If something doesn't work:

1. **F12** - Open Developer Tools
2. **Console tab** - Check for JavaScript errors
3. **Network tab** - Verify API calls are reaching `/api/spending_insights`
4. **Application tab** - Check session data

---

## 📞 Support

If you encounter issues:

1. Check that Flask is running on port 5000
2. Clear browser cache (Ctrl+Shift+Delete)
3. Refresh page (F5)
4. Check browser console for errors
5. Verify all files were modified correctly

