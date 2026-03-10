from flask import Flask, render_template, jsonify, request, session, redirect, url_for
import json
import os
from datetime import datetime
import config
import email_utils

app = Flask(__name__)
app.secret_key = 'super-secret-key-for-session' # In production, use a secure random key
DATA_FILE = 'data.json'

def load_data():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_data(data):
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=2)

@app.route('/')
def landing_page():
    return render_template('landing.html')

@app.route('/login')
def login_page():
    return render_template('login.html')

@app.route('/signup')
def signup():
    return render_template('signup.html')

@app.route('/dashboard')
def index():
    if 'user_email' not in session:
        return redirect(url_for('login_page'))
    return render_template('index.html')

@app.route('/api/signup', methods=['POST'])
def api_signup():
    user_data = request.json
    email = user_data.get('email')
    password = user_data.get('password')
    name = user_data.get('name')
    
    if not email or not password:
        return jsonify({"status": "error", "message": "Email and password required"}), 400
        
    data = load_data()
    if 'users' not in data:
        data['users'] = {}
        
    if email in data['users']:
        return jsonify({"status": "error", "message": "User already exists"}), 400
        
    data['users'][email] = {
        "password": password,
        "name": name,
        "data": {
            "accounts": [],
            "transactions": [],
            "category_budgets": {}
        }
    }
    save_data(data)
    
    session['user_email'] = email
    return jsonify({"status": "success", "message": "Account created successfully"})

@app.route('/api/login', methods=['POST'])
def api_login():
    user_data = request.json
    email = user_data.get('email')
    password = user_data.get('password')
    
    data = load_data()
    users = data.get('users', {})
    
    if email in users and users[email]['password'] == password:
        session['user_email'] = email
        return jsonify({"status": "success", "message": "Logged in successfully"})
    
    return jsonify({"status": "error", "message": "Invalid email or password"}), 401

@app.route('/logout')
def logout():
    session.pop('user_email', None)
    return redirect(url_for('login_page'))

@app.route('/transactions')
def transactions():
    return render_template('transactions.html')

@app.route('/analytics')
def analytics():
    return render_template('analytics.html')

@app.route('/budgets')
def budgets():
    return render_template('budgets.html')

@app.route('/settings')
def settings():
    return render_template('settings.html')

@app.route('/api/data', methods=['GET'])
def get_data():
    if 'user_email' not in session:
        return jsonify({"error": "Unauthorized"}), 401
    
    all_data = load_data()
    email = session['user_email']
    user_info = all_data.get('users', {}).get(email, {})
    user_data = user_info.get('data', {
        "accounts": [],
        "transactions": [],
        "category_budgets": {}
    })
    return jsonify(user_data)

@app.route('/api/update', methods=['POST'])
def update_data():
    if 'user_email' not in session:
        return jsonify({"error": "Unauthorized"}), 401
        
    new_data = request.json
    all_data = load_data()
    email = session['user_email']
    
    if email not in all_data['users']:
        return jsonify({"status": "error", "message": "User not found"}), 404
        
    if 'data' not in all_data['users'][email]:
        all_data['users'][email]['data'] = {
            "accounts": [],
            "transactions": [],
            "category_budgets": {}
        }
    
    user_data = all_data['users'][email]['data']
    for key, value in new_data.items():
        user_data[key] = value
        
    save_data(all_data)
    return jsonify({"status": "success", "data": user_data})

@app.route('/api/add_transaction', methods=['POST'])
def add_transaction():
    if 'user_email' not in session:
        return jsonify({"error": "Unauthorized"}), 401
        
    transaction = request.json
    all_data = load_data()
    email = session['user_email']
    user_data = all_data['users'][email].get('data', {"accounts": [], "transactions": [], "category_budgets": {}})
    
    # Generate ID
    new_id = 1
    if user_data['transactions']:
        new_id = max(t['id'] for t in user_data['transactions']) + 1
    
    # Find and validate account
    target_account = None
    for acc in user_data['accounts']:
        if acc['id'] == account_id:
            target_account = acc
            break
            
    if not target_account:
        return jsonify({"status": "error", "message": "Account not found"}), 404

    # Validate balance for expenses
    if trans_type == 'expense' and target_account['balance'] < amount:
        return jsonify({"status": "error", "message": f"Insufficient balance in {target_account['name']}!"}), 400

    transaction['id'] = new_id
    user_data['transactions'].insert(0, transaction) # Add to top
    
    # Update Account Balance
    if trans_type == 'income':
        target_account['balance'] += amount
    elif trans_type == 'expense':
        target_account['balance'] -= amount

    save_data(all_data)
    
    # Check category budget and send notification if exceeded
    if trans_type == 'expense' and 'category_budgets' in user_data:
        category = transaction.get('category')
        limit = user_data['category_budgets'].get(category, 0)
        
        if limit > 0:
            now = datetime.now()
            current_month = now.strftime("%Y-%m")
            
            total_spent = 0
            for t in user_data['transactions']:
                if t['category'] == category and t['type'] == 'expense':
                    t_date_str = t.get('date', "")
                    if t_date_str:
                        try:
                            ym = t_date_str[:7]
                            if ym == current_month:
                                total_spent += float(t.get('amount', 0))
                        except (ValueError, TypeError):
                            continue
            
            if total_spent > limit:
                email_utils.send_budget_exceeded_notification(category, total_spent, limit, email)

    return jsonify({"status": "success", "transaction": transaction})

@app.route('/api/toggle_account', methods=['POST'])
def toggle_account():
    if 'user_email' not in session:
        return jsonify({"error": "Unauthorized"}), 401
    account_id = request.json.get('id')
    all_data = load_data()
    email = session['user_email']
    user_data = all_data['users'][email].get('data', {"accounts": []})
    
    for acc in user_data['accounts']:
        if acc['id'] == account_id:
            acc['active'] = True
        else:
            acc['active'] = False
    
    save_data(all_data)
    return jsonify({"status": "success"})

@app.route('/api/add_account', methods=['POST'])
def add_account():
    if 'user_email' not in session:
        return jsonify({"error": "Unauthorized"}), 401
    new_account = request.json
    all_data = load_data()
    email = session['user_email']
    user_data = all_data['users'][email].get('data', {"accounts": []})
    
    # Generate ID
    new_id = new_account['name'].lower().replace(' ', '_') + '_' + str(len(user_data['accounts']) + 1)
    
    account_obj = {
        "id": new_id,
        "name": new_account['name'],
        "type": new_account['type'],
        "balance": float(new_account['balance']),
        "active": False,
        "budget_limit": 10000.0
    }
    
    user_data['accounts'].append(account_obj)
    save_data(all_data)

    return jsonify({"status": "success", "account": account_obj})

@app.route('/api/delete_account', methods=['POST'])
def delete_account():
    if 'user_email' not in session:
        return jsonify({"error": "Unauthorized"}), 401
    account_id = request.json.get('id')
    all_data = load_data()
    email = session['user_email']
    user_data = all_data['users'][email].get('data', {"accounts": [], "transactions": []})
    
    # Remove Account
    user_data['accounts'] = [acc for acc in user_data['accounts'] if acc['id'] != account_id]
    
    # Remove associated transactions
    user_data['transactions'] = [t for t in user_data['transactions'] if t['account_id'] != account_id]
    
    save_data(all_data)
    return jsonify({"status": "success"})

@app.route('/api/update_budget', methods=['POST'])
def update_budget():
    if 'user_email' not in session:
        return jsonify({"error": "Unauthorized"}), 401
    req_data = request.json
    account_id = req_data.get('account_id')
    new_limit = float(req_data.get('new_limit'))
    
    all_data = load_data()
    email = session['user_email']
    user_data = all_data['users'][email].get('data', {"accounts": []})
    
    for acc in user_data['accounts']:
        if acc['id'] == account_id:
            acc['budget_limit'] = new_limit
            break
            
    save_data(all_data)
    return jsonify({"status": "success"})

@app.route('/api/get_category_budgets', methods=['GET'])
def get_category_budgets():
    if 'user_email' not in session:
        return jsonify({"error": "Unauthorized"}), 401
    all_data = load_data()
    email = session['user_email']
    user_data = all_data['users'][email].get('data', {"category_budgets": {}})
    return jsonify(user_data.get('category_budgets', {}))

@app.route('/api/set_category_budget', methods=['POST'])
def set_category_budget():
    if 'user_email' not in session:
        return jsonify({"error": "Unauthorized"}), 401
    req_data = request.json
    category = req_data.get('category')
    limit = float(req_data.get('limit', 0))
    all_data = load_data()
    email = session['user_email']
    user_data = all_data['users'][email].get('data', {"category_budgets": {}})
    
    if 'category_budgets' not in user_data:
        user_data['category_budgets'] = {}
    user_data['category_budgets'][category] = limit
    
    # Ensure current user has the 'data' structure
    all_data['users'][email]['data'] = user_data
    
    save_data(all_data)
    return jsonify({"status": "success"})

@app.route('/api/delete_category_budget', methods=['POST'])
def delete_category_budget():
    if 'user_email' not in session:
        return jsonify({"error": "Unauthorized"}), 401
    req_data = request.json
    category = req_data.get('category')
    all_data = load_data()
    email = session['user_email']
    user_data = all_data['users'][email].get('data', {"category_budgets": {}})
    
    if 'category_budgets' in user_data and category in user_data['category_budgets']:
        del user_data['category_budgets'][category]
    
    save_data(all_data)
    return jsonify({"status": "success"})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
