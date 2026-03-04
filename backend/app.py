import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from config import Config

# Serve React build output; fall back to old frontend for local dev
_REACT_DIST = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'frontend-react', 'dist')
_OLD_FRONTEND = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'frontend')
FRONTEND_DIR = _REACT_DIST if os.path.isdir(_REACT_DIST) else _OLD_FRONTEND

from db import get_db

def create_app():
    app = Flask(__name__, static_folder=None)
    app.config.from_object(Config)

    # Initialize extensions
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Database is accessed via get_db() where needed


    # Register blueprints
    from routes.students import students_bp
    from routes.companies import companies_bp
    from routes.placements import placements_bp
    from routes.analytics import analytics_bp
    from routes.ai_services import ai_bp
    from routes.admin import admin_bp
    from routes.config import config_bp
    from routes.jobs import jobs_bp
    from routes.auth import auth_bp, ensure_admin_user

    app.register_blueprint(students_bp)
    app.register_blueprint(companies_bp)
    app.register_blueprint(placements_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(ai_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(config_bp)
    app.register_blueprint(jobs_bp)
    app.register_blueprint(auth_bp)

    # Create collections if they don't exist (optional in MongoDB)
    with app.app_context():
        try:
            print("Checking MongoDB connection...")
            db_instance = get_db()
            db_instance.command('ping')
            print("MongoDB connection successful.")
            ensure_admin_user()
        except Exception as e:
            print(f"MongoDB connection failed: {str(e)}")

    @app.route('/health')
    def health_check():
        return {'status': 'healthy', 'mongodb': 'connected'}, 200

    @app.route('/api/ping')
    def ping():
        """Lightweight keep-alive endpoint — prevents Render free tier from sleeping."""
        return {'status': 'ok'}, 200

    # Serve frontend static files
    @app.route('/')
    def serve_frontend():
        return send_from_directory(os.path.abspath(FRONTEND_DIR), 'index.html')

    @app.route('/login.html')
    def serve_login():
        return send_from_directory(os.path.abspath(FRONTEND_DIR), 'login.html')

    @app.route('/<path:path>')
    def serve_static(path):
        return send_from_directory(os.path.abspath(FRONTEND_DIR), path)

    # Error handlers
    @app.errorhandler(500)
    def server_error(e):
        return {'error': 'Internal server error'}, 500

    return app

app = create_app()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
