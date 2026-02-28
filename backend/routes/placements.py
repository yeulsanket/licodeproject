from flask import Blueprint, request, jsonify
from db import get_db
from models import Placement
from bson import ObjectId
from datetime import datetime

placements_bp = Blueprint('placements', __name__)


@placements_bp.route('/api/placements', methods=['GET'])
def get_placements():
    db = get_db()
    status = request.args.get('status')
    
    pipeline = []
    
    if status:
        pipeline.append({'$match': {'status': status}})
        
    # Join with students collection
    pipeline.extend([
        {
            '$lookup': {
                'from': 'students',
                'localField': 'student_id',
                'foreignField': '_id',
                'as': 'student'
            }
        },
        {
            '$lookup': {
                'from': 'companies',
                'localField': 'company_id',
                'foreignField': '_id',
                'as': 'company'
            }
        },
        {
            '$unwind': {
                'path': '$student',
                'preserveNullAndEmptyArrays': True
            }
        },
        {
            '$unwind': {
                'path': '$company',
                'preserveNullAndEmptyArrays': True
            }
        },
        {
            '$sort': {'placement_date': -1}
        }
    ])
    
    cursor = db.placements.aggregate(pipeline)
    placements_list = []
    
    for doc in cursor:
        student_name = doc.get('student', {}).get('name') if doc.get('student') else None
        company_name = doc.get('company', {}).get('name') if doc.get('company') else None
        
        # Clean up populated fields for the to_dict method
        if 'student' in doc:
            del doc['student']
        if 'company' in doc:
            del doc['company']
            
        formatted_doc = Placement.to_dict(doc)
        formatted_doc['student_name'] = student_name
        formatted_doc['company_name'] = company_name
        placements_list.append(formatted_doc)

    return jsonify(placements_list)


@placements_bp.route('/api/placements/<placement_id>', methods=['GET'])
def get_placement(placement_id):
    db = get_db()
    try:
        if not ObjectId.is_valid(placement_id):
            return jsonify({'error': 'Invalid placement ID format'}), 400
            
        placement = db.placements.find_one({'_id': ObjectId(placement_id)})
        if not placement:
            return jsonify({'error': 'Placement not found'}), 404
            
        formatted_doc = Placement.to_dict(placement)
        
        # Manually fetch names
        student = db.students.find_one({'_id': ObjectId(formatted_doc['student_id'])})
        company = db.companies.find_one({'_id': ObjectId(formatted_doc['company_id'])})
        
        formatted_doc['student_name'] = student.get('name') if student else None
        formatted_doc['company_name'] = company.get('name') if company else None
            
        return jsonify(formatted_doc)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@placements_bp.route('/api/placements', methods=['POST'])
def create_placement():
    db = get_db()
    data = request.get_json()
    
    try:
        student_id = ObjectId(data['student_id'])
        company_id = ObjectId(data['company_id'])
        
        placement_doc = {
            'student_id': student_id,
            'company_id': company_id,
            'role': data['role'],
            'package': float(data['package']),
            'status': data.get('status', 'confirmed'),
            'placement_date': datetime.utcnow()
        }
        
        result = db.placements.insert_one(placement_doc)
        placement_doc['_id'] = result.inserted_id
        
        # Mark student as placed
        db.students.update_one(
            {'_id': student_id},
            {'$set': {'placed': True}}
        )
        
        # Fetch names for response
        student = db.students.find_one({'_id': student_id})
        company = db.companies.find_one({'_id': company_id})
        
        formatted_doc = Placement.to_dict(placement_doc)
        formatted_doc['student_name'] = student.get('name') if student else None
        formatted_doc['company_name'] = company.get('name') if company else None
        
        return jsonify(formatted_doc), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@placements_bp.route('/api/placements/<placement_id>', methods=['DELETE'])
def delete_placement(placement_id):
    db = get_db()
    try:
        if not ObjectId.is_valid(placement_id):
            return jsonify({'error': 'Invalid placement ID format'}), 400
            
        # Optional: Can check if this was the only placement and mark student as not placed
        # but leaving simple for now
            
        result = db.placements.delete_one({'_id': ObjectId(placement_id)})
        
        if result.deleted_count == 0:
            return jsonify({'error': 'Placement not found'}), 404
            
        return jsonify({'message': 'Placement deleted successfully'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
