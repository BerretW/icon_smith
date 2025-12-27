from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
import jwt
import datetime
import io
import base64
from functools import wraps

# Importy pro Google AI a práci s obrázky
from google import genai
from PIL import Image

# Import pro ověřování hesel (Scrypt)
from passlib.hash import scrypt

from config import DB_CONFIG, SECRET_KEY, GEMINI_API_KEY, GEMINI_MODEL

app = Flask(__name__)
CORS(app)

# Inicializace klienta
try:
    client = genai.Client(api_key=GEMINI_API_KEY)
except Exception as e:
    print(f"Chyba init klienta: {e}")

# --- DB Helper ---
def get_db_connection():
    try:
        return mysql.connector.connect(**DB_CONFIG)
    except mysql.connector.Error as err:
        print(f"Chyba DB: {err}")
        return None

# --- Auth Decorator ---
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(" ")[1]
        
        if not token:
            return jsonify({'error': 'Token chybí!'}), 401
        
        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            current_user_id = data['user_id']
        except:
            return jsonify({'error': 'Token neplatný!'}), 401
        
        return f(current_user_id, *args, **kwargs)
    return decorated

# --- LOGIN (s opravou Scrypt) ---
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB Error"}), 500
    
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM web_users WHERE user = %s", (username,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()

    if user:
        # Ověření hashe pomocí Scrypt (passlib)
        try:
            # Passlib automaticky detekuje nastavení z hashe v DB
            if scrypt.verify(password, user['password']):
                token = jwt.encode({
                    'user_id': user['id'],
                    'user': user['user'],
                    'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
                }, SECRET_KEY, algorithm="HS256")
                
                return jsonify({
                    "token": token, 
                    "user": {"username": user['user']}
                })
        except Exception as e:
            print(f"Chyba overeni hesla: {e}")
            pass
    
    return jsonify({"error": "Neplatné údaje"}), 401

# --- GENERATE ENDPOINT (Opravený) ---
# ... (importy zůstávají stejné)

@app.route('/api/generate', methods=['POST'])
@token_required
def generate_icon(current_user_id):
    data = request.get_json()
    prompt = data.get('prompt')
    style_mode = data.get('style', 'inventory')
    color_mode = data.get('colorMode', 'bw')

    if not prompt:
        return jsonify({'error': 'Chybí prompt'}), 400

    # 1. Sestavení Promptu
    style_desc = ""
    if color_mode == 'color':
        style_desc = "Style: RDR2 catalog illustration. Vintage watercolor aesthetic. Isolated on transparent background. Without decorative borders."
    else:
        style_desc = "Style: RDR2 inventory icon. Black woodcut/ink style. High contrast. Thick Lines. Isolated on transparent background."

    final_prompt = f"{style_desc} Subject: {prompt}. REQUIREMENTS: NO TEXT. 100% transparent background."

    try:
        print(f"Generuji model: {GEMINI_MODEL}...")

        # 2. Volání API
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=final_prompt
        )

        # 3. Zpracování odpovědi - PŘÍMÝ PŘÍSTUP K DATŮM
        base64_url = None

        if response.parts:
            for part in response.parts:
                if part.inline_data:
                    # Zde je oprava: Neunavujeme se s PIL.Image wrapperem.
                    # Vezmeme surová binární data obrázku.
                    raw_bytes = part.inline_data.data
                    
                    # Zjistíme MIME typ (např. image/png nebo image/jpeg), defaultně png
                    mime_type = part.inline_data.mime_type or "image/png"
                    
                    # Zakódujeme bajty do Base64 stringu
                    img_str = base64.b64encode(raw_bytes).decode("utf-8")
                    
                    # Vytvoříme hotovou URL pro frontend
                    base64_url = f"data:{mime_type};base64,{img_str}"
                    break
        
        if not base64_url:
             # Fallback kontrola textu
            if response.text:
                return jsonify({'error': f"Model nevrátil obrázek, ale text: {response.text}"}), 500
            return jsonify({'error': 'Model nevrátil žádná data.'}), 500

        return jsonify({
            "image": base64_url,
            "message": "Úspěch"
        })

    except Exception as e:
        print(f"GenAI Error: {e}")
        return jsonify({'error': str(e)}), 500

# --- HEALTH ---
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "running"}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)