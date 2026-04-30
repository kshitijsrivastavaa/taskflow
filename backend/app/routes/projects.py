from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import User, Project, project_members
from datetime import datetime

projects_bp = Blueprint("projects", __name__)


def get_project_with_access(project_id, user_id, require_admin=False):
    project = Project.query.get_or_404(project_id)
    user = User.query.get(user_id)

    # Global admins can do anything
    if user and user.role == "admin":
        return project, "admin"

    # Check if user is member
    role = project.get_member_role(user_id)
    if not role and project.owner_id != user_id:
        return None, None

    effective_role = "admin" if project.owner_id == user_id else role

    if require_admin and effective_role != "admin":
        return None, None

    return project, effective_role


@projects_bp.route("/", methods=["GET"])
@jwt_required()
def list_projects():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if user.role == "admin":
        projects = Project.query.order_by(Project.created_at.desc()).all()
    else:
        owned = Project.query.filter_by(owner_id=user_id).all()
        member_of = user.projects
        seen = set()
        projects = []
        for p in owned + member_of:
            if p.id not in seen:
                seen.add(p.id)
                projects.append(p)
        projects.sort(key=lambda p: p.created_at, reverse=True)

    return jsonify({"projects": [p.to_dict(user_id) for p in projects]}), 200


@projects_bp.route("/", methods=["POST"])
@jwt_required()
def create_project():
    user_id = int(get_jwt_identity())
    data = request.get_json()

    name = data.get("name", "").strip()
    if not name:
        return jsonify({"error": "Project name is required"}), 400

    deadline = None
    if data.get("deadline"):
        try:
            deadline = datetime.fromisoformat(data["deadline"])
        except Exception:
            pass

    project = Project(
        name=name,
        description=data.get("description", ""),
        color=data.get("color", "#6366f1"),
        owner_id=user_id,
        deadline=deadline,
    )
    db.session.add(project)
    db.session.flush()

    # Add owner as admin member
    db.session.execute(
        project_members.insert().values(user_id=user_id, project_id=project.id, role="admin")
    )
    db.session.commit()

    return jsonify({"project": project.to_dict(user_id)}), 201


@projects_bp.route("/<int:project_id>", methods=["GET"])
@jwt_required()
def get_project(project_id):
    user_id = int(get_jwt_identity())
    project, role = get_project_with_access(project_id, user_id)
    if project is None:
        return jsonify({"error": "Access denied"}), 403
    return jsonify({"project": project.to_dict(user_id)}), 200


@projects_bp.route("/<int:project_id>", methods=["PUT"])
@jwt_required()
def update_project(project_id):
    user_id = int(get_jwt_identity())
    project, role = get_project_with_access(project_id, user_id, require_admin=True)
    if project is None:
        return jsonify({"error": "Access denied or not found"}), 403

    data = request.get_json()
    if "name" in data:
        project.name = data["name"].strip()
    if "description" in data:
        project.description = data["description"]
    if "status" in data and data["status"] in ["active", "completed", "on_hold"]:
        project.status = data["status"]
    if "color" in data:
        project.color = data["color"]
    if "deadline" in data:
        try:
            project.deadline = datetime.fromisoformat(data["deadline"]) if data["deadline"] else None
        except Exception:
            pass

    db.session.commit()
    return jsonify({"project": project.to_dict(user_id)}), 200


@projects_bp.route("/<int:project_id>", methods=["DELETE"])
@jwt_required()
def delete_project(project_id):
    user_id = int(get_jwt_identity())
    project, role = get_project_with_access(project_id, user_id, require_admin=True)
    if project is None:
        return jsonify({"error": "Access denied"}), 403
    if project.owner_id != user_id:
        user = User.query.get(user_id)
        if user.role != "admin":
            return jsonify({"error": "Only owner can delete project"}), 403

    db.session.delete(project)
    db.session.commit()
    return jsonify({"message": "Project deleted"}), 200


@projects_bp.route("/<int:project_id>/members", methods=["POST"])
@jwt_required()
def add_member(project_id):
    user_id = int(get_jwt_identity())
    project, role = get_project_with_access(project_id, user_id, require_admin=True)
    if project is None:
        return jsonify({"error": "Access denied"}), 403

    data = request.get_json()
    email = data.get("email", "").strip().lower()
    member_role = data.get("role", "member")

    if not email:
        return jsonify({"error": "Email is required"}), 400

    new_member = User.query.filter_by(email=email).first()
    if not new_member:
        return jsonify({"error": "User not found"}), 404

    if new_member in project.members:
        return jsonify({"error": "User is already a member"}), 409

    db.session.execute(
        project_members.insert().values(
            user_id=new_member.id, project_id=project.id, role=member_role
        )
    )
    db.session.commit()
    return jsonify({"message": "Member added", "user": new_member.to_dict()}), 200


@projects_bp.route("/<int:project_id>/members/<int:member_id>", methods=["DELETE"])
@jwt_required()
def remove_member(project_id, member_id):
    user_id = int(get_jwt_identity())
    project, role = get_project_with_access(project_id, user_id, require_admin=True)
    if project is None:
        return jsonify({"error": "Access denied"}), 403
    if member_id == project.owner_id:
        return jsonify({"error": "Cannot remove project owner"}), 400

    db.session.execute(
        project_members.delete().where(
            (project_members.c.project_id == project_id) &
            (project_members.c.user_id == member_id)
        )
    )
    db.session.commit()
    return jsonify({"message": "Member removed"}), 200


@projects_bp.route("/<int:project_id>/members/<int:member_id>/role", methods=["PUT"])
@jwt_required()
def update_member_role(project_id, member_id):
    user_id = int(get_jwt_identity())
    project, role = get_project_with_access(project_id, user_id, require_admin=True)
    if project is None:
        return jsonify({"error": "Access denied"}), 403

    data = request.get_json()
    new_role = data.get("role")
    if new_role not in ["admin", "member"]:
        return jsonify({"error": "Role must be admin or member"}), 400

    db.session.execute(
        project_members.update()
        .where(
            (project_members.c.project_id == project_id) &
            (project_members.c.user_id == member_id)
        )
        .values(role=new_role)
    )
    db.session.commit()
    return jsonify({"message": "Role updated"}), 200
