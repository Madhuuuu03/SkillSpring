"""
SkillSpring - Comprehensive Backend Test Suite
Tests SQLite database creation, table relationships, foreign key constraints,
Werkzeug password hashing, Flask client endpoints, and /api/health.
"""

import sys
import os
import json
import sqlite3

# Ensure current script directory is in sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

def run_tests():
    print("=" * 60)
    print(">>> Running SkillSpring Backend Integration & Database Tests")
    print("=" * 60)
    passed_count = 0
    total_count = 0

    def assert_test(name, condition, details=""):
        nonlocal passed_count, total_count
        total_count += 1
        if condition:
            passed_count += 1
            print(f"  [PASS] {name} {details}")
        else:
            print(f"  [FAIL] {name} - {details}")
            raise AssertionError(f"Test failed: {name}")

    # --------------------------------------------------------------------------
    # 1. Database Initialization Test
    # --------------------------------------------------------------------------
    from database import init_db, check_db_health, get_db, query_db

    print("\n--- 1. Testing Database Initialization & Tables ---")
    init_db(seed=True)

    # Ensure clean test state for demo user if modified in prior runs
    with get_db() as conn:
        cursor = conn.cursor()
        aarav_row = cursor.execute("SELECT id FROM users WHERE email = 'aarav.sharma@college.edu';").fetchone()
        if aarav_row:
            cursor.execute("DELETE FROM user_task_progress WHERE user_id = ? AND task_id NOT IN ('py-1', 'py-2', 'py-3', 'py-4');", (aarav_row[0],))
            cursor.execute("UPDATE student_profiles SET weekly_hours = 12 WHERE user_id = ?;", (aarav_row[0],))
            default_skills = [
                (aarav_row[0], 'Python', 80),
                (aarav_row[0], 'Git & GitHub', 75),
                (aarav_row[0], 'SQL Basics', 60),
                (aarav_row[0], 'HTML5 & CSS3', 85),
                (aarav_row[0], 'Data Structures', 70),
                (aarav_row[0], 'REST APIs', 55)
            ]
            cursor.execute("DELETE FROM user_skills WHERE user_id = ?;", (aarav_row[0],))
            cursor.executemany("INSERT OR REPLACE INTO user_skills (user_id, skill_name, proficiency) VALUES (?, ?, ?);", default_skills)

    health = check_db_health()

    assert_test("Database Connected", health.get("connected") is True)
    assert_test("Table Count >= 9", health.get("table_count", 0) >= 9, f"(Found {health.get('table_count')} tables)")
    
    expected_tables = [
        "users", "careers", "student_profiles", "skills", 
        "career_required_skills", "user_skills", "roadmap_milestones",
        "roadmap_tasks", "user_task_progress"
    ]
    for table in expected_tables:
        assert_test(f"Table Exists: {table}", table in health.get("tables", {}))

    # --------------------------------------------------------------------------
    # 2. Testing Constraints and Foreign Key Enforcement
    # --------------------------------------------------------------------------
    print("\n--- 2. Testing Foreign Keys & Database Constraints ---")
    with get_db() as conn:
        # Test 2.1: Foreign Key Violation on student_profiles
        fk_caught = False
        try:
            conn.execute(
                "INSERT INTO student_profiles (user_id, college, degree, branch, academic_year, career_id) VALUES (?, ?, ?, ?, ?, ?);",
                (999999, "Fake College", "B.Tech", "CSE", "3rd", "python-dev")
            )
        except sqlite3.IntegrityError:
            fk_caught = True
        assert_test("Foreign Key Constraint Enforced (Invalid user_id)", fk_caught)

        # Test 2.2: CHECK constraint on weekly_hours
        check_caught = False
        try:
            conn.execute(
                "INSERT INTO student_profiles (user_id, college, degree, branch, academic_year, career_id, weekly_hours) VALUES (?, ?, ?, ?, ?, ?, ?);",
                (1, "NIT", "B.Tech", "CSE", "3rd", "python-dev", 150)
            )
        except sqlite3.IntegrityError:
            check_caught = True
        assert_test("CHECK Constraint Enforced (weekly_hours <= 80)", check_caught)

        # Test 2.3: CHECK constraint on proficiency range (0-100)
        prof_check_caught = False
        try:
            conn.execute(
                "INSERT INTO user_skills (user_id, skill_name, proficiency) VALUES (?, ?, ?);",
                (1, "GoLang", 120)
            )
        except sqlite3.IntegrityError:
            prof_check_caught = True
        assert_test("CHECK Constraint Enforced (proficiency <= 100)", prof_check_caught)

        # Test 2.4: Unique Email Constraint
        unique_email_caught = False
        try:
            conn.execute(
                "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?);",
                ("Duplicate User", "aarav.sharma@college.edu", "dummyhash")
            )
        except sqlite3.IntegrityError:
            unique_email_caught = True
        assert_test("Unique Email Constraint Enforced", unique_email_caught)

    # --------------------------------------------------------------------------
    # 3. Testing Werkzeug Password Hashing
    # --------------------------------------------------------------------------
    print("\n--- 3. Testing Werkzeug Password Hashing ---")
    from werkzeug.security import check_password_hash, generate_password_hash

    test_pass = "SecureCollegePass2026!"
    hashed = generate_password_hash(test_pass)
    assert_test("Password Hash Generated", hashed.startswith("scrypt:") or hashed.startswith("pbkdf2:"))
    assert_test("Password Verification Valid", check_password_hash(hashed, test_pass))
    assert_test("Password Rejection on Invalid Pass", not check_password_hash(hashed, "wrongPassword"))

    demo_user = query_db("SELECT password_hash FROM users WHERE email = ?;", ("aarav.sharma@college.edu",), one=True)
    assert_test("Demo User Password Hash Validates", check_password_hash(demo_user["password_hash"], "demoPass123"))

    # --------------------------------------------------------------------------
    # 4. Testing Flask App & HTTP Endpoints
    # --------------------------------------------------------------------------
    print("\n--- 4. Testing Flask Endpoints & Static Page Serving ---")
    from app import app

    client = app.test_client()

    # Test 4.1: Healthcheck endpoint
    res = client.get('/api/health')
    assert_test("GET /api/health Status 200", res.status_code == 200)
    health_data = json.loads(res.data.decode('utf-8'))
    assert_test("Health JSON status == 'healthy'", health_data.get("status") == "healthy")
    assert_test("Health DB connected == True", health_data.get("database", {}).get("connected") is True)

    # Test 4.2: Static page serving
    res_index = client.get('/')
    assert_test("GET / Serves index.html", res_index.status_code == 200 and b"SkillSpring" in res_index.data)

    res_dash = client.get('/dashboard.html')
    assert_test("GET /dashboard.html Serves Dashboard Page", res_dash.status_code == 200 and b"Student Dashboard" in res_dash.data)

    res_css = client.get('/css/style.css')
    assert_test("GET /css/style.css Serves CSS Stylesheet", res_css.status_code == 200 and b"--primary" in res_css.data)

    # Test 4.3: Careers API
    res_careers = client.get('/api/careers')
    assert_test("GET /api/careers Status 200", res_careers.status_code == 200)
    careers_data = json.loads(res_careers.data.decode('utf-8'))
    assert_test("Careers Count == 4", careers_data.get("count") == 4)
    assert_test("Career Contains Required Skills", len(careers_data["careers"][0].get("requiredSkills", [])) > 0)

    # Test 4.4: Single Career API
    res_single_career = client.get('/api/careers/python-dev')
    assert_test("GET /api/careers/python-dev Status 200", res_single_career.status_code == 200)
    python_dev = json.loads(res_single_career.data.decode('utf-8'))
    assert_test("Career Title is Python Developer", python_dev.get("title") == "Python Developer")

    # Test 4.5: Master Skills API
    res_skills = client.get('/api/skills')
    assert_test("GET /api/skills Status 200", res_skills.status_code == 200)
    skills_data = json.loads(res_skills.data.decode('utf-8'))
    assert_test("Master Skills Count >= 15", skills_data.get("count", 0) >= 15)

    # Test 4.6: Roadmap API
    res_roadmap = client.get('/api/roadmap/python-dev')
    assert_test("GET /api/roadmap/python-dev Status 200", res_roadmap.status_code == 200)
    roadmap_data = json.loads(res_roadmap.data.decode('utf-8'))
    assert_test("Roadmap Weeks Count == 6", roadmap_data.get("total_weeks") == 6)
    assert_test("Roadmap Week 1 has Tasks", len(roadmap_data["milestones"][0].get("tasks", [])) == 3)

    # Test 4.7: Demo Profile API
    res_profile = client.get('/api/profile/demo')
    assert_test("GET /api/profile/demo Status 200", res_profile.status_code == 200)
    profile_data = json.loads(res_profile.data.decode('utf-8'))
    assert_test("Demo Profile Name is Aarav Sharma", profile_data.get("user", {}).get("name") == "Aarav Sharma")
    assert_test("Demo Profile Has Completed Tasks", len(profile_data.get("profile", {}).get("completedTasks", [])) == 4)

    # --------------------------------------------------------------------------
    # 5. Testing All 4 Career Tracks & Roadmap Seed Integrity
    # --------------------------------------------------------------------------
    print("\n--- 5. Testing All 4 Career Tracks & Roadmaps ---")
    all_tracks = ['python-dev', 'web-dev', 'data-analyst', 'cloud-devops']
    for track_id in all_tracks:
        res_c = client.get(f'/api/careers/{track_id}')
        assert_test(f"GET /api/careers/{track_id} Status 200", res_c.status_code == 200)
        c_json = json.loads(res_c.data.decode('utf-8'))
        assert_test(f"Track {track_id} has Required Skills", len(c_json.get("requiredSkills", [])) >= 6)

        res_r = client.get(f'/api/roadmap/{track_id}')
        assert_test(f"GET /api/roadmap/{track_id} Status 200", res_r.status_code == 200)
        r_json = json.loads(res_r.data.decode('utf-8'))
        assert_test(f"Track {track_id} has 6 Weeks of Milestones", r_json.get("total_weeks") == 6)
        assert_test(f"Track {track_id} Week 1 has Tasks", len(r_json.get("milestones", [])[0].get("tasks", [])) >= 3)

    # --------------------------------------------------------------------------
    # 6. Testing Authentication & Session Cookie Management
    # --------------------------------------------------------------------------
    print("\n--- 6. Testing Authentication Endpoints & Flask Session ---")
    # Fresh test client with cookie jar
    auth_client = app.test_client()

    # Ensure clean test state for test user
    test_user_email = "priya.patel@engineering.edu"
    with get_db() as conn:
        conn.execute("DELETE FROM users WHERE email = ?;", (test_user_email,))

    # Test 6.1: Unauthenticated me check
    res_me_init = auth_client.get('/api/auth/me')
    assert_test("Initial GET /api/auth/me Authenticated is False", json.loads(res_me_init.data.decode('utf-8')).get("authenticated") is False)

    # Test 6.2: Protected profile route rejects unauthenticated request
    res_prot = auth_client.get('/api/profile')
    assert_test("Unauthenticated GET /api/profile returns 401", res_prot.status_code == 401)

    # Test 6.3: User registration
    reg_payload = {
        "name": "Priya Patel",
        "email": test_user_email,
        "password": "SecurePassword2026!",
        "role": "student"
    }
    res_reg = auth_client.post('/api/auth/register', data=json.dumps(reg_payload), content_type='application/json')
    assert_test("POST /api/auth/register returns 201 Created", res_reg.status_code == 201)
    reg_data = json.loads(res_reg.data.decode('utf-8'))
    assert_test("Registration response includes user ID", "id" in reg_data.get("user", {}))

    # Test 6.4: Registration rejects duplicate email
    res_dup = auth_client.post('/api/auth/register', data=json.dumps(reg_payload), content_type='application/json')
    assert_test("Duplicate registration returns 409 Conflict", res_dup.status_code == 409)

    # Test 6.5: Current user reflects newly registered user via session cookie
    res_me_auth = auth_client.get('/api/auth/me')
    assert_test("GET /api/auth/me returns Authenticated True", json.loads(res_me_auth.data.decode('utf-8')).get("authenticated") is True)
    assert_test("GET /api/auth/me user is Priya Patel", json.loads(res_me_auth.data.decode('utf-8')).get("user", {}).get("name") == "Priya Patel")

    # Test 6.6: Logout terminates session
    res_logout = auth_client.post('/api/auth/logout')
    assert_test("POST /api/auth/logout returns 200", res_logout.status_code == 200)

    res_me_after_logout = auth_client.get('/api/auth/me')
    assert_test("GET /api/auth/me after logout returns Authenticated False", json.loads(res_me_after_logout.data.decode('utf-8')).get("authenticated") is False)

    # Test 6.7: Login with invalid password fails
    res_bad_login = auth_client.post('/api/auth/login', data=json.dumps({"email": test_user_email, "password": "wrongPassword"}), content_type='application/json')
    assert_test("Login with invalid password returns 401", res_bad_login.status_code == 401)

    # Test 6.8: Login with valid credentials succeeds
    res_good_login = auth_client.post('/api/auth/login', data=json.dumps({"email": test_user_email, "password": "SecurePassword2026!"}), content_type='application/json')
    assert_test("Login with valid password returns 200", res_good_login.status_code == 200)
    assert_test("Session cookie re-established", json.loads(auth_client.get('/api/auth/me').data.decode('utf-8')).get("authenticated") is True)

    # --------------------------------------------------------------------------
    # 7. Testing Profile Persistence & Roadmap Task Progress
    # --------------------------------------------------------------------------
    print("\n--- 7. Testing Profile Updates & Task Progress Persistence ---")
    # Test 7.1: Retrieve profile for authenticated user
    res_prof_auth = auth_client.get('/api/profile')
    assert_test("GET /api/profile returns 200 for Authenticated User", res_prof_auth.status_code == 200)
    prof_auth_data = json.loads(res_prof_auth.data.decode('utf-8'))
    assert_test("Profile user matches Priya", prof_auth_data.get("user", {}).get("name") == "Priya Patel")

    # Test 7.2: Update profile and skills
    update_payload = {
        "college": "IIT Bombay",
        "degree": "B.Tech",
        "branch": "Electrical Engineering",
        "academicYear": "4th Year",
        "careerId": "cloud-devops",
        "weeklyHours": 18,
        "interests": ["Kubernetes", "Terraform", "Cloud Architecture"],
        "skills": ["Linux Basics", "Docker", "AWS / Cloud Fundamentals"],
        "skillProficiencies": {
            "Linux Basics": 85,
            "Docker": 75,
            "AWS / Cloud Fundamentals": 65
        }
    }
    res_update = auth_client.put('/api/profile', data=json.dumps(update_payload), content_type='application/json')
    assert_test("PUT /api/profile returns 200", res_update.status_code == 200)
    updated_json = json.loads(res_update.data.decode('utf-8'))
    assert_test("Updated Profile College is IIT Bombay", updated_json.get("profile", {}).get("profile", {}).get("college") == "IIT Bombay")
    assert_test("Updated Career is cloud-devops", updated_json.get("profile", {}).get("profile", {}).get("career_id") == "cloud-devops")
    assert_test("Updated Skills Count is 3", len(updated_json.get("profile", {}).get("profile", {}).get("skills", [])) == 3)

    # Test 7.3: Toggle Roadmap Task for authenticated user
    # Task cd-1 under cloud-devops
    res_toggle_1 = auth_client.post('/api/roadmap/toggle-task', data=json.dumps({"task_id": "cd-1"}), content_type='application/json')
    assert_test("POST /api/roadmap/toggle-task returns 200", res_toggle_1.status_code == 200)
    toggle_1_data = json.loads(res_toggle_1.data.decode('utf-8'))
    assert_test("Task cd-1 completed == True", toggle_1_data.get("completed") is True)
    assert_test("Completed tasks count >= 1", toggle_1_data.get("completed_tasks_count", 0) >= 1)

    # Test 7.4: Roadmap progress API reflects completed task
    res_prog = auth_client.get('/api/roadmap/cloud-devops/progress')
    assert_test("GET /api/roadmap/cloud-devops/progress returns 200", res_prog.status_code == 200)
    prog_data = json.loads(res_prog.data.decode('utf-8'))
    assert_test("User has completed tasks in progress view", prog_data.get("completed_tasks") >= 1)

    # Test 7.5: Demo Login Endpoint works seamlessly
    res_demo = auth_client.post('/api/auth/demo-login')
    assert_test("POST /api/auth/demo-login returns 200", res_demo.status_code == 200)
    demo_auth_check = json.loads(auth_client.get('/api/auth/me').data.decode('utf-8'))
    assert_test("Session user is Aarav Sharma after Demo Login", demo_auth_check.get("user", {}).get("name") == "Aarav Sharma")

    # --------------------------------------------------------------------------
    # 8. Testing AI Skill Gap Analysis & Gemini API Integration
    # --------------------------------------------------------------------------
    print("\n--- 8. Testing AI Skill Gap Analysis & Gemini Integration ---")
    import ai_service
    from database import calculate_skill_gap

    # Test 8.1: Unauthenticated request rejects with 401
    unauth_client = app.test_client()
    res_ai_unauth = unauth_client.post('/api/ai/skill-gap', data=json.dumps({"career_id": "python-dev"}), content_type='application/json')
    assert_test("Unauthenticated POST /api/ai/skill-gap returns 401", res_ai_unauth.status_code == 401)

    # Test 8.2: Invalid career track ID rejects with 400
    res_ai_invalid = auth_client.post('/api/ai/skill-gap', data=json.dumps({"career_id": "quantum-mechanics-xyz"}), content_type='application/json')
    assert_test("Invalid career ID returns 400", res_ai_invalid.status_code == 400)
    invalid_data = json.loads(res_ai_invalid.data.decode('utf-8'))
    assert_test("Error response contains helpful message", "error" in invalid_data and "valid_careers" in invalid_data)

    # Test 8.3: Deterministic Database Skill Gap Calculation on all 4 careers
    demo_user = query_db("SELECT id FROM users WHERE email = 'aarav.sharma@college.edu';", one=True)
    for track in ['python-dev', 'web-dev', 'data-analyst', 'cloud-devops']:
        gap_res, err = calculate_skill_gap(demo_user['id'], track)
        assert_test(f"calculate_skill_gap succeeds for {track}", err is None and gap_res is not None)
        assert_test(f"{track} has readiness percentage 0-100", 0 <= gap_res['readiness_percentage'] <= 100)
        assert_test(f"{track} categorizes total skills correctly", (len(gap_res['matched_skills']) + len(gap_res['improving_skills']) + len(gap_res['missing_skills'])) == gap_res['total_required'])
        assert_test(f"{track} generates prioritized gaps", len(gap_res['prioritized_gaps']) > 0)

    # Test 8.4: Missing API key returns Heuristic Fallback
    orig_key = os.environ.get('GEMINI_API_KEY')
    if 'GEMINI_API_KEY' in os.environ:
        del os.environ['GEMINI_API_KEY']

    res_ai_no_key = auth_client.post('/api/ai/skill-gap', data=json.dumps({"career_id": "python-dev"}), content_type='application/json')
    assert_test("Missing GEMINI_API_KEY returns 200 via fallback", res_ai_no_key.status_code == 200)
    ai_no_key_data = json.loads(res_ai_no_key.data.decode('utf-8'))
    assert_test("Provider is heuristic_fallback when no key", ai_no_key_data.get("ai_provider") == "heuristic_fallback")
    assert_test("Recommendations include summary", "summary" in ai_no_key_data.get("ai_recommendations", {}))
    assert_test("Recommendations include practical projects", len(ai_no_key_data.get("ai_recommendations", {}).get("practical_projects", [])) >= 2)
    assert_test("Recommendations include next steps", len(ai_no_key_data.get("ai_recommendations", {}).get("next_steps", [])) >= 3)

    # Test 8.5: Mocked Gemini API Success
    mock_gemini_called = False
    original_call_gemini = ai_service.call_gemini_api

    def mock_successful_gemini(prompt, api_key, model):
        nonlocal mock_gemini_called
        mock_gemini_called = True
        return {
            "summary": "Mocked Gemini Analysis: Excellent Python foundations, ready to target junior backend roles.",
            "priority_skills": [
                {"skill": "FastAPI / Django", "urgency": "Critical", "why": "Standard for Python APIs", "current_status": "Missing"}
            ],
            "learning_guidance": "Dedicate 8 hours this week to building FastAPI routing.",
            "recommended_topics": ["Pydantic V2 Models", "Dependency Injection"],
            "practical_projects": [
                {
                    "title": "Mocked Campus Event API",
                    "difficulty": "Intermediate",
                    "duration": "2 Weeks (15 hrs)",
                    "skills_targeted": ["FastAPI", "PostgreSQL"],
                    "description": "Build high performance event registration API",
                    "portfolio_impact": "Proves async API mastery"
                }
            ],
            "next_steps": ["Initialize FastAPI repo", "Write Pydantic models"]
        }

    ai_service.call_gemini_api = mock_successful_gemini
    os.environ['GEMINI_API_KEY'] = 'test-mock-gemini-key-2026'

    res_ai_mock = auth_client.post('/api/ai/skill-gap', data=json.dumps({"career_id": "python-dev"}), content_type='application/json')
    assert_test("Mocked Gemini POST /api/ai/skill-gap returns 200", res_ai_mock.status_code == 200)
    ai_mock_data = json.loads(res_ai_mock.data.decode('utf-8'))
    assert_test("Gemini API function was invoked", mock_gemini_called is True)
    assert_test("Provider reflects gemini model", "gemini" in ai_mock_data.get("ai_provider", "").lower())
    assert_test("Gemini summary matches mock", "Mocked Gemini Analysis" in ai_mock_data.get("ai_recommendations", {}).get("summary", ""))

    # Test 8.6: Mocked Gemini API Network Failure (Graceful Fallback)
    def mock_failing_gemini(prompt, api_key, model):
        import urllib.error
        raise urllib.error.URLError("Simulated connection timeout to generativelanguage.googleapis.com")

    ai_service.call_gemini_api = mock_failing_gemini
    res_ai_fail = auth_client.post('/api/ai/skill-gap', data=json.dumps({"career_id": "python-dev"}), content_type='application/json')
    assert_test("Gemini Network Error returns 200 via graceful fallback", res_ai_fail.status_code == 200)
    ai_fail_data = json.loads(res_ai_fail.data.decode('utf-8'))
    assert_test("Fallback provider active after network error", ai_fail_data.get("ai_provider") == "heuristic_fallback")
    assert_test("Notice contains error details", "Simulated connection timeout" in str(ai_fail_data.get("ai_notice", "")))
    assert_test("Fallback still contains practical projects", len(ai_fail_data.get("ai_recommendations", {}).get("practical_projects", [])) >= 2)

    # Test 8.7: Mocked Gemini Invalid/Malformed Response Handling
    def mock_malformed_gemini(prompt, api_key, model):
        # Return dict missing required keys
        return {"invalid_key": "malformed data with no summary"}

    ai_service.call_gemini_api = mock_malformed_gemini
    res_ai_malformed = auth_client.post('/api/ai/skill-gap', data=json.dumps({"career_id": "python-dev"}), content_type='application/json')
    assert_test("Malformed Gemini Response returns 200 via fallback", res_ai_malformed.status_code == 200)
    ai_malformed_data = json.loads(res_ai_malformed.data.decode('utf-8'))
    assert_test("Fallback provider active after malformed response", ai_malformed_data.get("ai_provider") == "heuristic_fallback")
    assert_test("Notice mentions missing required keys", "missing required keys" in str(ai_malformed_data.get("ai_notice", "")).lower())

    # Restore environment & functions
    ai_service.call_gemini_api = original_call_gemini
    if orig_key:
        os.environ['GEMINI_API_KEY'] = orig_key
    elif 'GEMINI_API_KEY' in os.environ:
        del os.environ['GEMINI_API_KEY']

    # Restore Aarav's baseline tasks and hours in SQLite
    with get_db() as conn:
        cursor = conn.cursor()
        aarav_row = cursor.execute("SELECT id FROM users WHERE email = 'aarav.sharma@college.edu';").fetchone()
        if aarav_row:
            cursor.execute("DELETE FROM user_task_progress WHERE user_id = ? AND task_id NOT IN ('py-1', 'py-2', 'py-3', 'py-4');", (aarav_row[0],))
            cursor.execute("UPDATE student_profiles SET weekly_hours = 12 WHERE user_id = ?;", (aarav_row[0],))

    # --------------------------------------------------------------------------
    # 9. Testing AI Career Roadmap Advisor Engine & Endpoint
    # --------------------------------------------------------------------------
    print("\n--- 9. Testing AI Career Roadmap Advisor Engine & Endpoint ---")

    # 9.1 Unauthenticated access
    client_unauth = app.test_client()
    res_adv_unauth = client_unauth.post('/api/ai/roadmap-advisor', json={'career_id': 'python-dev'})
    assert_test("Unauthenticated POST /api/ai/roadmap-advisor returns 401", res_adv_unauth.status_code == 401)

    # 9.2 Invalid career track
    res_adv_inv = auth_client.post('/api/ai/roadmap-advisor', json={'career_id': 'invalid-track-xyz'})
    assert_test("Invalid career ID returns 400", res_adv_inv.status_code == 400)

    # 9.3 All 4 career tracks supported with deterministic heuristic fallback
    for cid in ['python-dev', 'web-dev', 'data-analyst', 'cloud-devops']:
        res_adv = auth_client.post('/api/ai/roadmap-advisor', json={'career_id': cid})
        assert_test(f"Advisor succeeds for track '{cid}' (Status 200)", res_adv.status_code == 200)
        adv_json = json.loads(res_adv.data.decode('utf-8'))
        assert_test(f"Track '{cid}' response has success True", adv_json.get('success') is True)
        advisory = adv_json.get('advisory', {})
        assert_test(f"Track '{cid}' contains summary", bool(advisory.get('summary')))
        assert_test(f"Track '{cid}' contains 6 weekly milestones", len(advisory.get('milestone_guidance', [])) == 6)
        assert_test(f"Track '{cid}' contains recommended projects", len(advisory.get('recommended_projects', [])) >= 1)
        assert_test(f"Track '{cid}' contains weekly study plan", len(advisory.get('weekly_study_plan', [])) >= 3)
        assert_test(f"Track '{cid}' contains priority gaps", isinstance(advisory.get('priority_gaps'), list))

    # 9.4 Verification of honest provider reporting (no fake Gemini claims under fallback)
    res_fb = auth_client.post('/api/ai/roadmap-advisor', json={'career_id': 'python-dev'})
    fb_data = json.loads(res_fb.data.decode('utf-8'))
    assert_test("Provider is heuristic_fallback when no key", fb_data.get('provider') == 'heuristic_fallback')
    assert_test("Confidence score notes Verified Heuristics", "Heuristic" in fb_data.get('advisory', {}).get('confidence_score', ''))

    # 9.5 Test students with different skill levels and pacing
    # Update profile to 25 weekly hours and beginner skills via PUT /api/profile
    auth_client.put('/api/profile', json={
        "weeklyHours": 25,
        "skills": ["Python"],
        "skillProficiencies": {"Python": 50}
    })
    res_intense = auth_client.post('/api/ai/roadmap-advisor', json={'career_id': 'python-dev'})
    intense_data = json.loads(res_intense.data.decode('utf-8'))
    intense_plan = intense_data.get('advisory', {}).get('weekly_study_plan', [])
    assert_test("Study plan adapts to intense hours (includes 6 hrs blocks)", any("6 hrs" in p.get('day', '') for p in intense_plan))

    # 9.6 Test completed milestone recognition
    # Mark cloud-devops tasks cd-1, cd-2, cd-3 as completed in database
    aarav_row = query_db("SELECT id FROM users WHERE email = 'aarav.sharma@college.edu';", one=True)
    aarav_id = aarav_row['id'] if aarav_row else 1
    with get_db() as conn:
        cursor = conn.cursor()
        for tid in ['cd-1', 'cd-2', 'cd-3']:
            cursor.execute("INSERT OR REPLACE INTO user_task_progress (user_id, task_id, completed) VALUES (?, ?, 1);", (aarav_id, tid))
    res_cd = auth_client.post('/api/ai/roadmap-advisor', json={'career_id': 'cloud-devops'})
    cd_data = json.loads(res_cd.data.decode('utf-8'))
    week1_guidance = next((m for m in cd_data.get('advisory', {}).get('milestone_guidance', []) if m.get('week') == 1), {})
    assert_test("Completed Week 1 recognized with Completed priority level", week1_guidance.get('priority_level') == 'Completed')
    assert_test("Completed advice references checkpoints verified", "checkpoints verified" in week1_guidance.get('custom_advice', '').lower())

    # 9.7 Test Mocked Gemini API for Roadmap Advisor
    def mock_gemini_roadmap(prompt, api_key, model):
        return {
            "summary": "Mocked Gemini Roadmap Advisory: Aarav Sharma has exceptional Python fundamentals.",
            "key_strengths": ["Advanced Python OOP", "FastAPI modular routing"],
            "priority_gaps": [{"skill": "Docker", "urgency": "High", "why": "Production containerization"}],
            "milestone_guidance": [
                {"week": 1, "title": "Python Core", "priority_level": "Completed", "custom_advice": "Solid foundation.", "estimated_pacing": "1 week"},
                {"week": 2, "title": "Data Structures", "priority_level": "Review", "custom_advice": "Practice LeetCode.", "estimated_pacing": "1 week"},
                {"week": 3, "title": "PostgreSQL", "priority_level": "Core", "custom_advice": "Model schemas.", "estimated_pacing": "1 week"},
                {"week": 4, "title": "FastAPI", "priority_level": "Critical Gap Focus", "custom_advice": "Build REST endpoints.", "estimated_pacing": "1 week"},
                {"week": 5, "title": "Async & Redis", "priority_level": "Polish", "custom_advice": "Cache lookups.", "estimated_pacing": "1 week"},
                {"week": 6, "title": "Docker", "priority_level": "Critical Gap Focus", "custom_advice": "Containerize microservices.", "estimated_pacing": "1 week"}
            ],
            "recommended_projects": [
                {
                    "title": "Mock Gemini Microservice Project",
                    "duration": "2 Weeks (15 hrs)",
                    "difficulty": "Intermediate",
                    "skills_targeted": ["Python", "Docker"],
                    "description": "Mocked Gemini Project Description",
                    "portfolio_impact": "Proves microservice design"
                }
            ],
            "weekly_study_plan": [
                {"day": "Mon & Tue (3 hrs)", "focus": "FastAPI routes"},
                {"day": "Wed (2 hrs)", "focus": "Docker container build"},
                {"day": "Thu & Fri (4 hrs)", "focus": "Integration testing"},
                {"day": "Weekend (3 hrs)", "focus": "GitHub Actions CI pipeline"}
            ]
        }

    ai_service.call_gemini_api = mock_gemini_roadmap
    os.environ['GEMINI_API_KEY'] = 'test-gemini-key-valid'

    res_gemini_adv = auth_client.post('/api/ai/roadmap-advisor', json={'career_id': 'python-dev'})
    assert_test("Mocked Gemini Roadmap Advisor returns 200", res_gemini_adv.status_code == 200)
    gem_adv_data = json.loads(res_gemini_adv.data.decode('utf-8'))
    assert_test("Provider reflects gemini model", "gemini" in gem_adv_data.get('provider', '').lower())
    assert_test("Summary matches mocked Gemini advisory", "Mocked Gemini Roadmap Advisory" in gem_adv_data.get('advisory', {}).get('summary', ''))
    assert_test("Confidence score indicates Gemini Assisted", "Gemini Assisted" in gem_adv_data.get('advisory', {}).get('confidence_score', ''))

    # 9.8 Test Gemini error fallback for Roadmap Advisor
    def mock_gemini_error(prompt, api_key, model):
        raise ConnectionResetError("Remote server closed connection unexpectedly")

    ai_service.call_gemini_api = mock_gemini_error
    res_adv_err = auth_client.post('/api/ai/roadmap-advisor', json={'career_id': 'python-dev'})
    assert_test("Gemini Network Error returns 200 via fallback", res_adv_err.status_code == 200)
    adv_err_data = json.loads(res_adv_err.data.decode('utf-8'))
    assert_test("Fallback provider active after advisor error", adv_err_data.get('provider') == 'heuristic_fallback')
    assert_test("Notice contains connection error info", "Remote server closed connection unexpectedly" in str(adv_err_data.get('notice', '')))

    # Restore environment & functions
    ai_service.call_gemini_api = original_call_gemini
    if orig_key:
        os.environ['GEMINI_API_KEY'] = orig_key
    elif 'GEMINI_API_KEY' in os.environ:
        del os.environ['GEMINI_API_KEY']

    # Restore Aarav's baseline tasks and hours in SQLite
    with get_db() as conn:
        cursor = conn.cursor()
        aarav_row = cursor.execute("SELECT id FROM users WHERE email = 'aarav.sharma@college.edu';").fetchone()
        if aarav_row:
            cursor.execute("DELETE FROM user_task_progress WHERE user_id = ? AND task_id NOT IN ('py-1', 'py-2', 'py-3', 'py-4');", (aarav_row[0],))
            cursor.execute("UPDATE student_profiles SET weekly_hours = 12 WHERE user_id = ?;", (aarav_row[0],))

    # --------------------------------------------------------------------------
    # 10. Testing Recommended Projects & Synced Study Plans
    # --------------------------------------------------------------------------
    print("\n--- 10. Testing Recommended Projects & Synced Study Plans ---")

    # 10.1 Unauthenticated requests return 401
    res_unauth_proj = client.post('/api/roadmap/projects', json={'career_id': 'python-dev', 'title': 'Test Project'})
    assert_test("Unauthenticated POST /api/roadmap/projects returns 401", res_unauth_proj.status_code == 401)

    res_unauth_plan = client.post('/api/roadmap/study-plan', json={'career_id': 'python-dev', 'study_plan': []})
    assert_test("Unauthenticated POST /api/roadmap/study-plan returns 401", res_unauth_plan.status_code == 401)

    # 10.2 Input Validation
    res_bad_career = auth_client.post('/api/roadmap/projects', json={'career_id': 'invalid-career', 'title': 'Test'})
    assert_test("Invalid career ID returns 400 for projects", res_bad_career.status_code == 400)

    res_empty_title = auth_client.post('/api/roadmap/projects', json={'career_id': 'python-dev', 'title': '  '})
    assert_test("Empty project title returns 400", res_empty_title.status_code == 400)

    # 10.3 Add Project across all 4 Career Tracks
    tracks = ['python-dev', 'web-dev', 'data-analyst', 'cloud-devops']
    for trk in tracks:
        proj_payload = {
            'career_id': trk,
            'title': f'Automated Pipeline for {trk}',
            'description': f'A production grade implementation for {trk}',
            'skills_targeted': ['Docker', 'CI/CD', 'Git'],
            'duration': '2 Weeks (16 hrs)',
            'difficulty': 'Intermediate',
            'portfolio_impact': 'Demonstrates production engineering competence'
        }
        res_add = auth_client.post('/api/roadmap/projects', json=proj_payload)
        assert_test(f"Project added successfully for track '{trk}' (Status 201)", res_add.status_code == 201)
        add_data = json.loads(res_add.data.decode('utf-8'))
        assert_test(f"Track '{trk}' project returns project ID", 'project' in add_data and 'id' in add_data['project'])

    # 10.4 Prevent Duplicate Project Addition (Status 409 Conflict)
    dup_payload = {
        'career_id': 'python-dev',
        'title': 'Automated Pipeline for python-dev',
        'description': 'Duplicate attempt',
        'skills_targeted': ['Python']
    }
    res_dup = auth_client.post('/api/roadmap/projects', json=dup_payload)
    assert_test("Duplicate project addition returns 409 Conflict", res_dup.status_code == 409)
    dup_data = json.loads(res_dup.data.decode('utf-8'))
    assert_test("Duplicate error message is clear", "already been added" in dup_data.get('error', '').lower())

    # 10.5 Retrieve Projects via GET /api/roadmap/projects
    res_get_all = auth_client.get('/api/roadmap/projects')
    assert_test("GET /api/roadmap/projects returns 200", res_get_all.status_code == 200)
    all_proj_data = json.loads(res_get_all.data.decode('utf-8'))
    assert_test("Saved projects count is 4", len(all_proj_data.get('projects', [])) == 4)

    res_get_py = auth_client.get('/api/roadmap/projects?career_id=python-dev')
    py_proj_data = json.loads(res_get_py.data.decode('utf-8'))
    assert_test("Filtering by career_id returns 1 project", len(py_proj_data.get('projects', [])) == 1)
    assert_test("Filtered project title matches", py_proj_data['projects'][0]['title'] == 'Automated Pipeline for python-dev')

    # 10.6 Sync Study Plan via POST /api/roadmap/study-plan
    sample_plan = [
        {"day": "Mon & Tue (4 hrs)", "focus": "FastAPI async endpoints"},
        {"day": "Wed (2 hrs)", "focus": "Docker compose testing"},
        {"day": "Thu & Fri (4 hrs)", "focus": "PostgreSQL database indexing"},
        {"day": "Weekend (2 hrs)", "focus": "Automated test suite review"}
    ]
    res_sync_plan = auth_client.post('/api/roadmap/study-plan', json={
        'career_id': 'python-dev',
        'study_plan': sample_plan,
        'weekly_hours': 12
    })
    assert_test("POST /api/roadmap/study-plan returns 200", res_sync_plan.status_code == 200)

    # 10.7 Retrieve Synced Study Plan via GET /api/roadmap/study-plan
    res_get_plan = auth_client.get('/api/roadmap/study-plan?career_id=python-dev')
    assert_test("GET /api/roadmap/study-plan returns 200", res_get_plan.status_code == 200)
    plan_resp = json.loads(res_get_plan.data.decode('utf-8'))
    assert_test("Study plan is marked synced", plan_resp.get('synced') is True)
    assert_test("Study plan has 4 schedule items", len(plan_resp.get('study_plan', {}).get('study_plan', [])) == 4)

    # 10.8 Re-syncing updates plan rather than creating duplicates
    updated_plan = [
        {"day": "Mon & Tue (6 hrs)", "focus": "Advanced FastAPI WebSockets"},
        {"day": "Weekend (4 hrs)", "focus": "CI/CD Pipeline with GitHub Actions"}
    ]
    res_update_plan = auth_client.post('/api/roadmap/study-plan', json={
        'career_id': 'python-dev',
        'study_plan': updated_plan,
        'weekly_hours': 16
    })
    assert_test("Re-syncing study plan returns 200", res_update_plan.status_code == 200)
    res_get_updated = auth_client.get('/api/roadmap/study-plan?career_id=python-dev')
    updated_resp = json.loads(res_get_updated.data.decode('utf-8'))
    assert_test("Updated study plan reflects new schedule count (2)", len(updated_resp.get('study_plan', {}).get('study_plan', [])) == 2)
    assert_test("Updated study plan reflects new weekly hours (16)", updated_resp.get('study_plan', {}).get('weekly_hours') == 16)

    # 10.9 Strict User-Level Data Isolation (Aarav vs Second User)
    client2 = app.test_client()
    client2.post('/api/auth/register', json={
        'name': 'Rohan Sen',
        'email': 'rohan.sen@example.com',
        'password': 'Password123!',
        'career_id': 'python-dev'
    })
    # Rohan checks saved projects - should be 0
    res_rohan_proj = client2.get('/api/roadmap/projects')
    rohan_proj_data = json.loads(res_rohan_proj.data.decode('utf-8'))
    assert_test("User isolation: Second user has 0 saved projects", len(rohan_proj_data.get('projects', [])) == 0)

    # Rohan checks synced study plan - should be not synced
    res_rohan_plan = client2.get('/api/roadmap/study-plan?career_id=python-dev')
    rohan_plan_data = json.loads(res_rohan_plan.data.decode('utf-8'))
    assert_test("User isolation: Second user has no synced study plan", rohan_plan_data.get('synced') is False)

    # 10.10 Delete Project via DELETE /api/roadmap/projects/<id>
    proj_to_delete = py_proj_data['projects'][0]['id']
    res_del_unauth = client2.delete(f'/api/roadmap/projects/{proj_to_delete}')
    assert_test("User isolation: Rohan cannot delete Aarav's project (returns 404)", res_del_unauth.status_code == 404)

    res_del_owner = auth_client.delete(f'/api/roadmap/projects/{proj_to_delete}')
    assert_test("Owner can delete project (Status 200)", res_del_owner.status_code == 200)

    # Clean up test user & projects
    aarav_row = query_db("SELECT id FROM users WHERE email = 'aarav.sharma@college.edu';", one=True)
    aarav_id = aarav_row['id'] if aarav_row else 1
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM users WHERE email = 'rohan.sen@example.com';")
        cursor.execute("DELETE FROM user_recommended_projects WHERE user_id = ?;", (aarav_id,))
        cursor.execute("DELETE FROM user_study_plans WHERE user_id = ?;", (aarav_id,))

    # --------------------------------------------------------------------------
    # 11. Static File Security & Sensitive File Protection Tests
    # --------------------------------------------------------------------------
    print("\n--- 11. Testing Static File Security & Sensitive Access Controls ---")
    static_client = app.test_client()

    # 11.1 Default Static Handler is Not Exposed
    assert_test("Flask static_folder is None", app.static_folder is None)
    endpoints = [r.endpoint for r in app.url_map.iter_rules()]
    assert_test("Default 'static' endpoint is disabled and not in url_map", 'static' not in endpoints)

    # 11.2 Sensitive Database & Backup File Access is Blocked (403)
    db_paths = ['/skillspring.db', '/skillspring.db.bak', '/skillspring.sqlite', '/skillspring.sqlite3']
    for db_path in db_paths:
        r = static_client.get(db_path)
        assert_test(f"Access to database file {db_path} is forbidden (403)", r.status_code == 403, f"got {r.status_code}")

    # 11.3 Sensitive Python Source Files & Scripts are Blocked (403)
    py_paths = ['/app.py', '/database.py', '/ai_service.py', '/test_backend.py', '/run_backend.bat', '/serve.js', '/readme.md']
    for py_path in py_paths:
        r = static_client.get(py_path)
        assert_test(f"Access to backend script {py_path} is forbidden (403)", r.status_code == 403, f"got {r.status_code}")

    # 11.4 Sensitive Configuration & Environment Files are Blocked (403)
    env_paths = ['/.env', '/.env.example', '/.git', '/.gitignore']
    for env_path in env_paths:
        r = static_client.get(env_path)
        assert_test(f"Access to config file {env_path} is forbidden (403)", r.status_code == 403, f"got {r.status_code}")

    # 11.5 Path Traversal Attempts are Blocked (403/400)
    traversal_paths = ['/..%2fskillspring.db', '/css/../skillspring.db', '/skillspring%2edb', '/js/../../app.py']
    for trav_path in traversal_paths:
        r = static_client.get(trav_path)
        assert_test(f"Path traversal attempt {trav_path} is blocked (403 or 400)", r.status_code in (400, 403), f"got {r.status_code}")

    # 11.6 Legitimate HTML Pages Return 200 OK (All 11 Frontend Pages)
    html_pages = [
        'index.html', 'login.html', 'signup.html', 'dashboard.html',
        'profile.html', 'roadmap.html', 'recommendations.html',
        'skill-gap.html', 'careers.html', 'progress.html', 'settings.html'
    ]
    for page in html_pages:
        r = static_client.get(f'/{page}')
        assert_test(f"Legitimate page /{page} returns 200 OK", r.status_code == 200, f"got {r.status_code}")

    # 11.7 Extensionless HTML URLs Return 200 OK
    extensionless_urls = ['/dashboard', '/roadmap', '/profile', '/recommendations', '/skill-gap', '/settings']
    for url in extensionless_urls:
        r = static_client.get(url)
        assert_test(f"Extensionless URL {url} returns 200 OK", r.status_code == 200, f"got {r.status_code}")

    # 11.8 Legitimate Frontend CSS & JS Assets Return 200 OK
    asset_paths = ['/css/style.css', '/js/roadmap.js', '/js/recommendations.js', '/js/auth.js', '/js/profile.js']
    for asset in asset_paths:
        r = static_client.get(asset)
        assert_test(f"Frontend asset {asset} returns 200 OK", r.status_code == 200, f"got {r.status_code}")

    # 11.9 Nonexistent Resource Returns 404
    r_404 = static_client.get('/nonexistent-page-12345.html')
    assert_test("Nonexistent HTML returns 404 Not Found", r_404.status_code == 404, f"got {r_404.status_code}")

    # --------------------------------------------------------------------------
    # Summary
    # --------------------------------------------------------------------------
    print("\n" + "=" * 60)
    print(f"[SUCCESS] All {passed_count}/{total_count} Backend & Database Tests PASSED!")
    print("=" * 60)
    return True

if __name__ == '__main__':
    run_tests()
