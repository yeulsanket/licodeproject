from flask import Blueprint, request, jsonify
from models import db, Placement, Student, Company

placements_bp = Blueprint('placements', __name__)


@placements_bp.route('/api/placements', methods=['GET'])
def get_placements():
    status = request.args.get('status')
    query = Placement.query

    if status:
        query = query.filter(Placement.status == status)

    placements = query.order_by(Placement.placement_date.desc()).all()
    return jsonify([p.to_dict() for p in placements])


@placements_bp.route('/api/placements/<int:placement_id>', methods=['GET'])
def get_placement(placement_id):
    placement = Placement.query.get_or_404(placement_id)
    return jsonify(placement.to_dict())


@placements_bp.route('/api/placements', methods=['POST'])
def create_placement():
    data = request.get_json()
    placement = Placement(
        student_id=data['student_id'],
        company_id=data['company_id'],
        role=data['role'],
        package=data['package'],
        status=data.get('status', 'confirmed')
    )
    # Mark student as placed
    student = Student.query.get(data['student_id'])
    if student:
        student.placed = True

    db.session.add(placement)
    db.session.commit()
    return jsonify(placement.to_dict()), 201


@placements_bp.route('/api/placements/<int:placement_id>', methods=['DELETE'])
def delete_placement(placement_id):
    placement = Placement.query.get_or_404(placement_id)
    db.session.delete(placement)
    db.session.commit()
    return jsonify({'message': 'Placement deleted successfully'})
