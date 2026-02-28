import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from models import db
from config import Config

# Frontend directory path
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'frontend')


def create_app():
    app = Flask(__name__, static_folder=None)
    app.config.from_object(Config)

    # Initialize extensions
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    db.init_app(app)

    # Ensure database directory exists
    db_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'database')
    os.makedirs(db_dir, exist_ok=True)

    # Register blueprints
    from routes.students import students_bp
    from routes.companies import companies_bp
    from routes.placements import placements_bp
    from routes.analytics import analytics_bp
    from routes.ai_services import ai_bp
    from routes.admin import admin_bp
    from routes.config import config_bp
    from routes.jobs import jobs_bp

    app.register_blueprint(students_bp)
    app.register_blueprint(companies_bp)
    app.register_blueprint(placements_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(ai_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(config_bp)
    app.register_blueprint(jobs_bp)

    # Create tables
    with app.app_context():
        db.create_all()

    # Serve frontend static files
    @app.route('/')
    def serve_frontend():
        return send_from_directory(os.path.abspath(FRONTEND_DIR), 'index.html')

    @app.route('/<path:path>')
    def serve_static(path):
        return send_from_directory(os.path.abspath(FRONTEND_DIR), path)

    # Error handlers
    @app.errorhandler(500)
    def server_error(e):
        return {'error': 'Internal server error'}, 500

    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)
