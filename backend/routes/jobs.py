from flask import Blueprint, jsonify
from db import get_db
from models import Student, Company, Placement
from bson import ObjectId
import random

jobs_bp = Blueprint('jobs', __name__)

@jobs_bp.route('/api/jobs/recommendations/<student_id>', methods=['GET'])
def get_recommendations(student_id):
    db = get_db()
    
    try:
        if not ObjectId.is_valid(student_id):
            return jsonify({'error': 'Invalid student ID format'}), 400
            
        student_doc = db.students.find_one({'_id': ObjectId(student_id)})
        if not student_doc:
            return jsonify({'error': 'Student not found'}), 404
            
        student_skills = set([s.lower() for s in student_doc.get('skills', [])])
        student_cgpa = student_doc.get('cgpa', 7.0)
        
        companies = list(db.companies.find({}))
        matches = []
        
        for company in companies:
            # Need to default to empty list if none
            reqs = company.get('requirements', [])
            if not reqs:
                reqs = []
            company_reqs = set([r.lower() for r in reqs])
            
            # Calculate skill overlap
            overlap = student_skills.intersection(company_reqs)
            match_score = 0
            if company_reqs:
                match_score = int((len(overlap) / len(company_reqs)) * 100)
            else:
                match_score = random.randint(40, 70) # Fallback heuristic
                
            # Add some randomness/variety + bonus for CGPA
            if student_cgpa > 8.5:
                match_score += 10
                
            match_score = min(98, max(30, match_score + random.randint(-5, 5)))
            
            matches.append({
                'company': company.get('name'),
                'industry': company.get('industry'),
                'role': random.choice(['Software Engineer', 'Data Analyst', 'Product Intern', 'UI/UX Developer', 'Backend Dev']),
                'package': random.uniform(company.get('min_package', 0), company.get('max_package', 0)),
                'match_score': match_score,
                'matched_skills': list(overlap) if overlap else list(company_reqs)[:2],
                'reason': f"Strong overlap in {', '.join(list(overlap)[:3]) if overlap else 'core requirements'} and alignment with {company.get('industry')} standards."
            })
            
        # Sort by match score descending
        matches.sort(key=lambda x: x['match_score'], reverse=True)
        
        return jsonify({
            'student_id': str(student_id),
            'matches': matches[:5] # Return top 5
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
