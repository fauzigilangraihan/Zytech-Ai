import os
import uuid
import mysql.connector
from flask import Flask, render_template, request, jsonify
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
import google.generativeai as genai

app = Flask(__name__)

# --- 1. KONFIGURASI GEMINI ---
genai.configure(api_key="AIzaSyCBbyjq7C6w400FMUOmp89UH9YG-1nazbw")

UPLOAD_FOLDER = 'temp_uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

active_chat_sessions = {}

# PERSONA UMUM
ZYYTECH_PERSONA = """
Kamu adalah ZyyTech AI, asisten virtual cerdas yang siap membantu menyelesaikan segala jenis masalah.
Gaya bahasamu asik, luwes, dan bersahabat (gunakan kata "aku" dan "kamu").
Kamu memiliki pengetahuan luas: mulai dari koding, pelajaran sekolah, resep masakan, tips keseharian, hingga curhat.
Berikan jawaban yang jelas, mudah dipahami, dan langsung ke intinya. 
Selalu bersikap positif dan siap membantu!
"""

# --- 2. KONFIGURASI DATABASE ---
def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="zyytech_db"
    )

@app.route('/')
def index():
    return render_template('index.html')

# --- 4. AUTHENTICATION ---
@app.route('/register', methods=['POST'])
def register():
    email = request.form.get('email')
    password = request.form.get('password')
    if not email or not password:
        return jsonify({'status': 'error', 'message': 'Email dan password wajib diisi!'}), 400
    hashed_password = generate_password_hash(password)
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO users (email, password) VALUES (%s, %s)", (email, hashed_password))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'status': 'success', 'message': 'Registrasi berhasil! Silakan login.'})
    except mysql.connector.Error as err:
        if err.errno == 1062:
            return jsonify({'status': 'error', 'message': 'Email sudah terdaftar!'}), 400
        return jsonify({'status': 'error', 'message': str(err)}), 500

@app.route('/login', methods=['POST'])
def login():
    email = request.form.get('email')
    password = request.form.get('password')
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()
        cursor.close()
        conn.close()

        if user and check_password_hash(user['password'], password):
            return jsonify({'status': 'success', 'message': 'Login berhasil!', 'email': user['email']})
        else:
            return jsonify({'status': 'error', 'message': 'Email atau password salah!'}), 401
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# --- RUTE SIDEBAR ---
@app.route('/get_sessions', methods=['POST'])
def get_sessions():
    email = request.form.get('email')
    if not email or email == 'GUEST':
        return jsonify({'status': 'success', 'data': []})
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, judul FROM sessions WHERE email = %s ORDER BY created_at DESC", (email,))
        sessions = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify({'status': 'success', 'data': sessions})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/search_sessions', methods=['POST'])
def search_sessions():
    email = request.form.get('email')
    query = request.form.get('query', '')
    if not email or email == 'GUEST':
        return jsonify({'status': 'success', 'data': []})
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        search_pattern = f"%{query}%"
        cursor.execute("SELECT id, judul FROM sessions WHERE email = %s AND judul LIKE %s ORDER BY created_at DESC", (email, search_pattern))
        sessions = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify({'status': 'success', 'data': sessions})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/create_session', methods=['POST'])
def create_session():
    # PERBAIKAN: Hanya mengembalikan ID sesi ke frontend, TAPI BELUM DISIMPAN KE DATABASE.
    # Ini mencegah database penuh dengan sesi kosong jika user hanya mereload halaman.
    email = request.form.get('email')
    if not email or email == 'GUEST':
        return jsonify({'status': 'success', 'session_id': 'guest_' + str(uuid.uuid4().hex)})
    
    session_id = 'session_' + str(uuid.uuid4().hex)
    return jsonify({'status': 'success', 'session_id': session_id})

@app.route('/get_chat_history', methods=['POST'])
def get_chat_history():
    session_id = request.form.get('session_id')
    if not session_id or session_id.startswith('guest_'):
        return jsonify({'status': 'success', 'data': []})
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT pengirim, teks FROM messages WHERE session_id = %s ORDER BY waktu ASC", (session_id,))
        chats = cursor.fetchall()
        
        if session_id not in active_chat_sessions and len(chats) > 0:
            history_format = []
            for c in chats:
                role = "user" if c['pengirim'] == 'Kamu' else "model"
                history_format.append({"role": role, "parts": [c['teks']]})
            model = genai.GenerativeModel(model_name='gemini-1.5-flash', system_instruction=ZYYTECH_PERSONA)
            active_chat_sessions[session_id] = model.start_chat(history=history_format)

        cursor.close()
        conn.close()
        return jsonify({'status': 'success', 'data': chats})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# --- RUTE CHAT UTAMA ---
@app.route('/send_message', methods=['POST'])
def send_message():
    email = request.form.get('email', 'GUEST')
    session_id = request.form.get('session_id')
    pesan_user = request.form.get('message', '')
    pilihan_model = request.form.get('model', 'gemini-1.5-flash')
    file_upload = request.files.get('file')

    if not session_id:
        return jsonify({'reply': 'Sesi tidak valid. Harap muat ulang halaman.'})

    is_logged_in = (email != 'GUEST' and not session_id.startswith('guest_'))

    # DB USER
    if is_logged_in:
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # PERBAIKAN: Cek apakah sesi sudah ada di database. Jika belum, buat sekarang.
            cursor.execute("SELECT id FROM sessions WHERE id = %s", (session_id,))
            if not cursor.fetchone():
                judul_baru = (pesan_user[:25] + '...') if len(pesan_user) > 25 else pesan_user
                cursor.execute("INSERT INTO sessions (id, email, judul) VALUES (%s, %s, %s)", (session_id, email, judul_baru))

            teks_db_user = pesan_user
            if file_upload and file_upload.filename != '':
                teks_db_user += f"\n*[Melampirkan file: {file_upload.filename}]*"
                
            cursor.execute("INSERT INTO messages (session_id, email, pengirim, teks) VALUES (%s, %s, %s, %s)", (session_id, email, 'Kamu', teks_db_user))
            conn.commit()
            cursor.close()
            conn.close()
        except Exception as e:
            print("Error simpan pesan user:", e)

    # GEMINI
    try:
        if session_id not in active_chat_sessions:
            model = genai.GenerativeModel(model_name=pilihan_model, system_instruction=ZYYTECH_PERSONA)
            active_chat_sessions[session_id] = model.start_chat(history=[])
            
        chat_session = active_chat_sessions[session_id]
        
        if file_upload and file_upload.filename != '':
            filename = secure_filename(file_upload.filename)
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            file_upload.save(file_path)
            try:
                file_gemini = genai.upload_file(file_path)
                response = chat_session.send_message([pesan_user, file_gemini])
            finally:
                if os.path.exists(file_path):
                    os.remove(file_path)
        else:
            response = chat_session.send_message(pesan_user)
        
        balasan_ai = response.text

        # DB AI
        if is_logged_in:
            try:
                conn = get_db_connection()
                cursor = conn.cursor()
                cursor.execute("INSERT INTO messages (session_id, email, pengirim, teks) VALUES (%s, %s, %s, %s)", (session_id, email, 'AI', balasan_ai))
                conn.commit()
                cursor.close()
                conn.close()
            except Exception as e:
                print("Error simpan pesan ai:", e)

        return jsonify({'reply': balasan_ai})
        
    except Exception as e:
        print(f"Error Backend: {str(e)}") 
        return jsonify({'reply': f"Maaf, terjadi kesalahan sistem: {str(e)}"})

@app.route('/clear_history', methods=['POST'])
def clear_history():
    return jsonify({'status': 'success'})

if __name__ == '__main__':
    app.run(debug=True)