from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///transactions.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False)
    description = db.Column(db.String(200), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    type = db.Column(db.String(10), nullable=False)
    amount = db.Column(db.Float, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'date': self.date.isoformat(),
            'description': self.description,
            'category': self.category,
            'type': self.type,
            'amount': self.amount
        }

with app.app_context():
    db.create_all()

@app.route('/', methods=['GET'])
def index():
    filter_category = request.args.get('category', 'all')
    filter_type = request.args.get('type', 'all')
    filter_year = request.args.get('year', 'all')
    filter_month = request.args.get('month', 'all')
    
    query = Transaction.query.order_by(Transaction.date.desc())

    if filter_category != 'all':
        query = query.filter_by(category=filter_category)
    if filter_type != 'all':
        query = query.filter_by(type=filter_type)
    if filter_year != 'all':
        query = query.filter(db.extract('year', Transaction.date) == int(filter_year))
    if filter_month != 'all':
        query = query.filter(db.extract('month', Transaction.date) == int(filter_month))

    transactions_from_db = query.all()
    
    transactions_list = [t.to_dict() for t in transactions_from_db]
    
    total_income = sum(t.amount for t in transactions_from_db if t.type == 'income')
    total_expenses = sum(t.amount for t in transactions_from_db if t.type == 'expense')
    net_balance = total_income - total_expenses
    
    summary = {
        'income': total_income,
        'expenses': total_expenses,
        'balance': net_balance
    }

    months = ["January", "February", "March", "April", "May", "June", 
              "July", "August", "September", "October", "November", "December"]
    
    return render_template('index.html', 
                           transactions=transactions_list, 
                           summary=summary,
                           selected_category=filter_category,
                           selected_type=filter_type,
                           selected_year=filter_year,
                           selected_month=filter_month,
                           months=months)

@app.route('/api/transactions', methods=['POST'])
def add_transaction():
    data = request.json
    new_transaction = Transaction(
        date=datetime.strptime(data['date'], '%Y-%m-%d').date(),
        description=data['description'],
        category=data['category'],
        type=data['type'],
        amount=float(data['amount'])
    )
    db.session.add(new_transaction)
    db.session.commit()
    return jsonify(new_transaction.to_dict()), 201

@app.route('/api/transactions/<int:id>', methods=['DELETE'])
def delete_transaction(id):
    transaction = Transaction.query.get_or_404(id)
    db.session.delete(transaction)
    db.session.commit()
    return '', 204

@app.route('/api/transactions/<int:id>', methods=['PUT'])
def update_transaction(id):
    transaction = Transaction.query.get_or_404(id)
    data = request.json
    transaction.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
    transaction.description = data['description']
    transaction.category = data['category']
    transaction.type = data['type']
    transaction.amount = float(data['amount'])
    db.session.commit()
    return jsonify(transaction.to_dict())

if __name__ == '__main__':
    app.run(debug=True)
