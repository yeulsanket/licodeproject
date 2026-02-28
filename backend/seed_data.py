"""
Seed script to generate realistic placement data for MongoDB.
Run: python seed_data.py
"""
import sys
import os
import json
import random
from datetime import datetime, timedelta

# Add parent dir to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from db import get_db

# ─── Data pools ──────────────────────────────────────────────────────────

BRANCHES = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil']

SKILLS_POOL = {
    'Computer Science': ['Python', 'Java', 'C++', 'JavaScript', 'React', 'Node.js', 'SQL', 'MongoDB',
                         'Machine Learning', 'Deep Learning', 'Docker', 'AWS', 'Git', 'Flask', 'Django',
                         'TypeScript', 'Kubernetes', 'TensorFlow', 'REST APIs', 'GraphQL', 'Redis', 'Linux'],
    'Information Technology': ['Python', 'Java', 'JavaScript', 'SQL', 'HTML', 'CSS', 'PHP', 'React',
                               'Angular', 'Node.js', 'MongoDB', 'Git', 'AWS', 'Cybersecurity',
                               'Cloud Computing', 'DevOps', 'Networking', 'Linux', 'REST APIs'],
    'Electronics': ['MATLAB', 'VHDL', 'Embedded C', 'Arduino', 'Raspberry Pi', 'PCB Design',
                    'Signal Processing', 'IoT', 'Python', 'C', 'Microcontrollers', 'VLSI'],
    'Mechanical': ['AutoCAD', 'SolidWorks', 'ANSYS', 'CATIA', 'MATLAB', 'CNC Programming',
                   'Thermodynamics', '3D Printing', 'FEA', 'CFD', 'Python', 'GD&T'],
    'Civil': ['AutoCAD', 'STAAD Pro', 'Revit', 'ETABS', 'Primavera', 'MS Project',
              'Surveying', 'GIS', 'BIM', 'MATLAB', 'Python', 'SAP2000']
}

COMPANIES_DATA = [
    ('Google', 'Technology', 12, 45), ('Microsoft', 'Technology', 10, 40),
    ('Amazon', 'Technology', 8, 35), ('Meta', 'Technology', 15, 50),
    ('Apple', 'Technology', 14, 48), ('Netflix', 'Technology', 18, 55),
    ('Infosys', 'IT Services', 3.6, 8), ('TCS', 'IT Services', 3.5, 7),
    ('Wipro', 'IT Services', 3.5, 7.5), ('HCL Technologies', 'IT Services', 3.8, 9),
    ('Cognizant', 'IT Services', 4, 10), ('Tech Mahindra', 'IT Services', 3.5, 8),
    ('Accenture', 'Consulting', 4.5, 12), ('Deloitte', 'Consulting', 6, 15),
    ('McKinsey', 'Consulting', 12, 30), ('BCG', 'Consulting', 14, 32),
    ('JPMorgan Chase', 'Finance', 8, 22), ('Goldman Sachs', 'Finance', 10, 28),
    ('Morgan Stanley', 'Finance', 9, 25), ('Barclays', 'Finance', 7, 18),
    ('Flipkart', 'E-Commerce', 8, 25), ('Swiggy', 'E-Commerce', 6, 18),
    ('Zomato', 'E-Commerce', 5, 16), ('Myntra', 'E-Commerce', 6, 15),
    ('Adobe', 'Technology', 10, 30), ('Salesforce', 'Technology', 10, 28),
    ('Oracle', 'Technology', 7, 20), ('IBM', 'Technology', 5, 15),
    ('PayPal', 'Fintech', 8, 22), ('Razorpay', 'Fintech', 7, 20),
    ('PhonePe', 'Fintech', 6, 18), ('Paytm', 'Fintech', 5, 14),
    ('L&T', 'Engineering', 4, 10), ('Tata Motors', 'Automotive', 4, 9),
    ('Mahindra', 'Automotive', 3.8, 8), ('Bosch', 'Engineering', 5, 12),
    ('Siemens', 'Engineering', 5, 14), ('ABB', 'Engineering', 4.5, 11),
    ('Samsung', 'Electronics', 6, 18), ('Qualcomm', 'Electronics', 10, 25),
    ('Intel', 'Electronics', 8, 22), ('Texas Instruments', 'Electronics', 7, 18),
    ('Uber', 'Technology', 9, 26), ('Ola', 'Technology', 5, 14),
    ('BYJU\'s', 'EdTech', 5, 12), ('Unacademy', 'EdTech', 4, 10),
    ('Capgemini', 'IT Services', 3.8, 8.5), ('LTIMindtree', 'IT Services', 4, 9.5),
    ('Persistent Systems', 'IT Services', 4.5, 10), ('Jio', 'Telecom', 5, 12),
]

ROLES = {
    'Computer Science': ['Software Engineer', 'Full Stack Developer', 'Backend Developer',
                         'Frontend Developer', 'Data Scientist', 'ML Engineer', 'DevOps Engineer',
                         'Cloud Engineer', 'SDE-I', 'Software Analyst'],
    'Information Technology': ['Software Engineer', 'Web Developer', 'System Administrator',
                               'IT Analyst', 'Cloud Engineer', 'QA Engineer', 'DevOps Engineer',
                               'Full Stack Developer', 'Technical Support', 'Network Engineer'],
    'Electronics': ['Embedded Engineer', 'VLSI Design Engineer', 'Hardware Engineer',
                    'IoT Developer', 'Signal Processing Engineer', 'Test Engineer',
                    'Electronics Engineer', 'RF Engineer'],
    'Mechanical': ['Design Engineer', 'Manufacturing Engineer', 'Quality Engineer',
                   'Project Engineer', 'CAD Engineer', 'Production Engineer',
                   'Mechanical Engineer', 'R&D Engineer'],
    'Civil': ['Structural Engineer', 'Site Engineer', 'Project Manager',
              'Civil Engineer', 'Construction Manager', 'Planning Engineer',
              'Design Engineer', 'Estimation Engineer']
}

FIRST_NAMES_M = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Reyansh', 'Sai', 'Arnav',
                 'Dhruv', 'Kabir', 'Kian', 'Darsh', 'Rishi', 'Ritvik', 'Ansh', 'Aarush',
                 'Shaurya', 'Advik', 'Atharv', 'Ayaan', 'Krishna', 'Ishaan', 'Harsh', 'Rohan',
                 'Aryan', 'Dev', 'Rahul', 'Amit', 'Raj', 'Vikram', 'Mohit', 'Nikhil', 'Pranav',
                 'Siddharth', 'Tushar', 'Yash', 'Chirag', 'Gaurav', 'Akash', 'Varun']
FIRST_NAMES_F = ['Ananya', 'Diya', 'Myra', 'Sara', 'Aanya', 'Aadhya', 'Aarohi', 'Avni',
                 'Kiara', 'Mishka', 'Prisha', 'Navya', 'Riya', 'Shreya', 'Kavya', 'Tanya',
                 'Pooja', 'Neha', 'Sneha', 'Priya', 'Divya', 'Swati', 'Nandini', 'Ishita',
                 'Aditi', 'Meera', 'Sakshi', 'Tanvi', 'Kriti', 'Aisha']
LAST_NAMES = ['Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Reddy', 'Nair', 'Joshi',
              'Shah', 'Mehta', 'Verma', 'Agarwal', 'Mishra', 'Iyer', 'Rao', 'Desai',
              'Patil', 'Kulkarni', 'Chopra', 'Malhotra', 'Bhat', 'Chauhan', 'Pandey',
              'Saxena', 'Tiwari', 'Dubey', 'Srivastava', 'Das', 'Banerjee', 'Mukherjee']


def generate_email(name):
    clean = name.lower().replace(' ', '.').replace("'", '')
    suffix = random.randint(10, 999)
    domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'student.edu']
    return f"{clean}{suffix}@{random.choice(domains)}"


def seed():
    app = create_app()
    with app.app_context():
        db = get_db()
        
        print("Clearing existing data...")
        db.placements.delete_many({})
        db.companies.delete_many({})
        db.students.delete_many({})

        # ── Create Companies ──
        print("Creating companies...")
        companies = []
        for name, industry, min_pkg, max_pkg in COMPANIES_DATA:
            req_skills = random.sample(SKILLS_POOL['Computer Science'] + SKILLS_POOL['Information Technology'], random.randint(3, 6))
            company = {
                'name': name, 'industry': industry,
                'min_package': min_pkg, 'max_package': max_pkg,
                'requirements': req_skills,
                'website': f"https://www.{name.lower().replace(' ', '').replace(chr(39), '')}.com",
                'created_at': datetime.utcnow()
            }
            companies.append(company)
            
        result = db.companies.insert_many(companies)
        inserted_company_ids = result.inserted_ids
        print(f"   Created {len(inserted_company_ids)} companies")

        # ── Create Students ──
        print("Creating students...")
        students = []
        used_emails = set()
        for i in range(1000):
            gender = random.choices(['Male', 'Female'], weights=[55, 45])[0]
            first = random.choice(FIRST_NAMES_M if gender == 'Male' else FIRST_NAMES_F)
            last = random.choice(LAST_NAMES)
            name = f"{first} {last}"

            email = generate_email(name)
            while email in used_emails:
                email = generate_email(name)
            used_emails.add(email)

            branch = random.choice(BRANCHES)
            cgpa = round(random.gauss(7.2, 1.3), 2)
            cgpa = max(4.0, min(10.0, cgpa))

            num_skills = random.randint(3, 10)
            skills = random.sample(SKILLS_POOL[branch], min(num_skills, len(SKILLS_POOL[branch])))

            student = {
                'name': name, 'email': email, 'branch': branch,
                'cgpa': cgpa, 'skills': skills,
                'projects': random.randint(0, 8),
                'internships': random.randint(0, 4),
                'placed': False, 'gender': gender,
                'resume_text': f"Experienced {branch} student with skills in {', '.join(skills[:3]) if skills else 'various areas'}.",
                'created_at': datetime.utcnow()
            }
            students.append(student)

        result = db.students.insert_many(students)
        inserted_student_ids = result.inserted_ids
        print(f"   Created {len(inserted_student_ids)} students")

        # ── Create Placements ──
        print("Creating placements...")
        placements = []
        placed_indices = random.sample(range(len(inserted_student_ids)), k=int(len(inserted_student_ids) * 0.7))

        # We need a list of company docs with original info for logic below
        companies_info = list(db.companies.find({}))

        for i, student_id in enumerate(inserted_student_ids):
            if i in placed_indices:
                student = students[i]  # Same order as inserted_student_ids
                company = random.choice(companies_info)

                # Higher CGPA → higher chance of better package
                pkg_range = company['max_package'] - company['min_package']
                cgpa_factor = (student['cgpa'] - 4) / 6  # normalize 4-10 to 0-1
                base_pkg = company['min_package'] + pkg_range * cgpa_factor * random.uniform(0.5, 1.2)
                pkg = round(max(company['min_package'], min(company['max_package'], base_pkg)), 2)

                roles_for_branch = ROLES.get(student['branch'], ROLES['Computer Science'])
                role = random.choice(roles_for_branch)

                month = random.randint(1, 12)
                day = random.randint(1, 28)
                placement_date = datetime(2025, month, day)

                placement = {
                    'student_id': student_id,
                    'company_id': company['_id'],
                    'role': role,
                    'package': pkg,
                    'placement_date': placement_date,
                    'status': 'confirmed'
                }
                placements.append(placement)
                
                # Update local student record for later db update
                student['placed'] = True
                
        # Bulk Insert Placements
        if placements:
            db.placements.insert_many(placements)
            
            # Update students who were placed
            placed_ids = [inserted_student_ids[i] for i in placed_indices]
            db.students.update_many(
                {'_id': {'$in': placed_ids}},
                {'$set': {'placed': True}}
            )

        print(f"   Created {len(placements)} placements")

        # ── Summary ──
        total = db.students.count_documents({})
        placed = db.students.count_documents({'placed': True})
        print(f"\nSeed complete!")
        print(f"   Students: {total}")
        print(f"   Placed:   {placed} ({placed/total*100:.1f}%)")
        print(f"   Companies: {db.companies.count_documents({})}")
        print(f"   Placements: {db.placements.count_documents({})}")


if __name__ == '__main__':
    seed()
