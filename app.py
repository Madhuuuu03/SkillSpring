"""

SkillSpring - Python Flask Foundational Backend Application

Integrates with Neon PostgreSQL via Psycopg 3, serves existing frontend assets without modification,

enforces parameterized queries, and provides foundational REST endpoints.

"""



import os

import sys



BASE_DIR = os.path.dirname(os.path.abspath(__file__))

if BASE_DIR not in sys.path:

    sys.path.insert(0, BASE_DIR)



from datetime import datetime, timedelta

from functools import wraps

from flask import Flask, jsonify, request, send_from_directory, session

from werkzeug.security import generate_password_hash, check_password_hash

from database_postgres import (

    init_db, check_db_health, query_db, execute_db, get_db,

    create_user, get_user_by_email, get_user_by_id,

    get_user_full_profile, update_user_profile,

    toggle_user_task, get_user_roadmap_with_progress,

    calculate_skill_gap,

    add_user_recommended_project, get_user_recommended_projects, delete_user_recommended_project,

    save_user_study_plan, get_user_study_plan

)

from ai_service import generate_ai_recommendations, generate_roadmap_advice, load_env_file



# Load environment configuration (.env)

load_env_file()



# Initialize Flask with disabled catch-all static folder to strictly control static asset serving

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__, static_folder=None, static_url_path=None)



# Configure JSON formatting & Session Security

app.config['JSON_SORT_KEYS'] = False



is_prod = bool(
    os.environ.get('VERCEL')
    or os.environ.get('FLASK_ENV') == 'production'
    or os.environ.get('ENVIRONMENT') == 'production'
)

secret_key = os.environ.get('SECRET_KEY')

if is_prod and not secret_key:
    raise RuntimeError("SECRET_KEY must be configured in production.")

app.config['SECRET_KEY'] = secret_key or 'skillspring-dev-secret-key-2026'
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = (
    is_prod or os.environ.get('SESSION_COOKIE_SECURE', '').lower()
    in ('1', 'true', 'yes')
)
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)



def login_required(f):

    """Decorator requiring active user session for protected API endpoints."""

    @wraps(f)

    def decorated_function(*args, **kwargs):

        if 'user_id' not in session:

            return jsonify({"error": "Authentication required", "authenticated": False}), 401

        return f(*args, **kwargs)

    return decorated_function



# ==============================================================================

# Static Page Routing & Strict Static File Access Control

# ==============================================================================



PUBLIC_DIR = os.path.join(BASE_DIR, 'public')



ALLOWED_STATIC_EXTENSIONS = {

    '.html', '.css', '.js', '.svg', '.png', '.jpg', '.jpeg', '.gif',

    '.ico', '.webp', '.woff', '.woff2', '.ttf', '.eot', '.map'

}



BLOCKED_SENSITIVE_EXTENSIONS = {

    '.py', '.pyc', '.pyd', '.pyo',

    '.db', '.sqlite', '.sqlite3', '.bak',

    '.env', '.git', '.gitignore',

    '.bat', '.cmd', '.sh', '.ps1',

    '.md', '.jsonl', '.txt', '.log'

}



BLOCKED_SENSITIVE_FILES = {

    '.env', '.env.example', '.gitignore', 'readme.md', 'serve.js', 'run_backend.bat'

}



@app.route('/')

def index():

    """Serve the SkillSpring landing page from project root."""

    return send_from_directory(BASE_DIR, 'index.html')



@app.route('/<path:filename>')

def serve_static(filename):

    """

    Safely serve frontend HTML pages from the project root, and CSS, JS, fonts,

    and media assets from the public/ directory using Flask's send_from_directory.

    Explicitly blocks access to backend Python files, database files, environment

    configuration, and Git metadata. Protects against path traversal attacks.

    """

    # Reject null bytes or encoded path manipulation

    if '\0' in filename or '%00' in filename:

        return jsonify({"error": "Invalid request path", "success": False}), 400



    # Normalize filename path

    norm_filename = os.path.normpath(filename).lstrip('/\\')



    # Block access to hidden or dot files (.env, .git, .gitignore, etc.)

    parts = norm_filename.replace('\\', '/').split('/')

    if any(part.startswith('.') for part in parts):

        return jsonify({"error": "Access to hidden or configuration files is forbidden", "success": False}), 403



    # Do not expose public/ as part of the URL (e.g., reject /public/css/style.css)

    if parts[0] == 'public':

        return jsonify({"error": "Resource not found", "path": filename}), 404



    # Check for blocked extensions or filenames

    _, ext = os.path.splitext(norm_filename)

    ext_lower = ext.lower()

    base_lower = os.path.basename(norm_filename).lower()



    if ext_lower in BLOCKED_SENSITIVE_EXTENSIONS or base_lower in BLOCKED_SENSITIVE_FILES:

        return jsonify({"error": "Access to backend files is forbidden", "success": False}), 403



    # Enforce that the target file path resides strictly inside BASE_DIR

    target_base = os.path.abspath(os.path.join(BASE_DIR, norm_filename))

    try:

        if os.path.commonpath([BASE_DIR, target_base]) != BASE_DIR:

            return jsonify({"error": "Path traversal attempt forbidden", "success": False}), 403

    except ValueError:

        return jsonify({"error": "Path traversal forbidden", "success": False}), 403



    # Reject unpermitted file extensions if an extension is provided

    if ext_lower and ext_lower not in ALLOWED_STATIC_EXTENSIONS:

        return jsonify({"error": "File type not permitted", "success": False}), 403



    # 1. Root HTML pages (e.g., /index.html, /dashboard.html, /login.html)

    if ext_lower == '.html':

        if os.path.exists(target_base) and os.path.isfile(target_base):

            rel_dir = os.path.dirname(norm_filename)

            base_name = os.path.basename(norm_filename)

            return send_from_directory(os.path.join(BASE_DIR, rel_dir), base_name)

        return jsonify({"error": "Resource not found", "path": filename}), 404



    # 2. Static assets served from public/ directory (CSS, JS, fonts, media)

    public_target = os.path.abspath(os.path.join(PUBLIC_DIR, norm_filename))

    try:

        if os.path.commonpath([PUBLIC_DIR, public_target]) == PUBLIC_DIR:

            if os.path.exists(public_target) and os.path.isfile(public_target):

                rel_dir = os.path.dirname(norm_filename)

                base_name = os.path.basename(norm_filename)

                return send_from_directory(os.path.join(PUBLIC_DIR, rel_dir), base_name)

    except ValueError:

        pass



    # 3. Fallback to project root for any other allowed static file

    if os.path.exists(target_base) and os.path.isfile(target_base):

        rel_dir = os.path.dirname(norm_filename)

        base_name = os.path.basename(norm_filename)

        return send_from_directory(os.path.join(BASE_DIR, rel_dir), base_name)



    # 4. Check extensionless HTML URLs in project root (e.g., /dashboard, /roadmap, /profile)

    html_target = os.path.abspath(os.path.join(BASE_DIR, f"{norm_filename}.html"))

    try:

        if os.path.commonpath([BASE_DIR, html_target]) == BASE_DIR:

            if os.path.exists(html_target) and os.path.isfile(html_target):

                return send_from_directory(BASE_DIR, f"{norm_filename}.html")

    except ValueError:

        pass



    return jsonify({"error": "Resource not found", "path": filename}), 404



# ==============================================================================

# API Endpoints

# ==============================================================================



@app.route('/api/health', methods=['GET'])

def health_check():

    """

    GET /api/health

    System health status endpoint checking PostgreSQL database connectivity,

    table counts, and application environment.

    """

    db_health = check_db_health()

    status_code = 200 if db_health.get('connected') else 503



    return jsonify({

        "status": "healthy" if db_health.get('connected') else "degraded",

        "service": "SkillSpring API",

        "version": "1.0.0",

        "framework": "Flask 3.1.3",

        "database": db_health,

        "timestamp": datetime.utcnow().isoformat() + "Z"

    }), status_code



@app.route('/api/careers', methods=['GET'])

def get_careers():

    """

    GET /api/careers

    Retrieve the catalog of engineering career tracks from SQLite.

    Supports optional category query filtering: ?category=Web+Development

    """

    category = request.args.get('category')

    if category and category.lower() != 'all':

        rows = query_db(

            "SELECT id, title, category, level, match_score_benchmark, avg_salary, growth_rate, description, suitable_branches, top_tools FROM careers WHERE LOWER(category) LIKE %s;",

            (f"%{category.lower()}%",)

        )

    else:

        rows = query_db("SELECT id, title, category, level, match_score_benchmark, avg_salary, growth_rate, description, suitable_branches, top_tools FROM careers;")



    careers = []

    for r in rows:

        c_dict = dict(r)

        # Fetch required skills for each career

        req_skills = query_db(

            "SELECT skill_name as name, importance, weight, benchmark_proficiency FROM career_required_skills WHERE career_id = %s ORDER BY weight DESC;",

            (c_dict['id'],)

        )

        c_dict['requiredSkills'] = [dict(s) for s in req_skills]

        careers.append(c_dict)



    return jsonify({"careers": careers, "count": len(careers)})



@app.route('/api/careers/<career_id>', methods=['GET'])

def get_career_detail(career_id):

    """

    GET /api/careers/<career_id>

    Retrieve a single career track with its prerequisite skill matrix.

    """

    career = query_db("SELECT * FROM careers WHERE id = %s;", (career_id,), one=True)

    if not career:

        return jsonify({"error": "Career not found", "id": career_id}), 404



    c_dict = dict(career)

    req_skills = query_db(

        "SELECT skill_name as name, importance, weight, benchmark_proficiency FROM career_required_skills WHERE career_id = %s ORDER BY weight DESC;",

        (career_id,)

    )

    c_dict['requiredSkills'] = [dict(s) for s in req_skills]

    return jsonify(c_dict)



@app.route('/api/skills', methods=['GET'])

def get_skills():

    """

    GET /api/skills

    Retrieve the master skills catalog from SQLite.

    """

    rows = query_db("SELECT id, name, category, description FROM skills ORDER BY name ASC;")

    return jsonify({"skills": [dict(r) for r in rows], "count": len(rows)})



@app.route('/api/roadmap/<career_id>', methods=['GET'])

def get_roadmap(career_id):

    """

    GET /api/roadmap/<career_id>

    Retrieve ordered weekly roadmap milestones and tasks for a specific career track.

    """

    milestones = query_db(

        "SELECT id, career_id, week_number, title, estimated_hours, topics, project_title FROM roadmap_milestones WHERE career_id = %s ORDER BY week_number ASC;",

        (career_id,)

    )

    if not milestones:

        return jsonify({"error": "Roadmap not found for career", "career_id": career_id}), 404



    result = []

    for m in milestones:

        m_dict = dict(m)

        tasks = query_db(

            "SELECT id, task_text as text, sort_order FROM roadmap_tasks WHERE milestone_id = %s ORDER BY sort_order ASC;",

            (m_dict['id'],)

        )

        m_dict['tasks'] = [dict(t) for t in tasks]

        result.append(m_dict)



    return jsonify({"career_id": career_id, "milestones": result, "total_weeks": len(result)})



@app.route('/api/profile/demo', methods=['GET'])

def get_demo_profile():

    """

    GET /api/profile/demo

    Retrieve the baseline demo student profile with skills and task progress from SQLite.

    """

    user = query_db("SELECT id, name, email, role FROM users WHERE email = 'aarav.sharma@college.edu';", one=True)

    if not user:

        return jsonify({"error": "Demo user not found"}), 404



    user_dict = dict(user)

    profile = query_db("SELECT * FROM student_profiles WHERE user_id = %s;", (user_dict['id'],), one=True)

    skills = query_db("SELECT skill_name, proficiency FROM user_skills WHERE user_id = %s;", (user_dict['id'],))

    completed_tasks = query_db(

        "SELECT task_id, completed_at FROM user_task_progress WHERE user_id = %s AND completed = 1;",

        (user_dict['id'],)

    )



    prof_dict = dict(profile) if profile else {}

    skill_list = [s['skill_name'] for s in skills]

    proficiencies = {s['skill_name']: s['proficiency'] for s in skills}



    return jsonify({

        "user": user_dict,

        "profile": {

            **prof_dict,

            "skills": skill_list,

            "skillProficiencies": proficiencies,

            "completedTasks": [t['task_id'] for t in completed_tasks]

        }

    })



# ==============================================================================

# Authentication & User Session Endpoints (Flask Session Cookies)

# ==============================================================================



@app.route('/api/auth/register', methods=['POST'])

@app.route('/api/auth/signup', methods=['POST'])

def auth_register():

    """

    POST /api/auth/register (or /api/auth/signup)

    Register a new student user, securely hash password with Werkzeug,

    create baseline profile, and initialize Flask session.

    """

    data = request.get_json(silent=True) or {}

    name = (data.get('name') or '').strip()

    email = (data.get('email') or '').strip().lower()

    password = data.get('password') or ''

    role = data.get('role', 'student')



    if not name or len(name) < 2:

        return jsonify({"error": "Name must be at least 2 characters long", "success": False}), 400

    if not email or '@' not in email or '.' not in email:

        return jsonify({"error": "Please provide a valid email address", "success": False}), 400

    if not password or len(password) < 6:

        return jsonify({"error": "Password must be at least 6 characters long", "success": False}), 400



    user, error = create_user(name, email, password, role)

    if error:

        return jsonify({"error": error, "success": False}), 409



    session.permanent = True

    session['user_id'] = user['id']

    session['user_email'] = user['email']

    session['user_name'] = user['name']



    return jsonify({

        "success": True,

        "message": "Account created successfully",

        "user": user

    }), 201



@app.route('/api/auth/login', methods=['POST'])

def auth_login():

    """

    POST /api/auth/login

    Authenticate user credentials against Werkzeug password hash and establish session cookie.

    """

    data = request.get_json(silent=True) or {}

    email = (data.get('email') or '').strip().lower()

    password = data.get('password') or ''

    remember = bool(data.get('remember', True))



    if not email or not password:

        return jsonify({"error": "Email and password are required", "success": False}), 400



    user = get_user_by_email(email)

    if not user or not check_password_hash(user['password_hash'], password):

        return jsonify({"error": "Invalid email or password", "success": False}), 401



    session.permanent = remember

    session['user_id'] = user['id']

    session['user_email'] = user['email']

    session['user_name'] = user['name']



    return jsonify({

        "success": True,

        "message": "Signed in successfully",

        "user": {

            "id": user['id'],

            "name": user['name'],

            "email": user['email'],

            "role": user['role']

        }

    }), 200



@app.route('/api/auth/demo-login', methods=['POST'])

def auth_demo_login():

    """

    POST /api/auth/demo-login

    Convenience endpoint for frontend demo evaluation: sets session for default demo student.

    """

    demo_user = get_user_by_email('aarav.sharma@college.edu')

    if not demo_user:

        return jsonify({"error": "Demo user account not found", "success": False}), 404



    session.permanent = True

    session['user_id'] = demo_user['id']

    session['user_email'] = demo_user['email']

    session['user_name'] = demo_user['name']



    return jsonify({

        "success": True,

        "message": "Logged in as demo user",

        "user": {

            "id": demo_user['id'],

            "name": demo_user['name'],

            "email": demo_user['email'],

            "role": demo_user['role']

        }

    }), 200



@app.route('/api/auth/logout', methods=['POST'])

def auth_logout():

    """

    POST /api/auth/logout

    Terminate the authenticated user session.

    """

    session.clear()

    return jsonify({"success": True, "message": "Signed out successfully"}), 200



@app.route('/api/auth/me', methods=['GET'])

def auth_me():

    """

    GET /api/auth/me

    Verify active session and return the current user's profile summary.

    """

    user_id = session.get('user_id')

    if not user_id:

        return jsonify({"authenticated": False, "user": None}), 200



    user = get_user_by_id(user_id)

    if not user:

        session.clear()

        return jsonify({"authenticated": False, "user": None}), 200



    return jsonify({

        "authenticated": True,

        "user": dict(user)

    }), 200



# ==============================================================================

# Protected Student Profile Endpoints (Database Source of Truth)

# ==============================================================================



@app.route('/api/profile', methods=['GET'])

@login_required

def get_current_profile():

    """

    GET /api/profile

    Retrieve complete student profile, academic background, skills, and progress

    for the authenticated session user.

    """

    profile = get_user_full_profile(session['user_id'])

    if not profile:

        return jsonify({"error": "Profile not found"}), 404

    return jsonify(profile), 200



@app.route('/api/profile', methods=['PUT', 'POST'])

@login_required

def update_current_profile():

    """

    PUT /api/profile or POST /api/profile

    Update student academic metadata, career goals, and skills with proficiencies.

    Persists directly to PostgreSQL database.

    Validates input structure and returns 400 Bad Request on malformed payloads.

    """

    data = request.get_json(silent=True)

    if data is None or not isinstance(data, dict):

        return jsonify({"error": "Request body must be a valid JSON object", "success": False}), 400



    updated, error = update_user_profile(session['user_id'], data)

    if error:

        return jsonify({"error": error, "success": False}), 400

    if not updated:

        return jsonify({"error": "Failed to update profile", "success": False}), 500



    # Sync session user display name if changed

    if 'name' in data and data['name']:

        session['user_name'] = str(data['name']).strip()



    return jsonify({

        "success": True,

        "message": "Profile updated successfully",

        "profile": updated

    }), 200



# ==============================================================================

# Roadmap Progress Endpoints (User Task Completion Tracking)

# ==============================================================================



@app.route('/api/roadmap/<career_id>/progress', methods=['GET'])

def get_career_roadmap_progress(career_id):

    """

    GET /api/roadmap/<career_id>/progress

    Retrieve weekly milestones and tasks with the user's completion status.

    Falls back to demo user if not logged in.

    """

    user_id = session.get('user_id')

    if not user_id:

        demo = get_user_by_email('aarav.sharma@college.edu')

        user_id = demo['id'] if demo else 1



    roadmap = get_user_roadmap_with_progress(user_id, career_id)

    if not roadmap:

        return jsonify({"error": "Roadmap not found for career", "career_id": career_id}), 404

    return jsonify(roadmap), 200



@app.route('/api/roadmap/toggle-task', methods=['POST'])

@login_required

def toggle_task_progress():

    """

    POST /api/roadmap/toggle-task

    Toggle roadmap milestone task completion for the authenticated session user.

    Persists timestamped progress into user_task_progress table.

    """

    data = request.get_json(silent=True) or {}

    task_id = data.get('task_id')

    if not task_id:

        return jsonify({"error": "task_id is required", "success": False}), 400



    result, error = toggle_user_task(session['user_id'], task_id)

    if error:

        return jsonify({"error": error, "success": False}), 400



    return jsonify({

        "success": True,

        **result

    }), 200



# ==============================================================================

# AI Skill Gap Analysis & Advisory Endpoint (Powered by Google Gemini)

# ==============================================================================



@app.route('/api/ai/skill-gap', methods=['POST'])

@login_required

def ai_skill_gap_analysis():

    """

    POST /api/ai/skill-gap

    Authenticated endpoint that performs deterministic skill gap analysis

    and synthesizes personalized learning guidance via Google Gemini API.

    Gracefully falls back to verified heuristic recommendations if the API key

    is absent, quota is exceeded, or network is offline.

    """

    user_id = session['user_id']

    data = request.get_json(silent=True) or {}



    # Target career ID: check payload first, fallback to user's saved profile career

    career_id = data.get('career_id') or data.get('careerId')

    if not career_id:

        user_prof = get_user_full_profile(user_id)

        career_id = user_prof.get('profile', {}).get('career_id', 'python-dev') if user_prof else 'python-dev'



    career_id = str(career_id).strip()



    # Calculate skill gaps using verified database records

    gap_data, error = calculate_skill_gap(user_id, career_id)

    if error:

        return jsonify({

            "error": error,

            "success": False,

            "valid_careers": ["python-dev", "web-dev", "data-analyst", "cloud-devops"]

        }), 400



    # Generate AI recommendations via Google Gemini (with graceful heuristic fallback)

    ai_result = generate_ai_recommendations(gap_data)



    return jsonify({

        "success": True,

        "career_id": career_id,

        "career_title": gap_data["career"]["title"],

        "readiness_percentage": gap_data["readiness_percentage"],

        "matched_skills": gap_data["matched_skills"],

        "improving_skills": gap_data["improving_skills"],

        "missing_skills": gap_data["missing_skills"],

        "prioritized_gaps": gap_data["prioritized_gaps"],

        "total_required": gap_data["total_required"],

        "acquired_count": gap_data["acquired_count"],

        "ai_recommendations": ai_result.get("recommendations", {}),

        "ai_provider": ai_result.get("provider", "gemini"),

        "ai_notice": ai_result.get("notice"),

        "student": gap_data["student"]

    }), 200



@app.route('/api/ai/roadmap-advisor', methods=['POST', 'GET'])

@login_required

def get_roadmap_advisor():

    """

    POST or GET /api/ai/roadmap-advisor

    Authenticated endpoint that personalizes curriculum milestones, projects,

    and weekly study plans based on actual student skill gaps and study hours.

    """

    user_id = session['user_id']

    data = request.get_json(silent=True) or {}



    career_id = data.get('career_id') or data.get('careerId') or request.args.get('career_id')

    if not career_id:

        user_prof = get_user_full_profile(user_id)

        career_id = user_prof.get('profile', {}).get('career_id', 'python-dev') if user_prof else 'python-dev'



    career_id = str(career_id).strip()



    # Calculate skill gaps

    gap_data, error = calculate_skill_gap(user_id, career_id)

    if error:

        return jsonify({

            "error": error,

            "success": False,

            "valid_careers": ["python-dev", "web-dev", "data-analyst", "cloud-devops"]

        }), 400



    # Retrieve roadmap with user progress

    roadmap_progress = get_user_roadmap_with_progress(user_id, career_id)

    if not roadmap_progress:

        return jsonify({

            "error": f"Roadmap for track '{career_id}' could not be loaded",

            "success": False

        }), 404



    # Generate AI Roadmap Advice

    advisor_result = generate_roadmap_advice(gap_data, roadmap_progress)



    return jsonify({

        "success": True,

        "career_id": career_id,

        "career_title": gap_data["career"]["title"],

        "readiness_percentage": gap_data["readiness_percentage"],

        "provider": advisor_result.get("provider", "gemini"),

        "notice": advisor_result.get("notice"),

        "advisory": advisor_result.get("advisory", {}),

        "student": gap_data["student"]

    }), 200



# ==============================================================================

# Recommended Projects & Synced Study Plans Endpoints

# ==============================================================================



@app.route('/api/roadmap/projects', methods=['POST'])

@login_required

def add_roadmap_project():

    """

    POST /api/roadmap/projects

    Add an AI recommended capstone project to the user's roadmap for a career track.

    Enforces uniqueness per (user_id, career_id, title).

    """

    user_id = session['user_id']

    data = request.get_json(silent=True) or {}



    career_id = data.get('career_id') or data.get('careerId')

    title = data.get('title')



    if not career_id:

        return jsonify({"success": False, "error": "career_id is required"}), 400

    if not title or not str(title).strip():

        return jsonify({"success": False, "error": "Project title is required"}), 400



    career_id = str(career_id).strip()

    description = data.get('description', '')

    skills_targeted = data.get('skills_targeted') or data.get('skillsTargeted') or []

    duration = data.get('duration', '2 Weeks')

    difficulty = data.get('difficulty', 'Intermediate')

    portfolio_impact = data.get('portfolio_impact') or data.get('portfolioImpact') or ''



    result, error = add_user_recommended_project(

        user_id=user_id,

        career_id=career_id,

        title=title,

        description=description,

        skills_targeted=skills_targeted,

        duration=duration,

        difficulty=difficulty,

        portfolio_impact=portfolio_impact

    )



    if error:

        status_code = 409 if "already been added" in error.lower() else 400

        return jsonify({"success": False, "error": error}), status_code



    return jsonify({

        "success": True,

        "message": result.get("message", "Project added to your roadmap successfully!"),

        "project": result

    }), 201



@app.route('/api/roadmap/projects', methods=['GET'])

@login_required

def get_roadmap_projects():

    """

    GET /api/roadmap/projects?career_id=<optional>

    Retrieve all saved recommended projects for the authenticated student.

    """

    user_id = session['user_id']

    career_id = request.args.get('career_id') or request.args.get('careerId')

    if career_id:

        career_id = str(career_id).strip()



    projects = get_user_recommended_projects(user_id, career_id)

    return jsonify({

        "success": True,

        "career_id": career_id,

        "count": len(projects),

        "projects": projects

    }), 200



@app.route('/api/roadmap/projects/<int:project_id>', methods=['DELETE'])

@login_required

def remove_roadmap_project(project_id):

    """

    DELETE /api/roadmap/projects/<project_id>

    Remove a saved recommended project from the user's roadmap.

    """

    user_id = session['user_id']

    deleted = delete_user_recommended_project(user_id, project_id)

    if not deleted:

        return jsonify({"success": False, "error": "Project not found or not owned by user"}), 404



    return jsonify({

        "success": True,

        "message": "Project removed from your roadmap successfully"

    }), 200



@app.route('/api/roadmap/study-plan', methods=['POST'])

@login_required

def sync_roadmap_study_plan():

    """

    POST /api/roadmap/study-plan

    Synchronize the adaptive weekly study plan for the authenticated student's career track.

    Updates previously synchronized plans safely without creating duplicate rows.

    """

    user_id = session['user_id']

    data = request.get_json(silent=True) or {}



    career_id = data.get('career_id') or data.get('careerId')

    study_plan = data.get('study_plan') or data.get('studyPlan') or data.get('weekly_study_plan')

    weekly_hours = data.get('weekly_hours') or data.get('weeklyHours')



    if not career_id:

        return jsonify({"success": False, "error": "career_id is required"}), 400

    if not study_plan or not isinstance(study_plan, list):

        return jsonify({"success": False, "error": "study_plan must be a non-empty list of schedule items"}), 400



    career_id = str(career_id).strip()



    # If weekly_hours not provided, fall back to student's profile hours

    if not weekly_hours:

        user_prof = get_user_full_profile(user_id)

        weekly_hours = user_prof.get('profile', {}).get('weekly_hours', 12) if user_prof else 12



    result, error = save_user_study_plan(user_id, career_id, study_plan, weekly_hours)

    if error:

        return jsonify({"success": False, "error": error}), 400



    return jsonify({

        "success": True,

        "message": result.get("message", "Study plan synchronized successfully!"),

        "career_id": career_id,

        "weekly_hours": result.get("weekly_hours", weekly_hours),

        "study_plan": study_plan

    }), 200



@app.route('/api/roadmap/study-plan', methods=['GET'])

@login_required

def get_roadmap_study_plan():

    """

    GET /api/roadmap/study-plan?career_id=<career_id>

    Retrieve the current synchronized weekly study plan for this career track.

    """

    user_id = session['user_id']

    career_id = request.args.get('career_id') or request.args.get('careerId')



    if not career_id:

        user_prof = get_user_full_profile(user_id)

        career_id = user_prof.get('profile', {}).get('career_id', 'python-dev') if user_prof else 'python-dev'



    career_id = str(career_id).strip()

    plan_info = get_user_study_plan(user_id, career_id)



    return jsonify({

        "success": True,

        "career_id": career_id,

        "synced": plan_info is not None,

        "study_plan": plan_info

    }), 200



# ==============================================================================

# Application Startup (Serverless & Standalone Compatibility)

# ==============================================================================



def initialize_app(seed=True, seed_demo_user=False):

    """

    Ensure database tables and baseline seeds exist on application launch if invoked explicitly.

    Demo user creation is disabled by default.

    """

    init_db(seed=seed, seed_demo_user=seed_demo_user)





# Note: Automatic database initialization upon module import has been removed

# to support zero-latency serverless cold starts on Vercel Python Functions

# and to avoid unwanted DDL or connection pooling overhead during packaging/testing.



if __name__ == '__main__':

    port = int(os.environ.get('PORT', 5000))

    print(f"\n========================================================")

    print(f"[STARTING] SkillSpring Python Flask Backend Server (Neon PostgreSQL)")

    print(f"API Health URL: http://localhost:{port}/api/health")

    print(f"Frontend URL:   http://localhost:{port}/index.html")

    print(f"========================================================\n")

    if os.environ.get('INIT_DB_ON_STARTUP', '').lower() in ('1', 'true', 'yes'):

        try:

            print("Running database initialization (INIT_DB_ON_STARTUP is enabled)...")

            initialize_app(seed=True, seed_demo_user=False)

        except Exception as e:

            print(f"Startup database initialization error: {e}")

    app.run(host='0.0.0.0', port=port, debug=False)
