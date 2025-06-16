import sqlite3
import xml.etree.ElementTree as ET
import logging
import re

# Set up logging
logging.basicConfig(filename='data/unprocessed.log', level=logging.INFO)

# Connect to SQLite database
conn = sqlite3.connect('database/momo_data.db')
cursor = conn.cursor()

# Create table if not exists
cursor.execute('''
    CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        sender TEXT,
        receiver TEXT,
        description TEXT
    )
''')

# Parse XML file
tree = ET.parse('data/modified_sms_v2.xml')
root = tree.getroot()

# Process each SMS
for sms in root.findall('sms'):
    body = sms.get('body', '')
    date_timestamp = sms.get('date', '')
    description = body

    # Categorize transaction type based on keywords
    if 'received' in body.lower():
        transaction_type = 'Incoming Money'
        sender_match = re.search(r'from\s+(.+?)(?:\s*\(|$)', body)
        sender = sender_match.group(1) if sender_match else 'Unknown'
        receiver = 'Self'
    elif 'payment of' in body.lower() and 'to' in body.lower() and any(d in body.lower() for d in ['code', '12845', '95464']):
        transaction_type = 'Payments to Code Holders'
        receiver_match = re.search(r'to\s+(.+?)(?:\s+\d+|$)', body)
        receiver = receiver_match.group(1) if receiver_match else 'Unknown'
        sender = 'Self'
    elif 'transferred to' in body.lower() or '*165*S*' in body:
        transaction_type = 'Transfers to Mobile Numbers'
        receiver_match = re.search(r'to\s+(.+?)(?:\s*\(|$)', body)
        receiver = receiver_match.group(1) if receiver_match else 'Unknown'
        sender_match = re.search(r'from\s+(.+?)(?:\s*\(|$)', body)
        sender = sender_match.group(1) if sender_match else 'Unknown'
    elif 'bank deposit' in body.lower():
        transaction_type = 'Bank Deposits'
        sender = 'Bank'
        receiver = 'Self'
    elif 'airtime' in body.lower():
        transaction_type = 'Airtime Bill Payments'
        sender = 'Self'
        receiver = 'Service Provider'
    elif 'cash power' in body.lower():
        transaction_type = 'Cash Power Bill Payments'
        sender = 'Self'
        receiver = 'Utility'
    elif 'withdrawal' in body.lower() or 'agent' in body.lower():
        transaction_type = 'Withdrawals from Agents'
        sender = 'Self'
        receiver = re.search(r'agent:\s+(.+?)(?:\s*\(|$)', body).group(1) if re.search(r'agent:\s+(.+?)(?:\s*\(|$)', body) else 'Agent'
    elif 'reversal' in body.lower() or 'initiated' in body.lower():
        transaction_type = 'Transactions Initiated by Third Parties'
        sender = 'Third Party'
        receiver_match = re.search(r'to\s+(.+?)(?:\s*\(|$)', body)
        receiver = receiver_match.group(1) if receiver_match else 'Unknown'
    elif 'bank transfer' in body.lower() or 'transfer to' in body.lower():
        transaction_type = 'Bank Transfers'
        sender = 'Self'
        receiver = 'Bank'
    elif 'bundle' in body.lower() or 'data bundle' in body.lower():
        transaction_type = 'Internet and Voice Bundle Purchases'
        sender = 'Self'
        receiver = 'Service Provider'
    else:
        transaction_type = 'Unknown'
        logging.info(f"Unprocessed message: {body}")
        continue

    # Extract and clean amount
    amount_match = re.search(r'(\d{1,3}(?:,\d{3})*|\d+)\s?RWF', body)
    amount = float(amount_match.group(1).replace(',', '')) if amount_match else 0.0

    # Convert timestamp to readable date
    from datetime import datetime
    date = datetime.fromtimestamp(int(date_timestamp) / 1000).strftime('%Y-%m-%d')

    # Insert into database
    cursor.execute('''
        INSERT INTO transactions (type, amount, date, sender, receiver, description)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (transaction_type, amount, date, sender, receiver, description))

# Commit changes and close connection
conn.commit()
conn.close()

print("Data processing complete!")