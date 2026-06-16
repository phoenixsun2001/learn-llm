"""Self-hosted auth routes: register / login / me.

Air-gapped / enterprise use — no email verification, no password reset email.
The first registered user bootstraps as admin.
"""
import re
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from config import config
from auth_utils import (
    hash_password, verify_password, create_access_token,
    get_current_user, public_user_dict,
)
from admin_dashboard.models import (
    get_user_by_email, get_user_by_id, insert_user, update_user, count_users,
)

router = APIRouter()
_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class CredentialRequest(BaseModel):
    email: str
    password: str


@router.post("/auth/register")
async def register(req: CredentialRequest):
    email = req.email.strip().lower()
    password = req.password
    if not _EMAIL_RE.match(email):
        raise HTTPException(status_code=400, detail="邮箱格式不正确")
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="密码至少 6 位")
    # When public registration is disabled and users already exist, only admins
    # may create accounts (via /api/users). The first user always bootstraps here.
    if not config.allow_public_register and count_users() > 0:
        raise HTTPException(status_code=403, detail="注册已关闭，请联系管理员创建账号")
    if get_user_by_email(email):
        raise HTTPException(status_code=409, detail="该邮箱已注册")

    role = "admin" if count_users() == 0 else "user"  # first user bootstraps admin
    new_id = insert_user(email, hash_password(password), role)
    if not new_id:
        raise HTTPException(status_code=409, detail="该邮箱已注册")
    user = get_user_by_id(new_id)
    return {"user": public_user_dict(user), "token": create_access_token(user)}


@router.post("/auth/login")
async def login(req: CredentialRequest):
    email = req.email.strip().lower()
    user = get_user_by_email(email)
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="邮箱或密码错误")
    if user.get("status") != "active":
        raise HTTPException(status_code=403, detail="账号已被禁用，请联系管理员")
    update_user(user["id"], last_login_at=datetime.now(timezone.utc).isoformat())
    return {"user": public_user_dict(user), "token": create_access_token(user)}


@router.get("/auth/me")
async def me(request: Request):
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="未登录")
    return {"user": public_user_dict(user)}
