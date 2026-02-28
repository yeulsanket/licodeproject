import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'student-analyzer-secret-key-2024')
    MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/').strip("'\" ")
    MONGO_DB_NAME = os.getenv('MONGO_DB_NAME', 'student_analyzer')
    GROQ_API_KEY = os.getenv('GROQ_API_KEY', '')
    GROQ_MODEL = os.getenv('GROQ_MODEL', 'llama-3.3-70b-versatile')
