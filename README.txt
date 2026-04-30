================================================================================
  TASKFLOW - Team Task Manager
  Full-Stack Web Application
  Built with: Flask + PostgreSQL + React.js
================================================================================

LIVE URL: [Your Railway URL here after deployment]
GITHUB REPO: [Your GitHub URL here]

--------------------------------------------------------------------------------
PROJECT OVERVIEW
--------------------------------------------------------------------------------

TaskFlow is a full-stack team task management web application that enables
organizations to create projects, assign tasks, track progress, and manage
team members with role-based access control (Admin/Member).

--------------------------------------------------------------------------------
KEY FEATURES
--------------------------------------------------------------------------------

AUTHENTICATION
  - Secure JWT-based Signup / Login / Logout
  - Password hashing with Werkzeug
  - Protected routes on both frontend and backend
  - Token auto-refresh handling

ROLE-BASED ACCESS CONTROL
  - ADMIN: Full access - create/edit/delete projects, tasks, manage members,
           change user roles globally
  - MEMBER: View projects they belong to, update assigned task status,
            create tasks within projects they are part of

PROJECT MANAGEMENT
  - Create, edit, delete projects
  - Assign colors and deadlines
  - Project status tracking (Active / Completed / On Hold)
  - Progress bar based on completed tasks
  - Add/remove team members per project
  - Member role management per project (Admin / Member)

TASK MANAGEMENT
  - Full CRUD for tasks
  - Task statuses: To Do → In Progress → Review → Done
  - Priority levels: Low / Medium / High / Urgent
  - Assign tasks to project members
  - Due date tracking with overdue detection
  - Tag/label support

KANBAN BOARD
  - Visual Kanban board view per project
  - Tasks organized by status columns
  - Quick status change inline
  - Priority-sorted within columns

DASHBOARD
  - Summary stats (projects, tasks, completion rate, overdue count)
  - Task status distribution chart
  - Overdue task alerts
  - My assigned tasks table
  - Recent project cards with progress

TEAM MANAGEMENT
  - View all workspace members
  - Admin can change user global roles
  - Member card view with join date

PROFILE
  - Edit display name
  - Choose emoji avatar
  - Change password

--------------------------------------------------------------------------------
TECH STACK
--------------------------------------------------------------------------------

Backend:
  - Python 3.11+
  - Flask 3.0 (REST API framework)
  - Flask-JWT-Extended (Authentication)
  - Flask-SQLAlchemy (ORM)
  - Flask-Migrate (Database migrations)
  - Flask-CORS (Cross-origin support)
  - PostgreSQL (Database)
  - Gunicorn (Production WSGI server)

Frontend:
  - React.js 18
  - React Router v6 (Client-side routing)
  - Axios (HTTP client)
  - date-fns (Date formatting)
  - Custom CSS (No UI library - fully handcrafted design)

Deployment:
  - Railway.app (Backend + Database)
  - Railway.app or Vercel (Frontend)

--------------------------------------------------------------------------------
DATABASE SCHEMA
--------------------------------------------------------------------------------

USERS
  id, name, email, password_hash, role (admin/member), avatar, created_at

PROJECTS
  id, name, description, status, color, owner_id (FK users), deadline,
  created_at, updated_at

PROJECT_MEMBERS (junction table)
  user_id (FK users), project_id (FK projects), role, joined_at

TASKS
  id, title, description, status, priority, project_id (FK projects),
  assignee_id (FK users), creator_id (FK users), due_date, tags,
  created_at, updated_at

--------------------------------------------------------------------------------
API ENDPOINTS
--------------------------------------------------------------------------------

AUTH
  POST /api/auth/signup         - Register new user
  POST /api/auth/login          - Login, returns JWT token
  GET  /api/auth/me             - Get current user profile
  PUT  /api/auth/me             - Update profile

PROJECTS
  GET    /api/projects/                  - List user's projects
  POST   /api/projects/                  - Create project
  GET    /api/projects/:id               - Get project details
  PUT    /api/projects/:id               - Update project (admin)
  DELETE /api/projects/:id               - Delete project (owner/admin)
  POST   /api/projects/:id/members       - Add member to project
  DELETE /api/projects/:id/members/:uid  - Remove member
  PUT    /api/projects/:id/members/:uid/role - Update member role

TASKS
  GET    /api/tasks/       - List tasks (supports filters: project_id,
                             status, priority, assignee_id, my_tasks, overdue)
  POST   /api/tasks/       - Create task
  GET    /api/tasks/:id    - Get task
  PUT    /api/tasks/:id    - Update task
  DELETE /api/tasks/:id    - Delete task

USERS
  GET  /api/users/         - List all users (supports ?search=)
  GET  /api/users/:id      - Get user
  PUT  /api/users/:id/role - Update global role (admin only)

DASHBOARD
  GET /api/dashboard/      - Aggregated stats and overview data

HEALTH
  GET /api/health          - Health check endpoint

--------------------------------------------------------------------------------
LOCAL SETUP GUIDE
--------------------------------------------------------------------------------

PREREQUISITES
  - Python 3.11+
  - Node.js 18+
  - PostgreSQL 14+
  - Git

STEP 1: Clone the repository
  git clone <your-repo-url>
  cd taskflow

STEP 2: Backend setup
  cd backend
  python -m venv venv
  source venv/bin/activate        (Windows: venv\Scripts\activate)
  pip install -r requirements.txt
  cp .env.example .env
  # Edit .env with your PostgreSQL credentials

STEP 3: Create PostgreSQL database
  psql -U postgres
  CREATE DATABASE taskflow;
  \q

STEP 4: Run migrations and seed data
  flask db init
  flask db migrate -m "initial"
  flask db upgrade
  python seed.py

STEP 5: Start backend
  python run.py
  # API running at http://localhost:5000

STEP 6: Frontend setup (new terminal)
  cd frontend
  npm install
  cp .env.example .env
  npm start
  # App running at http://localhost:3000

DEMO ACCOUNTS
  Admin:  admin@taskflow.com  / admin123
  Member: member@taskflow.com / member123

--------------------------------------------------------------------------------
RAILWAY DEPLOYMENT GUIDE
--------------------------------------------------------------------------------

STEP 1: Push code to GitHub
  git init
  git add .
  git commit -m "Initial commit - TaskFlow"
  git remote add origin <your-github-repo-url>
  git push -u origin main

STEP 2: Deploy Backend on Railway
  1. Go to https://railway.app and sign in
  2. Click "New Project" → "Deploy from GitHub repo"
  3. Select your repository
  4. Click "Add Service" → "Database" → "PostgreSQL"
  5. Railway auto-sets DATABASE_URL in the backend environment
  6. Set root directory to "backend" in service settings
  7. Add environment variables:
       JWT_SECRET_KEY = (generate a random 32+ char string)
       FLASK_ENV = production
  8. Railway will auto-detect the Procfile and deploy

STEP 3: Run seed script on Railway
  In Railway dashboard → your backend service → Shell:
  python seed.py

STEP 4: Deploy Frontend on Railway (or Vercel)
  Option A - Railway:
    1. Add new service → Deploy from same GitHub repo
    2. Set root directory to "frontend"
    3. Set environment variable:
         REACT_APP_API_URL = https://your-backend.railway.app
    4. Build command: npm run build
    5. Start command: npx serve -s build

  Option B - Vercel (easier for React):
    1. Go to https://vercel.com → New Project
    2. Import your GitHub repo
    3. Set Root Directory to "frontend"
    4. Add environment variable:
         REACT_APP_API_URL = https://your-backend.railway.app
    5. Deploy

STEP 5: Update CORS (if needed)
  In backend/app/__init__.py, CORS is set to origins="*" which allows all.
  For production, replace with your frontend URL:
    CORS(app, origins=["https://your-frontend.vercel.app"])

--------------------------------------------------------------------------------
PROJECT STRUCTURE
--------------------------------------------------------------------------------

taskflow/
├── backend/
│   ├── app/
│   │   ├── __init__.py          # App factory, extension setup
│   │   ├── models/
│   │   │   └── __init__.py      # SQLAlchemy models (User, Project, Task)
│   │   └── routes/
│   │       ├── auth.py          # Authentication endpoints
│   │       ├── projects.py      # Project CRUD + member management
│   │       ├── tasks.py         # Task CRUD with filters
│   │       ├── users.py         # User management
│   │       └── dashboard.py     # Aggregated dashboard data
│   ├── run.py                   # Application entry point
│   ├── seed.py                  # Database seeding script
│   ├── requirements.txt         # Python dependencies
│   ├── Procfile                 # Railway/Heroku process config
│   ├── railway.toml             # Railway deployment config
│   └── .env.example             # Environment variables template
│
├── frontend/
│   ├── public/
│   │   └── index.html           # HTML template with Google Fonts
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.js   # Global auth state (user, login, logout)
│   │   ├── utils/
│   │   │   └── api.js           # Axios instance with JWT interceptor
│   │   ├── components/
│   │   │   └── layout/
│   │   │       └── AppLayout.js # Sidebar + main layout wrapper
│   │   ├── pages/
│   │   │   ├── LoginPage.js     # Login form
│   │   │   ├── SignupPage.js    # Registration form
│   │   │   ├── DashboardPage.js # Stats, overdue, projects overview
│   │   │   ├── ProjectsPage.js  # Projects grid with CRUD
│   │   │   ├── ProjectDetailPage.js # Kanban board + list + members
│   │   │   ├── TasksPage.js     # All tasks with filters + CRUD
│   │   │   ├── TeamPage.js      # Team members management
│   │   │   └── ProfilePage.js   # User profile settings
│   │   ├── App.js               # Router setup + protected routes
│   │   ├── index.js             # React DOM render
│   │   └── index.css            # Complete custom design system
│   ├── package.json
│   └── .env.example
│
├── .gitignore
└── README.txt                   # This file

--------------------------------------------------------------------------------
VALIDATIONS & ERROR HANDLING
--------------------------------------------------------------------------------

Backend:
  - All inputs validated before processing
  - Role checks on every protected route
  - JWT token required on all /api/* routes (except /auth/signup, /auth/login)
  - 400 Bad Request for missing/invalid fields
  - 401 Unauthorized for invalid tokens
  - 403 Forbidden for insufficient permissions
  - 404 Not Found for missing resources
  - 409 Conflict for duplicate emails / existing members

Frontend:
  - Form validation with required fields
  - API error messages displayed to users
  - 401 response auto-redirects to login
  - Loading states on all async operations
  - Confirm dialogs before destructive actions

--------------------------------------------------------------------------------
AUTHOR
--------------------------------------------------------------------------------

Built for: ethara.ai Candidate Assessment
Stack: Python Flask + PostgreSQL + React.js
Deployment: Railway

================================================================================
