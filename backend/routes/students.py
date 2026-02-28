from flask import Blueprint, request, jsonify
from app import get_db
from models import Student
from bson import ObjectId
from datetime import datetime
import re

students_bp = Blueprint('students', __name__)


@students_bp.route('/api/students', methods=['GET'])
def get_students():
    db = get_db()
    branch = request.args.get('branch')
    placed = request.args.get('placed')
    search = request.args.get('search')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)

    query = {}

    if branch:
        query['branch'] = branch
    if placed is not None and placed != '':
        query['placed'] = (placed.lower() == 'true')
        
    if search:
        # Case-insensitive regex search in MongoDB
        search_regex = re.compile(search, re.IGNORECASE)
        query['$or'] = [
            {'name': search_regex},
            {'email': search_regex}
        ]

    total = db.students.count_documents(query)
    
    # Pagination calculation
    skip = (page - 1) * per_page
    
    # Execute query, sort by name ascending
    cursor = db.students.find(query).sort('name', 1).skip(skip).limit(per_page)
    
    students_list = [Student.to_dict(doc) for doc in cursor]
    pages = (total + per_page - 1) // per_page if per_page > 0 else 1

    return jsonify({
        'students': students_list,
        'total': total,
        'pages': pages,
        'current_page': page
    })


@students_bp.route('/api/students/<student_id>', methods=['GET'])
def get_student(student_id):
    db = get_db()
    try:
        if not ObjectId.is_valid(student_id):
            return jsonify({'error': 'Invalid student ID format'}), 400
            
        student = db.students.find_one({'_id': ObjectId(student_id)})
        if not student:
            return jsonify({'error': 'Student not found'}), 404
            
        return jsonify(Student.to_dict(student))
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@students_bp.route('/api/students', methods=['POST'])
def create_student():
    db = get_db()
    data = request.get_json()
    student_doc = {
        'name': data['name'],
        'email': data['email'],
        'branch': data['branch'],
        'cgpa': data.get('cgpa', 0),
        'skills': data.get('skills', []),
        'projects': data.get('projects', 0),
        'internships': data.get('internships', 0),
        'placed': data.get('placed', False),
        'resume_text': data.get('resume_text', ''),
        'gender': data.get('gender', 'Other'),
        'created_at': datetime.utcnow()
    }
    
    result = db.students.insert_one(student_doc)
    student_doc['_id'] = result.inserted_id
    
    return jsonify(Student.to_dict(student_doc)), 201


@students_bp.route('/api/students/<student_id>', methods=['PUT'])
def update_student(student_id):
    db = get_db()
    try:
        if not ObjectId.is_valid(student_id):
            return jsonify({'error': 'Invalid student ID format'}), 400
            
        data = request.get_json()
        update_doc = {}
        
        # Build update document dynamically
        updatable_fields = ['name', 'email', 'branch', 'cgpa', 'skills', 
                           'projects', 'internships', 'placed', 'resume_text', 'gender']
        
        for field in updatable_fields:
            if field in data:
                update_doc[field] = data[field]
                
        if not update_doc:
            return jsonify({'error': 'No fields to update'}), 400

        result = db.students.update_one(
            {'_id': ObjectId(student_id)},
            {'$set': update_doc}
        )
        
        if result.matched_count == 0:
            return jsonify({'error': 'Student not found'}), 404
            
        updated_student = db.students.find_one({'_id': ObjectId(student_id)})
        return jsonify(Student.to_dict(updated_student))
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@students_bp.route('/api/students/<student_id>', methods=['DELETE'])
def delete_student(student_id):
    db = get_db()
    try:
        if not ObjectId.is_valid(student_id):
            return jsonify({'error': 'Invalid student ID format'}), 400
            
        result = db.students.delete_one({'_id': ObjectId(student_id)})
        
        if result.deleted_count == 0:
            return jsonify({'error': 'Student not found'}), 404
            
        # Also clean up placements related to this student
        db.placements.delete_many({'student_id': ObjectId(student_id)})
            
        return jsonify({'message': 'Student deleted successfully'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@students_bp.route('/api/students/branches', methods=['GET'])
def get_branches():
    db = get_db()
    branches = db.students.distinct('branch')
    return jsonify(branches)
