import sys
import os
from datetime import datetime

# Add parent dir to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from db import get_db

def insert_test_student():
    app = create_app()
    with app.app_context():
        db = get_db()
        
        test_student = {
            'name': 'Antigravity Test Student',
            'email': 'antigravity.test@example.com',
            'branch': 'Computer Science',
            'cgpa': 9.2,
            'skills': ['React', 'Node.js', 'Python', 'AI/ML', 'MongoDB'],
            'projects': 5,
            'internships': 2,
            'placed': False,
            'gender': 'Male',
            'resume_text': 'Talented developer with a focus on AI and React.',
            'created_at': datetime.utcnow()
        }
        
        # Check if exists
        existing = db.students.find_one({'email': test_student['email']})
        if existing:
            print(f"Student with email {test_student['email']} already exists.")
            return
            
        result = db.students.insert_one(test_student)
        print(f"Successfully inserted test student with ID: {result.inserted_id}")
        print(f"Email: {test_student['email']}")

if __name__ == '__main__':
    insert_test_student()
