import os
import json
from config import Config

try:
    from groq import Groq
    from langchain_groq import ChatGroq
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_core.output_parsers import StrOutputParser
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False


def get_groq_client():
    if not GROQ_AVAILABLE:
        return None
    api_key = Config.GROQ_API_KEY
    if not api_key or api_key == 'your_groq_api_key_here':
        return None
    return Groq(api_key=api_key)


def get_langchain_llm():
    if not GROQ_AVAILABLE:
        return None
    api_key = Config.GROQ_API_KEY
    if not api_key or api_key == 'your_groq_api_key_here':
        return None
    return ChatGroq(
        groq_api_key=api_key,
        model_name=Config.GROQ_MODEL,
        temperature=0.7,
        max_tokens=2048
    )


def analyze_resume(resume_text, target_role="Software Engineer"):
    llm = get_langchain_llm()
    if not llm:
        return _fallback_resume_analysis(resume_text, target_role)

    prompt = ChatPromptTemplate.from_template(
        """You are an expert career counselor analyzing resumes. Analyze the following resume for the target role of {target_role}.

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
    )

def _parse_json(text):
    """Attempt to parse JSON from AI response, handle markdown wrapping."""
    if not text:
        return None
    try:
        # Try direct parse
        return json.loads(text.strip())
    except json.JSONDecodeError:
        # Try extracting from markdown block
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


def analyze_resume(resume_text, target_role="Software Engineer"):
    llm = get_langchain_llm()
    if not llm:
        return _fallback_resume_analysis(resume_text, target_role)

    prompt = ChatPromptTemplate.from_template(
        """You are an expert career counselor analyzing resumes. Analyze the following resume for the target role of {target_role}.

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
    )

    chain = prompt | llm | StrOutputParser()
    try:
        result = chain.invoke({"resume_text": resume_text, "target_role": target_role})
        parsed = _parse_json(result)
        return parsed if parsed else _fallback_resume_analysis(resume_text, target_role)
    except Exception as e:
        return _fallback_resume_analysis(resume_text, target_role)


def skill_gap_analysis(student_skills, target_role, student_info=None):
    llm = get_langchain_llm()
    if not llm:
        return _fallback_skill_gap(student_skills, target_role)

    info_str = ""
    if student_info:
        info_str = f"Student CGPA: {student_info.get('cgpa', 'N/A')}, Projects: {student_info.get('projects', 0)}, Internships: {student_info.get('internships', 0)}, Branch: {student_info.get('branch', 'N/A')}"

    prompt = ChatPromptTemplate.from_template(
        """You are an AI career advisor. Analyze the skill gap for a student targeting the role of {target_role}.

Current Skills: {skills}
{student_info}

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
    )

    chain = prompt | llm | StrOutputParser()
    try:
        result = chain.invoke({
            "skills": ", ".join(student_skills),
            "target_role": target_role,
            "student_info": info_str
        })
        parsed = _parse_json(result)
        return parsed if parsed else _fallback_skill_gap(student_skills, target_role)
    except Exception:
        return _fallback_skill_gap(student_skills, target_role)


def predict_salary(cgpa, skills, projects, internships, branch):
    llm = get_langchain_llm()
    if not llm:
        return _fallback_salary_prediction(cgpa, skills, projects, internships, branch)

    prompt = ChatPromptTemplate.from_template(
        """You are an AI salary prediction expert for fresh graduates in India. Based on the candidate profile, predict a realistic salary range.

CGPA: {cgpa}
Skills: {skills}
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
    )

    chain = prompt | llm | StrOutputParser()
    try:
        result = chain.invoke({
            "cgpa": cgpa, "skills": ", ".join(skills) if isinstance(skills, list) else skills,
            "projects": projects, "internships": internships, "branch": branch
        })
        parsed = _parse_json(result)
        return parsed if parsed else _fallback_salary_prediction(cgpa, skills, projects, internships, branch)
    except Exception:
        return _fallback_salary_prediction(cgpa, skills, projects, internships, branch)


def generate_roadmap(student_info, career_goal, target_package=None):
    llm = get_langchain_llm()
    if not llm:
        return _fallback_roadmap(student_info, career_goal)

    pkg_str = f"Target Package: {target_package} LPA" if target_package else ""

    prompt = ChatPromptTemplate.from_template(
        """You are a career counselor creating a personalized 6-month roadmap for a student.

Student Profile:
- Name: {name}
- Branch: {branch}
- CGPA: {cgpa}
- Current Skills: {skills}
- Projects: {projects}
- Internships: {internships}
{target_package}

Career Goal: {career_goal}

Create a detailed monthly plan. Respond in valid JSON format only:
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
    )

    chain = prompt | llm | StrOutputParser()
    try:
        result = chain.invoke({
            "name": student_info.get('name', 'Student'),
            "branch": student_info.get('branch', 'N/A'),
            "cgpa": student_info.get('cgpa', 'N/A'),
            "skills": ", ".join(student_info.get('skills', [])),
            "projects": student_info.get('projects', 0),
            "internships": student_info.get('internships', 0),
            "career_goal": career_goal,
            "target_package": pkg_str
        })
        parsed = _parse_json(result)
        return parsed if parsed else _fallback_roadmap(student_info, career_goal)
    except Exception:
        return _fallback_roadmap(student_info, career_goal)


def chat_with_ai(message, conversation_history=None):
    client = get_groq_client()
    if not client:
        return _fallback_chat(message)

    messages = [{
        "role": "system",
        "content": "You are an AI placement assistant for a college. Help students with career guidance, interview preparation, resume tips, salary negotiation, and placement-related queries. Be helpful, encouraging, and specific. Keep responses concise but informative."
    }]

    if conversation_history:
        for msg in conversation_history[-6:]:
            messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})

    messages.append({"role": "user", "content": message})

    try:
        response = client.chat.completions.create(
            model=Config.GROQ_MODEL,
            messages=messages,
            temperature=0.7,
            max_tokens=1024
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"I'm having trouble connecting to the AI service. Please check your API key and try again. Error: {str(e)}"


# ─── Fallback functions (when AI is unavailable) ─────────────────────────

def _fallback_resume_analysis(resume_text, target_role):
    words = resume_text.lower().split()
    common_skills = ['python', 'java', 'javascript', 'react', 'node', 'sql', 'html', 'css',
                     'c++', 'machine', 'learning', 'flask', 'django', 'aws', 'docker', 'git']
    found_skills = [s for s in common_skills if s in words]
    return {
        "skills_found": found_skills,
        "experience_years": 0,
        "education": "Extracted from resume",
        "match_score": min(len(found_skills) * 10, 85),
        "strengths": found_skills[:3] if found_skills else ["Resume submitted"],
        "weaknesses": ["Could not perform AI analysis - API key not configured"],
        "recommendations": ["Configure Groq API key for detailed AI analysis"],
        "summary": f"Basic analysis for {target_role}. Configure AI for comprehensive results."
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
        "recommendations": ["Configure Groq API for personalized AI analysis"]
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
        "confidence": "low",
        "factors": [
            {"factor": "CGPA", "impact": "positive" if cgpa > 7 else "neutral", "detail": f"CGPA: {cgpa}"},
            {"factor": "Skills", "impact": "positive", "detail": f"{skill_count} skills listed"}
        ],
        "recommendations_to_increase": ["Configure Groq API for AI-powered predictions"],
        "market_insight": "Basic estimation. Enable AI for accurate market-based predictions."
    }

def _fallback_roadmap(student_info, career_goal):
    return {
        "career_goal": career_goal,
        "current_readiness": 40,
        "months": [
            {"month": i, "title": f"Month {i}", "focus_areas": ["Study core concepts"], "skills_to_learn": ["Configure AI for details"], "projects": ["Practice project"], "certifications": [], "milestones": [f"Complete month {i} goals"]}
            for i in range(1, 7)
        ],
        "resources": ["Configure Groq API key for personalized AI roadmap"],
        "tips": ["Focus on fundamentals", "Build projects", "Practice coding daily"]
    }

def _fallback_chat(message):
    return "👋 I'm the AI placement assistant! To unlock full AI-powered responses, please configure your Groq API key in the backend/.env file. In the meantime, I can tell you that consistent practice, building projects, and networking are key to landing a great placement!"
