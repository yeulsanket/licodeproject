from flask import Blueprint, jsonify
from models import db, Student, Company, Placement
from sqlalchemy import func, extract
import json

analytics_bp = Blueprint('analytics', __name__)


@analytics_bp.route('/api/analytics/stats', methods=['GET'])
def get_stats():
    total_students = Student.query.count()
    placed_students = Student.query.filter_by(placed=True).count()
    total_companies = Company.query.count()

    avg_package = db.session.query(func.avg(Placement.package)).filter(Placement.status == 'confirmed').scalar() or 0
    highest_package = db.session.query(func.max(Placement.package)).filter(Placement.status == 'confirmed').scalar() or 0
    lowest_package = db.session.query(func.min(Placement.package)).filter(Placement.status == 'confirmed').scalar() or 0
    total_placements = Placement.query.filter_by(status='confirmed').count()

    placement_rate = (placed_students / total_students * 100) if total_students > 0 else 0

    return jsonify({
        'total_students': total_students,
        'placed_students': placed_students,
        'placement_rate': round(placement_rate, 1),
        'avg_package': round(avg_package, 2),
        'highest_package': round(highest_package, 2),
        'lowest_package': round(lowest_package, 2),
        'total_companies': total_companies,
        'total_placements': total_placements
    })


@analytics_bp.route('/api/analytics/placement-overview', methods=['GET'])
def placement_overview():
    placed = Student.query.filter_by(placed=True).count()
    not_placed = Student.query.filter_by(placed=False).count()
    return jsonify({'placed': placed, 'not_placed': not_placed})


@analytics_bp.route('/api/analytics/salary-distribution', methods=['GET'])
def salary_distribution():
    placements = Placement.query.filter_by(status='confirmed').all()
    ranges = {
        '0-3 LPA': 0, '3-5 LPA': 0, '5-8 LPA': 0,
        '8-12 LPA': 0, '12-20 LPA': 0, '20+ LPA': 0
    }
    for p in placements:
        pkg = p.package
        if pkg < 3:
            ranges['0-3 LPA'] += 1
        elif pkg < 5:
            ranges['3-5 LPA'] += 1
        elif pkg < 8:
            ranges['5-8 LPA'] += 1
        elif pkg < 12:
            ranges['8-12 LPA'] += 1
        elif pkg < 20:
            ranges['12-20 LPA'] += 1
        else:
            ranges['20+ LPA'] += 1
    return jsonify({'labels': list(ranges.keys()), 'values': list(ranges.values())})


@analytics_bp.route('/api/analytics/branch-stats', methods=['GET'])
def branch_stats():
    branches = db.session.query(Student.branch).distinct().all()
    data = []
    for (branch,) in branches:
        total = Student.query.filter_by(branch=branch).count()
        placed = Student.query.filter_by(branch=branch, placed=True).count()
        avg_pkg = db.session.query(func.avg(Placement.package)).join(Student).filter(
            Student.branch == branch, Placement.status == 'confirmed'
        ).scalar() or 0
        data.append({
            'branch': branch,
            'total': total,
            'placed': placed,
            'not_placed': total - placed,
            'avg_package': round(avg_pkg, 2)
        })
    return jsonify(data)


@analytics_bp.route('/api/analytics/top-companies', methods=['GET'])
def top_companies():
    results = db.session.query(
        Company.name,
        func.count(Placement.id).label('hires'),
        func.avg(Placement.package).label('avg_package')
    ).join(Placement).filter(Placement.status == 'confirmed').group_by(Company.id).order_by(
        func.count(Placement.id).desc()
    ).limit(10).all()

    return jsonify([{
        'company': r[0],
        'hires': r[1],
        'avg_package': round(r[2], 2)
    } for r in results])


@analytics_bp.route('/api/analytics/cgpa-vs-package', methods=['GET'])
def cgpa_vs_package():
    results = db.session.query(
        Student.cgpa, Placement.package, Student.branch
    ).join(Placement).filter(Placement.status == 'confirmed').all()

    return jsonify([{
        'cgpa': r[0],
        'package': r[1],
        'branch': r[2]
    } for r in results])


@analytics_bp.route('/api/analytics/top-skills', methods=['GET'])
def top_skills():
    students = Student.query.filter_by(placed=True).all()
    skill_count = {}
    for s in students:
        for skill in s.get_skills():
            skill_count[skill] = skill_count.get(skill, 0) + 1
    sorted_skills = sorted(skill_count.items(), key=lambda x: x[1], reverse=True)[:15]
    return jsonify({
        'labels': [s[0] for s in sorted_skills],
        'values': [s[1] for s in sorted_skills]
    })


@analytics_bp.route('/api/analytics/monthly-trends', methods=['GET'])
def monthly_trends():
    results = db.session.query(
        extract('month', Placement.placement_date).label('month'),
        func.count(Placement.id).label('count'),
        func.avg(Placement.package).label('avg_package')
    ).filter(Placement.status == 'confirmed').group_by('month').order_by('month').all()

    months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
              'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    return jsonify({
        'labels': [months[int(r[0]) - 1] for r in results if r[0]],
        'placements': [r[1] for r in results if r[0]],
        'avg_packages': [round(r[2], 2) for r in results if r[0]]
    })


@analytics_bp.route('/api/analytics/gender-distribution', methods=['GET'])
def gender_distribution():
    results = db.session.query(
        Student.gender, func.count(Student.id)
    ).group_by(Student.gender).all()
    return jsonify({
        'labels': [r[0] for r in results],
        'values': [r[1] for r in results]
    })
