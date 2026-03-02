from flask import Blueprint, request, jsonify
from db import get_db
from werkzeug.security import generate_password_hash, check_password_hash
from config import Config
from bson import ObjectId
import jwt
import datetime

auth_bp = Blueprint('auth', __name__)


def generate_token(user_id, username, role, student_id=None, email=None):
    payload = {
        'user_id': str(user_id),
        'username': username,
        'role': role,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7),
        'iat': datetime.datetime.utcnow()
    }
    if student_id:
        payload['student_id'] = str(student_id)
    if email:
        payload['email'] = email
    return jwt.encode(payload, Config.SECRET_KEY, algorithm='HS256')


def verify_token(token):
    try:
        payload = jwt.decode(token, Config.SECRET_KEY, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def get_token_from_request():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    return auth_header.split(' ')[1]


def ensure_admin_user():
    """Create default admin user if it doesn't exist."""
    db = get_db()
    if not db.users.find_one({'username': 'admin', 'role': 'admin'}):
        db.users.insert_one({
            'username': 'admin',
            'password': generate_password_hash('admin123'),
            'role': 'admin',
            'created_at': datetime.datetime.utcnow()
        })
        print("✅ Default admin user created: admin / admin123")


# ─── ADMIN LOGIN ──────────────────────────────────────────────────────────────
@auth_bp.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    username = data.get('username', '').strip()
    password = data.get('password', '')

    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400

    db = get_db()
    user = db.users.find_one({'username': username, 'role': 'admin'})

    if not user or not check_password_hash(user['password'], password):
        return jsonify({'error': 'Invalid username or password'}), 401

    token = generate_token(user['_id'], user['username'], 'admin')

    return jsonify({
        'token': token,
        'username': user['username'],
        'role': 'admin',
        'message': 'Admin login successful'
    })


# ─── STUDENT REGISTER ─────────────────────────────────────────────────────────
@auth_bp.route('/api/auth/student/register', methods=['POST'])
def student_register():
    """
    Students register using their email (must match an existing student record)
    and set a password. One registration per student email.
    """
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    db = get_db()

    # Verify the student exists in the students collection
    student = db.students.find_one({'email': {'$regex': f'^{email}$', '$options': 'i'}})
    if not student:
        return jsonify({'error': 'No student record found with this email. Please contact your administrator.'}), 404

    # Check if already registered
    existing = db.users.find_one({'email': email, 'role': 'student'})
    if existing:
        return jsonify({'error': 'An account already exists for this email. Please log in instead.'}), 409

    # Create student user account
    db.users.insert_one({
        'username': student['name'],
        'email': email,
        'password': generate_password_hash(password),
        'role': 'student',
        'student_id': student['_id'],
        'created_at': datetime.datetime.utcnow()
    })

    return jsonify({'message': f'Account created successfully for {student["name"]}! You can now log in.'}), 201


# ─── STUDENT LOGIN (auto-registers on first visit) ───────────────────────────
@auth_bp.route('/api/auth/student/login', methods=['POST'])
def student_login():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    db = get_db()

    # Check if student account already exists
    existing_user = db.users.find_one({'email': email, 'role': 'student'})

    if existing_user:
        # ─── RETURNING STUDENT: verify password ───
        if not check_password_hash(existing_user['password'], password):
            return jsonify({'error': 'Incorrect password. Please try again.'}), 401

        student = db.students.find_one({'_id': existing_user['student_id']})
        if not student:
            return jsonify({'error': 'Student record not found. Contact administrator.'}), 404

        token = generate_token(
            existing_user['_id'],
            existing_user['username'],
            'student',
            student_id=str(student['_id']),
            email=email
        )
        return jsonify({
            'token': token,
            'username': existing_user['username'],
            'role': 'student',
            'student_id': str(student['_id']),
            'email': email,
            'message': 'Login successful',
            'is_new': False
        })

    else:
        # ─── FIRST TIME: verify email in students collection, then auto-register ───
        student = db.students.find_one({'email': {'$regex': f'^{email}$', '$options': 'i'}})
        if not student:
            return jsonify({'error': 'No student record found with this email. Please contact your administrator.'}), 404

        # Create the user account automatically
        user_doc = {
            'username': student['name'],
            'email': email,
            'password': generate_password_hash(password),
            'role': 'student',
            'student_id': student['_id'],
            'created_at': datetime.datetime.utcnow()
        }
        result = db.users.insert_one(user_doc)

        token = generate_token(
            result.inserted_id,
            student['name'],
            'student',
            student_id=str(student['_id']),
            email=email
        )
        return jsonify({
            'token': token,
            'username': student['name'],
            'role': 'student',
            'student_id': str(student['_id']),
            'email': email,
            'message': f'Welcome, {student["name"]}! Your account has been created.',
            'is_new': True
        }), 201


# ─── VERIFY TOKEN ─────────────────────────────────────────────────────────────
@auth_bp.route('/api/auth/verify', methods=['GET'])
def verify():
    token = get_token_from_request()
    if not token:
        return jsonify({'error': 'No token provided'}), 401

    payload = verify_token(token)
    if not payload:
        return jsonify({'error': 'Invalid or expired token'}), 401

    response = {
        'username': payload['username'],
        'role': payload['role']
    }
    if payload.get('student_id'):
        response['student_id'] = payload['student_id']
    if payload.get('email'):
        response['email'] = payload['email']

    return jsonify(response)


# ─── CHANGE PASSWORD ──────────────────────────────────────────────────────────
@auth_bp.route('/api/auth/change-password', methods=['POST'])
def change_password():
    token = get_token_from_request()
    if not token:
        return jsonify({'error': 'Unauthorized'}), 401

    payload = verify_token(token)
    if not payload:
        return jsonify({'error': 'Invalid or expired token'}), 401

    data = request.get_json()
    current_password = data.get('current_password', '')
    new_password = data.get('new_password', '')

    if not current_password or not new_password:
        return jsonify({'error': 'Both current and new password are required'}), 400

    if len(new_password) < 6:
        return jsonify({'error': 'New password must be at least 6 characters'}), 400

    db = get_db()

    # Find user by username or email depending on role
    if payload['role'] == 'admin':
        user = db.users.find_one({'username': payload['username'], 'role': 'admin'})
    else:
        user = db.users.find_one({'email': payload.get('email'), 'role': 'student'})

    if not user or not check_password_hash(user['password'], current_password):
        return jsonify({'error': 'Current password is incorrect'}), 401

    db.users.update_one(
        {'_id': user['_id']},
        {'$set': {'password': generate_password_hash(new_password)}}
    )

    return jsonify({'message': 'Password changed successfully'})
