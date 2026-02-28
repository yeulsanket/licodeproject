import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'student-analyzer-secret-key-2024')
    raw_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
    # Clean the URI aggressively: strip quotes, spaces, and invisible characters
    MONGO_URI = "".join(c for c in raw_uri if c.isprintable()).strip("'\" ")
    
    # Debug trace (shows only the beginning for security)
    print(f"DEBUG: MONGO_URI starts with: '{MONGO_URI[:15]}...'")
    
    MONGO_DB_NAME = os.getenv('MONGO_DB_NAME', 'student_analyzer').strip("'\" ")
    GROQ_API_KEY = os.getenv('GROQ_API_KEY', '')
    GROQ_MODEL = os.getenv('GROQ_MODEL', 'llama-3.3-70b-versatile')
