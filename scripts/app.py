from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3
import os

app = Flask(__name__, static_folder='../static')  # Point to the parent directory's static folder
CORS(app)  # Enable CORS for all routes

@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    try:
        # Use an absolute path to ensure consistency
        db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../database/momo_data.db')
        print(f"Attempting to connect to: {db_path}")
        conn = sqlite3.connect(db_path)  # Use resolved path
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM transactions")
        rows = cursor.fetchall()
        conn.close()
        return jsonify([dict(row) for row in rows])
    except sqlite3.OperationalError as e:
        print(f"Database error: {e}")
        return jsonify({"error": "Unable to access database"}), 500
    except Exception as e:
        print(f"Unexpected error: {e}")
        return jsonify({"error": "An unexpected error occurred"}), 500

@app.route('/')
def index():
    return send_from_directory('..', 'index.html')  # Serve index.html from the parent directory

if __name__ == '__main__':
    app.run(debug=True, port=5000)