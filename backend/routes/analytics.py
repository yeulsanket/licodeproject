from flask import Blueprint, jsonify
from db import get_db

analytics_bp = Blueprint('analytics', __name__)


@analytics_bp.route('/api/analytics/stats', methods=['GET'])
def get_stats():
    db = get_db()
    
    total_students = db.students.count_documents({})
    placed_students = db.students.count_documents({'placed': True})
    total_companies = db.companies.count_documents({})
    total_placements = db.placements.count_documents({'status': 'confirmed'})
    
    # Aggregation for package stats
    pipeline = [
        {'$match': {'status': 'confirmed'}},
        {'$group': {
            '_id': None,
            'avg': {'$avg': '$package'},
            'max': {'$max': '$package'},
            'min': {'$min': '$package'}
        }}
    ]
    
    stats_result = list(db.placements.aggregate(pipeline))
    if stats_result:
        stats = stats_result[0]
        avg_package = stats.get('avg', 0)
        highest_package = stats.get('max', 0)
        lowest_package = stats.get('min', 0)
    else:
        avg_package = highest_package = lowest_package = 0

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
    db = get_db()
    placed = db.students.count_documents({'placed': True})
    not_placed = db.students.count_documents({'placed': False})
    return jsonify({'placed': placed, 'not_placed': not_placed})


@analytics_bp.route('/api/analytics/salary-distribution', methods=['GET'])
def salary_distribution():
    db = get_db()
    
    # We can do this via aggregation or just pull and sort
    # Aggregation is cleaner for large datasets
    pipeline = [
        {'$match': {'status': 'confirmed'}},
        {'$bucket': {
            'groupBy': '$package',
            'boundaries': [0, 3, 5, 8, 12, 20, 1000],
            'default': '20+ LPA',
            'output': {
                'count': {'$sum': 1}
            }
        }}
    ]
    
    results = db.placements.aggregate(pipeline)
    
    # Map bucket IDs to ranges
    bucket_map = {
        0: '0-3 LPA', 3: '3-5 LPA', 5: '5-8 LPA',
        8: '8-12 LPA', 12: '12-20 LPA', '20+ LPA': '20+ LPA'
    }
    
    ranges = {v: 0 for v in bucket_map.values()}
    
    for r in results:
        b_id = r['_id']
        label = bucket_map.get(b_id, '20+ LPA')
        ranges[label] = r['count']
        
    return jsonify({'labels': list(ranges.keys()), 'values': list(ranges.values())})


@analytics_bp.route('/api/analytics/branch-stats', methods=['GET'])
def branch_stats():
    db = get_db()
    
    # Complex aggregation to get all branch stats in one go
    pipeline = [
        {
            '$lookup': {
                'from': 'placements',
                'let': {'student_id': '$_id'},
                'pipeline': [
                    {'$match': {
                        '$expr': {'$eq': ['$student_id', '$$student_id']},
                        'status': 'confirmed'
                    }}
                ],
                'as': 'placement_info'
            }
        },
        {
            '$group': {
                '_id': '$branch',
                'total': {'$sum': 1},
                'placed': {'$sum': {'$cond': [{'$eq': ['$placed', True]}, 1, 0]}},
                'avg_package': {'$avg': {'$arrayElemAt': ['$placement_info.package', 0]}}
            }
        },
        {'$sort': {'_id': 1}}
    ]
    
    results = db.students.aggregate(pipeline)
    
    data = []
    for r in results:
        branch = r['_id']
        total = r['total']
        placed = r['placed']
        avg_pkg = r.get('avg_package') or 0
        
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
    db = get_db()
    
    pipeline = [
        {'$match': {'status': 'confirmed'}},
        {
            '$lookup': {
                'from': 'companies',
                'localField': 'company_id',
                'foreignField': '_id',
                'as': 'company'
            }
        },
        {'$unwind': '$company'},
        {
            '$group': {
                '_id': '$company_id',
                'name': {'$first': '$company.name'},
                'hires': {'$sum': 1},
                'avg_package': {'$avg': '$package'}
            }
        },
        {'$sort': {'hires': -1}},
        {'$limit': 10}
    ]
    
    results = db.placements.aggregate(pipeline)
    
    return jsonify([{
        'company': r['name'],
        'hires': r['hires'],
        'avg_package': round(r['avg_package'], 2)
    } for r in results])


@analytics_bp.route('/api/analytics/cgpa-vs-package', methods=['GET'])
def cgpa_vs_package():
    db = get_db()
    
    pipeline = [
        {'$match': {'status': 'confirmed'}},
        {
            '$lookup': {
                'from': 'students',
                'localField': 'student_id',
                'foreignField': '_id',
                'as': 'student'
            }
        },
        {'$unwind': '$student'},
        {
            '$project': {
                '_id': 0,
                'cgpa': '$student.cgpa',
                'package': '$package',
                'branch': '$student.branch'
            }
        }
    ]
    
    results = list(db.placements.aggregate(pipeline))
    return jsonify(results)


@analytics_bp.route('/api/analytics/top-skills', methods=['GET'])
def top_skills():
    db = get_db()
    
    pipeline = [
        {'$match': {'placed': True}},
        {'$unwind': '$skills'},
        {
            '$group': {
                '_id': '$skills',
                'count': {'$sum': 1}
            }
        },
        {'$sort': {'count': -1}},
        {'$limit': 15}
    ]
    
    results = db.students.aggregate(pipeline)
    
    labels = []
    values = []
    for r in results:
        labels.append(r['_id'])
        values.append(r['count'])
        
    return jsonify({
        'labels': labels,
        'values': values
    })


@analytics_bp.route('/api/analytics/monthly-trends', methods=['GET'])
def monthly_trends():
    db = get_db()
    
    pipeline = [
        {'$match': {'status': 'confirmed'}},
        {
            '$group': {
                '_id': {'$month': '$placement_date'},
                'count': {'$sum': 1},
                'avg_package': {'$avg': '$package'}
            }
        },
        {'$sort': {'_id': 1}}
    ]
    
    results = db.placements.aggregate(pipeline)
    
    months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
              'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
              
    labels = []
    placements = []
    avg_packages = []
    
    for r in results:
        if r['_id']:
            month_idx = r['_id'] - 1
            if 0 <= month_idx < 12:
                labels.append(months[month_idx])
                placements.append(r['count'])
                avg_packages.append(round(r['avg_package'], 2))
    
    return jsonify({
        'labels': labels,
        'placements': placements,
        'avg_packages': avg_packages
    })


@analytics_bp.route('/api/analytics/gender-distribution', methods=['GET'])
def gender_distribution():
    db = get_db()
    
    pipeline = [
        {
            '$group': {
                '_id': '$gender',
                'count': {'$sum': 1}
            }
        }
    ]
    
    results = db.students.aggregate(pipeline)
    
    labels = []
    values = []
    for r in results:
        labels.append(r['_id'] or 'Other')
        values.append(r['count'])
        
    return jsonify({
        'labels': labels,
        'values': values
    })
