"""
Seed script - run with: python seed.py
Creates demo users, projects, and tasks
"""
from app import create_app, db
from app.models import User, Project, Task, project_members
from datetime import datetime, timezone, timedelta
import random

app = create_app()

def seed():
    with app.app_context():
        print("Clearing existing data...")
        db.drop_all()
        db.create_all()

        print("Creating users...")
        admin = User(name="Admin User", email="admin@taskflow.com", role="admin", avatar="🧑‍💻")
        admin.set_password("admin123")

        alice = User(name="Alice Johnson", email="alice@taskflow.com", role="member", avatar="👩")
        alice.set_password("member123")

        bob = User(name="Bob Smith", email="bob@taskflow.com", role="member", avatar="🧔")
        bob.set_password("member123")

        carol = User(name="Carol White", email="carol@taskflow.com", role="member", avatar="🦸")
        carol.set_password("member123")

        member = User(name="Member User", email="member@taskflow.com", role="member", avatar="🧑")
        member.set_password("member123")

        db.session.add_all([admin, alice, bob, carol, member])
        db.session.flush()

        print("Creating projects...")
        projects_data = [
            {"name": "Website Redesign", "description": "Complete overhaul of the company website with modern design", "color": "#4f8ef7", "status": "active"},
            {"name": "Mobile App v2", "description": "New features and bug fixes for the mobile application", "color": "#22c55e", "status": "active"},
            {"name": "API Integration", "description": "Integrate third-party APIs for payment and analytics", "color": "#f59e0b", "status": "active"},
            {"name": "Marketing Campaign", "description": "Q2 digital marketing campaign execution", "color": "#a855f7", "status": "completed"},
        ]

        created_projects = []
        for pd in projects_data:
            proj = Project(
                name=pd["name"], description=pd["description"],
                color=pd["color"], status=pd["status"], owner_id=admin.id,
                deadline=datetime.now(timezone.utc) + timedelta(days=random.randint(7, 60))
            )
            db.session.add(proj)
            db.session.flush()

            # Add owner as admin member
            db.session.execute(project_members.insert().values(user_id=admin.id, project_id=proj.id, role="admin"))
            # Add other members
            for u in [alice, bob, carol, member]:
                db.session.execute(project_members.insert().values(user_id=u.id, project_id=proj.id, role="member"))
            created_projects.append(proj)

        print("Creating tasks...")
        all_users = [admin, alice, bob, carol, member]
        statuses = ['todo', 'in_progress', 'review', 'done']
        priorities = ['low', 'medium', 'high', 'urgent']

        tasks_templates = [
            "Design new landing page", "Fix login bug", "Write unit tests", "Update documentation",
            "Code review PR #42", "Deploy to staging", "Database optimization", "Add dark mode",
            "Set up CI/CD pipeline", "User authentication flow", "API rate limiting", "Mobile responsiveness",
            "Performance optimization", "Security audit", "Add search functionality", "Email notifications",
            "Payment integration", "Analytics dashboard", "User onboarding flow", "Export to PDF",
        ]

        for i, proj in enumerate(created_projects):
            for j, title in enumerate(random.sample(tasks_templates, 8)):
                due = datetime.now(timezone.utc) + timedelta(days=random.randint(-5, 30))
                task = Task(
                    title=title,
                    description=f"Detailed description for: {title}. This task is part of {proj.name}.",
                    status=random.choice(statuses),
                    priority=random.choice(priorities),
                    project_id=proj.id,
                    assignee_id=random.choice(all_users).id,
                    creator_id=admin.id,
                    due_date=due,
                    tags=random.choice(["frontend", "backend", "bug,urgent", "feature", "docs", ""])
                )
                db.session.add(task)

        db.session.commit()
        print("✅ Seed complete!")
        print("Demo credentials:")
        print("  Admin: admin@taskflow.com / admin123")
        print("  Member: member@taskflow.com / member123")

if __name__ == "__main__":
    seed()
