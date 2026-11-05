"""
SkillSpring - AI Skill Gap Analysis & Career Advisory Service
Integrates with Google Gemini API to generate personalized learning guidance,
priority roadmaps, and portfolio project suggestions based on verified skill gap data.
Includes robust heuristic fallback when the API key is not configured or network fails.
"""

import os
import re
import json
import urllib.request
import urllib.error
from typing import Dict, Any, Tuple, Optional

# Load .env file automatically if present
def load_env_file():
    """Load key-value pairs from .env into os.environ if not already set."""
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
    if os.path.exists(env_path):
        try:
            with open(env_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        k, v = line.split('=', 1)
                        k = k.strip()
                        v = v.strip().strip('"').strip("'")
                        if k and k not in os.environ:
                            os.environ[k] = v
        except Exception:
            pass

load_env_file()

def get_gemini_config() -> Tuple[Optional[str], str]:
    """Retrieve Gemini API key and model from environment variables."""
    api_key = os.environ.get('GEMINI_API_KEY', '').strip() or None
    # Filter out placeholder keys
    if api_key in ('your_gemini_api_key_here', 'YOUR_API_KEY', ''):
        api_key = None
    model = os.environ.get('GEMINI_MODEL', 'gemini-1.5-flash').strip() or 'gemini-1.5-flash'
    return api_key, model

SYSTEM_INSTRUCTION = (
    "You are SkillSpring's AI Engineering Career Advisor. "
    "Your role is to analyze a college student's verified technical skills against industry benchmarks "
    "and provide tailored, actionable, beginner-friendly learning advice.\n"
    "STRICT GROUNDING RULES:\n"
    "1. Never invent or hallucinate skills the student has not learned. Only reference skills listed in the verified student profile.\n"
    "2. Never claim the student has completed projects or certifications not recorded in the database.\n"
    "3. Focus specifically on closing the identified missing skills and skills needing improvement.\n"
    "4. Return strictly valid JSON matching the requested schema."
)

def build_user_prompt(gap_data: Dict[str, Any]) -> str:
    """Construct a strictly-grounded prompt for Gemini containing factual skill gap metrics."""
    student = gap_data.get('student', {})
    career = gap_data.get('career', {})
    matched = gap_data.get('matched_skills', [])
    improving = gap_data.get('improving_skills', [])
    missing = gap_data.get('missing_skills', [])

    matched_str = ', '.join([f"{s['name']} ({s.get('user_proficiency', 75)}%)" for s in matched]) or 'None recorded yet'
    improving_str = ', '.join([f"{s['name']} (Current: {s.get('user_proficiency', 50)}%, Target: {s.get('benchmark_proficiency', 80)}%)" for s in improving]) or 'None'
    missing_str = ', '.join([f"{s['name']} (Priority: {s.get('importance', 'High')})" for s in missing]) or 'None (all prerequisites met)'

    return f"""
Student Verified Academic Profile:
- Name: {student.get('name', 'Student')}
- College: {student.get('college', 'Engineering College')}
- Education: {student.get('degree', 'B.Tech')} in {student.get('branch', 'Engineering')}, {student.get('academic_year', '3rd Year')}
- Dedicated Study Time: {student.get('weekly_hours', 12)} hours per week
- Engineering Interests: {student.get('interests') or 'Software Engineering, Systems Design'}

Target Career Track:
- Track Title: {career.get('title', 'Software Engineer')}
- Track Category: {career.get('category', 'Engineering')}
- Experience Level: {career.get('level', 'Entry Level')}
- Stated Role Overview: {career.get('description', '')}
- Calculated Skill Readiness: {gap_data.get('readiness_percentage', 0)}%

Verified Skill Analysis:
- Matched / Mastered Skills: {matched_str}
- Skills Needing Improvement: {improving_str}
- Missing Prerequisites: {missing_str}

Please generate a structured JSON object with the exact keys below:
{{
  "summary": "2-3 concise sentences evaluating readiness and optimal career positioning based strictly on verified skills.",
  "priority_skills": [
    {{
      "skill": "Skill name",
      "urgency": "Critical | High | Medium",
      "why": "Specific reason why this skill is vital for {career.get('title')}",
      "current_status": "Missing | Needs Polish"
    }}
  ],
  "learning_guidance": "A beginner-friendly, actionable paragraph explaining the best conceptual approach to bridge these gaps within the student's {student.get('weekly_hours', 12)} hrs/week schedule.",
  "recommended_topics": [
    "Specific core conceptual or practical topic 1",
    "Specific core conceptual or practical topic 2",
    "Specific core conceptual or practical topic 3",
    "Specific core conceptual or practical topic 4"
  ],
  "practical_projects": [
    {{
      "title": "Project Title",
      "difficulty": "Beginner | Intermediate | Advanced",
      "duration": "e.g. 2 Weeks (15 hrs)",
      "skills_targeted": ["Skill 1", "Skill 2"],
      "description": "Clear description of what to build and its architectural requirements",
      "portfolio_impact": "How this demonstrates competence to technical interviewers"
    }}
  ],
  "next_steps": [
    "Actionable step 1 for this week",
    "Actionable step 2 for this week",
    "Actionable step 3 for next week"
  ]
}}
"""

def clean_json_string(text: str) -> str:
    """Extract and sanitize JSON string from possible markdown code fences or prefix text."""
    text = text.strip()
    # Match ```json ... ``` or ``` ... ```
    match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
    if match:
        text = match.group(1).strip()
    return text

def call_gemini_api(prompt: str, api_key: str, model: str) -> Dict[str, Any]:
    """
    Make an HTTP POST request to the Google Gemini Generative Language REST API.
    Returns parsed JSON dictionary.
    """
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": prompt}]
            }
        ],
        "systemInstruction": {
            "parts": [{"text": SYSTEM_INSTRUCTION}]
        },
        "generationConfig": {
            "temperature": 0.2,
            "responseMimeType": "application/json"
        }
    }

    req_data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        url,
        data=req_data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    with urllib.request.urlopen(req, timeout=30.0) as response:
        resp_body = response.read().decode('utf-8')

    res_json = json.loads(resp_body)
    candidates = res_json.get("candidates", [])
    if not candidates:
        raise ValueError("Gemini API returned no response candidates")

    raw_text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
    if not raw_text:
        raise ValueError("Gemini API candidate contained empty text")

    clean_text = clean_json_string(raw_text)
    return json.loads(clean_text)

def generate_heuristic_recommendations(gap_data: Dict[str, Any], notice_reason: str = "No API key configured") -> Dict[str, Any]:
    """
    High-quality, deterministic recommendation engine used as a fallback when
    Gemini API is unavailable or unconfigured. Strictly adheres to verified skill gap data.
    """
    student = gap_data.get('student', {})
    career = gap_data.get('career', {})
    pct = gap_data.get('readiness_percentage', 0)
    matched = gap_data.get('matched_skills', [])
    improving = gap_data.get('improving_skills', [])
    missing = gap_data.get('missing_skills', [])
    career_id = career.get('id', 'python-dev')

    # 1. Summary
    if pct >= 75:
        summary = (
            f"Strong technical alignment ({pct}% readiness) for entry-level {career.get('title')} roles. "
            f"{student.get('name')} demonstrates solid foundations in {', '.join([m['name'] for m in matched[:2]]) or 'core prerequisites'}. "
            f"Focus on polishing hands-on projects and closing remaining gaps in {', '.join([m['name'] for m in missing[:2]]) or 'advanced topics'}."
        )
    elif pct >= 50:
        summary = (
            f"Moderate readiness ({pct}%) for {career.get('title')}. "
            f"Foundations in {', '.join([m['name'] for m in matched[:2]]) or 'key areas'} are verified, but junior developer hiring requires "
            f"closing critical gaps in {', '.join([m['name'] for m in missing[:2]]) or 'prerequisites'}."
        )
    else:
        summary = (
            f"Early-stage development path ({pct}% readiness) towards {career.get('title')}. "
            f"Prioritize building core competence in {', '.join([m['name'] for m in missing[:2]]) or 'foundational tools'} "
            f"before advancing to complex distributed architectures."
        )

    # 2. Priority Skills
    priority_skills = []
    for m in missing[:3]:
        priority_skills.append({
            "skill": m['name'],
            "urgency": m.get('importance', 'High'),
            "why": f"Essential core competency for {career.get('title')}; verified as currently missing from student profile.",
            "current_status": "Missing"
        })
    for i in improving[:2]:
        priority_skills.append({
            "skill": i['name'],
            "urgency": "Medium",
            "why": f"Currently assessed at {i.get('user_proficiency', 50)}%; needs practice to reach {i.get('benchmark_proficiency', 80)}% benchmark.",
            "current_status": "Needs Polish"
        })

    # 3. Learning Guidance
    guidance = (
        f"With your dedicated {student.get('weekly_hours', 12)} hours per week, structure your schedule into two 4-hour weekend deep-work blocks "
        f"and two 2-hour weekday concept review sessions. Begin each topic with official documentation and hands-on coding rather than passive video watching."
    )

    # 4. Curated Projects by Career Track
    PROJECT_TEMPLATES = {
        'python-dev': [
            {
                "title": "College Campus Event Hub REST API",
                "difficulty": "Intermediate",
                "duration": "2 Weeks (18 hrs)",
                "skills_targeted": ["Python", "FastAPI / Django", "PostgreSQL", "Docker"],
                "description": "Architect a production-grade multi-role REST API enabling students to browse, RSVP, and organize campus events with QR verification.",
                "portfolio_impact": "Demonstrates relational database schema modeling, Pydantic request validation, and clean RESTful design."
            },
            {
                "title": "High-Throughput Asynchronous Scraper & Alert System",
                "difficulty": "Advanced",
                "duration": "3 Weeks (24 hrs)",
                "skills_targeted": ["Python", "REST APIs", "Docker", "SQL Basics"],
                "description": "Build an asynchronous worker tracking engineering internship openings and dispatching real-time notifications.",
                "portfolio_impact": "Proves mastery of async programming, background task queues, and resilient network error handling."
            }
        ],
        'web-dev': [
            {
                "title": "Collaborative Student Task Board with Live Filters",
                "difficulty": "Intermediate",
                "duration": "2 Weeks (16 hrs)",
                "skills_targeted": ["React", "JavaScript", "HTML5 & CSS3", "REST APIs"],
                "description": "Develop a responsive Kanban-style project dashboard with optimistic UI updates, drag-and-drop cards, and state persistence.",
                "portfolio_impact": "Showcases component modularity, modern React hooks, and responsive CSS styling."
            },
            {
                "title": "Full-Stack Campus Marketplace API & Storefront",
                "difficulty": "Advanced",
                "duration": "3 Weeks (25 hrs)",
                "skills_targeted": ["Node.js", "React", "SQL Basics", "TypeScript"],
                "description": "Build an end-to-end e-commerce application with JWT user authentication, search indexing, and order management.",
                "portfolio_impact": "Proves full-stack proficiency across client state, server routing, and relational data persistence."
            }
        ],
        'data-analyst': [
            {
                "title": "Higher Education Academic Retention & Performance Dashboard",
                "difficulty": "Intermediate",
                "duration": "2 Weeks (16 hrs)",
                "skills_targeted": ["SQL Basics", "PowerBI / Tableau", "Data Visualization"],
                "description": "Model a relational star schema on university student grades and build executive dashboards tracking at-risk cohorts.",
                "portfolio_impact": "Demonstrates business metric formulation, star schema modeling, and interactive storytelling."
            },
            {
                "title": "E-Commerce Customer Churn & Cohort Retention Analysis",
                "difficulty": "Intermediate",
                "duration": "2 Weeks (20 hrs)",
                "skills_targeted": ["Python", "Pandas & NumPy", "Advanced SQL", "Statistics & Probability"],
                "description": "Clean a 50,000-record transaction dataset, compute monthly user cohorts with CTEs, and train exploratory churn models.",
                "portfolio_impact": "Proves rigorous exploratory data analysis, data imputation, and advanced SQL window functions."
            }
        ],
        'cloud-devops': [
            {
                "title": "Automated Multi-Tier Application with Docker & Compose",
                "difficulty": "Intermediate",
                "duration": "2 Weeks (18 hrs)",
                "skills_targeted": ["Docker", "Linux Basics", "Git & GitHub"],
                "description": "Containerize a web frontend, backend API, and PostgreSQL database with persistent volumes and health checks.",
                "portfolio_impact": "Proves understanding of microservice networking, minimal Dockerfile layers, and container isolation."
            },
            {
                "title": "End-to-End Automated CI/CD Pipeline on GitHub Actions",
                "difficulty": "Intermediate",
                "duration": "2 Weeks (16 hrs)",
                "skills_targeted": ["CI/CD Pipelines (GitHub Actions)", "AWS / Cloud Fundamentals", "Git & GitHub"],
                "description": "Configure an automated pipeline that runs linter/tests on pull requests and pushes verified Docker images to container registry.",
                "portfolio_impact": "Demonstrates industry-standard automation, branch protection workflows, and cloud deployment security."
            }
        ]
    }

    projects = PROJECT_TEMPLATES.get(career_id, PROJECT_TEMPLATES['python-dev'])

    # 5. Recommended Topics based on missing skills
    topics = []
    for m in missing[:4]:
        topics.append(f"{m['name']}: Core concepts, architecture, and syntax fundamentals")
    for i in improving[:2]:
        topics.append(f"{i['name']}: Performance optimization and industry best practices")
    if not topics:
        topics = [
            f"Advanced architectural patterns for {career.get('title')}",
            "Unit and integration testing methodologies",
            "Performance benchmarking and caching strategies",
            "Production security standards and vulnerability scanning"
        ]

    # 6. Next Steps
    next_steps = [
        f"Review the learning roadmap for {career.get('title')} and activate Week 1 milestones.",
        f"Dedicate 4 hours this weekend to start learning {missing[0]['name'] if missing else 'advanced concepts'}.",
        f"Initialize GitHub repository for the '{projects[0]['title']}' project deliverable.",
        "Update your skill proficiency slider on SkillSpring after completing your first coding exercise."
    ]

    return {
        "summary": summary,
        "priority_skills": priority_skills,
        "learning_guidance": guidance,
        "recommended_topics": topics,
        "practical_projects": projects,
        "next_steps": next_steps,
        "fallback_notice": notice_reason
    }

def generate_ai_recommendations(gap_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main entry point for AI analysis:
    Attempts Google Gemini API invocation; automatically falls back to heuristic engine
    if key is absent, network fails, or response is malformed.
    """
    api_key, model = get_gemini_config()

    if not api_key:
        return {
            "provider": "heuristic_fallback",
            "notice": "Google Gemini API key not configured. Using verified heuristic analysis engine.",
            "recommendations": generate_heuristic_recommendations(gap_data, "No GEMINI_API_KEY set in environment")
        }

    try:
        prompt = build_user_prompt(gap_data)
        ai_result = call_gemini_api(prompt, api_key, model)
        # Validate that essential keys exist in Gemini output
        required_keys = ["summary", "priority_skills", "practical_projects", "next_steps"]
        if not all(k in ai_result for k in required_keys):
            raise ValueError(f"Gemini response missing required keys: {ai_result.keys()}")

        return {
            "provider": f"gemini ({model})",
            "notice": None,
            "recommendations": ai_result
        }
    except Exception as e:
        error_msg = f"Gemini API invocation failed: {str(e)}"
        return {
            "provider": "heuristic_fallback",
            "notice": error_msg,
            "recommendations": generate_heuristic_recommendations(gap_data, error_msg)
        }


# ==============================================================================
# AI-Powered Career Roadmap Advisor Engine
# ==============================================================================

ROADMAP_SYSTEM_INSTRUCTION = (
    "You are SkillSpring's AI Engineering Career & Roadmap Advisor. "
    "Your role is to analyze a college student's verified technical skills, skill gap analysis, "
    "and 6-week curriculum milestones, then generate a personalized, paced roadmap advisory plan.\n"
    "STRICT GROUNDING RULES:\n"
    "1. Never invent skills the student has not learned. Only reference verified skills in the profile.\n"
    "2. Ground milestone advice strictly on the 6 existing weekly milestones provided in the prompt.\n"
    "3. Keep weekly study hours and pacing realistic to the student's actual declared weekly commitment.\n"
    "4. Highlight which milestones close the student's highest-priority missing skills.\n"
    "5. Return strictly valid JSON matching the requested schema."
)

def build_roadmap_advisor_prompt(gap_data: Dict[str, Any], roadmap_progress: Dict[str, Any]) -> str:
    """Construct a strictly-grounded prompt for Gemini synthesizing skill gap and roadmap milestones."""
    student = gap_data.get('student', {})
    career = gap_data.get('career', {})
    pct = gap_data.get('readiness_percentage', 0)
    matched = gap_data.get('matched_skills', [])
    improving = gap_data.get('improving_skills', [])
    missing = gap_data.get('missing_skills', [])
    milestones = roadmap_progress.get('milestones', [])

    matched_str = ', '.join([f"{s['name']} ({s.get('user_proficiency', 75)}%)" for s in matched]) or 'None recorded yet'
    improving_str = ', '.join([f"{s['name']} (Current: {s.get('user_proficiency', 50)}%, Target: {s.get('benchmark_proficiency', 80)}%)" for s in improving]) or 'None'
    missing_str = ', '.join([f"{s['name']} (Priority: {s.get('importance', 'High')})" for s in missing]) or 'None'

    milestones_summary = []
    for m in milestones:
        topics_val = m.get('topics', [])
        if isinstance(topics_val, str):
            try:
                topics_val = json.loads(topics_val)
            except Exception:
                topics_val = [topics_val]
        topics_str = ', '.join(topics_val) if isinstance(topics_val, list) else str(topics_val)
        tasks = m.get('tasks', [])
        done_count = sum(1 for t in tasks if t.get('completed'))
        milestones_summary.append(
            f"Week {m.get('week_number')}: '{m.get('title')}' | Status: {m.get('status')} ({done_count}/{len(tasks)} tasks) | Project: {m.get('project_title', 'None')} | Topics: {topics_str}"
        )

    milestones_block = '\n'.join(milestones_summary)

    return f"""
Student Verified Academic Profile:
- Name: {student.get('name', 'Student')}
- College: {student.get('college', 'Engineering College')}
- Degree & Major: {student.get('degree', 'B.Tech')} in {student.get('branch', 'Engineering')}, {student.get('academic_year', '3rd Year')}
- Weekly Available Study Time: {student.get('weekly_hours', 12)} hours per week
- Engineering Interests: {student.get('interests') or 'Software Engineering'}

Target Career Track:
- Track: {career.get('title', 'Software Engineer')} ({career.get('category', 'Engineering')})
- Verified Skill Readiness: {pct}%

Verified Skill Gap Analysis:
- Matched Skills: {matched_str}
- Skills Needing Polish: {improving_str}
- Missing Prerequisites: {missing_str}

Existing 6-Week Curriculum Milestones:
{milestones_block}

Please generate a personalized roadmap advisory JSON object with the exact keys:
{{
  "summary": "2-3 concise sentences evaluating readiness and learning strategy based strictly on verified skills and declared weekly study time.",
  "confidence_score": "{pct}% Readiness (Gemini Assisted)",
  "key_strengths": [
    "Verified strength 1 with context",
    "Verified strength 2 with context"
  ],
  "priority_gaps": [
    {{
      "skill": "Skill name",
      "urgency": "Critical | High | Medium",
      "why": "Specific reason why this skill is vital for {career.get('title')}"
    }}
  ],
  "milestone_guidance": [
    {{
      "week": 1,
      "title": "Milestone title matching Week 1",
      "priority_level": "Completed | Critical Gap Focus | Skill Polish | Core Curriculum",
      "custom_advice": "Actionable 1-2 sentence advice tailored to this student's verified skills for this specific week",
      "estimated_pacing": "e.g. 1 week (at {student.get('weekly_hours', 12)} hrs/week)"
    }}
  ],
  "recommended_projects": [
    {{
      "title": "Project Title",
      "duration": "e.g. 2 Weeks (16 hrs)",
      "difficulty": "Intermediate",
      "skills_targeted": ["Skill 1", "Skill 2"],
      "description": "Clear description of what to build and its architectural requirements",
      "portfolio_impact": "How this demonstrates competence to technical interviewers"
    }}
  ],
  "weekly_study_plan": [
    {{ "day": "Mon & Tue (X hrs)", "focus": "Specific concept or task from current priority milestone" }},
    {{ "day": "Wed (X hrs)", "focus": "Hands-on coding / lab practice" }},
    {{ "day": "Thu & Fri (X hrs)", "focus": "Weekly project milestone deliverable implementation" }},
    {{ "day": "Weekend (X hrs)", "focus": "Verification, test suite execution, and progress checklist" }}
  ]
}}
"""

def generate_heuristic_roadmap_advice(
    gap_data: Dict[str, Any],
    roadmap_progress: Dict[str, Any],
    notice_reason: str = "No API key configured"
) -> Dict[str, Any]:
    """
    Deterministic, high-quality roadmap recommendation engine that correlates
    actual student skill gaps and completion progress with the 6-week curriculum.
    Used when Gemini API key is absent or offline.
    """
    student = gap_data.get('student', {})
    career = gap_data.get('career', {})
    pct = gap_data.get('readiness_percentage', 0)
    matched = gap_data.get('matched_skills', [])
    improving = gap_data.get('improving_skills', [])
    missing = gap_data.get('missing_skills', [])
    career_id = career.get('id', 'python-dev')
    weekly_hours = student.get('weekly_hours', 12)
    milestones = roadmap_progress.get('milestones', [])

    # 1. Summary
    completed_milestones = sum(1 for m in milestones if m.get('status') == 'completed')
    summary = (
        f"Tailored learning plan for {student.get('name', 'Student')} ({student.get('branch', 'Engineering')}, {student.get('academic_year', '3rd Year')}). "
        f"You have acquired {len(matched)} of {len(matched) + len(improving) + len(missing)} core skills for {career.get('title', 'Software Engineer')}, "
        f"with {completed_milestones} of {len(milestones)} roadmap milestones completed. "
        f"Paced for your allocated {weekly_hours} hrs/week commitment, focusing primarily on closing gaps in {', '.join([m['name'] for m in missing[:2]]) or 'advanced topics'}."
    )

    # 2. Key Strengths
    key_strengths = []
    if matched:
        for s in matched[:3]:
            prof = s.get('user_proficiency', 75)
            level = "Advanced" if prof >= 80 else "Intermediate"
            key_strengths.append(f"Verified proficiency in {s['name']} ({prof}%, {level})")
    else:
        key_strengths.append(f"Strong academic foundation in {student.get('branch', 'Engineering')} curriculum")
        key_strengths.append("Dedicated weekly self-study commitment")

    # 3. Priority Gaps
    priority_gaps = []
    for m in missing[:3]:
        priority_gaps.append({
            "skill": m['name'],
            "urgency": m.get('importance', 'High'),
            "why": f"Core prerequisite for {career.get('title')}; currently missing from your verified profile."
        })
    for i in improving[:2]:
        priority_gaps.append({
            "skill": i['name'],
            "urgency": "Medium",
            "why": f"Current proficiency ({i.get('user_proficiency', 50)}%) is below the industry benchmark ({i.get('benchmark_proficiency', 80)}%)."
        })

    # 4. Milestone Guidance (Correlating milestones to student gaps)
    milestone_guidance = []
    for m in milestones:
        week = m.get('week_number', 1)
        title = m.get('title', '')
        project_title = m.get('project_title', '')
        tasks = m.get('tasks', [])
        done_count = sum(1 for t in tasks if t.get('completed'))
        total_tasks = len(tasks)
        status = m.get('status', 'pending')

        topics_val = m.get('topics', [])
        if isinstance(topics_val, str):
            try:
                topics_val = json.loads(topics_val)
            except Exception:
                topics_val = [topics_val]
        topics_list = topics_val if isinstance(topics_val, list) else []

        # Check keyword overlap with missing skills
        search_blob = f"{title} {' '.join(topics_list)} {project_title}".lower()
        matched_missing_skill = next((s['name'] for s in missing if any(w.lower() in search_blob for w in s['name'].split() if len(w) > 2)), None)
        matched_improving_skill = next((s['name'] for s in improving if any(w.lower() in search_blob for w in s['name'].split() if len(w) > 2)), None)
        matched_verified_skill = next((s['name'] for s in matched if any(w.lower() in search_blob for w in s['name'].split() if len(w) > 2)), None)

        # Pacing calculation
        if weekly_hours >= 16:
            pacing = "Accelerated (1 week)"
        elif weekly_hours >= 10:
            pacing = "Standard (1 - 1.5 weeks)"
        else:
            pacing = f"Extended (~2 weeks at {weekly_hours} hrs/wk)"

        if status == 'completed' or (total_tasks > 0 and done_count == total_tasks):
            p_level = "Completed"
            advice = f"All {total_tasks} checkpoints verified. You have demonstrated practical competence in {title}."
        elif matched_missing_skill:
            p_level = "Critical Gap Focus"
            advice = f"Directly targets your missing prerequisite: {matched_missing_skill}. Prioritize '{project_title}' deliverable."
        elif matched_improving_skill:
            p_level = "Skill Polish"
            advice = f"Helps elevate your proficiency in {matched_improving_skill} from current level to industry benchmark."
        elif status == 'in-progress' or done_count > 0:
            p_level = "Active Milestone"
            advice = f"{done_count} of {total_tasks} tasks checked off. Complete remaining practice items to lock in progress."
        elif matched_verified_skill:
            p_level = "Review & Build"
            advice = f"You already have verified competence in {matched_verified_skill}; complete milestones to demonstrate practical portfolio work."
        else:
            p_level = "Core Curriculum"
            advice = f"Foundational milestone for {career.get('title')}. Paced for hands-on lab practice."

        milestone_guidance.append({
            "week": week,
            "title": title,
            "priority_level": p_level,
            "custom_advice": advice,
            "estimated_pacing": pacing
        })

    # 5. Recommended Capstone Projects from curated track templates
    PROJECT_TEMPLATES = {
        'python-dev': [
            {
                "title": "College Campus Event Hub REST API",
                "difficulty": "Intermediate",
                "duration": "2 Weeks (18 hrs)",
                "skills_targeted": ["Python", "FastAPI / Django", "PostgreSQL", "Docker"],
                "description": "Architect a production-grade multi-role REST API enabling students to browse, RSVP, and organize campus events with QR verification.",
                "portfolio_impact": "Demonstrates relational database schema modeling, Pydantic request validation, and clean RESTful design."
            },
            {
                "title": "High-Throughput Asynchronous Scraper & Alert System",
                "difficulty": "Advanced",
                "duration": "3 Weeks (24 hrs)",
                "skills_targeted": ["Python", "REST APIs", "Docker", "SQL Basics"],
                "description": "Build an asynchronous worker tracking engineering internship openings and dispatching real-time notifications.",
                "portfolio_impact": "Proves mastery of async programming, background task queues, and resilient network error handling."
            }
        ],
        'web-dev': [
            {
                "title": "Collaborative Student Task Board with Live Filters",
                "difficulty": "Intermediate",
                "duration": "2 Weeks (16 hrs)",
                "skills_targeted": ["React", "JavaScript", "HTML5 & CSS3", "REST APIs"],
                "description": "Develop a responsive Kanban-style project dashboard with optimistic UI updates, drag-and-drop cards, and state persistence.",
                "portfolio_impact": "Showcases component modularity, modern React hooks, and responsive CSS styling."
            },
            {
                "title": "Full-Stack Campus Marketplace API & Storefront",
                "difficulty": "Advanced",
                "duration": "3 Weeks (25 hrs)",
                "skills_targeted": ["Node.js", "React", "SQL Basics", "TypeScript"],
                "description": "Build an end-to-end e-commerce application with JWT user authentication, search indexing, and order management.",
                "portfolio_impact": "Proves full-stack proficiency across client state, server routing, and relational data persistence."
            }
        ],
        'data-analyst': [
            {
                "title": "Higher Education Academic Retention & Performance Dashboard",
                "difficulty": "Intermediate",
                "duration": "2 Weeks (16 hrs)",
                "skills_targeted": ["SQL Basics", "PowerBI / Tableau", "Data Visualization"],
                "description": "Model a relational star schema on university student grades and build executive dashboards tracking at-risk cohorts.",
                "portfolio_impact": "Demonstrates business metric formulation, star schema modeling, and interactive storytelling."
            },
            {
                "title": "E-Commerce Customer Churn & Cohort Retention Analysis",
                "difficulty": "Intermediate",
                "duration": "2 Weeks (20 hrs)",
                "skills_targeted": ["Python", "Pandas & NumPy", "Advanced SQL", "Statistics & Probability"],
                "description": "Clean a 50,000-record transaction dataset, compute monthly user cohorts with CTEs, and train exploratory churn models.",
                "portfolio_impact": "Proves rigorous exploratory data analysis, data imputation, and advanced SQL window functions."
            }
        ],
        'cloud-devops': [
            {
                "title": "Automated Multi-Tier Application with Docker & Compose",
                "difficulty": "Intermediate",
                "duration": "2 Weeks (18 hrs)",
                "skills_targeted": ["Docker", "Linux Basics", "Git & GitHub"],
                "description": "Containerize a web frontend, backend API, and PostgreSQL database with persistent volumes and health checks.",
                "portfolio_impact": "Proves understanding of microservice networking, minimal Dockerfile layers, and container isolation."
            },
            {
                "title": "End-to-End Automated CI/CD Pipeline on GitHub Actions",
                "difficulty": "Intermediate",
                "duration": "2 Weeks (16 hrs)",
                "skills_targeted": ["CI/CD Pipelines (GitHub Actions)", "AWS / Cloud Fundamentals", "Git & GitHub"],
                "description": "Configure an automated pipeline that runs linter/tests on pull requests and pushes verified Docker images to container registry.",
                "portfolio_impact": "Demonstrates industry-standard automation, branch protection workflows, and cloud deployment security."
            }
        ]
    }

    projects = PROJECT_TEMPLATES.get(career_id, PROJECT_TEMPLATES['python-dev'])

    # 6. Weekly Study Plan (Paced dynamically to weekly_hours)
    if weekly_hours >= 20:
        study_plan = [
            { "day": "Mon & Tue (6 hrs)", "focus": f"Intensive deep-dive into active milestone: {missing[0]['name'] if missing else 'core concepts'}" },
            { "day": "Wed & Thu (6 hrs)", "focus": f"Hands-on project implementation for '{projects[0]['title']}'" },
            { "day": "Fri (4 hrs)", "focus": "Automated testing, debugging, and code refactoring" },
            { "day": "Weekend (4 hrs)", "focus": "Portfolio documentation, GitHub push, and milestone checklist" }
        ]
    elif weekly_hours >= 14:
        study_plan = [
            { "day": "Mon & Tue (4 hrs)", "focus": f"Core concepts and architecture for {missing[0]['name'] if missing else 'roadmap topics'}" },
            { "day": "Wed & Thu (4 hrs)", "focus": f"Hands-on implementation of '{projects[0]['title']}'" },
            { "day": "Fri (3 hrs)", "focus": "Unit testing and problem-solving exercises" },
            { "day": "Weekend (3 hrs)", "focus": "Roadmap task verification and milestone review" }
        ]
    elif weekly_hours >= 8:
        study_plan = [
            { "day": "Mon & Tue (3 hrs)", "focus": f"Review documentation and architecture for {missing[0]['name'] if missing else 'weekly milestone'}" },
            { "day": "Wed (2 hrs)", "focus": "Coding practice, syntax drills, and lab exercises" },
            { "day": "Thu & Fri (4 hrs)", "focus": f"Work on milestone deliverable: '{projects[0]['title']}'" },
            { "day": "Weekend (3 hrs)", "focus": "Task verification, code commit, and progress logging" }
        ]
    else:
        study_plan = [
            { "day": "Mon & Wed (2 hrs)", "focus": f"Core concept reading for {missing[0]['name'] if missing else 'weekly topics'}" },
            { "day": "Fri (1 hr)", "focus": "Hands-on coding practice" },
            { "day": "Weekend (3 hrs)", "focus": "Milestone project tasks and progress tracking" }
        ]

    return {
        "summary": summary,
        "confidence_score": f"{pct}% Readiness (Verified Heuristics)",
        "key_strengths": key_strengths,
        "priority_gaps": priority_gaps,
        "milestone_guidance": milestone_guidance,
        "recommended_projects": projects,
        "weekly_study_plan": study_plan,
        "fallback_notice": notice_reason
    }

def generate_roadmap_advice(
    gap_data: Dict[str, Any],
    roadmap_progress: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Main entry point for AI Career Roadmap Advisory:
    Attempts Google Gemini API invocation with strictly-grounded curriculum context;
    automatically falls back to deterministic heuristic engine if key is absent, network fails,
    or response is invalid.
    """
    api_key, model = get_gemini_config()

    if not api_key:
        return {
            "provider": "heuristic_fallback",
            "notice": "Google Gemini API key not configured. Using verified heuristic roadmap engine.",
            "advisory": generate_heuristic_roadmap_advice(gap_data, roadmap_progress, "No GEMINI_API_KEY set in environment")
        }

    try:
        prompt = build_roadmap_advisor_prompt(gap_data, roadmap_progress)
        ai_result = call_gemini_api(prompt, api_key, model)

        required_keys = ["summary", "key_strengths", "priority_gaps", "milestone_guidance", "recommended_projects", "weekly_study_plan"]
        if not all(k in ai_result for k in required_keys):
            raise ValueError(f"Gemini roadmap response missing required keys: {ai_result.keys()}")

        pct = gap_data.get('readiness_percentage', 0)
        ai_result['confidence_score'] = f"{pct}% Readiness (Gemini Assisted)"

        return {
            "provider": f"gemini ({model})",
            "notice": None,
            "advisory": ai_result
        }
    except Exception as e:
        error_msg = f"Gemini Roadmap Advisory API invocation failed: {str(e)}"
        return {
            "provider": "heuristic_fallback",
            "notice": error_msg,
            "advisory": generate_heuristic_roadmap_advice(gap_data, roadmap_progress, error_msg)
        }
