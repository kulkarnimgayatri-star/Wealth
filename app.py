from flask import Flask, render_template, jsonify, request
import json
import os

app = Flask(__name__)
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
def index():
    return render_template('index.html')

@app.route('/transactions')
def transactions():
    return render_template('transactions.html')

@app.route('/api/data', methods=['GET'])
def get_data():
    data = load_data()
    return jsonify(data)

@app.route('/api/update', methods=['POST'])
def update_data():
    new_data = request.json
    current_data = load_data()
    
    # Simple merge strategy: keys present in new_data overwrite current_data
    for key, value in new_data.items():
        current_data[key] = value
        
    save_data(current_data)
    return jsonify({"status": "success", "data": current_data})

@app.route('/api/add_transaction', methods=['POST'])
def add_transaction():
    transaction = request.json
    data = load_data()
    
    # Generate ID
    new_id = 1
    if data['transactions']:
        new_id = max(t['id'] for t in data['transactions']) + 1
    
    transaction['id'] = new_id
    data['transactions'].insert(0, transaction) # Add to top
    
    # Update Account Balance
    account_id = transaction.get('account_id')
    amount = float(transaction.get('amount'))
    trans_type = transaction.get('type')

    for acc in data['accounts']:
        if acc['id'] == account_id:
            if trans_type == 'income':
                acc['balance'] += amount
            elif trans_type == 'expense':
                acc['balance'] -= amount
            break

    save_data(data)
    return jsonify({"status": "success", "transaction": transaction})

@app.route('/api/toggle_account', methods=['POST'])
def toggle_account():
    account_id = request.json.get('id')
    data = load_data()
    
    for acc in data['accounts']:
        if acc['id'] == account_id:
            acc['active'] = True
        else:
            acc['active'] = False
    
    save_data(data)
    return jsonify({"status": "success"})

@app.route('/api/add_account', methods=['POST'])
def add_account():
    new_account = request.json
    data = load_data()
    
    # Generate ID
    new_id = new_account['name'].lower().replace(' ', '_') + '_' + str(len(data['accounts']) + 1)
    
    # Check duplicate ID? (Simple override for now to prevent crash)
    
    account_obj = {
        "id": new_id,
        "name": new_account['name'],
        "type": new_account['type'],
        "balance": float(new_account['balance']),
        "balance": float(new_account['balance']),
        "active": False, # Default to inactive
        "budget_limit": 10000.0
    }
    
    data['accounts'].append(account_obj)
    save_data(data)
    

    return jsonify({"status": "success", "account": account_obj})

@app.route('/api/delete_account', methods=['POST'])
def delete_account():
    account_id = request.json.get('id')
    data = load_data()
    
    # Remove Account
    data['accounts'] = [acc for acc in data['accounts'] if acc['id'] != account_id]
    
    # Remove associated transactions
    data['transactions'] = [t for t in data['transactions'] if t['account_id'] != account_id]
    
    save_data(data)
    return jsonify({"status": "success"})

@app.route('/api/update_budget', methods=['POST'])
def update_budget():
    req_data = request.json
    account_id = req_data.get('account_id')
    new_limit = float(req_data.get('new_limit'))
    
    data = load_data()
    for acc in data['accounts']:
        if acc['id'] == account_id:
            acc['budget_limit'] = new_limit
            break
            
    save_data(data)
    return jsonify({"status": "success"})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
