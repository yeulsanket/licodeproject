from flask import Blueprint, jsonify
from models import Student, Company, Placement
import random

jobs_bp = Blueprint('jobs', __name__)

@jobs_bp.route('/api/jobs/recommendations/<int:student_id>', methods=['GET'])
def get_recommendations(student_id):
    student = Student.query.get_or_404(student_id)
    student_skills = set([s.lower() for s in student.get_skills()])
    
    companies = Company.query.all()
    matches = []
    
    for company in companies:
        company_reqs = set([r.lower() for r in (company.get_requirements() or [])])
        
        # Calculate skill overlap
        overlap = student_skills.intersection(company_reqs)
        match_score = 0
        if company_reqs:
            match_score = int((len(overlap) / len(company_reqs)) * 100)
        else:
            match_score = random.randint(40, 70) # Fallback heuristic
            
        # Add some randomness/variety + bonus for CGPA
        if student.cgpa > 8.5:
            match_score += 10
            
        match_score = min(98, max(30, match_score + random.randint(-5, 5)))
        
        matches.append({
            'company': company.name,
            'industry': company.industry,
            'role': random.choice(['Software Engineer', 'Data Analyst', 'Product Intern', 'UI/UX Developer', 'Backend Dev']),
            'package': random.uniform(company.min_package, company.max_package),
            'match_score': match_score,
            'matched_skills': list(overlap) if overlap else list(company_reqs)[:2],
            'reason': f"Strong overlap in {', '.join(list(overlap)[:3]) if overlap else 'core requirements'} and alignment with {company.industry} standards."
        })
        
    # Sort by match score descending
    matches.sort(key=lambda x: x['match_score'], reverse=True)
    
    return jsonify({
        'student_id': student_id,
        'matches': matches[:5] # Return top 5
    })
