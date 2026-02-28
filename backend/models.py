from datetime import datetime

# Utility functions to transform MongoDB documents to frontend-friendly dictionaries and vice-versa

def serialize_object_id(doc):
    """Convert MongoDB _id to string id for JSON serialization."""
    if not doc:
        return doc
    if '_id' in doc:
        doc['id'] = str(doc.pop('_id'))
    return doc

class Student:
    @staticmethod
    def to_dict(doc):
        if not doc:
            return None
        doc = serialize_object_id(doc)
        # Ensure dates are serialized
        if 'created_at' in doc and isinstance(doc['created_at'], datetime):
            doc['created_at'] = doc['created_at'].isoformat()
            
        # Ensure skills is a list. It was a JSON string in SQLite
        if 'skills' not in doc:
            doc['skills'] = []
            
        return doc

class Company:
    @staticmethod
    def to_dict(doc):
        if not doc:
            return None
        doc = serialize_object_id(doc)
        if 'created_at' in doc and isinstance(doc['created_at'], datetime):
            doc['created_at'] = doc['created_at'].isoformat()
            
        if 'requirements' not in doc:
            doc['requirements'] = []
            
        return doc

class Placement:
    @staticmethod
    def to_dict(doc):
        if not doc:
            return None
        doc = serialize_object_id(doc)
        
        # Ensure ObjectIds are strings
        if 'student_id' in doc:
            doc['student_id'] = str(doc['student_id'])
        if 'company_id' in doc:
            doc['company_id'] = str(doc['company_id'])
            
        if 'placement_date' in doc and isinstance(doc['placement_date'], datetime):
            doc['placement_date'] = doc['placement_date'].isoformat()
            
        return doc

