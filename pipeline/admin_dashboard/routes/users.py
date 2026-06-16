"""Admin user-management routes (admin-only)."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from auth_utils import require_admin, hash_password, generate_password, public_user_dict
from admin_dashboard.models import (
    list_users, get_user_by_id, get_user_by_email, insert_user,
    update_user, count_users_by_role,
)

router = APIRouter()


class UpdateUserRequest(BaseModel):
    role: Optional[str] = None
    status: Optional[str] = None


class ResetPasswordRequest(BaseModel):
    new_password: Optional[str] = None


class CreateUserRequest(BaseModel):
    email: str
    password: str
    role: str = "user"


@router.get("/users")
async def list_users_endpoint(admin=Depends(require_admin)):
    return {"users": list_users()}


@router.patch("/users/{user_id}")
async def update_user_endpoint(user_id: int, req: UpdateUserRequest, admin=Depends(require_admin)):
    target = get_user_by_id(user_id)
    if not target:
        raise HTTPException(status_code=404, detail="用户不存在")

    wants_demote = (req.role is not None and req.role != "admin") or \
                   (req.status is not None and req.status != "active")

    # Self-protection: cannot demote / disable yourself.
    if user_id == admin["id"] and wants_demote:
        raise HTTPException(status_code=400, detail="不能降级或禁用自己的账号")

    # Last-admin protection: cannot demote / disable the last active admin.
    if target["role"] == "admin" and target["status"] == "active" and wants_demote:
        if count_users_by_role("admin") <= 1:
            raise HTTPException(status_code=400, detail="系统至少需保留一个管理员")

    if req.role is not None and req.role not in ("user", "admin"):
        raise HTTPException(status_code=400, detail="角色只能是 user 或 admin")
    if req.status is not None and req.status not in ("active", "disabled"):
        raise HTTPException(status_code=400, detail="状态只能是 active 或 disabled")

    fields = {}
    if req.role is not None:
        fields["role"] = req.role
    if req.status is not None:
        fields["status"] = req.status
    if fields:
        update_user(user_id, **fields)
    return {"user": public_user_dict(get_user_by_id(user_id))}


@router.post("/users/{user_id}/reset-password")
async def reset_password_endpoint(user_id: int, req: ResetPasswordRequest, admin=Depends(require_admin)):
    if not get_user_by_id(user_id):
        raise HTTPException(status_code=404, detail="用户不存在")
    new_pw = req.new_password.strip() if req.new_password else generate_password()
    if len(new_pw) < 6:
        raise HTTPException(status_code=400, detail="密码至少 6 位")
    update_user(user_id, password_hash=hash_password(new_pw))
    return {"password": new_pw}  # shown once to the admin (air-gapped: no email)


@router.post("/users")
async def create_user_endpoint(req: CreateUserRequest, admin=Depends(require_admin)):
    """Admin-only user creation (used when public registration is disabled)."""
    email = req.email.strip().lower()
    if get_user_by_email(email):
        raise HTTPException(status_code=409, detail="该邮箱已注册")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="密码至少 6 位")
    if req.role not in ("user", "admin"):
        raise HTTPException(status_code=400, detail="角色只能是 user 或 admin")
    new_id = insert_user(email, hash_password(req.password), req.role)
    if not new_id:
        raise HTTPException(status_code=409, detail="该邮箱已注册")
    return {"user": public_user_dict(get_user_by_id(new_id))}
