import os
import json
from config import Config

try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False


def _get_client():
    """Return a Groq client if API key is configured, else None."""
    if not GROQ_AVAILABLE:
        return None
    api_key = Config.GROQ_API_KEY
    if not api_key or api_key == 'your_groq_api_key_here':
        return None
    return Groq(api_key=api_key)


def _call_groq(prompt: str, system: str = "You are a helpful AI career advisor.", max_tokens: int = 2048) -> str | None:
    """Call Groq API directly and return the text response, or None on failure."""
    client = _get_client()
    if not client:
        return None
    try:
        response = client.chat.completions.create(
            model=Config.GROQ_MODEL or "llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=max_tokens
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Groq API error: {e}")
        return None


def _parse_json(text):
    """Parse JSON from AI response, handling markdown code blocks."""
    if not text:
        return None
    try:
        return json.loads(text.strip())
    except json.JSONDecodeError:
        try:
            if "```json" in text:
                content = text.split("```json")[1].split("```")[0].strip()
                return json.loads(content)
            elif "```" in text:
                content = text.split("```")[1].split("```")[0].strip()
                return json.loads(content)
        except (IndexError, json.JSONDecodeError):
            pass
    return None


# ─── Resume Analyzer ──────────────────────────────────────────────────────────

def analyze_resume(resume_text, target_role="Software Engineer"):
    prompt = f"""Analyze the following resume for the target role of {target_role}.

Resume:
{resume_text}

Respond in valid JSON format only:
{{
    "skills_found": ["skill1", "skill2"],
    "experience_years": 0,
    "education": "degree details",
    "match_score": 75,
    "strengths": ["strength1", "strength2"],
    "weaknesses": ["weakness1", "weakness2"],
    "recommendations": ["rec1", "rec2"],
    "summary": "Brief professional summary"
}}"""

    result = _call_groq(prompt)
    if result:
        parsed = _parse_json(result)
        if parsed:
            return parsed
    return _fallback_resume_analysis(resume_text, target_role)


# ─── Skill Gap Analysis ───────────────────────────────────────────────────────

def skill_gap_analysis(student_skills, target_role, student_info=None):
    info_str = ""
    if student_info:
        info_str = f"\nStudent CGPA: {student_info.get('cgpa', 'N/A')}, Projects: {student_info.get('projects', 0)}, Internships: {student_info.get('internships', 0)}, Branch: {student_info.get('branch', 'N/A')}"

    prompt = f"""Analyze the skill gap for a student targeting the role of {target_role}.

Current Skills: {', '.join(student_skills)}{info_str}

Respond in valid JSON format only:
{{
    "missing_skills": ["skill1", "skill2"],
    "skills_to_improve": ["skill1", "skill2"],
    "learning_path": [
        {{"skill": "skill_name", "resource": "resource_name", "duration": "2 weeks", "priority": "high"}}
    ],
    "estimated_time_to_ready": "3-6 months",
    "match_percentage": 60,
    "recommendations": ["rec1", "rec2"]
}}"""

    result = _call_groq(prompt)
    if result:
        parsed = _parse_json(result)
        if parsed:
            return parsed
    return _fallback_skill_gap(student_skills, target_role)


# ─── Salary Predictor ─────────────────────────────────────────────────────────

def predict_salary(cgpa, skills, projects, internships, branch):
    skills_str = ', '.join(skills) if isinstance(skills, list) else skills

    prompt = f"""Predict a realistic salary range for a fresh graduate in India with this profile:

CGPA: {cgpa}
Skills: {skills_str}
Number of Projects: {projects}
Internships: {internships}
Branch: {branch}

Respond in valid JSON format only:
{{
    "predicted_min_lpa": 4.5,
    "predicted_max_lpa": 8.0,
    "predicted_avg_lpa": 6.0,
    "confidence": "medium",
    "factors": [
        {{"factor": "CGPA", "impact": "positive", "detail": "Above average CGPA"}},
        {{"factor": "Skills", "impact": "positive", "detail": "In-demand technology stack"}}
    ],
    "recommendations_to_increase": ["Learn cloud computing", "Get AWS certification"],
    "market_insight": "Brief market insight for this profile"
}}"""

    result = _call_groq(prompt, system="You are an expert salary prediction AI for fresh graduates in India.")
    if result:
        parsed = _parse_json(result)
        if parsed:
            return parsed
    return _fallback_salary_prediction(cgpa, skills, projects, internships, branch)


# ─── Career Roadmap ───────────────────────────────────────────────────────────

def generate_roadmap(student_info, career_goal, target_package=None):
    pkg_str = f"\nTarget Package: {target_package} LPA" if target_package else ""

    prompt = f"""Create a personalized 6-month career roadmap for this student.

Student Profile:
- Name: {student_info.get('name', 'Student')}
- Branch: {student_info.get('branch', 'N/A')}
- CGPA: {student_info.get('cgpa', 'N/A')}
- Current Skills: {', '.join(student_info.get('skills', []))}
- Projects: {student_info.get('projects', 0)}
- Internships: {student_info.get('internships', 0)}{pkg_str}

Career Goal: {career_goal}

Respond in valid JSON format only:
{{
    "career_goal": "{career_goal}",
    "current_readiness": 45,
    "months": [
        {{
            "month": 1,
            "title": "Foundation Building",
            "focus_areas": ["area1", "area2"],
            "skills_to_learn": ["skill1", "skill2"],
            "projects": ["project1"],
            "certifications": ["cert1"],
            "milestones": ["milestone1"]
        }}
    ],
    "resources": ["resource1", "resource2"],
    "tips": ["tip1", "tip2"]
}}"""

    result = _call_groq(prompt, system="You are an expert career counselor for engineering students in India.")
    if result:
        parsed = _parse_json(result)
        if parsed:
            return parsed
    return _fallback_roadmap(student_info, career_goal)


# ─── Chat with AI ─────────────────────────────────────────────────────────────

def chat_with_ai(message, conversation_history=None):
    client = _get_client()
    if not client:
        return _fallback_chat(message)

    messages = [{
        "role": "system",
        "content": "You are an AI placement assistant for a college. Help students with career guidance, interview preparation, resume tips, salary negotiation, and placement-related queries. Be helpful, encouraging, and specific. Keep responses concise but informative."
    }]

    if conversation_history:
        for msg in conversation_history[-6:]:
            role = msg.get("role", "user")
            # Groq only accepts: 'user', 'assistant', 'system'
            # Frontend uses 'ai' as display role — map it to 'assistant'
            if role not in ("user", "assistant", "system"):
                role = "assistant"
            messages.append({"role": role, "content": msg.get("content", "")})

    messages.append({"role": "user", "content": message})

    try:
        response = client.chat.completions.create(
            model=Config.GROQ_MODEL or "llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.7,
            max_tokens=1024
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"I'm having trouble connecting to the AI service. Error: {str(e)}"


# ─── Fallback functions (when Groq API is unavailable) ───────────────────────

def _fallback_resume_analysis(resume_text, target_role):
    words = resume_text.lower().split()
    common_skills = ['python', 'java', 'javascript', 'react', 'node', 'sql', 'html', 'css',
                     'c++', 'machine learning', 'flask', 'django', 'aws', 'docker', 'git']
    found_skills = [s for s in common_skills if s in words]
    return {
        "skills_found": found_skills,
        "experience_years": 0,
        "education": "Extracted from resume",
        "match_score": min(len(found_skills) * 10, 85),
        "strengths": found_skills[:3] if found_skills else ["Resume submitted"],
        "weaknesses": ["AI analysis unavailable — Groq API key not configured"],
        "recommendations": ["Add your Groq API key in Render environment variables for full AI analysis"],
        "summary": f"Basic keyword analysis for {target_role}."
    }


def _fallback_skill_gap(skills, target_role):
    role_requirements = {
        "Software Engineer": ["DSA", "System Design", "Python", "Java", "Git", "SQL", "REST APIs"],
        "Data Scientist": ["Python", "Machine Learning", "Statistics", "SQL", "TensorFlow", "Pandas"],
        "Web Developer": ["HTML", "CSS", "JavaScript", "React", "Node.js", "MongoDB", "Git"],
        "DevOps Engineer": ["Docker", "Kubernetes", "AWS", "CI/CD", "Linux", "Terraform"],
    }
    required = role_requirements.get(target_role, role_requirements["Software Engineer"])
    skills_lower = [s.lower() for s in skills]
    missing = [r for r in required if r.lower() not in skills_lower]
    return {
        "missing_skills": missing,
        "skills_to_improve": skills[:3],
        "learning_path": [{"skill": s, "resource": f"Learn {s} online", "duration": "2-4 weeks", "priority": "high"} for s in missing[:5]],
        "estimated_time_to_ready": "3-6 months",
        "match_percentage": max(0, 100 - len(missing) * 15),
        "recommendations": ["Add Groq API key for personalized AI analysis"]
    }


def _fallback_salary_prediction(cgpa, skills, projects, internships, branch):
    base = 3.5
    base += (cgpa - 6) * 1.2 if cgpa > 6 else 0
    skill_count = len(skills) if isinstance(skills, list) else len(skills.split(','))
    base += skill_count * 0.3
    base += projects * 0.4
    base += internships * 0.8
    return {
        "predicted_min_lpa": round(max(2.5, base - 1.5), 1),
        "predicted_max_lpa": round(base + 2.5, 1),
        "predicted_avg_lpa": round(base, 1),
        "confidence": "low (AI unavailable)",
        "factors": [
            {"factor": "CGPA", "impact": "positive" if cgpa > 7 else "neutral", "detail": f"CGPA: {cgpa}"},
            {"factor": "Skills", "impact": "positive", "detail": f"{skill_count} skills listed"}
        ],
        "recommendations_to_increase": ["Add Groq API key for AI-powered predictions"],
        "market_insight": "Basic estimation. Add Groq API key for accurate market-based predictions."
    }


def _fallback_roadmap(student_info, career_goal):
    return {
        "career_goal": career_goal,
        "current_readiness": 40,
        "months": [
            {"month": i, "title": f"Month {i}", "focus_areas": ["Study core concepts"], "skills_to_learn": ["Add Groq API for detailed plan"], "projects": ["Practice project"], "certifications": [], "milestones": [f"Complete month {i} goals"]}
            for i in range(1, 7)
        ],
        "resources": ["Add Groq API key for personalized AI roadmap"],
        "tips": ["Focus on fundamentals", "Build projects", "Practice coding daily"]
    }


def _fallback_chat(message):
    return "👋 I'm the AI placement assistant! To unlock full AI-powered responses, please add your GROQ_API_KEY in the Render environment variables dashboard. In the meantime, I can tell you that consistent practice, building projects, and networking are key to landing a great placement!"
