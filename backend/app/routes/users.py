from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import User

users_bp = Blueprint("users", __name__)


@users_bp.route("/", methods=["GET"])
@jwt_required()
def list_users():
    user_id = int(get_jwt_identity())
    current = User.query.get(user_id)

    search = request.args.get("search", "").strip().lower()
    if search:
        users = User.query.filter(
            (User.name.ilike(f"%{search}%")) | (User.email.ilike(f"%{search}%"))
        ).all()
    else:
        users = User.query.order_by(User.name).all()

    return jsonify({"users": [u.to_dict() for u in users]}), 200


@users_bp.route("/<int:uid>", methods=["GET"])
@jwt_required()
def get_user(uid):
    user = User.query.get_or_404(uid)
    return jsonify({"user": user.to_dict()}), 200


@users_bp.route("/<int:uid>/role", methods=["PUT"])
@jwt_required()
def update_user_role(uid):
    current_id = int(get_jwt_identity())
    current = User.query.get(current_id)
    if current.role != "admin":
        return jsonify({"error": "Only admins can change roles"}), 403

    target = User.query.get_or_404(uid)
    data = request.get_json()
    new_role = data.get("role")
    if new_role not in ["admin", "member"]:
        return jsonify({"error": "Invalid role"}), 400

    target.role = new_role
    db.session.commit()
    return jsonify({"user": target.to_dict()}), 200
