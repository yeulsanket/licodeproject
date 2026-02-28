from flask import Blueprint, request, jsonify
from models import db, Student
from ai_engine import analyze_resume, skill_gap_analysis, predict_salary, generate_roadmap, chat_with_ai

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
    data = request.get_json()
    student_id = data.get('student_id')
    target_role = data.get('target_role', 'Software Engineer')
    skills = data.get('skills', [])

    student_info = None
    if student_id:
        student = Student.query.get(student_id)
        if student:
            skills = student.get_skills()
            student_info = {
                'cgpa': student.cgpa,
                'projects': student.projects,
                'internships': student.internships,
                'branch': student.branch
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
    data = request.get_json()
    student_id = data.get('student_id')
    career_goal = data.get('career_goal', 'Software Engineer')
    target_package = data.get('target_package')

    student_info = {'name': 'Student', 'branch': 'CS', 'cgpa': 7.0, 'skills': [], 'projects': 0, 'internships': 0}

    if student_id:
        student = Student.query.get(student_id)
        if student:
            student_info = {
                'name': student.name,
                'branch': student.branch,
                'cgpa': student.cgpa,
                'skills': student.get_skills(),
                'projects': student.projects,
                'internships': student.internships
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
