from flask import Blueprint, request, jsonify, Response
from models import db, Student, Company, Placement
import csv
import io

admin_bp = Blueprint('admin', __name__)


@admin_bp.route('/api/admin/export/students', methods=['GET'])
def export_students():
    students = Student.query.all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['ID', 'Name', 'Email', 'Branch', 'CGPA', 'Skills', 'Projects', 'Internships', 'Placed', 'Gender'])

    for s in students:
        writer.writerow([s.id, s.name, s.email, s.branch, s.cgpa,
                         ', '.join(s.get_skills()), s.projects, s.internships,
                         'Yes' if s.placed else 'No', s.gender])

    output.seek(0)
    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={'Content-Disposition': 'attachment; filename=students_export.csv'}
    )


@admin_bp.route('/api/admin/export/placements', methods=['GET'])
def export_placements():
    placements = Placement.query.all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['ID', 'Student', 'Company', 'Role', 'Package (LPA)', 'Date', 'Status'])

    for p in placements:
        writer.writerow([p.id, p.student.name if p.student else '', p.company.name if p.company else '',
                         p.role, p.package, p.placement_date.strftime('%Y-%m-%d') if p.placement_date else '', p.status])

    output.seek(0)
    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={'Content-Disposition': 'attachment; filename=placements_export.csv'}
    )


@admin_bp.route('/api/admin/stats', methods=['GET'])
def admin_stats():
    return jsonify({
        'total_students': Student.query.count(),
        'total_companies': Company.query.count(),
        'total_placements': Placement.query.count(),
        'placed_students': Student.query.filter_by(placed=True).count(),
        'branches': [b[0] for b in db.session.query(Student.branch).distinct().all()]
    })


@admin_bp.route('/api/admin/reset-database', methods=['POST'])
def reset_database():
    data = request.get_json()
    confirm = data.get('confirm', False)
    if not confirm:
        return jsonify({'error': 'Please confirm reset by sending {"confirm": true}'}), 400

    Placement.query.delete()
    Company.query.delete()
    Student.query.delete()
    db.session.commit()
    return jsonify({'message': 'Database reset successful'})
