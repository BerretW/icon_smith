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

# --- LOGIN ---
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
        try:
            if scrypt.verify(password, user['password']):
                token = jwt.encode({
                    'user_id': user['id'],
                    'user': user['user'],
                    'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
                }, SECRET_KEY, algorithm="HS256")
                return jsonify({"token": token, "user": {"username": user['user']}})
        except Exception as e:
            pass
    
    return jsonify({"error": "Neplatné údaje"}), 401


# --- FUNKCE PRO ODSTRANĚNÍ POZADÍ ---
def remove_white_background(img, tolerance=240):
    """
    Převede bílé (a skoro bílé) pixely na průhledné.
    tolerance: 0-255 (255 = jen čistě bílá, nižší = bere i světle šedou)
    """
    img = img.convert("RGBA")
    datas = img.getdata()

    newData = []
    for item in datas:
        # item je (R, G, B, A)
        # Pokud jsou všechny složky R, G, B vyšší než tolerance (je to bílá/světlá)
        if item[0] > tolerance and item[1] > tolerance and item[2] > tolerance:
            # Změníme Alpha na 0 (průhledná)
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)

    img.putdata(newData)
    return img


# --- GENERATE ENDPOINT ---
@app.route('/api/generate', methods=['POST'])
@token_required
def generate_icon(current_user_id):
    data = request.get_json()
    prompt = data.get('prompt')
    style_mode = data.get('style', 'inventory')
    color_mode = data.get('colorMode', 'bw')
    output_type = data.get('outputType', 'icon') 

    if not prompt:
        return jsonify({'error': 'Chybí prompt'}), 400

    # 1. Prompt Tuning: Důraz na BÍLÉ pozadí (pro snadné odstranění)
    style_desc = ""
    requirements = ""
    
    if output_type == 'illustration':
        target_size = (500, 500)
        if color_mode == 'color':
            style_desc = (
                "Style: Detailed illustration in the style of a Wild West newspaper (circa 1870–1890).",
                "The composition feels like a period news report, with no modern elements and an authentic American Old West atmosphere."
                "Comix collors."
            )
        else:
            style_desc = (
                "Style: handdrawn illustration style, hand-drawn shading, lightly worn suitable for journal.",
                "The composition feels like a period news report, with no modern elements and an authentic American Old West atmosphere."
                "Highly detailed cross-hatching shading."
            )
        # Změna: "Isolated on PURE WHITE background"
        requirements = "REQUIREMENTS: NO TEXT. Artistic composition. Isolated on PURE WHITE background. No borders."
        
    else:
        target_size = (100, 100)
        if color_mode == 'color':
            style_desc = "Style: RDR2 catalog item. Simple vintage watercolor. Isolated."
        else:
            style_desc = "Style: RDR2 inventory icon. Bold black ink, high contrast woodcut. Minimalist."
        # Změna: "Isolated on PURE WHITE background"
        requirements = "REQUIREMENTS: NO TEXT. Simple shape. Bold lines. Isolated on PURE WHITE background."

    final_prompt = f"{style_desc} Subject: {prompt}. {requirements}"

    try:
        print(f"Generuji ({output_type}): {final_prompt[:50]}...")

        # 2. Volání API
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=final_prompt
        )

        base64_url = None

        if response.parts:
            for part in response.parts:
                if part.inline_data:
                    raw_bytes = part.inline_data.data
                    
                    # Načtení do PIL
                    image = Image.open(io.BytesIO(raw_bytes))
                    
                    # A. Odstranění bílého pozadí
                    # Pro BW módy můžeme být agresivnější (tolerance 200), pro barvu opatrnější (240)
                    bg_tolerance = 200 if color_mode == 'bw' else 240
                    image_transparent = remove_white_background(image, tolerance=bg_tolerance)
                    
                    # B. Změna velikosti (LANCZOS pro kvalitu)
                    image_resized = image_transparent.resize(target_size, Image.Resampling.LANCZOS)
                    
                    # C. Export do PNG (nutné pro průhlednost)
                    buffered = io.BytesIO()
                    image_resized.save(buffered, format="PNG")
                    
                    img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
                    base64_url = f"data:image/png;base64,{img_str}"
                    break
        
        if not base64_url:
            return jsonify({'error': 'Model nevrátil data.'}), 500

        return jsonify({
            "image": base64_url,
            "message": "Úspěch",
            "type": output_type
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