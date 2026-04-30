# 🚀 TaskFlow – Team Task Manager

<p align="center">
  <img src="https://via.placeholder.com/900x250?text=TaskFlow+%7C+Full+Stack+Project" alt="TaskFlow Banner"/>
</p>

<p align="center">
  <b>Full-Stack Task Management App with Role-Based Access, Kanban Board & Analytics</b>
</p>

---

## 🌐 Live Demo

* 🔗 **Frontend:** https://frontend-smoky-tau-78.vercel.app
* 🔗 **Backend API:** https://taskflow-production-641f.up.railway.app

---

## 👤 Demo Accounts

| Role   | Email                                             | Password  |
| ------ | ------------------------------------------------- | --------- |
| Admin  | [admin@taskflow.com](mailto:admin@taskflow.com)   | admin123  |
| Member | [member@taskflow.com](mailto:member@taskflow.com) | member123 |

---

## 💡 Why This Project?

TaskFlow demonstrates real-world full-stack engineering:

* 🔐 Secure authentication with JWT
* 🧠 Role-based access control (RBAC)
* ⚙️ REST API design (Flask)
* 📊 Data-driven dashboard
* 🚀 Production deployment (Railway + Vercel)

---

## 📸 Screenshots

### 🔐 Login Page

![Login](https://via.placeholder.com/600x350?text=Login+UI)

### 📊 Dashboard

![Dashboard](https://via.placeholder.com/600x350?text=Dashboard)

### 📋 Kanban Board

![Kanban](https://via.placeholder.com/600x350?text=Kanban+Board)

---

## ⚡ Features

### 🔐 Authentication

* JWT-based login/signup
* Secure password hashing
* Protected routes

### 👥 Role-Based Access

* Admin → full control
* Member → limited access

### 📁 Project Management

* Create / update / delete projects
* Assign members & roles
* Track deadlines & progress

### ✅ Task Management

* Full CRUD operations
* Status tracking (To Do → Done)
* Priority levels
* Due dates + overdue detection

### 📊 Dashboard

* Task stats & analytics
* Overdue alerts
* Activity overview

### 📋 Kanban Board

* Visual workflow
* Status-based columns

---

## 🛠 Tech Stack

### Backend

* Python (Flask)
* Flask-JWT-Extended
* Flask-SQLAlchemy
* PostgreSQL
* Gunicorn

### Frontend

* React (Vite)
* React Router
* Axios
* Tailwind CSS

### Deployment

* Railway (Backend + DB)
* Vercel (Frontend)

---

## 🗂 Project Structure

```
taskflow/
├── backend/
│   ├── app/
│   ├── models/
│   ├── routes/
│   ├── run.py
│   └── seed.py
│
├── frontend/
│   ├── src/
│   ├── components/
│   ├── pages/
│   └── App.js
```

---

## ⚙️ Environment Variables

### Backend (.env)

```
DATABASE_URL=your_postgres_url
JWT_SECRET_KEY=your_secret_key
```

### Frontend (.env)

```
VITE_API_URL=https://taskflow-production-641f.up.railway.app
```

---

## 🚀 Run Locally

### 1. Clone Repo

```
git clone <your-repo-url>
cd taskflow
```

### 2. Backend

```
cd backend
pip install -r requirements.txt
python run.py
```

### 3. Frontend

```
cd frontend
npm install
npm run dev
```

---

## 🔌 API Endpoints

### Auth

* POST /api/auth/signup
* POST /api/auth/login
* GET /api/auth/me

### Projects

* GET /api/projects
* POST /api/projects

### Tasks

* GET /api/tasks
* POST /api/tasks

### Health

* GET /api/health

---

## 🧪 API Health Check

```
GET https://taskflow-production-641f.up.railway.app/api/health
```

Response:

```
{"status": "ok"}
```

---

## 🔒 Security

* JWT Authentication
* Role-based authorization
* Input validation
* Protected API routes

---

## 📈 Future Improvements

* Real-time updates (WebSockets)
* Notifications system
* Mobile responsiveness
* Activity logs

---

## 👨‍💻 Author

**Kshitij Srivastava**
