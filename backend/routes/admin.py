from flask import Blueprint, request, jsonify, Response
from app import get_db
from models import Student, Company, Placement
import csv
import io

admin_bp = Blueprint('admin', __name__)


@admin_bp.route('/api/admin/export/students', methods=['GET'])
def export_students():
    db = get_db()
    students_cursor = db.students.find({})
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['ID', 'Name', 'Email', 'Branch', 'CGPA', 'Skills', 'Projects', 'Internships', 'Placed', 'Gender'])

    for s in students_cursor:
        skills = s.get('skills', [])
        writer.writerow([str(s['_id']), s.get('name'), s.get('email'), s.get('branch'), s.get('cgpa'),
                         ', '.join(skills), s.get('projects'), s.get('internships'),
                         'Yes' if s.get('placed') else 'No', s.get('gender')])

    output.seek(0)
    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={'Content-Disposition': 'attachment; filename=students_export.csv'}
    )


@admin_bp.route('/api/admin/export/placements', methods=['GET'])
def export_placements():
    db = get_db()
    
    pipeline = [
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
        {'$unwind': {'path': '$student', 'preserveNullAndEmptyArrays': True}},
        {'$unwind': {'path': '$company', 'preserveNullAndEmptyArrays': True}}
    ]
    
    placements_cursor = db.placements.aggregate(pipeline)
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['ID', 'Student', 'Company', 'Role', 'Package (LPA)', 'Date', 'Status'])

    for p in placements_cursor:
        s_name = p.get('student', {}).get('name', '')
        c_name = p.get('company', {}).get('name', '')
        date_str = p.get('placement_date').strftime('%Y-%m-%d') if p.get('placement_date') else ''
        
        writer.writerow([str(p['_id']), s_name, c_name, p.get('role'), p.get('package'), date_str, p.get('status')])

    output.seek(0)
    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={'Content-Disposition': 'attachment; filename=placements_export.csv'}
    )


@admin_bp.route('/api/admin/stats', methods=['GET'])
def admin_stats():
    db = get_db()
    return jsonify({
        'total_students': db.students.count_documents({}),
        'total_companies': db.companies.count_documents({}),
        'total_placements': db.placements.count_documents({}),
        'placed_students': db.students.count_documents({'placed': True}),
        'branches': db.students.distinct('branch')
    })


@admin_bp.route('/api/admin/reset-database', methods=['POST'])
def reset_database():
    data = request.get_json()
    confirm = data.get('confirm', False)
    if not confirm:
        return jsonify({'error': 'Please confirm reset by sending {"confirm": true}'}), 400

    db = get_db()
    db.placements.delete_many({})
    db.companies.delete_many({})
    db.students.delete_many({})
    
    return jsonify({'message': 'Database reset successful'})
