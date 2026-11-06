/**
 * SkillSpring - Centralized State & Demo Data Store
 * Provides persistent demo storage, calculation of skill match scores,
 * career catalogs, roadmaps, and event notifications.
 */

(function () {
  'use strict';

  // Default Career Catalog
  const CAREERS_CATALOG = [
      {
          "id": "python-dev",
          "title": "Python Developer",
          "category": "Software Engineering",
          "level": "Entry - Mid Level",
          "matchScore": 78,
          "avgSalary": "Not yet verified for India",
          "growthRate": "Market data pending",
          "description": "Design, develop, and deploy scalable backend services, APIs, and automation scripts using Python, modern web frameworks, and relational databases.",
          "requiredSkills": [
              {
                  "name": "Python",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "REST APIs",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "SQL Basics",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "Git & GitHub",
                  "importance": "Core",
                  "weight": 10
              },
              {
                  "name": "Data Structures",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "FastAPI / Django",
                  "importance": "Critical",
                  "weight": 15
              },
              {
                  "name": "Docker",
                  "importance": "Medium",
                  "weight": 5
              },
              {
                  "name": "PostgreSQL",
                  "importance": "Medium",
                  "weight": 5
              }
          ],
          "suitableBranches": [
              "Computer Science",
              "Information Technology",
              "Electronics"
          ],
          "topTools": [
              "FastAPI",
              "Django",
              "PostgreSQL",
              "Docker",
              "PyTest",
              "Postman"
          ]
      },
      {
          "id": "web-dev",
          "title": "Web Developer (Full Stack)",
          "category": "Web Development",
          "level": "Entry - Mid Level",
          "matchScore": 62,
          "avgSalary": "Not yet verified for India",
          "growthRate": "Market data pending",
          "description": "Build interactive, responsive web applications across the client and server stack using contemporary JavaScript frameworks, CSS architectures, and Node.js.",
          "requiredSkills": [
              {
                  "name": "HTML5 & CSS3",
                  "importance": "Core",
                  "weight": 15
              },
              {
                  "name": "JavaScript",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "Git & GitHub",
                  "importance": "Core",
                  "weight": 10
              },
              {
                  "name": "REST APIs",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "React",
                  "importance": "Critical",
                  "weight": 15
              },
              {
                  "name": "Node.js",
                  "importance": "High",
                  "weight": 10
              },
              {
                  "name": "SQL Basics",
                  "importance": "Medium",
                  "weight": 10
              },
              {
                  "name": "TypeScript",
                  "importance": "Medium",
                  "weight": 5
              }
          ],
          "suitableBranches": [
              "Computer Science",
              "Information Technology",
              "Any Engineering"
          ],
          "topTools": [
              "React",
              "Node.js",
              "Tailwind CSS",
              "TypeScript",
              "Next.js",
              "Vite"
          ]
      },
      {
          "id": "data-analyst",
          "title": "Data Analyst",
          "category": "Data & Analytics",
          "level": "Entry Level",
          "matchScore": 54,
          "avgSalary": "Not yet verified for India",
          "growthRate": "Market data pending",
          "description": "Transform raw data into meaningful business insights through statistical exploration, interactive dashboards, SQL modeling, and predictive reporting.",
          "requiredSkills": [
              {
                  "name": "Python",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "SQL Basics",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "Advanced SQL",
                  "importance": "Critical",
                  "weight": 15
              },
              {
                  "name": "Pandas & NumPy",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "PowerBI / Tableau",
                  "importance": "Critical",
                  "weight": 15
              },
              {
                  "name": "Statistics & Probability",
                  "importance": "Core",
                  "weight": 10
              },
              {
                  "name": "Data Visualization",
                  "importance": "Medium",
                  "weight": 10
              }
          ],
          "suitableBranches": [
              "Computer Science",
              "Data Science",
              "Mathematics",
              "Economics"
          ],
          "topTools": [
              "SQL",
              "Pandas",
              "PowerBI",
              "Tableau",
              "Jupyter",
              "Excel"
          ]
      },
      {
          "id": "cloud-devops",
          "title": "Cloud & DevOps Engineer",
          "category": "Infrastructure & Cloud",
          "level": "Junior - Associate",
          "matchScore": 41,
          "avgSalary": "Not yet verified for India",
          "growthRate": "Market data pending",
          "description": "Automate build, deployment, and infrastructure provisioning pipelines on AWS or GCP using containers, CI/CD, and Infrastructure as Code.",
          "requiredSkills": [
              {
                  "name": "Linux Basics",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "Git & GitHub",
                  "importance": "Core",
                  "weight": 10
              },
              {
                  "name": "Docker",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "AWS / Cloud Fundamentals",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "CI/CD Pipelines (GitHub Actions)",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "Python",
                  "importance": "Medium",
                  "weight": 15
              }
          ],
          "suitableBranches": [
              "Computer Science",
              "Information Technology",
              "Telecommunication"
          ],
          "topTools": [
              "Docker",
              "AWS",
              "GitHub Actions",
              "Terraform",
              "Linux",
              "Kubernetes"
          ]
      },
      {
          "id": "java-dev",
          "title": "Java Developer",
          "category": "Software Engineering",
          "level": "Entry - Mid Level",
          "matchScore": null,
          "avgSalary": "Not yet verified for India",
          "growthRate": "Market data pending",
          "description": "Develop Java applications and backend services using object-oriented design, modern Java frameworks, databases and testing.",
          "requiredSkills": [
              {
                  "name": "Java",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "OOP",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "Spring Boot",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "REST APIs",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "SQL Basics",
                  "importance": "Core",
                  "weight": 15
              },
              {
                  "name": "Git & GitHub",
                  "importance": "Core",
                  "weight": 15
              }
          ],
          "suitableBranches": [
              "Computer Science",
              "Information Technology",
              "Electronics"
          ],
          "topTools": [
              "Java",
              "Spring Boot",
              "Maven",
              "PostgreSQL"
          ]
      },
      {
          "id": "backend-dev",
          "title": "Backend Developer",
          "category": "Software Engineering",
          "level": "Entry - Mid Level",
          "matchScore": null,
          "avgSalary": "Not yet verified for India",
          "growthRate": "Market data pending",
          "description": "Build secure and scalable server-side applications, APIs, data models and integrations.",
          "requiredSkills": [
              {
                  "name": "Python",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "Node.js",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "REST APIs",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "SQL Basics",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "Authentication & Authorization",
                  "importance": "Core",
                  "weight": 15
              },
              {
                  "name": "Git & GitHub",
                  "importance": "Core",
                  "weight": 15
              }
          ],
          "suitableBranches": [
              "Computer Science",
              "Information Technology",
              "Electronics"
          ],
          "topTools": [
              "Node.js",
              "FastAPI",
              "Django",
              "PostgreSQL"
          ]
      },
      {
          "id": "frontend-dev",
          "title": "Frontend Developer",
          "category": "Web Development",
          "level": "Entry - Mid Level",
          "matchScore": null,
          "avgSalary": "Not yet verified for India",
          "growthRate": "Market data pending",
          "description": "Create accessible, responsive user interfaces using modern JavaScript frameworks and web technologies.",
          "requiredSkills": [
              {
                  "name": "HTML5 & CSS3",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "JavaScript",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "React",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "TypeScript",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "Responsive Web Design",
                  "importance": "Core",
                  "weight": 15
              },
              {
                  "name": "Git & GitHub",
                  "importance": "Core",
                  "weight": 15
              }
          ],
          "suitableBranches": [
              "Computer Science",
              "Information Technology",
              "Electronics"
          ],
          "topTools": [
              "React",
              "TypeScript",
              "Vite",
              "Tailwind CSS"
          ]
      },
      {
          "id": "android-dev",
          "title": "Android Developer",
          "category": "Software Engineering",
          "level": "Entry - Mid Level",
          "matchScore": null,
          "avgSalary": "Not yet verified for India",
          "growthRate": "Market data pending",
          "description": "Develop Android applications with modern mobile development practices, APIs and persistent storage.",
          "requiredSkills": [
              {
                  "name": "Kotlin",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "Java",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "Android SDK",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "Jetpack Compose",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "REST APIs",
                  "importance": "Core",
                  "weight": 15
              },
              {
                  "name": "Git & GitHub",
                  "importance": "Core",
                  "weight": 15
              }
          ],
          "suitableBranches": [
              "Computer Science",
              "Information Technology",
              "Electronics"
          ],
          "topTools": [
              "Android Studio",
              "Kotlin",
              "Jetpack Compose",
              "Firebase"
          ]
      },
      {
          "id": "ai-ml-engineer",
          "title": "AI/ML Engineer",
          "category": "AI & Data Science",
          "level": "Entry - Mid Level",
          "matchScore": null,
          "avgSalary": "Not yet verified for India",
          "growthRate": "Market data pending",
          "description": "Develop and evaluate machine learning systems, data pipelines and deployable model services.",
          "requiredSkills": [
              {
                  "name": "Python",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "Machine Learning",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "Statistics & Probability",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "Pandas & NumPy",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "Deep Learning",
                  "importance": "Core",
                  "weight": 15
              },
              {
                  "name": "Model Evaluation",
                  "importance": "Core",
                  "weight": 15
              }
          ],
          "suitableBranches": [
              "Computer Science",
              "Information Technology",
              "Electronics"
          ],
          "topTools": [
              "Python",
              "Scikit-learn",
              "TensorFlow",
              "PyTorch"
          ]
      },
      {
          "id": "data-scientist",
          "title": "Data Scientist",
          "category": "AI & Data Science",
          "level": "Entry - Mid Level",
          "matchScore": null,
          "avgSalary": "Not yet verified for India",
          "growthRate": "Market data pending",
          "description": "Explore datasets, build statistical and machine learning models, and communicate evidence-based findings.",
          "requiredSkills": [
              {
                  "name": "Python",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "Statistics & Probability",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "SQL Basics",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "Pandas & NumPy",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "Machine Learning",
                  "importance": "Core",
                  "weight": 15
              },
              {
                  "name": "Data Visualization",
                  "importance": "Core",
                  "weight": 15
              }
          ],
          "suitableBranches": [
              "Computer Science",
              "Information Technology",
              "Electronics"
          ],
          "topTools": [
              "Python",
              "Jupyter",
              "Scikit-learn",
              "PowerBI"
          ]
      },
      {
          "id": "data-engineer",
          "title": "Data Engineer",
          "category": "AI & Data Science",
          "level": "Entry - Mid Level",
          "matchScore": null,
          "avgSalary": "Not yet verified for India",
          "growthRate": "Market data pending",
          "description": "Build reliable data pipelines, transformations and storage systems for analytics and applications.",
          "requiredSkills": [
              {
                  "name": "Python",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "SQL Basics",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "Advanced SQL",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "ETL & Data Pipelines",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "Apache Spark",
                  "importance": "Core",
                  "weight": 15
              },
              {
                  "name": "Data Warehousing",
                  "importance": "Core",
                  "weight": 15
              }
          ],
          "suitableBranches": [
              "Computer Science",
              "Information Technology",
              "Electronics"
          ],
          "topTools": [
              "Python",
              "Apache Spark",
              "Airflow",
              "PostgreSQL"
          ]
      },
      {
          "id": "bi-developer",
          "title": "BI Developer",
          "category": "Data & Analytics",
          "level": "Entry - Mid Level",
          "matchScore": null,
          "avgSalary": "Not yet verified for India",
          "growthRate": "Market data pending",
          "description": "Design business intelligence data models, reports and dashboards for decision support.",
          "requiredSkills": [
              {
                  "name": "SQL Basics",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "Advanced SQL",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "PowerBI / Tableau",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "Data Modeling",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "Data Visualization",
                  "importance": "Core",
                  "weight": 15
              },
              {
                  "name": "Excel",
                  "importance": "Core",
                  "weight": 15
              }
          ],
          "suitableBranches": [
              "Computer Science",
              "Information Technology",
              "Electronics"
          ],
          "topTools": [
              "PowerBI",
              "Tableau",
              "SQL",
              "Excel"
          ]
      },
      {
          "id": "it-business-analyst",
          "title": "IT Business Analyst",
          "category": "Data & Analytics",
          "level": "Entry - Mid Level",
          "matchScore": null,
          "avgSalary": "Not yet verified for India",
          "growthRate": "Market data pending",
          "description": "Translate business needs into documented requirements, process models and software delivery outcomes.",
          "requiredSkills": [
              {
                  "name": "Requirements Analysis",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "SQL Basics",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "Excel",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "Data Visualization",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "Agile & Scrum",
                  "importance": "Core",
                  "weight": 15
              },
              {
                  "name": "Communication",
                  "importance": "Core",
                  "weight": 15
              }
          ],
          "suitableBranches": [
              "Computer Science",
              "Information Technology",
              "Electronics"
          ],
          "topTools": [
              "Jira",
              "Confluence",
              "Excel",
              "PowerBI"
          ]
      },
      {
          "id": "cybersecurity-analyst",
          "title": "Cybersecurity Analyst",
          "category": "Cybersecurity",
          "level": "Entry - Mid Level",
          "matchScore": null,
          "avgSalary": "Not yet verified for India",
          "growthRate": "Market data pending",
          "description": "Assess security alerts, investigate risks and help protect systems, applications and information.",
          "requiredSkills": [
              {
                  "name": "Networking Fundamentals",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "Linux Basics",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "Security Fundamentals",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "SIEM Tools",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "Python",
                  "importance": "Core",
                  "weight": 15
              },
              {
                  "name": "Incident Response",
                  "importance": "Core",
                  "weight": 15
              }
          ],
          "suitableBranches": [
              "Computer Science",
              "Information Technology",
              "Electronics"
          ],
          "topTools": [
              "Linux",
              "Wireshark",
              "Splunk",
              "Python"
          ]
      },
      {
          "id": "soc-analyst",
          "title": "SOC Analyst",
          "category": "Cybersecurity",
          "level": "Entry - Mid Level",
          "matchScore": null,
          "avgSalary": "Not yet verified for India",
          "growthRate": "Market data pending",
          "description": "Monitor security events, triage alerts and support incident investigation in a security operations team.",
          "requiredSkills": [
              {
                  "name": "Networking Fundamentals",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "Linux Basics",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "SIEM Tools",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "Log Analysis",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "Incident Response",
                  "importance": "Core",
                  "weight": 15
              },
              {
                  "name": "Security Fundamentals",
                  "importance": "Core",
                  "weight": 15
              }
          ],
          "suitableBranches": [
              "Computer Science",
              "Information Technology",
              "Electronics"
          ],
          "topTools": [
              "Splunk",
              "Microsoft Sentinel",
              "Wireshark",
              "Linux"
          ]
      },
      {
          "id": "security-engineer",
          "title": "Security Engineer",
          "category": "Cybersecurity",
          "level": "Entry - Mid Level",
          "matchScore": null,
          "avgSalary": "Not yet verified for India",
          "growthRate": "Market data pending",
          "description": "Design and improve application, infrastructure and cloud security controls and automation.",
          "requiredSkills": [
              {
                  "name": "Security Fundamentals",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "Networking Fundamentals",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "Linux Basics",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "Python",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "Cloud Security",
                  "importance": "Core",
                  "weight": 15
              },
              {
                  "name": "Secure Coding",
                  "importance": "Core",
                  "weight": 15
              }
          ],
          "suitableBranches": [
              "Computer Science",
              "Information Technology",
              "Electronics"
          ],
          "topTools": [
              "AWS Security",
              "Linux",
              "Python",
              "Burp Suite"
          ]
      },
      {
          "id": "qa-engineer",
          "title": "QA Engineer",
          "category": "Software Engineering",
          "level": "Entry - Mid Level",
          "matchScore": null,
          "avgSalary": "Not yet verified for India",
          "growthRate": "Market data pending",
          "description": "Validate software quality through test planning, manual testing, defect reporting and API checks.",
          "requiredSkills": [
              {
                  "name": "Software Testing",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "Test Case Design",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "Bug Tracking",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "SQL Basics",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "API Testing",
                  "importance": "Core",
                  "weight": 15
              },
              {
                  "name": "Agile & Scrum",
                  "importance": "Core",
                  "weight": 15
              }
          ],
          "suitableBranches": [
              "Computer Science",
              "Information Technology",
              "Electronics"
          ],
          "topTools": [
              "Jira",
              "Postman",
              "TestRail",
              "SQL"
          ]
      },
      {
          "id": "qa-automation",
          "title": "QA Automation Engineer",
          "category": "Software Engineering",
          "level": "Entry - Mid Level",
          "matchScore": null,
          "avgSalary": "Not yet verified for India",
          "growthRate": "Market data pending",
          "description": "Build automated test suites and quality pipelines for web applications and APIs.",
          "requiredSkills": [
              {
                  "name": "JavaScript",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "Python",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "Software Testing",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "Automation Testing",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "API Testing",
                  "importance": "Core",
                  "weight": 15
              },
              {
                  "name": "Git & GitHub",
                  "importance": "Core",
                  "weight": 15
              }
          ],
          "suitableBranches": [
              "Computer Science",
              "Information Technology",
              "Electronics"
          ],
          "topTools": [
              "Playwright",
              "Selenium",
              "PyTest",
              "Postman"
          ]
      },
      {
          "id": "database-admin",
          "title": "Database Administrator",
          "category": "Software Engineering",
          "level": "Entry - Mid Level",
          "matchScore": null,
          "avgSalary": "Not yet verified for India",
          "growthRate": "Market data pending",
          "description": "Maintain database reliability, access controls, backups, performance and recovery procedures.",
          "requiredSkills": [
              {
                  "name": "SQL Basics",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "Advanced SQL",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "PostgreSQL",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "Database Administration",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "Linux Basics",
                  "importance": "Core",
                  "weight": 15
              },
              {
                  "name": "Database Security",
                  "importance": "Core",
                  "weight": 15
              }
          ],
          "suitableBranches": [
              "Computer Science",
              "Information Technology",
              "Electronics"
          ],
          "topTools": [
              "PostgreSQL",
              "MySQL",
              "pgAdmin",
              "Linux"
          ]
      },
      {
          "id": "network-engineer",
          "title": "Network Engineer",
          "category": "Infrastructure & Cloud",
          "level": "Entry - Mid Level",
          "matchScore": null,
          "avgSalary": "Not yet verified for India",
          "growthRate": "Market data pending",
          "description": "Configure, monitor and troubleshoot enterprise networks and connectivity infrastructure.",
          "requiredSkills": [
              {
                  "name": "Networking Fundamentals",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "TCP/IP",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "Routing & Switching",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "Linux Basics",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "Network Security",
                  "importance": "Core",
                  "weight": 15
              },
              {
                  "name": "Network Troubleshooting",
                  "importance": "Core",
                  "weight": 15
              }
          ],
          "suitableBranches": [
              "Computer Science",
              "Information Technology",
              "Electronics"
          ],
          "topTools": [
              "Cisco Packet Tracer",
              "Wireshark",
              "Linux",
              "Cisco IOS"
          ]
      },
      {
          "id": "cloud-engineer",
          "title": "Cloud Engineer",
          "category": "Infrastructure & Cloud",
          "level": "Entry - Mid Level",
          "matchScore": null,
          "avgSalary": "Not yet verified for India",
          "growthRate": "Market data pending",
          "description": "Provision and maintain cloud infrastructure, services, identity controls and deployment environments.",
          "requiredSkills": [
              {
                  "name": "AWS / Cloud Fundamentals",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "Linux Basics",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "Networking Fundamentals",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "Docker",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "Terraform",
                  "importance": "Core",
                  "weight": 15
              },
              {
                  "name": "Python",
                  "importance": "Core",
                  "weight": 15
              }
          ],
          "suitableBranches": [
              "Computer Science",
              "Information Technology",
              "Electronics"
          ],
          "topTools": [
              "AWS",
              "Azure",
              "Terraform",
              "Docker"
          ]
      },
      {
          "id": "sre",
          "title": "Site Reliability Engineer",
          "category": "Infrastructure & Cloud",
          "level": "Entry - Mid Level",
          "matchScore": null,
          "avgSalary": "Not yet verified for India",
          "growthRate": "Market data pending",
          "description": "Improve service reliability through monitoring, automation, incident response and scalable infrastructure.",
          "requiredSkills": [
              {
                  "name": "Linux Basics",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "Python",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "Docker",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "Kubernetes",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "CI/CD Pipelines (GitHub Actions)",
                  "importance": "Core",
                  "weight": 15
              },
              {
                  "name": "Monitoring & Observability",
                  "importance": "Core",
                  "weight": 15
              }
          ],
          "suitableBranches": [
              "Computer Science",
              "Information Technology",
              "Electronics"
          ],
          "topTools": [
              "Kubernetes",
              "Prometheus",
              "Grafana",
              "Terraform"
          ]
      },
      {
          "id": "platform-engineer",
          "title": "Platform Engineer",
          "category": "Infrastructure & Cloud",
          "level": "Entry - Mid Level",
          "matchScore": null,
          "avgSalary": "Not yet verified for India",
          "growthRate": "Market data pending",
          "description": "Build internal developer platforms, reusable infrastructure and self-service deployment workflows.",
          "requiredSkills": [
              {
                  "name": "Linux Basics",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "Docker",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "Kubernetes",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "Terraform",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "CI/CD Pipelines (GitHub Actions)",
                  "importance": "Core",
                  "weight": 15
              },
              {
                  "name": "Python",
                  "importance": "Core",
                  "weight": 15
              }
          ],
          "suitableBranches": [
              "Computer Science",
              "Information Technology",
              "Electronics"
          ],
          "topTools": [
              "Kubernetes",
              "Terraform",
              "Docker",
              "GitHub Actions"
          ]
      },
      {
          "id": "ui-ux-designer",
          "title": "UI/UX Designer",
          "category": "Design & Product",
          "level": "Entry - Mid Level",
          "matchScore": null,
          "avgSalary": "Not yet verified for India",
          "growthRate": "Market data pending",
          "description": "Research user needs and design usable digital experiences through wireframes, prototypes and testing.",
          "requiredSkills": [
              {
                  "name": "UI Design",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "UX Research",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "Wireframing & Prototyping",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "Design Systems",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "Accessibility",
                  "importance": "Core",
                  "weight": 15
              },
              {
                  "name": "Usability Testing",
                  "importance": "Core",
                  "weight": 15
              }
          ],
          "suitableBranches": [
              "Computer Science",
              "Information Technology",
              "Electronics"
          ],
          "topTools": [
              "Figma",
              "FigJam",
              "Adobe XD"
          ]
      },
      {
          "id": "product-designer",
          "title": "Product Designer",
          "category": "Design & Product",
          "level": "Entry - Mid Level",
          "matchScore": null,
          "avgSalary": "Not yet verified for India",
          "growthRate": "Market data pending",
          "description": "Shape end-to-end product experiences by combining user research, interaction design and visual systems.",
          "requiredSkills": [
              {
                  "name": "UI Design",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "UX Research",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "Wireframing & Prototyping",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "Design Systems",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "Accessibility",
                  "importance": "Core",
                  "weight": 15
              },
              {
                  "name": "Product Thinking",
                  "importance": "Core",
                  "weight": 15
              }
          ],
          "suitableBranches": [
              "Computer Science",
              "Information Technology",
              "Electronics"
          ],
          "topTools": [
              "Figma",
              "FigJam",
              "Miro"
          ]
      },
      {
          "id": "technical-pm",
          "title": "Technical Product Manager",
          "category": "Design & Product",
          "level": "Entry - Mid Level",
          "matchScore": null,
          "avgSalary": "Not yet verified for India",
          "growthRate": "Market data pending",
          "description": "Coordinate technical product strategy, requirements, prioritization and collaboration across engineering teams.",
          "requiredSkills": [
              {
                  "name": "Product Management",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "Requirements Analysis",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "Agile & Scrum",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "Data Analysis",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "API Fundamentals",
                  "importance": "Core",
                  "weight": 15
              },
              {
                  "name": "Communication",
                  "importance": "Core",
                  "weight": 15
              }
          ],
          "suitableBranches": [
              "Computer Science",
              "Information Technology",
              "Electronics"
          ],
          "topTools": [
              "Jira",
              "Confluence",
              "Figma",
              "SQL"
          ]
      },
      {
          "id": "technical-support",
          "title": "Technical Support Engineer",
          "category": "Software Engineering",
          "level": "Entry - Mid Level",
          "matchScore": null,
          "avgSalary": "Not yet verified for India",
          "growthRate": "Market data pending",
          "description": "Diagnose technical issues, support users and investigate application, operating system and network problems.",
          "requiredSkills": [
              {
                  "name": "Linux Basics",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "Networking Fundamentals",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "SQL Basics",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "Python",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "Troubleshooting",
                  "importance": "Core",
                  "weight": 15
              },
              {
                  "name": "Communication",
                  "importance": "Core",
                  "weight": 15
              }
          ],
          "suitableBranches": [
              "Computer Science",
              "Information Technology",
              "Electronics"
          ],
          "topTools": [
              "Linux",
              "Postman",
              "SQL",
              "Ticketing Systems"
          ]
      },
      {
          "id": "blockchain-dev",
          "title": "Blockchain Developer",
          "category": "Emerging Technology",
          "level": "Entry - Mid Level",
          "matchScore": null,
          "avgSalary": "Not yet verified for India",
          "growthRate": "Market data pending",
          "description": "Build and test blockchain applications, smart contracts and integrations with distributed networks.",
          "requiredSkills": [
              {
                  "name": "JavaScript",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "Solidity",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "Blockchain Fundamentals",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "Smart Contract Development",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "Cryptography Basics",
                  "importance": "Core",
                  "weight": 15
              },
              {
                  "name": "Git & GitHub",
                  "importance": "Core",
                  "weight": 15
              }
          ],
          "suitableBranches": [
              "Computer Science",
              "Information Technology",
              "Electronics"
          ],
          "topTools": [
              "Solidity",
              "Hardhat",
              "Ethereum",
              "MetaMask"
          ]
      },
      {
          "id": "iot-embedded",
          "title": "IoT & Embedded Systems Developer",
          "category": "Emerging Technology",
          "level": "Entry - Mid Level",
          "matchScore": null,
          "avgSalary": "Not yet verified for India",
          "growthRate": "Market data pending",
          "description": "Develop software for connected devices using embedded programming, sensors and communication protocols.",
          "requiredSkills": [
              {
                  "name": "C",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "C++",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "Embedded C",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "Microcontrollers",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "IoT Protocols",
                  "importance": "Core",
                  "weight": 15
              },
              {
                  "name": "Electronics Fundamentals",
                  "importance": "Core",
                  "weight": 15
              }
          ],
          "suitableBranches": [
              "Computer Science",
              "Information Technology",
              "Electronics"
          ],
          "topTools": [
              "Arduino",
              "ESP32",
              "PlatformIO",
              "Raspberry Pi"
          ]
      },
      {
          "id": "genai-dev",
          "title": "Generative AI Application Developer",
          "category": "Emerging Technology",
          "level": "Entry - Mid Level",
          "matchScore": null,
          "avgSalary": "Not yet verified for India",
          "growthRate": "Market data pending",
          "description": "Build applications using language models, retrieval workflows, structured prompts and API integrations.",
          "requiredSkills": [
              {
                  "name": "Python",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "REST APIs",
                  "importance": "Critical",
                  "weight": 20
              },
              {
                  "name": "Prompt Engineering",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "LLM Application Development",
                  "importance": "High",
                  "weight": 15
              },
              {
                  "name": "Vector Databases",
                  "importance": "Core",
                  "weight": 15
              },
              {
                  "name": "Git & GitHub",
                  "importance": "Core",
                  "weight": 15
              }
          ],
          "suitableBranches": [
              "Computer Science",
              "Information Technology",
              "Electronics"
          ],
          "topTools": [
              "Python",
              "Gemini API",
              "LangChain",
              "ChromaDB"
          ]
      }
  ];

  // Default Roadmaps for Careers
  const ROADMAP_DATA = {
    'python-dev': [
      {
        week: 1,
        title: 'Python Core & Advanced Concepts',
        status: 'completed',
        hours: '10 hrs',
        topics: ['OOP Principles in Python', 'Generators, Decorators, Iterators', 'Type Annotations & Virtual Environments'],
        project: 'CLI Task Manager with JSON persistence',
        tasks: [
          { id: 'py-1', text: 'Master Python OOP: Class methods, static methods, and inheritance', completed: true },
          { id: 'py-2', text: 'Understand Python closures, decorators, and custom contexts', completed: true },
          { id: 'py-3', text: 'Build & package a CLI tool with argparse and virtualenv', completed: true }
        ]
      },
      {
        week: 2,
        title: 'Data Structures, Algorithms & Clean Code',
        status: 'completed',
        hours: '12 hrs',
        topics: ['Complexity Analysis (Big O)', 'Hash Maps, Linked Lists, Trees', 'PEP 8, Black, Flake8'],
        project: 'Algorithmic Caching Library with LRU Cache implementation',
        tasks: [
          { id: 'py-4', text: 'Solve 15 LeetCode medium questions using native Python structures', completed: true },
          { id: 'py-5', text: 'Implement an LRU Cache from scratch with Doubly Linked List', completed: true },
          { id: 'py-6', text: 'Set up pre-commit linting with Black and Flake8', completed: true }
        ]
      },
      {
        week: 3,
        title: 'Relational Databases & SQL with PostgreSQL',
        status: 'in-progress',
        hours: '14 hrs',
        topics: ['PostgreSQL Schema Design', 'Complex Joins, Indexes, Transactions', 'psycopg3 and SQLAlchemy ORM basics'],
        project: 'College Course Enrollment Database with relational integrity',
        tasks: [
          { id: 'py-7', text: 'Design 3NF normalized schema for University Course Portal', completed: true },
          { id: 'py-8', text: 'Write queries utilizing JOINs, Window Functions, and GROUP BY', completed: false },
          { id: 'py-9', text: 'Connect Python to Postgres with connection pooling', completed: false }
        ]
      },
      {
        week: 4,
        title: 'REST API Architecture with FastAPI',
        status: 'pending',
        hours: '15 hrs',
        topics: ['HTTP Methods & Status Codes', 'Pydantic Schemas & Request Validation', 'Dependency Injection in FastAPI'],
        project: 'RESTful E-Commerce Microservice API with OpenAPI docs',
        tasks: [
          { id: 'py-10', text: 'Create CRUD endpoints with proper response models & error handling', completed: false },
          { id: 'py-11', text: 'Implement JWT user authentication and password hashing with bcrypt', completed: false },
          { id: 'py-12', text: 'Write automated unit and integration tests using PyTest and TestClient', completed: false }
        ]
      },
      {
        week: 5,
        title: 'Caching, Background Tasks & Async Python',
        status: 'pending',
        hours: '12 hrs',
        topics: ['Asynchronous Programming (asyncio)', 'Redis Caching & Key Eviction', 'Celery / Background Tasks'],
        project: 'High-Throughput Weather Notification Service with Redis',
        tasks: [
          { id: 'py-13', text: 'Implement Redis caching to reduce database read overhead', completed: false },
          { id: 'py-14', text: 'Set up background email notifications with Celery or RQ', completed: false },
          { id: 'py-15', text: 'Benchmark async vs sync throughput using wrk/locust', completed: false }
        ]
      },
      {
        week: 6,
        title: 'Containerization, Docker & Deployment',
        status: 'pending',
        hours: '10 hrs',
        topics: ['Multi-stage Dockerfiles', 'Docker Compose with Postgres & Redis', 'Cloud Deployment on Render / AWS EC2'],
        project: 'Containerized Production-ready Portfolio API with CI/CD',
        tasks: [
          { id: 'py-16', text: 'Write a lean, production multi-stage Dockerfile for FastAPI', completed: false },
          { id: 'py-17', text: 'Orchestrate FastAPI, PostgreSQL, and Redis with docker-compose', completed: false },
          { id: 'py-18', text: 'Set up GitHub Actions workflow to run tests on git push', completed: false }
        ]
      }
    ],
    'web-dev': [
      {
        week: 1,
        title: 'Modern JavaScript (ES6+) & DOM Engineering',
        status: 'completed',
        hours: '10 hrs',
        topics: ['Async/Await, Promises & Fetch', 'Destructuring, Modules, Closures', 'Event Delegation & DOM Performance'],
        project: 'Interactive Task Management Dashboard with LocalStorage',
        tasks: [
          { id: 'wd-1', text: 'Master modern ES6 syntax (spread, rest, optional chaining)', completed: true },
          { id: 'wd-2', text: 'Implement asynchronous data fetching and error boundaries', completed: true },
          { id: 'wd-3', text: 'Build modular JavaScript application without third-party libraries', completed: true }
        ]
      },
      {
        week: 2,
        title: 'React Fundamentals & Component Architecture',
        status: 'in-progress',
        hours: '14 hrs',
        topics: ['JSX, Props & State', 'Hooks: useState, useEffect, useMemo', 'Component Hierarchy & Reusability'],
        project: 'Job Board Application with Search and Filter states',
        tasks: [
          { id: 'wd-4', text: 'Build responsive components with Tailwind CSS and React', completed: true },
          { id: 'wd-5', text: 'Manage shared state using Context API or Zustand', completed: false },
          { id: 'wd-6', text: 'Create reusable form controls with validation hooks', completed: false }
        ]
      },
      {
        week: 3,
        title: 'Backend with Node.js & Express',
        status: 'pending',
        hours: '12 hrs',
        topics: ['Node Event Loop & Modules', 'Express Middleware & Routing', 'Authentication & Authorization'],
        project: 'RESTful API for Student Community with auth tokens',
        tasks: [
          { id: 'wd-7', text: 'Develop Express router endpoints with validation middleware', completed: false },
          { id: 'wd-8', text: 'Secure API with JWT authentication and role-based guards', completed: false },
          { id: 'wd-9', text: 'Deploy backend to cloud provider with environment secrets', completed: false }
        ]
      },
      {
        week: 4,
        title: 'Relational Database Integration with PostgreSQL & Prisma',
        status: 'pending',
        hours: '12 hrs',
        topics: ['Database Schema Modeling', 'Prisma ORM Queries & Migrations', 'Indexes & Transactions'],
        project: 'Full Stack SaaS Subscription Management Schema & API',
        tasks: [
          { id: 'wd-10', text: 'Design normalized relational models with foreign key constraints', completed: false },
          { id: 'wd-11', text: 'Implement CRUD resolvers with Prisma ORM and data validation', completed: false },
          { id: 'wd-12', text: 'Benchmark query execution speed and apply compound indexes', completed: false }
        ]
      },
      {
        week: 5,
        title: 'Full-Stack React & Next.js Architecture',
        status: 'pending',
        hours: '14 hrs',
        topics: ['Next.js App Router Architecture', 'Server Actions & SSR', 'Caching & Incremental Static Regeneration'],
        project: 'Production Next.js E-Commerce Storefront with Server Actions',
        tasks: [
          { id: 'wd-13', text: 'Build hybrid SSR and Client components with Next.js App Router', completed: false },
          { id: 'wd-14', text: 'Implement optimistic UI mutations and server action workflows', completed: false },
          { id: 'wd-15', text: 'Integrate Stripe or checkout webhook handling with error logging', completed: false }
        ]
      },
      {
        week: 6,
        title: 'Testing, CI/CD & Production Deployment',
        status: 'pending',
        hours: '10 hrs',
        topics: ['Unit & Integration Testing with Vitest', 'End-to-End Testing with Playwright', 'Docker & Vercel/Render Deployment'],
        project: 'Containerized Full Stack Web App with Automated CI Pipeline',
        tasks: [
          { id: 'wd-16', text: 'Write unit tests for business logic and UI snapshot tests', completed: false },
          { id: 'wd-17', text: 'Build multi-stage Docker container and configure GitHub Actions CI', completed: false },
          { id: 'wd-18', text: 'Deploy full-stack application with custom domain and SSL certificates', completed: false }
        ]
      }
    ],
    'data-analyst': [
      {
        week: 1,
        title: 'Advanced SQL for Analytics & Data Modeling',
        status: 'completed',
        hours: '12 hrs',
        topics: ['Complex Multi-Table Joins', 'Window Functions & CTEs', 'Data Aggregation & Grouping Sets'],
        project: 'Retail Sales Revenue Analysis & Cohort Retention Model',
        tasks: [
          { id: 'da-1', text: 'Write queries using ROW_NUMBER, RANK, DENSE_RANK, and LAG/LEAD', completed: true },
          { id: 'da-2', text: 'Build recurring monthly cohort retention reports with CTEs', completed: true },
          { id: 'da-3', text: 'Optimize query execution with proper indexing and EXPLAIN ANALYZE', completed: false }
        ]
      },
      {
        week: 2,
        title: 'Data Wrangling with Python & Pandas',
        status: 'in-progress',
        hours: '14 hrs',
        topics: ['Data Cleaning & Imputation', 'Pandas GroupBy & Pivots', 'Merging and Reshaping Datasets'],
        project: 'Customer Churn Analysis on 50,000+ Records',
        tasks: [
          { id: 'da-4', text: 'Clean missing, outlier, and corrupted data using Pandas', completed: true },
          { id: 'da-5', text: 'Perform exploratory data analysis and correlation heatmaps', completed: false },
          { id: 'da-6', text: 'Export clean datasets ready for dashboard ingestion', completed: false }
        ]
      },
      {
        week: 3,
        title: 'BI Dashboards with PowerBI / Tableau',
        status: 'pending',
        hours: '12 hrs',
        topics: ['Data Modeling & Star Schema', 'DAX Measures & Calculated Columns', 'Interactive Executive Dashboards'],
        project: 'Interactive Executive KPI Dashboard for Higher Ed',
        tasks: [
          { id: 'da-7', text: 'Connect PowerBI to SQL database with relational star schema', completed: false },
          { id: 'da-8', text: 'Write DAX expressions for Year-over-Year (YoY) revenue metrics', completed: false },
          { id: 'da-9', text: 'Publish responsive dashboard with drill-down capabilities', completed: false }
        ]
      },
      {
        week: 4,
        title: 'Applied Statistical Analysis & Hypothesis Testing',
        status: 'pending',
        hours: '10 hrs',
        topics: ['A/B Testing Frameworks', 'Probability Distributions & Z/T Tests', 'Confidence Intervals & P-Values'],
        project: 'E-Commerce Checkout Funnel A/B Test Statistical Evaluation',
        tasks: [
          { id: 'da-10', text: 'Formulate null and alternative hypotheses for conversion experiments', completed: false },
          { id: 'da-11', text: 'Run two-sample t-tests and chi-squared tests in Python SciPy', completed: false },
          { id: 'da-12', text: 'Calculate minimum sample size and statistical power for test variants', completed: false }
        ]
      },
      {
        week: 5,
        title: 'Automated ETL Pipelines & Data Warehousing',
        status: 'pending',
        hours: '12 hrs',
        topics: ['ETL Pipeline Design', 'Data Warehousing with Snowflake / BigQuery', 'Scheduled Ingestion Scripts'],
        project: 'Automated Daily Financial Market Data Ingestion Pipeline',
        tasks: [
          { id: 'da-13', text: 'Extract daily market metrics from REST APIs into raw staging tables', completed: false },
          { id: 'da-14', text: 'Transform staging data into dimensional star schema tables', completed: false },
          { id: 'da-15', text: 'Schedule automated pipeline runs and alert on data quality anomalies', completed: false }
        ]
      },
      {
        week: 6,
        title: 'Executive Storytelling & Capstone Portfolio',
        status: 'pending',
        hours: '10 hrs',
        topics: ['Data Storytelling Principles', 'Executive Slide Decks', 'Interactive Portfolio Presentation'],
        project: 'End-to-End Enterprise Growth & Retention Capstone Presentation',
        tasks: [
          { id: 'da-16', text: 'Synthesize technical findings into an executive summary deck', completed: false },
          { id: 'da-17', text: 'Build dynamic interactive dashboard walkthrough with video briefing', completed: false },
          { id: 'da-18', text: 'Publish reproducible GitHub repository with documented notebooks', completed: false }
        ]
      }
    ],
    'cloud-devops': [
      {
        week: 1,
        title: 'Linux System Administration & Shell Automation',
        status: 'completed',
        hours: '10 hrs',
        topics: ['Linux CLI & File Permissions', 'Process Management & Systemd', 'Bash Scripting & Cron Jobs'],
        project: 'Automated Server Health Monitoring & Log Rotation Daemon',
        tasks: [
          { id: 'cd-1', text: 'Master Linux shell navigation, file system permissions, and SSH hardening', completed: true },
          { id: 'cd-2', text: 'Write automated Bash scripts for health checks and Slack/email alerts', completed: true },
          { id: 'cd-3', text: 'Configure custom systemd services and scheduled cron jobs', completed: false }
        ]
      },
      {
        week: 2,
        title: 'Git Workflows & Version Control Best Practices',
        status: 'in-progress',
        hours: '8 hrs',
        topics: ['Git Branching Strategies', 'Merge Conflicts & Rebase', 'Pull Request Reviews & Pre-commit Hooks'],
        project: 'Multi-environment Git Trunk-Based Development Repository',
        tasks: [
          { id: 'cd-4', text: 'Set up Git workflow with protected main and semantic version tagging', completed: true },
          { id: 'cd-5', text: 'Implement pre-commit hooks for secret detection and linting', completed: false },
          { id: 'cd-6', text: 'Configure signed commits with GPG and automated release notes', completed: false }
        ]
      },
      {
        week: 3,
        title: 'Containerization with Docker',
        status: 'pending',
        hours: '12 hrs',
        topics: ['Docker Architecture & Engine', 'Multi-Stage Dockerfiles', 'Docker Compose Multi-Container Stacks'],
        project: 'Production Microservices Stack with Web, API, Postgres & Redis',
        tasks: [
          { id: 'cd-7', text: 'Create minimal hardened container images using Alpine/Distroless', completed: false },
          { id: 'cd-8', text: 'Orchestrate multi-tier application stack with Docker Compose networking', completed: false },
          { id: 'cd-9', text: 'Optimize build cache layers to reduce image size by over 60%', completed: false }
        ]
      },
      {
        week: 4,
        title: 'CI/CD Pipelines with GitHub Actions',
        status: 'pending',
        hours: '12 hrs',
        topics: ['GitHub Actions Syntax & Runners', 'Automated Linting & Test Matrix', 'Automated Image Build & Push to Registry'],
        project: 'End-to-End Continuous Integration & Delivery Pipeline',
        tasks: [
          { id: 'cd-10', text: 'Build matrix test workflow across multiple runtime versions', completed: false },
          { id: 'cd-11', text: 'Build and push tagged Docker images to GitHub Container Registry', completed: false },
          { id: 'cd-12', text: 'Implement branch deployment guards and automated rollback triggers', completed: false }
        ]
      },
      {
        week: 5,
        title: 'Cloud Infrastructure on AWS & Terraform',
        status: 'pending',
        hours: '14 hrs',
        topics: ['AWS Core Services (VPC, EC2, S3, RDS)', 'Infrastructure as Code (IaC) with Terraform', 'Terraform State & Modules'],
        project: 'Automated Multi-Tier AWS Infrastructure Provisioned with Terraform',
        tasks: [
          { id: 'cd-13', text: 'Provision isolated VPC with public/private subnets and route tables', completed: false },
          { id: 'cd-14', text: 'Deploy auto-scaling web compute instances behind an Application Load Balancer', completed: false },
          { id: 'cd-15', text: 'Store remote Terraform state securely in S3 with DynamoDB locking', completed: false }
        ]
      },
      {
        week: 6,
        title: 'Kubernetes Fundamentals & Cluster Orchestration',
        status: 'pending',
        hours: '14 hrs',
        topics: ['Kubernetes Pods, Deployments & Services', 'Ingress Controllers & Cert-Manager', 'Prometheus & Grafana Monitoring'],
        project: 'High-Availability Kubernetes Microservice Cluster with Monitoring',
        tasks: [
          { id: 'cd-16', text: 'Write declarative Kubernetes deployment and service manifests', completed: false },
          { id: 'cd-17', text: 'Configure zero-downtime rolling updates and resource limits', completed: false },
          { id: 'cd-18', text: 'Deploy Prometheus and Grafana dashboards for cluster observability', completed: false }
        ]
      }
    ]
  };

  // Default AI Recommendations
  const DEFAULT_RECOMMENDATIONS = {
    careerPath: 'Python Developer',
    generatedAt: 'Today, 10:30 AM',
    confidenceScore: '94%',
    summary: 'Based on your profile (3rd Year Computer Science student) and strong foundation in Python, Git, and Algorithms, your optimal target is Python Backend Engineering. You are currently 78% ready for junior developer roles.',
    topStrengths: [
      'Strong core Python syntax and algorithmic problem-solving',
      'Consistent Git workflow and version control habits',
      'Solid academic foundation in Database Management Systems'
    ],
    priorityGaps: [
      {
        skill: 'FastAPI / Production REST APIs',
        urgency: 'High',
        why: '84% of entry-level Python backend job postings require production API development experience beyond simple scripting.'
      },
      {
        skill: 'PostgreSQL & ORM Modeling',
        urgency: 'Medium',
        why: 'Industry standard for modern scalable Python microservices. Transition from SQLite to PostgreSQL.'
      },
      {
        skill: 'Docker Containerization',
        urgency: 'Medium',
        why: 'Essential for ensuring reproducible deployments and testing microservice architectures.'
      }
    ],
    recommendedProjects: [
      {
        title: 'College Campus Event Hub API',
        difficulty: 'Intermediate',
        skillsTargeted: ['FastAPI', 'PostgreSQL', 'JWT Auth', 'Docker'],
        duration: '2 Weeks (20 hrs)',
        description: 'Build a production-grade multi-role REST API enabling students to browse, RSVP, and organize campus events with QR code check-ins.',
        portfolioImpact: 'Demonstrates real-world data validation, relational database indexing, and role-based access control.'
      },
      {
        title: 'Distributed Asynchronous Web Scraper & Alert System',
        difficulty: 'Advanced',
        skillsTargeted: ['Python asyncio', 'Redis', 'Celery', 'PostgreSQL'],
        duration: '3 Weeks (25 hrs)',
        description: 'Develop a high-throughput crawler tracking internship postings across company career portals, sending instant Telegram/Email alerts.',
        portfolioImpact: 'Proves mastery of concurrency, message queues, and resilient background task execution.'
      }
    ],
    weeklyStudyPlan: [
      { day: 'Mon & Tue (3 hrs)', focus: 'FastAPI dependency injection & Pydantic V2 schemas' },
      { day: 'Wed (2 hrs)', focus: 'PostgreSQL schema optimization & index analysis' },
      { day: 'Thu & Fri (4 hrs)', focus: 'Campus Event Hub API development (Auth & Event endpoints)' },
      { day: 'Weekend (3 hrs)', focus: 'PyTest automation suite & multi-stage Docker build' }
    ]
  };

  // Default Profile
  const DEFAULT_PROFILE = {
    name: 'Aarav Sharma',
    email: 'aarav.sharma@college.edu',
    college: 'National Institute of Technology',
    degree: 'B.Tech',
    branch: 'Computer Science & Engineering',
    academicYear: '3rd Year (Class of 2027)',
    careerGoal: 'Python Developer',
    careerId: 'python-dev',
    weeklyHours: 12,
    skills: ['Python', 'Git & GitHub', 'SQL Basics', 'HTML5 & CSS3', 'Data Structures', 'REST APIs'],
    skillProficiencies: {
      'Python': 80,
      'Git & GitHub': 75,
      'SQL Basics': 60,
      'HTML5 & CSS3': 85,
      'Data Structures': 70,
      'REST APIs': 55
    },
    interests: ['Backend Development', 'API Design', 'Distributed Systems', 'Open Source'],
    completedTasksCount: 4,
    totalStudyHoursLogged: 42,
    currentStreakDays: 6
  };

  // Storage Keys
  const STORAGE_KEYS = {
    PROFILE: 'skillspring_profile',
    ROADMAPS: 'skillspring_roadmaps',
    ROADMAP_SOURCES: 'skillspring_roadmap_sources',
    ACTIVITY: 'skillspring_activity',
    APP_SETTINGS: 'skillspring_settings'
  };

  // State Management Store
  class SkillSpringStore {
    constructor() {
      this.listeners = [];
      this.careers = [...CAREERS_CATALOG];
      this.init();
    }

    init() {
      if (!localStorage.getItem(STORAGE_KEYS.PROFILE)) {
        localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(DEFAULT_PROFILE));
      }
      if (!localStorage.getItem(STORAGE_KEYS.ROADMAPS)) {
        localStorage.setItem(STORAGE_KEYS.ROADMAPS, JSON.stringify(ROADMAP_DATA));
      }
      if (!localStorage.getItem(STORAGE_KEYS.ACTIVITY)) {
        const initialActivity = [
          { day: 'Mon', hours: 2.5, completed: true },
          { day: 'Tue', hours: 3.0, completed: true },
          { day: 'Wed', hours: 1.5, completed: true },
          { day: 'Thu', hours: 2.0, completed: true },
          { day: 'Fri', hours: 3.0, completed: true },
          { day: 'Sat', hours: 0.0, completed: false },
          { day: 'Sun', hours: 0.0, completed: false }
        ];
        localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(initialActivity));
      }

      // Synchronize career catalogue and user data independently
      this.syncCareers();
      this.syncWithBackend();
    }

    // Normalize JSON-formatted database lists and frontend arrays
    parseCareerList(value) {
      if (Array.isArray(value)) return value;
      if (typeof value !== 'string' || !value.trim()) return [];

      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        return value.split(',').map(item => item.trim()).filter(Boolean);
      }
    }

    // Convert Neon career records into the existing frontend structure
    normalizeCareer(career) {
      return {
        id: String(career.id || ''),
        title: career.title || 'Untitled Career',
        category: career.category || 'Other',
        level: career.level || 'Entry Level',
        matchScore: Number(career.match_score_benchmark ?? career.matchScore ?? 0),
        avgSalary: career.avg_salary ?? career.avgSalary ?? 'Not available',
        growthRate: career.growth_rate ?? career.growthRate ?? 'Not available',
        description: career.description || '',
        suitableBranches: this.parseCareerList(
          career.suitable_branches ?? career.suitableBranches
        ),
        topTools: this.parseCareerList(
          career.top_tools ?? career.topTools
        ),
        requiredSkills: (
          Array.isArray(career.requiredSkills) ? career.requiredSkills : []
        ).map(skill => ({
          name: skill.name || '',
          importance: skill.importance || 'Core',
          weight: Number(skill.weight) || 1,
          benchmarkProficiency: Number(
            skill.benchmark_proficiency ?? skill.benchmarkProficiency ?? 80
          )
        })).filter(skill => skill.name)
      };
    }

    // Load the live career catalogue without interrupting profile sync
    async syncCareers() {
      if (typeof fetch === 'undefined') return;

      try {
        const response = await fetch('/api/careers');

        if (!response.ok) {
          throw new Error(`Career API returned ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data.careers) || data.careers.length === 0) {
          console.warn('Career API returned an empty catalogue. Using offline data.');
          return;
        }

        const normalized = data.careers
          .map(career => this.normalizeCareer(career))
          .filter(career =>
            career.id &&
            career.title &&
            career.requiredSkills.length > 0
          );

        const uniqueCareers = [
          ...new Map(normalized.map(career => [career.id, career])).values()
        ];

        if (uniqueCareers.length === 0) {
          console.warn('No valid career records received. Using offline data.');
          return;
        }

        this.careers = uniqueCareers;
        console.info(`Loaded ${uniqueCareers.length} careers from the backend.`);
        this.notify();

      } catch (error) {
        console.warn('Career catalogue sync failed. Using offline data:', error);
      }
    }

    async syncWithBackend() {
      if (typeof fetch === 'undefined') return;
      try {
        const meRes = await fetch('/api/auth/me');
        if (!meRes.ok) return;
        const meData = await meRes.json();

        if (meData.authenticated && meData.user) {
          const profRes = await fetch('/api/profile');
          if (profRes.ok) {
            const data = await profRes.json();
            const sUser = data.user || {};
            const sProf = data.profile || {};
            const current = this.getProfile();

            const synced = {
              ...current,
              name: sUser.name || current.name,
              email: sUser.email || current.email,
              college: sProf.college || current.college,
              degree: sProf.degree || current.degree,
              branch: sProf.branch || current.branch,
              academicYear: sProf.academic_year || current.academicYear,
              careerId: sProf.career_id || current.careerId || 'python-dev',
              careerGoal: sProf.careerTitle || current.careerGoal,
              weeklyHours: sProf.weekly_hours || current.weeklyHours,
              skills: sProf.skills || current.skills,
              skillProficiencies: sProf.skillProficiencies || current.skillProficiencies,
              completedTasksCount: sProf.completedTasksCount !== undefined ? sProf.completedTasksCount : current.completedTasksCount,
              currentStreakDays: sProf.current_streak_days !== undefined ? sProf.current_streak_days : current.currentStreakDays,
              totalStudyHoursLogged: sProf.total_study_hours_logged !== undefined ? sProf.total_study_hours_logged : current.totalStudyHoursLogged
            };

            localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(synced));

            // Sync roadmap tasks with backend progress
            await this.syncRoadmapProgress(synced.careerId);
            this.notify();
          }
        }
      } catch (err) {
        // Safe offline fallback: continue with localStorage
        console.warn('Backend sync failed, using local offline storage:', err);
      }
    }

    async syncRoadmapProgress(careerId) {
      if (typeof fetch === 'undefined') return false;

      try {
        const cid = careerId || this.getProfile().careerId || 'python-dev';
        const res = await fetch(`/api/roadmap/${encodeURIComponent(cid)}/progress`);

        if (!res.ok) {
          console.warn('Roadmap sync failed with HTTP status:', res.status);
          return false;
        }

        const data = await res.json();

        if (!data || !Array.isArray(data.milestones)) {
          console.warn('Roadmap sync returned an invalid response.');
          return false;
        }

        const sourceData = localStorage.getItem(STORAGE_KEYS.ROADMAP_SOURCES);
        const sources = sourceData ? JSON.parse(sourceData) : {};

        if (data.roadmap_source) {
          sources[cid] = data.roadmap_source;
          localStorage.setItem(STORAGE_KEYS.ROADMAP_SOURCES, JSON.stringify(sources));
        }

        const stored = localStorage.getItem(STORAGE_KEYS.ROADMAPS);
        const roadmaps = stored ? JSON.parse(stored) : { ...ROADMAP_DATA };

        roadmaps[cid] = data.milestones.map(m => ({
          week: m.week_number,
          title: m.title,
          status: m.status,
          hours: m.estimated_hours,
          topics: typeof m.topics === 'string' ? JSON.parse(m.topics) : m.topics,
          project: m.project_title,
          tasks: (m.tasks || []).map(t => ({
            id: t.id,
            text: t.text,
            completed: Boolean(t.completed)
          }))
        }));

        localStorage.setItem(STORAGE_KEYS.ROADMAPS, JSON.stringify(roadmaps));
        return true;
      } catch (e) {
        console.warn('Roadmap synchronization failed:', e);
        return false;
      }
    }

    subscribe(listener) {
      this.listeners.push(listener);
      return () => {
        this.listeners = this.listeners.filter(l => l !== listener);
      };
    }

    notify() {
      this.listeners.forEach(fn => fn(this.getSnapshot()));
    }

    getSnapshot() {
      return {
        profile: this.getProfile(),
        careers: this.getCareers(),
        currentCareer: this.getCurrentCareer()
      };
    }

    // Profile Helpers
    getProfile() {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.PROFILE);
        return stored ? JSON.parse(stored) : DEFAULT_PROFILE;
      } catch (e) {
        return DEFAULT_PROFILE;
      }
    }

    saveProfile(updatedProfile) {
      const current = this.getProfile();
      const merged = { ...current, ...updatedProfile };
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(merged));
      this.notify();

      // Asynchronously persist to SQLite backend
      if (typeof fetch !== 'undefined') {
        fetch('/api/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(merged)
        }).catch(err => {
          console.warn('Offline: Profile saved to localStorage only', err);
        });
      }

      return merged;
    }

    resetProfile() {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(DEFAULT_PROFILE));
      localStorage.setItem(STORAGE_KEYS.ROADMAPS, JSON.stringify(ROADMAP_DATA));
      localStorage.setItem(STORAGE_KEYS.ROADMAP_SOURCES, JSON.stringify({}));
      this.notify();
      if (typeof fetch !== 'undefined') {
        fetch('/api/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(DEFAULT_PROFILE)
        }).catch(() => {});
      }
    }

    // Career Catalog Helpers
    getCareers() {
      return this.careers;
    }

    getCareerById(id) {
      return this.careers.find(c => c.id === id) || this.careers[0];
    }

    getCurrentCareer() {
      const profile = this.getProfile();
      return this.getCareerById(profile.careerId || 'python-dev');
    }

    setTargetCareer(careerId) {
      const career = this.getCareerById(careerId);
      if (career) {
        this.saveProfile({
          careerId: career.id,
          careerGoal: career.title
        });
      }
    }

    // Skill Gap Analysis Engine
    calculateSkillGap(careerId) {
      const career = this.getCareerById(careerId || this.getProfile().careerId);
      const profile = this.getProfile();
      const userSkills = profile.skills || [];
      const userProficiencies = profile.skillProficiencies || {};

      let totalWeight = 0;
      let earnedWeight = 0;
      const acquired = [];
      const missing = [];
      const improvable = [];

      career.requiredSkills.forEach(req => {
        totalWeight += req.weight;
        const normalizedName = req.name.toLowerCase();

        // Match checking
        const matchedUserSkill = userSkills.find(
          s => s.toLowerCase() === normalizedName ||
               normalizedName.includes(s.toLowerCase()) ||
               s.toLowerCase().includes(normalizedName)
        );

        if (matchedUserSkill) {
          const userProficiency = userProficiencies[matchedUserSkill] || 60;
          const factor = userProficiency / 100;
          earnedWeight += req.weight * factor;

          if (userProficiency >= 75) {
            acquired.push({
              name: req.name,
              importance: req.importance,
              userProficiency,
              status: 'Mastered'
            });
          } else {
            improvable.push({
              name: req.name,
              importance: req.importance,
              userProficiency,
              targetProficiency: 85,
              gap: 85 - userProficiency,
              status: 'Needs Polish'
            });
          }
        } else {
          missing.push({
            name: req.name,
            importance: req.importance,
            weight: req.weight,
            targetProficiency: 80,
            status: 'Not Acquired'
          });
        }
      });

      const matchPercentage = Math.round((earnedWeight / totalWeight) * 100);

      // Prioritize areas to improve
      const prioritizedGaps = [
        ...missing.filter(m => m.importance === 'Critical'),
        ...improvable.filter(i => i.importance === 'Critical'),
        ...missing.filter(m => m.importance === 'High'),
        ...improvable.filter(i => i.importance === 'High'),
        ...missing.filter(m => m.importance !== 'Critical' && m.importance !== 'High')
      ];

      return {
        career,
        matchPercentage,
        acquired,
        improvable,
        missing,
        prioritizedGaps,
        totalRequired: career.requiredSkills.length,
        acquiredCount: acquired.length + improvable.length
      };
    }

    // Roadmap Helpers
    getRoadmapSource(careerId) {
      const cid = careerId || this.getProfile().careerId;

      try {
        const stored = localStorage.getItem(STORAGE_KEYS.ROADMAP_SOURCES);
        const sources = stored ? JSON.parse(stored) : {};
        return sources[cid] || (this.getRoadmap(cid).length ? 'unknown' : 'none');
      } catch (e) {
        return this.getRoadmap(cid).length ? 'unknown' : 'none';
      }
    }

    getRoadmap(careerId) {
      const cid = careerId || this.getProfile().careerId;

      try {
        const stored = localStorage.getItem(STORAGE_KEYS.ROADMAPS);
        const roadmaps = stored ? JSON.parse(stored) : ROADMAP_DATA;
        const roadmap = roadmaps?.[cid];

        return Array.isArray(roadmap) ? roadmap : [];
      } catch (e) {
        console.warn('Unable to load roadmap from localStorage:', e);
        return [];
      }
    }

    toggleRoadmapTask(careerId, taskId) {
      const cid = careerId || this.getProfile().careerId;
      let roadmaps;

      try {
        const stored = localStorage.getItem(STORAGE_KEYS.ROADMAPS);
        roadmaps = stored ? JSON.parse(stored) : { ...ROADMAP_DATA };
      } catch (e) {
        console.warn('Unable to load stored roadmaps:', e);
        return { success: false, completedTasks: 0, totalTasks: 0 };
      }

      const currentList = roadmaps?.[cid];

      if (!Array.isArray(currentList) || currentList.length === 0) {
        return { success: false, completedTasks: 0, totalTasks: 0 };
      }

      const targetTask = currentList
        .flatMap(week => Array.isArray(week.tasks) ? week.tasks : [])
        .find(task => task.id === taskId);

      if (!targetTask) {
        return { success: false, completedTasks: 0, totalTasks: 0 };
      }

      targetTask.completed = !targetTask.completed;

      let totalTasks = 0;
      let completedTasks = 0;

      currentList.forEach(week => {
        const tasks = Array.isArray(week.tasks) ? week.tasks : [];

        tasks.forEach(task => {
          totalTasks++;
          if (task.completed) completedTasks++;
        });

        const weekCompleted = tasks.filter(task => task.completed).length;

        if (weekCompleted === tasks.length) {
          week.status = 'completed';
        } else if (weekCompleted > 0) {
          week.status = 'in-progress';
        } else {
          week.status = 'pending';
        }
      });

      roadmaps[cid] = currentList;
      localStorage.setItem(STORAGE_KEYS.ROADMAPS, JSON.stringify(roadmaps));

      this.saveProfile({
        completedTasksCount: completedTasks
      });

      this.notify();

      if (typeof fetch !== 'undefined') {
        fetch('/api/roadmap/toggle-task', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ task_id: taskId, career_id: cid })
        }).catch(err => {
          console.warn('Offline: Task toggle saved to localStorage only', err);
        });
      }

      return { success: true, completedTasks, totalTasks };
    }

    getRoadmapStats(careerId) {
      const roadmap = this.getRoadmap(careerId);
      let totalTasks = 0;
      let completedTasks = 0;

      roadmap.forEach(week => {
        (Array.isArray(week.tasks) ? week.tasks : []).forEach(task => {
          totalTasks++;
          if (task.completed) completedTasks++;
        });
      });

      const percentage = totalTasks > 0
        ? Math.round((completedTasks / totalTasks) * 100)
        : 0;

      return { totalTasks, completedTasks, percentage };
    }

    // AI Recommendations Helpers
    getRecommendations() {
      const profile = this.getProfile();
      const currentCareer = this.getCurrentCareer();
      const gap = this.calculateSkillGap(currentCareer.id);

      return {
        ...DEFAULT_RECOMMENDATIONS,
        careerPath: currentCareer.title,
        confidenceScore: `${gap.matchPercentage}% Readiness`,
        summary: `Tailored for ${profile.name} (${profile.branch}, ${profile.academicYear}). You have acquired ${gap.acquiredCount} of ${gap.totalRequired} core skills for ${currentCareer.title}. Your primary focus should be hands-on project implementation and closing prioritized gaps in ${gap.missing.slice(0, 2).map(m => m.name).join(' & ')}.`
      };
    }

    // Activity Helpers
    getActivity() {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.ACTIVITY);
        return stored ? JSON.parse(stored) : [];
      } catch (e) {
        return [];
      }
    }
  }

  // Toast Notification System
  const Toast = {
    show(message, type = 'info', duration = 3500) {
      let container = document.getElementById('toast-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
      }

      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;

      let iconSvg = '';
      if (type === 'success') {
        iconSvg = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>`;
      } else if (type === 'error') {
        iconSvg = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
      } else {
        iconSvg = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
      }

      toast.innerHTML = `
        <span style="color: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#4F46E5'}">${iconSvg}</span>
        <span style="flex:1; font-weight:500;">${message}</span>
      `;

      container.appendChild(toast);

      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }, duration);
    }
  };

  // Expose to window
  window.SkillSpringStore = new SkillSpringStore();
  window.SkillSpringToast = Toast;
})();
