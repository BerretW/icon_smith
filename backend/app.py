from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
import jwt
import datetime
import json
from config import DB_CONFIG, SECRET_KEY

app = Flask(__name__)
CORS(app) # Povolí komunikaci s React frontendem

def get_db_connection():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except mysql.connector.Error as err:
        print(f"Chyba pripojeni k DB: {err}")
        return None

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "Chybí jméno nebo heslo"}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Chyba databáze"}), 500

    cursor = conn.cursor(dictionary=True)
    
    # Poznámka: V produkci by hesla měla být hashovaná (např. bcrypt).
    # Zde porovnáváme plain text nebo hash uložený v DB podle zadání.
    query = "SELECT * FROM web_users WHERE user = %s"
    cursor.execute(query, (username,))
    user = cursor.fetchone()
    
    cursor.close()
    conn.close()

    if user and user['password'] == password:
        # Vytvoření JWT tokenu
        token = jwt.encode({
            'user_id': user['id'],
            'user': user['user'],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, SECRET_KEY, algorithm="HS256")

        # Zpracování permissions (perm sloupec je JSON string)
        perms = {}
        try:
            if user['perm']:
                perms = json.loads(user['perm'])
        except:
            perms = {}

        return jsonify({
            "token": token,
            "user": {
                "id": user['id'],
                "username": user['user'],
                "email": user['email'],
                "perms": perms
            }
        })
    else:
        return jsonify({"error": "Neplatné přihlašovací údaje"}), 401

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "running"}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)