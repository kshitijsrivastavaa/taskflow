# 🚀 TaskFlow – Team Task Manager

A full-stack team task management application built with **Flask + PostgreSQL + React.js**.  
Designed for managing projects, assigning tasks, and tracking team productivity with role-based access control.

---

## 🌐 Live Demo

- 🔗 Frontend: https://frontend-smoky-tau-78.vercel.app  
- 🔗 Backend API: https://taskflow-production-641f.up.railway.app  

---

## 👤 Demo Accounts

| Role   | Email                  | Password  |
|--------|------------------------|-----------|
| Admin  | admin@taskflow.com     | admin123  |
| Member | member@taskflow.com    | member123 |

---

## 📌 Features

### 🔐 Authentication
- JWT-based login/signup
- Secure password hashing
- Protected routes

### 👥 Role-Based Access
- **Admin**: Full access (projects, tasks, members)
- **Member**: Limited access (assigned tasks)

### 📁 Project Management
- Create / update / delete projects
- Assign members & roles
- Track project status & progress

### ✅ Task Management
- Full CRUD operations
- Status: To Do → In Progress → Review → Done
- Priority: Low / Medium / High / Urgent
- Assign tasks, due dates, tags

### 📊 Dashboard
- Task stats & completion rate
- Overdue alerts
- Activity overview

### 📋 Kanban Board
- Visual task tracking
- Drag & update status

---

## 🛠 Tech Stack

### Backend
- Python (Flask)
- Flask-JWT-Extended
- Flask-SQLAlchemy
- PostgreSQL
- Gunicorn

### Frontend
- React.js (Vite)
- React Router
- Axios
- Tailwind CSS

### Deployment
- Backend: Railway
- Frontend: Vercel

---

## 🗂 Project Structure
