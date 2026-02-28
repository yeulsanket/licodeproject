from flask import Blueprint, request, jsonify
from models import db, Student
import json

students_bp = Blueprint('students', __name__)


@students_bp.route('/api/students', methods=['GET'])
def get_students():
    branch = request.args.get('branch')
    placed = request.args.get('placed')
    search = request.args.get('search')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)

    query = Student.query

    if branch:
        query = query.filter(Student.branch == branch)
    if placed is not None and placed != '':
        query = query.filter(Student.placed == (placed.lower() == 'true'))
    if search:
        query = query.filter(
            db.or_(
                Student.name.ilike(f'%{search}%'),
                Student.email.ilike(f'%{search}%')
            )
        )

    query = query.order_by(Student.name)
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'students': [s.to_dict() for s in paginated.items],
        'total': paginated.total,
        'pages': paginated.pages,
        'current_page': paginated.page
    })


@students_bp.route('/api/students/<int:student_id>', methods=['GET'])
def get_student(student_id):
    student = Student.query.get_or_404(student_id)
    return jsonify(student.to_dict())


@students_bp.route('/api/students', methods=['POST'])
def create_student():
    data = request.get_json()
    student = Student(
        name=data['name'],
        email=data['email'],
        branch=data['branch'],
        cgpa=data.get('cgpa', 0),
        skills=json.dumps(data.get('skills', [])),
        projects=data.get('projects', 0),
        internships=data.get('internships', 0),
        placed=data.get('placed', False),
        resume_text=data.get('resume_text', ''),
        gender=data.get('gender', 'Other')
    )
    db.session.add(student)
    db.session.commit()
    return jsonify(student.to_dict()), 201


@students_bp.route('/api/students/<int:student_id>', methods=['PUT'])
def update_student(student_id):
    student = Student.query.get_or_404(student_id)
    data = request.get_json()

    student.name = data.get('name', student.name)
    student.email = data.get('email', student.email)
    student.branch = data.get('branch', student.branch)
    student.cgpa = data.get('cgpa', student.cgpa)
    if 'skills' in data:
        student.skills = json.dumps(data['skills'])
    student.projects = data.get('projects', student.projects)
    student.internships = data.get('internships', student.internships)
    student.placed = data.get('placed', student.placed)
    student.resume_text = data.get('resume_text', student.resume_text)
    student.gender = data.get('gender', student.gender)

    db.session.commit()
    return jsonify(student.to_dict())


@students_bp.route('/api/students/<int:student_id>', methods=['DELETE'])
def delete_student(student_id):
    student = Student.query.get_or_404(student_id)
    db.session.delete(student)
    db.session.commit()
    return jsonify({'message': 'Student deleted successfully'})


@students_bp.route('/api/students/branches', methods=['GET'])
def get_branches():
    branches = db.session.query(Student.branch).distinct().all()
    return jsonify([b[0] for b in branches])
