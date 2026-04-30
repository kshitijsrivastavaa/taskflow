from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import User, Project, Task
from datetime import datetime, timezone, timedelta

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/", methods=["GET"])
@jwt_required()
def get_dashboard():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    now = datetime.now(timezone.utc)

    if user.role == "admin":
        all_projects = Project.query.all()
        all_tasks = Task.query.all()
        my_tasks = Task.query.filter_by(assignee_id=user_id).all()
    else:
        project_ids = set([p.id for p in user.projects] + [p.id for p in user.owned_projects])
        all_projects = Project.query.filter(Project.id.in_(project_ids)).all()
        all_tasks = Task.query.filter(Task.project_id.in_(project_ids)).all()
        my_tasks = Task.query.filter_by(assignee_id=user_id).all()

    # Stats
    total_tasks = len(all_tasks)
    done_tasks = sum(1 for t in all_tasks if t.status == "done")
    in_progress = sum(1 for t in all_tasks if t.status == "in_progress")
    overdue_tasks = [
        t for t in all_tasks
        if t.due_date and t.status != "done" and t.due_date.replace(tzinfo=timezone.utc) < now
    ]

    # Recent activity (last 7 days)
    week_ago = now - timedelta(days=7)
    recent_tasks = sorted(
        [t for t in all_tasks if t.updated_at and t.updated_at.replace(tzinfo=timezone.utc) > week_ago],
        key=lambda t: t.updated_at,
        reverse=True
    )[:10]

    # Task status distribution
    status_dist = {
        "todo": sum(1 for t in all_tasks if t.status == "todo"),
        "in_progress": sum(1 for t in all_tasks if t.status == "in_progress"),
        "review": sum(1 for t in all_tasks if t.status == "review"),
        "done": done_tasks,
    }

    # Priority distribution
    priority_dist = {
        "low": sum(1 for t in all_tasks if t.priority == "low"),
        "medium": sum(1 for t in all_tasks if t.priority == "medium"),
        "high": sum(1 for t in all_tasks if t.priority == "high"),
        "urgent": sum(1 for t in all_tasks if t.priority == "urgent"),
    }

    return jsonify({
        "stats": {
            "total_projects": len(all_projects),
            "active_projects": sum(1 for p in all_projects if p.status == "active"),
            "total_tasks": total_tasks,
            "done_tasks": done_tasks,
            "in_progress_tasks": in_progress,
            "overdue_count": len(overdue_tasks),
            "my_tasks_count": len(my_tasks),
            "completion_rate": round((done_tasks / total_tasks * 100) if total_tasks > 0 else 0),
        },
        "overdue_tasks": [t.to_dict() for t in overdue_tasks[:5]],
        "my_tasks": [t.to_dict() for t in my_tasks[:10]],
        "recent_tasks": [t.to_dict() for t in recent_tasks],
        "status_distribution": status_dist,
        "priority_distribution": priority_dist,
        "projects": [p.to_dict(user_id) for p in all_projects[:6]],
    }), 200
