from app import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timezone


# Association table: users in projects
project_members = db.Table(
    "project_members",
    db.Column("user_id", db.Integer, db.ForeignKey("users.id"), primary_key=True),
    db.Column("project_id", db.Integer, db.ForeignKey("projects.id"), primary_key=True),
    db.Column("role", db.String(20), default="member"),  # 'admin' or 'member'
    db.Column("joined_at", db.DateTime, default=lambda: datetime.now(timezone.utc)),
)


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), default="member")  # global role: 'admin' or 'member'
    avatar = db.Column(db.String(10), default="🧑")
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    owned_projects = db.relationship("Project", back_populates="owner", foreign_keys="Project.owner_id")
    projects = db.relationship("Project", secondary=project_members, back_populates="members")
    assigned_tasks = db.relationship("Task", back_populates="assignee", foreign_keys="Task.assignee_id")
    created_tasks = db.relationship("Task", back_populates="creator", foreign_keys="Task.creator_id")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "avatar": self.avatar,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Project(db.Model):
    __tablename__ = "projects"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, default="")
    status = db.Column(db.String(30), default="active")  # active, completed, on_hold
    color = db.Column(db.String(10), default="#6366f1")
    owner_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    deadline = db.Column(db.DateTime, nullable=True)

    # Relationships
    owner = db.relationship("User", back_populates="owned_projects", foreign_keys=[owner_id])
    members = db.relationship("User", secondary=project_members, back_populates="projects")
    tasks = db.relationship("Task", back_populates="project", cascade="all, delete-orphan")

    def get_member_role(self, user_id):
        result = db.session.execute(
            db.select(project_members.c.role).where(
                (project_members.c.project_id == self.id) &
                (project_members.c.user_id == user_id)
            )
        ).first()
        return result[0] if result else None

    def to_dict(self, user_id=None):
        total = len(self.tasks)
        done = sum(1 for t in self.tasks if t.status == "done")
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "status": self.status,
            "color": self.color,
            "owner": self.owner.to_dict() if self.owner else None,
            "owner_id": self.owner_id,
            "members": [m.to_dict() for m in self.members],
            "member_role": self.get_member_role(user_id) if user_id else None,
            "task_count": total,
            "completed_tasks": done,
            "progress": round((done / total * 100) if total > 0 else 0),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "deadline": self.deadline.isoformat() if self.deadline else None,
        }


class Task(db.Model):
    __tablename__ = "tasks"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(300), nullable=False)
    description = db.Column(db.Text, default="")
    status = db.Column(db.String(30), default="todo")  # todo, in_progress, review, done
    priority = db.Column(db.String(20), default="medium")  # low, medium, high, urgent
    project_id = db.Column(db.Integer, db.ForeignKey("projects.id"), nullable=False)
    assignee_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    creator_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    due_date = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    tags = db.Column(db.String(300), default="")  # comma-separated

    # Relationships
    project = db.relationship("Project", back_populates="tasks")
    assignee = db.relationship("User", back_populates="assigned_tasks", foreign_keys=[assignee_id])
    creator = db.relationship("User", back_populates="created_tasks", foreign_keys=[creator_id])

    @property
    def is_overdue(self):
        if self.due_date and self.status != "done":
            return datetime.now(timezone.utc) > self.due_date.replace(tzinfo=timezone.utc)
        return False

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "status": self.status,
            "priority": self.priority,
            "project_id": self.project_id,
            "project_name": self.project.name if self.project else None,
            "assignee": self.assignee.to_dict() if self.assignee else None,
            "assignee_id": self.assignee_id,
            "creator": self.creator.to_dict() if self.creator else None,
            "creator_id": self.creator_id,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "is_overdue": self.is_overdue,
            "tags": self.tags.split(",") if self.tags else [],
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
