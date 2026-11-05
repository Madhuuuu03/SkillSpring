"""
SkillSpring - Database Engine & Schema Management
SQLite integration with parameterized queries, connection pooling helpers,
strict foreign key enforcement, and default seed datasets.
"""

import os
import sqlite3
import json
from contextlib import contextmanager
from werkzeug.security import generate_password_hash

DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'skillspring.db')

def get_db_path():
    """Return the absolute path to the SQLite database file."""
    return DB_FILE

def get_db_connection():
    """
    Open a raw database connection with row factory and foreign keys enabled.
    Caller is responsible for closing the connection or using the context manager.
    """
    conn = sqlite3.connect(DB_FILE, timeout=10.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

@contextmanager
def get_db():
    """
    Context manager for safe database connections.
    Automatically commits on clean exit or rolls back on unhandled exceptions.
    """
    conn = get_db_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def query_db(query, args=(), one=False):
    """
    Execute a parameterized SELECT query and return dictionary-like Row results.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(query, args)
        rows = cursor.fetchall()
        cursor.close()
        if one:
            return rows[0] if rows else None
        return rows

def execute_db(query, args=()):
    """
    Execute a parameterized INSERT, UPDATE, or DELETE query and return lastrowid.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(query, args)
        last_id = cursor.lastrowid
        cursor.close()
        return last_id

# ==============================================================================
# Database Schema Initialization
# ==============================================================================

SCHEMA_STATEMENTS = [
    # 1. Users Table (Authentication & Identity)
    """
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL COLLATE NOCASE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'student' CHECK(role IN ('student', 'mentor', 'admin')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """,

    # 2. Careers Table (Curated Career Tracks)
    """
    CREATE TABLE IF NOT EXISTS careers (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        level TEXT NOT NULL,
        match_score_benchmark INTEGER DEFAULT 75 CHECK(match_score_benchmark >= 0 AND match_score_benchmark <= 100),
        avg_salary TEXT NOT NULL,
        growth_rate TEXT NOT NULL,
        description TEXT NOT NULL,
        suitable_branches TEXT,
        top_tools TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """,

    # 3. Student Profiles Table (Academic Details & Career Goals)
    """
    CREATE TABLE IF NOT EXISTS student_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        college TEXT NOT NULL,
        degree TEXT NOT NULL,
        branch TEXT NOT NULL,
        academic_year TEXT NOT NULL,
        career_id TEXT NOT NULL,
        weekly_hours INTEGER NOT NULL DEFAULT 12 CHECK(weekly_hours >= 1 AND weekly_hours <= 80),
        interests TEXT,
        current_streak_days INTEGER DEFAULT 6 CHECK(current_streak_days >= 0),
        total_study_hours_logged REAL DEFAULT 42.0 CHECK(total_study_hours_logged >= 0),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (career_id) REFERENCES careers(id) ON DELETE RESTRICT
    );
    """,

    # 4. Master Skills Catalog
    """
    CREATE TABLE IF NOT EXISTS skills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL COLLATE NOCASE,
        category TEXT NOT NULL DEFAULT 'General',
        description TEXT
    );
    """,

    # 5. Career Required Skills (Weighted Prerequisites for Gap Analysis)
    """
    CREATE TABLE IF NOT EXISTS career_required_skills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        career_id TEXT NOT NULL,
        skill_name TEXT NOT NULL,
        importance TEXT NOT NULL CHECK(importance IN ('Critical', 'High', 'Core', 'Medium', 'Low')),
        weight INTEGER NOT NULL CHECK(weight > 0 AND weight <= 100),
        benchmark_proficiency INTEGER NOT NULL DEFAULT 80 CHECK(benchmark_proficiency >= 0 AND benchmark_proficiency <= 100),
        UNIQUE(career_id, skill_name),
        FOREIGN KEY (career_id) REFERENCES careers(id) ON DELETE CASCADE
    );
    """,

    # 6. Student User Skills & Self-Assessed Proficiencies
    """
    CREATE TABLE IF NOT EXISTS user_skills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        skill_name TEXT NOT NULL,
        proficiency INTEGER NOT NULL DEFAULT 60 CHECK(proficiency >= 0 AND proficiency <= 100),
        status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'archived', 'planned')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, skill_name),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """,

    # 7. Roadmap Milestones (Weekly Roadmap Chapters)
    """
    CREATE TABLE IF NOT EXISTS roadmap_milestones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        career_id TEXT NOT NULL,
        week_number INTEGER NOT NULL CHECK(week_number > 0),
        title TEXT NOT NULL,
        estimated_hours TEXT NOT NULL,
        topics TEXT NOT NULL,
        project_title TEXT NOT NULL,
        UNIQUE(career_id, week_number),
        FOREIGN KEY (career_id) REFERENCES careers(id) ON DELETE CASCADE
    );
    """,

    # 8. Roadmap Milestone Tasks
    """
    CREATE TABLE IF NOT EXISTS roadmap_tasks (
        id TEXT PRIMARY KEY,
        milestone_id INTEGER NOT NULL,
        task_text TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0,
        FOREIGN KEY (milestone_id) REFERENCES roadmap_milestones(id) ON DELETE CASCADE
    );
    """,

    # 9. User Task Completion Progress
    """
    CREATE TABLE IF NOT EXISTS user_task_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        task_id TEXT NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0 CHECK(completed IN (0, 1)),
        completed_at TIMESTAMP,
        UNIQUE(user_id, task_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (task_id) REFERENCES roadmap_tasks(id) ON DELETE CASCADE
    );
    """,

    # 10. User Saved Recommended AI Projects
    """
    CREATE TABLE IF NOT EXISTS user_recommended_projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        career_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        skills_targeted TEXT,
        duration TEXT,
        difficulty TEXT,
        portfolio_impact TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, career_id, title),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (career_id) REFERENCES careers(id) ON DELETE CASCADE
    );
    """,

    # 11. User Synced Adaptive Study Plans
    """
    CREATE TABLE IF NOT EXISTS user_study_plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        career_id TEXT NOT NULL,
        plan_data TEXT NOT NULL,
        weekly_hours INTEGER DEFAULT 12 CHECK(weekly_hours >= 1 AND weekly_hours <= 80),
        synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, career_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (career_id) REFERENCES careers(id) ON DELETE CASCADE
    );
    """
]

INDEX_STATEMENTS = [
    "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);",
    "CREATE INDEX IF NOT EXISTS idx_student_profiles_user ON student_profiles(user_id);",
    "CREATE INDEX IF NOT EXISTS idx_career_skills_career ON career_required_skills(career_id);",
    "CREATE INDEX IF NOT EXISTS idx_user_skills_user ON user_skills(user_id);",
    "CREATE INDEX IF NOT EXISTS idx_roadmap_milestones_career ON roadmap_milestones(career_id);",
    "CREATE INDEX IF NOT EXISTS idx_roadmap_tasks_milestone ON roadmap_tasks(milestone_id);",
    "CREATE INDEX IF NOT EXISTS idx_task_progress_user ON user_task_progress(user_id);",
    "CREATE INDEX IF NOT EXISTS idx_user_rec_projects ON user_recommended_projects(user_id, career_id);",
    "CREATE INDEX IF NOT EXISTS idx_user_study_plans ON user_study_plans(user_id, career_id);"
]

# ==============================================================================
# Sample Datasets & Seeding
# ==============================================================================

SAMPLE_CAREERS = [
    (
        'python-dev',
        'Python Developer',
        'Software Engineering',
        'Entry - Mid Level',
        78,
        '$85,000 / ₹12-16 LPA',
        '+24% YoY',
        'Design, develop, and deploy scalable backend services, APIs, and automation scripts using Python, modern web frameworks, and relational databases.',
        '["Computer Science", "Information Technology", "Electronics"]',
        '["FastAPI", "Django", "PostgreSQL", "Docker", "PyTest", "Postman"]'
    ),
    (
        'web-dev',
        'Web Developer (Full Stack)',
        'Web Development',
        'Entry - Mid Level',
        62,
        '$82,000 / ₹10-15 LPA',
        '+21% YoY',
        'Build interactive, responsive web applications across the client and server stack using contemporary JavaScript frameworks, CSS architectures, and Node.js.',
        '["Computer Science", "Information Technology", "Any Engineering"]',
        '["React", "Node.js", "Tailwind CSS", "TypeScript", "Next.js", "Vite"]'
    ),
    (
        'data-analyst',
        'Data Analyst',
        'Data & Analytics',
        'Entry Level',
        54,
        '$78,000 / ₹9-14 LPA',
        '+28% YoY',
        'Transform raw data into meaningful business insights through statistical exploration, interactive dashboards, SQL modeling, and predictive reporting.',
        '["Computer Science", "Data Science", "Mathematics", "Economics"]',
        '["SQL", "Pandas", "PowerBI", "Tableau", "Jupyter", "Excel"]'
    ),
    (
        'cloud-devops',
        'Cloud & DevOps Engineer',
        'Infrastructure & Cloud',
        'Junior - Associate',
        41,
        '$92,000 / ₹14-18 LPA',
        '+32% YoY',
        'Automate build, deployment, and infrastructure provisioning pipelines on AWS or GCP using containers, CI/CD, and Infrastructure as Code.',
        '["Computer Science", "Information Technology", "Telecommunication"]',
        '["Docker", "AWS", "GitHub Actions", "Terraform", "Linux", "Kubernetes"]'
    )
]

SAMPLE_REQUIRED_SKILLS = [
    # Python Developer
    ('python-dev', 'Python', 'Critical', 20, 80),
    ('python-dev', 'REST APIs', 'High', 15, 80),
    ('python-dev', 'SQL Basics', 'High', 15, 75),
    ('python-dev', 'Git & GitHub', 'Core', 10, 80),
    ('python-dev', 'Data Structures', 'High', 15, 75),
    ('python-dev', 'FastAPI / Django', 'Critical', 15, 80),
    ('python-dev', 'Docker', 'Medium', 5, 70),
    ('python-dev', 'PostgreSQL', 'Medium', 5, 75),

    # Web Developer
    ('web-dev', 'HTML5 & CSS3', 'Core', 15, 85),
    ('web-dev', 'JavaScript', 'Critical', 20, 85),
    ('web-dev', 'Git & GitHub', 'Core', 10, 80),
    ('web-dev', 'REST APIs', 'High', 15, 80),
    ('web-dev', 'React', 'Critical', 15, 80),
    ('web-dev', 'Node.js', 'High', 10, 75),
    ('web-dev', 'SQL Basics', 'Medium', 10, 70),
    ('web-dev', 'TypeScript', 'Medium', 5, 70),

    # Data Analyst
    ('data-analyst', 'Python', 'High', 15, 75),
    ('data-analyst', 'SQL Basics', 'Critical', 20, 85),
    ('data-analyst', 'Advanced SQL', 'Critical', 15, 80),
    ('data-analyst', 'Pandas & NumPy', 'High', 15, 80),
    ('data-analyst', 'PowerBI / Tableau', 'Critical', 15, 80),
    ('data-analyst', 'Statistics & Probability', 'Core', 10, 75),
    ('data-analyst', 'Data Visualization', 'Medium', 10, 75),

    # Cloud & DevOps Engineer
    ('cloud-devops', 'Linux Basics', 'Critical', 20, 80),
    ('cloud-devops', 'Git & GitHub', 'Core', 10, 80),
    ('cloud-devops', 'Docker', 'Critical', 20, 80),
    ('cloud-devops', 'AWS / Cloud Fundamentals', 'Critical', 20, 80),
    ('cloud-devops', 'CI/CD Pipelines (GitHub Actions)', 'High', 15, 75),
    ('cloud-devops', 'Python', 'Medium', 15, 75)
]

SAMPLE_ROADMAP_MILESTONES = [
    # Python Dev Milestones
    ('python-dev', 1, 'Python Core & Advanced Concepts', '10 hrs', '["OOP Principles in Python", "Generators, Decorators, Iterators", "Type Annotations & Virtual Environments"]', 'CLI Task Manager with JSON persistence'),
    ('python-dev', 2, 'Data Structures, Algorithms & Clean Code', '12 hrs', '["Complexity Analysis (Big O)", "Hash Maps, Linked Lists, Trees", "PEP 8, Black, Flake8"]', 'Algorithmic Caching Library with LRU Cache implementation'),
    ('python-dev', 3, 'Relational Databases & SQL with PostgreSQL', '14 hrs', '["PostgreSQL Schema Design", "Complex Joins, Indexes, Transactions", "psycopg3 and SQLAlchemy ORM basics"]', 'College Course Enrollment Database with relational integrity'),
    ('python-dev', 4, 'REST API Architecture with FastAPI', '15 hrs', '["HTTP Methods & Status Codes", "Pydantic Schemas & Request Validation", "Dependency Injection in FastAPI"]', 'RESTful E-Commerce Microservice API with OpenAPI docs'),
    ('python-dev', 5, 'Caching, Background Tasks & Async Python', '12 hrs', '["Asynchronous Programming (asyncio)", "Redis Caching & Key Eviction", "Celery / Background Tasks"]', 'High-Throughput Weather Notification Service with Redis'),
    ('python-dev', 6, 'Containerization, Docker & Deployment', '10 hrs', '["Multi-stage Dockerfiles", "Docker Compose with Postgres & Redis", "Cloud Deployment on Render / AWS EC2"]', 'Containerized Production-ready Portfolio API with CI/CD'),

    # Web Developer Milestones
    ('web-dev', 1, 'Modern JavaScript (ES6+) & DOM Engineering', '10 hrs', '["Async/Await, Promises & Fetch", "Destructuring, Modules, Closures", "Event Delegation & DOM Performance"]', 'Interactive Task Management Dashboard with LocalStorage'),
    ('web-dev', 2, 'React Fundamentals & Component Architecture', '14 hrs', '["JSX, Props & State", "Hooks: useState, useEffect, useMemo", "Component Hierarchy & Reusability"]', 'Job Board Application with Search and Filter states'),
    ('web-dev', 3, 'Backend with Node.js & Express', '12 hrs', '["Node Event Loop & Modules", "Express Middleware & Routing", "Authentication & Authorization"]', 'RESTful API for Student Community with auth tokens'),
    ('web-dev', 4, 'Relational Database Integration with PostgreSQL & Prisma', '12 hrs', '["Database Schema Modeling", "Prisma ORM Queries & Migrations", "Indexes & Transactions"]', 'Full Stack SaaS Subscription Management Schema & API'),
    ('web-dev', 5, 'Full-Stack React & Next.js Architecture', '14 hrs', '["Next.js App Router Architecture", "Server Actions & SSR", "Caching & Incremental Static Regeneration"]', 'Production Next.js E-Commerce Storefront with Server Actions'),
    ('web-dev', 6, 'Testing, CI/CD & Production Deployment', '10 hrs', '["Unit & Integration Testing with Vitest", "End-to-End Testing with Playwright", "Docker & Vercel/Render Deployment"]', 'Containerized Full Stack Web App with Automated CI Pipeline'),

    # Data Analyst Milestones
    ('data-analyst', 1, 'Advanced SQL for Analytics & Data Modeling', '12 hrs', '["Complex Multi-Table Joins", "Window Functions & CTEs", "Data Aggregation & Grouping Sets"]', 'Retail Sales Revenue Analysis & Cohort Retention Model'),
    ('data-analyst', 2, 'Data Wrangling with Python & Pandas', '14 hrs', '["Data Cleaning & Imputation", "Pandas GroupBy & Pivots", "Merging and Reshaping Datasets"]', 'Customer Churn Analysis on 50,000+ Records'),
    ('data-analyst', 3, 'BI Dashboards with PowerBI / Tableau', '12 hrs', '["Data Modeling & Star Schema", "DAX Measures & Calculated Columns", "Interactive Executive Dashboards"]', 'Interactive Executive KPI Dashboard for Higher Ed'),
    ('data-analyst', 4, 'Applied Statistical Analysis & Hypothesis Testing', '10 hrs', '["A/B Testing Frameworks", "Probability Distributions & Z/T Tests", "Confidence Intervals & P-Values"]', 'E-Commerce Checkout Funnel A/B Test Statistical Evaluation'),
    ('data-analyst', 5, 'Automated ETL Pipelines & Data Warehousing', '12 hrs', '["ETL Pipeline Design", "Data Warehousing with Snowflake / BigQuery", "Scheduled Ingestion Scripts"]', 'Automated Daily Financial Market Data Ingestion Pipeline'),
    ('data-analyst', 6, 'Executive Storytelling & Capstone Portfolio', '10 hrs', '["Data Storytelling Principles", "Executive Slide Decks", "Interactive Portfolio Presentation"]', 'End-to-End Enterprise Growth & Retention Capstone Presentation'),

    # Cloud & DevOps Milestones
    ('cloud-devops', 1, 'Linux System Administration & Shell Automation', '10 hrs', '["Linux CLI & File Permissions", "Process Management & Systemd", "Bash Scripting & Cron Jobs"]', 'Automated Server Health Monitoring & Log Rotation Daemon'),
    ('cloud-devops', 2, 'Git Workflows & Version Control Best Practices', '8 hrs', '["Git Branching Strategies", "Merge Conflicts & Rebase", "Pull Request Reviews & Pre-commit Hooks"]', 'Multi-environment Git Trunk-Based Development Repository'),
    ('cloud-devops', 3, 'Containerization with Docker', '12 hrs', '["Docker Architecture & Engine", "Multi-Stage Dockerfiles", "Docker Compose Multi-Container Stacks"]', 'Production Microservices Stack with Web, API, Postgres & Redis'),
    ('cloud-devops', 4, 'CI/CD Pipelines with GitHub Actions', '12 hrs', '["GitHub Actions Syntax & Runners", "Automated Linting & Test Matrix", "Automated Image Build & Push to Registry"]', 'End-to-End Continuous Integration & Delivery Pipeline'),
    ('cloud-devops', 5, 'Cloud Infrastructure on AWS & Terraform', '14 hrs', '["AWS Core Services (VPC, EC2, S3, RDS)", "Infrastructure as Code (IaC) with Terraform", "Terraform State & Modules"]', 'Automated Multi-Tier AWS Infrastructure Provisioned with Terraform'),
    ('cloud-devops', 6, 'Kubernetes Fundamentals & Cluster Orchestration', '14 hrs', '["Kubernetes Pods, Deployments & Services", "Ingress Controllers & Cert-Manager", "Prometheus & Grafana Monitoring"]', 'High-Availability Kubernetes Microservice Cluster with Monitoring')
]

SAMPLE_ROADMAP_TASKS = [
    # Python Dev Tasks (py-1 to py-18)
    ('py-1', 'python-dev', 1, 'Master Python OOP: Class methods, static methods, and inheritance', 1),
    ('py-2', 'python-dev', 1, 'Understand Python closures, decorators, and custom contexts', 2),
    ('py-3', 'python-dev', 1, 'Build & package a CLI tool with argparse and virtualenv', 3),

    ('py-4', 'python-dev', 2, 'Solve 15 LeetCode medium questions using native Python structures', 1),
    ('py-5', 'python-dev', 2, 'Implement an LRU Cache from scratch with Doubly Linked List', 2),
    ('py-6', 'python-dev', 2, 'Set up pre-commit linting with Black and Flake8', 3),

    ('py-7', 'python-dev', 3, 'Design 3NF normalized schema for University Course Portal', 1),
    ('py-8', 'python-dev', 3, 'Write queries utilizing JOINs, Window Functions, and GROUP BY', 2),
    ('py-9', 'python-dev', 3, 'Connect Python to Postgres with connection pooling', 3),

    ('py-10', 'python-dev', 4, 'Create CRUD endpoints with proper response models & error handling', 1),
    ('py-11', 'python-dev', 4, 'Implement JWT user authentication and password hashing with bcrypt', 2),
    ('py-12', 'python-dev', 4, 'Write automated unit and integration tests using PyTest and TestClient', 3),

    ('py-13', 'python-dev', 5, 'Implement Redis caching to reduce database read overhead', 1),
    ('py-14', 'python-dev', 5, 'Set up background email notifications with Celery or RQ', 2),
    ('py-15', 'python-dev', 5, 'Benchmark async vs sync throughput using wrk/locust', 3),

    ('py-16', 'python-dev', 6, 'Write a lean, production multi-stage Dockerfile for FastAPI', 1),
    ('py-17', 'python-dev', 6, 'Orchestrate FastAPI, PostgreSQL, and Redis with docker-compose', 2),
    ('py-18', 'python-dev', 6, 'Set up GitHub Actions workflow to run tests on git push', 3),

    # Web Dev Tasks (wd-1 to wd-18)
    ('wd-1', 'web-dev', 1, 'Master modern ES6 syntax (spread, rest, optional chaining)', 1),
    ('wd-2', 'web-dev', 1, 'Implement asynchronous data fetching and error boundaries', 2),
    ('wd-3', 'web-dev', 1, 'Build modular JavaScript application without third-party libraries', 3),

    ('wd-4', 'web-dev', 2, 'Build responsive components with Tailwind CSS and React', 1),
    ('wd-5', 'web-dev', 2, 'Manage shared state using Context API or Zustand', 2),
    ('wd-6', 'web-dev', 2, 'Create reusable form controls with validation hooks', 3),

    ('wd-7', 'web-dev', 3, 'Develop Express router endpoints with validation middleware', 1),
    ('wd-8', 'web-dev', 3, 'Secure API with JWT authentication and role-based guards', 2),
    ('wd-9', 'web-dev', 3, 'Deploy backend to cloud provider with environment secrets', 3),

    ('wd-10', 'web-dev', 4, 'Design normalized relational models with foreign key constraints', 1),
    ('wd-11', 'web-dev', 4, 'Implement CRUD resolvers with Prisma ORM and data validation', 2),
    ('wd-12', 'web-dev', 4, 'Benchmark query execution speed and apply compound indexes', 3),

    ('wd-13', 'web-dev', 5, 'Build hybrid SSR and Client components with Next.js App Router', 1),
    ('wd-14', 'web-dev', 5, 'Implement optimistic UI mutations and server action workflows', 2),
    ('wd-15', 'web-dev', 5, 'Integrate Stripe or checkout webhook handling with error logging', 3),

    ('wd-16', 'web-dev', 6, 'Write unit tests for business logic and UI snapshot tests', 1),
    ('wd-17', 'web-dev', 6, 'Build multi-stage Docker container and configure GitHub Actions CI', 2),
    ('wd-18', 'web-dev', 6, 'Deploy full-stack application with custom domain and SSL certificates', 3),

    # Data Analyst Tasks (da-1 to da-18)
    ('da-1', 'data-analyst', 1, 'Write queries using ROW_NUMBER, RANK, DENSE_RANK, and LAG/LEAD', 1),
    ('da-2', 'data-analyst', 1, 'Build recurring monthly cohort retention reports with CTEs', 2),
    ('da-3', 'data-analyst', 1, 'Optimize query execution with proper indexing and EXPLAIN ANALYZE', 3),

    ('da-4', 'data-analyst', 2, 'Clean missing, outlier, and corrupted data using Pandas', 1),
    ('da-5', 'data-analyst', 2, 'Perform exploratory data analysis and correlation heatmaps', 2),
    ('da-6', 'data-analyst', 2, 'Export clean datasets ready for dashboard ingestion', 3),

    ('da-7', 'data-analyst', 3, 'Connect PowerBI to SQL database with relational star schema', 1),
    ('da-8', 'data-analyst', 3, 'Write DAX expressions for Year-over-Year (YoY) revenue metrics', 2),
    ('da-9', 'data-analyst', 3, 'Publish responsive dashboard with drill-down capabilities', 3),

    ('da-10', 'data-analyst', 4, 'Formulate null and alternative hypotheses for conversion experiments', 1),
    ('da-11', 'data-analyst', 4, 'Run two-sample t-tests and chi-squared tests in Python SciPy', 2),
    ('da-12', 'data-analyst', 4, 'Calculate minimum sample size and statistical power for test variants', 3),

    ('da-13', 'data-analyst', 5, 'Extract daily market metrics from REST APIs into raw staging tables', 1),
    ('da-14', 'data-analyst', 5, 'Transform staging data into dimensional star schema tables', 2),
    ('da-15', 'data-analyst', 5, 'Schedule automated pipeline runs and alert on data quality anomalies', 3),

    ('da-16', 'data-analyst', 6, 'Synthesize technical findings into an executive summary deck', 1),
    ('da-17', 'data-analyst', 6, 'Build dynamic interactive dashboard walkthrough with video briefing', 2),
    ('da-18', 'data-analyst', 6, 'Publish reproducible GitHub repository with documented notebooks', 3),

    # Cloud & DevOps Tasks (cd-1 to cd-18)
    ('cd-1', 'cloud-devops', 1, 'Master Linux shell navigation, file system permissions, and SSH hardening', 1),
    ('cd-2', 'cloud-devops', 1, 'Write automated Bash scripts for health checks and Slack/email alerts', 2),
    ('cd-3', 'cloud-devops', 1, 'Configure custom systemd services and scheduled cron jobs', 3),

    ('cd-4', 'cloud-devops', 2, 'Set up Git workflow with protected main and semantic version tagging', 1),
    ('cd-5', 'cloud-devops', 2, 'Implement pre-commit hooks for secret detection and linting', 2),
    ('cd-6', 'cloud-devops', 2, 'Configure signed commits with GPG and automated release notes', 3),

    ('cd-7', 'cloud-devops', 3, 'Create minimal hardened container images using Alpine/Distroless', 1),
    ('cd-8', 'cloud-devops', 3, 'Orchestrate multi-tier application stack with Docker Compose networking', 2),
    ('cd-9', 'cloud-devops', 3, 'Optimize build cache layers to reduce image size by over 60%', 3),

    ('cd-10', 'cloud-devops', 4, 'Build matrix test workflow across multiple runtime versions', 1),
    ('cd-11', 'cloud-devops', 4, 'Build and push tagged Docker images to GitHub Container Registry', 2),
    ('cd-12', 'cloud-devops', 4, 'Implement branch deployment guards and automated rollback triggers', 3),

    ('cd-13', 'cloud-devops', 5, 'Provision isolated VPC with public/private subnets and route tables', 1),
    ('cd-14', 'cloud-devops', 5, 'Deploy auto-scaling web compute instances behind an Application Load Balancer', 2),
    ('cd-15', 'cloud-devops', 5, 'Store remote Terraform state securely in S3 with DynamoDB locking', 3),

    ('cd-16', 'cloud-devops', 6, 'Write declarative Kubernetes deployment and service manifests', 1),
    ('cd-17', 'cloud-devops', 6, 'Configure zero-downtime rolling updates and resource limits', 2),
    ('cd-18', 'cloud-devops', 6, 'Deploy Prometheus and Grafana dashboards for cluster observability', 3)
]

def init_db(seed=True):
    """
    Initialize SQLite database tables and seed baseline sample data if empty.
    """
    with get_db() as conn:
        cursor = conn.cursor()

        # Run schema creations
        for stmt in SCHEMA_STATEMENTS:
            cursor.execute(stmt)

        # Run indices creations
        for idx in INDEX_STATEMENTS:
            cursor.execute(idx)

        if seed:
            seed_initial_data(cursor)

    return True

def seed_initial_data(cursor):
    """
    Seed initial careers, skills, roadmaps, and the default student profile.
    Uses INSERT OR IGNORE so existing databases are updated without overwriting data.
    """
    # 1. Seed Careers
    cursor.executemany(
        """
        INSERT OR IGNORE INTO careers (id, title, category, level, match_score_benchmark, avg_salary, growth_rate, description, suitable_branches, top_tools)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """,
        SAMPLE_CAREERS
    )

    # 2. Seed Career Required Skills
    cursor.executemany(
        """
        INSERT OR IGNORE INTO career_required_skills (career_id, skill_name, importance, weight, benchmark_proficiency)
        VALUES (?, ?, ?, ?, ?);
        """,
        SAMPLE_REQUIRED_SKILLS
    )

    # 3. Seed Master Skills
    master_skills = [
        ('Python', 'Programming Languages'),
        ('JavaScript', 'Programming Languages'),
        ('TypeScript', 'Programming Languages'),
        ('C++', 'Programming Languages'),
        ('Java', 'Programming Languages'),
        ('SQL Basics', 'Databases'),
        ('Advanced SQL', 'Databases'),
        ('PostgreSQL', 'Databases'),
        ('HTML5 & CSS3', 'Frontend'),
        ('React', 'Frontend'),
        ('Tailwind CSS', 'Frontend'),
        ('Node.js', 'Backend'),
        ('FastAPI / Django', 'Backend'),
        ('REST APIs', 'Backend'),
        ('Git & GitHub', 'DevOps & Tools'),
        ('Docker', 'DevOps & Tools'),
        ('Linux Basics', 'Infrastructure & Operating Systems'),
        ('AWS / Cloud Fundamentals', 'Cloud & Infra'),
        ('CI/CD Pipelines (GitHub Actions)', 'DevOps & Tools'),
        ('Terraform', 'Infrastructure & Cloud'),
        ('Kubernetes', 'Infrastructure & Cloud'),
        ('Data Structures', 'Computer Science Fundamentals'),
        ('Pandas & NumPy', 'Data Science'),
        ('PowerBI / Tableau', 'Data Analytics'),
        ('Statistics & Probability', 'Data Science'),
        ('Data Visualization', 'Data Analytics'),
        ('Machine Learning', 'Artificial Intelligence')
    ]
    cursor.executemany(
        "INSERT OR IGNORE INTO skills (name, category) VALUES (?, ?);",
        master_skills
    )

    # 4. Seed Roadmap Milestones and Tasks for All Career Tracks
    for m in SAMPLE_ROADMAP_MILESTONES:
        cursor.execute(
            """
            INSERT OR IGNORE INTO roadmap_milestones (career_id, week_number, title, estimated_hours, topics, project_title)
            VALUES (?, ?, ?, ?, ?, ?);
            """,
            m
        )

    # Build map of (career_id, week_number) -> milestone_id
    cursor.execute("SELECT id, career_id, week_number FROM roadmap_milestones;")
    milestone_map = {(row['career_id'], row['week_number']): row['id'] for row in cursor.fetchall()}

    tasks_to_insert = []
    for tid, cid, week_num, text, sort_order in SAMPLE_ROADMAP_TASKS:
        m_id = milestone_map.get((cid, week_num))
        if m_id:
            tasks_to_insert.append((tid, m_id, text, sort_order))

    cursor.executemany(
        "INSERT OR IGNORE INTO roadmap_tasks (id, milestone_id, task_text, sort_order) VALUES (?, ?, ?, ?);",
        tasks_to_insert
    )

    # 5. Seed Default Demo Student User & Profile
    cursor.execute("SELECT id FROM users WHERE email = 'aarav.sharma@college.edu';")
    existing_user = cursor.fetchone()

    if not existing_user:
        hashed_pw = generate_password_hash("demoPass123")
        cursor.execute(
            """
            INSERT INTO users (name, email, password_hash, role)
            VALUES (?, ?, ?, ?);
            """,
            ('Aarav Sharma', 'aarav.sharma@college.edu', hashed_pw, 'student')
        )
        user_id = cursor.lastrowid

        # Insert student profile
        cursor.execute(
            """
            INSERT INTO student_profiles (user_id, college, degree, branch, academic_year, career_id, weekly_hours, interests, current_streak_days, total_study_hours_logged)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """,
            (
                user_id,
                'National Institute of Technology',
                'B.Tech',
                'Computer Science & Engineering',
                '3rd Year (Class of 2027)',
                'python-dev',
                12,
                'Backend Development, API Design, Distributed Systems, Open Source',
                6,
                42.0
            )
        )

        # Insert Aarav's skills
        initial_skills = [
            (user_id, 'Python', 80),
            (user_id, 'Git & GitHub', 75),
            (user_id, 'SQL Basics', 60),
            (user_id, 'HTML5 & CSS3', 85),
            (user_id, 'Data Structures', 70),
            (user_id, 'REST APIs', 55)
        ]
        cursor.executemany(
            "INSERT OR IGNORE INTO user_skills (user_id, skill_name, proficiency) VALUES (?, ?, ?);",
            initial_skills
        )

        # Insert initial task progress (first 4 tasks completed)
        completed_tasks = ['py-1', 'py-2', 'py-3', 'py-4']
        for tid in completed_tasks:
            cursor.execute(
                """
                INSERT OR IGNORE INTO user_task_progress (user_id, task_id, completed, completed_at)
                VALUES (?, ?, 1, CURRENT_TIMESTAMP);
                """,
                (user_id, tid)
            )

def check_db_health():
    """
    Query database table counts and status for healthcheck endpoints.
    """
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
            tables = [row['name'] for row in cursor.fetchall()]

            table_counts = {}
            for t in tables:
                cursor.execute(f"SELECT COUNT(*) FROM {t};")
                table_counts[t] = cursor.fetchone()[0]

            return {
                "connected": True,
                "database_file": DB_FILE,
                "table_count": len(tables),
                "tables": table_counts
            }
    except Exception as e:
        return {
            "connected": False,
            "error": str(e)
        }

# ==============================================================================
# User, Profile & Roadmap Progress Operations
# ==============================================================================

def create_user(name, email, password, role='student'):
    """
    Register a new user with Werkzeug password hashing.
    Enforces unique email and creates baseline student profile record.
    Returns (user_dict, error_message).
    """
    clean_email = email.strip().lower()
    existing = query_db("SELECT id FROM users WHERE email = ?;", (clean_email,), one=True)
    if existing:
        return None, "An account with this email address already exists"

    hashed_pw = generate_password_hash(password)
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?);",
            (name.strip(), clean_email, hashed_pw, role)
        )
        user_id = cursor.lastrowid

        # Create baseline profile linked to user_id
        cursor.execute(
            """
            INSERT INTO student_profiles (user_id, college, degree, branch, academic_year, career_id, weekly_hours, interests)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?);
            """,
            (
                user_id,
                'Engineering College',
                'B.Tech',
                'Computer Science & Engineering',
                '3rd Year',
                'python-dev',
                12,
                'Software Engineering'
            )
        )

        return {
            "id": user_id,
            "name": name.strip(),
            "email": clean_email,
            "role": role
        }, None

def get_user_by_email(email):
    """Retrieve user record by email address."""
    clean_email = email.strip().lower()
    return query_db("SELECT id, name, email, password_hash, role FROM users WHERE email = ?;", (clean_email,), one=True)

def get_user_by_id(user_id):
    """Retrieve user record by user ID."""
    return query_db("SELECT id, name, email, role, created_at FROM users WHERE id = ?;", (user_id,), one=True)

def get_user_full_profile(user_id):
    """
    Retrieve user information, student profile, acquired skills,
    and completed roadmap task IDs.
    """
    user = get_user_by_id(user_id)
    if not user:
        return None

    profile = query_db("SELECT * FROM student_profiles WHERE user_id = ?;", (user_id,), one=True)
    skills = query_db("SELECT skill_name, proficiency FROM user_skills WHERE user_id = ? ORDER BY proficiency DESC;", (user_id,))
    completed_tasks = query_db("SELECT task_id, completed_at FROM user_task_progress WHERE user_id = ? AND completed = 1;", (user_id,))

    skill_names = [s['skill_name'] for s in skills]
    proficiencies = {s['skill_name']: s['proficiency'] for s in skills}
    completed_task_ids = [t['task_id'] for t in completed_tasks]

    prof_dict = dict(profile) if profile else {}

    # Get career details
    career_id = prof_dict.get('career_id', 'python-dev')
    career = query_db("SELECT title, category, level, avg_salary FROM careers WHERE id = ?;", (career_id,), one=True)

    return {
        "user": dict(user),
        "profile": {
            **prof_dict,
            "careerTitle": career['title'] if career else 'Python Developer',
            "skills": skill_names,
            "skillProficiencies": proficiencies,
            "completedTasks": completed_task_ids,
            "completedTasksCount": len(completed_task_ids)
        }
    }

def update_user_profile(user_id, data):
    """
    Update student profile and skills for the authenticated user.
    Enforces user ownership via user_id parameter.
    Validates all payload fields and returns (profile_dict, error_message).
    """
    if not isinstance(data, dict):
        return None, "Profile data must be a JSON object."

    # Validate career track if provided
    career_id = data.get('careerId') or data.get('career_id')
    if not career_id and 'careerGoal' in data:
        goal_lower = str(data['careerGoal']).lower()
        if 'web' in goal_lower:
            career_id = 'web-dev'
        elif 'data' in goal_lower:
            career_id = 'data-analyst'
        elif 'cloud' in goal_lower or 'devops' in goal_lower:
            career_id = 'cloud-devops'
        else:
            career_id = 'python-dev'

    if career_id:
        career_id = str(career_id).strip()
        career_row = query_db("SELECT id FROM careers WHERE id = ?;", (career_id,), one=True)
        if not career_row:
            return None, f"Invalid career track '{career_id}'. Must be one of: python-dev, web-dev, data-analyst, cloud-devops."

    # Validate weeklyHours if provided
    hours_val = None
    if 'weeklyHours' in data and data['weeklyHours'] is not None:
        try:
            hours_val = int(data['weeklyHours'])
            if not (1 <= hours_val <= 80):
                return None, "weeklyHours must be between 1 and 80."
        except (ValueError, TypeError):
            return None, "weeklyHours must be an integer between 1 and 80."
    elif 'weekly_hours' in data and data['weekly_hours'] is not None:
        try:
            hours_val = int(data['weekly_hours'])
            if not (1 <= hours_val <= 80):
                return None, "weekly_hours must be between 1 and 80."
        except (ValueError, TypeError):
            return None, "weekly_hours must be an integer between 1 and 80."

    # Validate and normalize skills if provided (supporting both strings and dictionaries)
    validated_skills = []
    if 'skills' in data and data['skills'] is not None:
        if not isinstance(data['skills'], list):
            return None, "'skills' must be a list of skill names or skill objects."

        proficiencies = data.get('skillProficiencies')
        if proficiencies is not None and not isinstance(proficiencies, dict):
            return None, "'skillProficiencies' must be an object mapping skill names to integers."
        proficiencies = proficiencies or {}

        seen_names = {}
        for idx, skill in enumerate(data['skills']):
            if isinstance(skill, str):
                skill_name = skill.strip()
                raw_prof = proficiencies.get(skill_name, 70)
            elif isinstance(skill, dict):
                raw_name = skill.get('name')
                if not raw_name or not str(raw_name).strip():
                    return None, f"Skill at index {idx} is missing a valid 'name'."
                skill_name = str(raw_name).strip()
                raw_prof = skill.get('proficiency')
                if raw_prof is None:
                    raw_prof = proficiencies.get(skill_name, 70)
            else:
                return None, f"Skill at index {idx} has invalid type '{type(skill).__name__}'. Expected string or dictionary."

            if not skill_name or len(skill_name) > 100:
                return None, f"Skill name '{skill_name}' must be between 1 and 100 characters."

            try:
                prof_int = int(raw_prof)
                if not (0 <= prof_int <= 100):
                    return None, f"Proficiency for '{skill_name}' must be an integer between 0 and 100."
            except (ValueError, TypeError):
                return None, f"Invalid proficiency value '{raw_prof}' for skill '{skill_name}'."

            # Case-insensitive deduplication, keeping latest specification
            seen_names[skill_name.lower()] = (skill_name, prof_int)

        validated_skills = list(seen_names.values())

    try:
        with get_db() as conn:
            cursor = conn.cursor()

            # 1. Update user display name if provided
            if 'name' in data and data['name']:
                name_str = str(data['name']).strip()
                if not name_str:
                    return None, "User name cannot be empty."
                cursor.execute("UPDATE users SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;", (name_str, user_id))

            # Ensure student_profile record exists
            cursor.execute("SELECT id FROM student_profiles WHERE user_id = ?;", (user_id,))
            if not cursor.fetchone():
                cursor.execute(
                    """
                    INSERT INTO student_profiles (user_id, college, degree, branch, academic_year, career_id, weekly_hours, interests)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?);
                    """,
                    (user_id, 'Engineering College', 'B.Tech', 'Computer Science & Engineering', '3rd Year', 'python-dev', 12, '')
                )

            # 2. Update student profile fields
            profile_fields = {}
            if 'college' in data and data['college'] is not None:
                profile_fields['college'] = str(data['college']).strip()
            if 'degree' in data and data['degree'] is not None:
                profile_fields['degree'] = str(data['degree']).strip()
            if 'branch' in data and data['branch'] is not None:
                profile_fields['branch'] = str(data['branch']).strip()
            if 'academicYear' in data and data['academicYear'] is not None:
                profile_fields['academic_year'] = str(data['academicYear']).strip()
            elif 'academic_year' in data and data['academic_year'] is not None:
                profile_fields['academic_year'] = str(data['academic_year']).strip()

            if career_id:
                profile_fields['career_id'] = career_id

            if hours_val is not None:
                profile_fields['weekly_hours'] = hours_val

            if 'interests' in data and data['interests'] is not None:
                if isinstance(data['interests'], list):
                    profile_fields['interests'] = ', '.join([str(i).strip() for i in data['interests'] if str(i).strip()])
                else:
                    profile_fields['interests'] = str(data['interests']).strip()

            if profile_fields:
                set_clause = ", ".join([f"{k} = ?" for k in profile_fields.keys()])
                values = list(profile_fields.values()) + [user_id]
                cursor.execute(f"UPDATE student_profiles SET {set_clause}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?;", values)

            # 3. Synchronize skills if provided
            if 'skills' in data and data['skills'] is not None:
                cursor.execute("DELETE FROM user_skills WHERE user_id = ?;", (user_id,))
                for s_name, s_prof in validated_skills:
                    # Register into skills catalog if new custom skill
                    cursor.execute(
                        "INSERT OR IGNORE INTO skills (name, category, description) VALUES (?, 'Custom', 'User-defined skill');",
                        (s_name,)
                    )
                    cursor.execute(
                        "INSERT OR REPLACE INTO user_skills (user_id, skill_name, proficiency, status) VALUES (?, ?, ?, 'active');",
                        (user_id, s_name, s_prof)
                    )

        return get_user_full_profile(user_id), None
    except Exception as e:
        return None, f"Database error updating profile: {str(e)}"

def toggle_user_task(user_id, task_id):
    """
    Toggle roadmap milestone task completion for a specific user.
    Verifies that the task exists in the catalog and updates task progress.
    Returns (result_dict, error_message).
    """
    # Verify task exists
    task = query_db("SELECT id, milestone_id, task_text FROM roadmap_tasks WHERE id = ?;", (task_id,), one=True)
    if not task:
        return None, f"Task with ID '{task_id}' does not exist in roadmap catalog"

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT completed FROM user_task_progress WHERE user_id = ? AND task_id = ?;", (user_id, task_id))
        row = cursor.fetchone()

        if row:
            new_status = 0 if row['completed'] == 1 else 1
            cursor.execute(
                "UPDATE user_task_progress SET completed = ?, completed_at = CURRENT_TIMESTAMP WHERE user_id = ? AND task_id = ?;",
                (new_status, user_id, task_id)
            )
        else:
            new_status = 1
            cursor.execute(
                "INSERT INTO user_task_progress (user_id, task_id, completed, completed_at) VALUES (?, ?, 1, CURRENT_TIMESTAMP);",
                (user_id, task_id)
            )

        # Count total completed tasks for user
        cursor.execute("SELECT COUNT(*) FROM user_task_progress WHERE user_id = ? AND completed = 1;", (user_id,))
        completed_count = cursor.fetchone()[0]

        return {
            "task_id": task_id,
            "completed": bool(new_status),
            "completed_tasks_count": completed_count
        }, None

def get_user_roadmap_with_progress(user_id, career_id):
    """
    Retrieve roadmap milestones and tasks for career_id with user's completion status.
    """
    milestones = query_db(
        "SELECT id, career_id, week_number, title, estimated_hours, topics, project_title FROM roadmap_milestones WHERE career_id = ? ORDER BY week_number ASC;",
        (career_id,)
    )
    if not milestones:
        return None

    user_progress_rows = query_db(
        "SELECT task_id, completed FROM user_task_progress WHERE user_id = ?;",
        (user_id,)
    )
    completed_task_set = {r['task_id'] for r in user_progress_rows if r['completed'] == 1}

    result = []
    total_tasks = 0
    completed_tasks = 0

    for m in milestones:
        m_dict = dict(m)
        tasks = query_db(
            "SELECT id, task_text as text, sort_order FROM roadmap_tasks WHERE milestone_id = ? ORDER BY sort_order ASC;",
            (m_dict['id'],)
        )
        tasks_list = []
        for t in tasks:
            total_tasks += 1
            is_done = t['id'] in completed_task_set
            if is_done:
                completed_tasks += 1
            tasks_list.append({
                "id": t['id'],
                "text": t['text'],
                "sort_order": t['sort_order'],
                "completed": is_done
            })

        m_dict['tasks'] = tasks_list
        # Determine week status
        week_completed = sum(1 for t in tasks_list if t['completed'])
        if len(tasks_list) > 0 and week_completed == len(tasks_list):
            m_dict['status'] = 'completed'
        elif week_completed > 0:
            m_dict['status'] = 'in-progress'
        else:
            m_dict['status'] = 'pending'

        result.append(m_dict)

    pct = round((completed_tasks / total_tasks * 100)) if total_tasks > 0 else 0

    return {
        "career_id": career_id,
        "milestones": result,
        "total_weeks": len(result),
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "completion_percentage": pct
    }

def calculate_skill_gap(user_id, career_id):
    """
    Perform deterministic skill gap analysis for a student against a target career track.
    Compares verified user skills against weighted prerequisites from SQLite.
    Returns (gap_data_dict, error_message).
    """
    # 1. Verify target career exists
    career = query_db(
        "SELECT id, title, category, level, avg_salary, growth_rate, description FROM careers WHERE id = ?;",
        (career_id,),
        one=True
    )
    if not career:
        return None, f"Target career track '{career_id}' was not found in catalog"

    # 2. Retrieve student profile and verified skills
    user_full = get_user_full_profile(user_id)
    if not user_full:
        return None, f"Student user ID {user_id} does not exist"

    student_skills = user_full.get('profile', {}).get('skills', [])
    student_proficiencies = user_full.get('profile', {}).get('skillProficiencies', {})

    # 3. Retrieve weighted required skills for this career
    req_skills = query_db(
        "SELECT skill_name as name, importance, weight, benchmark_proficiency FROM career_required_skills WHERE career_id = ? ORDER BY weight DESC;",
        (career_id,)
    )

    total_weight = 0
    earned_weight = 0
    matched = []
    improving = []
    missing = []

    for req in req_skills:
        req_name = req['name']
        importance = req['importance']
        weight = req['weight']
        benchmark = req['benchmark_proficiency'] or 80
        total_weight += weight

        # Case-insensitive substring and normalization matching
        norm_req = req_name.lower().strip()
        matched_user_skill = None
        for s in student_skills:
            norm_s = s.lower().strip()
            if norm_s == norm_req or norm_s in norm_req or norm_req in norm_s:
                matched_user_skill = s
                break

        if matched_user_skill:
            user_prof = student_proficiencies.get(matched_user_skill, 60)
            try:
                user_prof = max(0, min(100, int(user_prof)))
            except (ValueError, TypeError):
                user_prof = 60

            factor = user_prof / 100.0
            earned_weight += weight * factor

            if user_prof >= 75:
                matched.append({
                    "name": req_name,
                    "importance": importance,
                    "weight": weight,
                    "user_proficiency": user_prof,
                    "benchmark_proficiency": benchmark,
                    "status": "Mastered"
                })
            else:
                improving.append({
                    "name": req_name,
                    "importance": importance,
                    "weight": weight,
                    "user_proficiency": user_prof,
                    "benchmark_proficiency": benchmark,
                    "gap": max(0, benchmark - user_prof),
                    "status": "Needs Polish"
                })
        else:
            missing.append({
                "name": req_name,
                "importance": importance,
                "weight": weight,
                "benchmark_proficiency": benchmark,
                "status": "Missing"
            })

    readiness_percentage = round((earned_weight / total_weight) * 100) if total_weight > 0 else 0

    # Prioritize gaps in order of hiring criticality
    prioritized_gaps = []
    prioritized_gaps.extend([m for m in missing if m['importance'] == 'Critical'])
    prioritized_gaps.extend([i for i in improving if i['importance'] == 'Critical'])
    prioritized_gaps.extend([m for m in missing if m['importance'] == 'High'])
    prioritized_gaps.extend([i for i in improving if i['importance'] == 'High'])
    prioritized_gaps.extend([m for m in missing if m['importance'] not in ('Critical', 'High')])
    prioritized_gaps.extend([i for i in improving if i['importance'] not in ('Critical', 'High')])

    return {
        "career": dict(career),
        "student": {
            "name": user_full['user']['name'],
            "college": user_full['profile'].get('college', 'Engineering College'),
            "degree": user_full['profile'].get('degree', 'B.Tech'),
            "branch": user_full['profile'].get('branch', 'Computer Science & Engineering'),
            "academic_year": user_full['profile'].get('academic_year', '3rd Year'),
            "weekly_hours": user_full['profile'].get('weekly_hours', 12),
            "interests": user_full['profile'].get('interests', '')
        },
        "readiness_percentage": readiness_percentage,
        "matched_skills": matched,
        "improving_skills": improving,
        "missing_skills": missing,
        "prioritized_gaps": prioritized_gaps,
        "total_required": len(req_skills),
        "acquired_count": len(matched) + len(improving)
    }, None

# ==============================================================================
# Recommended Projects & Synced Study Plans Persistence
# ==============================================================================

def add_user_recommended_project(user_id, career_id, title, description=None, skills_targeted=None, duration=None, difficulty=None, portfolio_impact=None):
    """
    Persist an AI recommended project for a user and career track.
    Enforces uniqueness on (user_id, career_id, title) to prevent duplicates.
    """
    if not title or not str(title).strip():
        return None, "Project title is required."

    career = query_db("SELECT id FROM careers WHERE id = ?;", (career_id,), one=True)
    if not career:
        return None, f"Career track '{career_id}' is invalid."

    skills_json = json.dumps(skills_targeted) if isinstance(skills_targeted, list) else str(skills_targeted or '[]')
    title_clean = str(title).strip()

    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO user_recommended_projects 
                (user_id, career_id, title, description, skills_targeted, duration, difficulty, portfolio_impact)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?);
            """, (
                user_id,
                career_id,
                title_clean,
                str(description or '').strip(),
                skills_json,
                str(duration or '2 Weeks').strip(),
                str(difficulty or 'Intermediate').strip(),
                str(portfolio_impact or '').strip()
            ))
            new_id = cursor.lastrowid
            return {
                "id": new_id,
                "user_id": user_id,
                "career_id": career_id,
                "title": title_clean,
                "description": description,
                "skills_targeted": json.loads(skills_json),
                "duration": duration,
                "difficulty": difficulty,
                "portfolio_impact": portfolio_impact,
                "message": "Project added to your roadmap successfully!"
            }, None
    except sqlite3.IntegrityError as e:
        err_str = str(e).lower()
        if "unique" in err_str:
            return None, "This project has already been added to your roadmap."
        return None, f"Database integrity error: {str(e)}"
    except Exception as e:
        return None, f"Failed to save project: {str(e)}"

def get_user_recommended_projects(user_id, career_id=None):
    """
    Retrieve saved AI recommended projects for a user, optionally filtered by career_id.
    """
    if career_id:
        rows = query_db("""
            SELECT id, user_id, career_id, title, description, skills_targeted, duration, difficulty, portfolio_impact, created_at
            FROM user_recommended_projects
            WHERE user_id = ? AND career_id = ?
            ORDER BY id ASC;
        """, (user_id, career_id))
    else:
        rows = query_db("""
            SELECT id, user_id, career_id, title, description, skills_targeted, duration, difficulty, portfolio_impact, created_at
            FROM user_recommended_projects
            WHERE user_id = ?
            ORDER BY id ASC;
        """, (user_id,))

    projects = []
    for r in rows:
        skills = []
        try:
            skills = json.loads(r['skills_targeted']) if r['skills_targeted'] else []
        except Exception:
            skills = [r['skills_targeted']] if r['skills_targeted'] else []

        projects.append({
            "id": r['id'],
            "user_id": r['user_id'],
            "career_id": r['career_id'],
            "title": r['title'],
            "description": r['description'],
            "skills_targeted": skills,
            "duration": r['duration'],
            "difficulty": r['difficulty'],
            "portfolio_impact": r['portfolio_impact'],
            "created_at": r['created_at']
        })
    return projects

def delete_user_recommended_project(user_id, project_id):
    """
    Delete a saved recommended project for the authenticated user (strict user isolation).
    """
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM user_recommended_projects WHERE id = ? AND user_id = ?;", (project_id, user_id))
        deleted = cursor.rowcount
        return deleted > 0

def save_user_study_plan(user_id, career_id, plan_data, weekly_hours=12):
    """
    Synchronize an adaptive weekly study plan for a user and career track.
    Updates the existing plan if one exists (ON CONFLICT REPLACE/UPDATE).
    """
    career = query_db("SELECT id FROM careers WHERE id = ?;", (career_id,), one=True)
    if not career:
        return None, f"Career track '{career_id}' is invalid."

    if not plan_data or not isinstance(plan_data, list):
        return None, "Study plan data must be a non-empty list of schedule items."

    try:
        hours = int(weekly_hours) if weekly_hours else 12
        hours = max(1, min(80, hours))
    except (ValueError, TypeError):
        hours = 12

    plan_json = json.dumps(plan_data)

    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO user_study_plans (user_id, career_id, plan_data, weekly_hours, synced_at)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(user_id, career_id) DO UPDATE SET
                    plan_data = excluded.plan_data,
                    weekly_hours = excluded.weekly_hours,
                    synced_at = CURRENT_TIMESTAMP;
            """, (user_id, career_id, plan_json, hours))
            return {
                "success": True,
                "career_id": career_id,
                "weekly_hours": hours,
                "study_plan": plan_data,
                "message": "Adaptive study plan synchronized with your roadmap successfully!"
            }, None
    except Exception as e:
        return None, f"Failed to synchronize study plan: {str(e)}"

def get_user_study_plan(user_id, career_id):
    """
    Retrieve the current synchronized weekly study plan for a user and career track.
    """
    row = query_db("""
        SELECT id, user_id, career_id, plan_data, weekly_hours, synced_at
        FROM user_study_plans
        WHERE user_id = ? AND career_id = ?;
    """, (user_id, career_id), one=True)

    if not row:
        return None

    parsed_plan = []
    try:
        parsed_plan = json.loads(row['plan_data']) if row['plan_data'] else []
    except Exception:
        parsed_plan = []

    return {
        "id": row['id'],
        "user_id": row['user_id'],
        "career_id": row['career_id'],
        "weekly_hours": row['weekly_hours'],
        "study_plan": parsed_plan,
        "synced_at": row['synced_at']
    }

if __name__ == '__main__':
    print(f"Initializing database at {DB_FILE}...")
    init_db(seed=True)
    health = check_db_health()
    print("Database initialization complete:")
    print(health)

