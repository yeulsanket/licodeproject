from flask import Blueprint, request, jsonify
import os
from dotenv import set_key, load_dotenv

config_bp = Blueprint('config', __name__)
ENV_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.env')

@config_bp.route('/api/config', methods=['GET'])
def get_config():
    # Only return the existence/mask of the key for security, 
    # and the model name
    api_key = os.getenv('GROQ_API_KEY', '')
    masked_key = f"{api_key[:6]}...{api_key[-4:]}" if len(api_key) > 10 else "Not Configured"
    return jsonify({
        'groq_api_key_configured': bool(api_key and api_key != 'your_groq_api_key_here'),
        'groq_api_key_masked': masked_key,
        'groq_model': os.getenv('GROQ_MODEL', 'llama-3.3-70b-versatile')
    })

@config_bp.route('/api/config', methods=['POST'])
def update_config():
    data = request.get_json()
    new_key = data.get('groq_api_key')
    new_model = data.get('groq_model')

    if new_key:
        set_key(ENV_FILE, "GROQ_API_KEY", new_key)
    
    if new_model:
        set_key(ENV_FILE, "GROQ_MODEL", new_model)
    
    # Reload env vars in current process
    load_dotenv(ENV_FILE, override=True)
    
    return jsonify({'success': True, 'message': 'Configuration updated successfully'})
