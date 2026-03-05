import datetime
from flask import Blueprint, request, jsonify
from db import get_db
from bson import ObjectId
from ai_engine import analyze_resume, skill_gap_analysis, predict_salary, generate_roadmap, chat_with_ai, generate_mock_test

ai_bp = Blueprint('ai_services', __name__)


@ai_bp.route('/api/ai/analyze-resume', methods=['POST'])
def ai_analyze_resume():
    data = request.get_json()
    resume_text = data.get('resume_text', '')
    target_role = data.get('target_role', 'Software Engineer')

    if not resume_text:
        return jsonify({'error': 'Resume text is required'}), 400

    result = analyze_resume(resume_text, target_role)
    return jsonify(result)


@ai_bp.route('/api/ai/skill-gap', methods=['POST'])
def ai_skill_gap():
    db = get_db()
    data = request.get_json()
    student_id = data.get('student_id')
    target_role = data.get('target_role', 'Software Engineer')
    skills = data.get('skills', [])

    student_info = None
    if student_id and ObjectId.is_valid(student_id):
        student = db.students.find_one({'_id': ObjectId(student_id)})
        if student:
            skills = student.get('skills', [])
            student_info = {
                'cgpa': student.get('cgpa', 0),
                'projects': student.get('projects', 0),
                'internships': student.get('internships', 0),
                'branch': student.get('branch', '')
            }

    if not skills:
        return jsonify({'error': 'Skills are required'}), 400

    result = skill_gap_analysis(skills, target_role, student_info)
    return jsonify(result)


@ai_bp.route('/api/ai/predict-salary', methods=['POST'])
def ai_predict_salary():
    data = request.get_json()
    cgpa = data.get('cgpa', 7.0)
    skills = data.get('skills', [])
    projects = data.get('projects', 0)
    internships = data.get('internships', 0)
    branch = data.get('branch', 'Computer Science')

    result = predict_salary(cgpa, skills, projects, internships, branch)
    return jsonify(result)


@ai_bp.route('/api/ai/roadmap', methods=['POST'])
def ai_roadmap():
    db = get_db()
    data = request.get_json()
    student_id = data.get('student_id')
    career_goal = data.get('career_goal', 'Software Engineer')
    target_package = data.get('target_package')

    student_info = {'name': 'Student', 'branch': 'CS', 'cgpa': 7.0, 'skills': [], 'projects': 0, 'internships': 0}

    if student_id and ObjectId.is_valid(student_id):
        student = db.students.find_one({'_id': ObjectId(student_id)})
        if student:
            student_info = {
                'name': student.get('name', ''),
                'branch': student.get('branch', ''),
                'cgpa': student.get('cgpa', 0),
                'skills': student.get('skills', []),
                'projects': student.get('projects', 0),
                'internships': student.get('internships', 0)
            }

    result = generate_roadmap(student_info, career_goal, target_package)
    return jsonify(result)


@ai_bp.route('/api/ai/chat', methods=['POST'])
def ai_chat():
    data = request.get_json()
    message = data.get('message', '')
    history = data.get('history', [])

    if not message:
        return jsonify({'error': 'Message is required'}), 400

    response = chat_with_ai(message, history)
    return jsonify({'response': response})

@ai_bp.route('/api/ai/generate-test', methods=['POST'])
def ai_generate_test():
    data = request.get_json()
    difficulty = data.get('difficulty', 'Medium')
    subject = data.get('subject', 'General Aptitude & Coding')
    student_id = data.get('student_id')

    result = generate_mock_test(difficulty, subject, student_id)
    return jsonify(result)

@ai_bp.route('/api/ai/save-test-result', methods=['POST'])
def ai_save_test_result():
    db = get_db()
    data = request.get_json()
    student_id = data.get('student_id')
    
    if not student_id or not ObjectId.is_valid(student_id):
        return jsonify({'error': 'Valid Student ID is required'}), 400

    test_result = {
        'student_id': ObjectId(student_id),
        'test_title': data.get('test_title'),
        'difficulty': data.get('difficulty'),
        'subject': data.get('subject'),
        'score': data.get('score'),
        'total_questions': data.get('total_questions'),
        'completed_at': datetime.datetime.utcnow(),
        'answers': data.get('answers'),
        'questions': data.get('questions')
    }
    
    db.test_history.insert_one(test_result)
    return jsonify({'message': 'Test result saved successfully'})


@ai_bp.route('/api/ai/test-history/<student_id>', methods=['GET'])
def ai_get_test_history(student_id):
    db = get_db()
    
    if not student_id or not ObjectId.is_valid(student_id):
        return jsonify({'error': 'Valid Student ID is required'}), 400

    history = list(db.test_history.find({'student_id': ObjectId(student_id)}).sort('completed_at', -1))
    
    # Format for JSON
    for h in history:
        h['_id'] = str(h['_id'])
        h['student_id'] = str(h['student_id'])
        h['completed_at'] = h['completed_at'].isoformat()
        
    return jsonify(history)
