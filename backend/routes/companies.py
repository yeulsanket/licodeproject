from flask import Blueprint, request, jsonify
from app import get_db
from models import Company
from bson import ObjectId
from datetime import datetime

companies_bp = Blueprint('companies', __name__)


@companies_bp.route('/api/companies', methods=['GET'])
def get_companies():
    db = get_db()
    industry = request.args.get('industry')
    search = request.args.get('search')
    
    query = {}
    
    if industry:
        query['industry'] = industry
    if search:
        query['name'] = {'$regex': search, '$options': 'i'}
        
    cursor = db.companies.find(query).sort('name', 1)
    companies_list = [Company.to_dict(doc) for doc in cursor]
    
    return jsonify(companies_list)


@companies_bp.route('/api/companies/<company_id>', methods=['GET'])
def get_company(company_id):
    db = get_db()
    try:
        if not ObjectId.is_valid(company_id):
            return jsonify({'error': 'Invalid company ID format'}), 400
            
        company = db.companies.find_one({'_id': ObjectId(company_id)})
        if not company:
            return jsonify({'error': 'Company not found'}), 404
            
        return jsonify(Company.to_dict(company))
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@companies_bp.route('/api/companies', methods=['POST'])
def create_company():
    db = get_db()
    data = request.get_json()
    
    company_doc = {
        'name': data['name'],
        'industry': data['industry'],
        'min_package': float(data.get('min_package', 0)),
        'max_package': float(data.get('max_package', 0)),
        'requirements': data.get('requirements', []),
        'website': data.get('website', ''),
        'created_at': datetime.utcnow()
    }
    
    result = db.companies.insert_one(company_doc)
    company_doc['_id'] = result.inserted_id
    
    return jsonify(Company.to_dict(company_doc)), 201


@companies_bp.route('/api/companies/<company_id>', methods=['PUT'])
def update_company(company_id):
    db = get_db()
    try:
        if not ObjectId.is_valid(company_id):
            return jsonify({'error': 'Invalid company ID format'}), 400
            
        data = request.get_json()
        update_doc = {}
        
        # Build update document dynamically
        updatable_fields = ['name', 'industry', 'min_package', 'max_package', 'requirements', 'website']
        
        for field in updatable_fields:
            if field in data:
                # Type conversion for packages
                val = data[field]
                if field in ['min_package', 'max_package']:
                    val = float(val) if val is not None else 0
                update_doc[field] = val
                
        if not update_doc:
            return jsonify({'error': 'No fields to update'}), 400
            
        result = db.companies.update_one(
            {'_id': ObjectId(company_id)},
            {'$set': update_doc}
        )
        
        if result.matched_count == 0:
            return jsonify({'error': 'Company not found'}), 404
            
        updated_company = db.companies.find_one({'_id': ObjectId(company_id)})
        return jsonify(Company.to_dict(updated_company))
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@companies_bp.route('/api/companies/<company_id>', methods=['DELETE'])
def delete_company(company_id):
    db = get_db()
    try:
        if not ObjectId.is_valid(company_id):
            return jsonify({'error': 'Invalid company ID format'}), 400
            
        result = db.companies.delete_one({'_id': ObjectId(company_id)})
        
        if result.deleted_count == 0:
            return jsonify({'error': 'Company not found'}), 404
            
        # Optional: handle cascade delete logic
        db.placements.delete_many({'company_id': ObjectId(company_id)})
        
        return jsonify({'message': 'Company deleted successfully'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@companies_bp.route('/api/companies/industries', methods=['GET'])
def get_industries():
    db = get_db()
    industries = db.companies.distinct('industry')
    return jsonify(industries)
