from flask import Blueprint, request, jsonify
from models import db, Company
import json

companies_bp = Blueprint('companies', __name__)


@companies_bp.route('/api/companies', methods=['GET'])
def get_companies():
    industry = request.args.get('industry')
    search = request.args.get('search')

    query = Company.query

    if industry:
        query = query.filter(Company.industry == industry)
    if search:
        query = query.filter(Company.name.ilike(f'%{search}%'))

    companies = query.order_by(Company.name).all()
    return jsonify([c.to_dict() for c in companies])


@companies_bp.route('/api/companies/<int:company_id>', methods=['GET'])
def get_company(company_id):
    company = Company.query.get_or_404(company_id)
    return jsonify(company.to_dict())


@companies_bp.route('/api/companies', methods=['POST'])
def create_company():
    data = request.get_json()
    company = Company(
        name=data['name'],
        industry=data['industry'],
        min_package=data.get('min_package', 0),
        max_package=data.get('max_package', 0),
        requirements=json.dumps(data.get('requirements', [])),
        website=data.get('website', '')
    )
    db.session.add(company)
    db.session.commit()
    return jsonify(company.to_dict()), 201


@companies_bp.route('/api/companies/<int:company_id>', methods=['PUT'])
def update_company(company_id):
    company = Company.query.get_or_404(company_id)
    data = request.get_json()

    company.name = data.get('name', company.name)
    company.industry = data.get('industry', company.industry)
    company.min_package = data.get('min_package', company.min_package)
    company.max_package = data.get('max_package', company.max_package)
    if 'requirements' in data:
        company.requirements = json.dumps(data['requirements'])
    company.website = data.get('website', company.website)

    db.session.commit()
    return jsonify(company.to_dict())


@companies_bp.route('/api/companies/<int:company_id>', methods=['DELETE'])
def delete_company(company_id):
    company = Company.query.get_or_404(company_id)
    db.session.delete(company)
    db.session.commit()
    return jsonify({'message': 'Company deleted successfully'})
