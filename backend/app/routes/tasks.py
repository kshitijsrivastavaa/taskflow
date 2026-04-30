from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import User, Project, Task
from datetime import datetime, timezone

tasks_bp = Blueprint("tasks", __name__)


def can_access_project(project_id, user_id):
    project = Project.query.get(project_id)
    if not project:
        return None, None
    user = User.query.get(user_id)
    if user and user.role == "admin":
        return project, "admin"
    if project.owner_id == user_id:
        return project, "admin"
    role = project.get_member_role(user_id)
    if not role:
        return None, None
    return project, role


@tasks_bp.route("/", methods=["GET"])
@jwt_required()
def list_tasks():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    project_id = request.args.get("project_id", type=int)
    status = request.args.get("status")
    priority = request.args.get("priority")
    assignee_id = request.args.get("assignee_id", type=int)
    overdue = request.args.get("overdue")
    my_tasks = request.args.get("my_tasks")

    query = Task.query

    if project_id:
        project, role = can_access_project(project_id, user_id)
        if not project:
            return jsonify({"error": "Access denied"}), 403
        query = query.filter_by(project_id=project_id)
    elif user.role != "admin":
        # Only tasks from projects user is member of
        user_project_ids = [p.id for p in user.projects] + [p.id for p in user.owned_projects]
        query = query.filter(Task.project_id.in_(user_project_ids))

    if status:
        query = query.filter_by(status=status)
    if priority:
        query = query.filter_by(priority=priority)
    if assignee_id:
        query = query.filter_by(assignee_id=assignee_id)
    if my_tasks == "true":
        query = query.filter_by(assignee_id=user_id)
    if overdue == "true":
        now = datetime.now(timezone.utc)
        query = query.filter(Task.due_date < now, Task.status != "done")

    tasks = query.order_by(Task.created_at.desc()).all()
    return jsonify({"tasks": [t.to_dict() for t in tasks]}), 200


@tasks_bp.route("/", methods=["POST"])
@jwt_required()
def create_task():
    user_id = int(get_jwt_identity())
    data = request.get_json()

    project_id = data.get("project_id")
    title = data.get("title", "").strip()

    if not project_id or not title:
        return jsonify({"error": "project_id and title are required"}), 400

    project, role = can_access_project(project_id, user_id)
    if not project:
        return jsonify({"error": "Access denied"}), 403

    due_date = None
    if data.get("due_date"):
        try:
            due_date = datetime.fromisoformat(data["due_date"])
        except Exception:
            pass

    assignee_id = data.get("assignee_id")
    if assignee_id:
        member_ids = [m.id for m in project.members]
        if assignee_id not in member_ids and assignee_id != project.owner_id:
            return jsonify({"error": "Assignee is not a project member"}), 400

    tags = ",".join(data.get("tags", [])) if isinstance(data.get("tags"), list) else data.get("tags", "")

    task = Task(
        title=title,
        description=data.get("description", ""),
        status=data.get("status", "todo"),
        priority=data.get("priority", "medium"),
        project_id=project_id,
        assignee_id=assignee_id,
        creator_id=user_id,
        due_date=due_date,
        tags=tags,
    )
    db.session.add(task)
    db.session.commit()
    return jsonify({"task": task.to_dict()}), 201


@tasks_bp.route("/<int:task_id>", methods=["GET"])
@jwt_required()
def get_task(task_id):
    user_id = int(get_jwt_identity())
    task = Task.query.get_or_404(task_id)
    project, role = can_access_project(task.project_id, user_id)
    if not project:
        return jsonify({"error": "Access denied"}), 403
    return jsonify({"task": task.to_dict()}), 200


@tasks_bp.route("/<int:task_id>", methods=["PUT"])
@jwt_required()
def update_task(task_id):
    user_id = int(get_jwt_identity())
    task = Task.query.get_or_404(task_id)
    project, role = can_access_project(task.project_id, user_id)
    if not project:
        return jsonify({"error": "Access denied"}), 403

    data = request.get_json()
    user = User.query.get(user_id)

    # Members can only update status if they are assignee
    is_admin = role == "admin" or user.role == "admin"
    is_assignee = task.assignee_id == user_id

    if not is_admin and not is_assignee:
        # Only allow status update
        if set(data.keys()) - {"status"}:
            return jsonify({"error": "Members can only update task status"}), 403

    if "title" in data:
        task.title = data["title"].strip()
    if "description" in data:
        task.description = data["description"]
    if "status" in data and data["status"] in ["todo", "in_progress", "review", "done"]:
        task.status = data["status"]
    if "priority" in data and is_admin:
        task.priority = data["priority"]
    if "assignee_id" in data and is_admin:
        task.assignee_id = data["assignee_id"]
    if "due_date" in data and is_admin:
        try:
            task.due_date = datetime.fromisoformat(data["due_date"]) if data["due_date"] else None
        except Exception:
            pass
    if "tags" in data and is_admin:
        task.tags = ",".join(data["tags"]) if isinstance(data["tags"], list) else data["tags"]

    task.updated_at = datetime.now(timezone.utc)
    db.session.commit()
    return jsonify({"task": task.to_dict()}), 200


@tasks_bp.route("/<int:task_id>", methods=["DELETE"])
@jwt_required()
def delete_task(task_id):
    user_id = int(get_jwt_identity())
    task = Task.query.get_or_404(task_id)
    project, role = can_access_project(task.project_id, user_id)
    if not project:
        return jsonify({"error": "Access denied"}), 403

    user = User.query.get(user_id)
    is_admin = role == "admin" or user.role == "admin"
    if not is_admin and task.creator_id != user_id:
        return jsonify({"error": "Only task creator or admin can delete"}), 403

    db.session.delete(task)
    db.session.commit()
    return jsonify({"message": "Task deleted"}), 200
