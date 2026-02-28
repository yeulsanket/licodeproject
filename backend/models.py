from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

db = SQLAlchemy()


class Student(db.Model):
    __tablename__ = 'students'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    branch = db.Column(db.String(50), nullable=False)
    cgpa = db.Column(db.Float, nullable=False)
    skills = db.Column(db.Text, default='[]')  # JSON array
    projects = db.Column(db.Integer, default=0)
    internships = db.Column(db.Integer, default=0)
    placed = db.Column(db.Boolean, default=False)
    resume_text = db.Column(db.Text, default='')
    gender = db.Column(db.String(10), default='Other')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    placements = db.relationship('Placement', backref='student', lazy=True, cascade='all, delete-orphan')

    def get_skills(self):
        try:
            return json.loads(self.skills) if self.skills else []
        except (json.JSONDecodeError, TypeError):
            return []

    def set_skills(self, skills_list):
        self.skills = json.dumps(skills_list)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'branch': self.branch,
            'cgpa': self.cgpa,
            'skills': self.get_skills(),
            'projects': self.projects,
            'internships': self.internships,
            'placed': self.placed,
            'resume_text': self.resume_text,
            'gender': self.gender,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Company(db.Model):
    __tablename__ = 'companies'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    industry = db.Column(db.String(50), nullable=False)
    min_package = db.Column(db.Float, default=0)
    max_package = db.Column(db.Float, default=0)
    requirements = db.Column(db.Text, default='[]')  # JSON array
    website = db.Column(db.String(200), default='')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    placements = db.relationship('Placement', backref='company', lazy=True, cascade='all, delete-orphan')

    def get_requirements(self):
        try:
            return json.loads(self.requirements) if self.requirements else []
        except (json.JSONDecodeError, TypeError):
            return []

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'industry': self.industry,
            'min_package': self.min_package,
            'max_package': self.max_package,
            'requirements': self.get_requirements(),
            'website': self.website,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Placement(db.Model):
    __tablename__ = 'placements'

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    role = db.Column(db.String(100), nullable=False)
    package = db.Column(db.Float, nullable=False)
    placement_date = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default='confirmed')  # confirmed, pending, rejected

    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'company_id': self.company_id,
            'student_name': self.student.name if self.student else None,
            'company_name': self.company.name if self.company else None,
            'role': self.role,
            'package': self.package,
            'placement_date': self.placement_date.isoformat() if self.placement_date else None,
            'status': self.status
        }
